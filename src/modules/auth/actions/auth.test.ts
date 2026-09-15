import { login, register } from "./auth";

// Mock supabase server client
jest.mock("@/shared/lib/supabase/server", () => ({
  createClient: jest.fn(() => Promise.resolve({
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
  })),
}));

// Mock next/cache
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

describe("Auth Server Actions Validation", () => {
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
  });

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
  });
});
