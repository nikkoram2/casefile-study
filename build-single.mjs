// Builds ONE self-contained XHTML file (casefile.xml): HTML + CSS + JS inlined. Works opened directly from disk.
import { readFileSync, writeFileSync } from 'node:fs';
const js = readFileSync('dist/assets/main.js', 'utf8'), css = readFileSync('dist/assets/main.css', 'utf8');
if (js.includes(']]>') || css.includes(']]>')) throw new Error('payload contains ]]> and cannot be CDATA-wrapped');
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>CASEFILE: Shadows of Justice · Criminal Procedure study game</title>
<style>/*<![CDATA[*/
${css}
/*]]>*/</style>
</head>
<body>
<div id="app"><div id="stage"><canvas id="game" aria-label="Game world" role="img"></canvas></div></div>
<div id="hud" hidden="hidden">
  <div class="l"><div id="hud-ch"></div><div id="hud-obj"></div></div>
  <div class="prog" title="Session progress"><i id="hud-bar"></i></div><span id="hud-time" class="muted"></span>
  <button id="btn-notebook" class="hbtn" title="Notebook (Tab)" aria-label="Open notebook"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h11a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6z"/><path d="M6 3v18M10 8h5M10 12h5"/></svg></button>
  <button id="mute" class="hbtn" title="Mute / unmute" aria-label="Toggle sound"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 9v6h4l5 4V5L8 9z"/><path class="w" d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg></button>
  <button id="btn-full" class="hbtn" title="Fullscreen" aria-label="Toggle fullscreen"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button>
  <button id="btn-pause" class="hbtn" title="Pause (Esc)" aria-label="Pause"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg></button>
</div>
<div id="ui"></div><div id="fade"></div>
<script>//<![CDATA[
${js}
//]]></script>
</body>
</html>
`;
writeFileSync('casefile.xhtml', xml); console.log('casefile.xhtml', Math.round(xml.length / 1024) + ' KB');
