import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      reporter: ["text", "lcov"],
      lines: 0.6,
      functions: 0.6,
      statements: 0.6,
      branches: 0.45,
    },
  },
});
