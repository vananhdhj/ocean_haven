<?php
// 1. THIẾT LẬP PHẢN HỒI LÀ JSON
header('Content-Type: application/json;');
ini_set('serialize_precision', 14); // Cấu hình chuẩn định dạng số thập phân để tránh lỗi hiển thị số phẩy quá dài

// 2. NHÚNG KẾT NỐI DATABASE
require_once __DIR__ . '/../../config/db-connection.php';

// 3. TRUY VẤN LẤY TOÀN BỘ ẢNH CỦA CÁC PHÒNG (Gom nhóm theo phòng)
$img_query = "SELECT room_id, image_url, is_primary FROM ROOM_IMAGES ORDER BY room_id, is_primary DESC, id ASC";
$img_res = mysqli_query($conn, $img_query);
$images_by_room = []; // Mảng chứa toàn bộ ảnh của mỗi phòng: [ 'room-001' => ['url1', 'url2'] ]
$primary_image_by_room = []; // Mảng chứa ảnh đại diện chính của mỗi phòng: [ 'room-001' => 'url_primary' ]

if ($img_res) {
  while ($img = mysqli_fetch_assoc($img_res)) {
    $r_id = $img['room_id'];
    if (!isset($images_by_room[$r_id])) {
      $images_by_room[$r_id] = [];
    }
    $images_by_room[$r_id][] = $img['image_url']; // Thêm ảnh vào danh sách ảnh phụ
    if ((int)$img['is_primary'] === 1 || !isset($primary_image_by_room[$r_id])) {
      $primary_image_by_room[$r_id] = $img['image_url']; // Đặt làm ảnh đại diện chính nếu đánh dấu is_primary = 1
    }
  }
}

// 4. TRUY VẤN LẤY TOÀN BỘ TIỆN ÍCH (AMENITIES) CỦA CÁC PHÒNG
$am_query = "SELECT ra.room_id, a.name FROM ROOM_AMENITIES ra JOIN AMENITIES a ON ra.amenity_id = a.id";
$am_res = mysqli_query($conn, $am_query);
$amenities_by_room = []; // Mảng chứa danh sách tiện ích của từng phòng: [ 'room-001' => ['Wifi', 'Tivi', 'Điều hoà'] ]

if ($am_res) {
  while ($am = mysqli_fetch_assoc($am_res)) {
    $r_id = $am['room_id'];
    if (!isset($amenities_by_room[$r_id])) {
      $amenities_by_room[$r_id] = [];
    }
    $amenities_by_room[$r_id][] = $am['name']; // Đẩy tên tiện ích vào mảng tiện ích của phòng đó
  }
}

// 5. THUẬT TOÁN LỌC PHÒNG TRỐNG THEO NGÀY ĐẶT (Được gửi từ bộ lọc tìm kiếm trên thanh URL GET)
$check_in = isset($_GET['checkin']) ? mysqli_real_escape_string($conn, $_GET['checkin']) : null;
$check_out = isset($_GET['checkout']) ? mysqli_real_escape_string($conn, $_GET['checkout']) : null;

// Khởi tạo câu SQL cơ bản để lấy thông tin phòng hoạt động (is_active = TRUE) và nối bảng lấy tên view, giường, loại phòng
$query = "SELECT 
            r.id,
            r.name,
            rt.name AS type,
            r.floor,
            vt.name AS view,
            r.price,
            r.rating,
            r.review_count AS reviewCount,
            r.max_guests AS maxGuests,
            r.bed_count AS beds,
            bt.name AS bedType,
            r.size,
            r.description,
            r.is_active
          FROM ROOMS r
          LEFT JOIN ROOM_TYPES rt ON r.room_types_id = rt.id
          LEFT JOIN VIEW_TYPES vt ON r.view_type_id = vt.id
          LEFT JOIN BED_TYPES bt ON r.bed_type_id = bt.id
          WHERE r.is_active = TRUE";

// NẾU người dùng có chọn ngày check-in và check-out, ta lọc bỏ (NOT IN) những phòng đã bị trùng lịch đặt
if ($check_in && $check_out) {
  $query .= " AND r.id NOT IN (
                SELECT b.room_id FROM BOOKINGS b
                WHERE b.status != 'Cancelled' -- Không tính các đơn đã bị huỷ
                  AND b.check_in < '$check_out' -- Ngày check-in của đơn cũ nhỏ hơn ngày check-out của đơn mới
                  AND b.check_out > '$check_in' -- Ngày check-out của đơn cũ lớn hơn ngày check-in của đơn mới (Công thức giao nhau)
              )";
}

// 6. GOM TẤT CẢ DỮ LIỆU (PHÒNG + ẢNH + TIỆN ÍCH) LẠI THÀNH MỘT KHỐI JSON VÀ GỬI ĐI
$res = mysqli_query($conn, $query);
$rooms = []; // Mảng chứa kết quả cuối cùng để xuất JSON

if ($res) {
  while ($row = mysqli_fetch_assoc($res)) {
    $r_id = $row['id'];
    $rooms[] = [
      'id' => $r_id,
      'name' => $row['name'],
      'type' => $row['type'],
      'floor' => (int)$row['floor'],
      'view' => $row['view'],
      'price' => (float)$row['price'],
      'rating' => round((float)$row['rating'], 1),
      'reviewCount' => (int)$row['reviewCount'],
      'maxGuests' => (int)$row['maxGuests'],
      'beds' => (int)$row['beds'],
      'bedType' => $row['bedType'],
      'size' => (int)$row['size'],
      'image' => isset($primary_image_by_room[$r_id]) ? $primary_image_by_room[$r_id] : '', // Ảnh đại diện chính
      'images' => isset($images_by_room[$r_id]) ? $images_by_room[$r_id] : [], // Thư viện toàn bộ ảnh
      'description' => $row['description'],
      'amenities' => isset($amenities_by_room[$r_id]) ? $amenities_by_room[$r_id] : [], // Danh sách tiện ích
      'featured' => in_array($r_id, ['room-001', 'room-004', 'room-007', 'room-009', 'room-010', 'room-013', 'room-016', 'room-017', 'room-019', 'room-022']) // Đánh dấu phòng nổi bật hiển thị ở trang chủ
    ];
  }
}

// Xuất mảng kết quả dưới dạng JSON hoàn chỉnh để Javascript fetch() nhận xử lý
echo json_encode($rooms, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
