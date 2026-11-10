# 🌊 Ocean Haven Hotel — Hệ Thống Đặt Phòng Khách Sạn Trực Tuyến

> Nền tảng đặt phòng khách sạn nghỉ dưỡng cao cấp ven biển, được xây dựng theo kiến trúc **Modular Monolith** hiện đại trên nền tảng **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, **shadcn/ui** và **Supabase**.

---

## 📖 Giới Thiệu Dự Án

**Ocean Haven Hotel** là dự án web application phục vụ khách du lịch tìm kiếm, tham khảo và đặt phòng trực tuyến tại khách sạn nghỉ dưỡng ven biển Đà Nẵng (với 22 phòng cao cấp trải đều trên 3 tầng). 

Dự án tích hợp đầy đủ quy trình từ khám phá phòng nghỉ, kiểm tra phòng trống theo thời gian thực, đặt phòng, xác thực người dùng cho đến thanh toán tại khách sạn và hệ thống bảng điều khiển quản trị dành cho chủ khách sạn.

---

## ✨ Tính Năng Nổi Bật

### 👤 Dành cho Khách Hàng (Guest / User)
- **Khám phá & Tìm kiếm phòng**:
  - Trang chủ hiển thị banner ấn tượng, các phòng nổi bật (*Featured Rooms*) và tiện ích đặc quyền.
  - Trang danh mục 22 phòng với bộ lọc thời gian thực: theo khoảng ngày nhận/trả phòng (*Check-in / Check-out*), tầm nhìn (*Sea View, Garden View...*), loại giường, tầng và mức giá.
- **Chi tiết phòng chuyên sâu**:
  - Thư viện ảnh chất lượng cao, mô tả tiện nghi, quy chuẩn phòng, diện tích và sức chứa tối đa.
- **Quy trình Đặt phòng & Giữ chỗ**:
  - Form đặt phòng tự động tính số đêm và tổng tiền theo giá niêm yết.
  - Kiểm tra xung đột lịch đặt tự động — ngăn chặn tình trạng trùng phòng (*Overbooking*).
- **Thanh toán**:
  - Khách thanh toán trực tiếp tại khách sạn khi nhận phòng (COD). Khi Admin đánh dấu đơn là *Completed*, khoản thanh toán được ghi nhận là đã thu.
- **Quản lý Tài khoản Cá nhân**:
  - Đăng ký, đăng nhập nhanh chóng thông qua modal popup mượt mà.
  - Quản lý hồ sơ cá nhân và theo dõi toàn bộ lịch sử các đơn đặt phòng kèm trạng thái xử lý (*Pending, Confirmed, Completed, Cancelled*).
  - Tự hủy đơn đặt phòng của mình (*Pending* hoặc *Confirmed*) trước ngày nhận phòng; đơn và khoản thanh toán được hủy cùng lúc trong một transaction (`sp_CancelMyBooking`).

### 🛡️ Dành cho Quản Trị Viên (Admin)
- **Bảng điều khiển (Dashboard) Thống kê**:
  - Theo dõi các chỉ số quan trọng: Tổng doanh thu, tổng lượt đặt phòng, tổng số phòng đang hoạt động và số lượng người dùng.
- **Quản lý Đơn đặt phòng**:
  - Danh sách đặt phòng toàn hệ thống, hỗ trợ tìm kiếm nhanh theo số điện thoại khách hàng.
  - Thao tác chuyển đổi trạng thái đơn đặt phòng (*Xác nhận đơn, Hoàn thành, Hủy đơn*).
  - Tự động lưu vết lịch sử thao tác (*Audit Log / History*) vào cơ sở dữ liệu.

---

## 🏗️ Kiến Trúc Hệ Thống (Modular Monolith)

Dự án được thiết kế theo mô hình **Modular Monolith** (*Domain-Driven / Vertical Slice Architecture*), giúp mã nguồn có tính đóng gói cao, tách biệt rõ ràng trách nhiệm nghiệp vụ và dễ dàng bảo trì hoặc tách thành microservices trong tương lai:

```
src/
├── app/                              # 1. Thin Composition & Routing Layer (Next.js App Router)
│   ├── layout.tsx                    # Root shell layout, font, session provider
│   ├── page.tsx                      # Trang chủ (kết hợp Hero & Featured Rooms)
│   ├── rooms/                        # Danh mục phòng (/rooms) & Chi tiết phòng (/rooms/[id])
│   ├── admin/                        # Dashboard quản trị dành cho Admin (/admin)
│   ├── profile/                      # Quản lý tài khoản & lịch sử đặt phòng (/profile)
│   ├── proxy.ts                      # Route protection & session proxy middleware
│   └── api/                          # HTTP endpoints mỏng ủy quyền cho modules
│       ├── admin/update-booking/
│       └── health/
│
├── modules/                          # 2. Domain Modules (Các Bounded Contexts độc lập)
│   ├── auth/                         # [Module 1] Quản lý Xác thực & Phiên làm việc
│   │   ├── actions/auth.ts           # Server actions: login, register, logout
│   │   ├── queries/auth.ts           # getCurrentUser, getUserProfile
│   │   ├── components/               # LoginDialog, RegisterDialog
│   │   ├── types.ts                  # UserRole, UserProfile, SessionUser
│   │   ├── server.ts                 # Server-only entrypoint (dành cho Server Components)
│   │   └── index.ts                  # Client/Shared public entrypoint
│   │
│   ├── rooms/                        # [Module 2] Quản lý Phòng & Danh mục lưu trú
│   │   ├── queries/rooms.ts          # getRooms, getRoomById, getFeaturedRooms
│   │   ├── components/               # RoomCard, RoomsCatalog, RoomDetail
│   │   ├── types.ts                  # Room, RoomRaw, FEATURED_ROOM_IDS
│   │   ├── server.ts                 # Server-only entrypoint
│   │   └── index.ts                  # Client/Shared public entrypoint
│   │
│   ├── bookings/                     # [Module 3] Quản lý Nghiệp vụ Đặt phòng
│   │   ├── actions/bookings.ts       # createBooking (availability check, calculate price, hold)
│   │   ├── queries/bookings.ts       # getUserBookings
│   │   ├── components/booking-form.tsx # Form đặt phòng tương tác cao
│   │   ├── types.ts                  # Booking, BookingDetail, BookingActionResult
│   │   ├── server.ts                 # Server-only entrypoint
│   │   └── index.ts                  # Client/Shared public entrypoint
│   │
│   └── admin/                        # [Module 4] Quản trị Khách sạn & Vận hành
│       ├── actions/admin.ts          # updateBookingStatusAction
│       ├── queries/admin.ts          # getAdminStats, getAdminBookings
│       ├── components/booking-action.tsx # Dropdown thao tác duyệt/hủy đơn
│       ├── types.ts                  # AdminStats, AdminBooking
│       ├── server.ts                 # Server-only entrypoint
│       └── index.ts                  # Client/Shared public entrypoint
│
└── shared/                           # 3. Shared Kernel (Thành phần dùng chung toàn hệ thống)
    ├── components/
    │   ├── ui/                       # UI primitives (Button, Dialog, Badge, Select, Tabs...)
    │   └── layout/                   # Global Navbar, Footer
    ├── lib/
    │   ├── supabase/                 # client.ts (Browser), server.ts (SSR), middleware.ts
    │   └── utils.ts                  # cn, formatMoney (VND), formatDate
    └── index.ts                      # Shared utilities entrypoint
```

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

| Hạng mục | Công nghệ / Thư viện | Vai trò |
| :--- | :--- | :--- |
| **Framework** | **Next.js 16 (App Router)** | Rendering kết hợp Server Components & Client Components, Server Actions, Route Handlers. |
| **Language** | **TypeScript 5 (Strict Mode)** | Đảm bảo 100% Type-safety từ database đến giao diện người dùng. |
| **UI & Styling** | **Tailwind CSS v4 & shadcn/ui** | Giao diện phong cách Ocean hiện đại, responsive hoàn hảo, engine `@base-ui/react`. |
| **Icons** | **Lucide React** | Bộ icon đồng bộ, trực quan. |
| **Database** | **SQL Server 2025 (Docker)** | Phòng, đặt phòng, thanh toán, lịch sử đặt phòng; nghiệp vụ nằm trong Stored Procedures, Triggers và Indexes (xem [`database/sqlserver/README.md`](database/sqlserver/README.md)). |
| **Auth** | **Supabase (Auth SSR + bảng `users`)** | Đăng nhập, phiên làm việc bằng cookie SSR, vai trò `user`/`admin` (RLS). |
| **AI Search** | **Ollama `bge-m3` + kiểu `VECTOR` của SQL Server** | Tìm phòng theo ngữ nghĩa bằng tiếng Việt hoặc tiếng Anh. |
| **Payment** | **Thanh toán tại khách sạn (COD)** | Không tích hợp cổng thanh toán trực tuyến; Admin ghi nhận đã thu tiền khi hoàn tất đơn. |
| **Tooling** | **Turbopack, ESLint 9** | Tốc độ biên dịch siêu tốc và kiểm soát chất lượng mã nguồn nghiêm ngặt. |

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án

Hệ thống dùng kiến trúc **hybrid**: Supabase lo đăng nhập và vai trò người dùng, còn SQL Server lưu
phòng, đặt phòng và thanh toán. Cần thiết lập cả hai.

### 1. Yêu cầu môi trường
- **Node.js** `>= 22.9` (các script `db:*` dùng `node --env-file-if-exists`) và **npm**.
- **Docker** (Docker Desktop hoặc Colima) để chạy SQL Server 2025.
  Trên Mac chip Apple (arm64), image SQL Server chỉ có bản amd64: bật Rosetta, ví dụ `colima start --vm-type vz --vz-rosetta`.
- **[Ollama](https://ollama.com)** cho tính năng tìm kiếm AI.
- Một project trên [Supabase](https://supabase.com/).

### 2. Cài đặt Dependencies
```bash
git clone https://github.com/vananhdhj/final-assignment.git ocean_haven
cd ocean_haven
npm install
```

### 3. Cấu hình Biến Môi Trường
Tạo file `.env.local` tại thư mục gốc của dự án:

```env
# Supabase (Dashboard -> Project Settings -> API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# SQL Server (container do `npm run db:start` tạo ra dùng chính các giá trị này)
MSSQL_HOST=localhost
MSSQL_PORT=1433
MSSQL_USER=sa
MSSQL_PASSWORD=OceanHaven@2026   # phải đủ độ phức tạp: chữ hoa, chữ thường, số, ký tự đặc biệt
MSSQL_DATABASE=OceanHaven

# Tìm kiếm AI
OLLAMA_URL=http://localhost:11434
EMBEDDING_MODEL=bge-m3
```

### 4. Thiết lập Supabase (đăng nhập & vai trò)
Mở **SQL Editor** trong Supabase Dashboard và chạy file [`supabase/schema.sql`](supabase/schema.sql).
File này tạo bảng `users`, trigger tự tạo hồ sơ khi đăng ký, các chính sách RLS và lớp bảo vệ
không cho người dùng tự đổi vai trò của mình.

- Project Supabase **đã có sẵn** bảng `users` (tạo từ phiên bản cũ): chạy thêm
  [`supabase/fix_user_role.sql`](supabase/fix_user_role.sql) để áp dụng lớp bảo vệ vai trò.
- Mọi tài khoản mới đăng ký đều là `user`. Để cấp quyền Admin, chạy trong SQL Editor:
  ```sql
  UPDATE public.users SET role = 'admin' WHERE email = 'email-cua-ban@example.com';
  ```

### 5. Thiết lập SQL Server (phòng, đặt phòng, thanh toán)
```bash
npm run db:start   # khởi động SQL Server 2025 trong Docker
npm run db:setup   # tạo database, bảng, index, function, trigger, stored procedure và dữ liệu mẫu (22 phòng)
npm run db:test    # chạy 27 bài kiểm tra cho stored procedure và trigger
```
Lần đầu chạy `db:start`, Docker cần vài phút để tải image; đợi SQL Server khởi động xong (khoảng 30 giây) rồi mới chạy `db:setup`.

> ⚠️ `npm run db:setup` **xóa và tạo lại toàn bộ bảng**, mọi dữ liệu đặt phòng sẽ mất.

Các file `.sql` trong [`database/sqlserver/`](database/sqlserver/) cũng có thể chạy lần lượt (01 → 07) bằng SSMS hoặc Azure Data Studio.

### 6. Tải mô hình AI
```bash
ollama pull bge-m3
```
Nếu Ollama không chạy, trang `/rooms` vẫn hoạt động và tự chuyển sang tìm kiếm theo từ khóa.

### 7. Khởi chạy Ứng dụng
```bash
npm run dev
```

Mở trình duyệt và truy cập: **[http://localhost:3000](http://localhost:3000)**. Thử tìm kiếm AI tại `/rooms`, ví dụ: *"phòng gia đình nhìn ra biển có bếp"*.

---

## 📜 Các Lệnh Khả Dụng (Scripts)

| Lệnh | Ý nghĩa |
| :--- | :--- |
| `npm run dev` | Khởi chạy máy chủ phát triển với Turbopack tại cổng 3000 |
| `npm run build` | Biên dịch dự án và kiểm tra tĩnh toàn bộ mã nguồn cho môi trường production |
| `npm run start` | Chạy máy chủ production sau khi đã build |
| `npm run lint` | Quét và kiểm tra lỗi định dạng code bằng ESLint |
| `npx tsc --noEmit` | Kiểm tra tính đúng đắn của kiểu dữ liệu TypeScript trên toàn bộ repo |
| `npm test` | Chạy unit test và integration test (Jest) |
| `npm run db:start` | Khởi động SQL Server 2025 trong Docker |
| `npm run db:setup` | Tạo lại toàn bộ database SQL Server kèm dữ liệu mẫu (**xóa dữ liệu cũ**) |
| `npm run db:test` | Chạy bài kiểm tra T-SQL cho stored procedure và trigger |
| `npm run db:run -- tests/index_demo.sql` | Đo hiệu quả của index trên 50.600 booking giả lập (tự rollback sau khi đo) |

---

## 🔒 Tài Khoản Demo Khảo Sát

Thông tin tài khoản thử nghiệm (Khách hàng và Quản trị viên) được lưu trong file cục bộ `tests/testAccount.md`. File này không được commit lên Git (đã thêm vào `.gitignore` và `.dockerignore`); hãy xin file này từ người quản lý dự án.

---

## 📄 Bản Quyền & Giấy Phép
Dự án được xây dựng phục vụ mục đích học tập và nghiên cứu (Final Assignment).
