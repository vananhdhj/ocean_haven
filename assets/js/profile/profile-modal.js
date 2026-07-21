// ** Profile modal controller ** //
let activeProfileTab = 'profile';

async function openProfileModal() {
  let dialog = document.getElementById('profile-modal');
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.id = 'profile-modal';
    document.body.appendChild(dialog);
  }

  await renderProfileModalContent(dialog);
  dialog.showModal();

  dialog.addEventListener('click', (e) => {
    const rect = dialog.getBoundingClientRect();
    const isInDialog = (
      rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX && e.clientX <= rect.left + rect.width
    );
    if (!isInDialog) dialog.close();
  });
}

async function renderProfileModalContent(dialog) {
  const profile = await window.HotelDb.getProfile();
  const bookings = await window.HotelDb.getBookings();

  if (!profile) {
    dialog.close();
    window.HotelDb.redirectToLogin(window.location.href);
    return;
  }

  const savedAvatar = window.AvatarUpload.getAvatarFromStorage(profile.email);
  const currentAvatarUrl = profile.avatar_url || savedAvatar;
  const initial = (profile.name || 'U').charAt(0).toUpperCase();
  const avatarHtml = currentAvatarUrl
    ? `<img src="${currentAvatarUrl}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
    : `<span>${initial}</span>`;

  dialog.innerHTML = window.ProfileModalTemplates.renderProfileModalHtml({
    profile,
    bookings,
    activeTab: activeProfileTab,
    avatarHtml,
  });

  if (window.lucide) window.lucide.createIcons();

  bindProfileModalEvents(dialog, profile);
}

function bindProfileModalEvents(dialog, profile) {
  dialog.querySelector('#close-profile-modal-btn').addEventListener('click', () => dialog.close());

  // Tab switching
  const tabProfileBtn = dialog.querySelector('#tab-profile-btn');
  const tabBookingsBtn = dialog.querySelector('#tab-bookings-btn');
  const profileContent = dialog.querySelector('#profile-tab-content');
  const bookingsContent = dialog.querySelector('#bookings-tab-content');

  tabProfileBtn.addEventListener('click', () => {
    activeProfileTab = 'profile';
    tabProfileBtn.classList.add('active');
    tabBookingsBtn.classList.remove('active');
    profileContent.classList.remove('hidden');
    bookingsContent.classList.add('hidden');
  });

  tabBookingsBtn.addEventListener('click', () => {
    activeProfileTab = 'bookings';
    tabBookingsBtn.classList.add('active');
    tabProfileBtn.classList.remove('active');
    bookingsContent.classList.remove('hidden');
    profileContent.classList.add('hidden');
  });

  // Profile Form submit → real API
  const profileForm = dialog.querySelector('#profile-form');
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = dialog.querySelector('#save-profile-btn');
    saveBtn.textContent = 'Saving…';
    saveBtn.disabled = true;

    const formData = new FormData(profileForm);
    const result = await window.HotelDb.updateProfile({
      name: formData.get('name'),
      phone: formData.get('phone'),
    });

    if (result.success) {
      saveBtn.textContent = 'Saved ✓';
      await renderProfileModalContent(dialog);
    } else {
      saveBtn.textContent = 'Save Changes';
      saveBtn.disabled = false;
      alert(result.message || 'Failed to save. Please try again.');
    }
  });

  // Sign Out → real logout
  dialog.querySelector('#sign-out-btn').addEventListener('click', () => {
    dialog.close();
    window.location.href = '/final_assigment/auth/logout.php';
  });

  // Cancel Booking buttons
  dialog.querySelectorAll('.cancel-booking-link-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const bookingId = btn.getAttribute('data-booking-id');
      if (confirm(`Are you sure you want to cancel booking ${bookingId}?`)) {
        const success = await window.HotelDb.cancelBooking(bookingId);
        if (success) {
          await renderProfileModalContent(dialog);
        }
      }
    });
  });

  // Avatar upload
  window.AvatarUpload.init({
    avatarArea: dialog.querySelector('#avatar-upload-area'),
    avatarInput: dialog.querySelector('#avatar-file-input'),
    avatarOverlay: dialog.querySelector('#avatar-upload-overlay'),
    userEmail: profile.email,
  });
}

window.openProfileModal = openProfileModal;