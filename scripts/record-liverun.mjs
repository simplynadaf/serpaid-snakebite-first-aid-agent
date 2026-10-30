import { chromium } from 'playwright';
import fs from 'node:fs';

const URL = 'file://' + process.cwd() + '/web/live-run.html';
const b = await chromium.launch();
const ctx = await b.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: 'demo/raw-liverun', size: { width: 1280, height: 720 } },
});
const p = await ctx.newPage();
await p.goto(URL);
// let the full typed sequence play out (sum of delays + typing ~ 11s) plus a hold
await p.waitForTimeout(13500);
await ctx.close();
await b.close();
const files = fs.readdirSync('demo/raw-liverun').filter((f) => f.endsWith('.webm'));
if (files.length) {
  fs.renameSync('demo/raw-liverun/' + files[0], 'demo/live-run.webm');
  console.log('live-run clip:', 'demo/live-run.webm');
}
