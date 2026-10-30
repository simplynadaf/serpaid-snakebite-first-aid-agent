import { chromium } from 'playwright';
import { execSync } from 'node:child_process';
import fs from 'node:fs';

/* Records a cinematic scroll through the SerpAID site, timed to the Polly
   narration segment durations, then the shell script muxes in the audio. */

const URL = 'file://' + process.cwd() + '/web/index.html';
const SEG = JSON.parse(fs.readFileSync('demo/segment-timings.json', 'utf-8')); // {id: seconds}

function dur(id) { return Math.round((SEG[id] || 20) * 1000); }

const b = await chromium.launch();
const ctx = await b.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: 'demo/raw-video', size: { width: 1280, height: 720 } },
});
const p = await ctx.newPage();
await p.goto(URL);
await p.waitForTimeout(3000); // let fonts + three.js settle

// hook: hold on hero
await p.waitForTimeout(dur('hook'));

// story: smooth scroll to story
await smoothScrollTo(p, '#story');
await p.waitForTimeout(dur('story'));

// idea: scroll to how (title) then hold
await smoothScrollTo(p, '#how');
await p.waitForTimeout(dur('idea'));

// how: slowly pan the three flow nodes
await slowScrollBy(p, 420, 2600);
await p.waitForTimeout(dur('how') - 2600);

// safety: scroll to safety split
await smoothScrollTo(p, '#safety');
await p.waitForTimeout(dur('safety'));

// demo: scroll to the phone transcript and linger
await smoothScrollTo(p, '#demo');
await slowScrollBy(p, 380, 2400);
await p.waitForTimeout(dur('demo') - 2400);

// close: scroll to build + footer
await smoothScrollTo(p, '#build');
await p.waitForTimeout(dur('close'));

await ctx.close(); // finalizes the webm
await b.close();

// rename the produced webm to a stable path
const files = fs.readdirSync('demo/raw-video').filter((f) => f.endsWith('.webm'));
if (files.length) {
  fs.renameSync('demo/raw-video/' + files[0], 'demo/serpaid-silent.webm');
  console.log('video:', 'demo/serpaid-silent.webm');
}

async function smoothScrollTo(page, sel) {
  await page.evaluate((s) => {
    const el = document.querySelector(s);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, sel);
  await page.waitForTimeout(1200);
}
async function slowScrollBy(page, px, ms) {
  const steps = 40;
  const each = px / steps;
  const wait = ms / steps;
  for (let i = 0; i < steps; i++) {
    await page.evaluate((d) => window.scrollBy(0, d), each);
    await page.waitForTimeout(wait);
  }
}
