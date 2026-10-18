// Movement rate audit (decision-coordination audit; read-only measurement on a staged straight run).
// Distance covered in one game day (CFG.dayTicks ticks) by: the player under manual control (control steps
// as main.js runs them: controlHz/simHz per tick), an identical wild GenVo walking to a far target through
// ordinary updates, and a Stalker on a wild hunt vs an engaged player encounter. Usage:
//   node tools/movement-rate-audit.mjs [seed]
import {Simulation} from '../src/sim/simulation.js';import {SPECIES} from '../src/organisms/species.js';import {CFG} from '../src/sim/config.js';
const seed=process.argv[2]||'MOVE-AUDIT';
function lane(sim,a){const W=sim.world;for(let y=10;y<W.n-10;y++)for(let x=8;x<W.n-60;x++){let ok=true;for(let k=0;k<50;k++){const i=W.idx(x+k+.5,y+.5);if(W.water[i]||!W.isPlayable(x+k+.5,y+.5)){ok=false;break}}if(ok)return{x:x+.5,y:y+.5}}return null}
const out={dayTicks:CFG.dayTicks,simHz:CFG.simHz,lifeStride:CFG.lifeStride,controlHz:CFG.controlHz};
{const sim=new Simulation(seed,{player:true});sim.endOpeningGrace?.('audit');const p=sim.player(),L=lane(sim,p);sim.animals=sim.animals.filter(a=>a===p);Object.assign(p,{x:L.x,y:L.y,energy:SPECIES.genvo.maxEnergy,hydration:SPECIES.genvo.maxHydration});sim.rebuildSpatial();
 const x0=p.x,ratio=Math.round(CFG.controlHz/CFG.simHz);for(let t=0;t<CFG.dayTicks;t++){for(let k=0;k<ratio;k++)sim.playerControlStep({right:true},CFG.controlHz);sim.update({right:true},{externalPlayerControl:true})}out.playerWalkTilesPerDay=+(p.x-x0).toFixed(2)}
{const sim=new Simulation(seed,{player:false});const w=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.age>=SPECIES.genvo.maturity),L=lane(sim,w);sim.animals=[w];Object.assign(w,{x:L.x,y:L.y,energy:SPECIES.genvo.maxEnergy*.9,hydration:SPECIES.genvo.maxHydration*.9});sim.rebuildSpatial();
 const x0=w.x;let moves=0;const pm=sim.phaseMovement.bind(sim);sim.phaseMovement=(...a)=>{moves++;return pm(...a)};for(let t=0;t<CFG.dayTicks;t++){w.intent='explore';w.target={x:L.x+48,y:L.y};sim.update(null)}out.wildGenvoWalkTilesPerDay=+(w.x-x0).toFixed(2);out.wildMovementCallsPerDay=moves;out.listedGenvoSpeedTilesPerSec=SPECIES.genvo.speed;out.listedSpeedTilesPerDay=+(SPECIES.genvo.speed*CFG.dayTicks/CFG.simHz).toFixed(1)}
console.log(JSON.stringify(out));
