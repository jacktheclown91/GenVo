// Save/resume determinism (Phase 3I Milestone 4). From one state, continue (a) uninterrupted and (b) via a
// save snapshot restored into a fresh simulation; compare RNG, every actor, soil disturbance, dig receipts
// and world stocks day by day. Optional dig interruption days mirror tests/engineer-loss-return.mjs.
// Usage: node tools/save-resume-determinism.mjs <seed> <saveDay> <endDay> [player=0] [pauseFrom pauseTo]
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
const [seed='DET-A',saveArg='60',endArg='168',playerArg='0',pf,pt]=process.argv.slice(2),saveDay=Number(saveArg),endDay=Number(endArg);
function instrument(sim,log){const original=sim.partAbilities.dig.bind(sim.partAbilities);sim.partAbilities.dig=actor=>{if(pf&&sim.day>=Number(pf)&&sim.day<=Number(pt))return{ok:false,type:'dig',quiet:true};const r=original(actor);if(r.ok)log.digs++;return r}}
const hashState=sim=>{let h=2166136261>>>0;const mix=v=>{const s=typeof v==='number'?v.toFixed(9):String(v);for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619)>>>0};
  mix(sim.rng.state);mix(sim.tickCount);for(const a of sim.animals){mix(a.id);mix(a.alive);mix(a.x);mix(a.y);mix(a.energy);mix(a.hydration);mix(a.health);mix(a.intent);mix(a.age)}
  for(const [c,r] of sim.partAbilities.soilDisturbance||[]){mix(c);mix(r.strength);mix(r.day)}for(const k of Object.keys(sim.world.plants)){let s=0;const f=sim.world.plants[k];for(let i=0;i<f.length;i++)s+=f[i];mix(s)}return h.toString(16)};
const A=new Simulation(seed,{player:playerArg==='1'}),la={digs:0};if(playerArg==='1'){A.endOpeningGrace?.('diag');A.setPlayerAutonomy(true)}instrument(A,la);
while(A.day<saveDay)A.update(null);
const snap=structuredClone(createSimulationSnapshot(A)),B=restoreSimulationSnapshot(snap),lb={digs:la.digs};instrument(B,lb);
const out=[];let firstDiff=null;
while(A.day<endDay){const d0=A.day;while(A.day===d0)A.update(null);while(B.day<A.day)B.update(null);const ha=hashState(A),hb=hashState(B);if(ha!==hb&&!firstDiff)firstDiff={day:A.day,rngA:A.rng.state,rngB:B.rng.state,ticksA:A.tickCount,ticksB:B.tickCount};if(A.day%20===0)out.push({day:A.day,same:ha===hb,digsA:la.digs,digsB:lb.digs})}
console.log(JSON.stringify({seed,saveDay,endDay,identical:!firstDiff,firstDiff,digs:{uninterrupted:la.digs,resumed:lb.digs},checkpoints:out}));
process.exit(firstDiff?1:0);
