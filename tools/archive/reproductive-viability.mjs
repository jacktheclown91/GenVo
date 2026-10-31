#!/usr/bin/env node
// Reproductive viability audit (diagnostic; asserts nothing, changes nothing).
// Stage 1, natural standing: unmodified worlds; per species, adult condition and how often each
//   reproductive gate passes (energy, breeding habitat).
// Stage 2, controlled favourable pair: after 30 natural days, a mature natural-genotype pair of the
//   species, at its best breeding cell, at its own NATURAL p90 energy/hydration (observed in stage 1, never above), run
//   with ordinary updates. Records the first blocking stage and the game's own reason codes.
// No food, births or rules are created. With --candidate the off-by-default breeding review values
// (src/ecology/breeding-calibration.js) are enabled for comparison.
// Usage: node tools/reproductive-viability.mjs [--candidate] [--days 20] [--out file]
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {Simulation} from '../../src/sim/simulation.js';import {SPECIES} from '../../src/organisms/species.js';
import {BREEDING_REVIEW} from '../../src/ecology/breeding-calibration.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),args=process.argv.slice(2),opt=(f,d)=>{const i=args.indexOf(f);return i>=0?args[i+1]:d};
BREEDING_REVIEW.enabled=args.includes('--candidate');const days=Number(opt('--days',20)),out=opt('--out',null);
const SEEDS=['VIAB-A','VIAB-B','VIAB-C'],species=Object.keys(SPECIES),q=(a,p)=>{const s=[...a].sort((x,y)=>x-y);return s.length?s[Math.floor(p*(s.length-1))]:null},r3=x=>x==null?null:+x.toFixed(3);
const adult=a=>a.alive&&a.age>=SPECIES[a.species].maturity;

// Stage 1.
const nat=Object.fromEntries(species.map(k=>[k,{energy:[],hydration:[],energyGate:0,habitatGate:0,both:0,n:0,births:0}]));
for(const seed of SEEDS){const sim=new Simulation(seed,{player:false});const give=sim.giveBirth.bind(sim);sim.giveBirth=m=>{const kids=give(m);nat[m.species].births+=kids.length;return kids};
 for(let d=0;d<60;d++){const d0=sim.day;while(sim.day===d0)sim.update(null);if(d%6!==5)continue;
  for(const a of sim.animals){if(!adult(a))continue;const s=SPECIES[a.species],r=nat[a.species],e=a.energy/s.maxEnergy;r.n++;r.energy.push(e);r.hydration.push(a.hydration/s.maxHydration);
   const eg=e>=(s.reproduction?.energy??.72),hg=sim.carrying.breedingState(a).allowed;r.energyGate+=eg;r.habitatGate+=hg;r.both+=eg&&hg}}}
const standing=Object.fromEntries(species.map(k=>{const r=nat[k];return[k,{adultSamples:r.n,births60d:r.births,energyMedian:r3(q(r.energy,.5)),energyP90:r3(q(r.energy,.9)),hydrationP90:r3(q(r.hydration,.9)),energyGate:r3(r.energyGate/Math.max(1,r.n)),habitatGate:r3(r.habitatGate/Math.max(1,r.n)),bothGates:r3(r.both/Math.max(1,r.n))}]}));

// Stage 2.
function favourablePair(k){
 // The world first runs 30 natural days so standing food (including freshwater food) has developed.
 const sim=new Simulation('VIAB-PAIR-'+k,{player:false}),s=SPECIES[k],st=standing[k];for(let d=0;d<30;d++){const d0=sim.day;while(sim.day===d0)sim.update(null)}
 const pool=sim.animals.filter(a=>a.species===k&&a.alive),f=pool.find(a=>a.sex==='F'),m=pool.find(a=>a.sex==='M');if(!f||!m)return{result:'no natural pair in this world'};
 for(const a of [f,m])Object.assign(a,{age:s.maturity+2,reproCooldown:0,pregnant:null,infected:false,health:100,energy:s.maxEnergy*(st.energyP90??.8),hydration:s.maxHydration*(st.hydrationP90??.8)});
 sim.rebuildSpatial();let best=null;for(let y=3;y<sim.world.n-3;y+=2)for(let x=3;x<sim.world.n-3;x+=2){const p={x:x+.5,y:y+.5};if(!sim.canOccupy(f,p.x,p.y))continue;const b=sim.carrying.breedingState(f,{at:p});if(b.allowed&&(!best||b.resource>best.resource))best={...p,resource:b.resource,resourceValue:b.resourceValue}}
 if(!best)return{result:'blocked: no breeding-habitat cell anywhere in this world',stage:'habitat'};
 Object.assign(f,{x:best.x,y:best.y});Object.assign(m,{x:best.x+.6,y:best.y});sim.rebuildSpatial();
 const log={courtshipStarts:0,matingAttempts:0,conceptions:0,births:0,reasons:{},intents:{}},tryMate=sim.tryMate.bind(sim),give=sim.giveBirth.bind(sim);
 sim.tryMate=(a,b)=>{const pair=[f.id,m.id].includes(a.id)&&[f.id,m.id].includes(b.id);const r=tryMate(a,b);if(pair){log.matingAttempts++;if(r)log.conceptions++}return r};
 sim.giveBirth=mo=>{const kids=give(mo);if(mo===f)log.births+=kids.length;return kids};
 let firstPregnantDay=null,lastFailure=null;
 for(let d=0;d<days&&!log.births;d++){const d0=sim.day;while(sim.day===d0){sim.update(null);for(const a of [f,m]){if(!a.alive)continue;log.intents[a.intent]=(log.intents[a.intent]||0)+1;if(a.courtshipPerformance&&!a.__court){a.__court=1;log.courtshipStarts++}if(!a.courtshipPerformance)a.__court=0;const fl=a.lastCourtshipFailure||a.lastCourtshipRefusal;if(fl&&fl!==lastFailure){lastFailure=fl;const code=fl.reasonCode||fl.reason;log.reasons[code]=(log.reasons[code]||0)+1}}if(f.pregnant&&firstPregnantDay==null)firstPregnantDay=d}}
 const alive=f.alive&&m.alive,stage=log.births?'birth':firstPregnantDay!=null?'gestation (no birth yet)':log.conceptions?'conception':log.matingAttempts?'mating refused':log.courtshipStarts?'courtship incomplete':'no courtship';
 const top=Object.entries(log.intents).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v])=>k+':'+v);
 return{bestCell:{x:best.x,y:best.y,resourceValue:r3(best.resourceValue)},furthestStage:stage,firstPregnantDay,alive,energyEnd:r3(f.energy/s.maxEnergy),...log,intents:top};
}
const pairs=Object.fromEntries(species.map(k=>[k,favourablePair(k)]));
const report={schema:'genvo.reproductive-viability/1',date:new Date().toISOString().slice(0,10),candidate:BREEDING_REVIEW.enabled,days,seeds:SEEDS,note:'Diagnostic. Stage 2 is a controlled favourable-condition fixture, not a natural observation.',standing,pairs};
if(out){fs.mkdirSync(path.dirname(path.resolve(out)),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,1))}
for(const k of species){const s=standing[k],p=pairs[k];console.log(`${k.padEnd(10)} natural: births60d ${String(s.births60d).padStart(3)} energy p50 ${s.energyMedian} gates energy ${s.energyGate} habitat ${s.habitatGate} both ${s.bothGates} | pair: ${p.furthestStage||p.result} court ${p.courtshipStarts??'-'} mate ${p.matingAttempts??'-'} conc ${p.conceptions??'-'} births ${p.births??'-'} reasons ${JSON.stringify(p.reasons||{})}`)}
