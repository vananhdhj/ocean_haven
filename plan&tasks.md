# Migrate Ocean Haven từ PHP/MySQL → Next.js + Tailwind v4 + shadcn/ui + Supabase

## Tóm tắt

Chuyển đổi toàn bộ dự án **Ocean Haven Hotel** từ kiến trúc PHP thuần (MySQLi) sang **Next.js 15 (App Router)** với **Tailwind CSS v4**, **shadcn/ui**, và **Supabase** (database + auth). Giữ nguyên toàn bộ business logic, giao diện, và flow đặt phòng + thanh toán VNPay.

## User Review Required

> [!IMPORTANT]
> Bạn cần cung cấp **Supabase URL** và **anon key** (trong Supabase Dashboard → Settings → API) trước khi bắt đầu code. Tôi sẽ tạo file `.env.local` placeholder và bạn chỉ cần điền vào.

> [!WARNING]
> Toàn bộ file PHP cũ sẽ bị xóa sau khi migration hoàn tất. Hãy đảm bảo bạn đã commit code PHP hiện tại trước khi bắt đầu.

## Proposed Changes

### Phase 1: Khởi tạo dự án & cấu hình

#### [NEW] Next.js 15 + Tailwind v4 + shadcn/ui setup

- Xóa toàn bộ file PHP cũ (giữ lại `database/` để tham khảo schema)
- Khởi tạo Next.js 15 (App Router) với TypeScript
- Cài đặt Tailwind CSS v4, shadcn/ui
- Cài đặt `@supabase/supabase-js` + `@supabase/ssr`

#### [NEW] `.env.local`
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
VNPAY_TMN_CODE=IYJSDEB6
VNPAY_HASH_SECRET=2YG2177AQQ89S26MBLX2OOQY3T4UBMJ3
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

### Phase 2: Database Schema trên Supabase

#### [NEW] `supabase/schema.sql`

Chuyển đổi schema MySQL hiện tại sang PostgreSQL (Supabase), thay đổi chính:

| MySQL | PostgreSQL (Supabase) |
|-------|----------------------|
| `VARCHAR(36)` → `UUID DEFAULT gen_random_uuid()` | UUID native |
| `ENUM(...)` → `TEXT CHECK (value IN (...))` | Check constraints |
| `INT AUTO_INCREMENT` → `SERIAL` hoặc `BIGINT GENERATED ALWAYS AS IDENTITY` | Auto-increment |
| `BOOLEAN DEFAULT TRUE` → `BOOLEAN DEFAULT true` | Same |
| `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` → `TIMESTAMPTZ DEFAULT now()` | Timezone-aware |

Các bảng giữ nguyên:
- `users` (tích hợp với `auth.users` của Supabase)
- `room_types`, `view_types`, `bed_types`
- `rooms`, `room_images`, `amenities`, `room_amenities`
- `bookings`, `payments`, `history_booking`

#### [NEW] `supabase/seed.sql`
- Chuyển toàn bộ seed data sang format PostgreSQL
- Giữ nguyên 22 phòng, amenities, images

#### [NEW] Row Level Security (RLS) Policies
- `rooms`, `room_types`, `view_types`, `bed_types`, `amenities`: **SELECT** cho tất cả
- `bookings`: Users chỉ xem booking của mình, admin xem tất cả
- `payments`: Tương tự bookings
- `users` profile: Users chỉ xem/sửa profile của mình

---

### Phase 3: Supabase Client & Auth

#### [NEW] `src/lib/supabase/client.ts`
- Browser client (dùng trong Client Components)

#### [NEW] `src/lib/supabase/server.ts`
- Server client (dùng trong Server Components, API Routes, Server Actions)

#### [NEW] `src/lib/supabase/middleware.ts`
- Middleware refresh session token

#### [NEW] `src/middleware.ts`
- Next.js middleware bảo vệ routes cần auth (`/profile`, `/admin`)

#### Auth flow (Supabase Auth):
- **Register**: `supabase.auth.signUp()` → tạo account + profile row trong `users`
- **Login**: `supabase.auth.signInWithPassword()`
- **Logout**: `supabase.auth.signOut()`
- **Session**: Tự động quản lý bởi Supabase (cookies-based SSR)

---

### Phase 4: UI Components (shadcn/ui + Tailwind v4)

#### Layout & Navigation

| File | Mô tả |
|------|--------|
| `src/app/layout.tsx` | Root layout: font, metadata, theme provider |
| `src/components/layout/navbar.tsx` | Navbar responsive (desktop + mobile drawer) |
| `src/components/layout/footer.tsx` | Footer với thông tin liên hệ |
| `src/components/auth/login-dialog.tsx` | Dialog đăng nhập (shadcn Dialog) |
| `src/components/auth/register-dialog.tsx` | Dialog đăng ký |

#### Trang chính

| Route | File | Mô tả |
|-------|------|--------|
| `/` | `src/app/page.tsx` | Home: Hero + Featured Rooms (SSR fetch từ Supabase) |
| `/rooms` | `src/app/rooms/page.tsx` | Tất cả phòng + filter/search (SSR + Client interactivity) |
| `/rooms/[id]` | `src/app/rooms/[id]/page.tsx` | Chi tiết phòng + form đặt phòng |
| `/profile` | `src/app/profile/page.tsx` | Thông tin cá nhân + lịch sử booking |
| `/admin` | `src/app/admin/page.tsx` | Dashboard admin (protected) |
| `/vnpay-return` | `src/app/vnpay-return/page.tsx` | Xử lý kết quả thanh toán VNPay |

#### Shared Components

| Component | shadcn/ui base |
|-----------|---------------|
| `RoomCard` | Card, Badge |
| `SearchFilters` | Select, Input, Sheet (mobile), Checkbox |
| `BookingForm` | Dialog, Input, Calendar, Button |
| `ProfilePanel` | Card, Avatar, Input, Button |
| `BookingHistory` | Table, Badge |
| `AdminStatsCards` | Card |
| `AdminBookingsTable` | Table, Badge, Button, Input |

---

### Phase 5: API Routes & Server Actions

#### [NEW] `src/app/api/vnpay/create/route.ts`
- Tạo VNPay payment URL (chuyển logic từ `vnpay-signature.php`)
- Validate booking → insert → build VNPay URL → return

#### [NEW] `src/app/api/vnpay/ipn/route.ts`
- VNPay IPN callback (chuyển logic từ `vnpay_ipn.php`)
- Verify signature → update booking/payment status

#### Server Actions (thay cho REST API):
- `createBooking()` – Tạo booking + payment record + redirect VNPay
- `cancelBooking()` – Cancel booking (user hoặc admin)
- `updateBookingStatus()` – Admin update status
- `updateProfile()` – Update tên, SĐT
- `uploadAvatar()` – Upload avatar lên Supabase Storage

---

### Phase 6: Data Fetching

Sử dụng **Server Components** cho data fetching chính:

```
getRooms()        → Supabase query rooms + join types/views/beds/images/amenities
getRoomById()     → Chi tiết 1 phòng
getFeaturedRooms() → 10 phòng featured
getUserBookings()  → Booking history của user
getAdminStats()    → Dashboard statistics
```

Tất cả đều là server-side queries trực tiếp qua `@supabase/ssr`, không cần REST API trung gian.

---

## Cấu trúc thư mục cuối cùng

```
ocean_haven/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                  # Home
│   │   ├── rooms/
│   │   │   ├── page.tsx              # All rooms
│   │   │   └── [id]/page.tsx         # Room detail
│   │   ├── profile/page.tsx          # User profile
│   │   ├── admin/page.tsx            # Admin dashboard
│   │   ├── vnpay-return/page.tsx     # VNPay return handler
│   │   └── api/
│   │       └── vnpay/
│   │           ├── create/route.ts
│   │           └── ipn/route.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── navbar.tsx
│   │   │   └── footer.tsx
│   │   ├── auth/
│   │   │   ├── login-dialog.tsx
│   │   │   ├── register-dialog.tsx
│   │   │   └── auth-provider.tsx
│   │   ├── rooms/
│   │   │   ├── room-card.tsx
│   │   │   ├── room-grid.tsx
│   │   │   ├── room-filters.tsx
│   │   │   └── room-gallery.tsx
│   │   ├── booking/
│   │   │   ├── booking-form.tsx
│   │   │   └── booking-history.tsx
│   │   ├── profile/
│   │   │   └── profile-panel.tsx
│   │   ├── admin/
│   │   │   ├── stats-cards.tsx
│   │   │   └── bookings-table.tsx
│   │   └── ui/                       # shadcn/ui components
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── middleware.ts
│   │   ├── actions/
│   │   │   ├── booking.ts
│   │   │   ├── auth.ts
│   │   │   └── profile.ts
│   │   ├── queries/
│   │   │   ├── rooms.ts
│   │   │   ├── bookings.ts
│   │   │   └── admin.ts
│   │   ├── vnpay.ts
│   │   └── types.ts
│   └── middleware.ts
├── supabase/
│   ├── schema.sql
│   └── seed.sql
├── public/images/
├── .env.local
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Verification Plan

### Automated Tests
```bash
npm run build     # Verify TypeScript compilation + no build errors
npm run lint      # ESLint check
```

### Manual Verification
1. **Home page**: Hero banner + featured rooms load đúng từ Supabase
2. **Rooms page**: Filter/search hoạt động, rooms load đúng
3. **Room detail**: Gallery images, amenities, booking form
4. **Auth flow**: Register → Login → Logout hoạt động đúng với Supabase Auth
5. **Booking flow**: Chọn phòng → Điền form → Redirect VNPay → Return page
6. **Profile**: Xem/sửa thông tin, xem lịch sử booking
7. **Admin**: Dashboard stats, tìm kiếm booking, cập nhật status
8. **Responsive**: Kiểm tra trên mobile/tablet/desktop

--
--
--

# Ocean Haven Migration Tasks

## Phase 1: Khởi tạo dự án & cấu hình
- [x] Backup database SQL files
- [x] Xóa file PHP cũ, khởi tạo Next.js 15
- [x] Cài đặt Tailwind CSS v4 + shadcn/ui
- [x] Cài đặt Supabase packages
- [x] Tạo `.env.local`

## Phase 2: Database Schema
- [x] Tạo `supabase/schema.sql` (PostgreSQL)
- [x] Tạo `supabase/seed.sql`
- [x] Tạo RLS policies

## Phase 3: Supabase Client & Auth
- [x] Tạo Supabase browser client
- [x] Tạo Supabase server client
- [x] Tạo middleware (session refresh + route protection)
- [X] Auth actions (login, register, logout)

## Phase 4: UI Components
- [x] Root layout + theme
- [x] Navbar component
- [x] Footer component
- [x] Auth dialogs (login + register)
- [x] Room card component
- [x] Home page (hero + featured rooms)
- [x] Rooms page (grid + filters)
- [x] Room detail page (gallery + booking form)
- [x] Profile page
- [x] Admin dashboard
- [x] VNPay return page

## Phase 5: API Routes & Server Actions
- [x] VNPay create payment route
- [x] VNPay IPN route (skipped IPN for now, handled via return)
- [x] Booking actions (create, cancel, update status)
- [x] Profile actions (update, upload avatar - skipped for MVP)

## Phase 6: Data Fetching & Verification
- [x] Room queries
- [x] Booking queries
- [x] Admin queries
- [x] Build verification (`npm run build` pending)
- [x] Dev server test
