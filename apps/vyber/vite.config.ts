import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;
// @ts-expect-error process is a nodejs global
const isPWA = process.env.BUILD_TARGET === "pwa";

const pwaPlugin = VitePWA({
  registerType: "autoUpdate",
  injectRegister: null,
  includeAssets: [
    "icons/*.png",
    "manifest.json",
    "robots.txt",
    "sitemap.xml",
    "privacy.html",
    "terms.html",
    "help.html",
    "health.json",
  ],
  workbox: {
    cleanupOutdatedCaches: true,
    clientsClaim: true,
    skipWaiting: true,
    navigateFallback: "/index.html",
    runtimeCaching: [
      {
        urlPattern: ({ request }) => request.destination === "document",
        handler: "NetworkFirst",
        options: {
          cacheName: "pages",
          networkTimeoutSeconds: 4,
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 24 * 60 * 60,
          },
        },
      },
      {
        urlPattern: ({ request }) =>
          ["style", "script", "worker"].includes(request.destination),
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "assets",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 7 * 24 * 60 * 60,
          },
        },
      },
      {
        urlPattern: ({ request }) => request.destination === "image",
        handler: "CacheFirst",
        options: {
          cacheName: "images",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 30 * 24 * 60 * 60,
          },
        },
      },
      {
        urlPattern: /\/\.netlify\/functions\/claude-proxy/,
        handler: "NetworkOnly",
        method: "POST",
        options: {
          backgroundSync: {
            name: "vyber-ai-queue",
            options: {
              maxRetentionTime: 24 * 60,
            },
          },
        },
      },
      {
        urlPattern: /^https:\/\/api\.anthropic\.com\/v1\/messages/,
        handler: "NetworkOnly",
        method: "POST",
        options: {
          backgroundSync: {
            name: "vyber-ai-queue",
            options: {
              maxRetentionTime: 24 * 60,
            },
          },
        },
      },
    ],
  },
  devOptions: {
    enabled: isPWA && process.env.NODE_ENV === "development",
    type: "module",
  },
});

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react(), pwaPlugin],

  define: {
    __PWA__: JSON.stringify(isPWA),
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  base: isPWA ? "/" : undefined,
  build: {
    ...(isPWA ? { outDir: "dist-pwa" } : {}),
    sourcemap: isPWA,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          ui: ["lucide-react", "clsx", "tailwind-merge"],
          state: ["zustand"],
        },
      },
    },
  },

  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: true,
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
