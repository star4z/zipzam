const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const sourcePath = path.join(repoRoot, 'public', 'solver.html');
const distDir = path.join(repoRoot, 'dist');
const outputPath = path.join(distDir, 'solver.html');

fs.mkdirSync(distDir, { recursive: true });

const html = fs.readFileSync(sourcePath, 'utf8');
fs.writeFileSync(outputPath, html);

console.log(`Generated ${path.relative(repoRoot, outputPath)}`);
