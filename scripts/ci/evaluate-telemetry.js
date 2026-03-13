const fs = require('fs');
const path = require('path');

fs.mkdirSync('./tmp', { recursive: true });

function readCoverage() {
  try {
    const p = path.resolve('apps/web/coverage/coverage-summary.json');
    const json = JSON.parse(fs.readFileSync(p, 'utf8'));
    return Number(json?.total?.lines?.pct) || 0;
  } catch (err) {
    return 0;
  }
}

const coveragePct = readCoverage();
const error24h = 0;
const errorRatePct = Math.min(100, error24h);

const report = { coveragePct, error24h, errorRatePct };
fs.writeFileSync('./tmp/aegis-report.json', JSON.stringify(report, null, 2));
console.log('Aegis report:', report);
