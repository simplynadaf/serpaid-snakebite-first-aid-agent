import { chromium } from 'playwright';
const URL = 'https://simplynadaf.github.io/serpaid-snakebite-first-aid-agent/';
const errs = [], failed = [];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
p.on('pageerror', e => errs.push(e.message));
p.on('requestfailed', r => failed.push(r.url()));
p.on('response', r => { if (r.status() >= 400) failed.push(r.status()+' '+r.url()); });
await p.goto(URL, { waitUntil: 'networkidle' });
await p.waitForTimeout(3500);
await p.screenshot({ path: 'demo/live-hero.png' });
for (const [id, name] of [['#story','live-story'],['#safety','live-safety'],['#demo','live-demo'],['#build','live-build']]) {
  await p.evaluate(s => document.querySelector(s)?.scrollIntoView({behavior:'instant',block:'start'}), id);
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `demo/${name}.png` });
}
console.log('page errors:', errs.length, errs.slice(0,3));
console.log('failed/4xx requests:', failed.length, failed.slice(0,5));
await b.close();
