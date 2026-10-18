#!/usr/bin/env node
// Player-lineage viability under the same rules as wildlife (diagnostic; no bonuses, no edits).
// Compares AUTO with a simple "knowledgeable player" strategy driven through the real player control
// step and interactions: flee nearby hunters, drink only when properly thirsty, eat the canonical best
// food, and court a ready partner when well fed. 'refuge' also runs to the nearest known thorn brake or
// hollow log (within 16 tiles) when a hunter is near, and stays there while it is. 'defend' adds
// facing and bracing against a hunter that is winding up or charging within 5 tiles. Records survival, children, generations reached.
// Like main.js, manual strategies pass their current controls to update() (with no controls object the
// simulation's own decision rules would steer the player). Input is decided every 8 control steps and held in between (Phase 3H fix: earlier runs sent no input on
// the 7 steps in between, so the manual strategies moved an eighth of the time); fleeing sprints.
// Usage: node tools/player-strategy-experiment.mjs [days=160] [out.json]
import fs from 'node:fs';
import {Simulation} from '../src/sim/simulation.js';import {HEALING_REVIEW} from '../src/ecology/healing-review.js';if(process.env.HEALING==='1')HEALING_REVIEW.enabled=true;const {PREDATION_PARITY}=await import('../src/gameplay/predation-parity.js');if(process.env.PARITY==='0')PREDATION_PARITY.enabled=false;const {PHYSIOLOGY_PARITY}=await import('../src/ecology/physiology.js');if(process.env.PHYS==='0')PHYSIOLOGY_PARITY.enabled=false;import {CFG} from '../src/sim/config.js';import {SPECIES} from '../src/organisms/species.js';
const days=Number(process.argv[2]||160),out=process.argv[3],seeds=process.env.SEEDS?process.env.SEEDS.split(','):['STRAT-A','STRAT-B','STRAT-C','STRAT-D'];
function towards(p,t){const dx=t.x-p.x,dy=t.y-p.y;return{right:dx>.3,left:dx<-.3,down:dy>.3,up:dy<-.3}}
function run(seed,strategy){
  const sim=new Simulation(seed,{player:true});sim.endOpeningGrace?.('experiment');if(strategy==='auto')sim.setPlayerAutonomy(true);
  const S=SPECIES.genvo,ratio=Math.round(CFG.controlHz/CFG.simHz);let births=0,energySamples=[],firstChildDay=null,playerDeaths=0,lastPlayer=sim.player()?.id;
  let deathDay=null,deathCause=null,share={},drinkLog=[],hits=[],lastHp=null,trace=[],lastInput='',held=null;const mateDbg={branch:0,eligible:0,tries:0,conceived:0};const tmx=sim.tryMate.bind(sim);sim.tryMate=(a,b)=>{const isP=a.player||b.player,f=a.sex==='F'?a:b,was=!!f.pregnant;const avail=isP?sim.conceptionAvailability(a,b):null;const r=tmx(a,b);if(isP){mateDbg.tries++;const partner=a.player?b:a,me=a.player?a:b;let stage;
    if(!was&&f.pregnant){mateDbg.conceived++;stage='conceived'}else if(avail&&!avail.enabled)stage='blocked:'+avail.reasonCode;else if(a.lastCourtshipRefusal?.tick===sim.tickCount)stage='declined:'+(a.lastCourtshipRefusal.reason)+(a.lastCourtshipRefusal.otherId===partner.id?'':'');else if(me.lastReproductiveAttempt?.tick===sim.tickCount&&!me.lastReproductiveAttempt.conceived)stage='accepted-no-conception';else stage='other';
    const decliner=stage.startsWith('declined:first')?(a.player?'player':'partner'):stage.startsWith('declined:second')?(b.player?'player':'partner'):null;(mateDbg.attempts??=[]).push({day:sim.day,stage,decliner,partner:partner.species+'#'+partner.id,partnerLineage:!!partner.lineage,chance:avail?.compatibility?+avail.compatibility.conceptionChance.toFixed(3):null,gamete:avail?.compatibility?+avail.compatibility.gameteMatch.toFixed(3):null,fertility:avail?.compatibility?[+avail.compatibility.fertilityA.toFixed(3),+avail.compatibility.fertilityB.toFixed(3)]:null})}return r};const kl=sim.kill.bind(sim);sim.kill=(a,c)=>{if(a.alive&&a.player)deathDay??=sim.day;deathCause=c+' day '+sim.day+' W'+(a.hydration/S.maxHydration).toFixed(2)+' E'+(a.energy/S.maxEnergy).toFixed(2);return kl(a,c)};const sb=sim.spawnFundedOffspring.bind(sim);sim.spawnFundedOffspring=(m,...r)=>{const k=sb(m,...r);if(m.lineage||m.player||k.some(c=>c.lineage)){births+=k.length;if(firstChildDay==null)firstChildDay=sim.day}return k};
  for(let d=0;d<days;d++){
    const d0=sim.day;let step=0;
    while(sim.day===d0){
      const p=sim.player();if(!p)break;if(p.id!==lastPlayer){playerDeaths++;lastPlayer=p.id}
      let input=step%8===0?null:held;if(process.env.TRACE&&step%8===0){const preds=sim.animals.filter(a=>a.alive&&sim.isPredatorTo?.(a,p)).map(a=>({a,d:Math.hypot(a.x-p.x,a.y-p.y)})).sort((x,y)=>x.d-y.d);const q=preds[0];trace.push(`d${sim.day} t${sim.tickCount} hp${Math.round(p.health)} E${(p.energy/S.maxEnergy).toFixed(2)} pi:${p.intent} hid:${!!p.hidden} refuge:${!!sim.discovery?.refugeFor?.(p)} pred:${q?q.a.species+'#'+q.a.id+' d'+q.d.toFixed(1)+' '+q.a.intent+(q.a.playerHunt?' HUNT':''):'-'} ${lastInput}`);if(trace.length>40)trace.shift();if(lastHp!=null&&p.health<lastHp-.5)hits.push(`HIT d${sim.day} t${sim.tickCount} ${lastHp.toFixed(0)}->${p.health.toFixed(0)} E${(p.energy/S.maxEnergy).toFixed(2)} W${(p.hydration/S.maxHydration).toFixed(2)} by ${q?q.a.species+' '+q.a.intent+' d'+q.d.toFixed(1):'-'} input:${lastInput}`);lastHp=p.health}
      if(strategy!=='auto'&&step%8===0){
        const e=p.energy/S.maxEnergy,h=p.hydration/S.maxHydration;
        const threat=sim.animals.find(a=>a.alive&&sim.isPredatorTo?.(a,p)&&Math.hypot(a.x-p.x,a.y-p.y)<6);
        const near=sim.animals.find(a=>a.alive&&sim.isPredatorTo?.(a,p)&&Math.hypot(a.x-p.x,a.y-p.y)<9);
        const attacker=strategy==='defend'?sim.animals.find(a=>a.alive&&a.playerHunt&&['hunt-windup','charge-player'].includes(a.intent)&&Math.hypot(a.x-p.x,a.y-p.y)<5):null;
        const refuge=(strategy==='refuge'||strategy==='defend')&&near?(sim.discovery?.sites||[]).filter(s=>!s.gone&&(s.kind==='thorn-brake'||s.kind==='hollow-log')&&Math.hypot(s.x-p.x,s.y-p.y)<16).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0]:null;
        const br=k=>{share[k]=(share[k]||0)+1};br(attacker?'brace':near&&!p.hidden?'threatNear':threat?'flee':h<.4?'drink':e<.85?'eat':'other');
        if(attacker)input={...towards(p,attacker),brace:true};/* face the charge and brace */
        else if(near&&!p.hidden&&sim.playerHide?.().ok){/* hidden in cover or a den */}
        else if(refuge&&!sim.discovery.refugeFor(p)&&!(p.hidden&&sim.discovery.logAt(p)))input={...towards(p,refuge),sprint:true};
        else if(refuge){/* in a refuge: stay */}
        else if(threat)input={right:threat.x<p.x,left:threat.x>p.x,down:threat.y<p.y,up:threat.y>p.y,sprint:true};
        else if(p.hidden&&!near)sim.playerHide?.();
        else if(h<.4){const spot=(sim.world.drinkSpots||[]).filter(s=>sim.world.sameLand(p.x,p.y,s.x,s.y)).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];if(spot){if(sim.world.isDrinkable(p.x,p.y)){const dr=sim.playerInteract(null,'drink');if(dr?.ok===false&&process.env.TRACE)drinkLog.push('why: '+sim.resourceAction('drink',null).reason+' drinkable:'+sim.world.isDrinkable(p.x,p.y)+' water:'+sim.world.water[sim.world.idx(p.x,p.y)]);if(process.env.TRACE)drinkLog.push(`d${sim.day} W${h.toFixed(2)} drink ${dr?.ok} ${dr?.message||dr?.type||''}`)}else{input=towards(p,spot);if(process.env.TRACE&&step%64===0)drinkLog.push(`d${sim.day} W${h.toFixed(2)} walking d${Math.hypot(spot.x-p.x,spot.y-p.y).toFixed(1)}`)}}else if(process.env.TRACE)drinkLog.push(`d${sim.day} W${h.toFixed(2)} no spot`)}
        else if(p.intent==='mate'&&sim.reproduction.courtTarget?.()){/* courtship under way: let the game's own approach and display run */}
        else if(e>.8&&!p.pregnant&&(p.reproCooldown||0)<=0){const mate=sim.reproduction.eligibleMates()[0];mateDbg.branch++;if(mate)mateDbg.eligible++;if(mate){sim.reproduction.selectedMateId=mate.id;const okC=sim.reproduction.courtSelected({targetId:mate.id});if(!okC){const why=sim.reproduction.courtshipAvailability({targetId:mate.id}).reason||'?';mateDbg.refusals??={};mateDbg.refusals[why]=(mateDbg.refusals[why]||0)+1}else mateDbg.started=(mateDbg.started||0)+1}}
        else if(e<.85){const f=sim.bestFood(p);if(f){if(Math.hypot(f.x-p.x,f.y-p.y)<1.1){const r=sim.playerInteract();if(r?.type==='interaction-choice'){const eat=r.choices.find(c=>/^eat:/.test(c.id));if(eat)sim.playerInteract(null,eat.id)}}else input=towards(p,f)}}
      }
      if(strategy!=='auto'){if(step%8===0){held=input;lastInput=input?Object.keys(input).filter(k=>input[k]).join('+'):'none'}sim.playerControlStep(input,CFG.controlHz)}
      if(strategy==='auto'||step%ratio===ratio-1)(strategy==='auto'?sim.update(null):sim.update(held||{},{externalPlayerControl:true}));step++;
    }
    const p=sim.player();if(!p)break;energySamples.push(p.energy/S.maxEnergy);
  }
  if(process.env.TRACE)console.error(hits.join(String.fromCharCode(10)));if(process.env.TRACE)console.error(drinkLog.slice(-25).join(String.fromCharCode(10)));if(process.env.TRACE&&deathCause)console.error(seed,strategy,deathCause+String.fromCharCode(10)+trace.join(String.fromCharCode(10)));
  const p=sim.player();energySamples.sort((a,b)=>a-b);
  const tot=Object.values(share).reduce((a,b)=>a+b,0)||1;return{physiology:PHYSIOLOGY_PARITY.enabled?'shared':'old',firstDeathDay:deathDay,share:Object.fromEntries(Object.entries(share).map(([k,v])=>[k,+(v/tot).toFixed(3)])),mate:mateDbg,deathCause,seed,strategy,survivedDays:p?days:sim.day,playerAlive:!!p,playerSuccessions:playerDeaths,lineageBirths:births,firstChildDay,highestGeneration:sim.lineage?.highestGeneration||1,energyMedian:energySamples.length?+energySamples[energySamples.length>>1].toFixed(2):null};
}
const only=process.argv[4];const rows=[];for(const seed of seeds)for(const strategy of only?[only]:['auto','forager','refuge','defend']){const r=run(seed,strategy);rows.push(r);console.log(JSON.stringify(r))}
if(out)fs.writeFileSync(out,JSON.stringify({schema:'genvo.player-strategy/1',days,rows},null,1));
