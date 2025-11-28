#!/usr/bin/env node
import { spawnSync, execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const list = execSync("git ls-files | grep -E '(^|/)Dockerfile$|\\.Dockerfile$' || true", {
  encoding: "utf8",
}).trim();

const files = list.split("\n").filter(Boolean);

function resolveDigest(ref) {
  const result = spawnSync("docker", ["buildx", "imagetools", "inspect", ref], {
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(`Failed to inspect ${ref}: ${result.stderr || result.stdout}`);
  }
  const match = result.stdout.match(/Digest:\s*(sha256:[a-f0-9]+)/);
  if (!match) {
    throw new Error(`Digest not found for ${ref}`);
  }
  return `${ref}@${match[1]}`;
}

for (const file of files) {
  const lines = readFileSync(file, "utf8").split("\n");
  let changed = false;

  const next = lines.map((line) => {
    const match = line.match(/^\s*FROM\s+([^\s@]+:[^\s@]+)(\s+AS\s+\w+)?\s*$/);
    if (match && !line.includes("@sha256:")) {
      const ref = match[1];
      const alias = match[2] ?? "";
      const pinned = resolveDigest(ref);
      changed = true;
      return `FROM ${pinned}${alias}`;
    }
    return line;
  });

  if (changed) {
    writeFileSync(file, next.join("\n"), "utf8");
    console.log(`Pinned digests in ${file}`);
  }
}
