// Static production build: bundles TS + CSS with esbuild into ./dist using RELATIVE paths (works on GitHub Pages sub-paths, Netlify, or double-clicking index.html).
import { build } from 'esbuild';
import { cpSync, mkdirSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
rmSync('dist', { recursive: true, force: true }); mkdirSync('dist/assets', { recursive: true });
await build({ entryPoints: { main: 'src/main.ts' }, bundle: true, minify: !process.env.DEV, outdir: 'dist/assets', format: 'iife', target: 'es2020', loader: { '.json': 'json', '.png': 'dataurl' }, sourcemap: false, logLevel: 'info' });
cpSync('src/style.css', 'dist/assets/main.css'); cpSync('index.html', 'dist/index.html'); cpSync('public', 'dist', { recursive: true });
// Cache-busting: GitHub Pages serves assets with a 10-minute cache and unchanged file names, so stale JS/CSS can linger. Version the URLs by content hash.
import { createHash } from 'node:crypto';
const hash = f => createHash('sha1').update(readFileSync(f)).digest('hex').slice(0, 10);
let html = readFileSync('dist/index.html', 'utf8');
html = html.replace('./assets/main.css', './assets/main.css?v=' + hash('dist/assets/main.css')).replace('./assets/main.js', './assets/main.js?v=' + hash('dist/assets/main.js'));
writeFileSync('dist/index.html', html);
writeFileSync('dist/.nojekyll', '');
console.log('Build OK →', 'dist/index.html', Math.round(readFileSync('dist/assets/main.js').length / 1024) + ' KB JS');
