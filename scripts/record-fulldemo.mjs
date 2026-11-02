/**
 * SerpAID full demo recorder with GitHub repo preview + live site demo.
 *
 * Structure (intro/outro notes are added later by the intro-outro bookends):
 *   1. GITHUB PREVIEW  - smooth scroll down the real repo page (top to README end)
 *   2. LIVE SITE DEMO  - the interactive Live demo panel, run live, 2 cases with voice
 *
 * Spawns the live bridge so the site goes truly live during recording.
 * Run: node scripts/record-fulldemo.mjs
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'demo', 'full-raw');
const CLIPS = path.join(OUT, 'clips');
fs.mkdirSync(CLIPS, { recursive: true });

const REPO_URL = 'https://github.com/simplynadaf/serpaid-snakebite-first-aid-agent';
const SITE = 'file://' + ROOT + '/docs/index.html';

const server = spawn(
  path.join(ROOT, '.venv', 'bin', 'python'),
  ['-m', 'uvicorn', 'livedemo.server:app', '--host', '127.0.0.1', '--port', '8808'],
  { cwd: ROOT, stdio: 'ignore' }
);
async function waitForServer(url, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url); if (r.ok) return true; } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
}

async function smoothScroll(page, totalMs) {
  const h = await page.evaluate(() => Math.max(1, document.body.scrollHeight - window.innerHeight));
  const steps = 60;               // fixed number of frames, so total time is predictable
  const wait = Math.max(12, Math.floor(totalMs / steps));
  for (let i = 1; i <= steps; i++) {
    const y = (h * i) / steps;
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(wait);
  }
}

// --- Clip 1: GitHub repo preview (smooth scroll) ---
async function recordGithub() {
  const dir = path.join(CLIPS, 'github');
  fs.mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir, size: { width: 1280, height: 800 } },
  });
  const page = await ctx.newPage();
  try {
    await page.goto(REPO_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4000);        // let GitHub finish rendering the file tree + README
    await page.waitForTimeout(2000);        // hold on the top (repo name, about, tags)
    await smoothScroll(page, 12000);        // smooth, bounded 12s scroll through the page
    await page.waitForTimeout(1500);
  } catch (e) { console.error('github nav:', e.message); }
  await ctx.close(); await browser.close();
  const webm = fs.readdirSync(dir).find((f) => f.endsWith('.webm'));
  const out = path.join(CLIPS, '0-github.webm');
  if (webm) fs.renameSync(path.join(dir, webm), out);
  console.log('CLIP github:', out);
}

// --- Clip 2: live site demo ---
async function recordSiteDemo() {
  const dir = path.join(CLIPS, 'site');
  fs.mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir, size: { width: 1280, height: 800 } },
  });
  const page = await ctx.newPage();
  await page.goto(SITE);
  await page.waitForTimeout(1500);
  // smooth-scroll to the demo section so it reads as one flow
  await page.evaluate(() => document.getElementById('demo').scrollIntoView({ behavior: 'smooth', block: 'start' }));
  await page.waitForTimeout(2500);

  const cases = [
    { i: '0', hold: 11000 }, // Hindi
    { i: '2', hold: 10000 }, // Spanish
  ];
  for (const c of cases) {
    await page.selectOption('#demoCase', c.i);
    await page.waitForTimeout(800);
    await page.click('#demoGo');
    try { await page.waitForSelector('.demo-mode.live', { timeout: 12000 }); } catch {}
    // hold while the answer + voice play, keep page alive
    const ticks = Math.ceil(c.hold / 250);
    for (let t = 0; t < ticks; t++) {
      await page.evaluate(() => { const a = document.getElementById('demoAudio'); if (a) a.setAttribute('data-k', String(Date.now())); });
      await page.waitForTimeout(250);
    }
  }
  await page.waitForTimeout(1200);
  await ctx.close(); await browser.close();
  const webm = fs.readdirSync(dir).find((f) => f.endsWith('.webm'));
  const out = path.join(CLIPS, '1-site.webm');
  if (webm) fs.renameSync(path.join(dir, webm), out);
  console.log('CLIP site:', out);
}

async function main() {
  await waitForServer('http://127.0.0.1:8808/');
  await recordGithub();
  await recordSiteDemo();
  console.log('ALL CLIPS DONE');
}
main().then(() => { server.kill('SIGTERM'); process.exit(0); })
      .catch((e) => { console.error(e); server.kill('SIGTERM'); process.exit(1); });
