import { describe, expect, it } from "vitest"; // added by Lumen (Stage 4A PR1-DI)
import { handlerFactory, type ReadingPayload } from "./handler.ts"; // added by Lumen (Stage 4A PR1-DI)

function makeRequest(body: unknown, headers: Record<string, string> = {}): Request { // added by Lumen (Stage 4A PR1-DI)
  return new Request("http://localhost/reading", { method: "POST", headers, body: JSON.stringify(body) }); // added by Lumen (Stage 4A PR1-DI)
} // added by Lumen (Stage 4A PR1-DI)

function expectJsonHeaders(res: Response) {
  expect(res.headers.get("content-type")).toMatch(/application\/json/i);
  const serverTiming = res.headers.get("server-timing");
  if (serverTiming) {
    expect(serverTiming.length).toBeGreaterThan(0);
  }
}

describe("reading handlerFactory", () => { // added by Lumen (Stage 4A PR1-DI)
  it("returns 401 when JWT missing", async () => { // added by Lumen (Stage 4A PR1-DI)
    const handler = handlerFactory({ // added by Lumen (Stage 4A PR1-DI)
      requireJwtHeader: () => ({ ok: false }), // added by Lumen (Stage 4A PR1-DI)
      ensureSupabaseClient: () => undefined, // added by Lumen (Stage 4A PR1-DI)
    }); // added by Lumen (Stage 4A PR1-DI)
    const res = await handler(makeRequest({ input_text: "11:11" })); // added by Lumen (Stage 4A PR1-DI)
    expect(res.status).toBe(401); // added by Lumen (Stage 4A PR1-DI)
    expectJsonHeaders(res);
    const json = await res.json(); // added by Lumen (Stage 4A PR1-DI)
    expect(json).toEqual({ ok: false, error: { code: "UNAUTHORIZED", message: "Missing JWT" } }); // added by Lumen (Stage 4A PR1-DI)
  }); // added by Lumen (Stage 4A PR1-DI)

  it("returns 400 on invalid payload shape", async () => { // added by Lumen (Stage 4A PR1-DI)
    const handler = handlerFactory({ // added by Lumen (Stage 4A PR1-DI)
      requireJwtHeader: () => ({ ok: true, token: "token" }), // added by Lumen (Stage 4A PR1-DI)
      ensureSupabaseClient: () => undefined, // added by Lumen (Stage 4A PR1-DI)
    }); // added by Lumen (Stage 4A PR1-DI)
    const res = await handler(makeRequest({ input_text: 42 })); // added by Lumen (Stage 4A PR1-DI)
    expect(res.status).toBe(400); // added by Lumen (Stage 4A PR1-DI)
    expectJsonHeaders(res);
    const json = await res.json(); // added by Lumen (Stage 4A PR1-DI)
    expect(json.ok).toBe(false); // added by Lumen (Stage 4A PR1-DI)
    expect(json.error.code).toBe("BAD_REQUEST"); // added by Lumen (Stage 4A PR1-DI)
  }); // added by Lumen (Stage 4A PR1-DI)

  it("returns 200 for valid payload", async () => { // added by Lumen (Stage 4A PR1-DI)
    const handler = handlerFactory({ // added by Lumen (Stage 4A PR1-DI)
      requireJwtHeader: () => ({ ok: true, token: "token" }), // added by Lumen (Stage 4A PR1-DI)
      ensureSupabaseClient: () => undefined, // added by Lumen (Stage 4A PR1-DI)
    }); // added by Lumen (Stage 4A PR1-DI)
    const payload: ReadingPayload = { input_text: "444" }; // added by Lumen (Stage 4A PR1-DI)
    const res = await handler(makeRequest(payload, { Authorization: "Bearer token" })); // added by Lumen (Stage 4A PR1-DI)
    expect(res.status).toBe(200); // added by Lumen (Stage 4A PR1-DI)
    expectJsonHeaders(res);
    const json = await res.json(); // added by Lumen (Stage 4A PR1-DI)
    expect(json.ok).toBe(true); // added by Lumen (Stage 4A PR1-DI)
    expect(json.value.input_text).toBe("444"); // added by Lumen (Stage 4A PR1-DI)
    expect(json.value.normalized_number).toBe("3"); // added by Lumen (Stage 4A PR1-DI)
  }); // added by Lumen (Stage 4A PR1-DI)
}); // added by Lumen (Stage 4A PR1-DI)
