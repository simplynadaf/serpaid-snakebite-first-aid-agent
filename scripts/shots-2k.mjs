import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

// 2K-ish capture of the real site, demo section run LIVE.
const ROOT = process.cwd();
const SITE = 'file://' + ROOT + '/docs/index.html';

const srv = spawn(ROOT + '/.venv/bin/python',
  ['-m','uvicorn','livedemo.server:app','--host','127.0.0.1','--port','8808'], { stdio:'ignore' });
async function waitSrv(u){ for(let i=0;i<40;i++){try{const r=await fetch(u);if(r.ok)return;}catch{}await new Promise(r=>setTimeout(r,500));} }

(async()=>{
  await waitSrv('http://127.0.0.1:8808/');
  const b = await chromium.launch({ args:['--autoplay-policy=no-user-gesture-required'] });
  // 1440 CSS px * dpr 2 = 2880 device px (2K+). Tall viewport for full sections.
  const p = await b.newPage({ viewport:{ width:1440, height:900 }, deviceScaleFactor:2 });
  await p.goto(SITE); await p.waitForTimeout(2500);

  const shots = [['#hero','shot-hero'],['#how','shot-how'],['#safety','shot-safety']];
  for (const [id,name] of shots) {
    const sel = id === '#hero' ? 'body' : id;
    try { await p.evaluate(s=>{const e=document.querySelector(s);if(e)e.scrollIntoView({block:'start'});}, sel); } catch {}
    await p.waitForTimeout(900);
    await p.screenshot({ path:`demo/${name}.png` });
    console.log('shot', name);
  }
  // demo section — run it live, Hindi, then capture
  await p.evaluate(()=>document.getElementById('demo').scrollIntoView({block:'start'}));
  await p.waitForTimeout(500);
  await p.selectOption('#demoCase','0');
  await p.click('#demoGo');
  try { await p.waitForSelector('.demo-mode.live',{timeout:12000}); } catch {}
  await p.waitForTimeout(5000);
  await p.evaluate(()=>document.getElementById('demo').scrollIntoView({block:'start'}));
  await p.waitForTimeout(400);
  await p.screenshot({ path:'demo/shot-demo.png' });
  console.log('shot shot-demo (live)');
  // also refresh liverun-frame = the live demo response panel, tight crop
  await p.screenshot({ path:'demo/liverun-frame.png' });
  console.log('shot liverun-frame');
  await b.close(); srv.kill('SIGTERM');
})();
