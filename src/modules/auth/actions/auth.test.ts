import { login, register, logout } from "./auth";

// --- Mock setup ---
const mockSignInWithPassword = jest.fn();
const mockSignUp = jest.fn();
const mockSignOut = jest.fn();

jest.mock("@/shared/lib/supabase/server", () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: {
        signInWithPassword: mockSignInWithPassword,
        signUp: mockSignUp,
        signOut: mockSignOut,
      },
    })
  ),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

// --- Tests ---
describe("Auth Server Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── LOGIN ─────────────────────────────────────────────
  describe("login action", () => {
    it("should fail if email is missing", async () => {
      const formData = new FormData();
      formData.append("password", "secret123");

      const result = await login(null, formData);
      expect(result.success).toBe(false);
      expect(result.message).toBe("Please enter both email and password.");
    });

    it("should fail if password is missing", async () => {
      const formData = new FormData();
      formData.append("email", "test@example.com");

      const result = await login(null, formData);
      expect(result.success).toBe(false);
      expect(result.message).toBe("Please enter both email and password.");
    });

    it("should fail if both email and password are missing", async () => {
      const formData = new FormData();

      const result = await login(null, formData);
      expect(result.success).toBe(false);
      expect(result.message).toBe("Please enter both email and password.");
    });

    it("should return Supabase error message on invalid credentials", async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        error: { message: "Invalid login credentials" },
      });

      const formData = new FormData();
      formData.append("email", "wrong@example.com");
      formData.append("password", "wrongpassword");

      const result = await login(null, formData);
      expect(result.success).toBe(false);
      expect(result.message).toBe("Invalid login credentials");
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: "wrong@example.com",
        password: "wrongpassword",
      });
    });

    it("should succeed with valid credentials", async () => {
      mockSignInWithPassword.mockResolvedValueOnce({ error: null });

      const formData = new FormData();
      formData.append("email", "user@example.com");
      formData.append("password", "correctpassword");

      const result = await login(null, formData);
      expect(result.success).toBe(true);
      expect(result.message).toBe("Login successful.");
    });
  });

  // ─── REGISTER ──────────────────────────────────────────
  describe("register action", () => {
    it("should fail if any required field is missing", async () => {
      const formData = new FormData();
      formData.append("name", "Nguyen Van A");
      // missing email, phone, password

      const result = await register(null, formData);
      expect(result.success).toBe(false);
      expect(result.message).toBe("All fields are required.");
    });

    it("should fail if password length is less than 6 characters", async () => {
      const formData = new FormData();
      formData.append("name", "Nguyen Van A");
      formData.append("email", "test@example.com");
      formData.append("phone", "0901234567");
      formData.append("password", "12345");
      formData.append("confirm", "12345");

      const result = await register(null, formData);
      expect(result.success).toBe(false);
      expect(result.message).toBe("Password must be at least 6 characters.");
    });

    it("should fail if confirm password does not match", async () => {
      const formData = new FormData();
      formData.append("name", "Nguyen Van A");
      formData.append("email", "test@example.com");
      formData.append("phone", "0901234567");
      formData.append("password", "password123");
      formData.append("confirm", "password999");

      const result = await register(null, formData);
      expect(result.success).toBe(false);
      expect(result.message).toBe("Passwords do not match.");
    });

    it("should fail with duplicate email (Supabase returns error)", async () => {
      mockSignUp.mockResolvedValueOnce({
        error: { message: "User already registered" },
      });

      const formData = new FormData();
      formData.append("name", "Nguyen Van A");
      formData.append("email", "existing@example.com");
      formData.append("phone", "0901234567");
      formData.append("password", "password123");
      formData.append("confirm", "password123");

      const result = await register(null, formData);
      expect(result.success).toBe(false);
      expect(result.message).toBe("User already registered");
    });

    it("should succeed with all valid fields", async () => {
      mockSignUp.mockResolvedValueOnce({ error: null });

      const formData = new FormData();
      formData.append("name", "Nguyen Van B");
      formData.append("email", "newuser@example.com");
      formData.append("phone", "0901234567");
      formData.append("password", "password123");
      formData.append("confirm", "password123");

      const result = await register(null, formData);
      expect(result.success).toBe(true);
      expect(result.message).toBe("Registration successful.");
      expect(mockSignUp).toHaveBeenCalledWith({
        email: "newuser@example.com",
        password: "password123",
        options: {
          data: { name: "Nguyen Van B", phone: "0901234567", role: "user" },
        },
      });
    });
  });

  // ─── LOGOUT ────────────────────────────────────────────
  describe("logout action", () => {
    it("should call supabase signOut and return success", async () => {
      mockSignOut.mockResolvedValueOnce({ error: null });

      const result = await logout();
      expect(result.success).toBe(true);
      expect(result.message).toBe("Logged out successfully.");
      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });
  });
});
