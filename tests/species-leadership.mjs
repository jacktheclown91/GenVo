import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {ROOT_TAXON_ID} from '../src/lineage/evolution-tree.js';

const sim=new Simulation('GENVO8-SPECIES-LEADERSHIP',{player:true}),p=sim.player(),tree=sim.evolutionTree;
const starter=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id);
assert.ok(p&&starter&&tree);
p.age=SPECIES.genvo.maturity+8;starter.age=SPECIES.genvo.maturity+8;

function descendant(x,generation=4){
  const a=sim.spawnAnimal('genvo',p.x+x,p.y,[p,starter]);a.lineage=true;a.generation=generation;a.age=SPECIES.genvo.maturity+4;a.energy=SPECIES.genvo.maxEnergy*.9;a.hydration=SPECIES.genvo.maxHydration*.9;a.health=100;sim.lineage.register(a,[p.id]);return a;
}
const rootHeir=descendant(4,5),branchHeir=descendant(2,4);
const popKey='center:leadership',branch={id:'center-leadership:range-sense',label:'Range GenVo',populationKey:popKey,populationLabel:'Ranging Band',traitId:'range-sense',pressure:'competition',recognizedDay:sim.day,recognizedGeneration:4,parentId:ROOT_TAXON_ID,parentLabel:'GenVo8',treeDepth:1};
sim.speciation.states.set(popKey,{populationKey:popKey,populationLabel:'Ranging Band',recognized:true,branch,progress:1,qualifyingDays:2,weakDays:0,lastEvaluationDay:0,lastSnapshot:null,recognizedDay:sim.day,recognizedGeneration:4});
branchHeir.speciesBranch={...branch};tree.nodes.set(branch.id,{...branch,depth:1,originPopulationKey:popKey,originPopulationLabel:'Ranging Band',formedDay:sim.day,formedGeneration:4,status:'living',endedDay:null,endedReason:null,recognitions:1,memberIds:new Set()});tree.onIdentityAssigned(branchHeir,branch);
assert.equal(tree.livingTaxa().length,2,'staging has ancestral and descendant living taxa');

// With multiple taxa, guidance follows the active taxon by default.
assert.equal(sim.familyDirectives.scopeMeta().scope,'taxon');
assert.equal(sim.familyDirectives.scopeMeta().label,'GenVo');
assert.equal(sim.familyDirectives.commandable().includes(rootHeir),true);
assert.equal(sim.familyDirectives.commandable().includes(branchHeir),false,'descendant taxon is autonomous under ancestral species guidance');
sim.familyDirectives.set('follow');
assert.equal(sim.familyDirectives.decision(rootHeir)?.intent,'family-follow');
assert.equal(sim.familyDirectives.decision(branchHeir),null);

// Explicit lineage-wide guidance can cross the species boundary.
let scope=sim.familyDirectives.toggleScope();assert.equal(scope.scope,'lineage');
assert.equal(sim.familyDirectives.commandable().includes(branchHeir),true);
assert.equal(sim.familyDirectives.decision(branchHeir)?.intent,'family-follow');

// Local marks remember the taxon they were issued to even if scope later changes.
sim.familyDirectives.set('auto');sim.familyDirectives.setScope('taxon');
assert.equal(sim.familyDirectives.setAreaOrder('gather',{x:p.x+1,y:p.y+1},'test'),true);
assert.equal(sim.familyDirectives.areaStatus().order.taxonId,ROOT_TAXON_ID);
sim.familyDirectives.setScope('lineage');
assert.equal(sim.familyDirectives.decision(branchHeir),null,'old species-local mark does not leak onto another taxon');

// Mate discovery makes gene flow deliberate: same-taxon candidates rank before a closer cross-taxon mate.
const opposite=p.sex==='F'?'M':'F';
const localMate=sim.spawnAnimal('genvo',p.x+5,p.y);localMate.sex=opposite;localMate.age=SPECIES.genvo.maturity+5;localMate.energy=SPECIES.genvo.maxEnergy*.9;localMate.hydration=SPECIES.genvo.maxHydration*.9;localMate.health=100;localMate.reproCooldown=0;
const crossMate=sim.spawnAnimal('genvo',p.x+1.2,p.y);crossMate.sex=opposite;crossMate.age=SPECIES.genvo.maturity+5;crossMate.energy=SPECIES.genvo.maxEnergy*.9;crossMate.hydration=SPECIES.genvo.maxHydration*.9;crossMate.health=100;crossMate.reproCooldown=0;crossMate.speciesBranch={...branch};tree.onIdentityAssigned(crossMate,branch);
// Same taxon is a search tendency weighed with inherited preference, not a barrier (creator
// decision 2026-10-15; strong-preference hybrids are tested in species-coexistence.mjs). With
// neutral preferences the nearby same-taxon mate is presented first, and gene flow stays listed.
for(const b of [p,localMate,crossMate])b.matePreferences={...(b.matePreferences||{}),weights:{size:0,strength:0,ornament:0,display:0,behavior:0},selectivity:.5,similarity:0};
localMate.x=p.x+1.6;localMate.y=p.y;crossMate.x=p.x-1.2;crossMate.y=p.y;
sim.rebuildSpatial();
const mates=sim.reproduction.eligibleMates();const crossIndex=mates.findIndex(a=>a.id===crossMate.id);assert.ok(crossIndex>0,'cross-taxon mate remains available');assert.equal(tree.sameTaxon(p,mates[0]),true,'same-taxon mate is presented before closer gene-flow candidate');
assert.equal(sim.reproduction.taxonRelation(p,crossMate).kind,'gene-flow');

// Succession prefers the current taxon, but a deliberate cross-branch handoff is still allowed and recorded.
const heirs=sim.lineage.eligibleHeirs();assert.equal(heirs[0].id,rootHeir.id,'same-taxon successor is preferred');
assert.equal(sim.lineage.handoffTo(branchHeir.id,{manual:true}),true);
const handoff=sim.lineage.lastHandoff();assert.equal(handoff.crossTaxon,true);assert.equal(handoff.fromTaxon.label,'GenVo');assert.equal(handoff.toTaxon.label,'Range GenVo');
assert.equal(sim.familyDirectives.scopeMeta().label,'Range GenVo','species guidance follows the new active taxon after cross-branch handoff');

const leadership=tree.leadershipSnapshot(sim.player());assert.equal(leadership.label,'Range GenVo');assert.ok(leadership.otherLiving>=1);
console.log('species-level leadership checks: PASS');
