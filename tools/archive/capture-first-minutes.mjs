// Usage: node tools/capture-first-minutes.mjs <exported build> <evidence dir> [creature card, e.g. starter-jump]
// First-impression capture: what a new player sees with default choices, no setup.
import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);const pw=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const root=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]);fs.mkdirSync(out,{recursive:true});
const mime={'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.png':'image/png','.wav':'audio/wav','.gz':'application/gzip','.ogg':'audio/ogg','.mp3':'audio/mpeg','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'..'+decodeURIComponent(new URL(req.url,'http://l').pathname));const t=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;fs.readFile(t,(e,b)=>{if(e){res.writeHead(404);res.end();return}res.setHeader('Content-Type',mime[path.extname(t)]||'application/octet-stream');res.end(b)})});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await pw.chromium.launch();const log=[];
const page=await browser.newPage({viewport:{width:1280,height:720}});page.on('pageerror',e=>log.push('ERROR '+e.message));
const t0=Date.now(),stamp=()=>((Date.now()-t0)/1000).toFixed(1)+'s';
const shot=async n=>{await page.screenshot({path:path.join(out,n+'.png')});log.push(stamp()+' shot '+n)};
const text=async()=>page.evaluate(()=>({toasts:[...document.querySelectorAll('#notificationStack *')].filter(e=>!e.hidden&&e.children.length===0&&e.textContent.trim()).map(e=>e.textContent.trim()).slice(0,6),objective:document.querySelector('.objective, #objective, .legacy-objective')?.textContent?.trim()||null,dialogs:[...document.querySelectorAll('[role="dialog"]:not([hidden]), .transition:not([hidden])')].map(d=>d.id||d.className).slice(0,4)}));
await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForTimeout(400);await shot('00-title-0.4s');
await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);log.push(stamp()+' title ready');await page.waitForTimeout(2500);await shot('01-title-ready');
await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();await page.waitForTimeout(500);
// Automation opens Advanced options; close it to show what a player sees.
await page.evaluate(()=>{const d=document.querySelector('#newWorldAdvanced');if(d)d.open=false});await page.waitForTimeout(200);await shot('02-new-world');
const card=process.argv[4];if(card){await page.locator(`#newWorldCreatureCards [data-creature="${card}"]`).click();await page.waitForTimeout(400);await shot('02b-new-world-chosen')}
log.push('new-world text: '+(await page.locator('.menu-view[data-screen="new"]').innerText()).replace(/\s+/g,' ').slice(0,900));
const begin=Date.now();await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();
await page.waitForTimeout(800);await shot('03-loading');
await page.waitForFunction(()=>document.querySelector('#frontEnd')?.hidden&&!!window.__GENVO8__.sim.climate,{},{timeout:120000});log.push(stamp()+` world ready after ${((Date.now()-begin)/1000).toFixed(1)}s`);
await page.waitForTimeout(300);await shot('04-first-frame');log.push('first frame: '+JSON.stringify(await text()));
log.push('visible text: '+(await page.evaluate(()=>document.body.innerText)).replace(/\s+/g,' ').slice(0,1500));
for(const [n,ms] of [['05-after-5s',5000],['06-after-15s',10000]]){await page.waitForTimeout(ms);await shot(n);log.push(n+': '+JSON.stringify(await text()))}
// A first-timer's input: dismiss whatever is open with the obvious button, then walk around with WASD.
const clickVisible=async sel=>{const l=page.locator(sel);for(let i=0;i<await l.count();i++)if(await l.nth(i).isVisible()){log.push(stamp()+' click '+(await l.nth(i).innerText()).trim().slice(0,60));await l.nth(i).click();return true}return false};
await clickVisible('#tutorialWelcome button, .welcome button, [data-act="begin"], [data-tutorial="begin"]');await page.waitForTimeout(800);await shot('07-after-dismiss');log.push('after dismiss: '+JSON.stringify(await text()));
for(const [k,ms] of [['KeyD',1800],['KeyS',1200],['KeyA',1500],['KeyW',1200]]){await page.keyboard.down(k);await page.waitForTimeout(ms);await page.keyboard.up(k)}
await shot('08-after-walking');log.push('after walking: '+JSON.stringify(await text()));
for(const [n,ms] of [['09-after-60s',30000],['10-after-120s',60000]]){await page.waitForTimeout(ms);await shot(n);log.push(n+': '+JSON.stringify(await text()))}
log.push('day '+await page.evaluate(()=>window.__GENVO8__.sim.day));
fs.writeFileSync(path.join(out,'log.txt'),log.join('\n'));await browser.close();server.close();console.log(log.join('\n'));
