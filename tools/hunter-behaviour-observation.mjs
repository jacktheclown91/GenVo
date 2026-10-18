// Natural hunter behaviour observation (diagnostic). Live-play worlds (player present, AUTO on) so
// ambient routines run; every hunter is grouped by body (swimmer or not) and inherited Stalker
// profile. Records hunting time, attempts, bites, kills, meal energy, mating attempts, energy, deaths.
// Usage: node tools/hunter-behaviour-observation.mjs [days=120] [out.json]
import fs from 'node:fs';
import {Simulation} from '../src/sim/simulation.js';import {SPECIES} from '../src/organisms/species.js';import {canHunt} from '../src/ecology/functional-diet.js';import {canSwim} from '../src/lineage/lifestyle.js';import {stalkerProfileFor} from '../src/organisms/stalker-profile.js';
const days=Number(process.argv[2]||120),out=process.argv[3],groups={};
const key=a=>`${a.species}|${canSwim(a)?'swimmer':'land'}|${stalkerProfileFor(a).id}`;
const G=k=>groups[k]??={animals:new Set(),ticks:0,hunt:0,prowl:0,shore:0,watch:0,attempts:0,bites:0,kills:0,mealEnergy:0,mateAttempts:0,energy:[],deaths:{}};
for(const seed of ['HUNT-OBS-A','HUNT-OBS-B']){const sim=new Simulation(seed,{player:true});sim.endOpeningGrace?.('obs');sim.setPlayerAutonomy(true);
  const tk=sim.tryKill.bind(sim);sim.tryKill=(p,q,...r)=>{if(!canHunt(p))return tk(p,q,...r);const g=G(key(p));g.attempts++;const h=q.health,alive=q.alive,e=p.energy,res=tk(p,q,...r);if(q.health<h)g.bites++;if(alive&&!q.alive)g.kills++;if(p.energy>e)g.mealEnergy+=p.energy-e;return res};
  const rm=sim.resolveInteraction.bind(sim);sim.resolveInteraction=a=>{const e=a.energy,r=rm(a);if(canHunt(a)&&a.energy>e&&!a.target?.species)G(key(a)).mealEnergy+=a.energy-e;return r};
  const tm=sim.tryMate.bind(sim);sim.tryMate=(a,b)=>{if(canHunt(a))G(key(a)).mateAttempts++;return tm(a,b)};
  const kl=sim.kill.bind(sim);sim.kill=(a,c)=>{if(a.alive&&canHunt(a)){const g=G(key(a));g.deaths[c]=(g.deaths[c]||0)+1}return kl(a,c)};
  for(let d=0;d<days;d++){const d0=sim.day;while(sim.day===d0){sim.update(null);for(const a of sim.animals){if(!a.alive||a.player||!canHunt(a)||a.age<SPECIES[a.species].maturity)continue;const g=G(key(a));g.animals.add(seed+a.id);g.ticks++;if(a.intent==='hunt')g.hunt++;if(a.intent==='shadow-patrol')g.prowl++;if(a.intent?.startsWith('bank-'))g.shore++;if(a.intent==='scent-watch')g.watch++}}
    if(d%10===9)for(const a of sim.animals)if(a.alive&&!a.player&&canHunt(a)&&a.age>=SPECIES[a.species].maturity)G(key(a)).energy.push(a.energy/SPECIES[a.species].maxEnergy)}}
const rows=Object.entries(groups).map(([k,g])=>{const e=g.energy.sort((a,b)=>a-b);return{group:k,animals:g.animals.size,shareHunting:+(g.hunt/g.ticks).toFixed(3),shareProwl:+(g.prowl/g.ticks).toFixed(3),shareWatch:+(g.watch/g.ticks).toFixed(3),shareShore:+(g.shore/g.ticks).toFixed(3),attempts:g.attempts,bites:g.bites,kills:g.kills,failedAttempts:g.attempts-g.bites,mealEnergy:+g.mealEnergy.toFixed(0),mateAttempts:g.mateAttempts,energyMedian:e.length?+e[e.length>>1].toFixed(3):null,deaths:g.deaths}}).sort((a,b)=>a.group.localeCompare(b.group));
for(const r of rows)console.log(JSON.stringify(r));if(out)fs.writeFileSync(out,JSON.stringify({schema:'genvo.hunter-behaviour/1',days,rows},null,1));
