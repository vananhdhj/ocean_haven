-- Lý do tách view_type, room_type, bed_type ra bảng riêng Nhằm mục đích giúp dữ liệu được nhất quán, tránh lỗi typo dẫn đến không filter được. 
-- Ngoài ra nó cũng giúp giao diện admin dễ dàng thao tác hơn khi có thể tuỳ chọn giữa các option trong bảng hoặc dropdown menu. 
-- Ví dụ: Khi khách sạn được xây lại và các phòng bị thay đổi cấu trúc thì Admin có thể tuỳ chọn thay đổi cấu hình lại rất dễ dàng.

-- ENUM dùng để định nghĩa một danh sách các giá trị cố định, hữu hạn và không thay đổi
-- Với lại tên bảng với mấy thành phần bên trong, e cũng đặt tên cho nó dễ để viết lệnh truy xuất r á

-- =====================================================================
--   1. Tích hợp thanh toán VNPAY (PAYMENTS.vnpay_order_id)
--   2. Log lịch sử booking (HISTORY_BOOKING)
--   3. Chống đặt trùng ngày cho cùng 1 phòng (index + CHECK constraint)
--   4. Tự động giải phóng phòng bị "giữ chỗ" quá lâu (BOOKINGS.hold_expires_at)
--   5. Đổi tên ROOMS.is_available -> is_active cho đúng nghĩa
-- =====================================================================

CREATE TABLE USERS (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Categories to ensure consistency and avoid typos in filtering.
CREATE TABLE ROOM_TYPES (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) UNIQUE -- 'Standard', 'Deluxe', 'Family Suite', 'Connecting Room'
);

CREATE TABLE VIEW_TYPES (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) UNIQUE -- 'Sea View', 'Garden View', 'City View'
);

CREATE TABLE BED_TYPES (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) UNIQUE -- 'Queen', 'King', 'Twin', 'Double', 'Bunk'
);

CREATE TABLE ROOMS (
  id VARCHAR(36) PRIMARY KEY,
  room_types_id VARCHAR(36),
  view_type_id VARCHAR(36),
  floor INT,
  name VARCHAR(255),
  rating DECIMAL(3,1) DEFAULT 0.0,
  review_count INT DEFAULT 0,
  size DECIMAL(10,2),
  max_guests INT NOT NULL,
  bed_type_id VARCHAR(36),
  bed_count INT,
  description TEXT,
  price DECIMAL(15,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE, -- đánh dấu phòng có được phép cho thuê hay không
  FOREIGN KEY (room_types_id) REFERENCES ROOM_TYPES(id) ON DELETE SET NULL,
  FOREIGN KEY (view_type_id) REFERENCES VIEW_TYPES(id) ON DELETE SET NULL,
  FOREIGN KEY (bed_type_id) REFERENCES BED_TYPES(id) ON DELETE SET NULL
);

CREATE TABLE ROOM_IMAGES (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_id VARCHAR(36),
  image_url VARCHAR(255),
  is_primary BOOLEAN DEFAULT FALSE,  -- là ảnh chính của phòng, dùng để hiển thị trong danh sách phòng; các ảnh khác là ảnh phụ
  FOREIGN KEY (room_id) REFERENCES ROOMS(id) ON DELETE CASCADE
);

CREATE TABLE AMENITIES (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) UNIQUE,
  icon_name VARCHAR(255)
);

CREATE TABLE ROOM_AMENITIES (
  room_id VARCHAR(36),
  amenity_id VARCHAR(36),
  PRIMARY KEY (room_id, amenity_id),
  FOREIGN KEY (room_id) REFERENCES ROOMS(id) ON DELETE CASCADE,
  FOREIGN KEY (amenity_id) REFERENCES AMENITIES(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 4. BOOKINGS
--    THÊM: hold_expires_at
--    Lý do: 1 booking 'Pending' đang giữ chỗ 1 phòng theo ngày; nếu
--    khách bỏ ngang không thanh toán, phòng đó sẽ bị "kẹt" mãi mãi vì
--    logic tìm-phòng-trống coi mọi status != 'Cancelled' là đã có
--    người giữ. Cột này lưu thời điểm booking hết hạn giữ chỗ (ví dụ
--    tạo lúc 10:00, hold_expires_at = 10:15) để 1 cron job / script
--    dọn dẹp tự động chuyển các booking Pending quá hạn sang Cancelled.
--
--    THÊM: CHECK (check_out > check_in)
--    Lý do: chặn ngay ở tầng DB các trường hợp nhập ngày sai (trả
--    phòng trước ngày nhận phòng), không phụ thuộc hoàn toàn vào PHP
--    validate.
--
--    THÊM: index idx_room_dates
--    Lý do: câu SQL tìm phòng trống / kiểm tra trùng lịch phải quét
--    theo (room_id, check_in, check_out) rất thường xuyên — mỗi lần
--    khách search hoặc mỗi lần tạo booking mới đều chạy. Không có
--    index này, MySQL phải full scan toàn bộ bảng BOOKINGS khi dữ
--    liệu lớn dần.
-- ---------------------------------------------------------------------
CREATE TABLE BOOKINGS (
  id VARCHAR(36) PRIMARY KEY,
  booking_code VARCHAR(50) UNIQUE,
  user_id VARCHAR(36),
  room_id VARCHAR(36),
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guest_count INT,
  guest_name VARCHAR(255),
  guest_email VARCHAR(255),
  guest_phone VARCHAR(20),
  special_requests TEXT,
  total_price DECIMAL(15,2),
  status ENUM('Pending', 'Confirmed', 'Completed', 'Cancelled') DEFAULT 'Pending',
  hold_expires_at TIMESTAMP NULL DEFAULT NULL, -- thời điểm hết hạn giữ chỗ nếu chưa thanh toán (vì lúc này status vẫn Pending)
                                               -- vì logic tìm-phòng-trống coi mọi status != 'Cancelled' là đã có người giữ
  create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES USERS(id) ON DELETE SET NULL,
  FOREIGN KEY (room_id) REFERENCES ROOMS(id) ON DELETE SET NULL,
  CONSTRAINT chk_booking_dates CHECK (check_out > check_in),
  INDEX idx_room_dates (room_id, check_in, check_out),
  INDEX idx_status (status)
);

CREATE TABLE PAYMENTS (
  id VARCHAR(36) PRIMARY KEY,
  booking_id VARCHAR(36) UNIQUE,
  payment_method VARCHAR(50),
  transaction_id VARCHAR(255) UNIQUE,
  vnpay_order_id VARCHAR(150) UNIQUE,  -- vnp_TxnRef 
  amount DECIMAL(15,2),
  status ENUM('Pending', 'Completed', 'Failed', 'Refunded') DEFAULT 'Pending',
  paid_at TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (booking_id) REFERENCES BOOKINGS(id) ON DELETE CASCADE
);

CREATE TABLE HISTORY_BOOKING (
  id VARCHAR(36) PRIMARY KEY,
  booking_id VARCHAR(36),
  action VARCHAR(100),
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES BOOKINGS(id) ON DELETE CASCADE,
  INDEX idx_booking_created (booking_id, created_at)
);



-- =====================================================================
-- GHI CHÚ: TÌM PHÒNG TRỐNG THEO NGÀY (không lưu cứng)
-- =====================================================================
-- Hai khoảng ngày [A_in, A_out) và [B_in, B_out) giao nhau khi:
--     A_in < B_out  AND  A_out > B_in
--
-- SELECT r.*
-- FROM ROOMS r
-- WHERE r.is_active = TRUE
--   AND r.max_guests >= :guest_count
--   AND r.id NOT IN (
--     SELECT b.room_id FROM BOOKINGS b
--     WHERE b.status != 'Cancelled'
--       AND b.check_in < :check_out
--       AND b.check_out > :check_in
--   );
--
-- Cron / script dọn dẹp booking Pending quá hạn (chạy định kỳ, ví dụ mỗi 5 phút):
-- UPDATE BOOKINGS
-- SET status = 'Cancelled'
-- WHERE status = 'Pending'
--   AND hold_expires_at IS NOT NULL
--   AND hold_expires_at < NOW();
-- =====================================================================