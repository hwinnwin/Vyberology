import { onCLS, onINP, onLCP, onTTFB, type Metric } from "web-vitals";
import { trackEvent } from "@/lib/analytics";

function report(metric: Metric) {
  trackEvent("web_vital", {
    id: metric.id,
    name: metric.name,
    value: metric.value.toString(),
    rating: metric.rating,
  });
}

export function initWebVitals() {
  onCLS(report);
  onINP(report);
  onLCP(report);
  onTTFB(report);
}
