# Ocean Haven: moving the booking data from Supabase to SQL Server

This report describes the move of Ocean Haven's booking data from Supabase (PostgreSQL) to
SQL Server 2025, and explains the design decisions behind it. It covers the four required areas:
stored procedures, triggers, indexes, and AI semantic search.

The full technical reference, with every procedure, index and measurement, is in
[`database/sqlserver/README.md`](database/sqlserver/README.md). This report gives the summary and the
reasons behind the design.

---

## 1. What changed

### Hybrid architecture

| Concern | Before | After |
| :--- | :--- | :--- |
| Login, sessions, user profile & role | Supabase | **Supabase** (unchanged) |
| Rooms, bookings, payments, booking history | Supabase tables, queried from TypeScript | **SQL Server 2025**, only through stored procedures |
| AI room search | none | **SQL Server `VECTOR(1024)`** + local Ollama embedding model |

**Why hybrid.** Supabase Auth already handles cookies, sessions and password hashing safely.
Re-implementing that in SQL Server would add risk and teach nothing about databases. The booking
data is where the business rules live, so that is what moved. `bookings.user_id` holds the Supabase
user id. It cannot be a foreign key because the users table is in another database. This is the one
cost of the hybrid design, and it is listed under limitations.

**Why only stored procedures.** The Next.js app never writes SQL against the tables. Every call
goes through `execProc()` (`src/shared/lib/db/sqlserver.ts`), which only executes a named procedure
with typed parameters. This has three effects:

- The business rules live in one place, inside the database.
- Parameters can never be concatenated into SQL, so there is no SQL injection.
- The app's data layer is very small: each query or action function is one `execProc` call plus mapping.

### Supabase: admin role hardening

`public.users.role` decides who can open `/admin` and change bookings, so it must never be settable
by a user. A review found two ways to become admin:

| Hole | How | Fix |
| :--- | :--- | :--- |
| Signup chose the role | `handle_new_user()` copied `role` from `raw_user_meta_data`, which is whatever the client sends to `signUp()` | The trigger always inserts `'user'`. Signup sends only `name` and `phone`. Admins are promoted by hand in the SQL Editor |
| Self-promotion | The RLS policy *"Users update own profile"* allows updating **every** column of one's own row, so `PATCH /rest/v1/users?id=eq.<me> {"role":"admin"}` with a normal user's token worked (**confirmed on the live project**, then reverted; fixed and re-verified on 2026-11-11, see section 7) | Logged-in users get `UPDATE` only on `name`, `phone`, `avatar` (column privileges). A `BEFORE UPDATE` trigger, `users_prevent_role_change`, also rejects any role change requested as `anon`/`authenticated` |

**Design decisions and why:**

- **RLS and privileges answer different questions.** RLS picks *which rows* a user may touch; column
  privileges pick *which columns*. The policy was right about rows and silent about columns, so both
  layers are needed.
- **The guard trigger works no matter who granted what.** Postgres `REVOKE` only removes grants made
  by the role running it. The trigger blocks the change regardless of the grants. It is deliberately
  **not** `SECURITY DEFINER`, so `current_user` is the caller's role; the SQL Editor and the service
  role can still change roles.
- **The `INSERT` policy `WITH CHECK (true)` was removed.** Its name ("Service role insert users")
  suggested it applied only to the service role, but it applied to everyone. Profile rows are created
  only by the signup trigger, which runs as the table owner and isn't subject to RLS.
- **`SET search_path = public` on the `SECURITY DEFINER` signup function**, so it can't be tricked
  into calling objects from another schema.

### Files

| Area | Files |
| :--- | :--- |
| Database (new) | `database/sqlserver/01_schema.sql` … `07_seed.sql`, `tests/test_business_logic.sql`, `tests/index_demo.sql`, `README.md` |
| Tooling (new) | `scripts/db.mjs` (runs `.sql` files split on `GO`, like SSMS/sqlcmd), `docker-compose.yml` service `sqlserver`, npm scripts `db:start`, `db:setup`, `db:test`, `db:run` |
| DB client (new) | `src/shared/lib/db/sqlserver.ts` (connection pool + `execProc`), `src/shared/lib/db/errors.ts` (business-error mapping) |
| AI search (new) | `src/modules/rooms/lib/embeddings.ts`, `src/modules/rooms/queries/semantic-search.ts` |
| App code moved to SQL Server | rooms, bookings and admin queries/actions |
| Payments (section 6) | Pay at the hotel only: the VNPay integration (routes, `src/lib/vnpay.ts`, the `vnpay` package, payment result pages) was removed |
| UI | `/rooms` AI search box and "% match" badge (`rooms-catalog.tsx`, `room-card.tsx`, `app/rooms/page.tsx`) |
| Supabase | `supabase/schema.sql` reduced to `users` + auth trigger, with role hardening (section 1, *Supabase: admin role hardening*); `supabase/fix_user_role.sql` applies that hardening to an existing project; `supabase/seed.sql` removed (seed now in `07_seed.sql`) |
| Bug fix | `src/modules/admin/components/booking-action.tsx`: the admin status menu crashed the page (section 7) |
| Auth | `src/modules/auth/actions/auth.ts`: signup no longer sends a `role` |
| Config | `next.config.ts`: `mssql` added to `serverExternalPackages` (not on Next's auto-external list); `.github/workflows/ci.yml`: VNPay secrets removed |

---

## 2. Stored procedures with transactions

### What was built

| Procedure | Called by | Work done in one transaction |
| :--- | :--- | :--- |
| `sp_CreateBooking` | Booking form | Validate input → **lock the room row** → check availability → compute price from the DB → insert booking **and** its payment row |
| `sp_UpdateBookingStatus` | Admin dashboard | Enforce allowed transitions → update booking → keep the payment consistent (`Cancelled` on cancel, cash collected on complete) |
| `sp_CancelMyBooking` | Guest's profile page (*Cancel booking*) | **Lock the booking** → check it belongs to the caller, is still `Pending`/`Confirmed` and check-in hasn't started → cancel the booking **and** its pending payment |
| `sp_GetRooms`, `sp_GetUserBookings`, `sp_GetAdminBookings`, `sp_GetAdminStats` | Pages | Read models |
| `sp_GetRoomsMissingEmbedding`, `sp_UpsertRoomEmbedding`, `sp_SemanticSearchRooms` | AI search | See section 5 |

Every write procedure uses the same pattern:

```sql
SET XACT_ABORT ON;                 -- any runtime error dooms the whole transaction
BEGIN TRY
    BEGIN TRANSACTION;
    ...                            -- several statements that must succeed or fail together
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;                         -- re-raise so the app sees the real error
END CATCH;
```

### Design decisions and why

- **`XACT_ABORT ON` + TRY/CATCH.** If any statement fails, without `XACT_ABORT` SQL Server can
  continue the transaction after some errors and commit half the work. With it, any runtime error
  rolls back everything, so a booking without a payment row can never exist.
- **Locking against double booking (`UPDLOCK, ROWLOCK` on the room row).** If two guests click
  "Book" for the same room at the same moment, both could pass an "is it free?" check before either
  inserts. `UPDLOCK` makes the second transaction wait at the room row until the first commits, so it
  then sees the first booking and is rejected. `ROWLOCK` keeps the lock on that one room, so
  bookings of other rooms run in parallel.
- **The price is computed in the database** (`room price × nights`), never taken from the browser,
  so a modified request cannot change what the guest pays.
- **Status transitions are enforced in one place.** `Pending → Confirmed | Completed | Cancelled`,
  `Confirmed → Completed | Cancelled`, and `Completed`/`Cancelled` are final. The payment is updated
  in the same transaction (completing a stay marks the cash as collected with `paid_at`, cancelling
  cancels the pending payment), so the booking status and payment status cannot disagree. The status
  row is locked with `UPDLOCK` so two admins clicking at once cannot both pass the transition check.
- **A guest can only cancel their own booking, and only before check-in.** The user id comes from
  the login session on the server, never from the browser. Someone else's booking is reported as
  *"Booking not found"* (`50030`), the same as a booking that doesn't exist, so trying ids reveals
  nothing. Bookings that are already decided (`50031`), or whose check-in date has arrived
  (`50032`), can only be changed by the hotel. The booking and its cash payment are cancelled in the
  same transaction, so a cancelled booking never keeps a payment that still looks due, and the audit
  trigger records the cancellation like any other status change.
- **Business errors use `THROW 500xx`** with a message meant for the user (e.g. 50010 "Room is
  not available for selected dates."). `businessErrorMessage()` shows those messages in the UI. Any
  other error is logged and shown as a generic message, so database internals never reach users.
- **Read procedures return what the page needs in one round trip.** `sp_GetRooms` returns rooms with
  their images and amenities as one nested `FOR JSON` document, instead of one query per room.
  `sp_GetAdminStats` computes all counters in one pass with conditional aggregation (`SUM(CASE …)`).
- **`fn_BlockingBookings` is the single definition of "this booking occupies the room".** It is used
  by `sp_CreateBooking`, `sp_GetRooms`, `sp_SemanticSearchRooms` and the overlap trigger. The rule
  (Pending or Confirmed, overlapping dates, check-out day free) is written once, so it can't drift
  between the places that use it.

---

## 3. Triggers

| Trigger | Fires on | What it does |
| :--- | :--- | :--- |
| `trg_bookings_audit` | `AFTER INSERT, UPDATE, DELETE` on `bookings` | Writes `CREATED`, `STATUS_CHANGE` (old → new), or `DELETED` rows to `history_booking` |
| `trg_bookings_prevent_overlap` | `AFTER INSERT, UPDATE` on `bookings` | `THROW 50010` and roll back any write that would double-book a room |
| `trg_rooms_invalidate_embedding` | `AFTER UPDATE` on `rooms` | When the text used for AI search changes, deletes the room's now-stale vector and stamps `updated_at` |
| `trg_room_amenities_invalidate_embedding` | `AFTER INSERT, DELETE` on `room_amenities` | Amenities are part of the embedded text, so adding or removing one also invalidates the vector |

Together they cover all three events the assignment asks for: insert, update and delete.

### Design decisions and why

- **Triggers do things that must happen however the data is changed.** Business logic lives in the
  procedures. Triggers are kept for rules that must hold even when someone bypasses the procedures,
  for example with a manual `UPDATE` in SSMS. That is why the audit log and the overlap guard are
  triggers. The tests prove both:
  - a direct `INSERT` that double-books is rejected;
  - a direct `UPDATE` that revives a cancelled booking over someone else's dates is rolled back.
- **Set-based, not row-by-row.** SQL Server triggers fire **once per statement**. The `inserted` and
  `deleted` virtual tables hold every affected row. Each trigger is written as a set operation
  (`INSERT … SELECT FROM inserted JOIN deleted`), so a statement touching 100 bookings writes 100
  audit rows. A version that reads "the" row into variables would silently handle only one.
- **The overlap guard is a second layer of defence.** `sp_CreateBooking` already checks availability
  under a lock. The trigger catches the paths that don't go through it, such as a manual `INSERT`
  in SSMS or a script that revives a cancelled booking whose dates were taken meanwhile.
- **The audit trigger only logs real status changes** (`WHERE i.status <> d.status`), so updating a
  booking's `updated_at` doesn't flood the history table.
- **`history_booking` deliberately has no foreign key to `bookings`.** An audit record must survive
  the deletion of the booking it describes, and a FK would either block the delete or cascade the
  audit away.
- **The embedding triggers keep AI search correct without any extra app code.** The app re-embeds
  every room without a vector before each search (section 5). So "delete the stale vector" is enough
  to guarantee search never ranks a room by an outdated description. Only the columns that feed the
  embedded text trigger this (`IF UPDATE(name) OR UPDATE(description) …`). A price change does not
  cause re-embedding.

---

## 4. Indexes

Every primary key is the **clustered index**, which is the table itself stored as a B-tree sorted by
that key. `bookings.id` is a `BIGINT IDENTITY`: narrow and always increasing, so new rows are
appended at the end of the tree and never cause page splits. The nonclustered indexes are smaller,
separate B-trees, each designed for one real query in the app:

| Index | Query it serves | Technique, and why it helps |
| :--- | :--- | :--- |
| `IX_bookings_active_room_dates` (room_id, check_in) INCLUDE (check_out) WHERE status IN ('Pending','Confirmed') | Availability check: the busiest query (booking, room list, AI search, trigger) | **Composite**: seek to one room, then a range on date. **INCLUDE**: the remaining predicate is answered from the index, with no lookup into the table. **Filtered**: cancelled and completed bookings (most of the table over time) are not in the index |
| `UX_bookings_booking_code` | Lookup by the booking code a guest quotes | **Unique** index on a **persisted computed column** (`'OH' + id`): enforces uniqueness and gives a one-row seek |
| `IX_bookings_user_created` (user_id, created_at DESC) | "My bookings", newest first | Equality column first, sort column second: rows come out already sorted, so there is **no SORT step** |
| `IX_bookings_guest_phone` | Admin search `LIKE '0912%'` | A prefix `LIKE` is **SARGable**: it becomes a range seek. `'%0912%'` could not seek |
| `IX_payments_status` (status) INCLUDE (amount) | Revenue `SUM(amount)` | **Covering**: the sum is computed from this narrow index alone |
| `IX_room_images_room`, `IX_room_amenities_amenity`, `IX_history_booking_booking` | Joins from parent rows, cascading deletes | SQL Server does **not** index foreign keys automatically |

### Measured effect

`database/sqlserver/tests/index_demo.sql` generates 50,600 bookings inside a transaction that is rolled
back, then runs each query twice with `SET STATISTICS IO ON`: once with the index, once forced to scan
the table. "Logical reads" is the number of 8 KB pages read. These figures were re-measured on
2026-11-10:

| Query | With index | Without | Reduction |
| :--- | ---: | ---: | ---: |
| Availability check for one room | **3** pages | 1,132 | ~377× |
| My bookings, newest first | **3** | 1,132 (+ sort) | ~377× |
| Admin phone search, prefix `'0912%'` | **5** | 178 (`'%0912%'`, full index scan) | ~36× |
| Lookup by booking code | **2** | 1,132 | ~566× |
| Revenue `SUM(amount)` | **206** | 367 | ~1.8× |

The revenue index gives the smallest gain on purpose: every completed payment still has to be summed.
The covering index only makes each row narrower. With the real data (22 rooms, a few bookings) the
optimizer may still choose a scan, because reading one page is cheaper than navigating an index.
Indexes pay off as the table grows, which is why the demo generates 50,600 rows.

### Related query-design decisions

- **`OPTION (RECOMPILE)`** on the procedures with optional filters (`@x IS NULL OR col = @x`).
  Without it, SQL Server caches one plan for every combination of filters, usually a scan.
  Recompiling builds the right plan, such as an index seek, for the filters actually given.
- **The overlap rule is an inline table-valued function**, not a multi-statement one. The optimizer
  expands it into the calling query like a view, so it can seek on `IX_bookings_active_room_dates`.
  A multi-statement function runs as a black box with a fixed row estimate.
- **The filtered index's `WHERE` matches `fn_BlockingBookings` exactly**
  (`status IN ('Pending','Confirmed')`). This is what allows the optimizer to use a filtered index.

---

## 5. AI integration: semantic room search

Guests describe the room they want in their own words, in English or Vietnamese, in the search box
on `/rooms`. Rooms are ranked by **meaning**, not keywords, and each card shows a "% match" badge.

### How it works

1. **Room text.** `sp_GetRoomsMissingEmbedding` builds one descriptive sentence per room: name,
   type, view, floor, capacity, beds, size, amenities, description.
2. **Embedding.** The app sends those texts to **Ollama** running `bge-m3` locally, which returns
   one vector of 1024 numbers per text. `sp_UpsertRoomEmbedding` stores each in
   `room_embeddings.embedding VECTOR(1024)`. This only happens for rooms without a vector, so once all
   rooms are embedded the step costs one cheap query.
3. **Search.** The guest's query is embedded with the same model. `sp_SemanticSearchRooms` ranks rooms
   by `VECTOR_DISTANCE('cosine', room_vector, query_vector)`, with `similarity = 1 − distance`. In the
   same SQL statement it keeps only active rooms that are available for the chosen dates (via
   `fn_BlockingBookings`).

### Design decisions and why

- **Semantic search rather than prediction or classification.** It is directly useful to guests,
  shows up visibly in the UI, and needs no training data, which a new hotel system doesn't have.
- **`bge-m3` via Ollama.** It is free, runs offline (no API key, no data leaves the machine), and is
  **multilingual**. A Vietnamese query matches English room descriptions without any translation step.
- **SQL Server 2025's native `VECTOR` type instead of a separate vector database.** The vector
  ranking and the relational filters (active, not booked for those dates) run in **one query**. A
  separate vector store would return "nearest rooms" that then have to be filtered for availability
  in the app, and would be one more service to run. `CAST(@x AS VECTOR(1024))` also validates that
  every vector has exactly 1024 numbers.
- **A relevance cutoff (`@MinSimilarity = 0.45`)**, chosen from measurements on the real data, so
  nonsense returns nothing instead of "the least bad rooms":

  | Query | Result (re-checked 2026-11-10 against the running app) |
  | :--- | :--- |
  | "romantic room for a couple with a bathtub" | Sunset Deluxe first |
  | "phòng gia đình nhìn ra biển có bếp" (family room, sea view, kitchen) | Sunrise Suite, Seaside Family Suite, Ocean Haven Suite first |
  | "pizza delivery" | no results (every room is below the 0.45 cutoff) |

- **Keeping vectors fresh with triggers** (section 3) rather than re-embedding on every search or
  on a timer. Only changed rooms are re-embedded, and only when someone searches.
- **No vector index.** Exact search over 22 vectors takes under a millisecond and always returns the
  true nearest rooms. SQL Server 2025's approximate DiskANN index (`CREATE VECTOR INDEX` +
  `VECTOR_SEARCH`) trades accuracy for speed and is meant for tens of thousands of vectors and more.
  Using it here would add complexity for no benefit. This is the same reasoning as in section 4: an
  index has to earn its cost.
- **Graceful fallback.** If Ollama is not running, `/rooms` shows a notice and falls back to the
  normal keyword filter instead of failing.
- **Kept simple on purpose.** The whole feature is two small TypeScript functions (`embedTexts`,
  `searchRoomsSemantic`) and three procedures. There is no chunking, no re-ranking and no LLM
  generation, because one short text per room doesn't need them.

---

## 6. Payment: pay at the hotel only

The original app took online payments through VNPay. That integration was removed, and the hotel
now accepts **payment at the hotel only (cash on delivery)**.

### Why

- **VNPay's sandbox could not be used.** It refused every request before showing the card page, and
  the refusal came from VNPay's side, not from our code:

  | Request (sent to `sandbox.vnpayment.vn`) | VNPay answer |
  | :--- | :--- |
  | First merchant code, signed as VNPay v2.0.0 (SHA-256, VNPay's PHP demo) | `code=71` "Website này chưa được phê duyệt" (website not approved) |
  | First merchant code, signed as v2.1.0 (HMAC-SHA512, byte-identical to the `vnpay` library) | `code=71` |
  | First merchant code, signed with a deliberately **wrong** secret | `code=71`, so VNPay rejects the merchant before it even checks the signature |
  | A newly registered merchant code | `code=72` "The terminal (website) not found" |

- **PayOS was considered and dropped.** It works, but it has no sandbox, so every test is a real bank
  transfer.
- **Online payment isn't part of the assignment.** The four required areas are all in the database.
  Taking the gateway out keeps the exercise simple and fully testable.

### How payment works now

```
Guest books ──▶ sp_CreateBooking: booking Pending + payment (cod, Pending), one transaction
Admin confirms ──▶ sp_UpdateBookingStatus: Pending → Confirmed (payment still Pending)
Guest pays at the hotel; admin completes ──▶ Confirmed → Completed, payment Completed + paid_at
Admin cancels, or the guest cancels before check-in (sp_CancelMyBooking) ──▶ booking Cancelled, payment Cancelled, room free again
```

**What this simplified:**

- **Removed from the database:** `hold_expires_at`, `transaction_id`, `sp_ProcessVNPayPayment` and
  `sp_ExpirePendingBookings`, plus the two indexes that only served them.
- **Simpler availability rule:** `fn_BlockingBookings` now only checks status and overlapping dates.
- **Removed from the app:** the payment routes and the payment result pages. After booking, the
  guest goes straight to their bookings on the profile page.
- **Kept:** the `payments` table, because it records the amount, the status and when the cash was
  collected. Revenue on the admin dashboard counts only collected (`Completed`) payments.
- **Kept as a constraint:** `payment_method` stays, with `CHECK (payment_method = 'cod')`, so the
  rule is enforced by the database. Supporting online payment again later would mean widening one
  constraint.

## 7. Verification

| Check | Result |
| :--- | :--- |
| `npm run db:setup` (schema, indexes, functions, triggers, procedures, seed) | ✅ all 7 scripts run |
| `npm run db:test`: T-SQL assertions on every procedure and trigger, including failure and rollback paths | ✅ 27 / 27 pass |
| `npm test`: Jest unit + integration tests, including login → book → admin confirm → complete, and guest cancellation | ✅ 82 / 82 pass |
| `tsc --noEmit`, `npm run lint`, `npm run build` | ✅ clean |
| `tests/index_demo.sql`: index measurement | ✅ figures in section 4 |
| Live AI search against the running app | ✅ results in section 5 |
| Real-browser flow (headless Chrome, test accounts in `tests/testAccount.md`) | ✅ see below |
| Admin-role escalation checks on the live Supabase project | ✅ see *Admin role check* below |

Database tests that check transactions and triggers include:

- an overlapping booking is rejected, and the booking and payment counts are unchanged afterwards (full rollback);
- every booking gets its pay-at-hotel payment row in the same transaction;
- disallowed status changes (`Confirmed → Pending`, `Cancelled → Confirmed`) are rejected (`50022`);
- cancelling cancels the pending payment, and completing a stay records the cash as collected;
- a guest can cancel their own booking (booking and payment together, audited), but not someone else's (`50030`), not twice (`50031`), and not from the check-in date on (`50032`); a refused cancellation changes nothing;
- a direct `INSERT` or `UPDATE` that would double-book is rolled back by the trigger;
- the audit row survives a deleted booking;
- editing a room's description or amenities deletes its stale vector.

### Browser test (2026-11-10)

Run against the production build (`npm run build && npm start`), logged in as the test user and the
test admin:

| Step | Result |
| :--- | :--- |
| User opens the booking form for *Ground Sea Deluxe* | Payment method shows *"Pay at the hotel on check-in"* |
| User books 20–22 Dec 2026 | Booking `OH050609` created for 5,750,000 VND (2 nights × room price from the DB); redirected to `/profile`, which shows `PENDING`, payment `Pending` |
| Same room, overlapping dates (21–23 Dec) | Form shows *"Room is not available for selected dates."* (`THROW 50010`); no row inserted |
| Admin marks the booking *Confirmed*, then *Completed* | `CONFIRMED`, then `COMPLETED`; the guest's profile shows payment `Completed` |
| Database after the stay | Payment `cod` / `Completed` with `paid_at` set; `sp_GetAdminStats` revenue 5,750,000 |
| Normal user opens `/admin` | Redirected to `/` |
| `history_booking` for `OH050609` (written by `trg_bookings_audit`) | `CREATED` → `Pending→Confirmed` → `Confirmed→Completed` |

The browser test found one bug that predates the migration. Opening the admin status menu crashed
the page (Base UI error #31: a menu label used outside a menu group). It is fixed in
`src/modules/admin/components/booking-action.tsx` by wrapping the items in `DropdownMenuGroup`.

### Admin role check on the live Supabase project (2026-11-11)

Run against project `hbdwtm…` after applying `supabase/fix_user_role.sql` over a direct database
connection (earlier runs from the SQL Editor had not reached this database). Test changes to roles
were rolled back or reverted.

| Check | Result |
| :--- | :--- |
| Signing up with `role: "admin"` in the signup metadata | Account created as `user` |
| Test user sets their own `role` to `admin` (`PATCH /rest/v1/users`) | **403** `42501` permission denied |
| Test user edits their own `created_at` | 403 (column locked) |
| Test user edits their own `name` | Allowed |
| Column privilege deliberately granted back inside a rolled-back transaction | `users_prevent_role_change` still blocks the change |
| Owner promotes an admin in the SQL Editor | Works (test rolled back) |
| Existing accounts | `hello@oceanhavenhotel.com` is still `admin`, the test user is still `user` |

## 8. Known limitations

- `bookings.user_id` cannot have a foreign key to Supabase's `users` table, because it is in another database.
- There is no online payment. A booking holds its room from the moment it is made until an admin
  cancels it, and unpaid bookings never expire automatically.
- The admin phone search matches from the start of the number (prefix only), so that it can use the index.
- Admins are promoted by hand (`UPDATE public.users SET role = 'admin' …` in the SQL Editor). There is no admin-management screen.

## 9. How to run

```bash
npm run db:start                  # SQL Server 2025 in Docker (Apple Silicon: Rosetta in Docker/Colima)
npm run db:setup                  # create database, tables, indexes, triggers, procedures, seed
npm run db:test                   # 27 database tests
ollama pull bge-m3                # embedding model for AI search
npm run dev                       # http://localhost:3000/rooms, type a description and press ✨
npm run db:run -- tests/index_demo.sql   # optional: index measurement
```

Required `.env.local` keys besides Supabase: `MSSQL_HOST`, `MSSQL_PORT`, `MSSQL_USER`,
`MSSQL_PASSWORD`, `MSSQL_DATABASE`, `OLLAMA_URL`, `EMBEDDING_MODEL`.
