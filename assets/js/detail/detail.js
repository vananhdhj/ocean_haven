// ** Detail page controller ** //
import { DetailTemplates } from './detail.templates.js';
import { openBookingModal } from '../booking/booking-modal.js';

document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get("id");

  if (!roomId) {
    return;
  }

  try {
    const res = await fetch('/ocean_haven/api/rooms/get_rooms.php');
    const rooms = await res.json();
    let targetId = roomId;
    if (roomId !== null && roomId !== undefined && !isNaN(roomId)) {
      const num = parseInt(roomId);
      const padded = num.toString().padStart(3, '0');
      targetId = `room-${padded}`;
    }
    const room = rooms.find(r => r.id == targetId || r.id == roomId);
    if (!room) {
      return;
    }
    initDetailPage(room);
  } catch (err) {
    console.error("Error loading room details:", err);
  }

  function initDetailPage(room) {
    document.title = `${room.name} — Ocean Haven Hotel`;

    let activeImgIdx = 0;

    const container = document.getElementById("detail-page-container");
    const loadingBox = document.getElementById("detail-loading-box");

    loadingBox.classList.add("hidden");

    const renderPage = () => {
      container.innerHTML = DetailTemplates.renderDetailPageHtml(room, activeImgIdx);

      if (window.lucide) window.lucide.createIcons();

      if (room.images.length > 1) {
        const mainDisplay = container.querySelector("#gallery-main-display");
        const counterText = container.querySelector("#gallery-count-text");
        const prevBtn = container.querySelector("#gallery-prev-btn");
        const nextBtn = container.querySelector("#gallery-next-btn");
        const thumbBtns = container.querySelectorAll(".gallery-thumb-btn");

        const updateGallery = (newIdx) => {
          activeImgIdx = newIdx;
          mainDisplay.style.opacity = 0.5;
          setTimeout(() => {
            mainDisplay.src = room.images[activeImgIdx];
            mainDisplay.style.opacity = 1;
          }, 100);
          counterText.textContent = `${activeImgIdx + 1}/${room.images.length}`;

          thumbBtns.forEach((btn, bidx) => {
            if (bidx === activeImgIdx) btn.classList.add("active");
            else btn.classList.remove("active");
          });
        };

        prevBtn.addEventListener("click", () => {
          const nextIdx = (activeImgIdx - 1 + room.images.length) % room.images.length;
          updateGallery(nextIdx);
        });

        nextBtn.addEventListener("click", () => {
          const nextIdx = (activeImgIdx + 1) % room.images.length;
          updateGallery(nextIdx);
        });

        thumbBtns.forEach(btn => {
          btn.addEventListener("click", () => {
            const idx = parseInt(btn.getAttribute("data-thumb-idx"));
            updateGallery(idx);
          });
        });
      }

      const widgetBookBtn = container.querySelector("#widget-book-btn");
      widgetBookBtn.addEventListener("click", () => {
        openBookingModal(room.id);
      });
    };

    renderPage();
  }
});