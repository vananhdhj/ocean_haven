async function openBookingModal(roomId) {
  const room = window.HotelDb.getRoomById(roomId);
  if (!room) return;

  // Require login before booking
  const profile = await window.HotelDb.getProfile();
  if (!profile) {
    window.HotelDb.redirectToLogin(window.location.href);
    return;
  }

  let dialog = document.getElementById('booking-modal');
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.id = 'booking-modal';
    document.body.appendChild(dialog);
  }

  // Booking review dates default to null (empty), nights default to 0
  let checkInVal = null;
  let checkOutVal = null;
  let nights = 0;
  let subtotal = 0;
  let taxes = 0;
  let total = 0;

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  let checkinLabel = formatDate(checkInVal);
  let checkoutLabel = formatDate(checkOutVal);

  const recalculatePrices = () => {
    if (checkInVal && checkOutVal) {
      const d = (new Date(checkOutVal).getTime() - new Date(checkInVal).getTime()) / 86400000;
      nights = Math.max(0, Math.round(d));
    } else {
      nights = 0;
    }
    subtotal = room.price * nights;
    taxes = Math.round(subtotal * 0.1);
    total = subtotal + taxes;

    checkinLabel = formatDate(checkInVal);
    checkoutLabel = formatDate(checkOutVal);
  };

  recalculatePrices();

  let currentStep = "summary";
  let formValues = {
    name: profile.name,
    phone: profile.phone,
    email: profile.email,
    requests: ""
  };

  const renderContent = () => {
    if (currentStep === "summary") {
      dialog.innerHTML = `
        <div class="modal-header">
          <h2>Review Booking</h2>
          <button class="modal-close-btn" id="close-booking-btn">
            <i data-lucide="x" style="width: 18px; height: 18px;"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="space-y-5">
            <!-- Room info -->
            <div class="booking-summary-room">
              <img src="${room.image}" alt="${room.name}" class="booking-summary-img">
              <div>
                <h4 class="font-bold text-foreground text-sm">${room.name}</h4>
                <p class="text-xs text-muted-foreground">${room.type} · Floor ${room.floor} · ${room.view}</p>
                <div class="flex items-center gap-1 mt-1 text-xs">
                  <i data-lucide="star" class="star-icon" style="width: 12px; height: 12px;"></i>
                  <span class="font-bold">${room.rating}</span>
                </div>
              </div>
            </div>

            <!-- Dates -->
            <div class="booking-summary-dates">
              <div class="date-box" style="display: flex; flex-direction: column; justify-content: space-between;">
                <p>Check-in</p>
                <input type="date" id="modal-check-in-input" value="${checkInVal || ''}" min="${new Date().toISOString().split("T")[0]}" class="modal-date-picker">
              </div>
              <div class="date-box date-box-highlight" style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <p>Nights</p>
                <p><span id="modal-nights-val">${nights}</span></p>
              </div>
              <div class="date-box" style="display: flex; flex-direction: column; justify-content: space-between;">
                <p>Check-out</p>
                <input type="date" id="modal-check-out-input" value="${checkOutVal || ''}" class="modal-date-picker">
              </div>
            </div>

            <!-- Guests -->
            <div class="booking-summary-guests" style="justify-content: space-between; align-items: center; display: flex;">
              <div class="flex items-center gap-2">
                <i data-lucide="user" class="text-primary" style="width: 18px; height: 18px;"></i>
                <span>Max guests ${room.maxGuests}</span>
              </div>
            </div>

            <!-- Guest Form -->
            <form id="booking-details-form" class="space-y-3" style="text-align: left;">
              <h3 class="font-bold text-foreground text-base">Guest Information</h3>
              <div class="form-group">
                <label>Full Name</label>
                <input type="text" class="form-control" name="name" value="${formValues.name}" required>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Phone</label>
                  <input type="text" class="form-control" name="phone" value="${formValues.phone}" required>
                </div>
                <div class="form-group">
                  <label>Email</label>
                  <input type="email" class="form-control" name="email" value="${formValues.email}" required>
                </div>
              </div>
              <div class="form-group">
                <label>Special Requests (optional)</label>
                <textarea class="form-control" name="requests" rows="2" placeholder="Early check-in, extra pillows, cot…">${formValues.requests}</textarea>
              </div>

              <!-- Price breakdown -->
              <div class="price-breakdown">
                <h3>Price Breakdown</h3>
                <div class="price-breakdown-row">
                  <span class="text-muted-foreground" id="breakdown-nights-label">${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(room.price)} × ${nights} nights</span>
                  <span class="font-medium" id="breakdown-subtotal-val">${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(subtotal)}</span>
                </div>
                <div class="price-breakdown-row">
                  <span class="text-muted-foreground">Taxes & fees (10%)</span>
                  <span class="font-medium" id="breakdown-taxes-val">${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(taxes)}</span>
                </div>
                <div class="price-breakdown-total price-breakdown-row">
                  <span>Total</span>
                  <span id="breakdown-total-val">${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}</span>
                </div>
              </div>

              <button type="submit" class="btn-block btn-primary" id="modal-submit-btn">Proceed to Payment — ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}</button>
            </form>
          </div>
        </div>
      `;

      if (window.lucide) window.lucide.createIcons();

      // Date Picker controls
      const modalCheckInInput = dialog.querySelector("#modal-check-in-input");
      const modalCheckOutInput = dialog.querySelector("#modal-check-out-input");
      const modalNightsVal = dialog.querySelector("#modal-nights-val");
      const breakdownNightsLabel = dialog.querySelector("#breakdown-nights-label");
      const breakdownSubtotalVal = dialog.querySelector("#breakdown-subtotal-val");
      const breakdownTaxesVal = dialog.querySelector("#breakdown-taxes-val");
      const breakdownTotalVal = dialog.querySelector("#breakdown-total-val");
      const modalSubmitBtn = dialog.querySelector("#modal-submit-btn");

      // Set checkout input min date if check-in is set
      if (checkInVal) {
        modalCheckOutInput.min = checkInVal;
      }

      const updateModalPrices = () => {
        recalculatePrices();
        modalNightsVal.textContent = nights;
        breakdownNightsLabel.textContent = `${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(room.price)} × ${nights} night${nights !== 1 ? "s" : ""}`;
        breakdownSubtotalVal.textContent = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(subtotal);
        breakdownTaxesVal.textContent = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(taxes);
        breakdownTotalVal.textContent = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total);
        modalSubmitBtn.textContent = `Proceed to Payment — ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}`;
      };

      modalCheckInInput.addEventListener("change", (e) => {
        checkInVal = e.target.value;
        modalCheckOutInput.min = checkInVal;
        if (checkOutVal && new Date(checkOutVal) <= new Date(checkInVal)) {
          const checkInDate = new Date(checkInVal);
          checkInDate.setDate(checkInDate.getDate() + 3);
          checkOutVal = checkInDate.toISOString().split("T")[0];
          modalCheckOutInput.value = checkOutVal;
        }
        updateModalPrices();
      });

      modalCheckOutInput.addEventListener("change", (e) => {
        checkOutVal = e.target.value;
        if (checkInVal && new Date(checkOutVal) <= new Date(checkInVal)) {
          alert("Check-out date must be after check-in date.");
          checkOutVal = "";
          modalCheckOutInput.value = "";
        }
        updateModalPrices();
      });

      const detailsForm = dialog.querySelector("#booking-details-form");
      detailsForm.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!checkInVal || !checkOutVal) {
          alert("Please select both check-in and check-out dates.");
          return;
        }
        if (nights <= 0) {
          alert("Booking must be at least 1 night.");
          return;
        }
        const data = new FormData(detailsForm);
        formValues = {
          name: data.get("name"),
          phone: data.get("phone"),
          email: data.get("email"),
          requests: data.get("requests")
        };
        currentStep = "payment";
        renderContent();
      });

      dialog.querySelector("#close-booking-btn").addEventListener("click", () => dialog.close());
    } else if (currentStep === "payment") {
      dialog.innerHTML = `
        <div class="modal-header">
          <div class="modal-header-left">
            <button class="modal-close-btn" id="booking-back-btn">
              <i data-lucide="chevron-left" style="width: 16px; height: 16px;"></i>
            </button>
            <h2>Payment</h2>
          </div>
          <button class="modal-close-btn" id="close-booking-btn">
            <i data-lucide="x" style="width: 18px; height: 18px;"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="space-y-6">
            <div class="momo-banner">
              <div class="momo-logo">M</div>
              <h3 class="font-bold text-foreground text-lg mb-1">Thanh toán qua MoMo</h3>
              <p class="text-muted-foreground text-sm">Bạn sẽ được chuyển đến trang thanh toán MoMo</p>
            </div>

            <div class="price-input-box" style="padding: 0.75rem 1rem; border-radius: var(--radius-lg); background-color: var(--secondary);">
              <p class="text-xs text-muted-foreground mb-1">Tổng tiền thanh toán</p>
              <p class="text-3xl font-bold text-foreground">${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}</p>
            </div>

            <div class="booking-confirm-card" style="font-size: 0.85rem;">
              <div class="booking-confirm-row">
                <span class="text-muted-foreground">Phòng</span>
                <span class="font-semibold">${room.name}</span>
              </div>
              <div class="booking-confirm-row">
                <span class="text-muted-foreground">Check-in</span>
                <span class="font-semibold">${checkinLabel}</span>
              </div>
              <div class="booking-confirm-row">
                <span class="text-muted-foreground">Check-out</span>
                <span class="font-semibold">${checkoutLabel}</span>
              </div>
              <div class="booking-confirm-row">
                <span class="text-muted-foreground">Số đêm</span>
                <span class="font-semibold">${nights} đêm</span>
              </div>
              <div class="booking-confirm-row">
                <span class="text-muted-foreground">Khách</span>
                <span class="font-semibold">${formValues.name}</span>
              </div>
            </div>

            <div id="momo-api-error" style="display:none; color: #e53e3e; font-size: 0.85rem; text-align:center; background: #fff5f5; border-radius: 8px; padding: 0.6rem 1rem;"></div>

            <div class="space-y-2">
              <button type="button" class="btn-block momo-color-btn" id="momo-pay-btn">
                <span id="momo-btn-text">Thanh toán với MoMo →</span>
                <span id="momo-btn-spinner" style="display:none;">Đang xử lý…</span>
              </button>
            </div>

            <p class="text-center text-xs text-muted-foreground">Bạn sẽ được chuyển hướng đến trang thanh toán bảo mật của MoMo.</p>
          </div>
        </div>
      `;

      if (window.lucide) window.lucide.createIcons();

      dialog.querySelector("#booking-back-btn").addEventListener("click", () => {
        currentStep = "summary";
        renderContent();
      });

      dialog.querySelector("#momo-pay-btn").addEventListener("click", async () => {
        const btn = dialog.querySelector("#momo-pay-btn");
        const btnText = dialog.querySelector("#momo-btn-text");
        const btnSpinner = dialog.querySelector("#momo-btn-spinner");
        const errorBox = dialog.querySelector("#momo-api-error");

        btn.disabled = true;
        btnText.style.display = "none";
        btnSpinner.style.display = "inline";
        errorBox.style.display = "none";

        try {
          const payload = {
            room_id: room.id,
            check_in: checkInVal,
            check_out: checkOutVal,
            guest_name: formValues.name,
            guest_email: formValues.email,
            guest_phone: formValues.phone,
            special_requests: formValues.requests,
            payment_method: "MoMo"
          };

          const response = await fetch("./api/create_booking.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });

          const data = await response.json();

          if (data.success && data.payUrl) {
            window.location.href = data.payUrl;
          } else {
            errorBox.textContent = data.message || "Không thể kết nối MoMo. Vui lòng thử lại.";
            errorBox.style.display = "block";
            btn.disabled = false;
            btnText.style.display = "inline";
            btnSpinner.style.display = "none";
          }
        } catch (err) {
          errorBox.textContent = "Lỗi kết nối mạng. Vui lòng kiểm tra lại.";
          errorBox.style.display = "block";
          btn.disabled = false;
          btnText.style.display = "inline";
          btnSpinner.style.display = "none";
        }
      });

      dialog.querySelector("#close-booking-btn").addEventListener("click", () => dialog.close());
      // "success" step is now handled by momo_return.php after MoMo redirects back
    }

    // Để lại coi chơi thôi
    // else if (currentStep === "success") {
    //   dialog.innerHTML = `
    //     <div class="modal-header">
    //       <h2 style="text-align: center; width: 100%;">Booking Confirmed!</h2>
    //     </div>
    //     <div class="modal-body text-center">
    //       <div class="space-y-5 py-4">
    //         <div class="success-icon-box">
    //           <i data-lucide="check-circle" style="width: 44px; height: 44px;"></i>
    //         </div>
    //         <div>
    //           <h3 class="text-2xl font-bold text-foreground mb-2">All Set!</h3>
    //           <p class="text-muted-foreground text-sm">Your reservation at Ocean Haven Hotel is confirmed.</p>
    //         </div>

    //         <div class="booking-confirm-card">
    //           <div class="booking-confirm-row">
    //             <span class="text-xs text-muted-foreground font-semibold uppercase">Booking ID</span>
    //             <span class="font-mono font-bold text-primary">${confirmId}</span>
    //           </div>
    //           <div class="booking-confirm-row">
    //             <span class="text-muted-foreground text-sm">Room</span>
    //             <span class="font-semibold text-foreground text-sm">${room.name}</span>
    //           </div>
    //           <div class="booking-confirm-row">
    //             <span class="text-muted-foreground text-sm">Dates</span>
    //             <span class="font-semibold text-foreground text-sm">${checkinLabel} → ${checkoutLabel}</span>
    //           </div>
    //           <div class="booking-confirm-row">
    //             <span class="text-muted-foreground text-sm">Guests</span>
    //             <span class="font-semibold text-foreground text-sm">${room.maxGuests} guest${room.maxGuests !== 1 ? "s" : ""}</span>
    //           </div>
    //           <div class="booking-confirm-row" style="border-top: 1px solid var(--border); padding-top: 0.625rem; font-weight: 700;">
    //             <span>Total Paid</span>
    //             <span class="text-primary">$${total}</span>
    //           </div>
    //         </div>

    //         <p class="text-xs text-muted-foreground">A confirmation email has been sent to <span class="text-foreground font-bold">${formValues.email}</span></p>

    //         <button type="button" class="btn-block btn-primary" id="success-done-btn">Back to Hotel</button>
    //       </div>
    //     </div>
    //   `;

    //   if (window.lucide) window.lucide.createIcons();

    //   dialog.querySelector("#success-done-btn").addEventListener("click", () => {
    //     dialog.close();
    //     window.location.reload();
    //   });
    // }
  };

  renderContent();
  dialog.showModal();
}

window.openBookingModal = openBookingModal;
