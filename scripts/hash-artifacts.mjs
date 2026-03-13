import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const artifacts = {
  eslint_json: ".aegis_audit/eslint_apps-web.json",
  fix_plan: ".aegis_audit/stage4a_fix_plan.md",
  diff_files: ".aegis_audit/diff_files.txt",
  report: ".aegis_audit/stage4a_report.json",
  verification: "docs/verification-stage4a.md",
  k6_summary: ".aegis_audit/k6-summary.json",
  readme: "README.md",
  changelog: "CHANGELOG.md",
};

const sum = async (path) => {
  const data = await readFile(path);
  return createHash("sha256").update(data).digest("hex");
};

const results = {};

for (const [key, path] of Object.entries(artifacts)) {
  try {
    results[key] = `sha256:${await sum(path)}`;
  } catch {
    results[key] = null;
  }
}

console.log(JSON.stringify({ checksums: results }, null, 2));
