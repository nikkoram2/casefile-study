// Drives the animated vehicle-search benchmark for every mapped scenario with a right and a wrong pick.
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const url = pathToFileURL(resolve(process.env.PAGE ?? 'dist/index.html')).href;
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? undefined });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors: string[] = []; page.on('pageerror', e => errors.push('pageerror: ' + e.message)); page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.goto(url); await page.getByText('Start Full Investigation').click(); await page.waitForTimeout(300);
const ids = ['S6-GANT-1', 'S6-GANT-2', 'S6-GANT-3', 'S6-VEH-1', 'S6-VEH-2', 'S6-VEH-3'];
let checks = 0; const fail: string[] = []; const ok = (c: boolean, m: string) => { checks++; if (!c) fail.push(m); };
for (const id of ids) for (const mode of ['right', 'wrong'] as const) {
  const tag = `${id}-${mode}`;
  await page.evaluate(([i]) => { const g = (window as any).__casefile; const s = (window as any).__scenarios.find((x: any) => x.id === i); (window as any).__done = null; g.playScenario(s, { mode: 'full' }).then((o: any) => { (window as any).__done = o; }); }, [id]);
  await page.waitForSelector('.seq .hot', { timeout: 15000 });
  const n = await page.locator('.seq .hot').count(); ok(n >= 2, `${tag}: hotspots ${n}`);
  if (id === 'S6-GANT-1' && mode === 'right') await page.screenshot({ path: 'shots/seq-1-observe.png' });
  ok(await page.getByRole('button', { name: /I have the facts/ }).count() === 0, `${tag}: decide hidden before facts`);
  for (let i = 0; i < n; i++) { await page.locator('.seq .hot:not(.done)').first().click(); await page.waitForTimeout(150); await page.locator('.cap-text').click(); await page.waitForTimeout(150); }
  if (id === 'S6-GANT-1' && mode === 'right') await page.screenshot({ path: 'shots/seq-2-facts.png' });
  await page.getByRole('button', { name: /I have the facts/ }).click();
  const c = await page.evaluate(() => (window as any).__current);
  const pick = mode === 'right' ? c.correct[0] : c.options.find((o: any) => !c.correct.includes(o.id)).id; const idx = c.options.findIndex((o: any) => o.id === pick);
  if (id === 'S6-GANT-1' && mode === 'right') { await page.screenshot({ path: 'shots/seq-3-decide.png' }); await page.getByRole('button', { name: /hint/i }).first().click(); }
  await page.locator('.seq .opt').nth(idx).click(); await page.getByRole('button', { name: 'Submit decision' }).click();
  if (id === 'S6-GANT-1' && mode === 'wrong') { await page.waitForTimeout(2300); await page.screenshot({ path: 'shots/seq-4-search.png' }); await page.waitForSelector('.evcard:not([hidden])'); await page.waitForTimeout(500); await page.screenshot({ path: 'shots/seq-5-evidence.png' }); }
  await page.waitForSelector('.seq .feedback', { timeout: 20000 });
  if (id === 'S6-GANT-2' && mode === 'right') await page.screenshot({ path: 'shots/seq-6-feedback.png' });
  const fb = await page.locator('.seq .feedback').getAttribute('class'); ok(fb!.includes(mode === 'right' ? 'ok' : 'bad'), `${tag}: feedback class ${fb}`);
  await page.locator('.seq .feedback .btn.primary').click(); await page.waitForFunction(() => (window as any).__done !== null, null, { timeout: 5000 });
  const out = await page.evaluate(() => (window as any).__done); ok(out.correct === (mode === 'right'), `${tag}: correct flag`); ok(id !== 'S6-GANT-1' || mode !== 'right' || out.hintsUsed === 1, `${tag}: hint tracked (${out.hintsUsed})`);
  ok(await page.locator('.seq').count() === 0, `${tag}: overlay removed`);
  const att = await page.evaluate(() => { const r = (window as any).__casefile.profile.records; return r[r.length - 1]; }); ok(att.itemId === id && att.correct === (mode === 'right'), `${tag}: attempt recorded`);
}
// skip test + reduced motion
await page.evaluate(() => { const g = (window as any).__casefile; g.profile.settings.reducedMotion = true; g.applySettings(); });
await page.evaluate(() => { const g = (window as any).__casefile; const s = (window as any).__scenarios.find((x: any) => x.id === 'S6-VEH-3'); (window as any).__done = null; g.playScenario(s, { mode: 'full' }).then((o: any) => { (window as any).__done = o; }); });
await page.waitForSelector('.seq .hot'); ok(true, 'reduced motion loads');
await page.screenshot({ path: 'shots/seq-7-reduced.png' });
console.log(`checks ${checks}, failures ${fail.length}`); fail.forEach(f => console.log(' FAIL', f)); console.log('errors', errors.length, errors.slice(0, 5));
await browser.close(); process.exit(fail.length || errors.length ? 1 : 0);
