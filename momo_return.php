<?php
// /momo_return.php
// MoMo redirects the user back here after payment (success OR cancel).
// Query params: partnerCode, orderId, requestId, amount, orderInfo,
//               orderType, transId, resultCode, message, payType,
//               responseTime, extraData, signature

require_once __DIR__ . '/config/db-connection.php';
$momoConfig = require_once __DIR__ . '/config/momo-config.php';

// ---------- 1. Read params ----------
$partnerCode  = $_GET['partnerCode']  ?? '';
$orderId      = $_GET['orderId']      ?? '';
$requestId    = $_GET['requestId']    ?? '';
$amount       = $_GET['amount']       ?? '';
$orderInfo    = $_GET['orderInfo']    ?? '';
$orderType    = $_GET['orderType']    ?? '';
$transId      = $_GET['transId']      ?? '';
$resultCode   = isset($_GET['resultCode']) ? (int)$_GET['resultCode'] : -1;
$message      = $_GET['message']      ?? '';
$payType      = $_GET['payType']      ?? '';
$responseTime = $_GET['responseTime'] ?? '';
$extraData    = $_GET['extraData']    ?? '';
$receivedSig  = $_GET['signature']    ?? '';

$isSuccess = false;
$sigValid  = false;

// ---------- 2. Verify signature ----------
if ($receivedSig) {
    $rawHash = "accessKey={$momoConfig['accessKey']}"
             . "&amount=$amount"
             . "&extraData=$extraData"
             . "&message=$message"
             . "&orderId=$orderId"
             . "&orderInfo=$orderInfo"
             . "&orderType=$orderType"
             . "&partnerCode=$partnerCode"
             . "&payType=$payType"
             . "&requestId=$requestId"
             . "&responseTime=$responseTime"
             . "&resultCode=$resultCode"
             . "&transId=$transId";

    $expectedSig = hash_hmac('sha256', $rawHash, $momoConfig['secretKey']);
    $sigValid = hash_equals($expectedSig, $receivedSig);
}

$isSuccess = ($sigValid && $resultCode === 0);

// ---------- 3. Fetch booking details from DB ----------
$booking     = null;
$payment_row = null;

if ($orderId) {
    $orderId_esc = mysqli_real_escape_string($conn, $orderId);

    $payRes = mysqli_query($conn,
        "SELECT p.*, b.booking_code, b.check_in, b.check_out, b.guest_name,
                b.guest_email, b.guest_phone, b.total_price, b.status AS booking_status,
                r.name AS room_name, r.price AS room_price
         FROM PAYMENTS p
         JOIN BOOKINGS b ON p.booking_id = b.id
         JOIN ROOMS    r ON b.room_id    = r.id
         WHERE p.momo_order_id = '$orderId_esc'
         LIMIT 1"
    );
    if ($payRes) {
        $payment_row = mysqli_fetch_assoc($payRes);
        $booking = $payment_row;
    }
}

// Friendly amount formatting (VNĐ)
$amountNum   = (int)($booking['total_price'] ?? $amount);
$amountVnd   = number_format($amountNum, 0, ',', '.');

$pageTitle = $isSuccess ? "Booking Confirmed — Ocean Haven Hotel" : "Payment Failed — Ocean Haven Hotel";
?>
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?php echo $pageTitle; ?></title>
  <meta name="description" content="MoMo payment result for Ocean Haven Hotel booking.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="./assets/css/global.css">
  <style>
    /* ── Return page specific styles ── */
    body { background: var(--background); }

    .return-page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem 4rem;
    }

    .return-card {
      width: 100%;
      max-width: 480px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl, 1.25rem);
      padding: 2.5rem 2rem;
      text-align: center;
      box-shadow: 0 8px 40px -8px rgba(0,0,0,.18);
      animation: slideUp .45s cubic-bezier(.16,1,.3,1) both;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(28px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* Status icon */
    .status-icon {
      width: 72px; height: 72px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 1.25rem;
      font-size: 2rem;
    }
    .status-icon.success {
      background: #d1fae5;
      color: #059669;
      animation: popIn .5s .15s cubic-bezier(.175,.885,.32,1.275) both;
    }
    .status-icon.failure {
      background: #fee2e2;
      color: #dc2626;
      animation: popIn .5s .15s cubic-bezier(.175,.885,.32,1.275) both;
    }
    @keyframes popIn {
      from { opacity: 0; transform: scale(.5); }
      to   { opacity: 1; transform: scale(1); }
    }

    .return-card h1 {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--foreground);
      margin: 0 0 .4rem;
    }
    .return-card .subtitle {
      color: var(--muted-foreground);
      font-size: .9rem;
      margin-bottom: 1.75rem;
    }

    /* Booking summary card */
    .booking-detail-box {
      background: var(--secondary);
      border-radius: var(--radius-lg, 1rem);
      padding: 1rem 1.25rem;
      text-align: left;
      margin-bottom: 1.5rem;
    }
    .booking-detail-box .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: .45rem 0;
      border-bottom: 1px solid var(--border);
      font-size: .875rem;
    }
    .booking-detail-box .detail-row:last-child { border-bottom: none; }
    .booking-detail-box .detail-label { color: var(--muted-foreground); }
    .booking-detail-box .detail-value { font-weight: 600; color: var(--foreground); text-align: right; }
    .booking-detail-box .detail-value.primary { color: var(--primary); font-weight: 700; }

    /* MoMo badge */
    .momo-badge {
      display: inline-flex;
      align-items: center;
      gap: .4rem;
      background: #ae2070;
      color: #fff;
      font-size: .75rem;
      font-weight: 700;
      border-radius: 999px;
      padding: .25rem .75rem;
      margin-bottom: 1.25rem;
      letter-spacing: .02em;
    }
    .momo-badge-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: rgba(255,255,255,.7);
      animation: blink 1.2s infinite;
    }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }

    /* CTAs */
    .return-cta-group {
      display: flex;
      flex-direction: column;
      gap: .75rem;
    }

    .btn-success {
      display: block; width: 100%;
      padding: .875rem 1.5rem;
      background: var(--primary);
      color: #fff;
      border: none; border-radius: var(--radius-lg, .875rem);
      font-size: .95rem; font-weight: 700;
      cursor: pointer; text-decoration: none;
      text-align: center;
      transition: opacity .15s;
    }
    .btn-success:hover { opacity: .88; }

    .btn-outline-secondary {
      display: block; width: 100%;
      padding: .875rem 1.5rem;
      background: transparent;
      color: var(--foreground);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg, .875rem);
      font-size: .9rem; font-weight: 600;
      cursor: pointer; text-decoration: none;
      text-align: center;
      transition: background .15s;
    }
    .btn-outline-secondary:hover { background: var(--secondary); }

    /* Sig warning */
    .sig-warning {
      background: #fef9c3;
      border: 1px solid #fde047;
      border-radius: .75rem;
      padding: .75rem 1rem;
      color: #854d0e;
      font-size: .8rem;
      margin-bottom: 1rem;
      text-align: left;
    }

    /* Navbar override for this standalone page */
    .return-header {
      width: 100%; max-width: 480px;
      display: flex; align-items: center; gap: .6rem;
      margin-bottom: 2rem;
      text-decoration: none;
    }
    .return-logo-icon {
      width: 32px; height: 32px;
      border-radius: 50%;
      background: var(--primary);
      display: flex; align-items: center; justify-content: center;
      color: #fff;
      font-size: .85rem;
    }
    .return-logo-text {
      font-weight: 700;
      color: var(--foreground);
      font-size: .95rem;
      line-height: 1.1;
    }
    .return-logo-text span {
      display: block;
      font-weight: 400;
      color: var(--muted-foreground);
      font-size: .78rem;
    }
  </style>
</head>
<body>
  <main class="return-page">

    <!-- Mini brand header -->
    <a href="home.php" class="return-header">
      <div class="return-logo-icon">〜</div>
      <div class="return-logo-text">
        Ocean Haven Hotel
        <span>Kết quả thanh toán</span>
      </div>
    </a>

    <div class="return-card">

      <?php if (!$sigValid && $receivedSig): ?>
        <div class="sig-warning">
          ⚠️ <strong>Cảnh báo:</strong> Chữ ký MoMo không khớp. Kết quả thanh toán này có thể không hợp lệ.
        </div>
      <?php endif; ?>

      <?php if ($isSuccess): ?>
        <!-- ✅ SUCCESS -->
        <div class="status-icon success">✓</div>
        <h1>Thanh toán thành công!</h1>
        <p class="subtitle">Đặt phòng của bạn tại Ocean Haven đã được xác nhận.</p>

        <div class="momo-badge">
          <span class="momo-badge-dot"></span>
          Đã thanh toán qua MoMo
        </div>

        <?php if ($booking): ?>
        <div class="booking-detail-box">
          <div class="detail-row">
            <span class="detail-label">Mã đặt phòng</span>
            <span class="detail-value primary"><?php echo htmlspecialchars($booking['booking_code']); ?></span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Phòng</span>
            <span class="detail-value"><?php echo htmlspecialchars($booking['room_name']); ?></span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Check-in</span>
            <span class="detail-value"><?php echo date('d/m/Y', strtotime($booking['check_in'])); ?></span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Check-out</span>
            <span class="detail-value"><?php echo date('d/m/Y', strtotime($booking['check_out'])); ?></span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Khách</span>
            <span class="detail-value"><?php echo htmlspecialchars($booking['guest_name']); ?></span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Tổng tiền</span>
            <span class="detail-value primary"><?php echo $amountVnd; ?> VNĐ</span>
          </div>
          <?php if ($transId): ?>
          <div class="detail-row">
            <span class="detail-label">Mã giao dịch MoMo</span>
            <span class="detail-value" style="font-size:.8rem; font-family: monospace;"><?php echo htmlspecialchars($transId); ?></span>
          </div>
          <?php endif; ?>
        </div>
        <?php endif; ?>

        <div class="return-cta-group">
          <a href="rooms.php" class="btn-success">← Quay lại trang chủ</a>
        </div>

      <?php else: ?>
        <!-- FAILURE / CANCELLED -->
        <div class="status-icon failure">✕</div>
        <h1><?php echo $resultCode === 1006 ? 'Giao dịch bị huỷ' : 'Thanh toán thất bại'; ?></h1>
        <p class="subtitle">
          <?php
            if ($resultCode === 1006) {
              echo "Bạn đã huỷ giao dịch. Đặt phòng đã bị xoá. Vui lòng thử lại.";
            } else {
              echo htmlspecialchars($message ?: 'Thanh toán không thành công. Vui lòng thử lại hoặc chọn phương thức khác.');
            }
          ?>
        </p>

        <?php if ($orderId): ?>
        <div class="booking-detail-box">
          <div class="detail-row">
            <span class="detail-label">Mã đơn</span>
            <span class="detail-value" style="font-size:.8rem; font-family:monospace;"><?php echo htmlspecialchars($orderId); ?></span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Mã lỗi MoMo</span>
            <span class="detail-value" style="color:#dc2626;"><?php echo $resultCode; ?></span>
          </div>
        </div>
        <?php endif; ?>

        <div class="return-cta-group">
          <a href="rooms.php" class="btn-success">Chọn phòng và thử lại</a>
          <a href="home.php" class="btn-outline-secondary">Về trang chủ</a>
        </div>

      <?php endif; ?>

    </div><!-- /.return-card -->
  </main>

  <script src="https://unpkg.com/lucide@latest"></script>
  <script>if (window.lucide) lucide.createIcons();</script>
</body>
</html>
