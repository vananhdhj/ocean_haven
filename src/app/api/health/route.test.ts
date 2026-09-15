/**
 * @jest-environment node
 */
import { GET } from "./route";

describe("GET /api/health", () => {
  it("should return { status: 'ok' } with HTTP 200", async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ status: "ok" });
  });
});
