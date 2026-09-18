/**
 * @jest-environment node
 */
import { GET } from "./route";

describe("Integration: GET /api/health", () => {
  it("should return { status: 'ok' } with HTTP 200", async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ status: "ok" });
  });

  it("should return JSON content type", async () => {
    const response = await GET();

    expect(response.headers.get("content-type")).toContain("application/json");
  });

  it("should be idempotent across multiple calls", async () => {
    const response1 = await GET();
    const response2 = await GET();

    const data1 = await response1.json();
    const data2 = await response2.json();

    expect(data1).toEqual(data2);
    expect(data1).toEqual({ status: "ok" });
  });
});
