// eslint.config.mjs — Vyberology monorepo flat config
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      "**/dist/**",
      "**/build/**",
      "**/.aegis_audit/**",
      "**/coverage/**",
      "coverage/**/*",
      "**/pnpm-lock.yaml",
    ],
  },
  js.configs.recommended,
  ...tseslint.config(
    tseslint.configs.recommendedTypeChecked,
    {
      languageOptions: {
        parserOptions: {
          projectService: true,
          tsconfigRootDir: import.meta.dirname,
        },
        globals: {
          ...globals.node,
          ...globals.es2021,
        },
      },
      rules: {
        "@typescript-eslint/no-explicit-any": ["error", { ignoreRestArgs: false }],
        "@typescript-eslint/consistent-type-imports": "error",
        "@typescript-eslint/no-unsafe-assignment": "error",
        "@typescript-eslint/no-unsafe-member-access": "error",
        "@typescript-eslint/no-floating-promises": "error",
      },
    }
  ),
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-restricted-syntax": ["error", "with", "eval"],
    },
  },
  {
    files: [
      "**/*.test.{ts,tsx,js,jsx}",
      "**/*.spec.{ts,tsx,js,jsx}",
      "**/tests/**/*.{ts,tsx,js,jsx}",
    ],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
    },
  },
  {
    files: ["apps/web/src/**/*.{ts,tsx}", "apps/web/tests/**/*.{ts,tsx}", "apps/web/supabase/**/*.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
];
