import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {CFG} from '../src/sim/config.js';
import {PHYSIOLOGY_PARITY} from '../src/ecology/physiology.js';

// Phase 3J Step 1: equivalent organisms doing equivalent things have equivalent physiological consequences,
// whoever controls them (no player-ownership multipliers, no opening immunity).
assert.equal(PHYSIOLOGY_PARITY.enabled,true);
const S=SPECIES.genvo;
function pair(seed='PHYSIOLOGY-PARITY'){
  const sim=new Simulation(seed,{player:true});sim.phaseClimate();const p=sim.player();
  const w=sim.animals.find(a=>a.alive&&!a.player&&!a.lineage&&a.species==='genvo'&&a.age>=S.maturity);
  Object.assign(w,{genes:structuredClone(p.genes),bodyPlan:structuredClone(p.bodyPlan),adaptations:structuredClone(p.adaptations||[]),age:p.age,x:p.x,y:p.y,health:100,infected:false,pregnant:null,dietRecent:[]});p.dietRecent=[];
  for(const a of [p,w])Object.assign(a,{energy:S.maxEnergy*.7,hydration:S.maxHydration*.7,health:100});
  return{sim,p,w};
}
// 1. Basal metabolism, day 1 (no opening exemption either way).
{const {sim,p,w}=pair();sim.animals=[p,w];const before=[p.energy,p.hydration,w.energy,w.hydration];sim.phaseMetabolism();
 assert.ok(Math.abs((before[0]-p.energy)-(before[2]-w.energy))<1e-9,'same basal energy use');assert.ok(Math.abs((before[1]-p.hydration)-(before[3]-w.hydration))<1e-9,'same basal water use');
 assert.ok(before[0]-p.energy>0&&before[1]-p.hydration>0);}
// 2. Movement: energy per tile moved, manual control vs autonomous movement, same body and ground.
{const {sim,p,w}=pair();const W=sim.world;let row=null;for(let y=10;y<W.n-10&&!row;y++)for(let x=10;x<W.n-30;x++){let ok=true;for(let k=0;k<14;k++){const i=W.idx(x+k+.5,y+.5);if(W.water[i]||!W.isPlayable(x+k+.5,y+.5)){ok=false;break}}if(ok){row={x:x+.5,y:y+.5};break}}
 assert.ok(row);sim.animals=[p,w];
 Object.assign(p,{x:row.x,y:row.y,carryingFood:null});Object.assign(w,{x:row.x,y:row.y+40,carryingFood:null});sim.rebuildSpatial();
 const e0=p.energy,x0=p.x;for(let k=0;k<CFG.controlHz;k++)sim.playerControlStep({right:true},CFG.controlHz);const playerMoved=p.x-x0,playerPerTile=(e0-p.energy)/playerMoved;
 Object.assign(w,{y:row.y,x:row.x,intent:'explore',target:{x:row.x+12,y:row.y}});p.x=row.x;p.y=row.y+40;const e1=w.energy,x1=w.x;sim.tickCount=0;for(let k=0;k<CFG.simHz;k++){w.intent='explore';w.target={x:row.x+12,y:row.y};sim.phaseMovement()}const wildPerTile=(e1-w.energy)/(w.x-x1);
 assert.ok(playerMoved>1&&w.x-x1>1,'both moved');assert.ok(Math.abs(playerPerTile/wildPerTile-1)<.02,`same energy per tile moved (player ${playerPerTile.toFixed(4)}, wild ${wildPerTile.toFixed(4)})`);}
// 3. Feeding: the same bite of the same food gives the same energy and water.
for(const kind of ['sunmoss','marshroot']){const {sim,p,w}=pair();const W=sim.world;let i=-1;for(let k=0;k<W.len;k++)if(!W.water[k]&&(W.plants[kind]?.[k]||0)>.5&&sim.canOccupy(p,k%W.n+.5,Math.floor(k/W.n)+.5)){i=k;break}
 if(i<0)continue;const x=i%W.n+.5,y=Math.floor(i/W.n)+.5,stock=W.plants[kind][i];
 Object.assign(p,{x,y});const ep=p.energy,hp=p.hydration;const opt=sim.foraging.options(p,{index:i,kind})[0];assert.ok(sim.foraging.consume(p,opt).ok);const dp=[p.energy-ep,p.hydration-hp,stock-W.plants[kind][i]];
 W.plants[kind][i]=stock;Object.assign(w,{x,y,intent:'feed',target:{kind,x,y}});p.x+=40;const ew=w.energy,hw=w.hydration;sim.resolveInteraction(w);const dw=[w.energy-ew,w.hydration-hw,stock-W.plants[kind][i]];
 assert.ok(Math.abs(dp[2]-dw[2])<1e-9,`${kind}: same bite`);assert.ok(Math.abs(dp[0]-dw[0])<1e-6,`${kind}: same energy (${dp[0].toFixed(3)} vs ${dw[0].toFixed(3)})`);assert.ok(Math.abs(dp[1]-dw[1])<1e-6,`${kind}: same water (${dp[1].toFixed(3)} vs ${dw[1].toFixed(3)})`);}
// 4. No opening immunity: a hungry hunter may bite the founding player on day 1.
{const {sim,p}=pair();assert.equal(sim.isOpeningProtected(p),false,'founding family is not immune');const h=sim.animals.find(a=>a.alive&&a.species==='needlejaw'&&a.age>=SPECIES.needlejaw.maturity);Object.assign(h,{x:p.x+.4,y:p.y});const c=sim.rng.chance;sim.rng.chance=()=>true;const hit=sim.tryKill(h,p);sim.rng.chance=c;assert.equal(hit,true,'a contact bite can land on day 1')}
// ?physiologyParity=0 restores the old player multipliers.
{PHYSIOLOGY_PARITY.enabled=false;const {sim,p,w}=pair();sim.endOpeningGrace('t');sim.animals=[p,w];const b=[p.energy,w.energy];sim.phaseMetabolism();PHYSIOLOGY_PARITY.enabled=true;assert.ok((b[0]-p.energy)>(b[1]-w.energy)*5,'old rule: player burns about 6x')}
console.log('physiology parity: basal, movement per tile, feeding and predation eligibility equivalent: PASS');
