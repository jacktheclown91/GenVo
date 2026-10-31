#!/usr/bin/env node
// Phase 4 Test 2: follow a naturally developing lineage (observation; forces nothing).
// A live world (player present, AUTO on, so the lineage plays itself) runs for N days. Per generation:
// members ever born, distinct body plans and mouths, adaptations, the effects creatures actually live
// by (land speed, forage range, threat sense, metabolism), behaviour mix, and causes of death.
// Usage: node tools/lineage-observation.mjs [seed] [days=240] [out.json]
import fs from 'node:fs';
import {Simulation} from '../../src/sim/simulation.js';
import {effectsFor} from '../evolution-baseline.mjs';
import {mouthOf} from '../../src/ecology/functional-diet.js';
const seed=process.argv[2]||'LINEAGE-OBS-A',days=Number(process.argv[3]||240),out=process.argv[4];
const sim=new Simulation(seed,{player:true});sim.endOpeningGrace?.('obs');sim.setPlayerAutonomy(true);
const members=new Map(),deaths={},timeline=[];
const note=a=>{if(!a?.lineage&&!a?.player)return;if(!members.has(a.id))members.set(a.id,{a,generation:a.generation||1,born:sim.day,intents:{},effects:null,plan:a.bodyPlan?.id||'none',mouth:mouthOf(a)||'none',adaptations:[...(a.adaptations||[])]})};
const kl=sim.kill.bind(sim);sim.kill=(a,c)=>{if(a.alive&&members.has(a.id)){const g=members.get(a.id).generation;(deaths[g]??={})[c]=(deaths[g][c]||0)+1}return kl(a,c)};
for(let d=0;d<days;d++){
  const d0=sim.day;while(sim.day===d0){sim.update(null);for(const a of sim.animals){if(!a.alive)continue;note(a);const m=members.get(a.id);if(m){m.intents[a.intent]=(m.intents[a.intent]||0)+1;if(!m.effects&&a.age>2)m.effects=effectsFor(sim,a)}}}
  if(d%20===0){const alive=[...members.values()].filter(m=>m.a.alive);timeline.push({day:sim.day,alive:alive.length,highestGeneration:sim.lineage?.highestGeneration||1,byGeneration:alive.reduce((o,m)=>(o[m.generation]=(o[m.generation]||0)+1,o),{})})}
}
const gens={};for(const m of members.values()){const g=gens[m.generation]??={members:0,alive:0,plans:new Set(),mouths:{},adaptations:{},effects:[],intents:{}};g.members++;if(m.a.alive)g.alive++;g.plans.add(m.plan);g.mouths[m.mouth]=(g.mouths[m.mouth]||0)+1;for(const x of m.adaptations)g.adaptations[x]=(g.adaptations[x]||0)+1;if(m.effects)g.effects.push(m.effects);for(const [k,v] of Object.entries(m.intents))g.intents[k]=(g.intents[k]||0)+v}
const med=(arr,k)=>{const v=arr.map(e=>e[k]).filter(Number.isFinite).sort((a,b)=>a-b);return v.length?+v[v.length>>1].toFixed(3):null};
const generations=Object.fromEntries(Object.entries(gens).map(([g,v])=>{const tot=Object.values(v.intents).reduce((a,b)=>a+b,0)||1;return[g,{members:v.members,alive:v.alive,distinctBodies:v.plans.size,mouths:v.mouths,adaptations:v.adaptations,landSpeed:med(v.effects,'landSpeed'),forageRange:med(v.effects,'forageRange'),threatSense:med(v.effects,'threatSense'),metabolism:med(v.effects,'metabolism'),behaviour:Object.fromEntries(Object.entries(v.intents).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([k,n])=>[k,+(n/tot).toFixed(3)])),deaths:deaths[g]||{}}]}));
const report={schema:'genvo.lineage-observation/1',seed,days,note:'Natural AUTO lineage; nothing forced.',timeline,generations};
if(out)fs.writeFileSync(out,JSON.stringify(report,null,1));
console.log(JSON.stringify({seed,days,highestGeneration:sim.lineage?.highestGeneration,members:members.size,timeline:timeline.map(t=>t.day+':'+t.alive+'/g'+t.highestGeneration).join(' ')}));
for(const [g,v] of Object.entries(generations))console.log('gen',g,JSON.stringify(v));
