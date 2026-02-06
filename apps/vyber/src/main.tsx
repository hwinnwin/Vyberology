import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { captureError, initMonitoring } from "./lib/monitoring";
import { getAnalyticsConsent, initAnalytics, isAnalyticsConfigured, isConsentRequired } from "./lib/analytics";
import { initWebVitals } from "./lib/performance";
import { registerServiceWorker } from "./lib/pwa";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

void initMonitoring();
window.addEventListener("error", (event) => {
  if (event.error) {
    captureError(event.error);
  }
});
window.addEventListener("unhandledrejection", (event) => {
  captureError(event.reason);
});

if (isAnalyticsConfigured()) {
  const canInit = !isConsentRequired() || getAnalyticsConsent();
  if (canInit) {
    void initAnalytics()
      .then(() => initWebVitals())
      .catch((error) => captureError(error));
  }
}

if (__PWA__) {
  void registerServiceWorker();
}
