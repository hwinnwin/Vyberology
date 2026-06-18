import { execSync } from "node:child_process";

if (process.env.NETLIFY === "true" && process.platform === "linux") {
  const pkg = "@rollup/rollup-linux-x64-gnu@^4";
  try {
    execSync(`npm install ${pkg} --no-save --prefer-offline`, { stdio: "inherit" });
  } catch {
    execSync(`npm install ${pkg} --no-save`, { stdio: "inherit" });
  }
}
