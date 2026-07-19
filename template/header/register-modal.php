<dialog id="register-modal">
  <div class="modal-header">
    <h2>Create Account</h2>
    <button type="button" class="modal-close-btn" onclick="document.getElementById('register-modal').close()">
      <i data-lucide="x" style="width:18px;height:18px;"></i>
    </button>
  </div>
  <div class="modal-body">
    <form id="ajax-register-form" novalidate>
      <div class="form-group">
        <label for="reg-name">Full Name</label>
        <input type="text" id="reg-name" name="name" class="form-control" placeholder="Your full name" required>
      </div>
      <div class="form-group">
        <label for="reg-email">Email Address</label>
        <input type="email" id="reg-email" name="email" class="form-control" placeholder="you@gmail.com" required>
      </div>
      <div class="form-group">
        <label for="reg-phone">Phone Number</label>
        <input type="tel" id="reg-phone" name="phone" class="form-control" placeholder="(+84) xxx xxx xxx" required>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="reg-password">Password</label>
          <input type="password" id="reg-password" name="password" class="form-control" placeholder="Min 6 chars" required>
        </div>
        <div class="form-group">
          <label for="reg-confirm">Confirm</label>
          <input type="password" id="reg-confirm" name="confirm" class="form-control" placeholder="Repeat password" required>
        </div>
      </div>
      <div id="register-error-msg" style="color: #dc2626; font-size: 0.8125rem; margin-bottom: 1rem; display: none;"></div>
      <button type="submit" class="btn-block btn-primary" id="register-submit-btn" style="width: 100%;">Create Account</button>
      <p style="text-align: center; font-size: 0.875rem; margin-top: 1.25rem; color: var(--muted-foreground);">
        Already have an account? 
        <button type="button" id="switch-to-login" style="background: none; border: none; color: var(--primary-light); font-weight: 600; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; font-family: inherit; font-size: inherit;">Sign In</button>
      </p>
    </form>
  </div>
</dialog>
