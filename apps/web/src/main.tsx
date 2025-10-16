import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initSentry } from "./lib/sentry";
import { FEAT_PM_SENTRY } from "./lib/flags";
import { reportError } from "./lib/errorReporter";

// Initialize Sentry before rendering app
initSentry();

if (FEAT_PM_SENTRY) {
  window.addEventListener("error", (e) => {
    reportError(e.error, { type: "onerror" });
  });
  window.addEventListener("unhandledrejection", (e) => {
    reportError(e.reason, { type: "unhandledrejection" });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
