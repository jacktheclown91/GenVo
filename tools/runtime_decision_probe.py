#!/usr/bin/env python3
"""Record a real-runtime v1.28 Stalker encounter driven by real keyboard input.

Loads the canonical HTML/CSS/ES modules in Chromium (same synthetic-origin approach as
runtime_screenshot.py), stages one Stalker per segment, then plays each segment with
real key presses (WASD, Shift, Space, J, E) chosen by a small reactive policy that only
reads the same encounter state the HUD shows. Records a video plus a JSON outcome log.

Segments: flee (sidestep the lane, walk off), hide (slip quietly into dense plants),
fight (sidestep, then bite the overrun), brace (hold J facing a Rusher, then bite),
and shift-e (the old habit: sprint in and press E), which is expected to fail.
"""
from __future__ import annotations
import argparse, json, mimetypes, re, time
from pathlib import Path
from playwright.sync_api import sync_playwright

HOST='https://genvo8.runtime'

def build_html(root:Path)->str:
    html=(root/'index.html').read_text(encoding='utf-8')
    css=(root/'styles.css').read_text(encoding='utf-8')
    css=css.replace("url('assets/",f"url('{HOST}/assets/").replace('url("assets/',f'url("{HOST}/assets/')
    html=re.sub(r'<link rel="stylesheet" href="styles\.css"\s*/?>','<style>'+css+'</style>',html)
    html=html.replace('<script type="module" src="src/main.js"></script>',f'<script type="module" src="{HOST}/src/main.js"></script>')
    return html.replace('src="assets/',f'src="{HOST}/assets/')

STAGE_JS="""([label,temperament,distance,cover])=>{
  const G=window.__GENVO8__,sim=G.sim,p=sim.player(),w=sim.world;sim.endOpeningGrace('runtime-decision-probe');
  let spot=null;
  for(let y=22;y<106&&!spot;y+=3)for(let x=26;x<96&&!spot;x+=3){let ok=true;for(let oy=-8;oy<=8&&ok;oy++)for(let ox=-12;ox<=20;ox++)if(w.water[w.idx(x+ox,y+oy)]){ok=false;break}if(ok)spot={x:x+.5,y:y+.5}}
  if(!spot)throw new Error('No dry staging lane');
  for(let y=-10;y<=10;y++)for(let x=-14;x<=22;x++){const i=w.idx(spot.x+x,spot.y+y);for(const k of Object.keys(w.plants))w.plants[k][i]=Math.min(w.plants[k][i],.08);w.carrion[i]=0}
  if(cover)for(let y=-2;y<=2;y++)for(let x=-2;x<=2;x++)w.plants.bramble[w.idx(spot.x+cover+x,spot.y+y)]=.8;
  for(const a of sim.animals){if(a.id===p.id||!a.alive)continue;if(Math.hypot(a.x-spot.x,a.y-spot.y)<34){a.x=Math.min(124,spot.x+30+(a.id%5));a.y=Math.min(124,Math.max(4,spot.y+((a.id%2)?24:-24)));a.target=null}if(a.species==='needlejaw'){a.playerHunt=null;a.playerAversion=null}}
  const h=sim.animals.find(a=>a.alive&&a.species==='needlejaw');if(!h)throw new Error('No Stalker');
  p.x=spot.x;p.y=spot.y;p.health=100;p.energy=110;p.hydration=100;p.exertion=100;p.exertionWinded=false;p.bracing=false;p.attackAction=null;p.hidden=false;p.dir=6;p.intent='idle';p.target=null;
  h.x=spot.x-distance;h.y=spot.y;h.health=100;h.energy=60;h.genes.temperament=temperament;h.genes.motion=1;h.genes.senses=1;h.playerAversion=null;
  sim.predator.beginStalk(h,p,distance);h.intent='stalk-player';h.target=p;
  sim.lastPlayerDamage=null;sim.lastPlayerPredatorOutcome=null;sim.rebuildSpatial();
  const t=G.tutorial;t.stage='done';sim.uiTutorialStage='done';if(t.welcome)t.welcome.hidden=true;if(t.toastEl)t.toastEl.hidden=true;
  G.renderer.motion?.clear?.();
  let cap=document.querySelector('#probeCaption');if(!cap){cap=document.createElement('div');cap.id='probeCaption';cap.style.cssText='position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:99;padding:6px 14px;background:rgba(10,18,14,.86);color:#f1e7bf;font:600 15px monospace;border:1px solid #6d7f5a;pointer-events:none';document.body.appendChild(cap)}
  cap.textContent=label;
  window.__probe={hunterId:h.id,startHealth:p.health,hits:0,lastHit:-1};
  return {hunterId:h.id,style:sim.predator.playerStatus(p)?.style||null};
}"""

STATE_JS="""()=>{
  const G=window.__GENVO8__,sim=G.sim,p=sim.player(),pr=window.__probe,h=sim.animals.find(a=>a.id===pr.hunterId);
  if(sim.lastPlayerDamage&&sim.lastPlayerDamage.tick!==pr.lastHit){pr.lastHit=sim.lastPlayerDamage.tick;pr.hits++}
  if(!p||!p.alive)return{dead:true,hits:pr.hits};
  const st=h?.playerHunt,lane=Number.isFinite(st?.aimDirX)?Math.abs((p.x-h.x)*st.aimDirY-(p.y-h.y)*st.aimDirX):9;
  return{dead:false,hits:pr.hits,health:p.health,exertion:p.exertion,winded:!!p.exertionWinded,bracing:!!p.bracing,
    phase:st?.phase||null,pursuit:st?.pursuit||null,stamina:st?.stamina??null,wounds:st?.wounds||0,lane,
    dist:h?Math.hypot(h.x-p.x,h.y-p.y):99,dx:h?h.x-p.x:0,dy:h?h.y-p.y:0,
    gaveUp:!!(h&&!st&&h.playerAversion?.untilTick>sim.tickCount),outcome:sim.lastPlayerPredatorOutcome?.outcome||null,
    hunterHealth:h?.health??0,prompt:document.querySelector('#context')?.textContent||''};
}"""

def away_keys(s):
    keys=set()
    if s['dx']<-.3:keys.add('KeyD')
    elif s['dx']>.3:keys.add('KeyA')
    if s['dy']<-.3:keys.add('KeyS')
    elif s['dy']>.3:keys.add('KeyW')
    return keys

def toward_keys(s):
    keys=set()
    if s['dx']>.25:keys.add('KeyD')
    elif s['dx']<-.25:keys.add('KeyA')
    if s['dy']>.25:keys.add('KeyS')
    elif s['dy']<-.25:keys.add('KeyW')
    return keys

def committed(s):return s['phase'] in ('windup','charge')

def policy(name,s,t):
    """Return (held_keys, tap_keys). Reads only what the HUD exposes (phase, lane, distance)."""
    if name=='flee':
        if committed(s):return ({'KeyW'} if s['lane']<1.4 else set()),[]
        return away_keys(s),[]
    if name=='hide':
        return ({'KeyD'} if t<2.7 else set()),[]
    if name=='fight':
        if committed(s):return ({'KeyW'} if s['lane']<1.4 else set()),[]
        if s['phase']=='recover':
            return (toward_keys(s)|{'ShiftLeft'} if s['dist']>1.3 else set()),(['Space'] if s['dist']<1.6 else [])
        return set(),[]
    if name=='brace':
        if s['phase']=='recover' and s['dist']<1.6:return set(),['Space']
        return ({'KeyJ'} if committed(s) else set()),[]
    if name=='shift-e':
        return toward_keys(s)|{'ShiftLeft'},(['KeyE'] if int(t*6)%2==0 else [])
    return set(),[]

SEGMENTS=[
    # name, caption, temperament, distance, cover offset, seconds
    ('flee','FLEE · sidestep the marked lane, then walk away',1.0,6,0,22),
    ('hide','HIDE · slip quietly into dense plants',1.0,5,5,16),
    ('fight','FIGHT · sidestep, then Space bites the overrun',1.0,6,0,22),
    ('brace','BRACE · hold J facing a Rusher, then Space',1.08,6,0,22),
    ('shift-e','OLD HABIT · Shift + E no longer fights',1.08,6,0,22),
]

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--root',default=str(Path(__file__).resolve().parents[1]))
    ap.add_argument('--out',required=True,help='output directory for video, screenshots and log')
    ap.add_argument('--executable',default=None)
    args=ap.parse_args();root=Path(args.root).resolve();out=Path(args.out).resolve();out.mkdir(parents=True,exist_ok=True)
    errors=[];results=[]
    with sync_playwright() as pw:
        launch={'headless':True,'args':['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']}
        if args.executable:launch['executable_path']=args.executable
        browser=pw.chromium.launch(**launch)
        ctx=browser.new_context(viewport={'width':1280,'height':720},record_video_dir=str(out),record_video_size={'width':1280,'height':720})
        page=ctx.new_page()
        page.on('pageerror',lambda e:errors.append('pageerror: '+str(e)))
        page.on('console',lambda m:errors.append(f'console {m.type}: {m.text}') if m.type=='error' else None)
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
        page.wait_for_function("window.__GENVO8__ && window.__GENVO8__.sim && window.__GENVO8__.renderer",timeout=30000)
        version=page.evaluate("()=>window.__GENVO8__.CFG.version")
        page.click('#startGame');page.wait_for_timeout(150)
        for _ in range(3):page.keyboard.press('Enter');page.wait_for_timeout(90)
        page.wait_for_timeout(600)
        for name,caption,temp,dist,cover,seconds in SEGMENTS:
            print('segment',name,flush=True);info=page.evaluate(STAGE_JS,[caption,temp,dist,cover])
            held=set();start=time.time();timeline=[];last_phase=None;shots=0;s=None;ended='timeout'
            page.wait_for_timeout(250)
            while time.time()-start<seconds:
                t=time.time()-start;s=page.evaluate(STATE_JS)
                if s['dead']:ended='dead';break
                key=(s['phase'],s['pursuit'])
                if key!=last_phase:timeline.append({'t':round(t,2),'phase':s['phase'],'pursuit':s['pursuit'],'dist':round(s['dist'],2),'stamina':None if s['stamina'] is None else round(s['stamina']),'prompt':s['prompt']});last_phase=key
                if s['gaveUp']:ended='gave-up';break
                want,taps=policy(name,s,t)
                for k in sorted(held-want):page.keyboard.up(k)
                for k in sorted(want-held):page.keyboard.down(k)
                held=want
                for k in taps:page.keyboard.press(k)
                if shots<2 and (s['bracing'] or s['phase']=='charge' or (s['phase']=='recover' and s['dist']<1.7)):
                    page.screenshot(path=str(out/f'{name}-{shots+1}.png'));shots+=1
                page.wait_for_timeout(25)
            for k in held:page.keyboard.up(k)
            final=page.evaluate(STATE_JS)
            page.screenshot(path=str(out/f'{name}-end.png'))
            results.append({'segment':name,'caption':caption,'style':info.get('style'),'ended':ended,'outcome':final.get('outcome') if not final.get('dead') else 'player-died','hits':final.get('hits'),'health':None if final.get('dead') else round(final['health']),'hunterHealth':None if final.get('dead') else round(final['hunterHealth']),'seconds':round(time.time()-start,1),'timeline':timeline})
            r=results[-1];print(f"  ended={r['ended']} outcome={r['outcome']} hits={r['hits']} hp={r['health']}",flush=True)
            if r['outcome']=='player-died' and name!='shift-e':break
            page.wait_for_timeout(1200)
        video=page.video.path() if page.video else None
        ctx.close();browser.close()
    expect={'flee':lambda r:r['ended']=='gave-up' and r['hits']==0,'hide':lambda r:r['ended']=='gave-up' and r['outcome']=='lost','fight':lambda r:r['ended']=='gave-up' and r['outcome']=='driven-off','brace':lambda r:r['ended']=='gave-up' and r['outcome']=='driven-off','shift-e':lambda r:r['ended']=='dead' or (r['hits'] or 0)>=2}
    for r in results:r['pass']=bool(expect[r['segment']](r))
    report={'version':version,'video':video,'errors':errors,'results':results,'all_pass':all(r['pass'] for r in results) and not errors}
    (out/'decision-probe.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    for r in results:print(f"{r['segment']:8} {'PASS' if r['pass'] else 'FAIL'} ended={r['ended']} outcome={r['outcome']} hits={r['hits']} hp={r['health']} t={r['seconds']}")
    print('errors:',len(errors),'video:',video)
    for e in errors[:10]:print(' ',e)

if __name__=='__main__':main()
