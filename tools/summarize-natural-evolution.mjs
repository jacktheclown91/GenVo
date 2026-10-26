// Summarize real field receipts, keeping natural and controlled evidence separate.
// Usage: node tools/summarize-natural-evolution.mjs OUTPUT.json INPUT1.json ... [--partial]
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {deserialize} from 'node:v8';
import {SPECIES} from '../src/organisms/species.js';
import {snapshotSignature} from './snapshot-signature.mjs';

const [output,...args]=process.argv.slice(2),partial=args.includes('--partial');
const files=args.filter(arg=>arg!=='--partial');
assert.ok(output&&!fs.existsSync(output));
assert.ok(partial?files.length>0:files.length===4,'Final sample requires all four paired worlds');
const result={schema:'genvo.natural-evolution-summary/1',partial,worlds:[],
  interpretationLimits:[
    'Natural courtship mixes physiological states and inherited preferences; its rate is not the favorable-condition acceptance target.',
    'Anatomical plan novelty is distinct from an evolutionarily recognized species.',
    'Geographic gene associations are observations, not proof that environmental pressure caused adaptation.',
    'Two paired seeds and 320 days do not establish equilibrium or rule out rare evolutionary routes.'
  ]};
for(const file of files){
  const bytes=fs.readFileSync(file),r=JSON.parse(bytes);
  assert.equal(r.schema,'genvo.natural-evolution/1');assert.equal(r.status,'complete');
  assert.equal(r.verificationOnly,false);assert.ok(r.saveContinuation);
  const state=deserialize(fs.readFileSync(file+'.snapshot.v8'));
  assert.equal(snapshotSignature(state),r.completeStateSha256,'Retained world is exactly the measured checkpoint');
  const first=r.samples[0],last=r.samples.at(-1),living=state.animals.filter(a=>a.alive);
  assert.equal(last.live,living.length);assert.equal(last.day,r.requestedDays+1);
  assert.equal(r.births.length,last.births-first.births,'Every paid birth is observed');
  const liveIds=new Set(living.map(a=>a.id)),deathById=new Map(r.deaths.map(d=>[d.id,d]));
  const speciesById=new Map(state.animals.map(a=>[a.id,a.species]));
  for(const row of [...r.deaths,...r.births])speciesById.set(row.id,row.species);
  const bySpecies={},initialPlans=new Set(Object.keys(first.bodyPlans));
  const initialPlansBySpecies={},livingPlansBySpecies={};
  for(const [cell,group] of Object.entries(first.geography)){
    const species=cell.split(':')[0],plans=initialPlansBySpecies[species]??=new Set();
    for(const plan of Object.keys(group.plans))plans.add(plan);
  }
  for(const animal of living){
    const plans=livingPlansBySpecies[animal.species]??={};
    const plan=animal.bodyPlan?.id??'none';plans[plan]=(plans[plan]||0)+1;
  }
  const novelPlans=new Set(),lineageNovelParts=new Set();
  for(const child of r.births){
    const row=bySpecies[child.species]??={births:0,aliveAtHorizon:0,recordedDeaths:0,
      survivedToMaturity:0,juvenileDeaths:0,unresolvedOrDeparted:0,maximumAncestryDepth:1,bodyPlans:{}};
    row.births++;row.aliveAtHorizon+=Number(liveIds.has(child.id));row.recordedDeaths+=Number(child.diedDay!==null);
    row.maximumAncestryDepth=Math.max(row.maximumAncestryDepth,child.ancestryDepth||1);
    row.bodyPlans[child.bodyPlan]=(row.bodyPlans[child.bodyPlan]||0)+1;
    const death=deathById.get(child.id),maturity=SPECIES[child.species].maturity;
    const matured=child.maturedDay!==null||!!(death&&death.age>=maturity);
    row.survivedToMaturity+=Number(matured);
    row.juvenileDeaths+=Number(!!death&&death.age<maturity);
    row.unresolvedOrDeparted+=Number(!liveIds.has(child.id)&&child.diedDay===null);
    if(!initialPlans.has(child.bodyPlan))novelPlans.add(child.bodyPlan);
    if(child.lineage)for(const part of child.parts)if(!Object.hasOwn(first.lineageParts,part))lineageNovelParts.add(part);
  }
  const displays=r.mating.events.filter(event=>event.display);
  const accepted=displays.filter(event=>event.accepted).length;
  const preferenceGroups={};
  const foundingLabelCombinations={};
  let foundingLabelCrossConceptions=0,unresolvedParentConceptions=0;
  for(const event of r.mating.events){
    const key=event.preferenceSimilarity.some(value=>typeof value==='number'&&value<0)?'at-least-one-contrast-allele':'other-inherited-profiles';
    const group=preferenceGroups[key]??={attempts:0,accepted:0,conceptions:0};
    group.attempts++;group.accepted+=Number(event.accepted);group.conceptions+=Number(event.conceived);
    const parentLabels=event.parents.map(id=>speciesById.get(id)||'unresolved').sort();
    if(event.conceived){
      if(parentLabels.includes('unresolved'))unresolvedParentConceptions++;
      else if(parentLabels[0]!==parentLabels[1])foundingLabelCrossConceptions++;
    }
    const labels=parentLabels.join(' × ');
    const combination=foundingLabelCombinations[labels]??={attempts:0,accepted:0,conceptions:0};
    combination.attempts++;combination.accepted+=Number(event.accepted);combination.conceptions+=Number(event.conceived);
  }
  function geneMoments(sample,species){
    const totals={};
    for(const [key,cell] of Object.entries(sample.geography))if(key.startsWith(species+':')){
      for(const [gene,value] of Object.entries(cell.genes)){
        const sum=totals[gene]??={count:0,sum:0,sumSquares:0};
        sum.count+=value.count;sum.sum+=value.sum;sum.sumSquares+=value.sumSquares;
      }
    }
    return Object.fromEntries(Object.entries(totals).map(([key,value])=>[key,{count:value.count,mean:value.sum/value.count,
      variance:Math.max(0,value.sumSquares/value.count-(value.sum/value.count)**2)}]));
  }
  const rangeBySpecies={};
  for(const sample of r.samples)for(const species of Object.keys(first.population)){
    const count=sample.population[species]||0,range=rangeBySpecies[species]??={initial:first.population[species],min:Infinity,max:0,final:0};
    range.min=Math.min(range.min,count);range.max=Math.max(range.max,count);range.final=last.population[species]||0;
  }
  result.worlds.push({seed:r.seed,mode:r.mode,runtimeFingerprint:r.runtimeFingerprint,observerSha256:r.observerSha256,
    days:r.requestedDays,ticks:last.tick-first.tick,initialLive:first.live,finalLive:last.live,
    births:last.births-first.births,deaths:last.deaths-first.deaths,conceptions:r.mating.conceptions,
    completedDisplays:displays.length,mutuallyAcceptedDisplays:accepted,
    combinedDisplayAcceptanceRate:displays.length?accepted/displays.length:null,
    distanceBins:r.mating.bins,preferenceGroups,foundingLabelCombinations,foundingLabelCrossConceptions,unresolvedParentConceptions,
    parentLabelScope:'Founding labels reconstructed from retained canonical animals, deaths and births; distinct from the existing recognized evolutionary taxon.',
    bySpecies,rangeBySpecies,
    ancestralPlanRetention:Object.fromEntries(Object.entries(livingPlansBySpecies).map(([species,plans])=>[species,{
      living:Object.values(plans).reduce((a,b)=>a+b,0),
      matchingFoundingPlan:Object.entries(plans).filter(([plan])=>initialPlansBySpecies[species]?.has(plan)).reduce((sum,[,count])=>sum+count,0),
      livingPlans:plans
    }])),
    maximumObservedAncestryDepth:Math.max(...r.samples.map(s=>s.maxAncestryDepth),...r.births.map(b=>b.ancestryDepth||1)),
    lineage:{initial:first.lineage,final:last.lineage,births:r.births.filter(b=>b.lineage).length,
      deaths:r.deaths.filter(d=>d.lineage),novelPartIds:[...lineageNovelParts]},
    novelBirthBodyPlans:[...novelPlans],finalBodyPlans:last.bodyPlans,
    novelBodyExamples:[...novelPlans].map(plan=>{const child=r.births.find(b=>b.bodyPlan===plan);return{plan,species:child.species,parts:child.parts,ancestryDepth:child.ancestryDepth,bornDay:child.bornDay}}),
    recognizedTaxa:last.taxa.filter(taxon=>taxon.id!=='genvo8-root'),
    actualCrossTaxonConceptions:r.mating.crossTaxonConceptions,populationCenters:last.populationCenters,
    speciationStates:last.recognizedStates,
    inheritedGeneMoments:Object.fromEntries(Object.keys(bySpecies).map(species=>[species,{initial:geneMoments(first,species),final:geneMoments(last,species)}])),
    finalRng:state.rngState,completeStateSha256:r.completeStateSha256,saveContinuation:r.saveContinuation,
    evidence:{file,sha256:createHash('sha256').update(bytes).digest('hex'),snapshot:file+'.snapshot.v8'}});
}
assert.equal(new Set(result.worlds.map(row=>row.runtimeFingerprint)).size,1,'One unchanged runtime across the comparison');
if(!partial){
  assert.equal(new Set(result.worlds.map(row=>row.seed)).size,2);
  for(const seed of new Set(result.worlds.map(row=>row.seed))){
    assert.deepEqual(result.worlds.filter(row=>row.seed===seed).map(row=>row.mode).sort(),['balanced','original']);
  }
}
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result.worlds.map(({seed,mode,births,conceptions,finalLive,maximumObservedAncestryDepth,lineage})=>({seed,mode,births,conceptions,finalLive,maximumObservedAncestryDepth,lineage}))));
