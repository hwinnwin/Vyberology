const fs = require('fs');

const stamp = `\n[aegis-regenerated]: ${new Date().toISOString()}\n`;

try {
  const filePath = './README.md';
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '# Vyberology';
  const cleaned = existing.replace(/\n\[aegis-regenerated\]:.*$/m, '');
  fs.writeFileSync(filePath, `${cleaned}${stamp}`);
  console.log('Regen scaffold updated README stamp.');
} catch (error) {
  console.error('Regen scaffold failed:', error.message);
  process.exit(0);
}
