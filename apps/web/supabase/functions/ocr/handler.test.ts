import { describe, expect, it } from "vitest";
import { prepareOcrResult } from "./handler.ts";

const deps = (text: string) => ({
  runOcr: async () => ({ text }),
});

describe("prepareOcrResult", () => {
  it("rejects invalid payload", async () => {
    const result = await prepareOcrResult(deps(""), { foo: "bar" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("BAD_REQUEST");
    }
  });

  it("defaults mode to accurate", async () => {
    let receivedMode: string | undefined;
    const result = await prepareOcrResult(
      {
        runOcr: async (payload) => {
          receivedMode = payload.mode;
          return { text: "Order #1234 delivered on 2024-10-12" };
        },
      },
      { imageUrl: "https://cdn.example.com/img.png" }
    );
    expect(result.ok).toBe(true);
    expect(receivedMode).toBe("accurate");
  });

  it("returns readings built from extracted numbers", async () => {
    const result = await prepareOcrResult(
      deps("Order #1234 delivered at 11:11 on 2024-10-12"),
      { imageUrl: "https://cdn.example.com/img.png", mode: "fast" }
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.numbers.length).toBeGreaterThan(0);
      expect(result.value.readings[0]).toHaveProperty("numerology_data.headline");
    }
  });
});
