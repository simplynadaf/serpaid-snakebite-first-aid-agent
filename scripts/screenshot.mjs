import { chromium } from 'playwright';

const URL = 'file://' + process.cwd() + '/web/index.html';
const errs = [];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
p.on('pageerror', (e) => errs.push(e.message));
await p.goto(URL);
await p.waitForTimeout(3500);
await p.screenshot({ path: 'demo/shot-hero.png' });
for (const [id, name] of [['#story', 'story'], ['#how', 'how'], ['#safety', 'safety'], ['#demo', 'demo'], ['#build', 'build']]) {
  await p.evaluate((s) => document.querySelector(s).scrollIntoView({ behavior: 'instant', block: 'start' }), id);
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `demo/shot-${name}.png` });
}
console.log('page errors:', errs.length, errs.slice(0, 3));
await b.close();
