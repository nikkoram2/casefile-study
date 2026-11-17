// Static production build: bundles TS + CSS with esbuild into ./dist using RELATIVE paths (works on GitHub Pages sub-paths, Netlify, or double-clicking index.html).
import { build } from 'esbuild';
import { cpSync, mkdirSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
rmSync('dist', { recursive: true, force: true }); mkdirSync('dist/assets', { recursive: true });
await build({ entryPoints: { main: 'src/main.ts' }, bundle: true, minify: !process.env.DEV, outdir: 'dist/assets', format: 'iife', target: 'es2020', loader: { '.json': 'json', '.png': 'dataurl' }, sourcemap: false, logLevel: 'info' });
cpSync('src/style.css', 'dist/assets/main.css'); cpSync('index.html', 'dist/index.html'); cpSync('public', 'dist', { recursive: true });
writeFileSync('dist/.nojekyll', '');
console.log('Build OK →', 'dist/index.html', Math.round(readFileSync('dist/assets/main.js').length / 1024) + ' KB JS');
