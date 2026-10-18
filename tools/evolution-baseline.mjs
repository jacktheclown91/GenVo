#!/usr/bin/env node
// Evolution consolidation Stage A: measure, change nothing.
// Records how today's evolution systems combine into the numbers a creature actually lives by
// (speed, forage range, threat sense, metabolism, water use, shelter protection, food value,
// strike), first one factor at a time, then stacked, then across natural AUTO runs.
// Later consolidation stages must reproduce this baseline or change it deliberately.
//   node tools/evolution-baseline.mjs            print a comparison against docs/evolution-baseline.json
//   node tools/evolution-baseline.mjs --write    rewrite the baseline
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';
import {adaptationEffects,ADAPTATION_IDS} from '../src/lineage/evolution.js';
import {PROTO_TRAITS} from '../src/lineage/proto-speciation.js';
import {setForm,setProto,formReading,protoReading} from '../src/lineage/readings.js';
import {SPECIES_LIFESTYLES} from '../src/lineage/species-lifestyle.js';
import {movementEffect,forageRangeEffect,familyForageRangeEffect,threatSenseEffect,shelterExposureEffect,metabolismEffect,waterUseEffect} from '../src/lineage/effects.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const baselinePath=path.join(root,'docs/evolution-baseline.json');
const r6=v=>Math.round(v*1e6)/1e6;

// The composite effects, read through the same functions the simulation uses (lineage/effects.js since Stage C).
export function effectsFor(sim,a){
  const s=SPECIES[a.species],fx=adaptationEffects(a),g=a.genes;
  const div=sim.divergence,proto=sim.protoSpeciation,life=sim.speciesLifestyle;
  return{
    landSpeed:r6(s.speed*g.motion*movementEffect(sim,a)),
    sprintSpeed:r6(fx.sprintSpeed),
    forageRange:r6(9*g.senses*forageRangeEffect(sim,a)),
    familyForageRange:r6(familyForageRangeEffect(sim,a)),
    threatSense:r6(5*g.senses*threatSenseEffect(sim,a)),
    metabolism:r6(metabolismEffect(sim,a,fx)/g.metabolism),
    waterUse:r6(waterUseEffect(sim,a,fx)),
    heatStrain:r6(proto.thermalMultiplier(a,'heat')),coldStrain:r6(proto.thermalMultiplier(a,'cold')),
    shelterExposure:r6(shelterExposureEffect(sim,a)),
    plantFood:r6(fx.foodGain*life.foodEnergyMultiplier(a,{kind:'bramble'})),
    livePreyFood:r6(fx.foodGain*life.foodEnergyMultiplier(a,{kind:'mosskip',livePrey:true})),
    strike:r6(fx.playerStrike),predatorDamageTaken:r6(fx.predatorDamage),cache:r6(div.cacheMultiplier(a))
  };
}

function stagingSim(){
  const sim=new Simulation('GENVO8-EVO-BASELINE',{player:true});const p=sim.player();
  // A neutral body so every row isolates the factor being measured.
  for(const k of Object.keys(p.genes))p.genes[k]=1;p.adaptations=[];setForm(p,null);setProto(p,null);p.ecoLifestyle=null;
  p.habits={range:0,home:0,caution:0,boldness:0,hunting:0};p.generation=3;
  // Wetness proto-trait movement depends on the ground; stand on wet land for a fair reading.
  const w=sim.world;for(let i=0;i<w.len;i++)if(!w.water[i]&&w.moisture[i]>=.6){p.x=(i%w.n)+.5;p.y=Math.floor(i/w.n)+.5;break}
  return{sim,p};
}
function measure(sim,p,setup){
  const saved={genes:{...p.genes},adaptations:[...p.adaptations],anatomy:p.anatomy?{...p.anatomy}:null,formHistory:p.formHistory,protoHistory:p.protoHistory,ecoLifestyle:p.ecoLifestyle,habits:{...p.habits},scores:{...sim.tendency.scores}};
  setup(p,sim);sim.tendency.lastSnapshot=null;const out=effectsFor(sim,p);
  Object.assign(p,{genes:saved.genes,adaptations:saved.adaptations,anatomy:saved.anatomy,formHistory:saved.formHistory,protoHistory:saved.protoHistory,ecoLifestyle:saved.ecoLifestyle,habits:saved.habits});sim.tendency.scores=saved.scores;sim.tendency.lastSnapshot=null;
  return out;
}

export function effectsMatrix(){
  const {sim,p}=stagingSim(),rows={};
  rows.neutral=measure(sim,p,()=>{});
  for(const k of Object.keys(p.genes)){rows[`gene:${k}+0.2`]=measure(sim,p,a=>{a.genes[k]=1.2});rows[`gene:${k}-0.2`]=measure(sim,p,a=>{a.genes[k]=.8})}
  for(const id of ADAPTATION_IDS)rows[`adaptation:${id}`]=measure(sim,p,a=>{a.adaptations=[id]});
  for(const kind of ['forager','colony'])for(const strength of [.5,1])rows[`form:${kind}@${strength}`]=measure(sim,p,a=>{setForm(a,{kind,strength,sourceGeneration:2})});
  for(const def of Object.values(PROTO_TRAITS))rows[`proto:${def.id}`]=measure(sim,p,a=>{setProto(a,{id:def.id,strength:.5,lineageDepth:2})});
  for(const id of Object.keys(SPECIES_LIFESTYLES))rows[`lifestyle:${id}`]=measure(sim,p,a=>{a.ecoLifestyle={id}});
  for(const h of ['range','home','caution','boldness','hunting'])rows[`habit:${h}@0.8`]=measure(sim,p,a=>{a.habits[h]=.8});
  for(const stage of [1,2,3])rows[`family:forager-stage${stage}`]=measure(sim,p,(a,s)=>{s.tendency.scores={forager:[0,2.5,6,10][stage],colony:0}});
  // Stacked: every system that widens range or speeds travel, at once.
  rows['stack:widest-ranger']=measure(sim,p,(a,s)=>{a.genes.senses=1.2;a.genes.motion=1.2;setForm(a,{kind:'forager',strength:1,sourceGeneration:2});setProto(a,{id:'range-sense',strength:.72,lineageDepth:3});a.ecoLifestyle={id:'nomadic'};a.habits.range=1;s.tendency.scores={forager:10,colony:0}});
  rows['stack:most-sheltered']=measure(sim,p,(a,s)=>{setForm(a,{kind:'colony',strength:1,sourceGeneration:2});setProto(a,{id:'close-brood',strength:.72,lineageDepth:3});a.ecoLifestyle={id:'burrower'};a.habits.home=1});
  rows['stack:most-vigilant']=measure(sim,p,a=>{a.genes.senses=1.2;setForm(a,{kind:'forager',strength:1,sourceGeneration:2});setProto(a,{id:'watch-crest',strength:.72,lineageDepth:3});a.ecoLifestyle={id:'guardian'};a.habits.caution=1});
  return rows;
}

// Natural AUTO runs: how often each system is actually in play, and the spread of outcomes.
export function naturalRuns({seeds=['EVO-A','EVO-B','EVO-C'],days=60}={}){
  const out={};
  for(const seed of seeds){
    const sim=new Simulation(`GENVO8-${seed}`,{player:true});sim.setPlayerAutonomy(true);
    for(let i=0;i<CFG.dayTicks*days;i++)sim.update(null);
    const fam=sim.animals.filter(a=>a.alive&&a.lineage&&a.species==='genvo'),fx=fam.map(a=>effectsFor(sim,a));
    const spread=key=>{const v=fx.map(e=>e[key]).sort((x,y)=>x-y);return v.length?{min:v[0],median:v[Math.floor(v.length/2)],max:v.at(-1)}:null};
    out[seed]={days,living:fam.length,highestGeneration:sim.lineage.highestGeneration,deaths:sim.stats.deaths,
      withForm:fam.filter(a=>formReading(a)).length,withProto:fam.filter(a=>protoReading(a)).length,withLifestyle:fam.filter(a=>sim.speciesLifestyle.lifestyleFor(a)).length,
      adaptations:Object.fromEntries([...new Set(fam.flatMap(a=>a.adaptations||[]))].sort().map(id=>[id,fam.filter(a=>a.adaptations.includes(id)).length])),
      landSpeed:spread('landSpeed'),forageRange:spread('forageRange'),threatSense:spread('threatSense'),metabolism:spread('metabolism'),waterUse:spread('waterUse')};
  }
  return out;
}

export function buildBaseline(opts={}){return{schema:1,version:CFG.version,note:'Stage A consolidation baseline. Regenerate deliberately with node tools/evolution-baseline.mjs --write.',matrix:effectsMatrix(),natural:naturalRuns(opts)}}

if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){
  const now=buildBaseline();
  const ci=process.argv.indexOf('--compare');
  if(ci>=0){
    // A separately labelled CURRENT-SOURCE COMPARISON. It never touches the historical baseline.
    const old=JSON.parse(fs.readFileSync(baselinePath,'utf8')),out=process.argv[ci+1]||path.join(root,'docs','evolution-baseline-comparison.json');
    const matrixDiffs=[];for(const [row,vals] of Object.entries(now.matrix))for(const [k,v] of Object.entries(vals)){const o=old.matrix?.[row]?.[k];if(o!==v)matrixDiffs.push({row,key:k,baseline:o,current:v})}
    const delta=(a,b)=>a&&b&&typeof a==='object'?Object.fromEntries(Object.keys({...a,...b}).map(k=>[k,typeof a[k]==='number'&&typeof b[k]==='number'?+(b[k]-a[k]).toFixed(6):delta(a[k],b[k])])):undefined;
    const natural=Object.fromEntries(Object.keys({...old.natural,...now.natural}).map(seed=>[seed,{baseline:old.natural[seed],current:now.natural[seed],delta:delta(old.natural[seed],now.natural[seed])}]));
    fs.writeFileSync(out,JSON.stringify({schema:'genvo.evolution-baseline-comparison/1',label:'Current-source comparison. NOT a baseline; the historical baseline is unchanged.',date:new Date().toISOString().slice(0,10),baselineVersion:old.version,currentVersion:now.version,seeds:Object.keys(now.natural),matrixMatches:!matrixDiffs.length,matrixDiffs,natural},null,1)+'\n');
    console.log(`wrote ${path.relative(root,out)} (matrix ${matrixDiffs.length?matrixDiffs.length+' differences':'matches'})`);process.exit(0);
  }
  if(process.argv.includes('--write')){fs.writeFileSync(baselinePath,JSON.stringify(now,null,1)+'\n');console.log(`wrote ${path.relative(root,baselinePath)}`)}
  else{
    const old=fs.existsSync(baselinePath)?JSON.parse(fs.readFileSync(baselinePath,'utf8')):null;
    if(!old){console.log('no baseline yet; run with --write');process.exit(1)}
    const diffs=[];for(const [row,vals] of Object.entries(now.matrix))for(const [k,v] of Object.entries(vals)){const o=old.matrix?.[row]?.[k];if(o!==v)diffs.push(`${row}.${k}: ${o} -> ${v}`)}
    console.log(diffs.length?diffs.join('\n'):'matrix matches baseline');
    console.log(JSON.stringify(now.natural)===JSON.stringify(old.natural)?'natural runs match baseline':'natural runs differ from baseline');
  }
}
