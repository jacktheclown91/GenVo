import {makePlan,validatePlan} from '../src/lineage/body-plan.js';
import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';
import {BODY_ABILITIES,bodyAbility,anatomyFromAdaptations,expressedAdaptations,nearThreshold} from '../src/lineage/evolution.js';
import {inheritLineageAnatomy,emergentAdaptation} from '../src/lineage/heredity.js';

// v1.33.1 Pounce: the first body ability, read from anatomy (highly developed rear-leg tendons)
// and built on the existing attack wind-up, recovery and breath. Player-controlled only.

const P=CFG.pounce,DT=1/64;
function setup(seed,spring){
  const sim=new Simulation(seed,{player:true}),a=sim.player(),w=sim.world;
  a.bodyPlan=makePlan(a.bodyPlan.nodes.map(n=>n.socket==='mouth'?{...n,partId:'tearing-jaw'}:n));assert.ok(validatePlan(a.bodyPlan).ok,'hunting fixture requires an actual predatory mouth');
  a.adaptations=['spring-tendons'];a.anatomy=anatomyFromAdaptations(a.adaptations);a.anatomy.spring=spring;a.exertion=CFG.exertion.max;a.exertionWinded=false;
  // Open dry ground with room to the east.
  for(let i=0;i<w.len;i++){const x=i%w.n,y=Math.floor(i/w.n);if(x<10||x>w.n-12||y<10||y>w.n-10)continue;let ok=true;for(let dx=-1;dx<=6&&ok;dx++)for(let dy=-1;dy<=1&&ok;dy++)if(w.water[w.idx(x+dx,y+dy)])ok=false;if(ok){a.x=x+.5;a.y=y+.5;break}}
  a.dir=2;// facing east
  for(const o of sim.animals)if(o!==a&&o.alive&&Math.hypot(o.x-a.x,o.y-a.y)<9){o.x=Math.min(w.n-3,o.x+25)}
  return{sim,a};
}
function placePrey(sim,a,dx,dy,species='mosskip'){const prey=sim.animals.find(o=>o.alive&&o.species===species)||sim.spawnAnimal(species,a.x+dx,a.y+dy);prey.x=a.x+dx;prey.y=a.y+dy;prey.genes.motion=1;return prey}
function run(sim,a,seconds){for(let t=0;t<seconds;t+=DT)sim.playerCombat.step(a,null,DT)}

// The ability comes from the body, past the Spring Tendons level, not from an adaptation.
assert.equal(BODY_ABILITIES.pounce.axis,'spring');assert.ok(!expressedAdaptations({spring:1}).includes('pounce'),'Pounce is not an adaptation');
{
  const {sim,a}=setup('GENVO8-POUNCE-NONE',.7);assert.equal(bodyAbility(a,'pounce'),0);
  placePrey(sim,a,2.6,0);const r=sim.playerCombat.startAttack({pounce:true});
  assert.equal(r.type,'attack-start','without the body for it, Shift+Space is the ordinary bite');assert.ok(!a.attackAction.pounce);
}

// A pounce: still crouch, leap that closes the gap, bite on landing, longer recovery, breath spent.
{
  const {sim,a}=setup('GENVO8-POUNCE-PREY',.9),prey=placePrey(sim,a,2.7,.1);
  assert.ok(Math.abs(sim.playerCombat.pounceReach(a)-3.0)<1e-9,'reach grows with the rear-leg tendons');
  assert.match(sim.interactionHint(),/Shift\+Space · Pounce Hopper/);
  const startX=a.x,breath=a.exertion;sim.tryKill=(pred,target,opts)=>{sim.lastKillOpts=opts;return true};
  const r=sim.playerCombat.startAttack({pounce:true});assert.equal(r.type,'pounce-start');assert.equal(a.attackAction.phase,'windup');
  assert.equal(a.exertion,breath-P.cost,'a pounce costs breath, about twice a bite');assert.ok(P.cost>=CFG.exertion.attackCost*1.8);
  assert.equal(sim.playerCombat.movementModifiers(a,{right:true}).scale,0,'the crouch holds still');
  run(sim,a,P.windup+DT);assert.equal(a.attackAction.phase,'leap');
  run(sim,a,P.leap+DT*2);
  assert.ok(a.x-startX>1.5,'the leap closes the gap');assert.ok(Math.hypot(prey.x-a.x,prey.y-a.y)<=CFG.attack.preyReach,'and lands within biting reach');
  const res=sim.playerCombat.consumeResult();assert.equal(res.type,'pounce');assert.equal(res.ok,true);assert.match(res.message,/Pounced on a Hopper/);
  assert.equal(sim.lastKillOpts.chanceBonus,P.preyBonus,'a pounce lands with a better chance than a plain bite');
  assert.equal(a.attackAction.phase,'recover');assert.ok(a.attackAction.until-a.attackAction.startedAt>=CFG.attack.recovery,'recovery is longer than a bite');
}

// A miss leaves the creature exposed for longer.
{
  const {sim,a}=setup('GENVO8-POUNCE-MISS',.9),prey=placePrey(sim,a,2.7,0);sim.tryKill=()=>false;
  sim.playerCombat.startAttack({pounce:true});run(sim,a,P.windup+P.leap+DT*3);
  assert.equal(sim.playerCombat.consumeResult().ok,false);assert.ok(Math.abs((a.attackAction.until-a.attackAction.startedAt)-P.missRecovery)<1e-9,'a missed pounce has the longest recovery');
}

// Only toward a creature in front of it, and not while winded.
{
  const {sim,a}=setup('GENVO8-POUNCE-BEHIND',.9);placePrey(sim,a,-2.7,0);
  assert.equal(sim.playerCombat.startAttack({pounce:true}).type,'attack-start','nothing in front: an ordinary bite');
  a.attackAction=null;const t2=setup('GENVO8-POUNCE-WINDED',.9);placePrey(t2.sim,t2.a,2.7,0);t2.a.exertion=P.cost-1;
  assert.equal(t2.sim.playerCombat.startAttack({pounce:true}).type,'attack-start','without the breath, an ordinary bite');
  const t3=setup('GENVO8-POUNCE-NOSHIFT',.9);placePrey(t3.sim,t3.a,2.7,0);
  assert.equal(t3.sim.playerCombat.startAttack().type,'attack-start','Space alone is still the bite');
}

// Against a Stalker it lands as a harder opening bite.
{
  const {sim,a}=setup('GENVO8-POUNCE-STALKER',.95);const stalker=sim.animals.find(o=>o.alive&&SPECIES[o.species]?.hunter)||sim.spawnAnimal('stalker',a.x+3,a.y);
  stalker.x=a.x+3;stalker.y=a.y;let scale=null;sim.playerStrike=(t,o)=>{scale=o.damageScale;return{ok:true,type:'fight',message:''}};
  sim.playerCombat.startAttack({pounce:true});run(sim,a,P.windup+P.leap+DT*3);
  assert.equal(scale,P.stalkerDamage,'the landing bite on a Stalker is stronger than a plain bite');assert.match(sim.playerCombat.consumeResult().message,/Pounced on the Stalker/);
}

// A leap never ends in water: it lands at the edge.
{
  const sim=new Simulation('GENVO8-POUNCE-WATER',{player:true}),a=sim.player(),w=sim.world;a.bodyPlan=makePlan(a.bodyPlan.nodes.map(n=>n.socket==='mouth'?{...n,partId:'tearing-jaw'}:n));assert.ok(validatePlan(a.bodyPlan).ok,'hunting fixture requires an actual predatory mouth');
  a.adaptations=['spring-tendons'];a.anatomy=anatomyFromAdaptations(a.adaptations);a.anatomy.spring=1;a.exertion=100;
  let spot=null;for(let i=0;i<w.len&&!spot;i++){const x=i%w.n,y=Math.floor(i/w.n);if(x<5||x>w.n-8||w.water[i])continue;if(!w.water[w.idx(x+1,y)]&&w.water[w.idx(x+2,y)]&&w.water[w.idx(x+3,y)])spot={x:x+.5,y:y+.5}}
  assert.ok(spot);a.x=spot.x;a.y=spot.y;a.dir=2;const prey=placePrey(sim,a,3.2,0);
  sim.playerCombat.startAttack({pounce:true});run(sim,a,P.windup+P.leap+DT*3);
  assert.equal(w.water[w.idx(a.x,a.y)],0,'the pounce stops at the bank');
}

// Lineages living under predator pressure grow toward Pounce over generations; heirs show it coming.
{
  const sim=new Simulation('GENVO8-POUNCE-DRIFT',{player:true});sim.pressure.lifetimeSummary=()=>[{kind:'predation',score:30}];sim.rng.chance=()=>false;
  let parents=[{adaptations:['spring-tendons'],anatomy:anatomyFromAdaptations(['spring-tendons'])},{adaptations:['spring-tendons'],anatomy:anatomyFromAdaptations(['spring-tendons'])}],gen=0,seenNear=false;
  for(let g=1;g<=10;g++){const child={species:'genvo',adaptations:[],anatomy:inheritLineageAnatomy(sim.rng,parents,g)};child.adaptations=expressedAdaptations(child.anatomy);emergentAdaptation(sim,child,parents);if(nearThreshold(child).some(n=>n.name==='Pounce'))seenNear=true;if(bodyAbility(child,'pounce')){gen=g;break}parents=[child,{...child,anatomy:{...child.anatomy}}]}
  assert.ok(gen>=2,`Pounce developed over ${gen} generations, not at once`);assert.ok(seenNear,'successor cards can show a body close to Pounce');
}
console.log('pounce ok');
