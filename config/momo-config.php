<?php
// /config/momo-config.php
return [
  'endpoint' => "https://test-payment.momo.vn/v2/gateway/api/create",
  'partnerCode' => "MOMOBKUN20180529",
  'accessKey' => "klm05TvNBzhg7h7j",
  'secretKey' => "at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa",
  'redirectUrl' => "http://localhost/final_assigment/momo_return.php",
  // Link này bắt buộc phải dùng ngrok khi chạy localhost vì momo ko gửi response qua localhost được
  // ngrok http 80 sau khi turn on XAMPP Apache
  //   MoMo Sandbox Servers
  //         ↓  calls
  // https://unlightened-botanically-alpha.ngrok-free.dev/...
  //         ↓  tunneled to
  // http://localhost/final_assigment/api/momo_ipn.php
  'ipnUrl' => "https://YOUR-NGROK-URL.ngrok-free.app/final_assigment/api/momo_ipn.php"
];
