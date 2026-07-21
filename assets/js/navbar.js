// ** Navbar + auth modals + avatar ** //
document.addEventListener("DOMContentLoaded", async () => {
  initNavbar();
  initAuthModals();

  // Restore saved avatar from localStorage for the active user
  if (window.HotelDb) {
    const profile = await window.HotelDb.getProfile();
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

function initNavbar() {
  const profileBtn = document.getElementById("profile-btn");
  if (profileBtn) {
    profileBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openProfileModal();
    });
  }

  const menuToggle = document.getElementById("menu-toggle");
  const mobileNav = document.getElementById("mobile-nav");
  if (menuToggle && mobileNav) {
    menuToggle.addEventListener("click", () => {
      mobileNav.classList.toggle("open");
      const icon = menuToggle.querySelector("i");
      if (icon) {
        if (mobileNav.classList.contains("open")) {
          icon.setAttribute("data-lucide", "x");
        } else {
          icon.setAttribute("data-lucide", "menu");
        }
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }

  // Hook up profile button on mobile menu
  const mobileProfileBtn = document.getElementById("mobile-profile-btn");
  if (mobileProfileBtn) {
    mobileProfileBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (mobileNav) mobileNav.classList.remove("open");
      openProfileModal();
    });
  }

  // Close mobile nav when clicking any link inside it
  if (mobileNav) {
    mobileNav.addEventListener("click", (e) => {
      if (e.target.tagName === "A" || e.target.closest("a")) {
        mobileNav.classList.remove("open");
        const icon = menuToggle ? menuToggle.querySelector("i") : null;
        if (icon) {
          icon.setAttribute("data-lucide", "menu");
          if (window.lucide) window.lucide.createIcons();
        }
      }
    });
  }
}

function initAuthModals() {
  const loginModal = document.getElementById("login-modal");
  const registerModal = document.getElementById("register-modal");
  if (!loginModal || !registerModal) return;

  const navSigninBtn = document.getElementById("nav-signin-btn");
  const mobileSigninBtn = document.getElementById("mobile-signin-btn");
  const mobileRegisterBtn = document.getElementById("mobile-register-btn");

  const closeLoginBtn = document.getElementById("close-login-btn");
  const closeRegisterBtn = document.getElementById("close-register-btn");

  const switchToRegister = document.getElementById("switch-to-register");
  const switchToLogin = document.getElementById("switch-to-login");

  const ajaxLoginForm = document.getElementById("ajax-login-form");
  const ajaxRegisterForm = document.getElementById("ajax-register-form");

  const loginErrorMsg = document.getElementById("login-error-msg");
  const registerErrorMsg = document.getElementById("register-error-msg");

  // Open Login Modal
  if (navSigninBtn) {
    navSigninBtn.addEventListener("click", () => {
      loginModal.showModal();
    });
  }
  if (mobileSigninBtn) {
    mobileSigninBtn.addEventListener("click", () => {
      const mobileNav = document.getElementById("mobile-nav");
      if (mobileNav) mobileNav.classList.remove("open");
      loginModal.showModal();
    });
  }

  // Open Register Modal
  if (mobileRegisterBtn) {
    mobileRegisterBtn.addEventListener("click", () => {
      const mobileNav = document.getElementById("mobile-nav");
      if (mobileNav) mobileNav.classList.remove("open");
      registerModal.showModal();
    });
  }

  // Close Modals
  if (closeLoginBtn) {
    closeLoginBtn.addEventListener("click", () => loginModal.close());
  }
  if (closeRegisterBtn) {
    closeRegisterBtn.addEventListener("click", () => registerModal.close());
  }

  // Switch Between Modals
  if (switchToRegister) {
    switchToRegister.addEventListener("click", () => {
      loginModal.close();
      registerModal.showModal();
    });
  }
  if (switchToLogin) {
    switchToLogin.addEventListener("click", () => {
      registerModal.close();
      loginModal.showModal();
    });
  }

  // Close Modals on backdrop click
  [loginModal, registerModal].forEach(modal => {
    modal.addEventListener("click", (e) => {
      const rect = modal.getBoundingClientRect();
      const isInDialog = (
        rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX && e.clientX <= rect.left + rect.width
      );
      if (!isInDialog) {
        modal.close();
      }
    });
  });

  // Handle AJAX Login
  if (ajaxLoginForm) {
    ajaxLoginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      loginErrorMsg.style.display = "none";
      const submitBtn = document.getElementById("login-submit-btn");
      submitBtn.disabled = true;
      submitBtn.textContent = "Signing In...";

      const formData = new FormData(ajaxLoginForm);
      try {
        const response = await fetch("/final_assigment/auth/login.php", {
          method: "POST",
          body: formData
        });
        const result = await response.json();
        if (result.success) {
          window.location.reload();
        } else {
          loginErrorMsg.textContent = result.message || "Login failed.";
          loginErrorMsg.style.display = "block";
          submitBtn.disabled = false;
          submitBtn.textContent = "Sign In";
        }
      } catch (err) {
        loginErrorMsg.textContent = "A network error occurred. Please try again.";
        loginErrorMsg.style.display = "block";
        submitBtn.disabled = false;
        submitBtn.textContent = "Sign In";
      }
    });
  }

  // Handle AJAX Register
  if (ajaxRegisterForm) {
    ajaxRegisterForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      registerErrorMsg.style.display = "none";
      const submitBtn = document.getElementById("register-submit-btn");
      submitBtn.disabled = true;
      submitBtn.textContent = "Creating Account...";

      const formData = new FormData(ajaxRegisterForm);
      try {
        const response = await fetch("/final_assigment/auth/register.php", {
          method: "POST",
          body: formData
        });
        const result = await response.json();
        if (result.success) {
          window.location.reload();
        } else {
          registerErrorMsg.textContent = result.message || "Registration failed.";
          registerErrorMsg.style.display = "block";
          submitBtn.disabled = false;
          submitBtn.textContent = "Create Account";
        }
      } catch (err) {
        registerErrorMsg.textContent = "A network error occurred. Please try again.";
        registerErrorMsg.style.display = "block";
        submitBtn.disabled = false;
        submitBtn.textContent = "Create Account";
      }
    });
  }

  // Automatically show modals from URL query parameters (for redirect fallback cases)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("showLogin")) {
    loginModal.showModal();
    const cleanUrl = window.location.pathname + window.location.search.replace(/[\?&]showLogin=[^&]+/, '').replace(/^&/, '?');
    window.history.replaceState({}, document.title, cleanUrl);
  } else if (urlParams.has("showRegister")) {
    registerModal.showModal();
    const cleanUrl = window.location.pathname + window.location.search.replace(/[\?&]showRegister=[^&]+/, '').replace(/^&/, '?');
    window.history.replaceState({}, document.title, cleanUrl);
  }
}

// ── Live navbar avatar update ──
function updateNavbarAvatar(avatarUrl, initial) {
  const profileBtn = document.getElementById('profile-btn');
  if (!profileBtn) return;

  if (avatarUrl) {
    profileBtn.innerHTML = `
      <img src="${avatarUrl}" alt="Avatar"
           style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;"
           onerror="this.style.display='none'">`;
  } else if (initial) {
    profileBtn.innerHTML = `<span style="font-size:0.8125rem;font-weight:700;letter-spacing:0.02em;">${initial}</span>`;
  }
}

window.updateNavbarAvatar = updateNavbarAvatar;
