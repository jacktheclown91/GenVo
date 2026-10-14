#!/usr/bin/env python3
"""Evolution Expansion Phase D gate: three designed bodies, one survival situation.

Same staging as runtime_decision_probe.py (a stripped, lean patch of ground and one Stalker
closing from 6 tiles), but the active creature is given a designed body plan first. Each body
is played with real key presses by a small policy that suits it:
  runner  (three spring rear legs)                 sprints out of the lane and away
  digger  (reinforced torso, armor, digging limbs) braces (J), bites the opening, then digs roots (E)
  venom   (venom gland, wide-field eyes)           sidesteps and bites once: the poison drives it off
  plain   (unchanged starter body, control)        the same fight and the same E on bare ground
Writes phase-d-gate.json, screenshots and a video to --out.
"""
from __future__ import annotations
import argparse, json, mimetypes, sys, time
from pathlib import Path
from playwright.sync_api import sync_playwright
sys.path.insert(0,str(Path(__file__).resolve().parent))
from runtime_decision_probe import HOST, build_html, STAGE_JS, STATE_JS, policy

BUILDS={
  'runner':[{'part':'spring-leg','socket':'limb.3'},{'part':'spring-leg','socket':'limb.4'},{'part':'spring-leg','socket':'limb.5'}],
  'digger':[{'root':'reinforced-torso'},{'part':'armor-plate','socket':'flank.left'},{'part':'armor-plate','socket':'flank.right'},{'part':'digging-forelimb','socket':'limb.0'},{'part':'digging-forelimb','socket':'limb.1'},{'part':'digging-forelimb','socket':'limb.7'}],
  'venom':[{'part':'venom-gland','socket':'flank.left'},{'part':'wide-field-eye','socket':'eye.left'},{'part':'wide-field-eye','socket':'eye.right'}],
  'plain':[],
}
RUNS=[('runner','runner','RUNNER · spring legs sprint out of the charge','flee-sprint'),('digger','digger','DIGGER · brace, bite the opening, then dig roots','brace'),('venom','venom','VENOM · sidestep, one poisoned bite','fight'),('plain','plain','PLAIN BODY · the same fight, then E on bare ground','fight'),('plain-brace','plain','PLAIN BODY · the same brace as the digger','brace')]

DESIGN_JS="""async ([edits])=>{
  const H='"""+HOST+"""';
  const D=await import(H+'/src/lineage/evolution-draft.js'),B=await import(H+'/src/lineage/reproduction-bridge.js'),R=await import(H+'/src/lineage/part-registry.js'),PA=await import(H+'/src/lineage/part-abilities.js');
  const sim=window.__GENVO8__.sim,p=sim.player();
  if(!window.__plainPlan)window.__plainPlan={plan:structuredClone(B.planFor(p)),anatomy:structuredClone(p.anatomy||{}),adaptations:[...p.adaptations]};
  p.anatomy=structuredClone(window.__plainPlan.anatomy);p.adaptations=[...window.__plainPlan.adaptations];delete p.bodyPlan;
  const d=D.createDraft({base:B.planFor(p),ancestry:Object.keys(R.PARTS),budget:99});
  for(const e of edits){const r=e.root?D.replaceRoot(d,e.root):D.place(d,e.part,e.parent||'root',e.socket);if(!r.ok)throw new Error(r.reason)}
  B.applyLineageTarget(p,d.plan);const pf=PA.partEffectFactors(p);
  return {plan:p.bodyPlan?.id||null,adaptations:[...p.adaptations],threatSense:pf?.threatSense??1,dig:!!pf?.dig,venom:sim.partAbilities.venomDoses(p)};
}"""
def run_policy(kind,s,t):
    if kind=='flee-sprint':
        held,taps=policy('flee',s,t)
        if s['phase'] not in ('windup','charge') and held:held=held|{'ShiftLeft'}
        return held,taps
    return policy(kind,s,t)

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--root',default=str(Path(__file__).resolve().parents[1]));ap.add_argument('--out',required=True)
    args=ap.parse_args();root=Path(args.root).resolve();out=Path(args.out).resolve();out.mkdir(parents=True,exist_ok=True)
    errors=[];results=[]
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
        ctx=browser.new_context(viewport={'width':1280,'height':720},record_video_dir=str(out),record_video_size={'width':1280,'height':720})
        page=ctx.new_page()
        page.on('pageerror',lambda e:errors.append('pageerror: '+str(e)))
        page.on('console',lambda m:errors.append(f'console {m.type}: {m.text}') if m.type=='error' else None)
        def handler(route):
            url=route.request.url.split('?',1)[0].split('#',1)[0]
            if not url.startswith(HOST):return route.abort()
            rel=url[len(HOST):].lstrip('/') or 'index.html';f=(root/rel).resolve()
            if not f.is_file():return route.fulfill(status=404,body='not found')
            ctype='text/javascript' if f.suffix in ('.js','.mjs') else (mimetypes.guess_type(str(f))[0] or 'application/octet-stream')
            route.fulfill(status=200,body=f.read_bytes(),content_type=ctype)
        page.route(HOST+'/**',handler);page.set_content(build_html(root),wait_until='domcontentloaded')
        page.wait_for_function("window.__GENVO8__ && window.__GENVO8__.sim && window.__GENVO8__.renderer",timeout=30000)
        page.click('#startGame');page.wait_for_timeout(150)
        for _ in range(3):page.keyboard.press('Enter');page.wait_for_timeout(90)
        page.wait_for_timeout(600)
        for build,shape,caption,kind in RUNS:
            print('build',build,flush=True)
            body=page.evaluate(DESIGN_JS,[BUILDS[shape]])
            page.evaluate(STAGE_JS,[caption,1.08 if kind=='brace' else 1.0,6,0])
            # Lean season: the creature starts hungry on stripped ground.
            page.evaluate("()=>{const p=window.__GENVO8__.sim.player();p.energy=45}")
            body['markerAt']=round(10*body['threatSense'],1)
            held=set();start=time.time();ended='timeout';hits_seen=0;shots=0;messages=[]
            page.wait_for_timeout(250)
            while time.time()-start<22:
                t=time.time()-start;s=page.evaluate(STATE_JS)
                if s['dead']:ended='dead';break
                if s['gaveUp']:ended='gave-up';break
                want,taps=run_policy(kind,s,t)
                for k in sorted(held-want):page.keyboard.up(k)
                for k in sorted(want-held):page.keyboard.down(k)
                held=want
                for k in taps:page.keyboard.press(k)
                if shots<1 and (s['bracing'] or (s['phase']=='recover' and s['dist']<1.7) or (kind=='flee-sprint' and s['dist']>4 and t>2)):
                    page.screenshot(path=str(out/f'{build}-1.png'));shots+=1
                page.wait_for_timeout(25)
            for k in held:page.keyboard.up(k)
            fight=page.evaluate(STATE_JS);elapsed=round(time.time()-start,1)
            page.screenshot(path=str(out/f'{build}-end.png'))
            poisoned=page.evaluate("()=>{const sim=window.__GENVO8__.sim,h=sim.animals.find(a=>a.id===window.__probe.hunterId);return !!(h&&h.poison)}")
            toast=page.evaluate("()=>[...document.querySelectorAll('[class*=toast]')].filter(e=>!e.hidden).map(e=>e.innerText).join(' | ')")
            # Then feed in the lean patch: the Stalker is gone and the ground is bare. Press E three times, stepping between.
            page.evaluate("()=>{const sim=window.__GENVO8__.sim,p=sim.player(),w=sim.world,h=sim.animals.find(a=>a.id===window.__probe.hunterId);if(h){h.x=Math.min(124,p.x+40);h.target=null;h.playerHunt=null}for(let y=-8;y<=8;y++)for(let x=-8;x<=8;x++){const i=w.idx(p.x+x,p.y+y);for(const k of Object.keys(w.plants))w.plants[k][i]=0;w.carrion[i]=0}p.energy=Math.min(p.energy,45)}");page.wait_for_timeout(1500)
            e0=page.evaluate("()=>window.__GENVO8__.sim.player()?.energy??0");hint=page.evaluate("()=>document.querySelector('#context')?.textContent||''");dug=0
            for i in range(3):
                page.keyboard.press('KeyE');page.wait_for_timeout(300)
                if i==0:page.screenshot(path=str(out/f'{build}-dig.png'))
                page.keyboard.down('KeyS');page.wait_for_timeout(450);page.keyboard.up('KeyS');page.wait_for_timeout(1000)
            e1=page.evaluate("()=>window.__GENVO8__.sim.player()?.energy??0");last=page.evaluate("()=>window.__GENVO8__.sim.lastPlayerAction")
            r={'build':build,'body':body,'policy':kind,'ended':ended,'outcome':None if fight.get('dead') else fight.get('outcome'),'hits':fight.get('hits'),
               'healthLeft':None if fight.get('dead') else round(fight['health']),'finalPhase':fight.get('phase'),'finalDist':None if fight.get('dead') else round(fight['dist'],1),'hunterHealth':None if fight.get('dead') else round(fight['hunterHealth']),'seconds':elapsed,
               'hunterPoisoned':poisoned,'toast':toast,'promptOnBareGround':hint,'energyBeforeE':round(e0,1),'energyAfterE':round(e1,1),'lastAction':(last or {}).get('type')}
            results.append(r);print(json.dumps({k:v for k,v in r.items() if k!='body'}),flush=True)
            page.wait_for_timeout(1200)
        video=page.video.path() if page.video else None
        ctx.close();browser.close()
    R={r['build']:r for r in results}
    checks={
      # A runner fast enough leaves the Stalker's range before it reaches a chase, so the hunt simply ends.
      'runner escapes untouched':R['runner']['hits']==0 and (R['runner']['ended']=='gave-up' or (R['runner']['finalPhase'] is None and (R['runner']['finalDist'] or 0)>10.5)),
      'digger survives the charge and outlasts it':R['digger']['ended']=='gave-up' and (R['digger']['healthLeft'] or 0)>0,
      'digger takes less from the same braced charge than a plain body':(100-(R['digger']['healthLeft'] or 0))<(100-(R['plain-brace']['healthLeft'] or 0)) or (R['plain-brace']['hits']==0 and R['digger']['hits']==0),
      'digger feeds from bare ground with E':R['digger']['energyAfterE']>R['digger']['energyBeforeE']+5,
      'venom drives it off poisoned':R['venom']['ended']=='gave-up' and R['venom']['hunterPoisoned'],
      'wide-field eyes mark threats farther':R['venom']['body']['markerAt']>R['plain']['body']['markerAt'],
      'plain body cannot dig':R['plain']['energyAfterE']<=R['plain']['energyBeforeE']+.5 and 'Dig' not in R['plain']['promptOnBareGround'],
      'plain body cannot poison':not R['plain']['hunterPoisoned'],
      'no console errors':not errors,
    }
    report={'video':video,'errors':errors,'results':results,'checks':checks,'all_pass':all(checks.values())}
    (out/'phase-d-gate.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    for k,v in checks.items():print(('PASS ' if v else 'FAIL ')+k)
    for e in errors[:10]:print(' ',e)

if __name__=='__main__':main()
