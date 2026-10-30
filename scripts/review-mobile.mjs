import { chromium } from 'playwright';
const URL = 'https://simplynadaf.github.io/serpaid-snakebite-first-aid-agent/';
const errs = [];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
p.on('pageerror', e => errs.push(e.message));
await p.goto(URL, { waitUntil: 'networkidle' });
await p.waitForTimeout(3000);
// check for horizontal overflow (the #1 mobile bug)
const overflow = await p.evaluate(() => ({
  scrollW: document.documentElement.scrollWidth,
  clientW: document.documentElement.clientWidth,
  bodyScrollW: document.body.scrollWidth,
}));
console.log('overflow check:', JSON.stringify(overflow), overflow.scrollW > overflow.clientW + 1 ? 'HORIZONTAL OVERFLOW!' : 'no overflow OK');
await p.screenshot({ path: 'demo/m-hero.png' });
for (const [id,name] of [['#story','m-story'],['#how','m-how'],['#safety','m-safety'],['#demo','m-demo'],['#build','m-build']]) {
  await p.evaluate(s=>document.querySelector(s)?.scrollIntoView({behavior:'instant',block:'start'}), id);
  await p.waitForTimeout(900);
  await p.screenshot({ path: `demo/${name}.png` });
}
console.log('page errors:', errs.length, errs.slice(0,3));
await b.close();
