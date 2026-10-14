import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {ROOT_TAXON_ID} from '../src/lineage/evolution-tree.js';

const sim=new Simulation('GENVO8-SPECIES-COEXIST',{player:true}),p=sim.player(),tree=sim.evolutionTree;
const starter=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id);
assert.ok(p&&starter&&sim.speciesCoexistence);
p.age=SPECIES.genvo.maturity+10;starter.age=SPECIES.genvo.maturity+8;

// Find a dry block far enough from the founder home to stage a descendant origin.
const size=sim.territory.cellSize;
let site=null;
for(let cy=4;cy<16&&!site;cy++)for(let cx=4;cx<16&&!site;cx++){
  const x=(cx+.5)*size,y=(cy+.5)*size;
  if(Math.hypot(x-p.x,y-p.y)<18||sim.world.water[sim.world.idx(x,y)])continue;
  let dry=true;for(let oy=-1;oy<=1&&dry;oy++)for(let ox=-1;ox<=1;ox++){const xx=x+ox*size*.55,yy=y+oy*size*.55;if(sim.world.water[sim.world.idx(xx,yy)]){dry=false;break}}
  if(dry)site={x,y,cx,cy};
}
assert.ok(site,'found dry descendant range');
// Isolate the staged lineage interaction from unrelated ambient wildlife. A richer
// species roster must not make the cross-taxon pressure test saturate on wild competitors.
for(const a of sim.animals){if(a.species==='genvo'||Math.hypot(a.x-site.x,a.y-site.y)>28)continue;
  const remote=sim.safeSpawn(a.species,{x:site.x+47,y:site.y+47});a.x=remote.x;a.y=remote.y;
}sim.rebuildSpatial();sim.sustainability.invalidate();

const center=sim.generationProgress.addPopulationCenter({kind:'range-band',x:site.x,y:site.y,label:'Ranging Band',form:'forager',generation:4,animalId:p.id});
const popKey=`center:${center.id}`;
const branch={id:`${popKey}:range-sense`,label:'Range GenVo',populationKey:popKey,populationLabel:center.label,traitId:'range-sense',pressure:'competition',recognizedDay:sim.day,recognizedGeneration:4,parentId:ROOT_TAXON_ID,parentLabel:'GenVo8',treeDepth:1};
sim.speciation.states.set(popKey,{populationKey:popKey,populationLabel:center.label,recognized:true,branch,progress:1,qualifyingDays:2,weakDays:0,lastEvaluationDay:0,lastSnapshot:null,recognizedDay:sim.day,recognizedGeneration:4});
tree.nodes.set(branch.id,{...branch,depth:1,originPopulationKey:popKey,originPopulationLabel:center.label,formedDay:sim.day,formedGeneration:4,status:'living',endedDay:null,endedReason:null,recognitions:1,memberIds:new Set()});

function makeLineage(x,y,taxon='root',sex='M'){
  const a=sim.spawnAnimal('genvo',x,y);a.lineage=true;a.generation=5;a.age=SPECIES.genvo.maturity+5;a.energy=SPECIES.genvo.maxEnergy*.92;a.hydration=SPECIES.genvo.maxHydration*.92;a.health=100;a.sex=sex;a.reproCooldown=0;sim.lineage.register(a,[p.id]);
  if(taxon==='branch'){a.speciesBranch={...branch};tree.onIdentityAssigned(a,branch);sim.populationMemory.residence.set(a.id,{days:{[popKey]:6},lastKey:popKey,lastDay:sim.day})}
  else sim.populationMemory.residence.set(a.id,{days:{home:6},lastKey:'home',lastDay:sim.day});
  return a;
}
const branchAdults=[makeLineage(site.x-.9,site.y-.5,'branch','M'),makeLineage(site.x+.7,site.y+.3,'branch','F'),makeLineage(site.x+.2,site.y+1.1,'branch','M')];
const rootIntruders=[makeLineage(site.x-1.2,site.y+1.2,'root','F'),makeLineage(site.x+1.3,site.y-.8,'root','M'),makeLineage(site.x+1.5,site.y+1.1,'root','F')];

// Keep the staged range well fed so cross-taxon overlap is the changing pressure.
for(let y=Math.floor(site.y)-7;y<=Math.floor(site.y)+7;y++)for(let x=Math.floor(site.x)-7;x<=Math.floor(site.x)+7;x++){
  const i=sim.world.idx(x,y);if(sim.world.water[i])continue;if(sim.world.plants.sunmoss)sim.world.plants.sunmoss[i]=Math.max(sim.world.plants.sunmoss[i],.85);if(sim.world.plants.bramble)sim.world.plants.bramble[i]=Math.max(sim.world.plants.bramble[i],.65);
}
sim.rebuildSpatial();sim.sustainability.invalidate();
assert.equal(tree.livingTaxa().length,2);

const pressured=sim.populationEcology.centerState(center,{force:true});
assert.equal(pressured.ownerTaxonId,branch.id,'descendant range is evaluated for its living branch');
assert.ok(pressured.lineageCompetitors>=3,'ancestral GenVo8 sharing the range count as real cross-taxon competitors');
const pressuredScore=pressured.score,pressuredCapacity=pressured.capacity;

// Removing the ancestral overlap improves the exact same site's ecology.
for(const a of rootIntruders){a.x=Math.min(124,site.x+32);a.y=Math.min(124,site.y+28)}
sim.rebuildSpatial();sim.sustainability.invalidate();
const separated=sim.populationEcology.centerState(center,{force:true});
assert.equal(separated.lineageCompetitors,0);
assert.ok(separated.score>pressuredScore||separated.capacity>pressuredCapacity,'separating taxa improves local carrying quality');

// Put the overlap back and confirm the branch receives its own population goal.
for(let i=0;i<rootIntruders.length;i++){rootIntruders[i].x=site.x-1.2+i*1.1;rootIntruders[i].y=site.y+1.2-i*.7}
sim.rebuildSpatial();sim.speciesCoexistence.cache.clear();sim.speciesCoexistence.cacheSegment=-1;
const branchState=sim.speciesCoexistence.snapshotForTaxon(branch.id,{force:true});
assert.equal(branchState.priority,'separate');
assert.ok(branchState.target&&Number.isFinite(branchState.target.x));
const autoCandidate=branchAdults.find(a=>a.id%2===0)||branchAdults[0];
if(autoCandidate.id%2!==0){ // separation uses every second deterministic adult
  const extra=makeLineage(site.x-.2,site.y-.2,'branch','M');branchAdults.push(extra);
}
const mover=branchAdults.find(a=>a.id%2===0);
assert.equal(sim.speciesCoexistence.autonomousDecision(mover)?.intent,'species-separate');

// Autonomous breeding prefers a same-taxon mate even if a gene-flow mate is closer.
const actor=branchAdults.find(a=>a.sex==='M'),sameMate=branchAdults.find(a=>a.sex==='F');
const crossMate=rootIntruders.find(a=>a.sex==='F');
actor.x=site.x;actor.y=site.y;sameMate.x=site.x+4.8;sameMate.y=site.y;crossMate.x=site.x+.8;crossMate.y=site.y;
actor.reproCooldown=sameMate.reproCooldown=crossMate.reproCooldown=0;sim.rebuildSpatial();
assert.equal(sim.autonomousMateTarget(actor,{far:true})?.id,sameMate.id,'autonomous mate search prefers its own living taxon before gene flow');

// Stage enough learned range and shelter capacity for a taxon-scoped satellite settlement.
sim.shelter.shelters.length=0;sim.shelter.nextId=2;sim.shelter.shelters.push({id:1,ownerId:p.id,x:p.x,y:p.y,integrity:100,weatherSeal:1,foodStore:8,capacity:28,kind:'primary',constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount});
const allAdults=[p,starter,...branchAdults,...rootIntruders];
const offsets=[[0,0],[1,0],[-1,0],[0,1],[1,1],[-1,1],[0,-1],[1,-1],[-1,-1],[2,0],[2,1],[-2,0]];
offsets.forEach((off,i)=>{const a=allAdults[i%allAdults.length],cx=Math.floor(p.x/size)+off[0],cy=Math.floor(p.y/size)+off[1],x=(cx+.5)*size,y=(cy+.5)*size;if(x<2||y<2||x>126||y>126||sim.world.water[sim.world.idx(x,y)])return;const st=sim.territory.ensure(a),key=`${cx},${cy}`;st.cells.set(key,{key,cx,cy,x,y,visits:4,lastTick:sim.tickCount});st.home={x:p.x,y:p.y};st.radius=11;st.established=true;st.totalFamiliarity=10});
// Use the already-established branch range as the settlement target and replenish material.
for(let y=Math.floor(site.y)-3;y<=Math.floor(site.y)+3;y++)for(let x=Math.floor(site.x)-3;x<=Math.floor(site.x)+3;x++){const i=sim.world.idx(x,y);if(sim.world.water[i])continue;if(sim.world.plants.sunmoss)sim.world.plants.sunmoss[i]=1;if(sim.world.plants.bramble)sim.world.plants.bramble[i]=.8}
// Make the target familiar to branch adults too.
for(const a of branchAdults){const st=sim.territory.ensure(a),cx=Math.floor(site.x/size),cy=Math.floor(site.y/size),key=`${cx},${cy}`;st.cells.set(key,{key,cx,cy,x:(cx+.5)*size,y:(cy+.5)*size,visits:5,lastTick:sim.tickCount});st.home={x:site.x,y:site.y};st.radius=10;st.established=true;st.totalFamiliarity=8}
for(const a of sim.animals){if(SPECIES[a.species]?.hunter){a.x=2+(a.id%3);a.y=2+((a.id*2)%3)}}
sim.generationProgress.unlocks.add('kin-network');sim.rebuildSpatial();sim.sustainability.invalidate();

const pref=sim.speciesCoexistence.settlementPreference(branch.id,site);
const project=sim.shelter.beginNestProject(site,'test',{scope:'taxon',taxonId:branch.id,taxonLabel:branch.label,preference:pref});
assert.equal(project.ok,true,project.reason||'branch nest should start');
const pr=project.project;assert.equal(pr.taxonId,branch.id);
// Place one same-taxon and one other-taxon adult on the project. Only the branch worker should contribute.
const worker=branchAdults[0],outsider=rootIntruders[0];for(const a of branchAdults){if(a.id!==worker.id){a.x=pr.x+8+(a.id%2);a.y=pr.y+8+((a.id*2)%2)}}worker.x=pr.x;worker.y=pr.y;outsider.x=pr.x+.2;outsider.y=pr.y+.2;worker.energy=outsider.energy=SPECIES.genvo.maxEnergy;sim.rebuildSpatial();
const before=pr.progress;sim.shelter.phaseNestProjects();assert.ok(pr.progress>before,'matching taxon can build its settlement');
const oneWorkerGain=pr.progress-before;
// A second phase with only the outsider present should add nothing.
worker.x=pr.x+8;worker.y=pr.y+8;sim.rebuildSpatial();const held=pr.progress;sim.shelter.phaseNestProjects();assert.equal(pr.progress,held,'other taxon cannot work a taxon-scoped settlement');
// Finish with matching workers and verify branch shelter + population center.
for(const a of branchAdults){a.x=pr.x+(a.id%3)*.2;a.y=pr.y+(a.id%2)*.2;a.energy=SPECIES.genvo.maxEnergy}
sim.rebuildSpatial();for(let i=0;i<80&&!pr.complete;i++)sim.shelter.phaseNestProjects();assert.equal(pr.complete,true,'taxon settlement completes');
const sh=sim.shelter.shelters.find(s=>s.id===pr.shelterId);assert.equal(sh.taxonId,branch.id);assert.equal(sim.shelter.familyCanUse(branchAdults[0],sh),true);assert.equal(sim.shelter.familyCanUse(rootIntruders[0],sh),false,'branch shelter is not automatically shared across taxa');
const speciesCenter=sim.generationProgress.centers().find(c=>c.shelterId===sh.id&&c.kind==='species-settlement');assert.ok(speciesCenter);assert.equal(speciesCenter.taxonId,branch.id);
assert.ok(oneWorkerGain>0);

console.log('species coexistence gameplay checks: PASS');
