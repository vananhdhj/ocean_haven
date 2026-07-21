// ** Detail page controller ** //
// Main controller for the room detail page: fetch room, render, gallery + booking events.
// Depends on window.DetailTemplates (detail.templates.js) being loaded first.

document.addEventListener("DOMContentLoaded", async () => {
  // Parse Query Parameters
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get("id");

  if (!roomId) {
    // window.location.href = "rooms.php";
    return;
  }

  try {
    const res = await fetch('api/get_rooms.php');
    const rooms = await res.json();
    let targetId = roomId;
    if (roomId !== null && roomId !== undefined && !isNaN(roomId)) {
      const num = parseInt(roomId);
      const padded = num.toString().padStart(3, '0');
      targetId = `room-${padded}`;
    }
    const room = rooms.find(r => r.id == targetId || r.id == roomId);
    if (!room) {
      // window.location.href = "rooms.php";
      return;
    }
    initDetailPage(room);
  } catch (err) {
    console.error("Error loading room details:", err);
    // window.location.href = "rooms.php";
  }

  function initDetailPage(room) {
    // Set Document Title Dynamically
    document.title = `${room.name} — Ocean Haven Hotel`;

    // Gallery Active Image Index State
    let activeImgIdx = 0;

    const container = document.getElementById("detail-page-container");
    const loadingBox = document.getElementById("detail-loading-box");

    // Load Layout
    loadingBox.classList.add("hidden");

    const renderPage = () => {
      container.innerHTML = window.DetailTemplates.renderDetailPageHtml(room, activeImgIdx);

      if (window.lucide) window.lucide.createIcons();

      // Gallery chevrons
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

      // Hook Booking triggers
      const widgetBookBtn = container.querySelector("#widget-book-btn");
      widgetBookBtn.addEventListener("click", () => {
        window.openBookingModal(room.id);
      });
    };

    // Initial Render
    renderPage();
  }
});