<?php
// 1. HÀM THỰC THI GHI DỮ LIỆU ĐẶT PHÒNG VÀO DATABASE BẰNG TRANSACTION
function createBookingRecord($conn, $userId, $validData) {
    // Tạo ngẫu nhiên ID đơn hàng và Mã code hiển thị (OH-NĂM-MÃ HÓA)
    $booking_id = 'bk-' . bin2hex(random_bytes(8));
    $booking_code = 'OH-' . date('Y') . '-' . strtoupper(bin2hex(random_bytes(3)));
    
    // Tạo mã hóa đơn thanh toán và mã txnRef duy nhất gửi sang cổng VNPAY
    $payment_id = 'pay-' . bin2hex(random_bytes(8));
    $vnp_TxnRef = $booking_code . '_' . time();

    $user_id_esc = mysqli_real_escape_string($conn, $userId);
    $status = 'Pending'; // Trạng thái mặc định ban đầu là chờ thanh toán
    $hold_expires_at = date('Y-m-d H:i:s', strtotime('+15 minutes')); // Thời hạn giữ chỗ là 15 phút

    // BẮT ĐẦU GIAO DỊCH DATABASE TRANSACTION (Để đảm bảo dữ liệu ghi đồng loạt, tránh ghi nửa chừng bị lỗi)
    mysqli_begin_transaction($conn);

    try {
        // A. CHÈN THÔNG TIN ĐƠN ĐẶT PHÒNG
        $insert_booking = "INSERT INTO BOOKINGS
                            (id, booking_code, user_id, room_id, check_in, check_out, guest_count,
                             guest_name, guest_email, guest_phone, special_requests, total_price, status, hold_expires_at)
                           VALUES
                            ('$booking_id', '$booking_code', '$user_id_esc', '{$validData['room_id']}', '{$validData['check_in']}', '{$validData['check_out']}', {$validData['room']['max_guests']},
                             '{$validData['guest_name']}', '{$validData['guest_email']}', '{$validData['guest_phone']}', '{$validData['special_requests']}', {$validData['total_price']}, '$status', '$hold_expires_at')";
        
        if (!mysqli_query($conn, $insert_booking)) {
            // KIỂM TRA LỖI TRÙNG LỊCH:
            // Bắt lỗi ném ra từ Database Trigger `before_booking_insert` (mã lỗi 1644 / SQLSTATE 45000)
            if (mysqli_errno($conn) == 1644 || mysqli_sqlstate($conn) === '45000') {
                throw new Exception("Selected room is already booked for these dates.");
            }
            throw new Exception('Database error while saving booking: ' . mysqli_error($conn));
        }

        // B. CHÈN THÔNG TIN GIAO DỊCH THANH TOÁN (PAYMENT) Ở TRẠNG THÁI PENDING
        $insert_payment = "INSERT INTO PAYMENTS 
                            (id, booking_id, payment_method, transaction_id, vnpay_order_id, amount, status, paid_at) 
                           VALUES 
                            ('$payment_id', '$booking_id', '{$validData['payment_method']}', NULL, '$vnp_TxnRef', {$validData['total_price']}, 'Pending', NULL)";
        
        if (!mysqli_query($conn, $insert_payment)) {
            throw new Exception('Database error while saving payment details.');
        }

        // C. GHI NHẬN HÀNH ĐỘNG VÀO LỊCH SỬ ĐƠN HÀNG (HISTORY LOG)
        $history_id = 'hist-' . bin2hex(random_bytes(8));
        $insert_history = "INSERT INTO HISTORY_BOOKING (id, booking_id, action, note) VALUES ('$history_id', '$booking_id', 'CREATED', 'Booking created, waiting for payment')";
        
        if (!mysqli_query($conn, $insert_history)) {
            throw new Exception('Database error while saving booking history.');
        }

        // NẾU TẤT CẢ CÁC BƯỚC ĐỀU THÀNH CÔNG -> TIẾN HÀNH LƯU VĨNH VIỄN VÀO DATABASE
        mysqli_commit($conn);

        return [
            'success' => true,
            'booking_id' => $booking_id,
            'booking_code' => $booking_code,
            'vnp_TxnRef' => $vnp_TxnRef
        ];

    } catch (Exception $e) {
        // NẾU CÓ BẤT KỲ BƯỚC NÀO LỖI -> HỦY BỎ (ROLLBACK) TOÀN BỘ CÁC THAY ĐỔI TRÊN ĐỂ TRÁNH DỮ LIỆU RÁC
        mysqli_rollback($conn);
        return [
            'success' => false,
            'message' => $e->getMessage()
        ];
    }
}
