// End-to-end: drives the BUILT game in headless Chromium. Usage: tsx tests/e2e.ts [correct|wrong|hints]
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const mode = (process.argv[2] ?? 'correct') as 'correct' | 'wrong' | 'hints';
const url = pathToFileURL(resolve(process.env.PAGE ?? 'dist/index.html')).href;
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? undefined });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors: string[] = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message + ' @ ' + (e.stack||'').split('\n').slice(0,3).join(' / '))); page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.goto(url);
const shot = (n: string) => page.screenshot({ path: `shots/${mode}-${n}.png` });
await shot('01-menu');
await page.getByText('Start Full Investigation').click();
await page.waitForTimeout(300); await shot('02-precinct');

const target = async () => page.evaluate(() => { const g = (window as any).__casefile; const w = g.world; const t = w.map.interactables.find((i: any) => i.id === w.targetId); return t ? { x: t.x, y: t.y, id: t.id, map: w.map.id } : null; });
const drill = async () => {
  for (let g = 0; g < 40 && await page.locator('[aria-label="Memory drill"]').count(); g++) {
    const d = page.locator('[aria-label="Memory drill"]');
    if (await d.getByRole('button', { name: /I'm ready/ }).count()) await d.getByRole('button', { name: /I'm ready/ }).click();
    else if (await d.locator('.opt').count()) await d.locator('.opt').first().click();
    else if (await d.getByRole('button', { name: 'Check' }).count() && !(await d.getByRole('button', { name: 'Next' }).isVisible())) { await d.locator('textarea').fill('rule'); await d.getByRole('button', { name: 'Check' }).click(); }
    else if (await d.getByRole('button', { name: 'Next' }).count()) await d.getByRole('button', { name: 'Next' }).click();
    await page.waitForTimeout(120);
  }
};
const answerPanel = async () => {
  // loop while a decision panel is open
  for (let guard = 0; guard < 80; guard++) {
    if (await page.locator('.dialogue').count()) { await page.keyboard.press('Space'); await page.waitForTimeout(30); continue; }
    if (await page.locator('.seq').count() && await page.locator('.seq .skip:visible').count() && !(await page.locator('.seq .hot').count())) { await page.locator('.seq .skip:visible').first().click({ timeout: 1500 }).catch(() => {}); await page.waitForTimeout(150); continue; }
    if (await page.locator('.seq').count()) {
      await page.waitForSelector('.seq .hot', { timeout: 15000 }); const n = await page.locator('.seq .hot').count();
      for (let i = 0; i < n; i++) { await page.locator('.seq .hot:not(.done)').first().click(); await page.waitForTimeout(120); await page.locator('.cap-text').click(); await page.waitForTimeout(120); }
      await page.getByRole('button', { name: /I have the facts/ }).click();
      const sc = await page.evaluate(() => (window as any).__current); if (mode === 'hints') for (let i = 0; i < 3; i++) await page.getByRole('button', { name: /hint/i }).first().click();
      const pickId = mode === 'wrong' ? sc.options.find((o: any) => !sc.correct.includes(o.id)).id : sc.correct[0];
      await page.locator('.seq .opt').nth(sc.options.findIndex((o: any) => o.id === pickId)).click(); await page.getByRole('button', { name: 'Submit decision' }).click();
      await page.locator('.seq .feedback').waitFor({ timeout: 20000 }); await page.locator('.seq .feedback .btn.primary').click(); await page.waitForTimeout(60); continue;
    }
    let open = await page.locator('.scenario').count(); if (!open) { await page.waitForTimeout(250); open = (await page.locator('.scenario').count()) + (await page.locator('.dialogue').count()) + (await page.locator('.seq').count()); if (!open) return; continue; }
    const info = await page.evaluate(() => { const c = (window as any).__current; return { kind: c.options && c.correct && Array.isArray(c.correct) ? 'scenario' : 'recall', c }; });
    const c = info.c;
    if (mode === 'hints') { for (let i = 0; i < 3; i++) await page.getByRole('button', { name: /hint/i }).first().click(); }
    if (info.kind === 'scenario') {
      const right: string[] = c.correct;
      const wrongPick = c.type === 'choice' ? [c.options.find((o: any) => !right.includes(o.id)).id] : c.type === 'order' ? [...right].reverse() : [c.options.find((o: any) => !right.includes(o.id)).id];
      const picks = mode === 'wrong' ? wrongPick : right;
      for (const id of picks) await page.locator(`.scenario .opt[data-id="${id}"]`).click();
      await page.getByRole('button', { name: 'Submit decision' }).click();
    } else {
      const pickId = mode === 'wrong' ? c.options.find((o: any) => o.id !== c.correct).id : c.correct;
      const idx = c.options.findIndex((o: any) => o.id === pickId);
      await page.locator('.scenario .opt').nth(idx).click();
    }
    await page.locator('.feedback').waitFor();
    if (guard === 0) await shot('0x-feedback-' + c.id);
    await page.locator('.feedback .btn.primary').click(); await page.waitForTimeout(40);
  }
};
const dialogue = async () => { for (let i = 0; i < 12; i++) { if (!(await page.locator('.dialogue').count())) return; await page.keyboard.press('Space'); await page.waitForTimeout(20); } };

let steps = 0;
for (; steps < 60; steps++) {
  let t = await target(); for (let k = 0; !t && k < 12 && !(await page.locator('.summary').count()); k++) { await page.waitForTimeout(500); t = await target(); } if (!t) break;
  await page.evaluate(({ x, y }) => { const w = (window as any).__casefile.world; w.setPosition(x - 6, y + 4); }, t);
  await page.waitForTimeout(80);
  await page.keyboard.press('e'); await page.waitForTimeout(120);
  if (steps === 1) await shot('03-dialogue');
  await dialogue(); await page.waitForTimeout(500);
  if (await page.locator('.scenario').count() && steps === 1) await shot('04-scenario');
  await answerPanel(); await page.waitForTimeout(700); await drill();
  if (await page.locator('.summary').count()) break;
  if (steps === 4) await shot('05-alder');
}
console.log('loop ended at steps=', steps, await page.evaluate(() => JSON.stringify({ step: (window as any).__casefile.profile.run.stepIdx, tgt: (window as any).__casefile.world.targetId, ui: document.querySelector('#ui')!.innerText.slice(0,200) }))); await shot('err'); console.log('ERRS', errors); await page.waitForSelector('.summary', { timeout: 5000 });
await shot('99-summary');
const summary = await page.locator('.summary').innerText();
const stats = await page.evaluate(() => { const g = (window as any).__casefile; const r = g.profile.run; return { records: g.profile.records.length, correct: g.profile.records.filter((x: any) => x.correct).length, seen: r.seenScenarios.length, enc: r.encountered.length, stepIdx: r.stepIdx, flags: r.flags }; });
console.log(JSON.stringify({ mode, steps, stats }));
console.log(summary.split('\n').slice(0, 12).join(' | '));
// persistence: reload and continue
await page.reload(); await page.waitForTimeout(300);
const cont = page.getByText(/Continue Session/); console.log('continue button enabled after reload:', await cont.isEnabled());
await shot('98-reloaded-menu');
console.log('errors:', errors.length ? errors : 'none');
await browser.close(); process.exit(errors.length ? 1 : 0);
