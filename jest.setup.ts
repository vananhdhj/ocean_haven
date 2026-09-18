import "@testing-library/jest-dom";

// Mock 'server-only' for Jest test environment
jest.mock("server-only", () => ({}), { virtual: true });
