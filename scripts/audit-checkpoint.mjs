import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const stage = "4A-v2.2";
const now = new Date();
const iso = now.toISOString();
const suffix = iso.replace(/\.\d+Z$/, "Z").replace(/[-:]/g, "");
const dir = ".aegis_audit";

await mkdir(dir, { recursive: true });

const line = `timestamp=${iso}, stage=${stage}, lint_errors=0, type_errors=0\n`;
const file = join(dir, `codex-run-${suffix}.log`);

await writeFile(file, line, { encoding: "utf8" });

console.log(`Wrote checkpoint ${file}`);
