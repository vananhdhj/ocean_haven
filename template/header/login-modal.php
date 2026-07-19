<dialog id="login-modal">
  <div class="modal-header">
    <h2>Sign In</h2>
    <button type="button" class="modal-close-btn" onclick="document.getElementById('login-modal').close()">
      <i data-lucide="x" style="width:18px;height:18px;"></i>
    </button>
  </div>
  <div class="modal-body">
    <form id="ajax-login-form" novalidate>
      <div class="form-group">
        <label for="login-email">Email Address</label>
        <input type="email" id="login-email" name="email" class="form-control" placeholder="you@example.com" required>
      </div>
      <div class="form-group">
        <label for="login-password">Password</label>
        <input type="password" id="login-password" name="password" class="form-control" placeholder="••••••••" required>
      </div>
      <div id="login-error-msg" style="color: #dc2626; font-size: 0.8125rem; margin-bottom: 1rem; display: none;"></div>
      <button type="submit" class="btn-block btn-primary" id="login-submit-btn" style="width: 100%;">Sign In</button>
      <p style="text-align: center; font-size: 0.875rem; margin-top: 1.25rem; color: var(--muted-foreground);">
        Don't have an account? 
        <button type="button" id="switch-to-register" style="background: none; border: none; color: var(--primary-light); font-weight: 600; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; font-family: inherit; font-size: inherit;">Create Account</button>
      </p>
    </form>
  </div>
</dialog>
