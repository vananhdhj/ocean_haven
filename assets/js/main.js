// ** Main Entry ES6 Module ** //
import { HotelDb } from './global.js';
import { initNavbar, initAuthModals, updateNavbarAvatar } from './navbar.js';

document.addEventListener("DOMContentLoaded", async () => {
  initNavbar();
  initAuthModals();

  if (HotelDb) {
    const profile = await HotelDb.getProfile();
    if (profile && profile.email) {
      const saved = localStorage.getItem('ocean_haven_avatar_' + profile.email);
      if (saved) {
        updateNavbarAvatar(saved);
      } else {
        const initial = (profile.name || 'U').charAt(0).toUpperCase();
        updateNavbarAvatar(null, initial);
      }
    }
  }
});
