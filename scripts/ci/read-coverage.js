const fs = require('fs');
const path = require('path');

function main() {
  const summaryPath = path.resolve('apps/web/coverage/coverage-summary.json');
  if (!fs.existsSync(summaryPath)) {
    console.error('Coverage summary not found at', summaryPath);
    process.exit(1);
  }
  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
  const pct = summary?.total?.lines?.pct ?? 0;
  console.log(`Coverage lines: ${pct}%`);
}

main();
