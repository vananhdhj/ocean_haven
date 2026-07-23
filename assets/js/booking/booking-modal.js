// ** Booking modal controller ** //
import { HotelDb } from '../global.js';
import { BookingModalTemplates } from './booking-modal.templates.js';

const fmtVNDBooking = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

export async function openBookingModal(roomId) {
    const room = HotelDb.getRoomById(roomId);
    if (!room) return;

    const profile = await HotelDb.getProfile();
    if (!profile) {
        HotelDb.redirectToLogin(window.location.href);
        return;
    }

    let dialog = document.getElementById('booking-modal');
    if (!dialog) {
        dialog = document.createElement('dialog');
        dialog.id = 'booking-modal';
        document.body.appendChild(dialog);
    }

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
            dialog.innerHTML = BookingModalTemplates.renderBookingSummaryStep({
                room, checkInVal, checkOutVal, nights, subtotal, taxes, total, formValues
            });

            if (window.lucide) window.lucide.createIcons();

            const modalCheckInInput = dialog.querySelector("#modal-check-in-input");
            const modalCheckOutInput = dialog.querySelector("#modal-check-out-input");
            const modalNightsVal = dialog.querySelector("#modal-nights-val");
            const breakdownNightsLabel = dialog.querySelector("#breakdown-nights-label");
            const breakdownSubtotalVal = dialog.querySelector("#breakdown-subtotal-val");
            const breakdownTaxesVal = dialog.querySelector("#breakdown-taxes-val");
            const breakdownTotalVal = dialog.querySelector("#breakdown-total-val");
            const modalSubmitBtn = dialog.querySelector("#modal-submit-btn");

            if (checkInVal) {
                modalCheckOutInput.min = checkInVal;
            }

            const updateModalPrices = () => {
                recalculatePrices();
                modalNightsVal.textContent = nights;
                breakdownNightsLabel.textContent = `${fmtVNDBooking(room.price)} × ${nights} night${nights !== 1 ? "s" : ""}`;
                breakdownSubtotalVal.textContent = fmtVNDBooking(subtotal);
                breakdownTaxesVal.textContent = fmtVNDBooking(taxes);
                breakdownTotalVal.textContent = fmtVNDBooking(total);
                modalSubmitBtn.textContent = `Proceed to Payment — ${fmtVNDBooking(total)}`;
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
            dialog.innerHTML = BookingModalTemplates.renderBookingPaymentStep({
                room, checkinLabel, checkoutLabel, nights, formValues, total
            });

            if (window.lucide) window.lucide.createIcons();

            dialog.querySelector("#booking-back-btn").addEventListener("click", () => {
                currentStep = "summary";
                renderContent();
            });

            dialog.querySelector("#vnpay-pay-btn").addEventListener("click", async () => {
                const btn = dialog.querySelector("#vnpay-pay-btn");
                const btnText = dialog.querySelector("#vnpay-btn-text");
                const btnSpinner = dialog.querySelector("#vnpay-btn-spinner");
                const errorBox = dialog.querySelector("#vnpay-api-error");

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
                        payment_method: "VNPAY"
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
                        errorBox.textContent = data.message || "Failed to connect to VNPAY. Please try again.";
                        errorBox.style.display = "block";
                        btn.disabled = false;
                        btnText.style.display = "inline";
                        btnSpinner.style.display = "none";
                    }
                } catch (err) {
                    errorBox.textContent = "Network connection error. Please try again.";
                    errorBox.style.display = "block";
                    btn.disabled = false;
                    btnText.style.display = "inline";
                    btnSpinner.style.display = "none";
                }
            });

            dialog.querySelector("#close-booking-btn").addEventListener("click", () => dialog.close());
        }
    };

    renderContent();
    dialog.showModal();
}

window.openBookingModal = openBookingModal;
export default openBookingModal;