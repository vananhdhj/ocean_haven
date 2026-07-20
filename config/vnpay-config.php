<?php
date_default_timezone_set('Asia/Ho_Chi_Minh');
/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

  $vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
  $vnp_TmnCode = "IYJSDEB6"; //Mã định danh merchant kết nối (Terminal Id)
  $vnp_HashSecret = "FPD0CRXG3WIX3CEIIJ6TNEZH74E12K4R"; //Secret key
  $vnp_ReturnUrl = "http://localhost/final_assigment/vnpay_return.php";
  $vnp_IpnUrl = "https://unlightened-botanically-alpha.ngrok-free.dev/final_assigment/api/vnpay_ipn.php"; // URL xử lý IPN (Webhook)
//Config input format
//Expire
$startTime = date("YmdHis"); // Thời gian bắt đầu tạo hóa đơn
$expire = date('YmdHis', strtotime('+15 minutes', strtotime($startTime))); // Thời gian hết hạn hóa đơn (15 phút sau khi tạo)