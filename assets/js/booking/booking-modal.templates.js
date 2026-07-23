// ** Booking modal HTML ** //
// Pure HTML-string builders for the booking modal.
// No DOM access, no event binding — just data in, HTML string out.

const fmtVND = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

export function renderBookingSummaryStep({ room, checkInVal, checkOutVal, nights, subtotal, taxes, total, formValues }) {
    return `
    <div class="modal-header">
      <h2>Review Booking</h2>
      <button class="modal-close-btn" id="close-booking-btn">
        <i data-lucide="x" style="width: 18px; height: 18px;"></i>
      </button>
    </div>
    <div class="modal-body">
      <div class="space-y-5">
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

        <div class="booking-summary-guests" style="justify-content: space-between; align-items: center; display: flex;">
          <div class="flex items-center gap-2">
            <i data-lucide="user" class="text-primary" style="width: 18px; height: 18px;"></i>
            <span>Max guests ${room.maxGuests}</span>
          </div>
        </div>

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

          <div class="price-breakdown">
            <h3>Price Breakdown</h3>
            <div class="price-breakdown-row">
              <span class="text-muted-foreground" id="breakdown-nights-label">${fmtVND(room.price)} × ${nights} nights</span>
              <span class="font-medium" id="breakdown-subtotal-val">${fmtVND(subtotal)}</span>
            </div>
            <div class="price-breakdown-row">
              <span class="text-muted-foreground">Taxes & fees (10%)</span>
              <span class="font-medium" id="breakdown-taxes-val">${fmtVND(taxes)}</span>
            </div>
            <div class="price-breakdown-total price-breakdown-row">
              <span>Total</span>
              <span id="breakdown-total-val">${fmtVND(total)}</span>
            </div>
          </div>

          <button type="submit" class="btn-block btn-primary" id="modal-submit-btn">Proceed to Payment — ${fmtVND(total)}</button>
        </form>
      </div>
    </div>
  `;
}

export function renderBookingPaymentStep({ room, checkinLabel, checkoutLabel, nights, formValues, total }) {
    return `
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
        <div class="vnpay-banner">
          <div class="vnpay-logo">VNPAY</div>
          <h3 class="font-bold text-foreground text-lg mb-1">Pay via VNPAY</h3>
          <p class="text-muted-foreground text-sm">You will be redirected to the VNPAY payment page.</p>
        </div>

        <div class="price-input-box" style="padding: 0.75rem 1rem; border-radius: var(--radius-lg); background-color: var(--secondary);">
          <p class="text-xs text-muted-foreground mb-1">Total payment</p>
          <p class="text-3xl font-bold text-foreground">${fmtVND(total)}</p>
        </div>

        <div class="booking-confirm-card" style="font-size: 0.85rem;">
          <div class="booking-confirm-row">
            <span class="text-muted-foreground">Room</span>
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
            <span class="text-muted-foreground">Number of nights</span>
            <span class="font-semibold">${nights} đêm</span>
          </div>
          <div class="booking-confirm-row">
            <span class="text-muted-foreground">Guest</span>
            <span class="font-semibold">${formValues.name}</span>
          </div>
        </div>

        <div id="vnpay-api-error" style="display:none; color: #e53e3e; font-size: 0.85rem; text-align:center; background: #fff5f5; border-radius: 8px; padding: 0.6rem 1rem;"></div>

        <div class="space-y-2">
          <button type="button" class="btn-block btn-primary" id="vnpay-pay-btn">
            <span id="vnpay-btn-text">Pay via VNPAY →</span>
            <span id="vnpay-btn-spinner" style="display:none;">Processing…</span>
          </button>
        </div>

        <p class="text-center text-xs text-muted-foreground">You will be redirected to VNPAY secure payment page.</p>
      </div>
    </div>
  `;
}

export const BookingModalTemplates = {
    renderBookingSummaryStep,
    renderBookingPaymentStep,
};

window.BookingModalTemplates = BookingModalTemplates;
export default BookingModalTemplates;