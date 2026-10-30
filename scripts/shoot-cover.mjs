import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 675 }, deviceScaleFactor: 1 });
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://' + process.cwd() + '/web/builder-cover.html');
await p.waitForTimeout(2500);
await p.screenshot({ path: 'demo/builder-cover.png' });
console.log('errors:', errs.length);
await b.close();
