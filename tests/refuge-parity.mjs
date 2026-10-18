import assert from 'node:assert/strict';
import {RESOURCE_FOUNDING} from '../src/ecology/resource-founding.js';RESOURCE_FOUNDING.enabled=false;// per-species rule checks need every configured species present (founding itself: tests/seed-shore-niches.mjs)
import {Simulation} from '../src/sim/simulation.js';
import {founderPlan} from '../src/lineage/body-inheritance.js';
import {makePlan} from '../src/lineage/body-plan.js';
import {SPECIES} from '../src/organisms/species.js';
import {REFUGE_PARITY,refugeAgainst,coverHides,fitsLog,LOG_INTERIOR_MASS} from '../src/ecology/refuges.js';

// Phase 3I: physical refuges and cover protect any anatomically eligible organism, player or wild.
assert.equal(REFUGE_PARITY.enabled,true);
const sim=new Simulation('REFUGE-PARITY',{player:true});sim.endOpeningGrace?.('test');sim.update(null);
const p=sim.player(),wild=sim.animals.find(a=>a.alive&&!a.player&&!a.lineage&&a.species==='genvo'&&a.age>=SPECIES.genvo.maturity);
const stalker=sim.animals.find(a=>a.alive&&a.species==='needlejaw'&&a.age>=SPECIES.needlejaw.maturity),bankjaw=sim.animals.find(a=>a.alive&&a.species==='bankjaw');assert.ok(p&&wild&&stalker&&bankjaw);
const log=sim.discovery.sites.find(s=>s.kind==='hollow-log'),brake=sim.discovery.sites.find(s=>s.kind==='thorn-brake');assert.ok(log&&brake,'world has logs and thorn brakes');
// Staged anatomy establishes both sides of the unchanged aperture.
bankjaw.bodyPlan=makePlan(founderPlan().nodes.map(n=>({...n,partId:n.socket==='mouth'?'tearing-jaw':n.partId})));bankjaw.age=SPECIES.bankjaw.maturity;
stalker.age=SPECIES.needlejaw.maturity;
assert.ok(fitsLog(p)&&fitsLog(wild)&&!fitsLog(stalker)&&fitsLog(bankjaw),`log fits bodies up to ${LOG_INTERIOR_MASS}: GenVo and bankjaw fit, a Stalker does not`);

// Hollow log: sheltering inside protects from a hunter too large to follow, never from one that fits.
for(const prey of [p,wild]){Object.assign(prey,{x:log.x,y:log.y,hidden:false,refugeSiteId:null});
  assert.equal(refugeAgainst(sim,prey,stalker),null,'standing by a log is not sheltering in it');
  if(prey.player)prey.hidden=true;else prey.refugeSiteId=log.id;
  assert.equal(refugeAgainst(sim,prey,stalker),'log',`${prey.player?'player':'wild'} in a log is out of a Stalker's reach`);
  assert.equal(refugeAgainst(sim,prey,bankjaw),null,'a bankjaw fits and can follow');
  Object.assign(stalker,{x:log.x+.4,y:log.y});const h0=prey.health;assert.equal(sim.tryKill(stalker,prey),false);assert.equal(prey.health,h0,'no bite reaches the sheltered prey');
  prey.hidden=false;prey.refugeSiteId=null;prey.x+=30;
}
// Thorn brake: unarmoured hunters cannot follow; an armoured one can.
for(const prey of [p,wild]){Object.assign(prey,{x:brake.x,y:brake.y});
  assert.equal(refugeAgainst(sim,prey,stalker),'thorn-brake');
  const saved=stalker.adaptations;stalker.adaptations=['hardened-mantle'];assert.equal(refugeAgainst(sim,prey,stalker),null,'armour passes thorns');stalker.adaptations=saved;prey.x+=30;
}
// Cover: identical rule for player and wild twin; a larger body needs denser cover.
const i=sim.world.idx(p.x,p.y);
Object.assign(wild,{x:p.x,y:p.y,genes:structuredClone(p.genes),bodyPlan:structuredClone(p.bodyPlan),age:p.age,movedTick:sim.tickCount-100});p.movedTick=sim.tickCount-100;
for(const c of [.1,.25,.4,.8])for(const d of [2,4,6,8]){
  for(const k of Object.keys(sim.world.plants))sim.world.plants[k][i]=0;sim.world.plants.bramble[i]=c/.82;
  assert.equal(coverHides(sim,p,stalker,d),coverHides(sim,wild,stalker,d),`same cover rule at cover ${c}, distance ${d}`);
}
sim.world.plants.bramble[i]=.36/.82+.01;const small=sim.animals.find(a=>a.alive&&a.species==='rillsifter'),big={...wild,species:'podshell'};
Object.assign(small,{x:p.x,y:p.y,intent:'idle'});
assert.ok(coverHides(sim,wild,stalker,6),'GenVo-size body hidden by threshold cover at range');
p.noisyUntilTick=sim.tickCount+5;assert.equal(coverHides(sim,p,stalker,6),false,'a noisy animal is not hidden');p.noisyUntilTick=0;

// Wildlife recognise a refuge: a threatened wild GenVo near a log heads for it.
const w2=wild;Object.assign(w2,{x:log.x+2,y:log.y,energy:SPECIES.genvo.maxEnergy*.9,hydration:SPECIES.genvo.maxHydration*.9,health:100,intent:'explore',target:null,refugeSiteId:null});
let threatSpot=null;for(const [dx,dy] of [[4,0],[-4,0],[0,4],[0,-4],[3,3],[-3,-3]]){const x=w2.x+dx,y=w2.y+dy;if(sim.world.isPlayable(x,y)&&!sim.world.water[sim.world.idx(x,y)]&&sim.world.sameLand(w2.x,w2.y,x,y)){threatSpot={x,y};break}}
assert.ok(threatSpot);Object.assign(stalker,{...threatSpot,energy:SPECIES.needlejaw.maxEnergy*.5,intent:'hunt',target:w2,dir:(Math.round(Math.atan2(w2.y-threatSpot.y,w2.x-threatSpot.x)/(Math.PI/4))+2+8)%8});// hunting and facing it (threat appraisal)
sim.animals=sim.animals.filter(a=>a===p||a===w2||a===stalker);p.x=w2.x+40;sim.rebuildSpatial();
const old=sim.carrying.shouldRefreshDecision;sim.carrying.shouldRefreshDecision=a=>a===w2;sim.phaseDecision({});sim.carrying.shouldRefreshDecision=old;
assert.equal(w2.intent,'refuge',`a threatened wild GenVo seeks the nearby log (got ${w2.intent})`);assert.equal(w2.target.siteId,log.id);
console.log('refuge parity: logs, thorn brakes, cover and wildlife refuge seeking: PASS');
