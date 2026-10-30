import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
await p.goto('file://' + process.cwd() + '/web/thumbnail.html');
await p.waitForTimeout(2500);
await p.screenshot({ path: 'demo/serpaid-thumbnail.png' });
console.log('thumbnail saved');
await b.close();
