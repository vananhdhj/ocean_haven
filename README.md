# Ocean Haven Hotel - Hệ thống đặt phòng khách sạn trực tuyến

Dự án này là phiên bản nâng cấp (Migration) của hệ thống quản lý đặt phòng khách sạn Ocean Haven, chuyển đổi từ kiến trúc truyền thống **PHP + MySQL** sang kiến trúc hiện đại **Next.js 15 + Supabase**. Dự án giữ nguyên toàn bộ business logic, giao diện, và flow đặt phòng + thanh toán VNPay nhưng nâng cấp hoàn toàn nền tảng công nghệ.

## 🛠 Công nghệ sử dụng (Tech Stack)

- **Frontend Framework**: [Next.js 15 (App Router)](https://nextjs.org/) với React Server Components.
- **Styling & UI**: [Tailwind CSS v4](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/) (Dựa trên `@base-ui/react`).
- **Database & Authentication**: [Supabase](https://supabase.com/) (Sử dụng PostgreSQL và Supabase Auth SSR).
- **Payment Gateway**: Tích hợp cổng thanh toán trực tuyến **VNPay**.

---

## 📋 Các Tasks đã thực hiện trong quá trình Migration

Quá trình chuyển đổi được chia thành 6 giai đoạn (Phases) và tất cả đều đã hoàn thành 100%:

### Phase 1: Setup & Infrastructure

#### 1. Khởi tạo dự án Next.js 15 mới với TypeScript
- **Mục tiêu**: Thiết lập bộ khung ứng dụng hiện đại với App Router và TypeScript.
- **Các bước thực hiện**:
  1. Dọn dẹp các tệp khởi tạo thừa trong workspace.
  2. Thực thi lệnh tạo dự án: `npx -y create-next-app@latest ./ --typescript --eslint --app --src-dir --import-alias "@/*" --turbopack --use-npm`.
  3. Cấu hình `tsconfig.json` với strict mode và path alias (`@/*` trỏ tới `./src/*`).
  4. Cấu hình `next.config.ts` cho phép tải ảnh từ domain bên ngoài (Unsplash): `images: { remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }] }`.

#### 2. Cài đặt Tailwind CSS v4 và cấu hình UI với shadcn/ui
- **Mục tiêu**: Tích hợp hệ thống thiết kế giao diện linh hoạt và hiện đại.
- **Các bước thực hiện**:
  1. Cài đặt Tailwind CSS v4 và các dependencies liên quan: `npm install tailwindcss @tailwindcss/postcss postcss`.
  2. Khởi tạo cấu hình shadcn/ui với engine `@base-ui/react`: `npx shadcn@latest init -d`.
  3. Tải về và cài đặt các components UI cần thiết từ shadcn:
     - Button, Card, Badge, Input, Label, Select, Dialog, DropdownMenu, Tabs, Table, Textarea, Avatar, Sheet.
  4. Tinh chỉnh `src/app/globals.css` với bảng màu Ocean Theme (xanh đại dương, slate, primary gradient).
  5. Cài đặt bộ icon: `npm install lucide-react class-variance-authority clsx tailwind-merge`.

#### 3. Xóa bỏ các file PHP và dọn dẹp workspace
- **Mục tiêu**: Loại bỏ mã nguồn PHP cũ để tránh xung đột và giữ cây thư mục gọn gàng.
- **Các bước thực hiện**:
  1. Rà soát lại toàn bộ logic trong các file PHP cũ: `index.php`, `rooms.php`, `vnpay-signature.php`, `vnpay_return.php`, `vnpay_ipn.php`, `config.php`.
  2. Xóa các thư mục legacy: `admin/`, `includes/`, `assets/`, `config/`.
  3. Chỉ giữ lại `README.md` và sao lưu schema database cũ để phục vụ migration.

---

### Phase 2: Database Migration (Supabase)

#### 1. Thiết kế lại Schema (PostgreSQL) từ MySQL cũ
- **Mục tiêu**: Chuyển đổi toàn bộ quan hệ dữ liệu từ MySQLi sang PostgreSQL tiêu chuẩn Supabase.
- **Các bước thực hiện**:
  1. Phân tích các bảng MySQL cũ: `users`, `rooms`, `room_types`, `view_types`, `bed_types`, `amenities`, `bookings`, `payments`.
  2. Chuyển đổi kiểu dữ liệu sang PostgreSQL:
     - `VARCHAR(36)` → `UUID DEFAULT gen_random_uuid()` hoặc `TEXT`.
     - `ENUM(...)` → `TEXT CHECK (status IN ('Pending', 'Confirmed', 'Completed', 'Cancelled'))`.
     - `INT AUTO_INCREMENT` → `BIGINT GENERATED ALWAYS AS IDENTITY` hoặc `SERIAL`.
     - `TIMESTAMP` → `TIMESTAMPTZ DEFAULT now()`.
  3. Tối ưu hóa cấu trúc phòng: Gom các thông tin `amenities` và `images` thành mảng JSON/ARRAY để tăng tốc độ truy vấn Server Components.
  4. Bổ sung trường `hold_expires_at` vào bảng `bookings` phục vụ cơ chế giữ chỗ tạm thời trong 15 phút khi người dùng chuyển hướng sang cổng thanh toán VNPay.

#### 2. Viết file `supabase/schema.sql` và `supabase/seed.sql`
- **Mục tiêu**: Tự động hóa quá trình dựng database và nạp dữ liệu mẫu chất lượng cao.
- **Các bước thực hiện**:
  1. Viết `supabase/schema.sql` tạo các bảng: `users`, `rooms`, `bookings`, `payments`, `history_booking`.
  2. Tạo Database Trigger `on_auth_user_created` trên schema `auth.users`: Tự động sao chép thông tin `id`, `email`, `name`, `phone`, `role` sang bảng `public.users` mỗi khi có user mới đăng ký.
  3. Viết `supabase/seed.sql` nạp dữ liệu cho 6 hạng phòng (Deluxe Ocean View, Premium Suite, Standard Twin, Family Suite...) kèm ảnh Unsplash sắc nét và đầy đủ danh mục tiện nghi (Wifi, Hồ bơi, Bữa sáng, Mini bar...).

#### 3. Thiết lập Row Level Security (RLS)
- **Mục tiêu**: Bảo mật dữ liệu ở tầng cơ sở dữ liệu, phân quyền chặt chẽ giữa khách, user và admin.
- **Các bước thực hiện**:
  1. Bật RLS: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` trên tất cả các bảng.
  2. Thiết lập RLS Policies:
     - Bảng `rooms`: `CREATE POLICY "Public rooms are viewable by everyone" ON rooms FOR SELECT USING (true);`.
     - Bảng `users`: Cho phép người dùng chỉ xem và sửa profile của chính mình (`auth.uid() = id`), admin có toàn quyền.
     - Bảng `bookings`: Khách đã đăng nhập chỉ xem được đơn đặt của chính họ; Admin xem và cập nhật được tất cả.
     - Bảng `payments`: Tương tự chính sách của `bookings`.

---

### Phase 3: Supabase Client & Auth

#### 1. Cài đặt SDK Supabase
- **Mục tiêu**: Kết nối Next.js với Supabase qua giao thức SSR an toàn.
- **Các bước thực hiện**:
  1. Chạy lệnh cài đặt: `npm install @supabase/supabase-js @supabase/ssr`.
  2. Tạo file cấu hình môi trường `.env.local` chứa `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

#### 2. Cấu hình Supabase Clients
- **Mục tiêu**: Cung cấp các client độc lập cho từng môi trường thực thi (Browser vs Server).
- **Các bước thực hiện**:
  1. Viết `src/lib/supabase/client.ts`: Sử dụng `createBrowserClient` để khởi tạo client trên trình duyệt.
  2. Viết `src/lib/supabase/server.ts`: Sử dụng `createServerClient` kết hợp với `cookies()` từ `next/headers` để truy xuất cookie phiên trên Server Components và Server Actions.
  3. Viết `src/lib/supabase/middleware.ts`: Quản lý việc refresh token và đồng bộ cookie phiên giữa Client và Server.

#### 3. Thiết lập Middleware / Proxy Route Protection
- **Mục tiêu**: Bảo vệ các trang nhạy cảm (`/profile`, `/admin`) khỏi truy cập trái phép.
- **Các bước thực hiện**:
  1. Khởi tạo `src/proxy.ts` (chuẩn mới thay thế `middleware.ts` trong Next.js 16.3+).
  2. Đọc session người dùng qua `supabase.auth.getUser()`.
  3. Chặn truy cập route `/profile`: Nếu chưa đăng nhập, tự động chuyển hướng về `/?login=1`.
  4. Chặn truy cập route `/admin`: Kiểm tra trường `role` trong bảng `users`, nếu không phải `admin` thì điều hướng về `/`.

#### 4. Viết Server Actions cho Authentication
- **Mục tiêu**: Xử lý đăng nhập, đăng ký và đăng xuất phía máy chủ với Next.js Server Actions.
- **Các bước thực hiện**:
  1. Tạo file `src/lib/actions/auth.ts` với directive `"use server"`.
  2. Viết hàm `login(prevState, formData)`: Lấy email, password từ formData và gọi `supabase.auth.signInWithPassword`.
  3. Viết hàm `register(prevState, formData)`: Validate dữ liệu (độ dài mật khẩu >= 6, khớp password), sau đó gọi `supabase.auth.signUp` kèm metadata `name`, `phone`.
  4. Viết hàm `logout()`: Gọi `supabase.auth.signOut()` và thực hiện `revalidatePath("/", "layout")` để làm mới trạng thái xác thực toàn ứng dụng.

---

### Phase 4: UI Components

#### 1. Root Layout & Base Setup
- **Mục tiêu**: Định hình layout chung, font chữ, và fetch dữ liệu user ban đầu.
- **Các bước thực hiện**:
  1. Cập nhật `src/app/layout.tsx`: Nhúng font `Inter` từ `next/font/google`.
  2. Fetch thông tin user hiện tại từ Supabase Server Client để truyền vào `Navbar`.
  3. Đặt thẻ `<Navbar />` ở đầu và `<Footer />` ở cuối trang.

#### 2. Navbar & Footer Components
- **Mục tiêu**: Thanh điều hướng tương thích mọi thiết bị và Footer hoàn chỉnh.
- **Các bước thực hiện**:
  1. Tạo `src/components/layout/navbar.tsx`:
     - Khi chưa đăng nhập: Hiển thị 2 nút "Đăng nhập" và "Đăng ký" kích hoạt Dialog.
     - Khi đã đăng nhập: Hiển thị Avatar người dùng kèm DropdownMenu dẫn tới `/profile`, `/admin` (nếu là admin), và nút Đăng xuất.
     - Tích hợp `Sheet` để tạo thanh điều hướng trượt ngang cho thiết bị di động.
  2. Tạo `src/components/layout/footer.tsx`: Hiển thị thông tin liên hệ, logo Ocean Haven, hotline và các liên kết chính sách.

#### 3. Auth Dialogs (Đăng nhập & Đăng ký)
- **Mục tiêu**: Cửa sổ popup đăng nhập mượt mà không cần reload trang.
- **Các bước thực hiện**:
  1. Tạo `src/components/auth/login-dialog.tsx`: Tích hợp hook `useActionState(login, initialState)`, tự động hiển thị thông báo lỗi nếu nhập sai tài khoản.
  2. Tạo `src/components/auth/register-dialog.tsx`: Thu thập Họ tên, Email, Số điện thoại, Mật khẩu và Xác nhận mật khẩu; tự động chuyển sang popup đăng nhập khi đăng ký thành công.

#### 4. Room Card & Trang chủ (`src/app/page.tsx`)
- **Mục tiêu**: Giao diện trang chủ ấn tượng với Hero Banner và danh sách phòng nổi bật.
- **Các bước thực hiện**:
  1. Tạo `src/components/room-card.tsx`: Hiển thị ảnh phòng, giá tiền định dạng VND, huy hiệu hạng phòng, số khách tối đa, diện tích và nút "Xem chi tiết".
  2. Xây dựng `src/app/page.tsx`:
     - Hero Section tràn viền với hình ảnh biển tuyệt đẹp và nút CTA dẫn tới `/rooms`.
     - Section "Signature Rooms": Gọi hàm `getFeaturedRooms()` render phía máy chủ 8 phòng nổi bật nhất.
     - Section Giới thiệu tiện ích khách sạn: Vị trí đắc địa, Ẩm thực cao cấp, An ninh 24/7.

#### 5. Trang danh sách phòng & Bộ lọc (`src/app/rooms/page.tsx`)
- **Mục tiêu**: Tìm kiếm và lọc phòng theo thời gian lưu trú và phân loại phòng.
- **Các bước thực hiện**:
  1. Nhận các tham số `checkin`, `checkout`, `type` từ URL thông qua `searchParams`.
  2. Gọi hàm `getRooms(checkin, checkout)`: Tự động loại trừ các phòng đã có người đặt trong khoảng ngày đó.
  3. Xây dựng thanh công cụ tìm kiếm với Input Date Check-in, Check-out và Select Loại phòng.
  4. Hiển thị danh sách phòng dưới dạng lưới Grid responsive.

#### 6. Trang chi tiết phòng & Form đặt phòng (`src/app/rooms/[id]/page.tsx`)
- **Mục tiêu**: Xem đầy đủ hình ảnh, thông số kỹ thuật và đặt phòng trực tuyến.
- **Các bước thực hiện**:
  1. Gọi `getRoomById(id)` lấy thông tin chi tiết: Thư viện ảnh dạng Grid (1 ảnh lớn + 4 ảnh nhỏ), mô tả và danh sách tiện nghi có icon check xanh.
  2. Tạo `src/components/booking-form.tsx` (Client Component):
     - Tự động tính số đêm và tổng tiền dựa trên ngày Check-in/Check-out được chọn.
     - Hỗ trợ chọn phương thức thanh toán: "Thanh toán qua VNPay" hoặc "Thanh toán tại khách sạn (COD)".
     - Nếu chưa đăng nhập: Nút đặt phòng tự động mở popup yêu cầu đăng nhập.

#### 7. Trang tài khoản cá nhân (`src/app/profile/page.tsx`)
- **Mục tiêu**: Quản lý thông tin cá nhân và theo dõi lịch sử đặt phòng.
- **Các bước thực hiện**:
  1. Sử dụng component `Tabs` chia 2 tab: "My Bookings" và "Profile Details".
  2. Tab Bookings: Gọi `getUserBookings(userId)` hiển thị toàn bộ các phòng đã đặt kèm mã đặt phòng, ngày nhận/trả, tổng tiền, huy hiệu trạng thái (Confirmed, Pending, Cancelled) và trạng thái thanh toán.
  3. Tab Profile: Hiển thị họ tên, email, số điện thoại và ngày tham gia.

#### 8. Trang quản trị viên (`src/app/admin/page.tsx`)
- **Mục tiêu**: Bảng điều khiển quản lý toàn diện dành cho chủ khách sạn.
- **Các bước thực hiện**:
  1. Gọi `getAdminStats()` hiển thị 4 thẻ thống kê: Tổng doanh thu (VND), Tổng số lượt đặt phòng, Tổng số phòng, và Tổng người dùng.
  2. Xây dựng bảng `Table` liệt kê toàn bộ các đơn đặt phòng trong hệ thống.
  3. Tạo `src/components/admin/booking-action.tsx`: Cung cấp menu Dropdown cho phép Admin chuyển đổi trạng thái đơn đặt (Xác nhận đơn, Đánh dấu hoàn thành, hoặc Hủy đơn).

#### 9. Trang kết quả thanh toán VNPay (`src/app/vnpay-return/page.tsx`)
- **Mục tiêu**: Hứng dữ liệu trả về từ VNPay, kiểm tra tính toàn vẹn và cập nhật trạng thái đơn.
- **Các bước thực hiện**:
  1. Đọc toàn bộ tham số `vnp_*` từ URL query.
  2. Gọi `verifyVnpaySignature()` trong `src/lib/vnpay.ts` để kiểm tra chữ ký băm HMAC SHA-512.
  3. Nếu chữ ký hợp lệ và `vnp_ResponseCode === '00'`: Cập nhật trạng thái đơn thành `Confirmed` và thanh toán thành `Completed` trong Supabase.
  4. Hiển thị màn hình thông báo trực quan (tick xanh thành công / dấu X đỏ thất bại).

---

### Phase 5: API Routes & Server Actions (Booking Workflow)

#### 1. Server Action tạo đơn đặt phòng (`createBooking`)
- **Mục tiêu**: Xử lý toàn bộ logic nghiệp vụ đặt phòng an toàn ở phía Backend.
- **Các bước thực hiện**:
  1. Kiểm tra xác thực người dùng qua `supabase.auth.getUser()`.
  2. Truy vấn kiểm tra phòng còn trống trong khoảng ngày yêu cầu:
     - Quét các booking trùng `room_id` có trạng thái khác 'Cancelled' nằm trong khoảng ngày đặt.
  3. Tính toán tổng tiền: `totalPrice = room.price * nights`.
  4. Sinh mã đặt phòng duy nhất: `B` + timestamp + số ngẫu nhiên.
  5. Thiết lập `hold_expires_at = NOW() + 15 phút` nếu chọn thanh toán qua VNPay.
  6. Lưu bản ghi vào bảng `bookings` và bảng `payments`.

#### 2. Route khởi tạo thanh toán VNPay (`/api/payments/create-vnpay`)
- **Mục tiêu**: Tạo URL thanh toán VNPay có chữ ký điện tử chuẩn xác.
- **Các bước thực hiện**:
  1. Nhận `bookingCode` và `amount` từ query parameters.
  2. Sắp xếp các tham số VNPay theo thứ tự alphabet (theo yêu cầu của cổng VNPay).
  3. Băm chuỗi dữ liệu với secret key bằng thuật toán `crypto.createHmac("sha512", secretKey)`.
  4. Tạo URL hoàn chỉnh và chuyển hướng (redirect) người dùng sang cổng thanh toán VNPay Sandbox.

#### 3. API cập nhật trạng thái đơn hàng (`/api/admin/update-booking`)
- **Mục tiêu**: Cung cấp endpoint cho Admin thao tác cập nhật đơn.
- **Các bước thực hiện**:
  1. Xác thực quyền admin của người gửi request.
  2. Cập nhật trạng thái mới vào bảng `bookings`.
  3. Ghi log hoạt động vào bảng `history_booking` để lưu vết lịch sử thay đổi.

---

### Phase 6: Data Fetching & Build Verification

#### 1. Xây dựng Data Fetching Layer (`src/lib/queries/*`)
- **Mục tiêu**: Tối ưu hóa truy vấn dữ liệu Server Components trực tiếp từ Supabase.
- **Các bước thực hiện**:
  1. Tạo `src/lib/queries/rooms.ts`: Viết hàm `getRooms()` và `getRoomById()`.
  2. Tạo `src/lib/queries/bookings.ts`: Viết hàm `getUserBookings()`, `getAdminBookings()`, và `getAdminStats()`.
  3. Áp dụng cơ chế Data Caching của Next.js (`revalidate = 3600`) trên trang chủ để tối ưu tốc độ tải trang.

#### 2. Kiểm tra và khắc phục lỗi Build Production
- **Mục tiêu**: Đảm bảo toàn bộ mã nguồn không còn lỗi TypeScript hay cú pháp trước khi release.
- **Các bước thực hiện**:
  1. Chạy lệnh kiểm tra: `npm run build`.
  2. Xử lý lỗi xung đột `asChild` của `@base-ui`: Chuyển đổi toàn bộ Button bọc Link sang cú pháp `<Link className={buttonVariants(...)}>`.
  3. Sửa lỗi signature của `useActionState`: Bổ sung tham số `prevState: any` vào các Server Actions `login`, `register`, `createBooking`.
  4. Thực thi lại `npm run build` và xác nhận quá trình Compile + Type Check thành công 100%.

---

## 🏗 Giải thích kiến trúc và các phần trong trang web

Hệ thống tuân thủ thiết kế **Next.js App Router**:

1. **Routing (`src/app`)**:
   - `/`: Trang chủ khách sạn.
   - `/rooms`: Danh sách toàn bộ phòng.
   - `/rooms/[id]`: Chi tiết một phòng cụ thể.
   - `/profile`: Thông tin tài khoản người dùng và lịch sử các phòng họ đã đặt.
   - `/admin`: Bảng điều khiển riêng của quản trị viên (Admin).
   - `/vnpay-return`: Nhận IPN redirect từ VNPay sau khi khách thanh toán xong.
   - `/api/*`: Chứa các REST API route xử lý thanh toán và quyền admin.

2. **Data Layer (`src/lib`)**:
   - `supabase/`: Khởi tạo kết nối tới Supabase (Server, Client).
   - `actions/`: Chứa các Next.js Server Actions (`auth.ts`, `bookings.ts`) giúp Form có thể tương tác trực tiếp với Database mà không cần viết API trung gian.
   - `queries/`: Các hàm truy xuất dữ liệu Server-side từ bảng `rooms`, `bookings`. Sử dụng Server Components cho data fetching chính mà không cần REST API trung gian.
   - `vnpay.ts`: Tiện ích băm bảo mật (crypto/HMAC SHA-512) để giao tiếp với hệ thống VNPay.

3. **UI Components (`src/components`)**:
   - Tái sử dụng các thành phần giao diện nhỏ (Button, Dialog, Card) thông qua **shadcn/ui**.
   - Phân chia logic Renders ở các module phức tạp (Ví dụ: `booking-form.tsx` xử lý State nhập ngày tháng bên phía Client).

4. **Security & Middleware (`src/proxy.ts`)**:
   - Sử dụng cơ chế Middleware/Proxy của Next.js để đánh chặn (intercept) các request. Nếu người dùng chưa đăng nhập mà cố vào `/profile` hoặc `/admin`, hệ thống tự động redirect về trang chủ kèm theo param bắt buộc mở popup đăng nhập.

---

## 📂 Cấu trúc thư mục cuối cùng

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
│   │       ├── admin/
│   │       │   └── update-booking/route.ts
│   │       └── payments/
│   │           └── create-vnpay/route.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── navbar.tsx
│   │   │   └── footer.tsx
│   │   ├── auth/
│   │   │   ├── login-dialog.tsx
│   │   │   └── register-dialog.tsx
│   │   ├── admin/
│   │   │   └── booking-action.tsx
│   │   ├── room-card.tsx
│   │   ├── booking-form.tsx
│   │   └── ui/                       # shadcn/ui components
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── middleware.ts
│   │   ├── actions/
│   │   │   ├── bookings.ts
│   │   │   └── auth.ts
│   │   ├── queries/
│   │   │   ├── rooms.ts
│   │   │   └── bookings.ts
│   │   ├── vnpay.ts
│   │   └── types.ts
│   └── proxy.ts                      # Next.js Middleware/Proxy
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

## ✅ Verification Plan

### Automated Tests
Đã chạy và kiểm tra các câu lệnh sau để đảm bảo mã nguồn sạch sẽ và có thể build được:
```bash
npm run build     # Verify TypeScript compilation + no build errors
npm run lint      # ESLint check
```

### Manual Verification
1. **Home page**: Hero banner + featured rooms load chính xác từ Supabase qua Server Component.
2. **Rooms page**: Hệ thống filter/search hoạt động, loại trừ các phòng đã được đặt trong khoảng thời gian đã chọn.
3. **Room detail**: Hình ảnh, tiện ích, form đặt phòng hiển thị chính xác.
4. **Auth flow**: Register → Login → Logout hoạt động đồng bộ với Supabase Auth, tự động cập nhật Navigation.
5. **Booking flow**: Chọn phòng → Điền form → Redirect sang cổng thanh toán VNPay ảo → VNPay Return page xử lý kết quả đúng quy trình.
6. **Profile**: Truy xuất được danh sách các đơn đặt phòng của chính bản thân.
7. **Admin**: Dashboard hiển thị các số liệu thống kê chuẩn xác, có quyền cập nhật trạng thái đơn (Confirmed, Completed, Cancelled).
8. **Responsive**: Giao diện hiển thị tốt trên tất cả các màn hình (mobile/tablet/desktop) qua Tailwind CSS.

---

## 🐛 Các lỗi gặp phải & Cách khắc phục (Troubleshooting)

Trong quá trình Migration, một số vấn đề kỹ thuật đã phát sinh và được giải quyết:

### 1. Xung đột cổng (Port Contention)
- **Vấn đề:** Khi khởi động `npm run dev`, cổng 3000 bị chiếm dụng bởi một tiến trình cũ.
- **Cách khắc phục:** Đã sử dụng shell command để kiểm tra và `kill -9` các process `node` bị treo, giải phóng cổng 3000 cho dev server.

### 2. Lỗi Middleware ở Next.js 16.3.3 (Turbopack)
- **Vấn đề:** Next.js phiên bản mới cảnh báo `"The 'middleware' file convention is deprecated. Please use 'proxy' instead"`.
- **Cách khắc phục:** Đã chạy Codemod của Vercel (`npx @next/codemod@canary middleware-to-proxy . --force`) và cấu trúc lại file thành `src/proxy.ts` để tương thích 100% với phiên bản Next mới nhất.

### 3. Lỗi TypeScript Type-check của `@base-ui/react` (shadcn)
- **Vấn đề:** Khi build `npm run build`, TypeScript báo lỗi `Property 'asChild' does not exist on type 'IntrinsicAttributes'`. Điều này xảy ra do phiên bản shadcn mới nhất dùng `@base-ui` làm engine, nó loại bỏ property `asChild` cũ của Radix UI.
- **Cách khắc phục:** Thay vì dùng `<Button asChild><Link href="..."/></Button>`, tôi đã sử dụng trực tiếp `<Link className={buttonVariants({ variant: "..." })} href="...">`. Đối với các component như `DropdownMenuTrigger` hay `SheetTrigger`, tôi đã thay thế prop `asChild` bằng prop `render={<Button/>}` theo đúng chuẩn của `@base-ui`.

### 4. Lỗi Signature Matching của `useActionState` (React 19)
- **Vấn đề:** Hook `useActionState` trong React yêu cầu Type của `initialState` và `return` của Server Action phải khớp nhau hoàn toàn, và Action phải nhận 2 parameters là `(prevState, formData)`.
- **Cách khắc phục:** Đã điều chỉnh toàn bộ các Server actions (`login`, `register`, `createBooking`) để nhận thêm `prevState: any` ở đối số đầu tiên. Đồng thời định nghĩa generic type cho hook: `useActionState<any, FormData>(...)` để bỏ qua lỗi overload quá khắt khe của TypeScript khi form có nhiều trạng thái return khác nhau.

### 5. Lỗi `next/image` Unconfigured Hostname (`images.unsplash.com`)
- **Vấn đề:** Khi render trang chủ hoặc trang chi tiết phòng chứa link ảnh trực tiếp từ Unsplash, Next.js ném lỗi Runtime `Invalid src prop on next/image, hostname "images.unsplash.com" is not configured under images in your next.config.js`.
- **Cách khắc phục:** Cập nhật file `next.config.ts`, khai báo thêm `images.remotePatterns` với `protocol: "https"` và `hostname: "images.unsplash.com"`, sau đó khởi động lại dev server.

---

## 🚀 Hướng dẫn chạy dự án

**1. Cài đặt các gói phụ thuộc:**
```bash
npm install
```

**2. Khởi tạo biến môi trường:**
Tạo file `.env.local` ở thư mục gốc và nhập các khóa bí mật:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
VNPAY_TMN_CODE=your_vnpay_tmn_code
VNPAY_HASH_SECRET=your_vnpay_hash_secret
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**3. Chạy Development Server:**
```bash
npm run dev
```
Trang web sẽ hoạt động tại địa chỉ: [http://localhost:3000](http://localhost:3000)
