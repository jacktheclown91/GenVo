#!/usr/bin/env python3
"""Capture real GenVo8 runtime screenshots without localhost navigation.

The execution environment can block localhost/file:// navigation. This runner keeps the
actual canonical HTML/CSS/modules/assets, but injects the document into about:blank and
fulfills a synthetic HTTPS origin entirely from the project directory. Chromium still
parses/runs the real ES-module graph, canvas renderer, UI and Web Audio fetch paths.
"""
from __future__ import annotations
import argparse, mimetypes, re
from pathlib import Path
from playwright.sync_api import sync_playwright

HOST='https://genvo8.runtime'

def build_html(root:Path)->str:
    html=(root/'index.html').read_text(encoding='utf-8')
    css=(root/'styles.css').read_text(encoding='utf-8')
    css=css.replace("url('assets/",f"url('{HOST}/assets/").replace('url(\"assets/',f'url(\"{HOST}/assets/')
    html=re.sub(r'<link rel="stylesheet" href="styles\.css"\s*/?>', '<style>'+css+'</style>', html)
    html=html.replace('<script type="module" src="src/main.js"></script>', f'<script type="module" src="{HOST}/src/main.js"></script>')
    html=html.replace('src="assets/', f'src="{HOST}/assets/')
    return html

def stage_wetland_niches(page):
    return page.evaluate("""()=>{
      const g=window.__GENVO8__,sim=g.sim,p=sim.player(),world=sim.world;
      const water=sim.animals.find(a=>a.alive&&a.species==='rillsifter'),scav=sim.animals.find(a=>a.alive&&a.species==='mirelick');
      if(!water||!scav||!world.water[world.idx(water.x,water.y)])throw Error('Missing aquatic Rillsifter founder');
      let bank=null;
      for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1],[2,0],[0,2],[-2,0],[0,-2]]){
        const x=water.x+dx,y=water.y+dy;
        if(world.isPlayable(x,y)&&!world.water[world.idx(x,y)]){bank={x,y};break}
      }
      if(!bank){const near=world.drinkSpots.find(a=>Math.hypot(a.x-water.x,a.y-water.y)<10);if(near)bank={x:near.x,y:near.y}}
      if(!bank)throw Error('No wetland bank next to Rillsifter');
      p.x=bank.x;p.y=bank.y;scav.x=bank.x+1;scav.y=bank.y+.5;
      water.x=water.x;water.y=water.y;const s=sim.animals.filter(a=>a.species==='rillsifter').slice(1,4);
      for(let i=0;i<s.length;i++){s[i].x=water.x+(i%2)*.6;s[i].y=water.y+((i+1)%2)*.4;s[i].intent='shoal-glide'}
      scav.intent='mire-sniff';water.intent='shoal-glide';
      sim.rebuildSpatial();sim.paused=true;const t=g.tutorial;t.stage='done';t.welcome.hidden=true;if(t.toastEl)t.toastEl.hidden=true;t.update(true);
      g.renderer.motion?.clear?.();g.renderer.camera.x=bank.x;g.renderer.camera.y=bank.y;g.renderer.render();
      return {rillsifter:{x:water.x,y:water.y,water:!!world.water[world.idx(water.x,water.y)],plan:water.bodyPlan?.id},mirelick:{x:scav.x,y:scav.y,plan:scav.bodyPlan?.id}};
    }""")

def stage_predator(page,style:str,phase:str):
    temperament={'ambusher':1.0,'rusher':1.08,'wary':.92}[style]
    page.evaluate("""([temperament,phase])=>{
      const sim=window.__GENVO8__.sim,p=sim.player();sim.endOpeningGrace('runtime-screenshot');
      const h=sim.animals.find(a=>a.alive&&a.species==='needlejaw');if(!h)throw new Error('No Stalker available');
      let spot=null;
      for(let r=3;r<=6&&!spot;r+=.5)for(let a=0;a<Math.PI*2&&!spot;a+=Math.PI/8){const x=p.x+Math.cos(a)*r,y=p.y+Math.sin(a)*r,i=sim.world.idx(x,y);if(x>2&&y>2&&x<126&&y<126&&!sim.world.water[i]&&sim.world.sameLand(p.x,p.y,x,y))spot={x,y}}
      if(!spot)throw new Error('No same-land Stalker staging point');
      h.x=spot.x;h.y=spot.y;h.genes.temperament=temperament;h.energy=90;h.health=100;h.target=null;
      const now=sim.tickCount,profile=sim.predator.state(h,p).style;
      h.playerHunt={targetId:p.id,phase,style:profile,startedTick:now,untilTick:now+window.__GENVO8__.CFG.simHz*8,lastOutcome:null,aimX:null,aimY:null};
      if(phase==='windup'||phase==='charge')sim.predator.lockChargeAim(h,p,h.playerHunt);
      if(phase==='stalk'){h.intent='stalk-player';h.target=sim.predator.stalkTarget(h,p)}
      else if(phase==='windup'){h.intent='hunt-windup';h.target=null}
      else if(phase==='charge'){h.intent='charge-player';h.target=sim.predator.chargeTarget(h.playerHunt,p)}
      else{h.intent='hunt-recover';h.target=null}
      const tutorial=window.__GENVO8__.tutorial;tutorial.stage='done';tutorial.welcome.hidden=true;if(tutorial.toastEl)tutorial.toastEl.hidden=true;sim.paused=false;sim.rebuildSpatial();tutorial.update(true);window.__GENVO8__.renderer.render();
      return {style:profile,phase,distance:Math.hypot(h.x-p.x,h.y-p.y)};
    }""", [temperament,phase])

def stage_combat_footwork(page):
    return page.evaluate("""()=>{
      const sim=window.__GENVO8__.sim,p=sim.player(),w=sim.world;sim.endOpeningGrace('runtime-combat-footwork');
      let spot=null;for(let y=22;y<106&&!spot;y+=4)for(let x=24;x<102&&!spot;x+=4){let clear=true;for(let oy=-6;oy<=6&&clear;oy++)for(let ox=-8;ox<=8;ox++)if(w.water[w.idx(x+ox,y+oy)]){clear=false;break}if(clear)spot={x:x+.5,y:y+.5}}
      if(!spot)throw new Error('No dry combat staging lane');
      for(const a of sim.animals){if(a.id===p.id)continue;a.x=Math.min(123,spot.x+24+(a.id%4));a.y=Math.min(123,spot.y+18+(a.id%5));a.intent='idle';a.target=null;if(a.species==='needlejaw')a.playerHunt=null}
      const h=sim.animals.find(a=>a.alive&&a.species==='needlejaw');if(!h)throw new Error('No Stalker available');
      p.x=spot.x+1.2;p.y=spot.y;p.energy=104;p.hydration=100;p.health=100;p.hidden=false;p.intent='idle';p.target=null;
      h.x=spot.x-3.4;h.y=spot.y;h.genes.temperament=1.08;h.energy=125;h.health=100;h.playerAversion=null;
      const profile=sim.predator.state(h,p).style,now=sim.tickCount;h.playerHunt={targetId:p.id,phase:'windup',style:profile,startedTick:now,untilTick:now+window.__GENVO8__.CFG.simHz,lastOutcome:null,aimX:null,aimY:null};sim.predator.lockChargeAim(h,p,h.playerHunt);
      const locked={x:h.playerHunt.aimX,y:h.playerHunt.aimY};p.y+=1.45;h.intent='hunt-windup';h.target=null;sim.rebuildSpatial();
      const tutorial=window.__GENVO8__.tutorial,renderer=window.__GENVO8__.renderer;tutorial.stage='done';tutorial.welcome.hidden=true;if(tutorial.toastEl)tutorial.toastEl.hidden=true;sim.paused=true;tutorial.update(true);renderer.motion?.clear?.();renderer.camera.x=(h.x+p.x)/2;renderer.camera.y=(h.y+p.y)/2;renderer.render();
      return {style:profile,locked,player:{x:p.x,y:p.y},status:sim.predator.playerStatus(p)};
    }""")

def stage_combat_recovery(page):
    return page.evaluate("""()=>{
      const sim=window.__GENVO8__.sim,p=sim.player(),w=sim.world;sim.endOpeningGrace('runtime-combat-recovery');
      let spot=null;for(let y=22;y<106&&!spot;y+=4)for(let x=24;x<102&&!spot;x+=4){let clear=true;for(let oy=-4;oy<=4&&clear;oy++)for(let ox=-6;ox<=6;ox++)if(w.water[w.idx(x+ox,y+oy)]){clear=false;break}if(clear)spot={x:x+.5,y:y+.5}}
      if(!spot)throw new Error('No dry recovery staging field');
      for(const a of sim.animals){if(a.id===p.id)continue;a.x=Math.min(123,spot.x+24+(a.id%4));a.y=Math.min(123,spot.y+18+(a.id%5));a.intent='idle';a.target=null;if(a.species==='needlejaw')a.playerHunt=null}
      const h=sim.animals.find(a=>a.alive&&a.species==='needlejaw');if(!h)throw new Error('No Stalker available');
      p.x=spot.x+1.1;p.y=spot.y;p.energy=104;p.hydration=100;p.health=100;p.hidden=false;p.intent='idle';p.target=null;
      h.x=spot.x;h.y=spot.y;h.genes.temperament=1;h.energy=118;h.health=78;h.playerAversion=null;const profile=sim.predator.state(h,p).style,now=sim.tickCount;
      h.playerHunt={targetId:p.id,phase:'recover',style:profile,startedTick:now,untilTick:now+window.__GENVO8__.CFG.simHz,lastOutcome:'evaded',aimX:p.x+1.5,aimY:p.y};h.intent='hunt-recover';h.target=null;sim.rebuildSpatial();
      const tutorial=window.__GENVO8__.tutorial,renderer=window.__GENVO8__.renderer;tutorial.stage='done';tutorial.welcome.hidden=true;if(tutorial.toastEl)tutorial.toastEl.hidden=true;sim.paused=true;tutorial.update(true);renderer.motion?.clear?.();renderer.camera.x=(h.x+p.x)/2;renderer.camera.y=p.y;renderer.render();
      return {style:profile,hint:sim.interactionHint(),status:sim.predator.playerStatus(p)};
    }""")

def stage_combat_pressure(page):
    return page.evaluate("""()=>{
      const sim=window.__GENVO8__.sim,p=sim.player(),w=sim.world;sim.endOpeningGrace('runtime-combat-pressure');
      let spot=null;for(let y=24;y<104&&!spot;y+=4)for(let x=24;x<104&&!spot;x+=4){let clear=true;for(let oy=-8;oy<=8&&clear;oy++)for(let ox=-8;ox<=8;ox++)if(w.water[w.idx(x+ox,y+oy)]){clear=false;break}if(clear)spot={x:x+.5,y:y+.5}}
      if(!spot)throw new Error('No dry multi-Stalker staging field');
      for(const a of sim.animals){if(a.id===p.id)continue;a.x=Math.min(123,spot.x+26+(a.id%5));a.y=Math.min(123,spot.y+20+(a.id%5));a.intent='idle';a.target=null;if(a.species==='needlejaw')a.playerHunt=null}
      const hs=sim.animals.filter(a=>a.alive&&a.species==='needlejaw').slice(0,3);while(hs.length<3)hs.push(sim.spawnAnimal('needlejaw',spot.x+20,spot.y+20));
      p.x=spot.x;p.y=spot.y;p.energy=108;p.hydration=102;p.health=100;p.hidden=false;p.intent='idle';p.target=null;
      const placements=[[-3.4,0],[2.9,-2.7],[3.2,2.6]],temps=[1.08,1,.92],now=sim.tickCount;
      hs.forEach((h,i)=>{h.x=p.x+placements[i][0];h.y=p.y+placements[i][1];h.genes.temperament=temps[i];h.energy=122;h.health=100;h.playerAversion=null;h.playerHunt={targetId:p.id,phase:'stalk',style:sim.predator.state(h,p).style,role:'stalk',startedTick:now,untilTick:now,lastOutcome:null,aimX:null,aimY:null};});
      hs.forEach(h=>{const d=sim.predator.decision(h,p);h.intent=d?.intent||'stalk-player';h.target=d?.target||null});sim.rebuildSpatial();
      const tutorial=window.__GENVO8__.tutorial,renderer=window.__GENVO8__.renderer;tutorial.stage='done';tutorial.welcome.hidden=true;if(tutorial.toastEl)tutorial.toastEl.hidden=true;sim.paused=true;tutorial.update(true);renderer.motion?.clear?.();renderer.camera.x=p.x;renderer.camera.y=p.y;renderer.render();
      return {status:sim.predator.playerStatus(p),threats:sim.predator.playerThreats(p),hunters:hs.map(h=>({id:h.id,phase:h.playerHunt?.phase,role:h.playerHunt?.role,intent:h.intent}))};
    }""")

def stage_predator_hit(page,style:str):
    temperament={'ambusher':1.0,'rusher':1.08,'wary':.92}[style]
    return page.evaluate("""(temperament)=>{
      const sim=window.__GENVO8__.sim,p=sim.player();sim.endOpeningGrace('runtime-screenshot-hit');
      const h=sim.animals.find(a=>a.alive&&a.species==='needlejaw');if(!h)throw new Error('No Stalker available');
      let spot=null;for(let r=.72;r<=1.25&&!spot;r+=.08)for(let a=0;a<Math.PI*2&&!spot;a+=Math.PI/8){const x=p.x+Math.cos(a)*r,y=p.y+Math.sin(a)*r,i=sim.world.idx(x,y);if(x>2&&y>2&&x<126&&y<126&&!sim.world.water[i]&&sim.world.sameLand(p.x,p.y,x,y))spot={x,y}}
      if(!spot)throw new Error('No same-land impact staging point');
      h.x=spot.x;h.y=spot.y;h.genes.temperament=temperament;h.health=100;h.energy=120;h.playerHunt=null;h.playerAversion=null;sim.rebuildSpatial();
      const chance=sim.rng.chance;sim.rng.chance=()=>true;const result=sim.playerStrike(h);sim.rng.chance=chance;
      const tutorial=window.__GENVO8__.tutorial,renderer=window.__GENVO8__.renderer;tutorial.stage='done';tutorial.welcome.hidden=true;if(tutorial.toastEl)tutorial.toastEl.hidden=true;tutorial.onInteraction?.(result);sim.paused=true;tutorial.update(true);renderer.motion?.clear?.();renderer.camera.x=p.x;renderer.camera.y=p.y;renderer.render();
      return {result,impact:sim.lastPlayerCombatImpact,style:sim.predator.playerStatus(p)?.style||null};
    }""", temperament)

def stage_den(page):
    page.evaluate("""()=>{
      const sim=window.__GENVO8__.sim,p=sim.player();sim.endOpeningGrace('runtime-screenshot');
      const h=sim.animals.find(a=>a.alive&&a.species==='needlejaw');if(!h)throw new Error('No Stalker available');
      h.age=window.__GENVO8__.SPECIES?.needlejaw?.maturity?window.__GENVO8__.SPECIES.needlejaw.maturity+3:45;h.genes.temperament=1;h.energy=130;h.health=100;h.playerHunt=null;h.playerAversion=null;
      let denSpot=null;
      const dryAround=(x,y)=>{for(let oy=-3;oy<=3;oy++)for(let ox=-3;ox<=3;ox++){if(ox*ox+oy*oy>9)continue;if(sim.world.water[sim.world.idx(x+ox,y+oy)])return false}return true};
      for(let y=10;y<118&&!denSpot;y++)for(let x=10;x<118&&!denSpot;x++)if(dryAround(x,y))denSpot={x:x+.5,y:y+.5};
      if(!denSpot)throw new Error('No dry den staging point');
      h.x=denSpot.x;h.y=denSpot.y;for(const [id,site] of sim.stalkerTerritory.sites)if(site.ownerId===h.id)sim.stalkerTerritory.sites.delete(id);const den=sim.stalkerTerritory.ensure(h);den.feeds=3;
      let ownerSpot=null;for(let r=4;r<=7&&!ownerSpot;r+=.4)for(let a=.3;a<Math.PI*2&&!ownerSpot;a+=Math.PI/12){const x=den.x+Math.cos(a)*r,y=den.y+Math.sin(a)*r,i=sim.world.idx(x,y);if(x>3&&y>3&&x<125&&y<125&&!sim.world.water[i]&&sim.world.sameLand(den.x,den.y,x,y))ownerSpot={x,y}}
      if(ownerSpot){h.x=ownerSpot.x;h.y=ownerSpot.y}
      // Put the player just off the scrape so the E interaction and ground sign are both readable.
      p.x=den.x+.75;p.y=den.y+.35;
      p.hidden=false;sim.rebuildSpatial();const tutorial=window.__GENVO8__.tutorial,renderer=window.__GENVO8__.renderer;tutorial.stage='done';tutorial.welcome.hidden=true;if(tutorial.toastEl)tutorial.toastEl.hidden=true;sim.paused=true;tutorial.update(true);renderer.motion?.clear?.();renderer.camera.x=p.x;renderer.camera.y=p.y;renderer.render();
      return {den:{x:den.x,y:den.y,radius:den.radius,core:den.coreRadius},owner:{x:h.x,y:h.y},player:{x:p.x,y:p.y},status:sim.stalkerTerritory.playerStatus(p)};
    }""")


def stage_family_care(page):
    return page.evaluate("""()=>{
      const sim=window.__GENVO8__.sim,p=sim.player();
      const mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id&&a.sex!==p.sex)||sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id);
      if(!mate)throw new Error('No GenVo8 mate available for family-care staging');
      let spot=null;
      for(let y=14;y<114&&!spot;y+=3)for(let x=14;x<114&&!spot;x+=3){
        if(sim.world.water[sim.world.idx(x,y)]||sim.world.isDrinkable(x,y))continue;
        const hunterClose=sim.animals.some(a=>a.alive&&a.species==='needlejaw'&&Math.hypot(a.x-x,a.y-y)<12);
        const crowded=sim.animals.some(a=>a.alive&&a.id!==p.id&&a.id!==mate.id&&Math.hypot(a.x-x,a.y-y)<4);
        if(!hunterClose&&!crowded)spot={x:x+.5,y:y+.5};
      }
      if(!spot)throw new Error('No quiet dry family-care staging point');
      p.x=spot.x;p.y=spot.y;p.energy=104;p.hydration=98;p.health=100;
      mate.x=spot.x+3.6;mate.y=spot.y-2.3;mate.age=33;mate.energy=106;mate.health=100;
      const child=sim.spawnAnimal('genvo',spot.x+1.2,spot.y+1.0,[p,mate]);
      child.age=3;child.energy=42;child.hydration=87;child.health=96;
      sim.lineage.registerBirth(child,[p,mate]);sim.family.registerBirth(child,p,mate);child.careStress=.66;child.careStressTotal=.66*12;child.careStressSamples=12;child.careHighStressSamples=3;
      sim.shelter.shelters.length=0;sim.shelter.shelters.push({id:1,ownerId:p.id,x:spot.x-.4,y:spot.y+.8,integrity:100,foodStore:8.5,capacity:28,constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount});
      const home=sim.territory.ensure(p);home.home={x:spot.x,y:spot.y};home.radius=8;home.established=true;home.totalFamiliarity=5;
      sim.rebuildSpatial();const tutorial=window.__GENVO8__.tutorial,renderer=window.__GENVO8__.renderer;tutorial.stage='done';tutorial.welcome.hidden=true;if(tutorial.toastEl)tutorial.toastEl.hidden=true;sim.paused=true;tutorial.update(true);renderer.motion?.clear?.();renderer.camera.x=p.x;renderer.camera.y=p.y;renderer.render();
      return {childId:child.id,status:sim.family.careStatus(child,p),hint:sim.interactionHint()};
    }""")




def stage_family_directive(page):
    return page.evaluate("""()=>{
      const sim=window.__GENVO8__.sim,p=sim.player();
      const mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id&&a.sex!==p.sex)||sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id);
      if(!mate)throw new Error('No GenVo8 mate available for family-directive staging');
      let spot=null;for(let y=18;y<110&&!spot;y+=3)for(let x=18;x<110&&!spot;x+=3){if(sim.world.water[sim.world.idx(x,y)]||sim.world.isDrinkable(x,y))continue;const hunterClose=sim.animals.some(a=>a.alive&&a.species==='needlejaw'&&Math.hypot(a.x-x,a.y-y)<15);if(!hunterClose)spot={x:x+.5,y:y+.5}}
      if(!spot)throw new Error('No quiet family-directive staging point');
      p.x=spot.x;p.y=spot.y;p.age=35;p.energy=108;p.hydration=104;p.health=100;mate.x=spot.x+3.3;mate.y=spot.y-1.8;mate.age=34;mate.energy=105;mate.hydration=102;
      const children=[];for(let i=0;i<3;i++){const c=sim.spawnAnimal('genvo',spot.x+5+i*1.3,spot.y-1+i*1.1,[p,mate]);c.age=30+i;c.energy=104;c.hydration=101;c.health=100;sim.lineage.registerBirth(c,[p,mate]);children.push(c)}
      sim.shelter.shelters.length=0;sim.shelter.shelters.push({id:1,ownerId:p.id,x:spot.x-1.8,y:spot.y+2.4,integrity:100,weatherSeal:1,foodStore:8,capacity:28,constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount});
      const home=sim.territory.ensure(p);home.home={x:spot.x,y:spot.y};home.radius=9;home.established=true;home.totalFamiliarity=6;sim.familyDirectives.set('follow','runtime-screenshot');
      children.forEach(c=>{const d=sim.familyDirectives.decision(c);if(d){c.intent=d.intent;c.target=d.target}});sim.rebuildSpatial();
      const tutorial=window.__GENVO8__.tutorial,renderer=window.__GENVO8__.renderer;tutorial.stage='done';tutorial.welcome.hidden=true;if(tutorial.toastEl)tutorial.toastEl.hidden=true;sim.paused=true;tutorial.update(true);renderer.motion?.clear?.();renderer.camera.x=p.x+1.5;renderer.camera.y=p.y;renderer.render();
      return {directive:sim.familyDirectives.status(),children:children.map(c=>({id:c.id,intent:c.intent,target:c.target}))};
    }""")


def stage_family_expansion(page):
    return page.evaluate("""()=>{
      const sim=window.__GENVO8__.sim,p=sim.player();
      const mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id&&a.sex!==p.sex)||sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id);
      if(!mate)throw new Error('No GenVo8 mate available for family-expansion staging');
      let spot=null;for(let y=28;y<100&&!spot;y+=4)for(let x=28;x<100&&!spot;x+=4){let dry=true;for(let oy=-8;oy<=8&&dry;oy++)for(let ox=-10;ox<=10;ox++)if(sim.world.water[sim.world.idx(x+ox,y+oy)]){dry=false;break}if(dry)spot={x:x+.5,y:y+.5}}
      if(!spot)throw new Error('No dry family-expansion staging field');
      for(const a of sim.animals){if(a.id===p.id||a.id===mate.id)continue;if(Math.hypot(a.x-spot.x,a.y-spot.y)<20){a.x=Math.min(123,spot.x+28+(a.id%4));a.y=Math.min(123,spot.y+20+(a.id%5));a.intent='idle';a.target=null}}
      p.x=spot.x;p.y=spot.y;p.age=36;p.energy=110;p.hydration=106;p.health=100;p.intent='idle';p.target=null;
      mate.x=spot.x-2.6;mate.y=spot.y+1.8;mate.age=35;mate.energy=108;mate.hydration=104;mate.health=100;
      const adults=[];for(let i=0;i<3;i++){const a=sim.spawnAnimal('genvo',spot.x+2.6+i*1.4,spot.y-2+i*1.8,[p,mate]);a.age=33+i;a.energy=108;a.hydration=103;a.health=100;sim.lineage.registerBirth(a,[p,mate]);adults.push(a)}
      sim.shelter.shelters.length=0;sim.shelter.shelters.push({id:1,ownerId:p.id,x:spot.x-1.6,y:spot.y+2.2,integrity:100,weatherSeal:1,foodStore:9,capacity:28,constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount});
      const size=sim.territory.cellSize,baseX=Math.floor(spot.x/size),baseY=Math.floor(spot.y/size),family=[p,...adults],cells=[[0,0],[1,0],[-1,0],[0,1],[1,1],[-1,1],[0,-1],[1,-1]];
      cells.forEach((off,i)=>{const a=family[i%family.length],state=sim.territory.ensure(a),cx=baseX+off[0],cy=baseY+off[1],key=`${cx},${cy}`;state.cells.set(key,{key,cx,cy,x:(cx+.5)*size,y:(cy+.5)*size,visits:3.2,lastTick:sim.tickCount});state.home={x:spot.x,y:spot.y};state.radius=9;state.established=true;state.totalFamiliarity=7});
      sim.rebuildSpatial();if(!sim.familyDirectives.set('scout','runtime-screenshot'))throw new Error('Scout failed to unlock in staging');
      adults.forEach(a=>{const d=sim.familyDirectives.decision(a);if(d){a.intent=d.intent;a.target=d.target}});
      const tutorial=window.__GENVO8__.tutorial,renderer=window.__GENVO8__.renderer;tutorial.stage='done';tutorial.welcome.hidden=true;if(tutorial.toastEl)tutorial.toastEl.hidden=true;sim.paused=true;sim.territory.showOverlay=true;tutorial.update(true);renderer.motion?.clear?.();renderer.camera.x=spot.x;renderer.camera.y=spot.y;renderer.render();
      return {reach:sim.expansion.snapshot(),directive:sim.familyDirectives.status(),adults:adults.map(a=>({id:a.id,intent:a.intent,target:a.target}))};
    }""")


def stage_command_mode(page):
    stage_family_expansion(page)
    page.evaluate("""()=>{const sim=window.__GENVO8__.sim;sim.paused=false;sim.territory.showOverlay=false;window.__GENVO8__.tutorial.update(true)}""")
    page.click('#quickMenu [data-command="leadership"]')
    page.wait_for_timeout(180)
    return page.evaluate("""()=>({commandMode:window.__GENVO8__.leadershipWheel.commandMode,context:document.querySelector('#context')?.textContent||'',pressed:document.querySelector('#quickMenu [data-command="leadership"]')?.getAttribute('aria-pressed')})""")


def stage_context_guidance(page):
    stage_command_mode(page)
    coords=page.evaluate("""()=>{
      const sim=window.__GENVO8__.sim,p=sim.player(),renderer=window.__GENVO8__.renderer;
      let target=null;for(let r=3;r<=6&&!target;r+=.5)for(let k=0;k<16&&!target;k++){const a=k*Math.PI/8,x=p.x+Math.cos(a)*r,y=p.y+Math.sin(a)*r;if(x>2&&y>2&&x<126&&y<126&&!sim.world.water[sim.world.idx(x,y)]&&sim.world.sameLand(p.x,p.y,x,y))target={x,y}}
      if(!target)throw new Error('No dry local-guidance target');
      renderer.motion?.clear?.();renderer.camera.x=p.x;renderer.camera.y=p.y;renderer.render();
      const rect=renderer.canvas.getBoundingClientRect(),tile=window.__GENVO8__.CFG.tileSize*renderer.zoom;
      return{x:rect.left+renderer.w/2+(target.x-renderer.camera.x)*tile,y:rect.top+renderer.h/2+(target.y-renderer.camera.y)*tile,target};
    }""")
    page.mouse.click(coords['x'],coords['y'],button='left')
    page.wait_for_timeout(180)
    return page.evaluate("""()=>({wheelHidden:document.querySelector('#commandWheel').hidden,target:window.__GENVO8__.leadershipWheel.target,status:window.__GENVO8__.sim.familyDirectives.areaStatus()})""")


def stage_context_guidance_mark(page):
    stage_context_guidance(page)
    page.click('#commandWheel [data-action="forage"]')
    page.wait_for_timeout(120)
    return page.evaluate("""()=>{const sim=window.__GENVO8__.sim,renderer=window.__GENVO8__.renderer;sim.paused=true;for(const a of sim.familyDirectives.commandable()){const d=sim.familyDirectives.decision(a);if(d){a.intent=d.intent;a.target=d.target}}renderer.render();return{area:sim.familyDirectives.areaStatus(),intents:sim.familyDirectives.commandable().map(a=>({id:a.id,intent:a.intent}))}}""")


def stage_family_nest(page,built=False):
    stage_family_expansion(page)
    return page.evaluate("""(built)=>{
      const sim=window.__GENVO8__.sim,renderer=window.__GENVO8__.renderer,primary=sim.shelter.shelters[0];sim.paused=false;
      const cells=sim.expansion.occupiedCells().filter(c=>Math.hypot(c.x-primary.x,c.y-primary.y)>=7.8&&sim.world.sameLand(primary.x,primary.y,c.x,c.y));
      const target=cells.sort((a,b)=>Math.hypot(a.x-primary.x,a.y-primary.y)-Math.hypot(b.x-primary.x,b.y-primary.y))[0];if(!target)throw new Error('No viable familiar satellite cell');
      for(let yy=Math.floor(target.y)-3;yy<=Math.floor(target.y)+3;yy++)for(let xx=Math.floor(target.x)-3;xx<=Math.floor(target.x)+3;xx++){const i=sim.world.idx(xx,yy);if(sim.world.water[i])continue;if(sim.world.plants.sunmoss)sim.world.plants.sunmoss[i]=Math.max(sim.world.plants.sunmoss[i],.24);if(sim.world.plants.thistlepod&&((xx+yy)%3===0))sim.world.plants.thistlepod[i]=Math.max(sim.world.plants.thistlepod[i],.16)}
      sim.rebuildSpatial();sim.sustainability.invalidate();if(!sim.familyDirectives.setAreaOrder('nest',{x:target.x,y:target.y},'runtime-screenshot'))throw new Error(sim.familyDirectives.lastAreaMessage||'Nest project rejected');
      const workers=sim.familyDirectives.commandable();workers.forEach((a,i)=>{a.x=target.x+((i%3)-1)*.45;a.y=target.y+(.2+Math.floor(i/3)*.42);a.energy=108;a.hydration=104;a.health=100});sim.player().x=primary.x+1.8;sim.player().y=primary.y+.4;sim.rebuildSpatial();
      const steps=built?40:7;for(let i=0;i<steps;i++)sim.shelter.phaseNestProjects();for(const a of workers){const d=sim.familyDirectives.decision(a);if(d){a.intent=d.intent;a.target=d.target}}
      sim.paused=true;sim.territory.showOverlay=true;renderer.motion?.clear?.();renderer.camera.x=(primary.x+target.x)/2;renderer.camera.y=(primary.y+target.y)/2;window.__GENVO8__.tutorial.update(true);renderer.render();
      return{built,reach:sim.expansion.snapshot(),project:sim.shelter.activeProjects()[0]||null,shelters:sim.shelter.shelters.map(s=>({id:s.id,kind:s.kind||'primary',x:s.x,y:s.y,integrity:s.integrity}))};
    }""", built)



def stage_family_pressure(page):
    return page.evaluate("""()=>{
      const sim=window.__GENVO8__.sim,p=sim.player(),PLANTS=window.__GENVO8__.PLANTS||null;
      const mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id&&a.sex!==p.sex)||sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id);
      if(!mate)throw new Error('No GenVo8 mate available for family-pressure staging');
      const size=sim.territory.cellSize;let base=null;
      for(let cy=3;cy<13&&!base;cy++)for(let cx=3;cx<13&&!base;cx++){let dry=true;for(let oy=-1;oy<=1&&dry;oy++)for(let ox=-1;ox<=1;ox++){const x=(cx+ox+.5)*size,y=(cy+oy+.5)*size;if(sim.world.water[sim.world.idx(x,y)]){dry=false;break}}if(dry)base={cx,cy}}
      if(!base)throw new Error('No dry family-pressure block');
      const spot={x:(base.cx+.5)*size,y:(base.cy+.5)*size};
      for(const a of sim.animals){if(a.id===p.id||a.id===mate.id)continue;if(Math.hypot(a.x-spot.x,a.y-spot.y)<22){a.x=Math.min(123,spot.x+30+(a.id%5));a.y=Math.min(123,spot.y+22+(a.id%6));a.intent='idle';a.target=null}}
      p.x=spot.x;p.y=spot.y;p.age=36;p.energy=108;p.hydration=105;p.health=100;p.intent='idle';p.target=null;
      mate.x=spot.x-2.1;mate.y=spot.y+1.4;mate.age=35;mate.energy=104;mate.hydration=102;mate.health=100;
      const adults=[];for(let i=0;i<3;i++){const a=sim.spawnAnimal('genvo',spot.x+1.8+i*1.2,spot.y-1.6+i*.9,[p,mate]);a.age=33+i;a.energy=106;a.hydration=102;a.health=100;sim.lineage.registerBirth(a,[p,mate]);adults.push(a)}
      const offs=[[0,0],[1,0],[0,1],[-1,0],[1,1],[0,-1],[-1,1]];const family=[p,...adults];
      offs.forEach((off,i)=>{const a=family[i%family.length],cx=base.cx+off[0],cy=base.cy+off[1],key=`${cx},${cy}`,st=sim.territory.ensure(a);st.cells.set(key,{key,cx,cy,x:(cx+.5)*size,y:(cy+.5)*size,visits:3.2,lastTick:sim.tickCount});st.home={x:spot.x,y:spot.y};st.radius=10;st.established=true;st.totalFamiliarity=7});
      // Thin most food inside the familiar footprint, but leave one rich frontier to make relief readable.
      const plantKeys=Object.keys(sim.world.plants);for(const off of offs){const cx=base.cx+off[0],cy=base.cy+off[1];for(let y=cy*size;y<(cy+1)*size;y++)for(let x=cx*size;x<(cx+1)*size;x++){const idx=sim.world.idx(x,y);if(sim.world.water[idx])continue;for(const kind of plantKeys)sim.world.plants[kind][idx]=Math.min(sim.world.plants[kind][idx],.035)}}
      const rich={cx:base.cx-1,cy:base.cy-1};for(let y=rich.cy*size;y<(rich.cy+1)*size;y++)for(let x=rich.cx*size;x<(rich.cx+1)*size;x++){const idx=sim.world.idx(x,y);if(sim.world.water[idx])continue;if(sim.world.plants.bramble)sim.world.plants.bramble[idx]=.8;if(sim.world.plants.sunmoss)sim.world.plants.sunmoss[idx]=.95}
      for(let i=0;i<5;i++){const kind=i%2?'rootling':'mosskip',a=sim.spawnAnimal(kind,spot.x-1.4+i*.65,spot.y+2.1+(i%2)*.6);a.age=40;a.energy=80;a.hydration=82;a.intent='feed';a.target=null}
      sim.shelter.shelters.length=0;sim.shelter.shelters.push({id:1,ownerId:p.id,x:spot.x-2.2,y:spot.y-1.7,integrity:100,weatherSeal:1,foodStore:1.2,capacity:28,constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount});
      sim.rebuildSpatial();sim.sustainability.invalidate();sim.familyDirectives.set('forage','runtime-screenshot');adults.forEach(a=>{const d=sim.familyDirectives.decision(a);if(d){a.intent=d.intent;a.target=d.target}});
      const tutorial=window.__GENVO8__.tutorial,renderer=window.__GENVO8__.renderer;tutorial.stage='done';tutorial.welcome.hidden=true;if(tutorial.toastEl)tutorial.toastEl.hidden=true;sim.paused=true;sim.territory.showOverlay=true;tutorial.update(true);renderer.motion?.clear?.();renderer.camera.x=spot.x;renderer.camera.y=spot.y;renderer.render();
      return {sustainability:sim.sustainability.snapshot({force:true}),directive:sim.familyDirectives.status(),adults:adults.map(a=>({id:a.id,intent:a.intent,target:a.target}))};
    }""")

def stage_family_water_lesson(page):
    return page.evaluate("""()=>{
      const sim=window.__GENVO8__.sim,p=sim.player();
      const mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id&&a.sex!==p.sex)||sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id);
      if(!mate)throw new Error('No GenVo8 mate available for family-water-lesson staging');
      const bank=sim.world.drinkSpots.find(w=>sim.world.sameLand(p.x,p.y,w.x,w.y))||sim.world.drinkSpots[0];
      if(!bank||sim.world.water[sim.world.idx(bank.x,bank.y)])throw new Error('No dry drinkable bank available');
      p.x=bank.x;p.y=bank.y;p.energy=105;p.hydration=48;p.health=100;p.age=34;p.intent='idle';
      mate.x=bank.x+2.7;mate.y=bank.y+1.8;mate.age=33;mate.energy=105;mate.health=100;
      const child=sim.spawnAnimal('genvo',bank.x+.8,bank.y+.35,[p,mate]);child.age=13;child.energy=96;child.hydration=88;child.health=100;
      sim.lineage.registerBirth(child,[p,mate]);sim.family.registerBirth(child,p,mate);child.careStress=.10;child.learningLessons={water:0,food:1,shelter:1,danger:1};child.learningMemory={water:null,food:{x:p.x+2,y:p.y,kind:'bramble',lastSeenTick:sim.tickCount},shelter:null,danger:{x:p.x+8,y:p.y,species:'needlejaw',lastSeenTick:sim.tickCount}};
      const shelter={id:1,ownerId:p.id,x:bank.x+2.2,y:bank.y+1.2,integrity:100,foodStore:6,capacity:28,constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount};sim.shelter.shelters.length=0;sim.shelter.shelters.push(shelter);child.learningMemory.shelter={x:shelter.x,y:shelter.y,shelterId:shelter.id,lastSeenTick:sim.tickCount};
      const home=sim.territory.ensure(p);home.home={x:bank.x+1,y:bank.y+1};home.radius=8;home.established=true;home.totalFamiliarity=5;
      for(const a of sim.animals){if(a.id===p.id||a.id===mate.id||a.id===child.id)continue;if(a.species==='needlejaw'&&Math.hypot(a.x-p.x,a.y-p.y)<14){a.x=Math.min(123,p.x+20+(a.id%3));a.y=Math.min(123,p.y+18+(a.id%4));a.playerHunt=null}}
      sim.rebuildSpatial();const tutorial=window.__GENVO8__.tutorial,renderer=window.__GENVO8__.renderer;tutorial.stage='done';tutorial.welcome.hidden=true;if(tutorial.toastEl)tutorial.toastEl.hidden=true;sim.paused=true;tutorial.update(true);renderer.motion?.clear?.();renderer.camera.x=p.x;renderer.camera.y=p.y;renderer.render();
      return {bank:{x:p.x,y:p.y,water:sim.world.water[sim.world.idx(p.x,p.y)],drinkable:sim.world.isDrinkable(p.x,p.y)},child:{x:child.x,y:child.y,water:sim.world.water[sim.world.idx(child.x,child.y)]},learning:sim.family.learningProfile(child),hint:sim.interactionHint()};
    }""")

def stage_family_learning(page):
    return page.evaluate("""()=>{
      const sim=window.__GENVO8__.sim,p=sim.player();
      const mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id&&a.sex!==p.sex)||sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id);
      if(!mate)throw new Error('No GenVo8 mate available for family-learning staging');
      let spot=null;
      for(let y=16;y<112&&!spot;y+=3)for(let x=16;x<112&&!spot;x+=3){
        if(sim.world.water[sim.world.idx(x,y)]||sim.world.isDrinkable(x,y))continue;
        const hunterClose=sim.animals.some(a=>a.alive&&a.species==='needlejaw'&&Math.hypot(a.x-x,a.y-y)<14);
        if(!hunterClose)spot={x:x+.5,y:y+.5};
      }
      if(!spot)throw new Error('No quiet family-learning staging point');
      p.x=spot.x;p.y=spot.y;p.energy=108;p.hydration=102;p.health=100;p.age=34;p.intent='idle';
      mate.x=spot.x+3.4;mate.y=spot.y-2.1;mate.age=33;mate.energy=105;mate.health=100;
      const child=sim.spawnAnimal('genvo',spot.x+1.35,spot.y+.7,[p,mate]);
      child.age=13.5;child.energy=96;child.hydration=94;child.health=100;
      sim.lineage.registerBirth(child,[p,mate]);sim.family.registerBirth(child,p,mate);child.careStress=.14;child.careStressTotal=.14*20;child.careStressSamples=20;
      sim.shelter.shelters.length=0;const shelter={id:1,ownerId:p.id,x:spot.x-.6,y:spot.y+.9,integrity:100,foodStore:9,capacity:28,constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount};sim.shelter.shelters.push(shelter);
      const home=sim.territory.ensure(p);home.home={x:spot.x,y:spot.y};home.radius=8;home.established=true;home.totalFamiliarity=5;
      sim.family.teachLesson(child,'water',{x:spot.x+4,y:spot.y,value:1},`Learned a water place from caregiver #${p.id}`);
      sim.family.teachLesson(child,'food',{x:spot.x+3,y:spot.y,kind:'bramble',value:1},`Learned Berries feeding from caregiver #${p.id}`);
      sim.family.teachLesson(child,'shelter',{x:shelter.x,y:shelter.y,shelterId:shelter.id},`Learned the family shelter from caregiver #${p.id}`);
      sim.rebuildSpatial();const tutorial=window.__GENVO8__.tutorial,renderer=window.__GENVO8__.renderer;tutorial.stage='done';tutorial.welcome.hidden=true;if(tutorial.toastEl)tutorial.toastEl.hidden=true;sim.paused=true;tutorial.update(true);renderer.motion?.clear?.();renderer.camera.x=p.x;renderer.camera.y=p.y;renderer.render();
      return {childId:child.id,learning:sim.family.learningProfile(child),care:sim.family.careStatus(child,p)};
    }""")

def stage_family_practice(page):
    return page.evaluate("""()=>{
      const sim=window.__GENVO8__.sim,p=sim.player();
      const mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id&&a.sex!==p.sex)||sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id);
      if(!mate)throw new Error('No GenVo8 mate available for family-practice staging');
      let spot=null;
      for(let y=20;y<108&&!spot;y+=4)for(let x=20;x<108&&!spot;x+=4){
        if(sim.world.water[sim.world.idx(x,y)]||sim.world.isDrinkable(x,y))continue;
        const hunterClose=sim.animals.some(a=>a.alive&&a.species==='needlejaw'&&Math.hypot(a.x-x,a.y-y)<16);if(!hunterClose)spot={x:x+.5,y:y+.5};
      }
      if(!spot)throw new Error('No quiet family-practice staging point');
      p.x=spot.x;p.y=spot.y;p.energy=110;p.hydration=104;p.health=100;p.age=35;p.intent='idle';
      mate.x=spot.x+2.8;mate.y=spot.y-2.0;mate.age=34;mate.energy=108;mate.health=100;
      const child=sim.spawnAnimal('genvo',spot.x+4.2,spot.y+.6,[p,mate]);child.age=23;child.energy=108;child.hydration=102;child.health=100;
      sim.lineage.registerBirth(child,[p,mate]);sim.family.registerBirth(child,p,mate);child.careStress=.10;child.careStressTotal=2;child.careStressSamples=20;
      sim.shelter.shelters.length=0;const shelter={id:1,ownerId:p.id,x:spot.x-.5,y:spot.y+.8,integrity:100,foodStore:9,capacity:28,constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount};sim.shelter.shelters.push(shelter);
      const home=sim.territory.ensure(p);home.home={x:spot.x,y:spot.y};home.radius=8;home.established=true;home.totalFamiliarity=5;
      for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){const i=sim.world.idx(p.x+ox,p.y+oy);for(const kind of ['sunmoss','bramble','marshroot','rotcap','thistlepod'])if(sim.world.plants[kind])sim.world.plants[kind][i]=0;sim.world.carrion[i]=0}
      const food={x:spot.x+7,y:spot.y+.7,kind:'bramble'};sim.world.plants.bramble[sim.world.idx(food.x,food.y)]=.82;
      const water=sim.world.drinkSpots.find(w=>sim.world.sameLand(spot.x,spot.y,w.x,w.y))||sim.world.drinkSpots[0];
      child.learningLessons={water:2,food:2,shelter:1,danger:1};child.learningMemory={water:{x:water.x,y:water.y,lastSeenTick:sim.tickCount},food:{...food,lastSeenTick:sim.tickCount},shelter:{x:shelter.x,y:shelter.y,shelterId:shelter.id,lastSeenTick:sim.tickCount},danger:{x:spot.x+10,y:spot.y,species:'needlejaw',lastSeenTick:sim.tickCount}};
      child.practiceStats={water:{attempts:1,successes:1},food:{attempts:1,successes:0},completed:1,returns:1,recoveries:0,aborts:0};child.practiceRun={type:'food',phase:'outbound',target:{...food,learned:true},startedTick:sim.tickCount,startedDay:sim.day,outboundSuccess:false,interrupted:false,aborted:false};child.intent='feed';child.target={...food,practice:true};
      sim.rebuildSpatial();const tutorial=window.__GENVO8__.tutorial,renderer=window.__GENVO8__.renderer;tutorial.stage='done';tutorial.welcome.hidden=true;if(tutorial.toastEl)tutorial.toastEl.hidden=true;sim.paused=true;tutorial.update(true);renderer.motion?.clear?.();renderer.camera.x=(p.x+child.x)/2;renderer.camera.y=(p.y+child.y)/2;renderer.render();
      return {childId:child.id,practice:sim.family.practiceProfile(child),learning:sim.family.learningProfile(child)};
    }""")


def stage_handoff_transition(page):
    return page.evaluate("""()=>{
      const sim=__GENVO8__.sim,parent=sim.player(),spec=window.__GENVO8__.sim.animals.find(a=>a.id===parent.id);
      let mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==parent.id&&a.sex!==parent.sex)||sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==parent.id);
      if(!mate)throw new Error('No GenVo8 mate for handoff staging');
      const spot={x:parent.x,y:parent.y};parent.age=35;parent.energy=112;parent.hydration=105;parent.health=100;mate.age=34;mate.energy=108;mate.hydration=102;mate.health=100;mate.x=spot.x+2.2;mate.y=spot.y-1.8;
      const child=sim.spawnAnimal('genvo',spot.x+5.5,spot.y+.5,[parent,mate]);child.age=31;child.energy=78;child.hydration=104;child.health=100;child.careStress=.08;
      sim.lineage.registerBirth(child,[parent,mate]);sim.family.registerBirth(child,parent,mate);
      sim.shelter.shelters.length=0;const shelter={id:1,ownerId:parent.id,x:spot.x-.6,y:spot.y+.9,integrity:100,foodStore:8,capacity:28,constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount};sim.shelter.shelters.push(shelter);
      let food=null;for(let r=5;r<13&&!food;r++)for(let a=0;a<Math.PI*2&&!food;a+=Math.PI/12){const x=Math.max(2,Math.min(125,spot.x+Math.cos(a)*r)),y=Math.max(2,Math.min(125,spot.y+Math.sin(a)*r));if(sim.world.water[sim.world.idx(x,y)]||sim.world.isDrinkable(x,y)||!sim.world.sameLand(spot.x,spot.y,x,y))continue;food={x,y,kind:'bramble'}}if(!food)throw new Error('No dry handoff food target');sim.world.plants.bramble[sim.world.idx(food.x,food.y)]=.9;
      const water=sim.world.drinkSpots.find(w=>sim.world.sameLand(child.x,child.y,w.x,w.y))||sim.world.drinkSpots[0];
      child.learningLessons={water:2,food:2,shelter:1,danger:1};child.learningMemory={water:{x:water.x,y:water.y,lastSeenTick:sim.tickCount},food:{...food,lastSeenTick:sim.tickCount},shelter:{x:shelter.x,y:shelter.y,shelterId:shelter.id,lastSeenTick:sim.tickCount},danger:{x:spot.x+11,y:spot.y,species:'needlejaw',lastSeenTick:sim.tickCount}};
      child.practiceStats={water:{attempts:1,successes:1},food:{attempts:1,successes:1},completed:2,returns:2,recoveries:0,aborts:0};
      sim.rebuildSpatial();if(!sim.lineage.handoffTo(child.id,{manual:true}))throw new Error('Staged handoff failed');
      const tutorial=__GENVO8__.tutorial,renderer=__GENVO8__.renderer;tutorial.stage='done';tutorial.welcome.hidden=true;if(tutorial.toastEl)tutorial.toastEl.hidden=true;tutorial.update(true);
      const offer=sim.evolution?.offerFor?.();if(offer&&!offer.chosen&&offer.offers?.[0])sim.evolution.choose(offer.offers[0].id);if(tutorial.transition&&!tutorial.transition.hidden)tutorial.continueTransition();
      sim.paused=true;tutorial.update(true);renderer.motion?.clear?.();const status=sim.lineage.successionStatus();renderer.camera.x=status?.target?(child.x+status.target.x)/2:child.x;renderer.camera.y=status?.target?(child.y+status.target.y)/2:child.y;renderer.render();
      return {childId:child.id,status,preparedness:sim.lineage.lastHandoff()?.preparedness};
    }""")

def stage_foraging(page):
    return page.evaluate("""()=>{
      const sim=window.__GENVO8__.sim,p=sim.player(),w=sim.world;sim.endOpeningGrace('runtime-screenshot');
      let spot=null;for(let y=12;y<116&&!spot;y+=2)for(let x=12;x<116&&!spot;x+=2){if(w.water[w.idx(x,y)]||w.isDrinkable(x+.5,y+.5))continue;const hunter=sim.animals.some(a=>a.alive&&a.species==='needlejaw'&&Math.hypot(a.x-(x+.5),a.y-(y+.5))<14);if(!hunter)spot={x:x+.5,y:y+.5}}
      if(!spot)throw new Error('No quiet forage staging point');p.x=spot.x;p.y=spot.y;p.energy=62;p.hydration=18;p.health=100;p.hidden=false;
      for(const a of sim.animals){if(a.id===p.id)continue;if(Math.hypot(a.x-p.x,a.y-p.y)<5){a.x=Math.min(124,p.x+18+(a.id%4));a.y=Math.min(124,p.y+16+(a.id%5))}}
      for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){const i=w.idx(p.x+ox,p.y+oy);for(const arr of Object.values(w.plants))arr[i]=0;w.carrion[i]=0}
      w.plants.bramble[w.idx(p.x-1,p.y)]=.92;w.plants.marshroot[w.idx(p.x+1,p.y)]=.92;w.plants.thistlepod[w.idx(p.x,p.y+1)]=.86;w.plants.rotcap[w.idx(p.x,p.y-1)]=.78;w.plants.sunmoss[w.idx(p.x-1,p.y+1)]=.95;
      const fs=sim.foraging.state(p);fs.recent=['ground','fruit'];fs.recentKinds=['sunmoss','bramble'];fs.manual=false;
      sim.rebuildSpatial();const tutorial=__GENVO8__.tutorial,renderer=__GENVO8__.renderer;tutorial.stage='done';tutorial.welcome.hidden=true;if(tutorial.toastEl)tutorial.toastEl.hidden=true;sim.paused=true;tutorial.update(true);renderer.motion?.clear?.();renderer.camera.x=p.x;renderer.camera.y=p.y;renderer.render();
      return {selected:sim.playerFoodTarget(p),diet:sim.foraging.snapshot(p),hint:sim.interactionHint()};
    }""")



def stage_action_toast(page):
    stage_foraging(page)
    return page.evaluate("""()=>{
      const sim=window.__GENVO8__.sim,tutorial=window.__GENVO8__.tutorial,renderer=window.__GENVO8__.renderer;
      sim.paused=false;const result=sim.playerInteract();tutorial.onInteraction(result);tutorial.update(true);renderer.render();
      const toast=tutorial.toastEl,rect=toast.getBoundingClientRect();
      return{result,toast:{hidden:toast.hidden,text:toast.textContent,left:rect.left,top:rect.top,right:rect.right,bottom:rect.bottom},viewport:{w:innerWidth,h:innerHeight}};
    }""")


def stage_forage_patch(page):
    return page.evaluate("""()=>{
      const sim=window.__GENVO8__.sim,p=sim.player(),w=sim.world,CFG=window.__GENVO8__.CFG;sim.endOpeningGrace('runtime-screenshot');
      let start=null,patchSpot=null;
      for(let y=18;y<110&&!patchSpot;y+=2)for(let x=18;x<104&&!patchSpot;x+=2){
        const sx=x+.5,sy=y+.5,px=sx+7,py=sy;if(w.water[w.idx(sx,sy)]||w.water[w.idx(px,py)]||w.isDrinkable(sx,sy)||w.isDrinkable(px,py))continue;
        let clear=true;for(let oy=-3;oy<=3;oy++)for(let ox=-3;ox<=10;ox++)if(w.water[w.idx(sx+ox,sy+oy)])clear=false;
        const hunter=sim.animals.some(a=>a.alive&&a.species==='needlejaw'&&Math.hypot(a.x-sx,a.y-sy)<15);if(clear&&!hunter){start={x:sx,y:sy};patchSpot={x:px,y:py}}
      }
      if(!start||!patchSpot)throw new Error('No dry forage-patch staging lane');
      for(const a of sim.animals){if(a.id===p.id)continue;if(Math.hypot(a.x-start.x,a.y-start.y)<10){a.x=Math.min(124,start.x+20+(a.id%4));a.y=Math.min(124,start.y+18+(a.id%5))}}
      for(let oy=-3;oy<=3;oy++)for(let ox=-3;ox<=10;ox++){const i=w.idx(start.x+ox,start.y+oy);for(const arr of Object.values(w.plants))arr[i]=0;w.carrion[i]=0}
      for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++)w.plants.sunmoss[w.idx(patchSpot.x+ox,patchSpot.y+oy)]=.32+((ox+oy+2)%3)*.05;
      p.x=patchSpot.x;p.y=patchSpot.y;p.energy=48;p.hydration=92;p.health=100;sim.foraging.rememberPatch(p,'sunmoss',patchSpot.x,patchSpot.y);
      const memory=sim.foraging.state(p).patches[0];memory.bestSeen=Math.max(memory.bestSeen,3.2);memory.lastAmount=.38;memory.lastRatio=.12;memory.status='exhausted';memory.depletedTick=sim.tickCount-CFG.dayTicks*4;memory.lastSeenTick=sim.tickCount-CFG.dayTicks*4;
      p.x=start.x;p.y=start.y;p.energy=42;p.hydration=90;sim.rebuildSpatial();
      const tutorial=window.__GENVO8__.tutorial,renderer=window.__GENVO8__.renderer;tutorial.stage='done';tutorial.welcome.hidden=true;if(tutorial.toastEl)tutorial.toastEl.hidden=true;sim.paused=true;tutorial.update(true);renderer.motion?.clear?.();renderer.camera.x=(p.x+patchSpot.x)/2;renderer.camera.y=(p.y+patchSpot.y)/2;renderer.render();
      return {route:sim.foraging.routeSuggestion(p),patches:sim.foraging.knownPatches(p),energy:p.energy};
    }""")


def stage_forage_season(page):
    return page.evaluate("""()=>{
      const sim=window.__GENVO8__.sim,p=sim.player(),w=sim.world;sim.endOpeningGrace('runtime-screenshot');sim.seasonIndex=1;
      let start=null;for(let y=22;y<106&&!start;y+=3)for(let x=28;x<100&&!start;x+=3){const a={x:x+.5,y:y+.5},b={x:x+8.5,y:y+.5},c={x:x-8.5,y:y+.5};if([a,b,c].some(q=>w.water[w.idx(q.x,q.y)]||w.isDrinkable(q.x,q.y)))continue;let clear=true;for(let yy=-3;yy<=3;yy++)for(let xx=-11;xx<=11;xx++)if(w.water[w.idx(a.x+xx,a.y+yy)])clear=false;if(clear)start=a}
      if(!start)throw new Error('No dry seasonal forage staging lane');const berries={x:start.x-8,y:start.y},seeds={x:start.x+8,y:start.y};
      for(let oy=-3;oy<=3;oy++)for(let ox=-11;ox<=11;ox++){const i=w.idx(start.x+ox,start.y+oy);for(const arr of Object.values(w.plants))arr[i]=0;w.carrion[i]=0}
      w.plants.bramble[w.idx(berries.x,berries.y)]=.78;w.plants.thistlepod[w.idx(seeds.x,seeds.y)]=.56;
      for(const a of sim.animals){if(a.id===p.id)continue;a.x=Math.min(123,start.x+24+(a.id%4));a.y=Math.min(123,start.y+18+(a.id%5));a.intent='idle';a.target=null}
      p.x=berries.x;p.y=berries.y;p.energy=32;p.hydration=82;sim.foraging.rememberPatch(p,'bramble',berries.x,berries.y);
      p.x=seeds.x;p.y=seeds.y;sim.foraging.rememberPatch(p,'thistlepod',seeds.x,seeds.y);
      const grazers=sim.animals.filter(a=>a.alive&&a.id!==p.id&&((window.__GENVO8__.SPECIES?.[a.species]?.diets?.thistlepod)||a.species==='mosskip'||a.species==='rootling')).slice(0,2);
      for(const [n,a] of grazers.entries()){a.x=seeds.x+.9+n*.8;a.y=seeds.y+.45;a.intent='feed';a.target={x:seeds.x,y:seeds.y,kind:'thistlepod'}}
      sim.tickCount+=window.__GENVO8__.CFG.lifeStride;sim.foraging.rememberPatch(p,'thistlepod',seeds.x,seeds.y);
      p.x=start.x;p.y=start.y;p.energy=30;p.hydration=84;sim.rebuildSpatial();const tutorial=__GENVO8__.tutorial,renderer=__GENVO8__.renderer;tutorial.stage='done';tutorial.welcome.hidden=true;if(tutorial.toastEl)tutorial.toastEl.hidden=true;sim.paused=true;tutorial.update(true);renderer.motion?.clear?.();renderer.camera.x=start.x;renderer.camera.y=start.y;renderer.render();
      return {route:sim.foraging.routeSuggestion(p),patches:sim.foraging.knownPatches(p)};
    }""")

def stage_weather_exposure(page):
    return page.evaluate("""()=>{
      const sim=window.__GENVO8__.sim,p=sim.player(),w=sim.world;sim.endOpeningGrace('runtime-screenshot');
      let spot=null;for(let y=20;y<108&&!spot;y+=4)for(let x=20;x<108&&!spot;x+=4){const i=w.idx(x,y);if(w.water[i]||w.isDrinkable(x,y))continue;const dryShelter=!w.water[w.idx(x+6,y)];if(dryShelter)spot={x:x+.5,y:y+.5}}
      if(!spot)throw new Error('No dry weather staging point');
      for(const a of sim.animals){if(a.id===p.id)continue;if(a.species==='needlejaw'){a.x=Math.min(122,spot.x+24+(a.id%3));a.y=Math.min(122,spot.y+18+(a.id%4));a.playerHunt=null}}
      p.x=spot.x;p.y=spot.y;p.energy=78;p.hydration=82;p.health=100;p.hidden=false;sim.climate={temp:.31,rain:.72};
      sim.shelter.shelters.length=0;sim.shelter.shelters.push({id:1,ownerId:p.id,x:spot.x+5.8,y:spot.y+.4,integrity:96,foodStore:5,capacity:28,constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount});
      const exposure=sim.exposure.state(p);exposure.wetness=.78;exposure.strain=.66;sim.rebuildSpatial();
      const tutorial=window.__GENVO8__.tutorial,renderer=window.__GENVO8__.renderer;tutorial.stage='done';tutorial.welcome.hidden=true;if(tutorial.toastEl)tutorial.toastEl.hidden=true;sim.paused=true;tutorial.update(true);renderer.motion?.clear?.();renderer.camera.x=(p.x+spot.x+5.8)/2;renderer.camera.y=p.y;renderer.render();
      return {exposure:sim.exposure.snapshot(p),shelter:sim.shelter.snapshot(p)};
    }""")


def stage_shelter_weatherproofing(page):
    return page.evaluate("""()=>{
      const sim=window.__GENVO8__.sim,p=sim.player(),w=sim.world;sim.endOpeningGrace('runtime-screenshot');
      let spot=null;for(let y=22;y<106&&!spot;y+=4)for(let x=22;x<106&&!spot;x+=4){const i=w.idx(x,y);if(w.water[i]||w.isDrinkable(x,y))continue;spot={x:x+.5,y:y+.5}}
      if(!spot)throw new Error('No dry shelter staging point');
      for(const a of sim.animals){if(a.id===p.id)continue;if(a.species==='needlejaw'){a.x=Math.min(122,spot.x+24+(a.id%3));a.y=Math.min(122,spot.y+18+(a.id%4));a.playerHunt=null}}
      p.x=spot.x;p.y=spot.y;p.energy=82;p.hydration=88;p.health=100;p.hidden=false;sim.climate={temp:.31,rain:.76};
      for(let yy=Math.floor(spot.y-2);yy<=Math.ceil(spot.y+2);yy++)for(let xx=Math.floor(spot.x-2);xx<=Math.ceil(spot.x+2);xx++){const d=Math.hypot(xx-spot.x,yy-spot.y),i=w.idx(xx,yy);if(!w.water[i]&&d>1.45&&d<2.35){w.plants.sunmoss[i]=Math.max(w.plants.sunmoss[i]||0,.72);w.plants.bramble[i]=Math.max(w.plants.bramble[i]||0,.42)}else if(d<1.25){w.plants.sunmoss[i]=0;w.plants.bramble[i]=0;w.plants.thistlepod[i]=0;w.plants.marshroot[i]=0}}
      sim.shelter.shelters.length=0;const sh={id:1,ownerId:p.id,x:spot.x+.9,y:spot.y+.15,integrity:96,weatherSeal:.24,foodStore:5,capacity:28,constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount};sim.shelter.shelters.push(sh);
      const exposure=sim.exposure.state(p);exposure.wetness=.76;exposure.strain=.68;sim.rebuildSpatial();
      const tutorial=window.__GENVO8__.tutorial,renderer=window.__GENVO8__.renderer;tutorial.stage='done';tutorial.welcome.hidden=true;if(tutorial.toastEl)tutorial.toastEl.hidden=true;sim.paused=true;tutorial.update(true);renderer.motion?.clear?.();renderer.camera.x=p.x;renderer.camera.y=p.y;renderer.render();
      return {exposure:sim.exposure.snapshot(p),shelter:sim.shelter.snapshot(p)};
    }""")


def stage_family_weather(page):
    return page.evaluate("""()=>{
      const sim=window.__GENVO8__.sim,p=sim.player(),w=sim.world;sim.endOpeningGrace('runtime-screenshot');
      let spot=null;for(let y=24;y<104&&!spot;y+=4)for(let x=24;x<104&&!spot;x+=4){const i=w.idx(x,y);if(w.water[i]||w.isDrinkable(x,y))continue;let clear=true;for(let oy=-3;oy<=3;oy++)for(let ox=-7;ox<=7;ox++)if(w.water[w.idx(x+ox,y+oy)])clear=false;if(clear)spot={x:x+.5,y:y+.5}}
      if(!spot)throw new Error('No dry family-weather staging point');
      for(const a of sim.animals){if(a.id===p.id)continue;a.x=Math.min(122,spot.x+24+(a.id%4));a.y=Math.min(122,spot.y+18+(a.id%5));a.intent='idle';a.target=null}
      let mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id);if(!mate)mate=sim.spawnAnimal('genvo',spot.x+18,spot.y+18);mate.sex=p.sex==='F'?'M':'F';mate.age=36;mate.energy=108;mate.hydration=104;
      p.x=spot.x;p.y=spot.y;p.energy=90;p.hydration=92;p.health=100;p.hidden=false;sim.climate={temp:.30,rain:.84};
      sim.shelter.shelters.length=0;const sh={id:1,ownerId:p.id,x:spot.x+.5,y:spot.y+.2,integrity:97,weatherSeal:.91,foodStore:8,capacity:28,constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount};sim.shelter.shelters.push(sh);
      for(let oy=-2;oy<=2;oy++)for(let ox=-2;ox<=2;ox++){const i=w.idx(sh.x+ox,sh.y+oy);for(const arr of Object.values(w.plants))arr[i]=0;w.carrion[i]=0}
      const young=sim.spawnAnimal('genvo',sh.x+.45,sh.y+.35,[p,mate]);sim.lineage.registerBirth(young,[p,mate]);sim.family.registerBirth(young,p,mate);young.age=8;young.energy=98;young.hydration=98;young.careStress=.14;
      const adolescent=sim.spawnAnimal('genvo',sh.x+5.4,sh.y+.3,[p,mate]);sim.lineage.registerBirth(adolescent,[p,mate]);sim.family.registerBirth(adolescent,p,mate);adolescent.age=22;adolescent.energy=104;adolescent.hydration=100;adolescent.careStress=.12;adolescent.learningLessons={water:2,food:2,shelter:2,danger:1};
      const adult=sim.spawnAnimal('genvo',sh.x-.8,sh.y+.35,[p,mate]);sim.lineage.registerBirth(adult,[p,mate]);sim.family.registerBirth(adult,p,mate);adult.age=34;adult.energy=108;adult.hydration=104;adult.careStress=.08;
      const dec=sim.familyWeather.decision(adolescent);if(dec){adolescent.intent=dec.intent;adolescent.target=dec.target}
      p.x=sh.x-.25;p.y=sh.y;const exposure=sim.exposure.state(p);exposure.wetness=.36;exposure.strain=.30;sim.rebuildSpatial();sim.familyWeather.phase();
      const tutorial=window.__GENVO8__.tutorial,renderer=window.__GENVO8__.renderer;tutorial.stage='done';tutorial.welcome.hidden=true;if(tutorial.toastEl)tutorial.toastEl.hidden=true;sim.paused=true;tutorial.update(true);renderer.motion?.clear?.();renderer.camera.x=(sh.x+adolescent.x)/2;renderer.camera.y=sh.y;renderer.render();
      return {refuge:sim.familyWeather.snapshot(p),adolescent:{intent:adolescent.intent,x:adolescent.x,y:adolescent.y},shelter:sim.shelter.snapshot(p)};
    }""")


def stage_storm_aftermath(page):
    return page.evaluate("""()=>{
      const sim=window.__GENVO8__.sim,p=sim.player(),w=sim.world,CFG=window.__GENVO8__.CFG;sim.endOpeningGrace('runtime-screenshot');
      let spot=null;for(let y=24;y<104&&!spot;y+=4)for(let x=24;x<104&&!spot;x+=4){const i=w.idx(x,y);if(w.water[i]||w.isDrinkable(x,y))continue;let clear=true;for(let oy=-3;oy<=3;oy++)for(let ox=-9;ox<=9;ox++)if(w.water[w.idx(x+ox,y+oy)])clear=false;if(clear)spot={x:x+.5,y:y+.5}}
      if(!spot)throw new Error('No dry storm-aftermath staging point');
      for(const a of sim.animals){if(a.id===p.id)continue;a.x=Math.min(122,spot.x+25+(a.id%4));a.y=Math.min(122,spot.y+18+(a.id%5));a.intent='idle';a.target=null}
      let mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id);if(!mate)mate=sim.spawnAnimal('genvo',spot.x+20,spot.y+18);mate.sex=p.sex==='F'?'M':'F';mate.age=36;mate.energy=108;mate.hydration=104;
      p.x=spot.x;p.y=spot.y;p.energy=86;p.hydration=90;p.health=100;p.hidden=false;
      sim.shelter.shelters.length=0;const sh={id:1,ownerId:p.id,x:spot.x+.5,y:spot.y+.2,integrity:98,weatherSeal:.91,foodStore:8,capacity:28,constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount};sim.shelter.shelters.push(sh);
      for(let oy=-2;oy<=2;oy++)for(let ox=-2;ox<=2;ox++){const i=w.idx(sh.x+ox,sh.y+oy);for(const arr of Object.values(w.plants))arr[i]=0;w.carrion[i]=0}
      const young=sim.spawnAnimal('genvo',sh.x+.65,sh.y+.35,[p,mate]);sim.lineage.registerBirth(young,[p,mate]);sim.family.registerBirth(young,p,mate);young.age=8;young.energy=98;young.hydration=98;young.careStress=.42;
      const drink=w.nearestDrinkable(sh.x,sh.y,28);if(!drink)throw new Error('No water for resumed practice route');
      const adolescent=sim.spawnAnimal('genvo',sh.x+4.2,sh.y+.25,[p,mate]);sim.lineage.registerBirth(adolescent,[p,mate]);sim.family.registerBirth(adolescent,p,mate);adolescent.age=23;adolescent.energy=104;adolescent.hydration=100;adolescent.careStress=.10;adolescent.learningLessons={water:2,food:2,shelter:2,danger:1};adolescent.practiceStats={water:{attempts:1,successes:0},food:{attempts:0,successes:0},completed:0,returns:0,recoveries:0,aborts:0};adolescent.practiceRun={type:'water',phase:'outbound',target:{x:drink.x,y:drink.y,learned:true},startedTick:sim.tickCount,outboundSuccess:false,interrupted:false,aborted:false};adolescent.intent='drink';adolescent.target={...adolescent.practiceRun.target,practice:true};
      // Learn a nearby Reed patch, then age the observation so recent rain affects only the estimate.
      const reed={x:sh.x-6.5,y:sh.y+.2};w.plants.marshroot[w.idx(reed.x,reed.y)]=.52;p.x=reed.x;p.y=reed.y;sim.foraging.rememberPatch(p,'marshroot',reed.x,reed.y);const patch=sim.foraging.state(p).patches.find(x=>x.kind==='marshroot');patch.bestSeen=Math.max(patch.bestSeen,2.4);patch.lastAmount=.30;patch.lastRatio=.13;patch.status='exhausted';patch.depletedTick=sim.tickCount-CFG.dayTicks*3;patch.lastSeenTick=sim.tickCount-CFG.dayTicks*3;
      p.x=sh.x-.25;p.y=sh.y;mate.x=sh.x-.65;mate.y=sh.y+.15;young.x=sh.x+.65;young.y=sh.y+.35;
      sim.climate={temp:.29,rain:.86};sim.rebuildSpatial();const stormDecision=sim.familyWeather.decision(adolescent);if(stormDecision){adolescent.intent=stormDecision.intent;adolescent.target=stormDecision.target}adolescent.x=sh.x+1.0;adolescent.y=sh.y-.25;sim.rebuildSpatial();sim.familyWeather.phase();
      sim.climate={temp:.57,rain:.12};sim.tickCount+=CFG.lifeStride;sim.familyWeather.phase();sim.familyWeather.decision(adolescent);const resume=sim.family.practiceDecision(adolescent);if(resume){adolescent.intent=resume.intent;adolescent.target=resume.target}adolescent.x=sh.x+3.2;adolescent.y=sh.y-.2;
      const exposure=sim.exposure.state(p);exposure.wetness=.18;exposure.strain=.10;sim.rebuildSpatial();
      const tutorial=window.__GENVO8__.tutorial,renderer=window.__GENVO8__.renderer;tutorial.stage='done';tutorial.welcome.hidden=true;if(tutorial.toastEl)tutorial.toastEl.hidden=true;sim.paused=true;tutorial.update(true);renderer.motion?.clear?.();renderer.camera.x=(sh.x+adolescent.x)/2;renderer.camera.y=sh.y;renderer.render();
      return {aftermath:sim.familyWeather.aftermathStatus(p),practice:sim.family.practiceProfile(adolescent),route:sim.foraging.routeSuggestion(p)};
    }""")

def stage_illness_recovery(page):
    return page.evaluate("""()=>{
      const sim=window.__GENVO8__.sim,p=sim.player(),w=sim.world;sim.endOpeningGrace('runtime-screenshot');
      let spot=null;for(let y=22;y<106&&!spot;y+=4)for(let x=22;x<106&&!spot;x+=4){const i=w.idx(x,y);if(w.water[i]||w.isDrinkable(x,y))continue;let clear=true;for(let oy=-3;oy<=3;oy++)for(let ox=-4;ox<=4;ox++)if(w.water[w.idx(x+ox,y+oy)])clear=false;if(clear)spot={x:x+.5,y:y+.5}}
      if(!spot)throw new Error('No dry illness staging point');
      for(const a of sim.animals){if(a.id===p.id)continue;a.x=Math.min(122,spot.x+24+(a.id%4));a.y=Math.min(122,spot.y+18+(a.id%5));a.intent='idle';a.target=null}
      let mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id);if(!mate)mate=sim.spawnAnimal('genvo',spot.x+1,spot.y+.5);mate.x=spot.x+1.0;mate.y=spot.y+.45;mate.age=34;mate.energy=108;mate.hydration=104;mate.health=100;mate.infected=false;mate.immune=false;mate.immuneUntilDay=0;
      p.x=spot.x;p.y=spot.y;p.energy=100;p.hydration=96;p.health=84;p.hidden=false;p.intent='idle';p.target=null;
      sim.shelter.shelters.length=0;const sh={id:1,ownerId:p.id,x:spot.x+.25,y:spot.y+.15,integrity:98,weatherSeal:.92,foodStore:7,capacity:28,constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount};sim.shelter.shelters.push(sh);
      for(let oy=-2;oy<=2;oy++)for(let ox=-2;ox<=2;ox++){const i=w.idx(spot.x+ox,spot.y+oy);for(const arr of Object.values(w.plants))arr[i]=0;w.carrion[i]=0}
      sim.disease.infect(p,{force:true,source:'test'});p.infection.days=2;p.infection.duration=Math.max(7,p.infection.duration);for(let i=0;i<6;i++)sim.illness.phase();sim.rebuildSpatial();
      const tutorial=window.__GENVO8__.tutorial,renderer=window.__GENVO8__.renderer;tutorial.stage='done';tutorial.welcome.hidden=true;if(tutorial.toastEl)tutorial.toastEl.hidden=true;sim.paused=true;tutorial.update(true);renderer.motion?.clear?.();renderer.camera.x=p.x;renderer.camera.y=p.y;renderer.render();
      return {illness:sim.illness.snapshot(p),disease:sim.disease.snapshot(p),shelter:sim.shelter.snapshot(p)};
    }""")

def stage_family_illness(page):
    return page.evaluate("""()=>{
      const sim=window.__GENVO8__.sim,p=sim.player(),w=sim.world;sim.endOpeningGrace('runtime-screenshot');
      let spot=null;for(let y=24;y<104&&!spot;y+=4)for(let x=24;x<104&&!spot;x+=4){const i=w.idx(x,y);if(w.water[i]||w.isDrinkable(x,y))continue;let clear=true;for(let oy=-4;oy<=4;oy++)for(let ox=-6;ox<=6;ox++)if(w.water[w.idx(x+ox,y+oy)])clear=false;if(clear)spot={x:x+.5,y:y+.5}}
      if(!spot)throw new Error('No dry family illness staging point');
      for(const a of sim.animals){if(a.id===p.id)continue;a.x=Math.min(122,spot.x+24+(a.id%4));a.y=Math.min(122,spot.y+18+(a.id%5));a.intent='idle';a.target=null}
      let mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id);if(!mate)mate=sim.spawnAnimal('genvo',spot.x+3.6,spot.y+.4);mate.sex=p.sex==='F'?'M':'F';mate.x=spot.x+3.6;mate.y=spot.y+.35;mate.age=35;mate.energy=108;mate.hydration=104;mate.health=100;mate.infected=false;mate.immune=false;mate.immuneUntilDay=0;
      p.x=spot.x;p.y=spot.y;p.energy=100;p.hydration=96;p.health=86;p.hidden=false;p.intent='idle';p.target=null;sim.climate={temp:.57,rain:.08};
      sim.shelter.shelters.length=0;const sh={id:1,ownerId:p.id,x:spot.x+.25,y:spot.y+.15,integrity:98,weatherSeal:.92,foodStore:8,capacity:28,constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount};sim.shelter.shelters.push(sh);
      for(let oy=-2;oy<=2;oy++)for(let ox=-2;ox<=2;ox++){const i=w.idx(spot.x+ox,spot.y+oy);for(const arr of Object.values(w.plants))arr[i]=0;w.carrion[i]=0}
      const young=sim.spawnAnimal('genvo',spot.x+3.2,spot.y+.7,[p,mate]);sim.lineage.registerBirth(young,[p,mate]);sim.family.registerBirth(young,p,mate);young.age=9;young.energy=98;young.hydration=96;young.health=100;young.careStress=.12;young.caregiverId=mate.id;
      const adult=sim.spawnAnimal('genvo',spot.x-3.6,spot.y-.5,[p,mate]);sim.lineage.registerBirth(adult,[p,mate]);sim.family.registerBirth(adult,p,mate);adult.age=36;adult.energy=108;adult.hydration=104;adult.health=100;
      sim.disease.infect(p,{force:true,source:'test'});p.infection.days=2;p.infection.duration=Math.max(7,p.infection.duration);for(let i=0;i<5;i++)sim.illness.phase();
      for(const a of [mate,young,adult]){const d=sim.familyIllness.decision(a);if(d){a.intent=d.intent;a.target=d.target}}
      sim.rebuildSpatial();const tutorial=window.__GENVO8__.tutorial,renderer=window.__GENVO8__.renderer;tutorial.stage='done';tutorial.welcome.hidden=true;if(tutorial.toastEl)tutorial.toastEl.hidden=true;sim.paused=true;tutorial.update(true);renderer.motion?.clear?.();renderer.camera.x=(p.x+young.x)/2;renderer.camera.y=p.y;renderer.render();
      return {illness:sim.illness.snapshot(p),family:sim.familyIllness.snapshot(p),young:{id:young.id,intent:young.intent,caregiverId:young.caregiverId},mate:{id:mate.id,intent:mate.intent},adult:{id:adult.id,intent:adult.intent}};
    }""")


def stage_immunity_awareness(page):
    return page.evaluate("""()=>{
      const sim=window.__GENVO8__.sim,p=sim.player(),w=sim.world;sim.endOpeningGrace('runtime-screenshot');
      let spot=null;for(let y=24;y<104&&!spot;y+=4)for(let x=24;x<104&&!spot;x+=4){const i=w.idx(x,y);if(w.water[i]||w.isDrinkable(x,y))continue;let clear=true;for(let oy=-4;oy<=4;oy++)for(let ox=-6;ox<=6;ox++)if(w.water[w.idx(x+ox,y+oy)])clear=false;if(clear)spot={x:x+.5,y:y+.5}}
      if(!spot)throw new Error('No dry immunity staging point');
      for(const a of sim.animals){if(a.id===p.id)continue;a.x=Math.min(122,spot.x+24+(a.id%4));a.y=Math.min(122,spot.y+18+(a.id%5));a.intent='idle';a.target=null}
      let mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id);if(!mate)mate=sim.spawnAnimal('genvo',spot.x+4.2,spot.y+.4);mate.sex=p.sex==='F'?'M':'F';mate.x=spot.x+2.9;mate.y=spot.y+.35;mate.age=35;mate.energy=108;mate.hydration=104;mate.health=100;mate.infected=false;mate.immune=false;mate.immuneUntilDay=0;
      p.x=spot.x;p.y=spot.y;p.energy=92;p.hydration=90;p.health=88;p.hidden=false;p.intent='idle';p.target=null;sim.climate={temp:.57,rain:.05};
      sim.shelter.shelters.length=0;const sh={id:1,ownerId:p.id,x:spot.x-.2,y:spot.y-.1,integrity:98,weatherSeal:.94,foodStore:8,capacity:28,constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount};sim.shelter.shelters.push(sh);
      for(let oy=-2;oy<=2;oy++)for(let ox=-2;ox<=2;ox++){const i=w.idx(spot.x+ox,spot.y+oy);for(const arr of Object.values(w.plants))arr[i]=0;w.carrion[i]=0}
      const young=sim.spawnAnimal('genvo',spot.x+.8,spot.y+.45,[p,mate]);sim.lineage.registerBirth(young,[p,mate]);sim.family.registerBirth(young,p,mate);young.age=8;young.energy=90;young.hydration=88;young.health=96;young.careStress=.32;young.caregiverId=p.id;
      const adult=sim.spawnAnimal('genvo',spot.x-2.9,spot.y+1.0,[p,mate]);sim.lineage.registerBirth(adult,[p,mate]);sim.family.registerBirth(adult,p,mate);adult.age=38;adult.energy=108;adult.hydration=104;adult.health=100;
      sim.disease.infect(p,{force:true,source:'test'});sim.disease.recover(p);sim.disease.infect(young,{force:true,source:'test'});young.infection.days=2;young.infection.duration=Math.max(7,young.infection.duration);
      for(const a of [mate,adult]){const d=sim.familyIllness.decision(a);if(d){a.intent=d.intent;a.target=d.target}}
      sim.rebuildSpatial();const tutorial=window.__GENVO8__.tutorial,renderer=window.__GENVO8__.renderer;tutorial.stage='done';tutorial.welcome.hidden=true;if(tutorial.toastEl)tutorial.toastEl.hidden=true;sim.paused=true;tutorial.update(true);renderer.motion?.clear?.();renderer.camera.x=(p.x+young.x)/2;renderer.camera.y=p.y;renderer.render();
      return {illness:sim.illness.snapshot(p),family:sim.familyIllness.snapshot(p),hint:sim.interactionHint(),young:{id:young.id,infected:young.infected},mate:{intent:mate.intent},adult:{intent:adult.intent}};
    }""")

def stage_injury_recovery(page):
    return page.evaluate("""()=>{
      const sim=window.__GENVO8__.sim,p=sim.player(),w=sim.world;sim.endOpeningGrace('runtime-screenshot');
      let spot=null;for(let y=24;y<104&&!spot;y+=4)for(let x=24;x<100&&!spot;x+=4){if(w.water[w.idx(x,y)]||w.water[w.idx(x+6,y)]||w.isDrinkable(x,y))continue;let clear=true;for(let oy=-3;oy<=3;oy++)for(let ox=-3;ox<=8;ox++)if(w.water[w.idx(x+ox,y+oy)])clear=false;if(clear)spot={x:x+.5,y:y+.5}}
      if(!spot)throw new Error('No dry injury staging lane');
      for(const a of sim.animals){if(a.id===p.id)continue;a.x=Math.min(123,spot.x+22+(a.id%4));a.y=Math.min(123,spot.y+17+(a.id%5));a.intent='idle';a.target=null;if(a.species==='needlejaw')a.playerHunt=null}
      p.x=spot.x;p.y=spot.y;p.health=54;p.energy=84;p.hydration=90;p.hidden=false;p.intent='player';p.target={dx:1,dy:0,sprint:false};sim.climate={temp:.58,rain:.04};const ex=sim.exposure.state(p);ex.wetness=0;ex.strain=0;
      sim.shelter.shelters.length=0;const sh={id:1,ownerId:p.id,x:spot.x+5.8,y:spot.y+.2,integrity:96,weatherSeal:.88,foodStore:5,capacity:28,constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount};sim.shelter.shelters.push(sh);
      for(let oy=-2;oy<=2;oy++)for(let ox=-2;ox<=7;ox++){const i=w.idx(spot.x+ox,spot.y+oy);for(const arr of Object.values(w.plants))arr[i]=0;w.carrion[i]=0}
      const hunter=sim.animals.find(a=>a.alive&&a.species==='needlejaw')||null;sim.injury.onDamage(p,{damage:46,attacker:hunter});sim.lastPlayerDamage=null;sim.rebuildSpatial();
      const tutorial=window.__GENVO8__.tutorial,renderer=window.__GENVO8__.renderer;tutorial.stage='done';tutorial.welcome.hidden=true;if(tutorial.toastEl)tutorial.toastEl.hidden=true;sim.paused=true;tutorial.update(true);renderer.motion?.clear?.();renderer.camera.x=(p.x+sh.x)/2;renderer.camera.y=p.y;renderer.render();
      return {injury:sim.injury.snapshot(p),health:p.health,shelter:sh};
    }""")


def stage_wildlife(page):
    return page.evaluate("""()=>{
      const sim=window.__GENVO8__.sim,p=sim.player(),w=sim.world;sim.endOpeningGrace('runtime-screenshot');
      let spot=null;
      for(let y=24;y<104&&!spot;y+=4)for(let x=24;x<104&&!spot;x+=4){
        let clear=true;for(let oy=-8;oy<=8&&clear;oy++)for(let ox=-10;ox<=10;ox++)if(w.water[w.idx(x+ox,y+oy)]){clear=false;break}
        if(clear)spot={x:x+.5,y:y+.5};
      }
      if(!spot)throw new Error('No dry wildlife staging field');
      for(const a of sim.animals){if(a.id===p.id)continue;a.x=Math.min(123,spot.x+25+(a.id%4));a.y=Math.min(123,spot.y+20+(a.id%5));a.intent='idle';a.target=null;if(a.species==='needlejaw')a.playerHunt=null}
      p.x=spot.x;p.y=spot.y;p.energy=106;p.hydration=102;p.health=100;p.hidden=false;p.intent='idle';p.target=null;
      const pick=(species,n=1)=>sim.animals.filter(a=>a.alive&&!a.player&&a.species===species).slice(0,n);
      const [h1,h2]=pick('mosskip',2),[r1,r2]=pick('rootling',2),[st]=pick('needlejaw',1),[g]=pick('genvo',1);
      if(!h1||!h2||!r1||!r2||!st||!g)throw new Error('Missing fauna for wildlife staging');
      Object.assign(h1,{x:spot.x-7,y:spot.y-4,intent:'herd-listen',target:null,energy:78,hydration:82,health:100});
      Object.assign(h2,{x:spot.x-2.5,y:spot.y-5,intent:'herd-hop',target:{x:spot.x+.5,y:spot.y-5,ambient:true},energy:78,hydration:82,health:100});
      Object.assign(r1,{x:spot.x+5,y:spot.y-4,intent:'ground-probe',target:null,energy:100,hydration:96,health:100});
      Object.assign(r2,{x:spot.x+7,y:spot.y+2,intent:'root-roam',target:{x:spot.x+4.5,y:spot.y+3.5,ambient:true},energy:100,hydration:96,health:100});
      Object.assign(st,{x:spot.x-7.5,y:spot.y+4.5,intent:'scent-watch',target:null,energy:126,hydration:108,health:100,playerHunt:null,playerAversion:null});
      Object.assign(g,{x:spot.x+3,y:spot.y+5,intent:'band-social',target:null,energy:108,hydration:100,health:100});
      sim.rebuildSpatial();const tutorial=window.__GENVO8__.tutorial,renderer=window.__GENVO8__.renderer;tutorial.stage='done';tutorial.welcome.hidden=true;if(tutorial.toastEl)tutorial.toastEl.hidden=true;sim.paused=true;tutorial.update(true);renderer.motion?.clear?.();renderer.camera.x=spot.x;renderer.camera.y=spot.y;renderer.render();
      return {intents:[h1,h2,r1,r2,st,g].map(a=>({species:a.species,intent:a.intent,x:a.x,y:a.y}))};
    }""")


def stage_swimming(page):
    return page.evaluate("""()=>{
      const sim=window.__GENVO8__.sim,p=sim.player(),w=sim.world,renderer=window.__GENVO8__.renderer;
      let bank=null;const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
      for(let y=5;y<w.n-5&&!bank;y++)for(let x=5;x<w.n-5&&!bank;x++){
        if(w.water[w.idx(x,y)])continue;
        for(const [dx,dy] of dirs){if(w.water[w.idx(x+dx,y+dy)]&&w.water[w.idx(x+dx*2,y+dy*2)]&&w.water[w.idx(x+dx*3,y+dy*3)]&&w.water[w.idx(x+dx*4,y+dy*4)]){bank={x:x+.5,y:y+.5,dx,dy};break}}
      }
      if(!bank)throw new Error('No two-cell water edge available for swimming staging');
      for(const a of sim.animals){if(a.id===p.id)continue;if(Math.hypot(a.x-bank.x,a.y-bank.y)<16){a.x=Math.min(123,bank.x+24+(a.id%5));a.y=Math.min(123,bank.y+18+(a.id%6));a.intent='idle';a.target=null}}
      p.x=bank.x;p.y=bank.y;p.age=40;p.energy=112;p.hydration=104;p.health=100;p.hidden=false;p.adaptations=['water-sacs','webbed-limbs'];p.intent='idle';p.target=null;
      let entered=false;for(let i=0;i<92;i++){sim.tickCount++;sim.playerControlStep({right:bank.dx>0,left:bank.dx<0,down:bank.dy>0,up:bank.dy<0},32);if(w.water[w.idx(p.x,p.y)]){entered=true;if(i>78)break}}
      if(!entered)throw new Error('Evolved player did not enter water during staged control movement');
      sim.rebuildSpatial();const tutorial=window.__GENVO8__.tutorial;tutorial.stage='done';tutorial.welcome.hidden=true;if(tutorial.toastEl)tutorial.toastEl.hidden=true;sim.paused=false;tutorial.update(true);renderer.motion?.clear?.();renderer.camera.x=p.x;renderer.camera.y=p.y;renderer.render();
      return{entered,player:{x:p.x,y:p.y,inWater:!!w.water[w.idx(p.x,p.y)],adaptations:p.adaptations}};
    }""")


def stage_terrain_winter(page):
    return page.evaluate("""()=>{
      const sim=window.__GENVO8__.sim,p=sim.player(),renderer=window.__GENVO8__.renderer,tutorial=window.__GENVO8__.tutorial;
      sim.seasonIndex=3;sim.day=8;sim.climate={temp:.30,rain:.25};sim.paused=true;
      tutorial.stage='done';tutorial.welcome.hidden=true;if(tutorial.toastEl)tutorial.toastEl.hidden=true;tutorial.update(true);
      renderer.habitatFieldDay=-1;renderer.motion?.clear?.();renderer.camera.x=p.x;renderer.camera.y=p.y;renderer.cameraReady=true;renderer.render();
      return{season:sim.season,day:sim.day,player:{x:p.x,y:p.y}};
    }""")


def stage_behavior_tendency(page,kind:str):
    return page.evaluate("""(kind)=>{
      const sim=window.__GENVO8__.sim,p=sim.player(),spec=sim.animals.find(a=>a.id===p.id);sim.endOpeningGrace('runtime-tendency');
      let mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id);if(!mate)mate=sim.spawnAnimal('genvo',p.x+2,p.y);
      mate.age=34;mate.energy=108;mate.hydration=104;mate.health=100;
      const adults=[];for(let i=0;i<4;i++){const a=sim.spawnAnimal('genvo',p.x+2+i,p.y+1,[p,mate]);sim.lineage.registerBirth(a,[p,mate]);a.age=34+i;a.energy=108;a.hydration=104;a.health=100;a.player=false;a.lineage=true;adults.push(a)}
      sim.shelter.shelters.length=0;const sh={id:91,ownerId:p.id,x:p.x,y:p.y,integrity:100,foodStore:12,capacity:28,constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount};sim.shelter.shelters.push(sh);
      for(let d=0;d<13;d++){
        sim.tickCount+=window.__GENVO8__.CFG.dayTicks;sim.day++;
        if(kind==='forager'){
          sim.tendency.noteDirective(d%2?'scout':'forage');
          adults.forEach((a,i)=>{const ang=(i/4)*Math.PI*2;a.x=p.x+Math.cos(ang)*(9+i);a.y=p.y+Math.sin(ang)*(8+i*.7);a.intent=d%2?'family-scout':'family-forage'});
        }else{
          sim.tendency.noteDirective(d%2?'home':'gather');
          adults.forEach((a,i)=>{const ang=(i/4)*Math.PI*2;a.x=p.x+Math.cos(ang)*(1.4+i*.25);a.y=p.y+Math.sin(ang)*(1.4+i*.25);a.intent=d%2?'family-home':'family-area-gather'});
        }
        sim.tendency.advanceDay();
      }
      sim.familyDirectives.mode='auto';sim.rebuildSpatial();const tutorial=window.__GENVO8__.tutorial,renderer=window.__GENVO8__.renderer;tutorial.stage='done';tutorial.welcome.hidden=true;if(tutorial.toastEl)tutorial.toastEl.hidden=true;sim.paused=true;tutorial.update(true);renderer.motion?.clear?.();renderer.camera.x=p.x;renderer.camera.y=p.y;renderer.render();
      return {tendency:sim.tendency.snapshot(),adults:adults.map(a=>({id:a.id,x:a.x,y:a.y,intent:a.intent}))};
    }""", kind)



def stage_lineage_divergence(page,kind:str):
    return page.evaluate("""(kind)=>{
      const sim=window.__GENVO8__.sim,p=sim.player();sim.endOpeningGrace('runtime-divergence');
      let mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id&&a.sex!==p.sex)||sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id);
      if(!mate)throw new Error('No GenVo8 mate for divergence staging');
      p.age=36;p.energy=110;p.hydration=104;p.health=100;mate.age=35;mate.energy=108;mate.hydration=103;mate.health=100;mate.x=p.x+2.2;mate.y=p.y-1.6;
      sim.tendency.scores=kind==='forager'?{forager:8.2,colony:.7}:{forager:.6,colony:8.2};sim.tendency.lastSnapshot=null;sim.tendency.evaluate();
      if(kind==='colony')sim.shelter.shelters=[{id:88,ownerId:p.id,x:p.x,y:p.y,integrity:100,weatherSeal:.86,foodStore:9,capacity:28,constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount}];
      const child=sim.spawnAnimal('genvo',p.x+4.8,p.y+.4,[p,mate]);child.age=32;child.energy=98;child.hydration=103;child.health=100;sim.lineage.registerBirth(child,[p,mate]);sim.family.registerBirth(child,p,mate);
      child.learningLessons={water:2,food:2,shelter:1,danger:1};child.practiceStats={water:{attempts:1,successes:1},food:{attempts:1,successes:1},completed:2,returns:2,recoveries:0,aborts:0};
      sim.rebuildSpatial();if(!sim.lineage.handoffTo(child.id,{manual:true}))throw new Error('Divergence handoff failed');
      const tutorial=window.__GENVO8__.tutorial,renderer=window.__GENVO8__.renderer;tutorial.stage='done';tutorial.welcome.hidden=true;if(tutorial.toastEl)tutorial.toastEl.hidden=true;tutorial.update(true);
      if(tutorial.transitionDetails)tutorial.transitionDetails.open=true;
      sim.paused=true;renderer.motion?.clear?.();renderer.render();
      return{kind,form:sim.divergence.formFor(child),mechanics:sim.divergence.mechanicsText(child),handoff:sim.lineage.lastHandoff()};
    }""", kind)


def stage_generation_challenge(page,kind:str):
    stage_lineage_divergence(page,kind)
    return page.evaluate("""(kind)=>{
      const sim=window.__GENVO8__.sim,tutorial=window.__GENVO8__.tutorial,renderer=window.__GENVO8__.renderer,p=sim.player();
      const offer=sim.evolution?.offerFor?.();if(offer&&!offer.chosen&&offer.offers?.length)sim.evolution.choose(offer.offers[0].id);
      if(tutorial.transition)tutorial.transition.hidden=true;sim.evolution?.clearChosen?.();sim.lineage.succession=null;sim.paused=false;
      const trial=sim.generationProgress?.status?.(p);if(!trial)throw new Error('No staged G2 generation challenge');
      if(kind==='colony'){
        const founder=sim.animals.find(a=>a.alive&&a.lineage&&a.id!==p.id&&a.age>=32);if(!founder)throw new Error('No grown lineage relative for colony trial');
        founder.x=trial.guideTarget.x+.7;founder.y=trial.guideTarget.y+.2;p.x=trial.guideTarget.x;p.y=trial.guideTarget.y;
        if(!sim.familyDirectives.setAreaOrder('gather',{x:trial.guideTarget.x,y:trial.guideTarget.y},'runtime-generation-challenge'))throw new Error(sim.familyDirectives.lastAreaMessage||'Gather order failed');
        sim.tickCount++;sim.generationProgress.update();
      }
      sim.rebuildSpatial();sim.paused=true;tutorial.update(true);renderer.motion?.clear?.();renderer.camera.x=p.x;renderer.camera.y=p.y;renderer.render();
      return{kind,status:sim.generationProgress.status(p),unlock:sim.generationProgress.unlockSummary(),area:sim.familyDirectives.areaStatus()};
    }""", kind)


def stage_generation3(page,kind:str,phase:str='goal'):
    return page.evaluate("""({kind,phase})=>{
      const sim=window.__GENVO8__.sim,tutorial=window.__GENVO8__.tutorial,renderer=window.__GENVO8__.renderer,founder=sim.player();sim.endOpeningGrace('runtime-g3');
      let mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==founder.id&&a.sex!==founder.sex)||sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==founder.id);
      if(!mate)throw new Error('No GenVo8 mate for G3 staging');
      founder.age=38;founder.energy=112;founder.hydration=106;founder.health=100;mate.age=36;mate.energy=108;mate.hydration=103;mate.health=100;mate.x=founder.x+2.2;mate.y=founder.y-1.5;
      for(const a of sim.animals)if(a.alive&&a.species==='needlejaw'){a.x=Math.min(124,founder.x+30+(a.id%5));a.y=Math.min(124,founder.y+24+(a.id%7))}
      const setForm=(animal,generation)=>{window.__GENVO8__.setForm(animal,{kind,strength:generation===2?.62:.76,sourceGeneration:generation,bornDay:sim.day});const rec=sim.lineage.records.get(animal.id);if(rec)rec.divergence=window.__GENVO8__.formReading(animal)};
      const g2=sim.spawnAnimal('genvo',founder.x+3.2,founder.y+.4,[founder,mate]);g2.age=34;g2.energy=104;g2.hydration=103;g2.health=100;sim.lineage.registerBirth(g2,[founder,mate]);sim.family.registerBirth(g2,founder,mate);setForm(g2,2);
      if(!sim.lineage.handoffTo(g2.id,{manual:true}))throw new Error('G2 staging handoff failed');
      sim.generationProgress.active=null;sim.generationProgress.unlocks.add(kind==='forager'?'trail-scout':'kin-network');
      const extra=sim.spawnAnimal('genvo',founder.x+1.5,founder.y+2,[founder,mate]);extra.age=33;extra.energy=105;extra.hydration=102;extra.health=100;sim.lineage.registerBirth(extra,[founder,mate]);sim.family.registerBirth(extra,founder,mate);setForm(extra,2);
      const adults=[founder,g2,extra],size=sim.territory.cellSize,bcx=Math.floor(founder.x/size),bcy=Math.floor(founder.y/size),offsets=[[0,0],[1,0],[0,1],[-1,0],[1,1],[-1,1],[0,-1],[1,-1]];
      const needed=kind==='forager'?4:6;
      for(let i=0;i<needed;i++){const a=adults[i%adults.length],state=sim.territory.ensure(a),cx=Math.max(1,Math.min(Math.floor(126/size),bcx+offsets[i][0])),cy=Math.max(1,Math.min(Math.floor(126/size),bcy+offsets[i][1])),key=`${cx},${cy}`;state.cells.set(key,{key,cx,cy,x:(cx+.5)*size,y:(cy+.5)*size,visits:3.4,lastTick:sim.tickCount});state.home={x:founder.x,y:founder.y};state.radius=9;state.established=true;state.totalFamiliarity=8}
      if(kind==='colony'){
        sim.shelter.shelters=[{id:1,ownerId:founder.id,x:founder.x,y:founder.y,integrity:100,weatherSeal:.92,foodStore:9,capacity:28,kind:'primary',constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount}];sim.shelter.nextId=2;
        sim.rebuildSpatial();sim.sustainability.invalidate?.();
        const frontier=sim.expansion.frontierCells();
        for(const c of frontier.slice(0,16)){
          if(Math.hypot(c.x-founder.x,c.y-founder.y)<8||sim.world.water[sim.world.idx(c.x,c.y)])continue;
          for(let yy=Math.floor(c.y)-3;yy<=Math.floor(c.y)+3;yy++)for(let xx=Math.floor(c.x)-3;xx<=Math.floor(c.x)+3;xx++){
            if(xx<1||yy<1||xx>=127||yy>=127)continue;const i=sim.world.idx(xx,yy);if(sim.world.water[i])continue;sim.world.plants.sunmoss[i]=.92;sim.world.plants.bramble[i]=.78;sim.world.plants.thistlepod[i]=.58;
          }
        }
        sim.sustainability.invalidate?.();
      }
      const g3=sim.spawnAnimal('genvo',g2.x+2.8,g2.y+.7,[g2,mate]);g3.age=34;g3.energy=106;g3.hydration=103;g3.health=100;sim.lineage.registerBirth(g3,[g2,mate]);sim.family.registerBirth(g3,g2,mate);setForm(g3,3);
      sim.generationProgress.active=null;sim.rebuildSpatial();if(!sim.lineage.handoffTo(g3.id,{manual:true}))throw new Error('G3 staging handoff failed');
      tutorial.stage='done';tutorial.welcome.hidden=true;if(tutorial.toastEl)tutorial.toastEl.hidden=true;tutorial.update(true);
      if(phase==='handoff'){if(tutorial.transitionDetails)tutorial.transitionDetails.open=true;sim.paused=true;renderer.motion?.clear?.();renderer.camera.x=g3.x;renderer.camera.y=g3.y;renderer.render();return{kind,phase,status:sim.generationProgress.status(g3),handoff:sim.lineage.lastHandoff()}}
      const offer=sim.evolution?.offerFor?.();if(offer&&!offer.chosen&&offer.offers?.[0])sim.evolution.choose(offer.offers[0].id);if(tutorial.transition)tutorial.transition.hidden=true;sim.evolution?.clearChosen?.();sim.lineage.succession=null;sim.paused=false;
      let trial=sim.generationProgress.status(g3);if(!trial)throw new Error('No staged G3 generation challenge');
      if(kind==='forager'){
        if(trial.stage==='unlock')throw new Error('Staged G3 Forager did not unlock Scout');
        const target=trial.guideTarget||sim.generationProgress.chooseFrontierTarget(g3);if(!target)throw new Error('No G3 Forager frontier target');
        if(!sim.familyDirectives.setAreaOrder('scout',{x:target.x,y:target.y},'runtime-g3'))throw new Error(sim.familyDirectives.lastAreaMessage||'Scout order failed');
        sim.generationProgress.update();trial=sim.generationProgress.status(g3);g2.x=trial.guideTarget.x+.45;g2.y=trial.guideTarget.y+.15;g2.energy=105;g2.health=100;
        const loops=phase==='center'?(sim.generationProgress.active?.requiredTicks||40)+3:Math.max(5,Math.round((sim.generationProgress.active?.requiredTicks||40)*.28));
        for(let i=0;i<loops;i++){sim.tickCount++;sim.generationProgress.update()}
      }else{
        if(trial.stage==='unlock')throw new Error('Staged G3 Colony did not unlock satellite nesting');
        let site=sim.generationProgress.chooseNestTarget(g3);
        if(!site||!sim.shelter.canEstablishNestAt(site).ok){
          for(const c of sim.expansion.frontierCells()){
            for(let yy=Math.floor(c.y)-3;yy<=Math.floor(c.y)+3;yy++)for(let xx=Math.floor(c.x)-3;xx<=Math.floor(c.x)+3;xx++){if(xx<1||yy<1||xx>=127||yy>=127)continue;const i=sim.world.idx(xx,yy);if(sim.world.water[i])continue;sim.world.plants.sunmoss[i]=.94;sim.world.plants.bramble[i]=.8;sim.world.plants.thistlepod[i]=.6}
            sim.sustainability.invalidate?.();if(sim.shelter.canEstablishNestAt(c).ok){site=c;break}
          }
        }
        if(!site)throw new Error('No viable G3 Colony satellite site');
        if(!sim.familyDirectives.setAreaOrder('nest',{x:site.x,y:site.y},'runtime-g3'))throw new Error(sim.familyDirectives.lastAreaMessage||'Nest order failed');sim.generationProgress.update();
        for(let i=0;i<adults.length;i++){adults[i].x=site.x+(i-1)*.35;adults[i].y=site.y+.2;adults[i].energy=110;adults[i].health=100}
        const project=sim.shelter.nearestProject(site.x,site.y,3);if(!project)throw new Error('No G3 Colony nest project');
        if(phase==='center'){
          for(let i=0;i<100&&sim.shelter.activeProjects().length;i++){sim.tickCount++;sim.shelter.phaseNestProjects();sim.generationProgress.update()}
          const sh=sim.shelter.activeShelters().find(s=>s.kind==='satellite');if(!sh)throw new Error('Satellite shelter did not finish');founder.x=sh.x+.35;founder.y=sh.y;g2.x=sh.x-.35;g2.y=sh.y;
          const loops=(sim.generationProgress.active?.requiredTicks||40)+3;for(let i=0;i<loops&&sim.generationProgress.active;i++){sim.tickCount++;sim.generationProgress.update()}
        }else{
          project.progress=project.required*.56;sim.tickCount++;sim.generationProgress.update();
        }
      }
      sim.rebuildSpatial();if(phase==='center')sim.territory.showOverlay=true;sim.paused=true;tutorial.update(true);renderer.motion?.clear?.();
      const active=sim.generationProgress.status(g3),center=sim.generationProgress.centers()[0]||null,focus=center||active?.guideTarget||g3;renderer.camera.x=(g3.x+focus.x)/2;renderer.camera.y=(g3.y+focus.y)/2;renderer.render();
      return{kind,phase,status:active,centers:sim.generationProgress.centers(),unlocks:sim.generationProgress.unlockSummary(),area:sim.familyDirectives.areaStatus()};
    }""", {'kind':kind,'phase':phase})



def stage_population_center_ecology(page,pressured:bool=False):
    stage_generation3(page,'forager','center')
    return page.evaluate("""(pressured)=>{
      const sim=window.__GENVO8__.sim,renderer=window.__GENVO8__.renderer,center=sim.generationProgress.centers('range-band')[0];if(!center)throw new Error('No staged ranging-band center');
      const size=sim.territory.cellSize,cx=Math.floor(center.x/size),cy=Math.floor(center.y/size),plantKeys=Object.keys(sim.world.plants);
      for(const a of sim.animals)if(!a.lineage&&Math.hypot(a.x-center.x,a.y-center.y)<18){a.x=Math.min(123,center.x+26+(a.id%5));a.y=Math.min(123,center.y+22+(a.id%6));a.intent='idle';a.target=null}
      for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){
        const ccx=cx+ox,ccy=cy+oy;for(let y=ccy*size;y<(ccy+1)*size;y++)for(let x=ccx*size;x<(ccx+1)*size;x++){
          if(x<1||y<1||x>=127||y>=127)continue;const i=sim.world.idx(x,y);if(sim.world.water[i])continue;
          for(const kind of plantKeys){const arr=sim.world.plants[kind];if(!arr)continue;if(pressured)arr[i]=Math.min(arr[i],.008);else arr[i]=Math.max(arr[i],kind==='sunmoss'?.95:kind==='bramble'?.8:.45)}
        }
      }
      let relief=null;
      if(pressured){
        relief={cx:cx-1,cy,x:(cx-.5)*size,y:(cy+.5)*size};for(let y=relief.cy*size;y<(relief.cy+1)*size;y++)for(let x=relief.cx*size;x<(relief.cx+1)*size;x++){if(x<1||y<1||x>=127||y>=127)continue;const i=sim.world.idx(x,y);if(sim.world.water[i])continue;if(sim.world.plants.sunmoss)sim.world.plants.sunmoss[i]=.98;if(sim.world.plants.bramble)sim.world.plants.bramble[i]=.84}
        for(let i=0;i<7;i++){const species=i%2?'rootling':'mosskip',a=sim.spawnAnimal(species,center.x+(i%3)*.45,center.y+(i%2)*.5);a.age=40;a.energy=80;a.hydration=80;a.intent='feed';a.target=null}
      }
      sim.rebuildSpatial();sim.sustainability.invalidate?.();sim.populationEcology.cache.clear();sim.populationEcology.cacheSegment=-1;
      const ecology=sim.populationEcology.centerState(center,{force:true});sim.territory.showOverlay=true;sim.paused=true;renderer.motion?.clear?.();renderer.camera.x=center.x;renderer.camera.y=center.y;window.__GENVO8__.tutorial.update(true);renderer.render();
      return{pressured,center,ecology,relief,anchors:sim.expansion.adults().filter(a=>!a.player).map(a=>({id:a.id,anchor:sim.generationProgress.populationAnchor(a,'forager')}))};
    }""", pressured)


def stage_population_pressure_memory(page):
    stage_generation3(page,'forager','center')
    return page.evaluate("""()=>{
      const sim=window.__GENVO8__.sim,renderer=window.__GENVO8__.renderer,center=sim.generationProgress.centers('range-band')[0];if(!center)throw new Error('No staged ranging-band center');
      const size=sim.territory.cellSize,plantKeys=Object.keys(sim.world.plants);let home=null;
      for(let y=20;y<108&&!home;y+=4)for(let x=20;x<108&&!home;x+=4){if(Math.hypot(x-center.x,y-center.y)<38)continue;let dry=true;for(let oy=-5;oy<=5&&dry;oy++)for(let ox=-5;ox<=5;ox++)if(sim.world.water[sim.world.idx(x+ox,y+oy)]){dry=false;break}if(dry)home={x:x+.5,y:y+.5}}
      if(!home)throw new Error('No separated dry home staging point');
      const player=sim.player();sim.shelter.shelters=sim.shelter.shelters.filter(s=>s.kind==='satellite');sim.shelter.shelters.unshift({id:90,ownerId:player.id,x:home.x,y:home.y,integrity:100,weatherSeal:.92,foodStore:10,capacity:28,kind:'primary',constructedDay:1,constructedYear:1,lastUsedTick:sim.tickCount});
      const tune=(point,{food,moisture,temp})=>{const cx=Math.floor(point.x/size),cy=Math.floor(point.y/size);for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){const ccx=cx+ox,ccy=cy+oy;for(let y=ccy*size;y<(ccy+1)*size;y++)for(let x=ccx*size;x<(ccx+1)*size;x++){if(x<1||y<1||x>=127||y>=127)continue;const i=sim.world.idx(x,y);if(sim.world.water[i])continue;sim.world.moisture[i]=moisture;sim.world.temperature[i]=temp;for(const kind of plantKeys){const arr=sim.world.plants[kind];if(!arr)continue;arr[i]=food?(kind==='sunmoss'?.98:kind==='bramble'?.84:.48):.006}}}};
      tune(home,{food:true,moisture:.16,temp:.78});tune(center,{food:false,moisture:.86,temp:.38});
      for(const a of sim.animals){if(!a.alive)continue;if(!a.lineage){a.x=122-(a.id%5);a.y=118-(a.id%7);a.intent='idle';a.target=null;continue}if(a.species!=='genvo')continue;const assigned=a.age>=30?sim.generationProgress.populationAssignment(a,'forager'):null;if(assigned?.id===center.id){a.x=center.x+(a.id%3)*.45;a.y=center.y+(a.id%2)*.4}else{a.x=home.x+(a.id%3)*.38;a.y=home.y+(a.id%2)*.35}}
      const young=sim.spawnAnimal('genvo',center.x+.65,center.y+.45,[player,sim.animals.find(a=>a.alive&&a.lineage&&a.species==='genvo'&&a.id!==player.id)]);young.age=10;young.energy=92;young.hydration=92;young.health=100;window.__GENVO8__.setForm(young,{kind:'forager',strength:.72,sourceGeneration:4,bornDay:sim.day});sim.lineage.registerBirth(young,[player,sim.animals.find(a=>a.alive&&a.lineage&&a.species==='genvo'&&a.id!==player.id)]);const rec=sim.lineage.records.get(young.id);if(rec)rec.divergence=window.__GENVO8__.formReading(young);
      for(let i=0;i<7;i++){const species=i%2?'rootling':'mosskip',a=sim.spawnAnimal(species,center.x+(i%3)*.42,center.y+(i%2)*.44);a.age=42;a.energy=82;a.hydration=82;a.intent='feed';a.target=null}
      const stalker=sim.animals.find(a=>a.alive&&a.species==='needlejaw');if(stalker){stalker.x=center.x+2.1;stalker.y=center.y+1.2;stalker.intent='idle';stalker.target=null}
      sim.rebuildSpatial();sim.sustainability.invalidate?.();sim.populationEcology.cache.clear();sim.populationEcology.cacheSegment=-1;sim.populationMemory.histories.clear();sim.populationMemory.residence.clear();sim.populationMemory.lastDay=0;sim.populationMemory.noticed.clear();sim.populationMemory.notice=null;
      for(let d=0;d<6;d++){sim.populationMemory.advanceDay();sim.day++}
      const divergence=sim.populationMemory.divergence(),lines=sim.populationMemory.lines();sim.paused=true;renderer.motion?.clear?.();renderer.camera.x=center.x;renderer.camera.y=center.y;window.__GENVO8__.tutorial.update(true);renderer.render();
      return{home,center,lines,divergence:divergence.map(d=>({score:d.score,difference:d.dominantDifference,population:d.population.label})),young:sim.populationMemory.affinityFor(young)};
    }""")


def stage_population_memory_handoff(page):
    stage_population_pressure_memory(page)
    return page.evaluate("""()=>{
      const sim=window.__GENVO8__.sim,tutorial=window.__GENVO8__.tutorial,renderer=window.__GENVO8__.renderer,current=sim.player();
      const candidates=sim.animals.filter(a=>a.alive&&a.lineage&&a.species==='genvo'&&a.generation>=4&&sim.lineage.isDescendant(a.id,current.id)).sort((a,b)=>b.generation-a.generation||a.id-b.id);const heir=candidates[0];if(!heir)throw new Error('No G4 descendant with population history');
      heir.age=31;heir.energy=104;heir.hydration=101;heir.health=100;const affinity=sim.populationMemory.affinityFor(heir);if(!affinity||affinity.key==='home')throw new Error('Staged G4 did not retain secondary population upbringing');
      if(!sim.lineage.handoffTo(heir.id,{manual:true}))throw new Error('Population-memory handoff failed');tutorial.update(true);if(tutorial.transitionDetails)tutorial.transitionDetails.open=true;sim.paused=true;renderer.motion?.clear?.();renderer.camera.x=heir.x;renderer.camera.y=heir.y;renderer.render();
      return{heir:heir.id,generation:heir.generation,affinity,profile:sim.populationMemory.profile(affinity.key)};
    }""")


def stage_proto_speciation(page,handoff:bool=False):
    stage_population_pressure_memory(page)
    return page.evaluate("""(handoff)=>{
      const sim=window.__GENVO8__.sim,tutorial=window.__GENVO8__.tutorial,renderer=window.__GENVO8__.renderer,memory=sim.populationMemory,proto=sim.protoSpeciation;
      const pops=memory.populations(),home=pops.find(p=>p.primary),outer=pops.find(p=>!p.primary);if(!home||!outer)throw new Error('Proto staging needs home + secondary populations');
      const lineage=sim.animals.filter(a=>a.alive&&a.lineage&&a.species==='genvo');
      const aff=(key)=>lineage.map(a=>({a,f:memory.affinityFor(a)})).filter(x=>x.f?.key===key&&x.f.days>=3&&x.f.share>=.55).sort((x,y)=>y.f.days-x.f.days||y.a.generation-x.a.generation||x.a.id-y.a.id);
      const homePick=aff('home')[0],outerPick=aff(outer.key)[0];if(!homePick||!outerPick)throw new Error('No residence-qualified parents for proto staging');
      const outsider=sim.animals.find(a=>a.alive&&a.species==='genvo'&&!a.lineage)||sim.spawnAnimal('genvo',home.x+2,home.y+2);outsider.age=34;outsider.energy=108;outsider.hydration=104;outsider.health=100;
      const prep=(pick,pop)=>{pick.a.generation=Math.max(3,pick.a.generation||1);pick.a.age=35;pick.a.x=pop.x+.35;pick.a.y=pop.y+.2;const rec=sim.lineage.records.get(pick.a.id);if(rec)rec.generation=pick.a.generation;};prep(homePick,home);prep(outerPick,outer);
      const make=(pick,pop)=>{const child=sim.spawnAnimal('genvo',pop.x+.65,pop.y+.4,[pick.a,outsider]);child.age=31;child.energy=104;child.hydration=102;child.health=100;sim.lineage.registerBirth(child,[pick.a,outsider]);sim.family.registerBirth(child,pick.a,outsider);return child};
      const homeChild=make(homePick,home),outerChild=make(outerPick,outer),ht=proto.traitFor(homeChild),ot=proto.traitFor(outerChild);if(!ht||!ot)throw new Error(`Proto traits missing home=${ht?.id||'none'} outer=${ot?.id||'none'}`);if(ht.id===ot.id)throw new Error('Proto staging did not create distinct population traits');
      if(handoff){
        const current=sim.player(),currentAffinity=memory.affinityFor(current);let heir=null;
        if(currentAffinity?.key==='home'&&current.id===homePick.a.id)heir=homeChild;else if(currentAffinity?.key===outer.key&&current.id===outerPick.a.id)heir=outerChild;
        if(!heir){
          const currentPop=currentAffinity?.key===outer.key?outer:home;current.generation=Math.max(3,current.generation||1);const rec=sim.lineage.records.get(current.id);if(rec)rec.generation=current.generation;current.x=currentPop.x+.2;current.y=currentPop.y+.2;
          const candidate=sim.spawnAnimal('genvo',currentPop.x+.7,currentPop.y+.35,[current,outsider]);candidate.age=31;candidate.energy=104;candidate.hydration=102;candidate.health=100;sim.lineage.registerBirth(candidate,[current,outsider]);sim.family.registerBirth(candidate,current,outsider);heir=candidate;
        }
        if(!proto.traitFor(heir))throw new Error('Handoff heir did not inherit a proto trait');if(!sim.lineage.handoffTo(heir.id,{manual:true}))throw new Error('Proto-speciation handoff failed');tutorial.update(true);if(tutorial.transitionDetails)tutorial.transitionDetails.open=true;sim.paused=true;renderer.motion?.clear?.();renderer.camera.x=heir.x;renderer.camera.y=heir.y;renderer.render();return{handoff:true,heir:heir.id,trait:proto.traitFor(heir),homeTrait:ht,outerTrait:ot};
      }
      sim.paused=true;renderer.motion?.clear?.();renderer.camera.x=outer.x;renderer.camera.y=outer.y;tutorial.update(true);renderer.render();return{handoff:false,homeChildId:homeChild.id,outerChildId:outerChild.id,homeTrait:ht,outerTrait:ot,status:proto.statusLine(),lines:proto.lines()};
    }""", handoff)



def stage_proto_gene_flow(page,handoff:bool=False):
    base=stage_proto_speciation(page,False)
    return page.evaluate("""([homeId,outerId,handoff])=>{
      const sim=window.__GENVO8__.sim,tutorial=window.__GENVO8__.tutorial,renderer=window.__GENVO8__.renderer,memory=sim.populationMemory,proto=sim.protoSpeciation;
      const homeChild=sim.animals.find(a=>a.id===homeId),outerChild=sim.animals.find(a=>a.id===outerId);if(!homeChild||!outerChild)throw new Error('Missing staged proto descendants');
      const pops=memory.populations(),home=pops.find(p=>p.primary),outer=pops.find(p=>!p.primary);if(!home||!outer)throw new Error('Gene-flow staging needs two populations');
      outerChild.generation=homeChild.generation;const outerRec=sim.lineage.records.get(outerChild.id);if(outerRec)outerRec.generation=outerChild.generation;
      for(let d=0;d<3;d++){memory.noteResidence(homeChild,home);memory.noteResidence(outerChild,outer);sim.day++}
      const outsider=sim.animals.find(a=>a.alive&&a.species==='genvo'&&!a.lineage)||sim.spawnAnimal('genvo',home.x+2,home.y+2);outsider.age=38;outsider.energy=110;outsider.hydration=106;outsider.health=100;
      const make=(a,b,p)=>{const child=sim.spawnAnimal('genvo',p.x+.55,p.y+.36,[a,b]);child.age=31;child.energy=106;child.hydration=103;child.health=100;sim.lineage.registerBirth(child,[a,b]);sim.family.registerBirth(child,a,b);return child};
      const pure=make(homeChild,outsider,home),mixed=make(homeChild,outerChild,home),pt=proto.traitFor(pure),mt=proto.traitFor(mixed);if(!pt||!mt||!String(mt.inheritanceState).includes('mixed'))throw new Error('Gene-flow mix did not resolve');
      let neutral=null;for(let y=18;y<110&&!neutral;y+=5)for(let x=18;x<110&&!neutral;x+=5){if(Math.hypot(x-home.x,y-home.y)<32||Math.hypot(x-outer.x,y-outer.y)<32)continue;let dry=true;for(let oy=-3;oy<=3&&dry;oy++)for(let ox=-3;ox<=3;ox++)if(sim.world.water[sim.world.idx(x+ox,y+oy)]){dry=false;break}if(dry)neutral={x:x+.5,y:y+.5}}
      if(!neutral)throw new Error('No neutral staging site');const center=sim.generationProgress.addPopulationCenter({kind:'range-band',form:'forager',x:neutral.x,y:neutral.y,label:'New Reach',generation:mixed.generation,animalId:pure.id});
      const weak=make(pure,outsider,neutral),wt=proto.traitFor(weak);if(!wt||wt.inheritanceState!=='weakened')throw new Error(`Weakening did not resolve: ${wt?.inheritanceState||'none'}`);
      if(handoff){if(sim.player()?.id!==homeChild.id){if(!sim.lineage.handoffTo(homeChild.id,{manual:true}))throw new Error('Could not stage adapted parent handoff');}if(!sim.lineage.handoffTo(mixed.id,{manual:true}))throw new Error('Gene-flow handoff failed');tutorial.update(true);if(tutorial.transitionDetails)tutorial.transitionDetails.open=true;sim.paused=true;renderer.motion?.clear?.();renderer.camera.x=mixed.x;renderer.camera.y=mixed.y;renderer.render();return{mixed:mt,pure:pt,weakened:wt,parent:proto.traitFor(homeChild)};}
      sim.paused=true;renderer.motion?.clear?.();renderer.camera.x=home.x;renderer.camera.y=home.y;tutorial.update(true);renderer.render();return{mixed:mt,pure:pt,weakened:wt,lines:proto.lines(),center};
    }""", [base['homeChildId'],base['outerChildId'],handoff])


def stage_species_threshold(page,handoff:bool=False,rejoin:bool=False):
    base=stage_proto_speciation(page,False)
    return page.evaluate("""([outerId,handoff,rejoin])=>{
      const sim=window.__GENVO8__.sim,tutorial=window.__GENVO8__.tutorial,renderer=window.__GENVO8__.renderer,memory=sim.populationMemory,proto=sim.protoSpeciation,species=sim.speciation;
      const outerChild=sim.animals.find(a=>a.id===outerId);if(!outerChild)throw new Error('Missing outer proto descendant');
      const pops=memory.populations(),outer=pops.find(p=>!p.primary),home=pops.find(p=>p.primary);if(!outer||!home)throw new Error('Species staging needs two populations');
      const all=sim.animals.filter(a=>a.alive&&a.lineage&&a.species==='genvo'),resident=all.map(a=>({a,f:memory.affinityFor(a)})).filter(x=>x.f?.key===outer.key).sort((a,b)=>b.f.days-a.f.days||b.a.generation-a.generation)[0]?.a;
      if(!resident)throw new Error('No outer resident lineage parent');resident.generation=Math.max(3,resident.generation||1);const rr=sim.lineage.records.get(resident.id);if(rr)rr.generation=resident.generation;
      const outsider=sim.animals.find(a=>a.alive&&a.species==='genvo'&&!a.lineage)||sim.spawnAnimal('genvo',outer.x+2,outer.y+2);outsider.age=38;outsider.energy=112;outsider.hydration=108;outsider.health=100;
      const make=(a,b,g)=>{const child=sim.spawnAnimal('genvo',outer.x+.45+(g%3)*.25,outer.y+.35+(g%2)*.25,[a,b]);child.age=31;child.generation=g;child.energy=108;child.hydration=104;child.health=100;sim.lineage.registerBirth(child,[a,b]);sim.family.registerBirth(child,a,b);return child};
      const sibling=make(resident,outsider,4);const st=proto.traitFor(sibling),ot=proto.traitFor(outerChild);if(!st||!ot||st.id!==ot.id)throw new Error('Could not stage matching outer G4 proto carriers');
      outerChild.age=sibling.age=31;outerChild.x=outer.x+.2;outerChild.y=outer.y+.2;sibling.x=outer.x+.7;sibling.y=outer.y+.3;
      const reside=(animals,days)=>{for(let d=0;d<days;d++){for(const a of animals)memory.noteResidence(a,outer);memory.advanceDay();species.advanceDay();sim.day++}};
      reside([outerChild,sibling],3);
      const g5a=make(outerChild,sibling,5),g5b=make(sibling,outerChild,5);reside([outerChild,sibling,g5a,g5b],3);
      const g6a=make(g5a,g5b,6),g6b=make(g5b,g5a,6),g6c=make(g5a,g5b,6),g6d=make(g5b,g5a,6),g6e=make(g5a,g5b,6),g6f=make(g5b,g5a,6),g6g=make(g5a,g5b,6);reside([g5a,g5b,g6a,g6b,g6c,g6d,g6e,g6f,g6g],3);
      for(let d=0;d<3;d++){memory.advanceDay();species.advanceDay();sim.day++}
      let snap=species.snapshots().find(e=>e.pop.key===outer.key);if(!snap?.state?.recognized)throw new Error(`Species threshold not crossed: ${JSON.stringify(snap?.state?.lastSnapshot||null)}`);
      const heir=[g6a,g6b,g6c,g6d,g6e,g6f,g6g].find(a=>species.identityFor(a));if(!heir)throw new Error('Recognized branch not assigned to G6 descendants');
      if(rejoin){for(let i=0;i<7;i++){const mixed=make(i%2?g6a:g6b,outsider,7);mixed.x=outer.x+.6;mixed.y=outer.y+.5;memory.noteResidence(mixed,outer)}for(let d=0;d<3;d++){species.advanceDay();sim.day++}snap=species.snapshots().find(e=>e.pop.key===outer.key);if(snap?.state?.recognized)throw new Error('Renewed gene flow did not collapse young species boundary');sim.paused=true;renderer.motion?.clear?.();renderer.camera.x=outer.x;renderer.camera.y=outer.y;tutorial.update(true);renderer.render();return{rejoined:true,status:species.statusLine(),lines:species.lines(),flow:snap?.flow};}
      if(handoff){const parent=g5a;if(sim.player()?.id!==parent.id){if(!sim.lineage.handoffTo(parent.id,{manual:true}))throw new Error('Could not stage G5 parent takeover');}if(!sim.lineage.handoffTo(heir.id,{manual:true}))throw new Error('Species handoff failed');tutorial.update(true);if(tutorial.transitionDetails)tutorial.transitionDetails.open=true;sim.paused=true;renderer.motion?.clear?.();renderer.camera.x=heir.x;renderer.camera.y=heir.y;renderer.render();return{handoff:true,identity:species.identityFor(heir),snapshot:snap?.state?.lastSnapshot};}
      sim.paused=true;renderer.motion?.clear?.();renderer.camera.x=outer.x;renderer.camera.y=outer.y;tutorial.update(true);renderer.render();return{handoff:false,identity:species.identityFor(heir),status:species.statusLine(),lines:species.lines(),snapshot:snap?.state?.lastSnapshot};
    }""", [base['outerChildId'],handoff,rejoin])

def stage_species_extinct(page):
    stage_species_threshold(page,False,False)
    return page.evaluate("""()=>{
      const sim=window.__GENVO8__.sim,species=sim.speciation,tree=sim.evolutionTree,tutorial=window.__GENVO8__.tutorial,renderer=window.__GENVO8__.renderer;
      const snap=species.snapshots().find(e=>e.state?.recognized);if(!snap?.state?.branch)throw new Error('No recognized species branch to extinguish');const branch=snap.state.branch;
      const members=sim.animals.filter(a=>a.alive&&a.speciesBranch?.id===branch.id);if(!members.length)throw new Error('No living recognized branch members');
      for(const a of members){a.alive=false;a.health=0;const rec=sim.lineage.records.get(a.id);if(rec){rec.alive=false;rec.diedDay=sim.day;rec.diedYear=sim.year;rec.cause='population extinction'}}
      sim.day++;species.evaluatePopulation(snap.pop);const node=tree.node(branch.id);if(!node||node.status!=='extinct')throw new Error(`Branch did not persist as extinct: ${node?.status||'missing'}`);
      tutorial.update(true);sim.paused=true;renderer.motion?.clear?.();renderer.camera.x=snap.pop.x;renderer.camera.y=snap.pop.y;renderer.render();return{branch:branch.label,status:node.status,tree:tree.treeLines()};
    }""")



def stage_species_leadership(page,mode:str='population'):
    stage_species_threshold(page,False,False)
    return page.evaluate("""(mode)=>{
      const sim=window.__GENVO8__.sim,tutorial=window.__GENVO8__.tutorial,renderer=window.__GENVO8__.renderer,tree=sim.evolutionTree;
      const branch=sim.speciation.snapshots().find(e=>e.state?.recognized)?.state?.branch;if(!branch)throw new Error('Species leadership staging needs recognized branch');
      const current=sim.player();const heir=sim.animals.filter(a=>a.alive&&a.lineage&&tree.taxonFor(a)===branch.id&&sim.lineage.isDescendant(a.id,current.id)&&a.age>=30).sort((a,b)=>b.generation-a.generation||a.id-b.id)[0];if(!heir)throw new Error('No recognized descendant available for species leadership');
      if(!sim.lineage.handoffTo(heir.id,{manual:true}))throw new Error('Cross-branch leadership handoff failed');tutorial.update(true);
      if(mode==='handoff'){if(tutorial.transitionDetails)tutorial.transitionDetails.open=true;sim.paused=true;renderer.motion?.clear?.();renderer.camera.x=heir.x;renderer.camera.y=heir.y;renderer.render();return{mode,handoff:sim.lineage.lastHandoff(),scope:sim.familyDirectives.scopeMeta(),taxon:tree.leadershipSnapshot(heir)}}
      const offer=sim.evolution?.offerFor?.();if(offer&&!offer.chosen&&offer.offers?.[0])sim.evolution.choose(offer.offers[0].id);if(tutorial.transition&&!tutorial.transition.hidden)tutorial.continueTransition();tutorial.update(true);
      sim.familyDirectives.setScope('taxon');sim.familyDirectives.set('follow');
      if(mode==='gene-flow'){
        heir.age=Math.max(heir.age,36);heir.energy=124;heir.hydration=114;heir.health=100;heir.reproCooldown=0;heir.pregnant=null;
        const candidate=sim.spawnAnimal('genvo',heir.x+1.4,heir.y+.25);candidate.sex=heir.sex==='F'?'M':'F';candidate.age=36;candidate.energy=124;candidate.hydration=114;candidate.health=100;candidate.reproCooldown=0;candidate.pregnant=null;candidate.speciesBranch=undefined;sim.rebuildSpatial();const chosen=sim.reproduction.selectMate(candidate.id);if(!chosen)throw new Error('Cross-taxon mate not eligible for staged gene-flow proof');
      }
      sim.paused=mode!=='command';renderer.motion?.clear?.();renderer.camera.x=heir.x;renderer.camera.y=heir.y;renderer.render();return{mode,active:tree.taxonLabel(heir),scope:sim.familyDirectives.scopeMeta(),leadership:tree.leadershipSnapshot(heir),mate:sim.reproduction.selectedMate()?.id||null};
    }""", mode)


def stage_species_coexistence(page, mode:str='pressure'):
    stage_species_leadership(page,'population')
    return page.evaluate(r"""(mode)=>{
      const sim=window.__GENVO8__.sim,tutorial=window.__GENVO8__.tutorial,renderer=window.__GENVO8__.renderer,tree=sim.evolutionTree,co=sim.speciesCoexistence;
      const active=sim.player(),taxonId=tree.taxonFor(active),node=tree.node(taxonId);
      if(!node||taxonId===tree.rootId)throw new Error('Species coexistence staging needs descendant taxon leadership');
      if(sim.lineage?.successionStatus?.())sim.lineage.completeSuccession?.('runtime coexistence proof prepared');
      const origin=sim.populationMemory.populationByKey(node.originPopulationKey);if(!origin)throw new Error('Missing descendant taxon origin population');
      const branch=sim.animals.filter(a=>a.alive&&a.lineage&&tree.taxonFor(a)===taxonId);
      let root=sim.animals.filter(a=>a.alive&&a.lineage&&tree.taxonFor(a)===tree.rootId);
      while(root.length<5){const a=sim.spawnAnimal('genvo',origin.x+2+root.length*.35,origin.y+1.4);a.lineage=true;a.generation=Math.max(4,active.generation-1);a.age=34;a.energy=108;a.hydration=104;a.health=100;a.speciesBranch=undefined;a.speciesBranchHistory=[];sim.lineage.register(a,[]);root.push(a)}
      if(branch.length<3)throw new Error(`Need branch residents for coexistence proof: ${branch.length}`);
      const place=(a,x,y)=>{a.x=x;a.y=y;a.age=Math.max(31,a.age||0);a.energy=Math.max(105,a.energy||0);a.hydration=Math.max(100,a.hydration||0);a.health=Math.max(90,a.health||0);a.injury=0;};
      branch.slice(0,5).forEach((a,i)=>place(a,origin.x+((i%3)-1)*.7,origin.y+Math.floor(i/3)*.7));
      root.slice(0,5).forEach((a,i)=>place(a,origin.x+1.0+((i%3)-1)*.55,origin.y+.55+Math.floor(i/3)*.55));
      for(const a of sim.animals){if(!a.alive)continue;if((a.species==='needlejaw'||a.species==='stalker')&&Math.hypot(a.x-origin.x,a.y-origin.y)<18){a.x=origin.x+24;a.y=origin.y+24}}
      const size=sim.territory?.cellSize||6;for(let cy=-2;cy<=2;cy++)for(let cx=-2;cx<=2;cx++){const wx=Math.round(origin.x+cx*size),wy=Math.round(origin.y+cy*size);for(const patch of sim.plants||[]){if(Math.hypot(patch.x-wx,patch.y-wy)<size*.8&&Number.isFinite(patch.biomass))patch.biomass=Math.max(patch.biomass,.78)}}
      sim.rebuildSpatial();co.invalidate?.();sim.populationCenters?.invalidate?.();
      const snap=co.snapshotForTaxon(taxonId),eco=sim.populationCenters?.siteAssessment?.(origin,{taxonId})||null;
      if(!snap||snap.priority!=='separate')throw new Error(`Expected separation priority, got ${snap?.priority||'none'} cross=${snap?.competition?.pressure}`);
      if(mode==='settlement'){
        sim.generationProgress.unlocks.add('kin-network');
        const target=snap.target||co.preferredSite(taxonId,active)||{x:origin.x+size*3,y:origin.y};
        const workers=branch.slice(0,5);
        for(const w of workers){place(w,target.x,target.y); const rec=sim.lineage.records.get(w.id); if(rec)rec.alive=true;}
        // Guarantee this real branch has enough familiar ground for the existing nesting authority.
        for(const w of workers){const state=sim.territory.ensure(w);for(let oy=-2;oy<=2;oy++)for(let ox=-2;ox<=2;ox++){const wx=target.x+ox*size,wy=target.y+oy*size,cx=Math.floor(wx/size),cy=Math.floor(wy/size),k=`${cx},${cy}`;state.cells.set(k,{key:k,cx,cy,x:(cx+.5)*size,y:(cy+.5)*size,visits:9,lastTick:sim.tickCount});}sim.territory.recompute(w,state);}
        // Keep predators out of the staged construction area without altering ecology authority.
        for(const a of sim.animals){if(a.alive&&a.species!=='genvo'&&Math.hypot(a.x-target.x,a.y-target.y)<12){a.x=target.x+20;a.y=target.y+20}}
        // Keep the existing nesting rules intact: stage one first-family shelter on the same landmass,
        // far enough away that this target is genuinely a satellite settlement.
        let primary=null;for(let r=9;r<=18&&!primary;r+=2)for(let k=0;k<16&&!primary;k++){const ang=k*Math.PI/8,x=target.x+Math.cos(ang)*r,y=target.y+Math.sin(ang)*r;if(x<2||y<2||x>126||y>126||sim.world.water[sim.world.idx(x,y)])continue;if(sim.world.sameLand(x,y,target.x,target.y))primary={x,y}}
        if(!primary)throw new Error('Could not stage same-land primary shelter for settlement proof');
        sim.shelter.shelters=[{id:1,ownerId:active.id,x:primary.x,y:primary.y,integrity:100,weatherSeal:.9,foodStore:6,capacity:28,kind:'primary',constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount}];sim.shelter.nextId=2;sim.shelter.projects=[];
        for(let yy=Math.floor(target.y)-3;yy<=Math.floor(target.y)+3;yy++)for(let xx=Math.floor(target.x)-3;xx<=Math.floor(target.x)+3;xx++){const ii=sim.world.idx(xx,yy);if(sim.world.water[ii])continue;if(sim.world.plants.sunmoss)sim.world.plants.sunmoss[ii]=1;if(sim.world.plants.bramble)sim.world.plants.bramble[ii]=.85;}
        sim.rebuildSpatial();sim.sustainability?.invalidate?.();
        let result=sim.shelter.beginNestProject(target,'species-coexistence-runtime',{scope:'taxon',taxonId,taxonLabel:node.label,preference:co.settlementPreference(taxonId,target)});
        if(!result?.ok)throw new Error(`No branch settlement site: ${result?.reason||'none'}`);
        if(!result?.ok)throw new Error(`Branch settlement could not start: ${result?.reason||'unknown'}`);
        const project=sim.shelter.projects.find(p=>p.id===result.project?.id)||sim.shelter.projects[sim.shelter.projects.length-1];
        if(!project)throw new Error('Missing branch settlement project');
        for(const w of workers){w.x=project.x;w.y=project.y;w.energy=120;w.hydration=115;}
        sim.rebuildSpatial();
        for(let i=0;i<240&&!project.complete;i++)sim.shelter.phaseNestProjects?.();
        const shelter=sim.shelter.shelters.find(s=>s.taxonId===taxonId&&s.id===project.shelterId)||sim.shelter.shelters.filter(s=>s.taxonId===taxonId).at(-1);
        if(!shelter)throw new Error('Taxon-scoped shelter did not complete');
        const center=sim.generationProgress.populationCenters.find(c=>c.kind==='species-settlement'&&c.taxonId===taxonId);
        if(!center)throw new Error('Taxon settlement did not register population center');
        renderer.camera.x=shelter.x;renderer.camera.y=shelter.y;sim.territory.showOverlay=true;tutorial.update(true);sim.paused=true;renderer.motion?.clear?.();renderer.render();
        return{mode,taxon:node.label,center,shelter:{id:shelter.id,x:shelter.x,y:shelter.y},lines:co.lines()};
      }
      renderer.camera.x=origin.x;renderer.camera.y=origin.y;tutorial.update(true);sim.paused=true;renderer.motion?.clear?.();renderer.render();
      return{mode,taxon:node.label,priority:snap.priority,cross:snap.competition?.crossTaxon||0,eco,goal:co.goalFor(active),lines:co.lines()};
    }""", mode)


def stage_species_lifestyles(page):
    stage_species_leadership(page,'population')
    return page.evaluate(r"""()=>{
      const sim=window.__GENVO8__.sim,tutorial=window.__GENVO8__.tutorial,renderer=window.__GENVO8__.renderer,tree=sim.evolutionTree,life=sim.speciesLifestyle;
      const active=sim.player(),activeTaxon=tree.taxonFor(active),root=tree.root().id;
      if(activeTaxon===root)throw new Error('Lifestyle staging needs descendant taxon leadership');
      const branchState=life.ensure(activeTaxon);branchState.candidate='aquatic';branchState.streak=3;branchState.samples=3;life.establish(branchState,{top:{detail:'water travel 72% · webbed adults 100% · wet pressure 68%',score:.84}});
      const rootState=life.ensure(root);rootState.candidate='burrower';rootState.streak=3;rootState.samples=3;life.establish(rootState,{top:{detail:'shelter use 81% · den capacity 75% · colony form 67%',score:.82}});
      const rootMembers=sim.animals.filter(a=>a.alive&&a.lineage&&tree.taxonFor(a)===root),branchMembers=sim.animals.filter(a=>a.alive&&a.lineage&&tree.taxonFor(a)===activeTaxon);
      // Keep both lifestyles visible in one real scene while leaving ecology authority untouched.
      const origin=sim.populationMemory.populationByKey(tree.node(activeTaxon)?.originPopulationKey)||{x:active.x,y:active.y};
      let water=null;for(let r=1;r<=14&&!water;r++)for(let oy=-r;oy<=r&&!water;oy++)for(let ox=-r;ox<=r&&!water;ox++){const x=Math.round(origin.x+ox),y=Math.round(origin.y+oy);if(x<2||y<2||x>126||y>126)continue;if(sim.world.water[sim.world.idx(x,y)])water={x:x+.5,y:y+.5}}
      if(water){branchMembers.slice(0,4).forEach((a,i)=>{life.lifestyleFor(a);a.x=water.x+(i%2)*.45;a.y=water.y+Math.floor(i/2)*.45});}
      else branchMembers.slice(0,4).forEach((a,i)=>{life.lifestyleFor(a);a.x=origin.x+(i%2)*1.2;a.y=origin.y+Math.floor(i/2)*1.1});
      let den=sim.shelter.activeShelters().find(sh=>!sh.taxonId||sh.taxonId===root);if(!den){let dry={x:origin.x+4,y:origin.y};for(let r=3;r<=10;r++){const x=Math.round(origin.x+r),y=Math.round(origin.y);if(!sim.world.water[sim.world.idx(x,y)]){dry={x,y};break}}den={id:sim.shelter.nextId++,ownerId:rootMembers[0]?.id||active.id,x:dry.x,y:dry.y,integrity:100,weatherSeal:.9,foodStore:4,capacity:30,kind:'primary',denStyle:'burrow',constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount};sim.shelter.shelters.push(den)}else den.denStyle='burrow';
      rootMembers.slice(0,4).forEach((a,i)=>{life.lifestyleFor(a);const ang=(i/4)*Math.PI*2;a.x=den.x+Math.cos(ang)*2.0;a.y=den.y+Math.sin(ang)*1.6});
      sim.rebuildSpatial();sim.paused=true;renderer.motion?.clear?.();renderer.camera.x=water?(water.x+den.x)/2:origin.x+2;renderer.camera.y=water?(water.y+den.y)/2:origin.y;tutorial.update(true);renderer.render();
      return{active:tree.taxonLabel(active),lines:life.lines(),summary:life.summaryLine(),aquaticSpeed:life.movementMultiplier(active,{swimming:true}),aquaticCanSwim:sim.canSwim(active),water,den:{x:den.x,y:den.y,style:den.denStyle},rootLifestyle:rootMembers[0]?life.lifestyleFor(rootMembers[0]):null};
    }""")



def stage_diet_lifestyle(page,kind):
    if kind not in ('hunter','grazer'):
        raise ValueError(kind)
    return page.evaluate(r"""(kind)=>{
      const sim=window.__GENVO8__.sim,tutorial=window.__GENVO8__.tutorial,renderer=window.__GENVO8__.renderer,life=sim.speciesLifestyle,tree=sim.evolutionTree,p=sim.player(),root=tree.root().id;
      sim.lineage.highestGeneration=5;p.generation=5;p.age=44;
      const others=sim.animals.filter(a=>a.alive&&a.species==='genvo'&&a.id!==p.id).slice(0,3),members=[p,...others];
      for(const a of others){a.lineage=true;a.generation=5;a.age=42;if(!sim.lineage.records.has(a.id))sim.lineage.register(a,[p.id])}
      const state=life.ensure(root);state.candidate=kind;state.streak=3;state.samples=3;life.establish(state,{top:{detail:kind==='hunter'?'live hunts 5 · kills 3 · hunting build 75%':'plant meals 8 · plant share 100% · efficient-gut adults 75%',score:.86}});
      let spot=null;for(let y=22;y<104&&!spot;y+=4)for(let x=22;x<104&&!spot;x+=4){let dry=true;for(let oy=-5;oy<=5&&dry;oy++)for(let ox=-6;ox<=6;ox++)if(sim.world.water[sim.world.idx(x+ox,y+oy)]){dry=false;break}if(dry)spot={x:x+.5,y:y+.5}}
      if(!spot)throw new Error('No dry diet lifestyle staging field');
      for(const a of sim.animals){if(members.includes(a))continue;if(Math.hypot(a.x-spot.x,a.y-spot.y)<16){a.x=Math.min(124,spot.x+22+(a.id%5));a.y=Math.min(124,spot.y+18+(a.id%5));a.intent='idle';a.target=null}}
      members.forEach((a,i)=>{life.lifestyleFor(a);a.x=spot.x-2.8+i*1.8;a.y=spot.y+(i%2?1.2:-.8);a.energy=kind==='hunter'?76:95;a.hydration=105;a.intent='idle';a.target=null;if(kind==='hunter'){a.adaptations=[...new Set([...(a.adaptations||[]),'heavy-jaw'])]}else{a.adaptations=[...new Set([...(a.adaptations||[]),'efficient-gut'])];window.__GENVO8__.setForm(a,{kind:'forager',strength:.72,sourceGeneration:4})}});
      if(kind==='hunter'){
        const prey=sim.animals.filter(a=>a.alive&&(a.species==='mosskip'||a.species==='rootling')).slice(0,3);prey.forEach((a,i)=>{a.x=spot.x+3.2+i*.9;a.y=spot.y-1.2+i*.8;a.intent='escape';a.target={x:a.x+3,y:a.y+2}});members.slice(1).forEach((a,i)=>{a.intent='hunt';a.target=prey[i%prey.length]});
      }else{
        for(let y=Math.floor(spot.y)-5;y<=Math.floor(spot.y)+5;y++)for(let x=Math.floor(spot.x)-7;x<=Math.floor(spot.x)+7;x++){const i=sim.world.idx(x,y);if(sim.world.water[i])continue;if(sim.world.plants.bramble)sim.world.plants.bramble[i]=Math.max(sim.world.plants.bramble[i],.78);if(sim.world.plants.sunmoss)sim.world.plants.sunmoss[i]=Math.max(sim.world.plants.sunmoss[i],.72)}
        members.slice(1).forEach(a=>{const food=life.grazerFoodTarget(a,{radius:8});if(food){a.intent='feed';a.target=food}});
      }
      sim.rebuildSpatial();sim.paused=true;tutorial.stage='done';tutorial.welcome.hidden=true;if(tutorial.toastEl)tutorial.toastEl.hidden=true;tutorial.update(true);renderer.motion?.clear?.();renderer.camera.x=spot.x;renderer.camera.y=spot.y;renderer.render();
      return{kind,summary:life.summaryLine(),lines:life.lines(),members:members.map(a=>({id:a.id,lifestyle:a.ecoLifestyle?.id,intent:a.intent}))};
    }""", kind)

def stage_food_web_feedback(page,kind):
    if kind not in ('hunter','grazer'):
        raise ValueError(kind)
    return page.evaluate(r"""(kind)=>{
      const sim=window.__GENVO8__.sim,tutorial=window.__GENVO8__.tutorial,renderer=window.__GENVO8__.renderer,life=sim.speciesLifestyle,tree=sim.evolutionTree,p=sim.player(),root=tree.root().id;
      sim.lineage.highestGeneration=5;p.generation=5;p.age=44;
      const others=sim.animals.filter(a=>a.alive&&a.species==='genvo'&&a.id!==p.id).slice(0,3),members=[p,...others];
      for(const a of others){a.lineage=true;a.generation=5;a.age=42;if(!sim.lineage.records.has(a.id))sim.lineage.register(a,[p.id])}
      const state=life.ensure(root),def=kind==='hunter'?{label:'Hunter',short:'HUNTER'}:{label:'Grazer',short:'GRAZER'},lifestyle={id:kind,label:def.label,short:def.short,formedDay:sim.day,formedGeneration:5,taxonId:root,taxonLabel:'GenVo8',evidence:'runtime food-web feedback',score:1};
      state.lifestyle=lifestyle;state.loopDay=-1;state.loop=null;const node=tree.node(root);if(node)node.lifestyle={...lifestyle};life.applyToMembers(root,lifestyle);
      let spot=null;for(let y=24;y<100&&!spot;y+=4)for(let x=24;x<100&&!spot;x+=4){let dry=true;for(let oy=-15;oy<=15&&dry;oy+=2)for(let ox=-15;ox<=15;ox+=2)if(sim.world.water[sim.world.idx(x+ox,y+oy)]){dry=false;break}if(dry)spot={x:x+.5,y:y+.5}}
      if(!spot)throw new Error('No dry food-web staging field');
      for(const a of sim.animals){if(members.includes(a))continue;if(Math.hypot(a.x-spot.x,a.y-spot.y)<20){a.x=Math.min(124,spot.x+24+(a.id%6));a.y=Math.min(124,spot.y+18+(a.id%5));a.intent='idle';a.target=null}}
      members.forEach((a,i)=>{life.lifestyleFor(a);a.x=spot.x-3+i*1.4;a.y=spot.y+(i%2?1:-1);a.health=100;a.hydration=104;a.intent='idle';a.target=null});
      let detail={};
      if(kind==='hunter'){
        members.forEach(a=>{a.energy=72;a.adaptations=[...new Set([...(a.adaptations||[]),'heavy-jaw'])]});
        const prey=sim.animals.filter(a=>a.alive&&(a.species==='mosskip'||a.species==='rootling')).slice(0,5);if(prey.length<3)throw new Error('Not enough prey for Hunter staging');
        prey.forEach((a,i)=>{a.x=spot.x+2.2+(i%3)*1.25;a.y=spot.y-1.8+Math.floor(i/3)*2.3;a.health=100;a.energy=a.species==='mosskip'?88:112;a.hydration=a.species==='mosskip'?92:106;a.intent='idle';a.target=null});
        sim.rebuildSpatial();sim.social.observe({force:true});sim.phaseDecision({});
        detail={prey:prey.map(a=>({id:a.id,species:a.species,intent:a.intent,alarm:sim.social.state(a)?.alarm?.threat?.id||null})),predatorChecks:prey.map(a=>sim.isPredatorTo(p,a))};
      }else{
        members.forEach(a=>{a.energy=104;a.adaptations=[...new Set([...(a.adaptations||[]),'efficient-gut'])];window.__GENVO8__.setForm(a,{kind:'forager',strength:.72,sourceGeneration:4})});
        const w=sim.world;
        for(let y=Math.floor(spot.y)-15;y<=Math.floor(spot.y)+15;y++)for(let x=Math.floor(spot.x)-15;x<=Math.floor(spot.x)+15;x++){const i=w.idx(x,y);if(w.water[i])continue;for(const key of Object.keys(w.plants))w.plants[key][i]=Math.min(w.plants[key][i],.025)}
        for(let oy=-5;oy<=5;oy++)for(let ox=-5;ox<=5;ox++){const i=w.idx(spot.x+ox,spot.y+oy);if(w.water[i])continue;sim.history.grazing[i]=Math.max(sim.history.grazing[i],.72);if(w.plants.bramble)w.plants.bramble[i]=Math.max(w.plants.bramble[i],.16)}
        const fresh={x:spot.x+10,y:spot.y};for(let oy=-3;oy<=3;oy++)for(let ox=-3;ox<=3;ox++){const i=w.idx(fresh.x+ox,fresh.y+oy);if(w.water[i])continue;sim.history.grazing[i]=0;sim.history.recovery[i]=.24;if(w.plants.bramble)w.plants.bramble[i]=.82;if(w.plants.sunmoss)w.plants.sunmoss[i]=.82}
        members.slice(1).forEach(a=>{a.energy=124*.84;const d=life.autonomousDecision(a);if(d){a.intent=d.intent;a.target=d.target}});
        sim.rebuildSpatial();const ground=life.grazingGroundState(members[1]||p),loop=life.playStateForTaxon(root,{force:true});detail={ground,loop,intents:members.slice(1).map(a=>({id:a.id,intent:a.intent,target:a.target}))};
      }
      sim.paused=true;tutorial.stage='done';tutorial.welcome.hidden=true;if(tutorial.toastEl)tutorial.toastEl.hidden=true;tutorial.update(true);renderer.motion?.clear?.();renderer.camera.x=kind==='grazer'?spot.x+3:spot.x;renderer.camera.y=spot.y;renderer.render();
      return{kind,detail,summary:life.summaryLine(),lines:life.lines()};
    }""", kind)


def stage_save_continue(page):
    return page.evaluate("""()=>{
      const sim=__GENVO8__.sim,t=__GENVO8__.tutorial;
      sim.paused=true;t.welcome.hidden=false;t.stage='welcome';t.setResumeChoice(true);
      const c=document.querySelector('#continueGame'),n=document.querySelector('#newLineage'),b=document.querySelector('#startGame'),sk=document.querySelector('#skipTutorial'),sum=document.querySelector('#welcomeSaveSummary');
      c.hidden=false;n.hidden=false;b.hidden=true;sk.hidden=true;sum.textContent='Saved lineage · G3 · Year 2 Day 6';
      __GENVO8__.renderer.render();return{continueVisible:!c.hidden,newVisible:!n.hidden,summary:sum.textContent};
    }""")

def stage_soil_engineering(page):
    """Real completed wild digging shown over several nearby dry tiles (no painted screenshot props)."""
    return page.evaluate("""()=>{
      const {sim,renderer,tutorial,CFG}=window.__GENVO8__,p=sim.player(),w=sim.world;
      const digger=sim.animals.find(a=>a.alive&&a.species==='rootling');
      if(!p||!digger)throw new Error('Need founder and wild digging body');
      let completed=0;
      for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){
        if((dx+dy)%2!==0||completed>=24)continue;
        const x=Math.floor(p.x)+dx,y=Math.floor(p.y)+dy;
        if(x<2||y<2||x>125||y>125||w.water[w.idx(x,y)])continue;
        digger.x=x+.3;digger.y=y+.3;digger.digUntilTick=0;
        sim.tickCount+=CFG.simHz+1;
        if(sim.partAbilities.dig(digger).ok)completed++;
      }
      if(completed<5)throw new Error('Could not stage five actual dig effects');
      digger.x=Math.min(124,p.x+12);digger.y=Math.min(124,p.y+12);
      sim.rebuildSpatial();sim.paused=true;
      tutorial.stage='done';tutorial.welcome.hidden=true;if(tutorial.toastEl)tutorial.toastEl.hidden=true;
      tutorial.update(true);renderer.motion?.clear?.();renderer.camera.x=p.x;renderer.camera.y=p.y;renderer.zoom=3;renderer.render();
      return{completed,visibleSoilCells:sim.partAbilities.soilDisturbance.size,day:sim.day};
    }""")

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--root',default=str(Path(__file__).resolve().parents[1]))
    ap.add_argument('--output',required=True)
    ap.add_argument('--scenario',choices=['welcome','gameplay','wetland-niches','soil-engineering','predator','predator-hit','combat-footwork','combat-recovery','combat-pressure','den','den-read','den-abandoned','den-takeover','territory-shift','family-care','family-directive','family-expansion','family-command-mode','family-guidance','family-guidance-mark','family-nest-project','family-nest-built','family-pressure','family-water-lesson','family-learning','family-practice','handoff-transition','foraging','forage-patch','forage-season','weather-exposure','shelter-weatherproofing','family-weather','storm-aftermath','illness-recovery','family-illness','immunity-awareness','injury-recovery','wildlife','swimming','terrain-winter','help','pause','briefing','briefing-goal','action-toast','tendency-forager','tendency-colony','divergence-forager','divergence-colony','g2-forager-goal','g2-colony-goal','g3-forager-handoff','g3-forager-goal','g3-colony-goal','g3-forager-center','g3-colony-center','center-ecology-strong','center-ecology-pressured','population-memory-split','population-memory-handoff','proto-speciation-split','proto-speciation-handoff','proto-gene-flow','proto-gene-flow-handoff','species-threshold','species-threshold-handoff','species-rejoin','species-extinct','species-leadership','species-guidance','species-gene-flow','species-leadership-handoff','species-coexistence','species-coexistence-goal','species-coexistence-guide','species-settlement','species-lifestyles','hunter-lifestyle','grazer-lifestyle','hunter-food-web','grazer-rotation','save-continue'],default='gameplay')
    ap.add_argument('--style',choices=['ambusher','rusher','wary'],default='ambusher')
    ap.add_argument('--phase',choices=['stalk','windup','charge','recover'],default='windup')
    ap.add_argument('--wait-ms',type=int,default=900)
    ap.add_argument('--panel',choices=['none','guide','migration','territory','mind','shelter','population'],default='none')
    args=ap.parse_args();root=Path(args.root).resolve();output=Path(args.output).resolve();output.parent.mkdir(parents=True,exist_ok=True)
    errors=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
        page=browser.new_page(viewport={'width':1280,'height':720})
        page.on('pageerror',lambda e:errors.append('pageerror: '+str(e)))
        page.on('console',lambda m: errors.append(f'console {m.type}: {m.text}') if m.type=='error' else None)
        def handler(route):
            url=route.request.url.split('?',1)[0].split('#',1)[0]
            if not url.startswith(HOST): return route.abort()
            rel=url[len(HOST):].lstrip('/') or 'index.html';f=(root/rel).resolve()
            if root not in f.parents and f!=root:return route.fulfill(status=403,body='forbidden')
            if not f.is_file():return route.fulfill(status=404,body='not found')
            ctype=mimetypes.guess_type(str(f))[0] or 'application/octet-stream'
            if f.suffix in ('.js','.mjs'):ctype='text/javascript'
            route.fulfill(status=200,body=f.read_bytes(),content_type=ctype)
        page.route(HOST+'/**',handler)
        page.set_content(build_html(root),wait_until='domcontentloaded')
        page.wait_for_function("window.__GENVO8__ && window.__GENVO8__.sim && window.__GENVO8__.renderer",timeout=30000)
        if args.scenario not in ('welcome','save-continue'):
            page.click('#startGame');page.wait_for_timeout(120)
            if args.scenario=='briefing-goal':
                page.keyboard.press('Enter');page.wait_for_timeout(90);page.keyboard.press('Enter');page.wait_for_timeout(90)
            elif args.scenario!='briefing':
                page.keyboard.press('Enter');page.wait_for_timeout(70);page.keyboard.press('Enter');page.wait_for_timeout(70);page.keyboard.press('Enter');page.wait_for_timeout(args.wait_ms)
        if args.scenario=='wetland-niches':print('wetland_stage',stage_wetland_niches(page));page.wait_for_timeout(180)
        if args.scenario=='soil-engineering':print('soil_stage',stage_soil_engineering(page));page.wait_for_timeout(180)
        if args.scenario=='save-continue':stage_save_continue(page);page.wait_for_timeout(180)
        if args.scenario=='help':page.keyboard.press('Slash');page.wait_for_timeout(180)
        if args.scenario=='pause':page.keyboard.press('KeyP');page.wait_for_timeout(180)
        if args.scenario=='predator':stage_predator(page,args.style,args.phase);page.wait_for_timeout(100)
        if args.scenario=='predator-hit':stage_predator_hit(page,args.style);page.wait_for_timeout(80)
        if args.scenario=='combat-footwork':stage_combat_footwork(page);page.wait_for_timeout(100)
        if args.scenario=='combat-recovery':stage_combat_recovery(page);page.wait_for_timeout(100)
        if args.scenario=='combat-pressure':stage_combat_pressure(page);page.wait_for_timeout(100)
        if args.scenario=='family-care':stage_family_care(page);page.wait_for_timeout(220)
        if args.scenario=='family-directive':stage_family_directive(page);page.wait_for_timeout(220)
        if args.scenario=='family-expansion':stage_family_expansion(page);page.wait_for_timeout(220)
        if args.scenario=='family-command-mode':stage_command_mode(page);page.wait_for_timeout(180)
        if args.scenario=='family-guidance':stage_context_guidance(page);page.wait_for_timeout(180)
        if args.scenario=='family-guidance-mark':stage_context_guidance_mark(page);page.wait_for_timeout(180)
        if args.scenario=='family-nest-project':stage_family_nest(page,False);page.wait_for_timeout(180)
        if args.scenario=='family-nest-built':stage_family_nest(page,True);page.wait_for_timeout(180)
        if args.scenario=='family-pressure':stage_family_pressure(page);page.wait_for_timeout(220)
        if args.scenario=='family-water-lesson':stage_family_water_lesson(page);page.wait_for_timeout(220)
        if args.scenario=='family-learning':stage_family_learning(page);page.wait_for_timeout(220)
        if args.scenario=='family-practice':stage_family_practice(page);page.wait_for_timeout(220)
        if args.scenario=='handoff-transition':stage_handoff_transition(page);page.wait_for_timeout(220)
        if args.scenario=='foraging':stage_foraging(page);page.wait_for_timeout(220)
        if args.scenario=='forage-patch':stage_forage_patch(page);page.wait_for_timeout(220)
        if args.scenario=='forage-season':stage_forage_season(page);page.wait_for_timeout(220)
        if args.scenario=='weather-exposure':stage_weather_exposure(page);page.wait_for_timeout(220)
        if args.scenario=='shelter-weatherproofing':stage_shelter_weatherproofing(page);page.wait_for_timeout(220)
        if args.scenario=='family-weather':stage_family_weather(page);page.wait_for_timeout(220)
        if args.scenario=='storm-aftermath':stage_storm_aftermath(page);page.wait_for_timeout(220)
        if args.scenario=='illness-recovery':stage_illness_recovery(page);page.wait_for_timeout(220)
        if args.scenario=='family-illness':stage_family_illness(page);page.wait_for_timeout(220)
        if args.scenario=='immunity-awareness':stage_immunity_awareness(page);page.wait_for_timeout(220)
        if args.scenario=='injury-recovery':stage_injury_recovery(page);page.wait_for_timeout(220)
        if args.scenario=='wildlife':stage_wildlife(page);page.wait_for_timeout(220)
        if args.scenario=='swimming':stage_swimming(page);page.wait_for_timeout(260)
        if args.scenario=='terrain-winter':stage_terrain_winter(page);page.wait_for_timeout(220)
        if args.scenario=='action-toast':stage_action_toast(page);page.wait_for_timeout(160)
        if args.scenario=='tendency-forager':stage_behavior_tendency(page,'forager');page.click('#quickMenu [data-panel="population"]');page.wait_for_timeout(220)
        if args.scenario=='tendency-colony':stage_behavior_tendency(page,'colony');page.click('#quickMenu [data-panel="population"]');page.wait_for_timeout(220)
        if args.scenario=='divergence-forager':stage_lineage_divergence(page,'forager');page.wait_for_timeout(220)
        if args.scenario=='divergence-colony':stage_lineage_divergence(page,'colony');page.wait_for_timeout(220)
        if args.scenario=='g2-forager-goal':stage_generation_challenge(page,'forager');page.wait_for_timeout(220)
        if args.scenario=='g2-colony-goal':stage_generation_challenge(page,'colony');page.wait_for_timeout(220)
        if args.scenario=='g3-forager-handoff':stage_generation3(page,'forager','handoff');page.wait_for_timeout(220)
        if args.scenario=='g3-forager-goal':stage_generation3(page,'forager','goal');page.wait_for_timeout(220)
        if args.scenario=='g3-colony-goal':stage_generation3(page,'colony','goal');page.wait_for_timeout(220)
        if args.scenario=='g3-forager-center':stage_generation3(page,'forager','center');page.wait_for_timeout(220)
        if args.scenario=='g3-colony-center':stage_generation3(page,'colony','center');page.wait_for_timeout(220)
        if args.scenario=='center-ecology-strong':stage_population_center_ecology(page,False);page.wait_for_timeout(220)
        if args.scenario=='center-ecology-pressured':stage_population_center_ecology(page,True);page.wait_for_timeout(220)
        if args.scenario=='population-memory-split':stage_population_pressure_memory(page);page.click('#quickMenu [data-panel="population"]');page.wait_for_timeout(220)
        if args.scenario=='population-memory-handoff':stage_population_memory_handoff(page);page.wait_for_timeout(220)
        if args.scenario=='proto-speciation-split':stage_proto_speciation(page,False);page.click('#quickMenu [data-panel="population"]');page.wait_for_timeout(220)
        if args.scenario=='proto-speciation-handoff':stage_proto_speciation(page,True);page.wait_for_timeout(220)
        if args.scenario=='proto-gene-flow':stage_proto_gene_flow(page,False);page.click('#quickMenu [data-panel="population"]');page.wait_for_timeout(220)
        if args.scenario=='proto-gene-flow-handoff':stage_proto_gene_flow(page,True);page.wait_for_timeout(220)
        if args.scenario=='species-threshold':stage_species_threshold(page,False,False);page.click('#quickMenu [data-panel="population"]');page.wait_for_timeout(220)
        if args.scenario=='species-threshold-handoff':stage_species_threshold(page,True,False);page.wait_for_timeout(220)
        if args.scenario=='species-rejoin':stage_species_threshold(page,False,True);page.click('#quickMenu [data-panel="population"]');page.wait_for_timeout(220)
        if args.scenario=='species-extinct':stage_species_extinct(page);page.click('#quickMenu [data-panel="population"]');page.wait_for_timeout(220)
        if args.scenario=='species-leadership':stage_species_leadership(page,'population');page.click('#quickMenu [data-panel="population"]');page.wait_for_timeout(220)
        if args.scenario=='species-guidance':stage_species_leadership(page,'command');page.click('#quickMenu [data-command="leadership"]');page.wait_for_timeout(80);page.mouse.click(640,360);page.wait_for_timeout(180)
        if args.scenario=='species-gene-flow':stage_species_leadership(page,'gene-flow');page.keyboard.press('KeyM');page.wait_for_timeout(220)
        if args.scenario=='species-leadership-handoff':stage_species_leadership(page,'handoff');page.wait_for_timeout(220)
        if args.scenario=='species-coexistence':stage_species_coexistence(page,'pressure');page.click('#quickMenu [data-panel="population"]');page.wait_for_timeout(220)
        if args.scenario=='species-coexistence-goal':stage_species_coexistence(page,'pressure');page.wait_for_timeout(220)
        if args.scenario=='species-coexistence-guide':stage_species_coexistence(page,'pressure');page.click('#tutorial');page.wait_for_timeout(220)
        if args.scenario=='species-settlement':stage_species_coexistence(page,'settlement');page.click('#quickMenu [data-panel="population"]');page.wait_for_timeout(220)
        if args.scenario=='species-lifestyles':stage_species_lifestyles(page);page.click('#quickMenu [data-panel="population"]');page.wait_for_timeout(260)
        if args.scenario=='hunter-lifestyle':stage_diet_lifestyle(page,'hunter');page.click('#quickMenu [data-panel="population"]');page.wait_for_timeout(260)
        if args.scenario=='grazer-lifestyle':stage_diet_lifestyle(page,'grazer');page.click('#quickMenu [data-panel="population"]');page.wait_for_timeout(260)
        if args.scenario=='hunter-food-web':stage_food_web_feedback(page,'hunter');page.wait_for_timeout(260)
        if args.scenario=='grazer-rotation':stage_food_web_feedback(page,'grazer');page.click('#tutorial');page.wait_for_timeout(260)
        if args.scenario in ('den','den-read','den-abandoned','den-takeover','territory-shift'):
            stage_den(page);page.wait_for_timeout(80)
            if args.scenario=='den-read':
                page.evaluate("""()=>{const sim=__GENVO8__.sim,p=sim.player();const r=sim.stalkerTerritory.inspect(p);__GENVO8__.tutorial.onInteraction(r);__GENVO8__.tutorial.update(true);__GENVO8__.renderer.render();return r}""")
                page.wait_for_timeout(80)
            elif args.scenario=='den-abandoned':
                page.evaluate("""()=>{const sim=__GENVO8__.sim,p=sim.player(),site=sim.stalkerTerritory.nearbySite(p,{radius:5});if(!site)throw new Error('No staged den');const owner=sim.animals.find(a=>a.id===site.den.ownerId);sim.stalkerTerritory.inspect(p);if(owner){owner.alive=false;owner.health=0}sim.stalkerTerritory.observe();__GENVO8__.tutorial.update(true);__GENVO8__.renderer.render();return sim.stalkerTerritory.knownStatus(p,5)}""")
                page.wait_for_timeout(80)
            elif args.scenario=='den-takeover':
                page.evaluate("""()=>{const sim=__GENVO8__.sim,p=sim.player(),site=sim.stalkerTerritory.nearbySite(p,{radius:5});if(!site)throw new Error('No staged den');const old=sim.animals.find(a=>a.id===site.den.ownerId);sim.stalkerTerritory.inspect(p);const challenger=sim.animals.find(a=>a.alive&&a.species==='needlejaw'&&a.id!==old?.id);if(!challenger)throw new Error('Need second Stalker for takeover');challenger.age=Math.max(challenger.age,45);challenger.genes.body=1.18;challenger.genes.motion=1.12;challenger.energy=140;challenger.health=100;challenger.x=site.den.x+.7;challenger.y=site.den.y+.2;if(old){old.genes.body=.88;old.genes.motion=.9;old.energy=85;old.health=72}sim.stalkerTerritory.claimSite(challenger,site.den,old);challenger.x=site.den.x+6;challenger.y=site.den.y;if(old){old.x=site.den.x-5.5;old.y=site.den.y+1.2}p.x=site.den.x+1.35;p.y=site.den.y+.45;sim.rebuildSpatial();__GENVO8__.renderer.motion?.clear?.();__GENVO8__.renderer.camera.x=p.x;__GENVO8__.renderer.camera.y=p.y;__GENVO8__.tutorial.update(true);__GENVO8__.renderer.render();return {site:sim.stalkerTerritory.nearbySite(p,{radius:5}),takeover:sim.stalkerTerritory.lastTakeover}}""")
                page.wait_for_timeout(80)
            elif args.scenario=='territory-shift':
                page.evaluate("""()=>{const sim=__GENVO8__.sim,p=sim.player(),site=sim.stalkerTerritory.nearbySite(p,{radius:5});if(!site)throw new Error('No staged den');const old=sim.animals.find(a=>a.id===site.den.ownerId);sim.stalkerTerritory.inspect(p);const challenger=sim.animals.find(a=>a.alive&&a.species==='needlejaw'&&a.id!==old?.id);if(!challenger)throw new Error('Need second Stalker for territory shift');challenger.age=Math.max(challenger.age,45);challenger.genes.body=1.2;challenger.genes.motion=1.14;challenger.energy=140;challenger.health=100;if(old){old.genes.body=.87;old.genes.motion=.9;old.energy=82;old.health=70}sim.stalkerTerritory.claimSite(challenger,site.den,old);challenger.x=site.den.x+.6;challenger.y=site.den.y;if(old){old.x=site.den.x-4.5;old.y=site.den.y+2}p.x=site.den.x+6.5;p.y=site.den.y;const home=sim.territory.ensure(p);home.home={x:p.x,y:p.y};home.radius=8;home.established=true;home.totalFamiliarity=5;sim.rebuildSpatial();__GENVO8__.renderer.motion?.clear?.();__GENVO8__.renderer.camera.x=p.x;__GENVO8__.renderer.camera.y=p.y;__GENVO8__.tutorial.update(true);__GENVO8__.renderer.render();return {notice:sim.stalkerTerritory.landscapeNotice(p),landscape:sim.stalkerTerritory.familyLandscape(p),takeover:sim.stalkerTerritory.lastTakeover}}""")
                page.wait_for_timeout(80)
        if args.panel=='guide': page.click('#quickMenu [data-panel="guide"]');page.wait_for_timeout(180)
        elif args.panel=='migration': page.keyboard.press('KeyK');page.wait_for_timeout(180)
        elif args.panel=='territory': page.keyboard.press('KeyT');page.wait_for_timeout(180)
        elif args.panel=='mind': page.keyboard.press('KeyI');page.wait_for_timeout(180)
        elif args.panel=='shelter': page.keyboard.press('KeyB');page.wait_for_timeout(180)
        elif args.panel=='population': page.click('#quickMenu [data-panel="population"]');page.wait_for_timeout(180)
        page.screenshot(path=str(output),full_page=True)
        state=page.evaluate("({version:__GENVO8__.CFG.version,day:__GENVO8__.sim.day,tick:__GENVO8__.sim.tickCount,player:!!__GENVO8__.sim.player(),predator:__GENVO8__.sim.predator.playerStatus()})")
        browser.close()
    print({'output':str(output),'state':state,'errors':errors})
    if errors: raise SystemExit(2)

if __name__=='__main__':main()
