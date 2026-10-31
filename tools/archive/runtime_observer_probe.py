#!/usr/bin/env python3
"""Measure real Chromium frame pacing at 1x, 2x and 4x with a large population (v1.29).

Loads the canonical build (same synthetic-origin approach as runtime_screenshot.py),
starts a run, fills the world to CFG.performanceTarget animals, then switches speed with
real clicks on the quick-menu speed button and samples requestAnimationFrame intervals.
Also stages a Stalker hunt at 4x to confirm the automatic slowdown and its summary.
"""
from __future__ import annotations
import argparse, json, mimetypes
from pathlib import Path
from playwright.sync_api import sync_playwright
from runtime_decision_probe import build_html, HOST

SAMPLE_JS="""async(ms)=>{const out=[];let last=performance.now();const end=last+ms;await new Promise(res=>{function f(t){out.push(t-last);last=t;if(t<end)requestAnimationFrame(f);else res()}requestAnimationFrame(f)});
  out.sort((a,b)=>a-b);const q=p=>out[Math.min(out.length-1,Math.floor(out.length*p))];return{frames:out.length,medianMs:+q(.5).toFixed(1),p95Ms:+q(.95).toFixed(1),maxMs:+out[out.length-1].toFixed(1),over50:out.filter(v=>v>50).length,speed:window.__GENVO8__.observer.speed,day:window.__GENVO8__.sim.day}}"""

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--root',default=str(Path(__file__).resolve().parents[1]));ap.add_argument('--out',required=True);ap.add_argument('--executable',default=None);ap.add_argument('--seconds',type=float,default=6)
    args=ap.parse_args();root=Path(args.root).resolve();out=Path(args.out).resolve();out.mkdir(parents=True,exist_ok=True);errors=[]
    with sync_playwright() as pw:
        launch={'headless':True,'args':['--no-sandbox','--disable-dev-shm-usage']}
        if args.executable:launch['executable_path']=args.executable
        b=pw.chromium.launch(**launch);page=b.new_page(viewport={'width':1280,'height':720})
        page.on('pageerror',lambda e:errors.append('pageerror: '+str(e)));page.on('console',lambda m:errors.append(f'console {m.type}: {m.text}') if m.type=='error' else None)
        def h(route):
            url=route.request.url.split('?',1)[0].split('#',1)[0]
            if not url.startswith(HOST):return route.abort()
            rel=url[len(HOST):].lstrip('/') or 'index.html';f=(root/rel).resolve()
            if root not in f.parents and f!=root:return route.fulfill(status=403,body='forbidden')
            if not f.is_file():return route.fulfill(status=404,body='not found')
            ct='text/javascript' if f.suffix in('.js','.mjs') else (mimetypes.guess_type(str(f))[0] or 'application/octet-stream')
            route.fulfill(status=200,body=f.read_bytes(),content_type=ct)
        page.route(HOST+'/**',h);page.set_content(build_html(root),wait_until='domcontentloaded')
        page.wait_for_function("window.__GENVO8__&&window.__GENVO8__.sim&&window.__GENVO8__.observer",timeout=30000)
        version=page.evaluate("()=>window.__GENVO8__.CFG.version")
        page.click('#startGame');page.wait_for_timeout(150)
        for _ in range(3):page.keyboard.press('Enter');page.wait_for_timeout(90)
        population=page.evaluate("""()=>{const G=window.__GENVO8__,sim=G.sim;sim.endOpeningGrace('observer-probe');G.tutorial.stage='done';sim.uiTutorialStage='done';
          const kinds=['mosskip','rootling','genvo','mosskip'];while(sim.animals.filter(a=>a.alive).length<G.CFG.performanceTarget)sim.spawnAnimal(kinds[sim.animals.length%4]);
          const p=sim.player();for(const a of sim.animals)if(a.alive&&a.species==='needlejaw'&&Math.hypot(a.x-p.x,a.y-p.y)<30){a.x=p.x>64?4:124;a.playerHunt=null}sim.rebuildSpatial();return sim.animals.filter(a=>a.alive).length}""")
        page.wait_for_timeout(500);results={}
        btn='#quickMenu button[data-action="speed"]'
        results['1x']=page.evaluate(SAMPLE_JS,int(args.seconds*1000))
        page.click(btn);page.wait_for_timeout(300);results['2x']=page.evaluate(SAMPLE_JS,int(args.seconds*1000))
        page.click(btn);page.wait_for_timeout(300);results['4x']=page.evaluate(SAMPLE_JS,int(args.seconds*1000))
        page.screenshot(path=str(out/'observer-4x.png'))
        slowdown=page.evaluate("""async()=>{const G=window.__GENVO8__,sim=G.sim,p=sim.player(),h=sim.animals.find(a=>a.alive&&a.species==='needlejaw');h.x=p.x-5.5;h.y=p.y;sim.predator.beginStalk(h,p,5.5);sim.rebuildSpatial();
          const t0=performance.now();while(G.observer.speed!==1&&performance.now()-t0<3000)await new Promise(r=>setTimeout(r,20));
          return{speed:G.observer.speed,ms:Math.round(performance.now()-t0),toast:document.querySelector('#toast')?.textContent||''}}""")
        page.wait_for_timeout(200);page.screenshot(path=str(out/'observer-slowdown.png'))
        b.close()
    report={'version':version,'population':population,'pacing':results,'slowdown':slowdown,'errors':errors}
    (out/'observer-probe.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report,indent=2))

if __name__=='__main__':main()
