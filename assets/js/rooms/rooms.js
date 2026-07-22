// ** Rooms page controller ** //
// Main controller for the rooms catalog page: filter state, fetch, render, event binding.
// Depends on window.RoomsTemplates (rooms.templates.js) being loaded first.

document.addEventListener("DOMContentLoaded", async () => {
    // Initialize Search Bar
    initSearchBar("#rooms-search-bar-container", async (searchData) => {
        await loadRoomsAndRender();
    });

    // Filter state variables
    let filters = {
        types: [],
        floors: [],
        views: [],
        priceMin: 1500000,
        priceMax: 7500000,
        guests: 0
    };

    let keyword = "";

    // Load references
    let rooms = [];
    const roomsGrid = document.getElementById("rooms-catalog-grid");
    const emptyState = document.getElementById("rooms-empty-state");
    const roomsCountBadge = document.getElementById("rooms-count-badge");
    const keywordInput = document.getElementById("keyword-search-input");
    const clearAllBtn = document.getElementById("clear-all-filters-btn");

    const mobileFiltersTrigger = document.getElementById("mobile-filters-trigger-btn");
    const mobileFiltersCountBadge = document.getElementById("mobile-filter-count");
    const mobileFiltersDialog = document.getElementById("mobile-filters-dialog");
    const closeMobileFiltersBtn = document.getElementById("close-mobile-filters-btn");
    const mobileApplyFiltersBtn = document.getElementById("mobile-apply-filters-btn");

    // Set up keyword search event
    keywordInput.addEventListener("input", (e) => {
        keyword = e.target.value;
        applyFiltersAndRender();
    });

    // Clear all triggers
    clearAllBtn.addEventListener("click", () => {
        clearFilters();
    });

    // Mobile dialog bindings
    mobileFiltersTrigger.addEventListener("click", () => {
        mobileFiltersDialog.showModal();
        renderFilters("#mobile-filters-container", true);
    });
    closeMobileFiltersBtn.addEventListener("click", () => mobileFiltersDialog.close());
    mobileApplyFiltersBtn.addEventListener("click", () => mobileFiltersDialog.close());

    // Search Modal (Up-pop) bindings
    const searchModal = document.getElementById("search-modal");
    const searchModalTrigger = document.getElementById("search-modal-trigger-btn");
    const closeSearchModalBtn = document.getElementById("close-search-modal-btn");
    const searchModalApplyBtn = document.getElementById("search-modal-apply-btn");

    if (searchModalTrigger && searchModal) {
        searchModalTrigger.addEventListener("click", () => {
            searchModal.showModal();
        });
    }
    if (closeSearchModalBtn && searchModal) {
        closeSearchModalBtn.addEventListener("click", () => {
            searchModal.close();
        });
    }
    if (searchModalApplyBtn && searchModal) {
        searchModalApplyBtn.addEventListener("click", async () => {
            searchModal.close();
            await loadRoomsAndRender();
        });
    }

    // Helper to clear filters
    function clearFilters() {
        filters = {
            types: [],
            floors: [],
            views: [],
            priceMin: 1500000,
            priceMax: 7500000,
            guests: 0
        };
        keyword = "";
        keywordInput.value = "";
        applyFiltersAndRender();
        renderFilters("#desktop-filters-aside", false);
    }

    // Dynamic Filter Panel — now delegates HTML building to the templates module
    function renderFilters(containerSelector, isMobile) {
        const target = document.querySelector(containerSelector);
        if (!target) return;

        target.innerHTML = window.RoomsTemplates.renderFilterPanelHtml(filters, isMobile);

        // Bind events inside filter panel
        const idSuffix = isMobile ? 'm' : 'd';
        const clearLink = target.querySelector(`#clear-link-${idSuffix}`);
        clearLink.addEventListener("click", () => {
            clearFilters();
            renderFilters(containerSelector, isMobile);
        });

        // Type checkboxes
        const typeCheckboxes = target.querySelectorAll(".type-filter-checkbox");
        typeCheckboxes.forEach(cb => {
            cb.addEventListener("change", () => {
                const val = cb.value;
                if (cb.checked) {
                    filters.types.push(val);
                } else {
                    filters.types = filters.types.filter(x => x !== val);
                }
                applyFiltersAndRender();
                syncMobileDesktopFilters(isMobile);
            });
        });

        // Floor buttons
        const floorBtns = target.querySelectorAll(".floor-filter-btn");
        floorBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                const floor = parseInt(btn.getAttribute("data-floor"));
                if (filters.floors.includes(floor)) {
                    filters.floors = filters.floors.filter(x => x !== floor);
                    btn.classList.remove("active");
                } else {
                    filters.floors.push(floor);
                    btn.classList.add("active");
                }
                applyFiltersAndRender();
                syncMobileDesktopFilters(isMobile);
            });
        });

        // View checkboxes
        const viewCheckboxes = target.querySelectorAll(".view-filter-checkbox");
        viewCheckboxes.forEach(cb => {
            cb.addEventListener("change", () => {
                const val = cb.value;
                if (cb.checked) {
                    filters.views.push(val);
                } else {
                    filters.views = filters.views.filter(x => x !== val);
                }
                applyFiltersAndRender();
                syncMobileDesktopFilters(isMobile);
            });
        });

        // Price slider
        const priceSlider = target.querySelector(`#price-slider-${idSuffix}`);
        priceSlider.addEventListener("input", (e) => {
            filters.priceMax = parseInt(e.target.value);
            applyFiltersAndRender();

            // Re-render only price texts to optimize performance
            const priceBoxes = target.querySelectorAll(".price-input-box");
            if (priceBoxes.length >= 2) {
                priceBoxes[1].querySelector("p:last-child").textContent = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(filters.priceMax);
            }
        });

        priceSlider.addEventListener("change", () => {
            syncMobileDesktopFilters(isMobile);
        });

        // Guests Capacity
        const capacityBtns = target.querySelectorAll(".capacity-filter-btn");
        capacityBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                const capacity = parseInt(btn.getAttribute("data-capacity"));
                if (filters.guests === capacity) {
                    filters.guests = 0;
                    btn.classList.remove("active");
                } else {
                    filters.guests = capacity;
                    capacityBtns.forEach(b => b.classList.remove("active"));
                    btn.classList.add("active");
                }
                applyFiltersAndRender();
                syncMobileDesktopFilters(isMobile);
            });
        });
    }

    function syncMobileDesktopFilters(fromMobile) {
        if (fromMobile) {
            renderFilters("#desktop-filters-aside", false);
        } else {
            renderFilters("#mobile-filters-container", true);
        }
    }

    let currentPage = 1;
    const itemsPerPage = 9;

    // Filter and Render Logic
    function applyFiltersAndRender(resetPagination = true) {
        if (resetPagination) {
            currentPage = 1;
        }

        const filtered = rooms.filter(r => {
            // Room types filter
            if (filters.types.length > 0 && !filters.types.includes(r.type)) return false;

            // Floors filter
            if (filters.floors.length > 0 && !filters.floors.includes(r.floor)) return false;

            // Views filter
            if (filters.views.length > 0 && !filters.views.includes(r.view)) return false;

            // Price slider filter
            if (r.price > filters.priceMax) return false;

            // Guests capacity filter
            if (filters.guests > 0 && r.maxGuests < filters.guests) return false;

            // Keyword text search filter
            if (keyword.trim() !== "") {
                const kw = keyword.toLowerCase();
                const nameMatch = r.name.toLowerCase().includes(kw);
                const typeMatch = r.type.toLowerCase().includes(kw);
                const viewMatch = r.view.toLowerCase().includes(kw);
                const amenityMatch = r.amenities.some(a => a.toLowerCase().includes(kw));
                if (!nameMatch && !typeMatch && !viewMatch && !amenityMatch) return false;
            }

            return true;
        });

        // Update count text
        roomsCountBadge.textContent = `(${filtered.length})`;

        // Calculate active filter counts for mobile badge
        const activeCount =
            filters.types.length +
            filters.floors.length +
            filters.views.length +
            (filters.priceMax < 7500000 ? 1 : 0) +
            (filters.guests > 0 ? 1 : 0);

        if (activeCount > 0) {
            mobileFiltersCountBadge.textContent = activeCount;
            mobileFiltersCountBadge.classList.remove("hidden");
        } else {
            mobileFiltersCountBadge.classList.add("hidden");
        }

        // Render rooms catalog grid
        if (filtered.length === 0) {
            roomsGrid.classList.add("hidden");
            emptyState.classList.remove("hidden");
            let seeMoreContainer = document.getElementById("see-more-container");
            if (seeMoreContainer) seeMoreContainer.style.display = "none";
        } else {
            emptyState.classList.add("hidden");
            roomsGrid.classList.remove("hidden");

            const totalPages = Math.ceil(filtered.length / itemsPerPage);
            const startIndex = (currentPage - 1) * itemsPerPage;
            const displayList = filtered.slice(startIndex, startIndex + itemsPerPage);

            roomsGrid.innerHTML = displayList.map(room => window.RoomsTemplates.renderRoomCardHtml(room)).join("");

            if (window.lucide) window.lucide.createIcons();

            // Manage Pagination
            let paginationContainer = document.getElementById("rooms-pagination-container");
            if (!paginationContainer) {
                paginationContainer = document.createElement("div");
                paginationContainer.id = "rooms-pagination-container";
                roomsGrid.after(paginationContainer);
            }

            if (totalPages > 1) {
                paginationContainer.style.display = "block";
                paginationContainer.innerHTML = window.RoomsTemplates.renderPaginationHtml(currentPage, totalPages);

                // Attach events
                const prevBtn = paginationContainer.querySelector('.prev-page');
                const nextBtn = paginationContainer.querySelector('.next-page');
                const pageBtns = paginationContainer.querySelectorAll('.page-num');

                if (prevBtn) {
                    prevBtn.addEventListener('click', () => {
                        if (currentPage > 1) {
                            currentPage--;
                            applyFiltersAndRender(false);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                    });
                }

                if (nextBtn) {
                    nextBtn.addEventListener('click', () => {
                        if (currentPage < totalPages) {
                            currentPage++;
                            applyFiltersAndRender(false);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                    });
                }

                pageBtns.forEach(btn => {
                    btn.addEventListener('click', () => {
                        currentPage = parseInt(btn.getAttribute('data-page'));
                        applyFiltersAndRender(false);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    });
                });
            } else {
                paginationContainer.style.display = "none";
            }
        }

        // Show room apply counts on mobile modal footer
        if (mobileApplyFiltersBtn) {
            mobileApplyFiltersBtn.textContent = `Show ${filtered.length} Room${filtered.length !== 1 ? 's' : ''}`;
        }
    }

    const loadRoomsAndRender = async () => {
        try {
            const searchState = window.HotelDb.getSearchState();
            const checkinParam = searchState.checkIn || "";
            const checkoutParam = searchState.checkOut || "";

            const res = await fetch(`api/get_rooms.php?checkin=${checkinParam}&checkout=${checkoutParam}`);
            rooms = await res.json();

            applyFiltersAndRender();
        } catch (err) {
            console.error("Error loading rooms:", err);
        }
    };

    // Load rooms and render initially
    renderFilters("#desktop-filters-aside", false);
    await loadRoomsAndRender();
});