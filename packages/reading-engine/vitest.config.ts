import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@vybe/reading-core-private": resolve(__dirname, "../reading-core-private/src/index.ts"),
    },
  },
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts", "v4/**/*.ts"],
      reporter: ["text", "lcov"],
      exclude: ["v4/types.ts"],
      lines: 0.98,
      functions: 0.98,
      statements: 0.98,
      branches: 0.9,
    },
  },
});
