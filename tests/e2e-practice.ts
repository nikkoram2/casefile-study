import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url'; import { resolve } from 'node:path';
const browser = await chromium.launch({ executablePath: process.env.CHROME });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
await page.goto(pathToFileURL(resolve(process.env.PAGE ?? 'dist/index.html')).href);
const answer = async (n: number, wrongEvery = 0) => {
  for (let i = 0; i < n; i++) {
    await page.locator('.scenario').waitFor({ timeout: 4000 });
    const c = await page.evaluate(() => (window as any).__current);
    if (c.options[0].text !== undefined && c.correct && Array.isArray(c.correct)) {
      const wrong = wrongEvery && i % wrongEvery === 0; const right: string[] = c.correct;
      const picks = wrong ? [c.options.find((o: any) => !right.includes(o.id)).id] : right;
      for (const id of picks) await page.locator(`.scenario .opt[data-id="${id}"]`).click(); await page.getByRole('button', { name: 'Submit decision' }).click();
    } else { const wrong = wrongEvery && i % wrongEvery === 0; const idx = c.options.findIndex((o: any) => wrong ? o.id !== c.correct : o.id === c.correct); await page.locator('.scenario .opt').nth(idx).click(); }
    await page.locator('.feedback .btn.primary').click();
  }
};
// Targeted practice: Chapter 8, cases, 5 questions
await page.getByRole('button', { name: /Targeted Practice/ }).click(); await page.getByRole('radio', { name: 'Ch 8' }).click(); await page.getByRole('radio', { name: 'Case law' }).click(); await page.getByRole('radio', { name: '5', exact: true }).click();
await page.getByRole('button', { name: 'Start practice' }).click(); await answer(5, 2);
await page.locator('.summary').waitFor(); console.log('targeted summary ok:', (await page.locator('.summary h2').innerText()));
await page.screenshot({ path: 'shots/practice-summary.png' });
await page.getByRole('button', { name: /5-minute review/ }).click(); const t = await page.evaluate(() => 1); void t;
const n5 = await page.locator('.scenario').count(); console.log('five-minute review opened:', n5 === 1);
// finish review quickly
for (let i = 0; i < 6 && await page.locator('.scenario').count(); i++) { await answer(1); }
await page.locator('.summary').waitFor(); await page.getByRole('button', { name: 'Main menu' }).click();
// Rapid review: run 30 questions
await page.getByRole('button', { name: /Rapid Review/ }).click(); await answer(30); await page.locator('.summary').waitFor(); console.log('rapid ok'); await page.getByRole('button', { name: 'Main menu' }).click();
// Encyclopedia
await page.getByRole('button', { name: /Case Encyclopedia/ }).click(); await page.getByRole('button', { name: 'Herring v. United States' }).click(); console.log('encyclopedia detail:', (await page.locator('.encdetail h3').innerText()));
await page.screenshot({ path: 'shots/encyclopedia.png' }); await page.getByRole('button', { name: 'Close' }).click();
// Settings: text size + contrast
await page.getByRole('button', { name: /Settings/ }).click(); await page.locator('select').selectOption('1.5'); await page.locator('input[type=checkbox]').nth(1).check(); await page.screenshot({ path: 'shots/settings-large-hc.png' });
console.log('errors:', errors.length ? errors : 'none'); await browser.close(); process.exit(errors.length ? 1 : 0);
