import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";
import './styles/mobile-native.css';
import { initSentry } from "./lib/sentry";
import { FEAT_PM_SENTRY } from "./lib/flags";
import { reportError } from "./lib/errorReporter";
import { attachGlobalErrorHandlers } from "./lib/logger";
import { initPlatform } from './lib/platform';
initPlatform();

// Initialize Sentry before rendering app
initSentry();
attachGlobalErrorHandlers();

if (FEAT_PM_SENTRY) {
  window.addEventListener("error", (e) => {
    reportError(e.error, { type: "onerror" });
  });
  window.addEventListener("unhandledrejection", (e) => {
    reportError(e.reason, { type: "unhandledrejection" });
  });
}

// Register PWA service worker (auto-update mode)
registerSW({
  onRegisteredSW(_swUrl, registration) {
    if (registration) {
      setInterval(() => { registration.update(); }, 60 * 60 * 1000);
    }
  },
  onOfflineReady() {
    console.log("[PWA] App ready to work offline");
  },
  onRegisterError(error) {
    console.error("[PWA] SW registration failed:", error);
  },
});

createRoot(document.getElementById("root")!).render(<App />);
