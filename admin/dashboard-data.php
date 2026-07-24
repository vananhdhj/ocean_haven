<?php
// 1. HÀM TỔNG HỢP SỐ LIỆU THỐNG KÊ DOANH THU & SỐ LƯỢNG ĐƠN HÀNG
function getDashboardStats($conn) {
    $stats = [];
    
    // Đếm tổng số lượng đơn đặt phòng hiện có
    $stats['total_bookings'] = (int)(mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) AS c FROM BOOKINGS"))['c'] ?? 0);
    
    // Đếm tổng số đơn đã được xác nhận (Đã thanh toán VNPAY thành công)
    $stats['confirmed']      = (int)(mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) AS c FROM BOOKINGS WHERE status='Confirmed'"))['c'] ?? 0);
    
    // Đếm tổng số đơn đang chờ thanh toán (Pending)
    $stats['pending']        = (int)(mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) AS c FROM BOOKINGS WHERE status='Pending'"))['c'] ?? 0);
    
    // Đếm tổng số đơn đã bị hủy (Cancelled)
    $stats['cancelled']      = (int)(mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) AS c FROM BOOKINGS WHERE status='Cancelled'"))['c'] ?? 0);
    
    // Đếm tổng số khách hàng đăng ký tài khoản (Loại bỏ các tài khoản Admin)
    $stats['total_users']    = (int)(mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) AS c FROM USERS WHERE role='user'"))['c'] ?? 0);
    
    // Tính tổng doanh thu thực tế nhận được (Tổng số tiền giao dịch đã thanh toán thành công)
    $revenue_row             = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COALESCE(SUM(amount),0) AS rev FROM PAYMENTS WHERE status='Completed'"));
    $stats['total_revenue']  = (float)($revenue_row['rev'] ?? 0);
    
    // Đếm tổng số phòng đang hoạt động của khách sạn
    $stats['total_rooms']    = (int)(mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) AS c FROM ROOMS WHERE is_active=1"))['c'] ?? 0);
    
    return $stats;
}

// 2. HÀM TRUY VẤN TÌM KIẾM ĐƠN ĐẶT PHÒNG THEO SỐ ĐIỆN THOẠI KHÁCH HÀNG
function searchBookingsByPhone($conn, $phone_search) {
    $search_results = [];
    if (trim($phone_search) !== '') {
        $phone_esc = mysqli_real_escape_string($conn, trim($phone_search)); // Làm sạch chuỗi
        
        // Thực thi truy vấn SQL nối 4 bảng (Bookings, Rooms, Users, Payments) tìm theo SĐT khách ghi trên đơn hoặc SĐT đăng ký tài khoản
        $search_res = mysqli_query($conn,
            "SELECT b.id AS booking_id, b.booking_code, b.guest_name, b.guest_phone, b.check_in, b.check_out, b.total_price, b.status, b.create_at,
                    r.name AS room_name, u.email AS user_email, u.phone AS user_phone,
                    p.status AS payment_status
             FROM BOOKINGS b
             LEFT JOIN ROOMS r ON b.room_id = r.id
             LEFT JOIN USERS u ON b.user_id = u.id
             LEFT JOIN PAYMENTS p ON b.id = p.booking_id
             WHERE b.guest_phone LIKE '%$phone_esc%' OR u.phone LIKE '%$phone_esc%'
             ORDER BY b.check_in DESC"
        );
        while ($row = mysqli_fetch_assoc($search_res)) {
            $search_results[] = $row; // Nạp các dòng kết quả tìm thấy vào mảng
        }
    }
    return $search_results;
}

// 3. HÀM LẤY TOÀN BỘ LỊCH TRÌNH NHẬN PHÒNG (CHECK-IN SCHEDULE) SẮP XẾP MỚI NHẤT LÊN ĐẦU
function getCheckinsByDate($conn) {
    $checkins_res = mysqli_query($conn,
        "SELECT b.id AS booking_id, b.booking_code, b.guest_name, b.guest_phone, b.check_in, b.check_out, b.total_price, b.status,
                r.name AS room_name, u.email AS user_email, u.phone AS user_phone,
                p.status AS payment_status
         FROM BOOKINGS b
         LEFT JOIN ROOMS r ON b.room_id = r.id
         LEFT JOIN USERS u ON b.user_id = u.id
         LEFT JOIN PAYMENTS p ON b.id = p.booking_id
         ORDER BY b.check_in DESC"
    );
    $checkins_by_date = [];
    while ($row = mysqli_fetch_assoc($checkins_res)) {
        $checkins_by_date[] = $row; // Nạp toàn bộ danh sách check-in vào mảng
    }
    return $checkins_by_date;
}
