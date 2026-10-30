import { chromium } from 'playwright';
import fs from 'node:fs';

// scene id -> audio segment id; durations come from the mp3s via demo/reel3-timings.json
const SEQ = [
  ['intro', 'w_intro'],
  ['case1', 'w_caseA'],   // problem narration plays over intro->case1 transition; handled by timings file
  ['case2', 'w_caseB'],
  ['case3', 'w_caseC'],
  ['repo',  'w_repo'],
  ['outro', 'w_outro'],
];
const T = JSON.parse(fs.readFileSync('demo/reel3-timings.json', 'utf-8')); // seconds per audio id, with gaps

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: 'demo/raw-reel', size: { width: 1280, height: 720 } } });
const p = await ctx.newPage();
await p.goto('file://' + process.cwd() + '/web/reel.html');
await p.waitForTimeout(4000); // settle three.js + fonts (incl Devanagari)

// intro holds through intro + problem narration
await p.evaluate(() => window.showScene('intro'));
await hold(T.v_intro + T.v_problem);

for (const [scene, aud] of SEQ.slice(1)) {
  await p.evaluate((s) => window.showScene(s), scene);
  await p.waitForTimeout(500);
  await hold(T[aud]);
  // safety narration plays over case3 -> repo; add it to case3 hold
  if (aud === 'w_caseC') await hold(T.w_safety);
}

await ctx.close();
await b.close();
const files = fs.readdirSync('demo/raw-reel').filter((f) => f.endsWith('.webm'));
if (files.length) { fs.renameSync('demo/raw-reel/' + files[0], 'demo/reel-silent.webm'); console.log('reel video:', 'demo/reel-silent.webm'); }

async function hold(sec) { await p.waitForTimeout(Math.round(sec * 1000)); }
