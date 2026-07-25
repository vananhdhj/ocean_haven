<?php
// 1. ĐỊNH NGHĨA HÀM KIỂM TRA TÍNH HỢP LỆ CỦA ĐƠN ĐẶT PHÒNG
function validateBookingInput($conn, $input) {
    // 2. THU THẬP VÀ LÀM SẠCH DỮ LIỆU ĐẦU VÀO ĐỂ TRÁNH SQL INJECTION
    $room_id = isset($input['room_id']) ? mysqli_real_escape_string($conn, $input['room_id']) : null;
    $check_in = isset($input['check_in']) ? mysqli_real_escape_string($conn, $input['check_in']) : null;
    $check_out = isset($input['check_out']) ? mysqli_real_escape_string($conn, $input['check_out']) : null;
    $guest_name = isset($input['guest_name']) ? mysqli_real_escape_string($conn, $input['guest_name']) : null;
    $guest_email = isset($input['guest_email']) ? mysqli_real_escape_string($conn, $input['guest_email']) : null;
    $guest_phone = isset($input['guest_phone']) ? mysqli_real_escape_string($conn, $input['guest_phone']) : null;
    
    // Các tùy chọn bổ sung
    $special_requests = isset($input['special_requests']) ? mysqli_real_escape_string($conn, $input['special_requests']) : '';
    $payment_method = isset($input['payment_method']) ? mysqli_real_escape_string($conn, $input['payment_method']) : 'VNPAY';

    // 3. BẮT BUỘC ĐIỀN ĐẦY ĐỦ THÔNG TIN CƠ BẢN
    if (!$room_id || !$check_in || !$check_out || !$guest_name || !$guest_email || !$guest_phone) {
        return ['success' => false, 'message' => 'All booking details are required.'];
    }

    // 4. KIỂM TRA LÀM RÀNG BUỘC THỜI GIAN
    $today = date('Y-m-d');
    if ($check_in < $today) { // Ngày check-in không được là ngày trong quá khứ
        return ['success' => false, 'message' => 'Check-in date cannot be in the past.'];
    }
    if ($check_out <= $check_in) { // Ngày check-out phải diễn ra sau ngày check-in ít nhất 1 ngày
        return ['success' => false, 'message' => 'Check-out date must be after check-in date.'];
    }

    // 5. XÁC THỰC PHÒNG ĐƯỢC CHỌN CÓ TỒN TẠI VÀ ĐANG HOẠT ĐỘNG KHÔNG
    $room_query = "SELECT * FROM ROOMS WHERE id = '$room_id' AND is_active = TRUE LIMIT 1";
    $room_res = mysqli_query($conn, $room_query);
    $room = mysqli_fetch_assoc($room_res);

    if (!$room) {
        return ['success' => false, 'message' => 'Selected room is invalid or currently inactive.'];
    }

    // 6. TÍNH TOÁN SỐ ĐÊM LƯU TRÚ
    $check_in_date = new DateTime($check_in);
    $check_out_date = new DateTime($check_out);
    $interval = $check_in_date->diff($check_out_date);
    $nights = (int)$interval->days; // Số đêm nghỉ thực tế

    if ($nights < 1) { // Phải đặt tối thiểu 1 đêm
        return ['success' => false, 'message' => 'Booking must be at least 1 night.'];
    }

    // 7. TÍNH TOÁN GIÁ TIỀN (BAO GỒM 10% THUẾ)
    $room_price = (float)$room['price'];
    $subtotal = $room_price * $nights; // Giá phòng gốc
    $tax = $subtotal * 0.10; // Tính 10% thuế VAT
    $total_price = $subtotal + $tax; // Tổng số tiền cần thanh toán

    // 8. TRẢ VỀ DỮ LIỆU ĐÃ HỢP LỆ VÀ SẴN SÀNG LƯU TRỮ
    return [
        'success' => true,
        'data' => [
            'room' => $room,
            'room_id' => $room_id,
            'check_in' => $check_in,
            'check_out' => $check_out,
            'guest_name' => $guest_name,
            'guest_email' => $guest_email,
            'guest_phone' => $guest_phone,
            'special_requests' => $special_requests,
            'payment_method' => $payment_method,
            'total_price' => $total_price
        ]
    ];
}
