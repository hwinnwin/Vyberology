// k6 load test for Vyberology reading endpoint.
import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "https://<staging-domain>";
const TOKEN = __ENV.AUTH || "";
const PAYLOAD = JSON.stringify({
  input: { text: "1111 1221 144", locale: "en-AU" },
  meta: { requestId: "00000000-0000-4000-8000-000000000001" },
});

export const options = {
  discardResponseBodies: true,
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<200"],
  },
  scenarios: {
    burst: {
      executor: "constant-arrival-rate",
      rate: 100,
      timeUnit: "1s",
      duration: "60s",
      preAllocatedVUs: 50,
      maxVUs: 200,
      exec: "hit_reading",
    },
    sustain: {
      executor: "constant-arrival-rate",
      rate: 40,
      timeUnit: "1s",
      duration: "5m",
      preAllocatedVUs: 30,
      maxVUs: 150,
      exec: "hit_reading",
      startTime: "65s",
    },
  },
  summaryTrendStats: ["avg", "min", "med", "p(90)", "p(95)", "p(99)", "max"],
};

export function setup() {
  return {
    url: `${BASE_URL}/supabase/functions/v1/reading`,
    headers: {
      "content-type": "application/json",
      ...(TOKEN ? { authorization: `Bearer ${TOKEN}` } : {}),
    },
  };
}

export function hit_reading(data) {
  const res = http.post(data.url, PAYLOAD, { headers: data.headers });

  check(res, {
    "status is 200/400": (r) => r.status === 200 || r.status === 400,
    "json content-type": (r) => (r.headers["Content-Type"] || "").includes("application/json"),
  });

  sleep(Math.random() * 0.1);
}

export function handleSummary(data) {
  return {
    "perf/k6-summary.json": JSON.stringify(data, null, 2),
    stdout: `\n--- p95: ${data.metrics.http_req_duration.values["p(95)"]} ms, error rate: ${data.metrics.http_req_failed.values.rate}\n`,
  };
}
