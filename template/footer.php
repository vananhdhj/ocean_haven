  <!-- Footer -->
  <footer class="main-footer" id="footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <a href="./home.php">
            <div class="logo mb-4">
              <div class="logo-icon">
                <i data-lucide="waves" style="width: 14px; height: 14px;"></i>
              </div>
              <p class="font-bold">Ocean Haven Hotel</p>
            </div>
          </a>
          <p class="logo-desc">22 rooms. 3 floors. One ocean view. Da Nang, Vietnam.</p>
        </div>

        <div>
          <h3 class="footer-section-title">Contact</h3>
          <div class="footer-contacts">
            <div class="footer-contact-item">
              <i data-lucide="map-pinned" style="width: 15px; height: 15px;"></i>
              <span>&nbsp; 123 Vo Nguyen Giap, Da Nang</span>
            </div>
            <div class="footer-contact-item">
              <i data-lucide="phone-incoming" style="width: 15px; height: 15px;"></i>
              <span>&nbsp; +84 236 3 888 888</span>
            </div>
            <div class="footer-contact-item">
              <i data-lucide="mails" style="width: 15px; height: 15px;"></i>
              <span>&nbsp; hello@oceanhavenhotel.com</span>
            </div>
          </div>
        </div>
      </div>

      <div class="copyright">
        <p>© 2025 Ocean Haven Hotel. All rights reserved.</p>
      </div>
    </div>
  </footer>

  <!-- Scripts -->
  <script src="./assets/js/global.js"></script>
  <script src="./assets/js/navbar.js"></script>
  <script src="./assets/js/search-bar.js"></script>
  <script src="./assets/js/profile-modal.js"></script>
  <script src="./assets/js/booking-modal.js"></script>
  <?php if (isset($pageScript)): ?>
    <script src="<?php echo $pageScript; ?>"></script>
  <?php endif; ?>
  <script src="https://unpkg.com/lucide@latest"></script>

</body>

</html>
