import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {PREDATION_PARITY} from '../src/gameplay/predation-parity.js';

// Predation parity (integrated Phase 3I). Choice: the Stalker encounter starts only under the wildlife
// hunger rule and only when the player is the hunter's best prey. Execution: the same bite resolution
// for the player and an otherwise identical wild organism.
assert.equal(PREDATION_PARITY.enabled,true,'parity is the default');
function encounterStarts(enabled,energyFraction){
  PREDATION_PARITY.enabled=enabled;const sim=new Simulation('PREDATION-PARITY',{player:true});sim.endOpeningGrace?.('test');
  const p=sim.player(),h=sim.animals.find(a=>a.alive&&a.species==='needlejaw');assert.ok(p&&h);
  sim.animals=[p,h];Object.assign(h,{x:p.x+4,y:p.y,energy:SPECIES.needlejaw.maxEnergy*energyFraction,hydration:SPECIES.needlejaw.maxHydration*.9,health:100,playerHunt:null,playerAversion:null,intent:'explore',target:null});
  if(!sim.canOccupy(h,h.x,h.y)){h.x=p.x;h.y=p.y+4}sim.rebuildSpatial();sim.phaseDecision({});return !!h.playerHunt;
}
assert.equal(encounterStarts(false,.85),true,'old rule: a hunter at 85% energy begins a player encounter');
assert.equal(encounterStarts(true,.85),false,'parity: a hunter at 85% energy is not hungry enough to hunt any prey');
assert.equal(encounterStarts(true,.5),true,'parity: a hungry hunter whose best prey is the player begins the encounter');

// Execution: same hunter, same random state, same place, same body: player vs wild twin.
function bites(enabled){
  PREDATION_PARITY.enabled=enabled;const sim=new Simulation('PREDATION-PARITY-BITE',{player:true});sim.endOpeningGrace?.('test');sim.phaseClimate();
  const p=sim.player(),h=sim.animals.find(a=>a.alive&&a.species==='needlejaw'),twin=sim.animals.find(a=>a.alive&&!a.player&&!a.lineage&&a.species==='genvo');assert.ok(p&&h&&twin);
  Object.assign(twin,{genes:structuredClone(p.genes),bodyPlan:structuredClone(p.bodyPlan),adaptations:structuredClone(p.adaptations||[]),age:p.age,dir:p.dir,sex:p.sex});
  const spot={x:p.x,y:p.y},away={x:p.x+40,y:p.y+40},out=[];
  for(let k=0;k<12;k++){const state=sim.rng.state;
    for(const prey of [p,twin]){sim.rng.state=state;const other=prey===p?twin:p;Object.assign(other,away);Object.assign(prey,spot,{health:100,bracing:false,hidden:false});Object.assign(h,{x:spot.x+.4,y:spot.y,energy:SPECIES.needlejaw.maxEnergy*.5,alive:true});sim.rebuildSpatial();
      const hit=sim.tryKill(h,prey);out.push({who:prey===p?'player':'wild',k,hit,damage:+(100-prey.health).toFixed(6)});prey.alive=true}
  }
  return out;
}
const on=bites(true);let hits=0;
for(let k=0;k<12;k++){const a=on.find(x=>x.who==='player'&&x.k===k),b=on.find(x=>x.who==='wild'&&x.k===k);assert.equal(a.hit,b.hit,`attempt ${k}: same outcome`);assert.equal(a.damage,b.damage,`attempt ${k}: same damage`);hits+=a.hit}
assert.ok(hits>0&&hits<12,'bites both land and miss');
const off=bites(false);assert.ok(off.some((x,i)=>x.who==='player'&&off.find(y=>y.who==='wild'&&y.k===x.k).damage!==x.damage),'old rules treated the player differently');
PREDATION_PARITY.enabled=true;console.log(`predation parity: choice gate and identical bite resolution (${hits}/12 hits): PASS`);
