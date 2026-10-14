import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {ROOT_TAXON_ID} from '../src/lineage/evolution-tree.js';
import {SPECIES} from '../src/organisms/species.js';
import {setForm,setProto,formReading,protoReading,migrateLegacyReadings} from '../src/lineage/readings.js';

const sim=new Simulation('GENVO8-EVOLUTION-TREE',{player:true}),tree=sim.evolutionTree,spec=sim.speciation,founder=sim.player();
assert.ok(tree&&spec&&founder);

function center(id,label,x,y){const c={id,kind:'range-band',form:'forager',x,y,label,generation:4,animalId:founder.id,createdDay:sim.day,createdTick:sim.tickCount};sim.generationProgress.populationCenters.push(c);return c}
const aCenter=center(901,'North Reach',founder.x+24,founder.y),aPop={...aCenter,key:'center:901',primary:false};
const aAnimal=sim.spawnAnimal('genvo',aCenter.x,aCenter.y);aAnimal.lineage=true;aAnimal.age=SPECIES.genvo.maturity+4;aAnimal.generation=6;setProto(aAnimal,{id:'range-sense',pressure:'competition',populationKey:aPop.key,populationLabel:aPop.label,originPopulationKey:aPop.key,originPopulationLabel:aPop.label,strength:.5,lineageDepth:3,inheritanceState:'reinforced'});sim.lineage.register(aAnimal,[]);
sim.populationMemory.residence.set(aAnimal.id,{days:{[aPop.key]:9},lastKey:aPop.key,lastDay:sim.day});

let branchA={id:'center-901:range-sense',label:'Range GenVo',populationKey:aPop.key,populationLabel:aPop.label,traitId:'range-sense',pressure:'competition',recognizedDay:sim.day,recognizedGeneration:6};
branchA=tree.onRecognize(branchA,{pop:aPop,cohort:[aAnimal]});spec.states.set(aPop.key,{populationKey:aPop.key,populationLabel:aPop.label,recognized:true,branch:branchA,progress:1,qualifyingDays:2,weakDays:0,lastEvaluationDay:0,lastSnapshot:null,recognizedDay:sim.day,recognizedGeneration:6});
aAnimal.speciesBranch={...branchA};tree.onIdentityAssigned(aAnimal,branchA);
assert.equal(branchA.parentId,ROOT_TAXON_ID,'first descendant species branches from ancestral GenVo8');
assert.equal(tree.currentBranchFor(aAnimal)?.id,branchA.id);
assert.equal(sim.lineage.records.get(aAnimal.id).speciesBranchHistory.length,1,'lineage record keeps species membership history');

const bCenter=center(902,'Far Basin',aCenter.x+21,aCenter.y+8),bPop={...bCenter,key:'center:902',primary:false};
const migrant=sim.spawnAnimal('genvo',bCenter.x,bCenter.y);migrant.lineage=true;migrant.age=SPECIES.genvo.maturity+5;migrant.generation=8;setProto(migrant,{id:'dryland-skin',pressure:'dryness',populationKey:bPop.key,populationLabel:bPop.label,originPopulationKey:bPop.key,originPopulationLabel:bPop.label,strength:.55,lineageDepth:4,inheritanceState:'reinforced'});migrant.speciesBranch={...branchA};sim.lineage.register(migrant,[]);tree.onIdentityAssigned(migrant,branchA);
let branchB={id:'center-902:dryland-skin',label:'Dryland GenVo',populationKey:bPop.key,populationLabel:bPop.label,traitId:'dryland-skin',pressure:'dryness',recognizedDay:sim.day,recognizedGeneration:8};
branchB=tree.onRecognize(branchB,{pop:bPop,cohort:[migrant]});
assert.equal(branchB.parentId,branchA.id,'a later split can branch from a living descendant species');
assert.equal(branchB.parentLabel,'Range GenVo');
assert.equal(tree.node(branchB.id).depth,2,'second-order branch is represented below its parent');

// Restore A as the current identity for independent live-taxon counting, then add B.
migrant.speciesBranch={...branchB};spec.states.set(bPop.key,{populationKey:bPop.key,populationLabel:bPop.label,recognized:true,branch:branchB,progress:1,qualifyingDays:2,weakDays:0,lastEvaluationDay:0,lastSnapshot:null,recognizedDay:sim.day,recognizedGeneration:8});tree.onIdentityAssigned(migrant,branchB);
let snap=tree.snapshot(),root=snap.find(n=>n.id===ROOT_TAXON_ID),nodeA=snap.find(n=>n.id===branchA.id),nodeB=snap.find(n=>n.id===branchB.id);
assert.ok(root.living>=1,'ancestral GenVo8 remains a simultaneous living taxon');
assert.equal(nodeA.living,1,'first descendant species tracks its living population independently');
assert.equal(nodeB.living,1,'second descendant species tracks its living population independently');
assert.match(tree.summaryLine(),/3 living taxa/);
assert.match(tree.treeLines().join('\n'),/└ Dryland GenVo/);

// Rejoining clears current identity but never erases the historical branch node or record history.
spec.collapse(spec.stateFor(aPop.key),'renewed inter-population breeding');
assert.equal(tree.node(branchA.id).status,'rejoined');
assert.equal(aAnimal.speciesBranch,undefined);
assert.equal(sim.lineage.records.get(aAnimal.id).speciesBranch,null);
assert.equal(sim.lineage.records.get(aAnimal.id).speciesBranchHistory[0].id,branchA.id,'rejoined species remains in lineage history');
assert.ok(tree.snapshot().some(n=>n.id===branchA.id&&n.status==='rejoined'),'rejoined node remains in the evolutionary tree');

// Extinction is a different historical outcome and also remains visible.
tree.onBoundaryEnded(branchB,'population extinction',{extinct:true});delete migrant.speciesBranch;spec.states.get(bPop.key).recognized=false;spec.states.get(bPop.key).branch=null;
snap=tree.snapshot();nodeB=snap.find(n=>n.id===branchB.id);assert.equal(nodeB.status,'extinct');assert.equal(nodeB.living,0);assert.ok(nodeB.historicalMembers>=1,'extinct branch preserves known historical members');
assert.match(tree.summaryLine(),/extinct/);

console.log('evolutionary-tree checks: PASS');
