import { describe, expect, it, vi } from "vitest";
import { configureAnalytics, createAnalytics, getAnalyticsSnapshot, track, type AnalyticsAdapter } from "..";

const createSpyAdapter = (spy: ReturnType<typeof vi.fn>): AnalyticsAdapter => ({
  name: "spy",
  track: spy,
});

describe("analytics adapter", () => {
  it("is a no-op when disabled", async () => {
    configureAnalytics({ enabled: false });
    await expect(track("app_open")).resolves.toBeUndefined();
    expect(getAnalyticsSnapshot()).toEqual({ enabled: false, adapterNames: [] });
  });

  it("invokes configured adapters when enabled", async () => {
    const spy = vi.fn();
    configureAnalytics({
      enabled: true,
      adapters: [createSpyAdapter(spy)],
      context: { app: "test" },
    });

    await track("app_open", { source: "unit" });
    expect(spy).toHaveBeenCalledWith("app_open", { app: "test", source: "unit" });
  });

  it("isolates instances created via createAnalytics", async () => {
    const spy = vi.fn();
    const analytics = createAnalytics({
      enabled: true,
      adapters: [createSpyAdapter(spy)],
      context: { scope: "local" },
    });

    await analytics.track("reading_generated");
    expect(spy).toHaveBeenCalledWith("reading_generated", { scope: "local" });
  });

  it("swallows adapter errors without crashing", async () => {
    const faulty = vi.fn(() => {
      throw new Error("boom");
    });

    configureAnalytics({
      enabled: true,
      adapters: [createSpyAdapter(faulty)],
    });

    await expect(track("error_occurred")).resolves.toBeUndefined();
  });
});
