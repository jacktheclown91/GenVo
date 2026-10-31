#!/usr/bin/env python3
"""Repeatable real-Chromium GenVo8 renderer timing probe.

This measures direct renderer.render() wall time after a warm-up at 1280x720. It is
intended for before/after development comparisons, not as a claim about player FPS.
"""
from __future__ import annotations
import argparse, json, mimetypes, re
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

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--root',default=str(Path(__file__).resolve().parents[1]))
    ap.add_argument('--renders',type=int,default=120)
    ap.add_argument('--warmup',type=int,default=8)
    ap.add_argument('--crowd',type=int,default=0,help='stage up to N non-player animals around the player before timing')
    ap.add_argument('--width',type=int,default=1280)
    ap.add_argument('--height',type=int,default=720)
    args=ap.parse_args();root=Path(args.root).resolve();errors=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
        page=browser.new_page(viewport={'width':args.width,'height':args.height})
        page.on('pageerror',lambda e:errors.append('pageerror: '+str(e)))
        page.on('console',lambda m: errors.append(f'console {m.type}: {m.text}') if m.type=='error' else None)
        def handler(route):
            url=route.request.url.split('?',1)[0].split('#',1)[0]
            if not url.startswith(HOST):return route.abort()
            rel=url[len(HOST):].lstrip('/') or 'index.html';f=(root/rel).resolve()
            if root not in f.parents and f!=root:return route.fulfill(status=403,body='forbidden')
            if not f.is_file():return route.fulfill(status=404,body='not found')
            ctype=mimetypes.guess_type(str(f))[0] or 'application/octet-stream'
            if f.suffix in ('.js','.mjs'):ctype='text/javascript'
            route.fulfill(status=200,body=f.read_bytes(),content_type=ctype)
        page.route(HOST+'/**',handler)
        page.set_content(build_html(root),wait_until='domcontentloaded')
        page.wait_for_function('window.__GENVO8__ && __GENVO8__.renderer && __GENVO8__.sim',timeout=30000)
        page.click('#startGame');page.wait_for_timeout(900)
        if args.crowd>0:
            page.evaluate("""n=>{const sim=__GENVO8__.sim,p=sim.player(),others=sim.animals.filter(a=>a.alive&&!a.player).slice(0,n);for(let i=0;i<others.length;i++){const ring=3+Math.floor(i/12)*2.2,ang=(i%12)/12*Math.PI*2;others[i].x=p.x+Math.cos(ang)*ring;others[i].y=p.y+Math.sin(ang)*ring;others[i].intent='idle';others[i].target=null}sim.rebuildSpatial();__GENVO8__.renderer.motion?.clear?.();__GENVO8__.renderer.camera.x=p.x;__GENVO8__.renderer.camera.y=p.y;__GENVO8__.renderer.render()}""",args.crowd)
        result=page.evaluate("""([warmup,renders])=>{const r=__GENVO8__.renderer,s=__GENVO8__.sim;s.paused=true;for(let i=0;i<warmup;i++)r.render();const a=performance.now();for(let i=0;i<renders;i++)r.render();const total=performance.now()-a;return{version:__GENVO8__.CFG.version,totalMs:total,meanRenderMs:total/renders,renders,viewport:[innerWidth,innerHeight],visible:r.visibleAnimals?.length||0,alive:s.animals.filter(x=>x.alive).length,landCache:r.landBaseTileCache?.size||0,waterCache:r.waterBaseTileCache?.size||0,staticLandCache:r.staticLandTileCache?.size||0};}""",[args.warmup,args.renders])
        browser.close()
    result['errors']=errors
    print(json.dumps(result,indent=2))
    if errors:raise SystemExit(2)

if __name__=='__main__':main()
