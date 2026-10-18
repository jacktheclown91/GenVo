// Movement disparity decomposition (Phase 3K Priority 1; read-only measurement). Identical adult GenVo
// bodies walk the same straight, unobstructed lane toward a far target for one game day:
//   - manual player (control steps as main.js runs them),
//   - AUTO player (player-owned, wildlife decision rules),
//   - wild GenVo (same body, genes and condition).
// For each: distance per day, movement updates per day, distance per update while moving, updates spent in
// ambient pauses, and the implied speed while moving (tiles per second) against the listed speed. A second
// part measures natural daily travel by species in an unstaged world (behaviour, not mechanics).
// Usage: node tools/movement-parity-audit.mjs [seed] [naturalDays=30]
import {Simulation} from '../src/sim/simulation.js';import {SPECIES} from '../src/organisms/species.js';import {CFG} from '../src/sim/config.js';
const seed=process.argv[2]||'MOVE-PARITY',naturalDays=Number(process.argv[3]||30),S=SPECIES.genvo,day=CFG.dayTicks,ratio=Math.round(CFG.controlHz/CFG.simHz);
function lane(sim){const W=sim.world;for(let y=10;y<W.n-10;y++)for(let x=8;x<W.n-60;x++){let ok=true;for(let k=0;k<52;k++){const i=W.idx(x+k+.5,y+.5);if(W.water[i]||!W.isPlayable(x+k+.5,y+.5)){ok=false;break}}if(ok)return{x:x+.5,y:y+.5}}return null}
function setup(mode){const sim=new Simulation(seed,{player:mode!=='wild'});sim.endOpeningGrace?.('audit');sim.phaseClimate();
  const a=mode==='wild'?sim.animals.find(x=>x.alive&&x.species==='genvo'&&!x.lineage&&x.age>=S.maturity):sim.player();const ref=sim.player?.()||a;
  if(mode==='wild'){const tw=new Simulation(seed,{player:true}).player();Object.assign(a,{genes:structuredClone(tw.genes),bodyPlan:structuredClone(tw.bodyPlan),adaptations:structuredClone(tw.adaptations||[]),age:tw.age})}
  const L=lane(sim);sim.animals=[a];Object.assign(a,{x:L.x,y:L.y,energy:S.maxEnergy*.9,hydration:S.maxHydration*.9,health:100,carryingFood:null});sim.rebuildSpatial();if(mode==='auto')sim.setPlayerAutonomy(true);return{sim,a,L}}
const rows=[];
for(const mode of ['manual','auto','wild']){const {sim,a,L}=setup(mode);let updates=0,moving=0,paused=0,moved=0;const goal={x:L.x+50,y:L.y};
  const pm=sim.phaseMovement.bind(sim);sim.phaseMovement=(...args)=>{if(mode!=='manual'){a.intent='explore';a.target=goal}updates++;const x0=a.x,allowed=sim.activity.ambientMoveAllowed(a);const r=pm(...args);const d=a.x-x0;if(!allowed)paused++;else if(d>1e-6){moving++;moved+=d}return r};
  const x0=a.x;for(let t=0;t<day;t++){if(mode==='manual'){for(let k=0;k<ratio;k++)sim.playerControlStep({right:true},CFG.controlHz);sim.update({right:true},{externalPlayerControl:true})}else{a.intent='explore';a.target=goal;sim.update(null)}}
  const dist=a.x-x0,perMove=mode==='manual'?dist/day:moving?moved/moving:0;
  rows.push({mode,tilesPerDay:+dist.toFixed(2),movementUpdatesPerDay:mode==='manual'?day*ratio+' control steps':updates,updatesMoving:mode==='manual'?'-':moving,updatesInAmbientPause:mode==='manual'?'-':paused,tilesPerMovingUpdate:+perMove.toFixed(3),impliedSpeedWhileMovingTilesPerSec:mode==='manual'?+(dist/(day/CFG.simHz)).toFixed(2):+(perMove*CFG.simHz).toFixed(2),listedSpeed:S.speed})}
// Natural daily travel (behaviour): mean straight-line displacement per day and path length per day.
const nat=new Simulation(seed,{player:false}),prev=new Map(),acc={};for(let d=0;d<naturalDays;d++){const d0=nat.day;while(nat.day===d0){for(const a of nat.animals)if(a.alive)prev.set(a.id,[a.x,a.y]);nat.update(null);for(const a of nat.animals){if(!a.alive||a.age<SPECIES[a.species].maturity)continue;const p=prev.get(a.id);if(!p)continue;const r=acc[a.species]??={path:0,days:0};r.path+=Math.hypot(a.x-p[0],a.y-p[1])}}for(const a of nat.animals)if(a.alive&&a.age>=SPECIES[a.species].maturity)(acc[a.species]??={path:0,days:0}).days++}
const natural=Object.fromEntries(Object.entries(acc).map(([k,r])=>[k,{pathTilesPerAnimalDay:+(r.path/Math.max(1,r.days)).toFixed(2),listedSpeedTilesPerDayIfAlwaysMoving:+(SPECIES[k].speed*day/CFG.simHz).toFixed(1)}]));
console.log(JSON.stringify({seed,dayTicks:day,simHz:CFG.simHz,lifeStride:CFG.lifeStride,staged:rows,natural}));
