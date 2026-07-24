// Đợi toàn bộ cây tài liệu HTML (DOM) được tải xong mới chạy Javascript để đảm bảo các nút bấm đã tồn tại
document.addEventListener('DOMContentLoaded', () => {
  // 1. CÁC BIẾN CẤU HÌNH PHÂN TRANG (PAGINATION) CHO BẢNG CHECK-IN
  const rows = document.querySelectorAll('.checkin-row'); // Lấy tất cả các dòng check-in có class .checkin-row
  const paginationContainer = document.getElementById('checkins-pagination-container'); // Vùng chứa nút phân trang HTML
  const itemsPerPage = 10; // Cấu hình hiển thị tối đa 10 đơn hàng trên một trang
  let currentPage = 1; // Trang hiện tại mặc định bắt đầu từ trang 1
  const totalPages = Math.ceil(rows.length / itemsPerPage); // Tính tổng số trang (Ví dụ: 15 đơn / 10 = 1.5 -> Làm tròn lên thành 2 trang)

  // 2. HÀM VẼ RA CÁC NÚT PHÂN TRANG HTML (Prev, Số trang, Next)
  function renderPagination() {
    if (totalPages <= 1) { // Nếu chỉ có tối đa 1 trang thì ẩn luôn thanh phân trang đi
      if (paginationContainer) paginationContainer.style.display = 'none';
      return;
    }

    if (paginationContainer) paginationContainer.style.display = 'flex'; // Hiện thanh phân trang

    let html = '';
    // Tạo nút bấm quay về trang trước (Prev), vô hiệu hóa (disabled) nếu đang ở trang 1
    html += `<button type="button" class="btn-pagination prev-page" ${currentPage === 1 ? 'disabled' : ''}>Prev</button>`;
    
    // Vòng lặp vẽ ra các nút số trang (1, 2, 3...)
    for (let i = 1; i <= totalPages; i++) {
      const activeClass = i === currentPage ? 'active' : ''; // Đánh dấu class active cho trang hiện tại
      html += `<button type="button" class="btn-pagination page-num ${activeClass}" data-page="${i}">${i}</button>`;
    }
    
    // Tạo nút bấm trang tiếp theo (Next), vô hiệu hóa nếu đang ở trang cuối cùng
    html += `<button type="button" class="btn-pagination next-page" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>`;

    if (paginationContainer) {
      paginationContainer.innerHTML = html; // Đổ mã HTML nút phân trang vào container

      // Tìm và gán sự kiện click cho các nút phân trang vừa vẽ ra
      const prevBtn = paginationContainer.querySelector('.prev-page');
      const nextBtn = paginationContainer.querySelector('.next-page');
      const pageBtns = paginationContainer.querySelectorAll('.page-num');

      // Sự kiện nút Prev
      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          if (currentPage > 1) {
            currentPage--;
            updateCheckinRows(); // Tải lại giao diện dòng
          }
        });
      }

      // Sự kiện nút Next
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          if (currentPage < totalPages) {
            currentPage++;
            updateCheckinRows(); // Tải lại giao diện dòng
          }
        });
      }

      // Sự kiện click trực tiếp vào các nút số trang
      pageBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          currentPage = parseInt(btn.getAttribute('data-page')); // Lấy số trang được nhấn từ data attribute
          updateCheckinRows(); // Tải lại giao diện dòng
        });
      });
    }
  }

  // 3. HÀM CẬP NHẬT ẨN/HIỆN CÁC DÒNG ĐƠN ĐẶT PHÒNG THEO SỐ TRANG HIỆN TẠI
  function updateCheckinRows() {
    const startIndex = (currentPage - 1) * itemsPerPage; // Vị trí đơn bắt đầu của trang (Ví dụ trang 2 bắt đầu từ vị trí đơn thứ 10)
    const endIndex = startIndex + itemsPerPage; // Vị trí đơn kết thúc của trang

    rows.forEach((row, index) => {
      // Chỉ hiển thị các dòng nằm trong khoảng trang hiện tại, ẩn các dòng khác đi
      if (index >= startIndex && index < endIndex) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });

    renderPagination(); // Vẽ lại nút phân trang để cập nhật nút nào bị disabled hoặc active
  }

  // Chạy lần đầu tiên để phân trang bảng danh sách check-in ngay khi vừa mở trang quản trị
  updateCheckinRows();

  // 4. XỬ LÝ HÀNH ĐỘNG CHECK-OUT KHÔNG CẦN F5 TRANG (DÙNG AJAX FETCH)
  document.querySelectorAll('.checkout-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to Check-out this booking?')) return; // Hiện hộp thoại xác nhận trước khi thực hiện

      const bookingId = btn.getAttribute('data-id'); // Lấy ID của đơn từ thuộc tính data-id trên nút bấm
      const originalText = btn.textContent;
      
      // Chuyển nút bấm sang trạng thái chờ để tránh việc click đúp gửi request nhiều lần
      btn.textContent = 'Wait...';
      btn.disabled = true;

      try {
        // Gửi request POST lên API cập nhật trạng thái đơn đặt phòng
        const res = await fetch('/ocean_haven/api/bookings/update_booking_status.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ booking_id: bookingId, status: 'Completed' }) // Yêu cầu chuyển trạng thái đơn sang 'Completed'
        });
        const result = await res.json();

        if (result.success) {
          // THÀNH CÔNG: Tìm và đổi nội dung thẻ trạng thái (badge) sang Completed ngay lập tức trên UI
          const statusPills = document.querySelectorAll('#status-' + bookingId);
          statusPills.forEach(pill => {
            pill.textContent = 'Completed';
            pill.className = 'status-pill pill-completed'; // Cập nhật class CSS để chuyển màu badge
          });
          // Ẩn nút Check-out và thay thế bằng dấu gạch ngang (Vì đã hoàn tất đơn hàng)
          btn.parentElement.innerHTML = '<span style="color:var(--muted-foreground); font-size:0.875rem;">—</span>';
        } else {
          alert(result.message || 'Error updating status');
          btn.textContent = originalText;
          btn.disabled = false; // Phục hồi lại nút nếu bị lỗi
        }
      } catch (err) {
        console.error(err);
        alert('Network error');
        btn.textContent = originalText;
        btn.disabled = false;
      }
    });
  });

  // 5. XỬ LÝ HÀNH ĐỘNG HỦY ĐƠN (CANCEL BOOKING) BẰNG AJAX FETCH KHÔNG CẦN F5 TRANG
  document.querySelectorAll('.cancel-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to Cancel this booking?')) return;

      const bookingId = btn.getAttribute('data-id'); // Lấy ID đơn hàng
      const originalText = btn.textContent;
      
      // Vô hiệu hoá nút để chờ xử lý
      btn.textContent = 'Wait...';
      btn.disabled = true;

      try {
        // Gửi yêu cầu huỷ đơn lên API huỷ đặt phòng
        const res = await fetch('/ocean_haven/api/bookings/cancel_booking.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ booking_id: bookingId })
        });
        const result = await res.json();

        if (result.success) {
          // THÀNH CÔNG: Đổi nội dung thẻ trạng thái sang 'Cancelled' và đổi class màu CSS sang đỏ
          const statusPills = document.querySelectorAll('#status-' + bookingId);
          statusPills.forEach(pill => {
            pill.textContent = 'Cancelled';
            pill.className = 'status-pill pill-cancelled';
          });
          // Xoá các nút bấm hành động và thay thế bằng dấu gạch ngang
          btn.parentElement.innerHTML = '<span style="color:var(--muted-foreground); font-size:0.875rem;">—</span>';
        } else {
          alert(result.message || 'Error cancelling booking');
          btn.textContent = originalText;
          btn.disabled = false;
        }
      } catch (err) {
        console.error(err);
        alert('Network error');
        btn.textContent = originalText;
        btn.disabled = false;
      }
    });
  });
});
