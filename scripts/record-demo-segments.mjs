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
const SITE = 'file://' + ROOT + '/docs/index.html?record=1';   // record mode = page audio muted
const VW = 2560, VH = 1440;   // 2K 16:9 so website + github + bookend cards all fit
const TIMING = {};            // per-case: when the answer actually appears on screen

function dur(f) { return parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "${f}"`).toString().trim()) || 10; }

// type visibly, one character at a time, into a field
async function typeVisible(page, sel, text) {
  await page.click(sel);
  await page.fill(sel, '');
  for (const ch of text) {
    await page.type(sel, ch, { delay: 45 + Math.random() * 55 });
  }
}

const server = spawn(path.join(ROOT, '.venv', 'bin', 'python'),
  ['-m', 'uvicorn', 'livedemo.server:app', '--host', '127.0.0.1', '--port', '8808'], { cwd: ROOT, stdio: 'ignore' });
async function waitSrv(u){ for(let i=0;i<40;i++){try{const r=await fetch(u);if(r.ok)return;}catch{}await new Promise(r=>setTimeout(r,500));} }

async function hold(page, ms){ const n=Math.ceil(ms/250); for(let i=0;i<n;i++){ await page.evaluate(()=>{const a=document.getElementById('demoAudio');if(a)a.setAttribute('data-k',''+Date.now());}); await page.waitForTimeout(250);} }
async function smooth(page, ms){ const h=await page.evaluate(()=>Math.max(1,document.body.scrollHeight-window.innerHeight)); const s=60,w=Math.max(12,Math.floor(ms/s)); for(let i=1;i<=s;i++){await page.evaluate(y=>window.scrollTo(0,y),h*i/s);await page.waitForTimeout(w);} }

const CASES = [
  { id: 'hi', sel: '0', resp: 'tourniquet-eyelids.hi.mp3', text: 'My cousin was just bitten by a snake on the ankle near Pune. Should I tie a tight cloth above the bite and take him to the village healer? His eyelids feel heavy.' },
  { id: 'pt', sel: '1', resp: 'ice-remote.pt.mp3', text: 'A farm worker was bitten in the field. We packed the wound in ice while we wait. He is hours from any clinic.' },
  { id: 'es', sel: '2', resp: 'suction-breathing.es.mp3', text: 'My son was bitten by a snake and now he is having trouble breathing. His uncle is trying to suck the venom out.' },
  { id: 'fr', sel: '3', resp: 'bleeding-scared.fr.mp3', text: 'A woman was bitten near the river and the wound keeps bleeding. We are very scared and do not know what to do.' },
];

async function recGithub() {
  const d = path.join(CLIPS, '_gh'); fs.mkdirSync(d, { recursive: true });
  const nlen = dur(path.join(NARR, 'n_github.mp3'));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: VW, height: VH }, recordVideo: { dir: d, size: { width: VW, height: VH } } });
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
  const ctx = await b.newContext({ viewport: { width: VW, height: VH }, recordVideo: { dir: d, size: { width: VW, height: VH } } });
  const p = await ctx.newPage();
  await p.goto(SITE); await p.waitForTimeout(1200);
  await p.evaluate(() => document.getElementById('demo').scrollIntoView({ block: 'start' }));
  await p.waitForTimeout(900);
  const t0 = Date.now();                         // clip timeline starts here
  await p.selectOption('#demoCase', c.sel);
  await p.waitForTimeout(400);
  await typeVisible(p, '#demoInput', c.text);    // visible typing
  await p.waitForTimeout(700);
  await p.click('#demoGo');
  // wait until the response is actually on screen, then mark that instant
  try { await p.waitForSelector('.demo-mode.live', { timeout: 12000 }); } catch {}
  try { await p.waitForFunction(() => { const e=document.getElementById('demoAnswerText'); return e && e.textContent && e.textContent.length>20 && !e.querySelector('.typing'); }, { timeout: 12000 }); } catch {}
  const respAt = (Date.now() - t0) / 1000;       // seconds into the clip when the answer appears
  // response voice plays as-is from here
  await hold(p, (rlen + 1.5) * 1000);
  const clipLen = (Date.now() - t0) / 1000;
  await ctx.close(); await b.close();
  const w = fs.readdirSync(d).find(f => f.endsWith('.webm'));
  fs.renameSync(path.join(d, w), path.join(CLIPS, `${idx}-${c.id}.webm`));
  TIMING[c.id] = { respAt: Math.round(respAt * 100) / 100, clipLen: Math.round(clipLen * 100) / 100 };
  console.log(`CLIP ${idx}-${c.id}  respAt=${respAt.toFixed(1)}s  narr ${nlen.toFixed(1)}  resp ${rlen.toFixed(1)}`);
}

async function main() {
  await waitSrv('http://127.0.0.1:8808/');
  await recGithub();
  for (let i = 0; i < CASES.length; i++) await recCase(CASES[i], i + 1);
  fs.writeFileSync(path.join(ROOT, 'demo', 'full-raw', 'timing.json'), JSON.stringify(TIMING, null, 2));
  console.log('ALL CLIPS DONE');
}
main().then(() => { server.kill('SIGTERM'); process.exit(0); })
      .catch(e => { console.error(e); server.kill('SIGTERM'); process.exit(1); });
