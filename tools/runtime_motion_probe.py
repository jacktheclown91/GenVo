#!/usr/bin/env python3
"""Real-browser motion cadence probe for GenVo8.

Holds the player moving right and samples camera/authority once per animation frame.
Useful for comparing perceived motion cadence without changing simulation state.
"""
from __future__ import annotations
import argparse, json, mimetypes, re, statistics
from pathlib import Path
from playwright.sync_api import sync_playwright

HOST='https://genvo8.runtime'

def build_html(root:Path)->str:
    html=(root/'index.html').read_text(encoding='utf-8')
    css=(root/'styles.css').read_text(encoding='utf-8')
    css=css.replace("url('assets/",f"url('{HOST}/assets/").replace('url("assets/',f'url("{HOST}/assets/')
    html=re.sub(r'<link rel="stylesheet" href="styles\.css"\s*/?>','<style>'+css+'</style>',html)
    html=html.replace('<script type="module" src="src/main.js"></script>',f'<script type="module" src="{HOST}/src/main.js"></script>')
    html=html.replace('src="assets/',f'src="{HOST}/assets/')
    return html

def pct(values,p):
    if not values:return 0
    a=sorted(values);i=min(len(a)-1,max(0,round((len(a)-1)*p)));return a[i]

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--root',default=str(Path(__file__).resolve().parents[1]));ap.add_argument('--width',type=int,default=1280);ap.add_argument('--height',type=int,default=720);ap.add_argument('--ms',type=int,default=1400);args=ap.parse_args();root=Path(args.root).resolve();errors=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
        page=browser.new_page(viewport={'width':args.width,'height':args.height})
        page.on('pageerror',lambda e:errors.append('pageerror: '+str(e)));page.on('console',lambda m:errors.append(f'console {m.type}: {m.text}') if m.type=='error' else None)
        def handler(route):
            url=route.request.url.split('?',1)[0].split('#',1)[0]
            if not url.startswith(HOST):return route.abort()
            rel=url[len(HOST):].lstrip('/') or 'index.html';f=(root/rel).resolve()
            if root not in f.parents and f!=root:return route.fulfill(status=403,body='forbidden')
            if not f.is_file():return route.fulfill(status=404,body='not found')
            ctype=mimetypes.guess_type(str(f))[0] or 'application/octet-stream'
            if f.suffix in ('.js','.mjs'):ctype='text/javascript'
            route.fulfill(status=200,body=f.read_bytes(),content_type=ctype)
        page.route(HOST+'/**',handler);page.set_content(build_html(root),wait_until='domcontentloaded');page.wait_for_function('window.__GENVO8__ && __GENVO8__.renderer && __GENVO8__.sim',timeout=30000)
        page.click('#skipTutorial');page.wait_for_timeout(300);page.keyboard.down('d')
        rows=page.evaluate("""ms=>new Promise(resolve=>{const out=[],start=performance.now();let prev=0;function f(t){const g=__GENVO8__,p=g.sim.player(),r=g.renderer;out.push({t,auth:p?.x??0,cam:r.camera.x,visual:r.playerVisual?.x??null});if(t-start<ms)requestAnimationFrame(f);else resolve(out)}requestAnimationFrame(f)})""",args.ms)
        page.keyboard.up('d');page.wait_for_timeout(80);version=page.evaluate('__GENVO8__.CFG.version');browser.close()
    dts=[rows[i]['t']-rows[i-1]['t'] for i in range(1,len(rows))];cam=[abs(rows[i]['cam']-rows[i-1]['cam'])*48 for i in range(1,len(rows))];auth=[abs(rows[i]['auth']-rows[i-1]['auth'])*48 for i in range(1,len(rows))];visual=[abs((rows[i]['visual'] or rows[i]['auth'])-(rows[i-1]['visual'] or rows[i-1]['auth']))*48 for i in range(1,len(rows))]
    out={'version':version,'viewport':[args.width,args.height],'frames':len(rows),'medianFrameMs':round(statistics.median(dts),2) if dts else 0,'p95FrameMs':round(pct(dts,.95),2),'maxFrameMs':round(max(dts),2) if dts else 0,'framesOver50Ms':sum(v>50 for v in dts),'cameraMovingFramesPct':round(100*sum(v>.05 for v in cam)/len(cam),1) if cam else 0,'authorityMovingFramesPct':round(100*sum(v>.05 for v in auth)/len(auth),1) if auth else 0,'visualMovingFramesPct':round(100*sum(v>.05 for v in visual)/len(visual),1) if visual else 0,'medianCameraPxPerFrame':round(statistics.median([v for v in cam if v>.05]),2) if any(v>.05 for v in cam) else 0,'maxAuthorityPxStep':round(max(auth),2) if auth else 0,'errors':errors}
    print(json.dumps(out,indent=2))
    if errors:raise SystemExit(2)

if __name__=='__main__':main()
