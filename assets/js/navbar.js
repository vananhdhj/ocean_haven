document.addEventListener("DOMContentLoaded", () => {
  initNavbar();
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

  // Mark active page in navigation
  const currentPath = window.location.pathname;
  const navBtns = document.querySelectorAll(".nav-btn, .mobile-nav-btn");
  navBtns.forEach(btn => {
    const href = btn.getAttribute("href");
    if (href && (currentPath.endsWith(href) || (currentPath === "/" && href === "index.php"))) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}
