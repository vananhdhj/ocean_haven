// ** Main Entry ES6 Module ** //
import { HotelDb } from './global.js';
import { initNavbar, initAuthModals, updateNavbarAvatar } from './navbar.js';

document.addEventListener("DOMContentLoaded", async () => {
  initNavbar();
  initAuthModals();

  const profile = await HotelDb.getProfile();
  if (profile) {
    // Clean up any legacy localStorage avatar entries
    if (profile.email) {
      localStorage.removeItem('ocean_haven_avatar_' + profile.email);
    }

    if (profile.avatar_url) {
      updateNavbarAvatar(profile.avatar_url);
    } else {
      const initial = (profile.name || 'U').charAt(0).toUpperCase();
      updateNavbarAvatar(null, initial);
    }
  }
});
