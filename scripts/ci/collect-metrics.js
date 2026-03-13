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

async function githubOpenPRs() {
  try {
    const repo = process.env.GITHUB_REPOSITORY;
    const token = process.env.GITHUB_TOKEN;
    if (!repo || !token) return 0;
    const response = await fetch(`https://api.github.com/repos/${repo}/pulls?state=open&per_page=1`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    if (!response.ok) return 0;
    const data = await response.json();
    let count = Array.isArray(data) ? data.length : 0;
    const link = response.headers.get('link');
    if (link && /rel="last"/.test(link)) {
      const match = link.match(/&page=(\d+)>; rel="last"/);
      if (match) {
        const pageCount = Number(match[1]);
        const perPage = Number(new URL(link.split(';')[0].slice(1, -1)).searchParams.get('per_page') || 30);
        count = pageCount * perPage;
      }
    }
    return count;
  } catch (err) {
    return 0;
  }
}

(async () => {
  const coveragePct = readCoverage();
  const error24h = 0;
  const rlHits24h = 0;
  const openPRs = await githubOpenPRs();
  const lastBuild = process.env.GITHUB_SHA || '';
  const metrics = { coveragePct, error24h, rlHits24h, openPRs, lastBuild };
  fs.writeFileSync('./tmp/metrics.json', JSON.stringify(metrics, null, 2));
  console.log('Metrics:', metrics);
})();
