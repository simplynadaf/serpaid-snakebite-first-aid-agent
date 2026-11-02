/**
 * SerpAID demo recorder — per-segment clips for a narrated walkthrough.
 *
 * Produces, into demo/full-raw/clips/:
 *   0-github.webm   smooth README scroll (narrator n_github over it)
 *   1-hi.webm ...   one live use-case clip per language
 *
 * Each use-case clip is paced as: narrator_len (type the message while it plays)
 * + response_voice_len (the real localized Polly answer plays as-is).
 * The muxer lays the narrator audio then the response audio onto each clip.
 *
 * Run: node scripts/record-demo-segments.mjs
 */
import { chromium } from 'playwright';
import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CLIPS = path.join(ROOT, 'demo', 'full-raw', 'clips');
const NARR = path.join(ROOT, 'demo', 'full-raw', 'narration');
const RESP = path.join(ROOT, 'samples', 'audio');
fs.mkdirSync(CLIPS, { recursive: true });

const REPO = 'https://github.com/simplynadaf/serpaid-snakebite-first-aid-agent';
const SITE = 'file://' + ROOT + '/docs/index.html';

function dur(f) { return parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "${f}"`).toString().trim()) || 10; }

const server = spawn(path.join(ROOT, '.venv', 'bin', 'python'),
  ['-m', 'uvicorn', 'livedemo.server:app', '--host', '127.0.0.1', '--port', '8808'], { cwd: ROOT, stdio: 'ignore' });
async function waitSrv(u){ for(let i=0;i<40;i++){try{const r=await fetch(u);if(r.ok)return;}catch{}await new Promise(r=>setTimeout(r,500));} }

async function hold(page, ms){ const n=Math.ceil(ms/250); for(let i=0;i<n;i++){ await page.evaluate(()=>{const a=document.getElementById('demoAudio');if(a)a.setAttribute('data-k',''+Date.now());}); await page.waitForTimeout(250);} }
async function smooth(page, ms){ const h=await page.evaluate(()=>Math.max(1,document.body.scrollHeight-window.innerHeight)); const s=60,w=Math.max(12,Math.floor(ms/s)); for(let i=1;i<=s;i++){await page.evaluate(y=>window.scrollTo(0,y),h*i/s);await page.waitForTimeout(w);} }

const CASES = [
  { id: 'hi', sel: '0', resp: 'tourniquet-eyelids.hi.mp3' },
  { id: 'pt', sel: '1', resp: 'ice-remote.pt.mp3' },
  { id: 'es', sel: '2', resp: 'suction-breathing.es.mp3' },
  { id: 'fr', sel: '3', resp: 'bleeding-scared.fr.mp3' },
];

async function recGithub() {
  const d = path.join(CLIPS, '_gh'); fs.mkdirSync(d, { recursive: true });
  const nlen = dur(path.join(NARR, 'n_github.mp3'));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, recordVideo: { dir: d, size: { width: 1280, height: 800 } } });
  const p = await ctx.newPage();
  try {
    await p.goto(REPO + '#readme', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await p.waitForTimeout(4500);
    // jump to the rendered README, then smooth-scroll through it for the narration length
    await p.evaluate(() => { const r = document.querySelector('[data-testid="readme"], article.markdown-body, #readme'); if (r) r.scrollIntoView(); });
    await p.waitForTimeout(1500);
    await smooth(p, Math.max(8000, (nlen - 3) * 1000));
    await p.waitForTimeout(1200);
  } catch (e) { console.error('gh:', e.message); }
  await ctx.close(); await b.close();
  const w = fs.readdirSync(d).find(f => f.endsWith('.webm'));
  fs.renameSync(path.join(d, w), path.join(CLIPS, '0-github.webm'));
  console.log('CLIP 0-github', (nlen).toFixed(1));
}

async function recCase(c, idx) {
  const d = path.join(CLIPS, '_' + c.id); fs.mkdirSync(d, { recursive: true });
  const nlen = dur(path.join(NARR, `n_case_${c.id}.mp3`));
  const rlen = dur(path.join(RESP, c.resp));
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, recordVideo: { dir: d, size: { width: 1280, height: 800 } } });
  const p = await ctx.newPage();
  await p.goto(SITE); await p.waitForTimeout(1200);
  await p.evaluate(() => document.getElementById('demo').scrollIntoView({ block: 'start' }));
  await p.waitForTimeout(800);
  await p.selectOption('#demoCase', c.sel);
  // narrator is explaining during this window: show the input settling
  await hold(p, Math.max(3000, (nlen - 2) * 1000));
  await p.click('#demoGo');
  try { await p.waitForSelector('.demo-mode.live', { timeout: 12000 }); } catch {}
  // response voice plays as-is: hold for its full length
  await hold(p, (rlen + 1.5) * 1000);
  await ctx.close(); await b.close();
  const w = fs.readdirSync(d).find(f => f.endsWith('.webm'));
  fs.renameSync(path.join(d, w), path.join(CLIPS, `${idx}-${c.id}.webm`));
  console.log(`CLIP ${idx}-${c.id}  narr ${nlen.toFixed(1)}  resp ${rlen.toFixed(1)}`);
}

async function main() {
  await waitSrv('http://127.0.0.1:8808/');
  await recGithub();
  for (let i = 0; i < CASES.length; i++) await recCase(CASES[i], i + 1);
  console.log('ALL CLIPS DONE');
}
main().then(() => { server.kill('SIGTERM'); process.exit(0); })
      .catch(e => { console.error(e); server.kill('SIGTERM'); process.exit(1); });
