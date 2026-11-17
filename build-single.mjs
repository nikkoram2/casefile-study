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
  <button id="btn-notebook" class="hbtn" title="Notebook (Tab)" aria-label="Open notebook">📓</button>
  <button id="mute" class="hbtn" title="Mute / unmute" aria-label="Toggle sound">🔊</button>
  <button id="btn-full" class="hbtn" title="Fullscreen" aria-label="Toggle fullscreen">⛶</button>
  <button id="btn-pause" class="hbtn" title="Pause (Esc)" aria-label="Pause">⏸</button>
</div>
<div id="ui"></div><div id="fade"></div>
<script>//<![CDATA[
${js}
//]]></script>
</body>
</html>
`;
writeFileSync('casefile.xhtml', xml); console.log('casefile.xhtml', Math.round(xml.length / 1024) + ' KB');
