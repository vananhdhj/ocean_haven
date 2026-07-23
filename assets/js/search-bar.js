// ** Search bar component ** //
import { HotelDb } from './global.js';

export function initSearchBar(containerSelector, onSearch) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const searchState = HotelDb.getSearchState();

  // Setup HTML Structure for Search Bar
  container.innerHTML = `
    <div class="search-bar-container">
      <div class="search-bar-grid">
        <!-- Check-in -->
        <div class="search-field flex-1">
          <label for="check-in-input">Check-in</label>
          <input type="date" id="check-in-input" value="${searchState.checkIn}" min="${new Date().toISOString().split("T")[0]}">
        </div>
        <!-- Check-out -->
        <div class="search-field flex-1">
          <label for="check-out-input">Check-out</label>
          <input type="date" id="check-out-input" value="${searchState.checkOut}">
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  const checkInInput = container.querySelector("#check-in-input");
  const checkOutInput = container.querySelector("#check-out-input");

  const saveLocalSearchState = () => {
    searchState.checkIn = checkInInput.value;
    searchState.checkOut = checkOutInput.value;
    HotelDb.saveSearchState(searchState);
    if (onSearch) onSearch(searchState);
  };

  // Sync date changes
  checkInInput.addEventListener("change", (e) => {
    const val = e.target.value;
    checkOutInput.min = val;
    if (new Date(checkOutInput.value) <= new Date(val)) {
      const checkInDate = new Date(val);
      checkInDate.setDate(checkInDate.getDate() + 3);
      checkOutInput.value = checkInDate.toISOString().split("T")[0];
    }
    saveLocalSearchState();
  });

  checkOutInput.addEventListener("change", () => {
    saveLocalSearchState();
  });
}

window.initSearchBar = initSearchBar;
export default initSearchBar;
