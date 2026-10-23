// Usage: node tools/probe-ambient-allowance.mjs [days=8] [seeds=PLANET-OBS-3,PLANET-OBS-2,GENVO8-TEST-A]
// The rest-when-sated allowance (ecology/ambient-allowance.js): tiles per day each species travels on
// ambient intents without a need (energy >= 0.6, water >= 0.5) on the recorded 6-second day, per
// species, over the given seeds. Reported with the allowance's walking intents alone (reproduces the
// table in docs/DAY-CLOCK-2026-10-23.md) and with roaming swims added. Measurement only.
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';
const days=Number(process.argv[2]||8),seeds=(process.argv[3]||'PLANET-OBS-3,PLANET-OBS-2,GENVO8-TEST-A').split(',');
const WALK=new Set(['explore','herd-hop','herd-browse','band-wander','root-roam','mire-prowl','shoal-glide','pod-wander','pod-browse','shadow-patrol','bank-patrol']);
const walk={},swim={},animalDays={};
for(const seed of seeds){
 const s=new Simulation(seed,{player:true,worldGenerator:'planetary/1'});s.setPlayerAutonomy(true);const pos=new Map();
 for(let t=0;t<CFG.dayTicks*days;t++){for(const a of s.animals)if(a.alive)pos.set(a.id,[a.x,a.y,a.intent,a.energy/SPECIES[a.species].maxEnergy,a.hydration/SPECIES[a.species].maxHydration]);s.update(null);
  if(t%CFG.dayTicks===0)for(const a of s.animals)if(a.alive&&!a.player)animalDays[a.species]=(animalDays[a.species]||0)+1;
  for(const a of s.animals){const p=pos.get(a.id);if(!a.alive||!p||a.player)continue;const d=Math.hypot(a.x-p[0],a.y-p[1]);if(!d||d>3||p[3]<.6||p[4]<.5)continue;
   if(WALK.has(p[2]))walk[a.species]=(walk[a.species]||0)+d;else if(p[2]==='swim')swim[a.species]=(swim[a.species]||0)+d}}
}
const rows=Object.keys(animalDays).sort().map(k=>({species:k,walk:+((walk[k]||0)/animalDays[k]).toFixed(1),swim:+((swim[k]||0)/animalDays[k]).toFixed(1),withSwim:+(((walk[k]||0)+(swim[k]||0))/animalDays[k]).toFixed(1)}));
console.log(JSON.stringify({days,seeds,rows},null,1));
