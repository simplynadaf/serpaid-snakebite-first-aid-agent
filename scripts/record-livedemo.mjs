/**
 * SerpAID LIVE demo recorder (per-case clips, then concat).
 *
 * Playwright's recordVideo caps a single long session, so we record ONE short
 * clip per use case in its own context (reliable), then the shell step muxes
 * each case's real Polly audio onto its clip and concatenates all four.
 *
 * Run:  node scripts/record-livedemo.mjs
 */
import { chromium } from 'playwright';
import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUTDIR = path.join(ROOT, 'demo', 'live-raw');
const CLIPS = path.join(OUTDIR, 'clips');
fs.mkdirSync(CLIPS, { recursive: true });

const server = spawn(
  path.join(ROOT, '.venv', 'bin', 'python'),
  ['-m', 'uvicorn', 'livedemo.server:app', '--host', '127.0.0.1', '--port', '8808'],
  { cwd: ROOT, stdio: 'inherit' }
);

async function waitForServer(url, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url); if (r.ok) return true; } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('server did not start');
}

function mp3dur(f) {
  try {
    const out = execSync('ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "' + f + '"').toString().trim();
    const v = parseFloat(out); return Number.isFinite(v) ? v : 12;
  } catch { return 12; }
}

const CASES = [
  { name: 'hindi', lang: 'hi', region: 'IN',
    text: 'My cousin was just bitten by a snake on the ankle near Pune. Should I tie a tight cloth above the bite and take him to the village healer? His eyelids feel heavy.' },
  { name: 'portuguese', lang: 'pt', region: 'BR',
    text: 'A farm worker was bitten in the field. We packed the wound in ice while we wait. He is hours from any clinic.' },
  { name: 'spanish', lang: 'es', region: 'US',
    text: 'My son was bitten by a snake and now he is having trouble breathing. His uncle is trying to suck the venom out.' },
  { name: 'french', lang: 'fr', region: 'KE',
    text: 'A woman was bitten near the river and the wound keeps bleeding. We are very scared and do not know what to do.' },
];

async function typeHuman(page, sel, text) {
  for (const ch of text) await page.type(sel, ch, { delay: 16 + Math.random() * 38 });
}

async function recordCase(c, idx) {
  const audioFile = path.join(OUTDIR, 'audio', `speak-${idx}.mp3`);
  const adur = fs.existsSync(audioFile) ? mp3dur(audioFile) : 12;
  const dir = path.join(CLIPS, c.name);
  fs.mkdirSync(dir, { recursive: true });

  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir, size: { width: 1280, height: 800 } },
  });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:8808/');
  await page.waitForTimeout(1500);

  await page.selectOption('#lang', c.lang);
  await page.selectOption('#region', c.region);
  await page.fill('#msg', '');
  await page.click('#msg');
  await typeHuman(page, '#msg', c.text);
  await page.waitForTimeout(500);
  await page.click('#go');
  await page.waitForSelector('.resp.big', { timeout: 30000 });
  await page.waitForTimeout(700);

  // hold for the audio length, keeping a visible countdown so frames render
  const holdMs = Math.round((adur + 1.0) * 1000);
  const ticks = Math.ceil(holdMs / 250);
  for (let t = 0; t < ticks; t++) {
    await page.evaluate((r) => {
      const el = document.getElementById('speaking');
      if (el) { el.style.display = 'flex'; el.setAttribute('data-t', String(r)); }
    }, ticks - t);
    await page.waitForTimeout(250);
  }

  await ctx.close();
  await browser.close();
  const webm = fs.readdirSync(dir).find((f) => f.endsWith('.webm'));
  const out = path.join(CLIPS, `${idx}-${c.name}.webm`);
  fs.renameSync(path.join(dir, webm), out);
  console.log('CLIP:', out, 'audio', adur.toFixed(1) + 's');
  return out;
}

async function main() {
  await waitForServer('http://127.0.0.1:8808/');
  for (let i = 0; i < CASES.length; i++) await recordCase(CASES[i], i);
  console.log('ALL CLIPS DONE');
}

main()
  .then(() => { server.kill('SIGTERM'); process.exit(0); })
  .catch((e) => { console.error(e); server.kill('SIGTERM'); process.exit(1); });
