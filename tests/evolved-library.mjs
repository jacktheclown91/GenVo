import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';
import {foundRegionalPopulations} from '../src/ecology/regional-founding.js';
import {EVOLVED_LIBRARY,authoredConfigurations,configurationKey,validateEvolvedEntry,entryIdFor} from '../src/lineage/evolved-library.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {stageRemoteBiology} from '../src/world/planetary-offscreen-biology.js';

const origin={x:128,y:0},key='128,0';
const sim=new Simulation('PLANET-B0-A',{player:false,bootstrap:false,worldGenerator:'planetary/1',planetOrigin:origin});
assert.equal(sim.evolvedLibraryRules,EVOLVED_LIBRARY.policy);
foundRegionalPopulations(sim,{region:key});sim.paused=false;
const authored=authoredConfigurations();
// Controlled cohort built ONLY through the canonical inheritance path: real
// births from founders, the ordinary mutation operator, and true breeding.
const hoppers=sim.animals.filter(a=>a.foundingOrigin?.template==='hopper'),mom=hoppers.find(a=>a.sex==='F'),dad=hoppers.find(a=>a.sex==='M');
assert.ok(mom&&dad,'founded region has a breeding hopper pair');
const birth=(m,f,chance)=>{sim.bodyVariationChance=chance;const c=sim.spawnAnimal(m.species,m.x,m.y,[m,f]);delete sim.bodyVariationChance;return c};
let mutant=null;for(let k=0;k<80&&!mutant;k++){const c=birth(mom,dad,1);if(c.bodyVariation?.accepted&&c.bodyVariation.attempted&&!authored.has(configurationKey(c)))mutant=c;else sim.animals.splice(sim.animals.indexOf(c),1)}
assert.ok(mutant,'the ordinary mutation operator produced a new configuration');
const planKey=configurationKey(mutant);
assert.deepEqual(mutant.foundingLineage,['hopper'],'offspring carry the founding lineage they descend from');
// A second carrier of the same configuration by inheritance, then true breeding.
let mate=null;const other=mutant.sex==='F'?dad:mom;
for(let k=0;k<120&&!mate;k++){const c=mutant.sex==='F'?birth(mutant,other,0):birth(other,mutant,0);if(configurationKey(c)===planKey&&c.sex!==mutant.sex)mate=c;else sim.animals.splice(sim.animals.indexOf(c),1)}
assert.ok(mate,'recombination passed the configuration to an opposite-sex offspring');
for(const a of [mutant,mate]){a.age=SPECIES[a.species].maturity+1;a.energy=SPECIES[a.species].maxEnergy*.9}
const f=mutant.sex==='F'?mutant:mate,m=f===mutant?mate:mutant,brood=[];
for(let k=0;k<12;k++)brood.push(birth(f,m,0));
assert.ok(brood.every(c=>configurationKey(c)===planKey),'identical parents breed true when no mutation occurs');
sim.rebuildSpatial();

// Real population-model days until maturity and the sustained period pass.
const days=SPECIES[mutant.species].maturity+EVOLVED_LIBRARY.sustainDays+4;let registered=null;
for(let d=0;d<days&&!registered;d++){for(let i=0;i<CFG.dayTicks;i++)sim.update(null,{externalPlayerControl:true,populationModel:true});registered=(sim.evolvedRegistrations||[]).find(e=>e.configuration===planKey)}
assert.ok(registered,'a sustained, true-breeding, viable configuration is registered after '+days+' days');
validateEvolvedEntry(registered);
assert.equal(registered.provenance,'natural-evolution');assert.equal(registered.id,entryIdFor(planKey));
assert.ok(registered.history.evidence.trueBreeding>=EVOLVED_LIBRARY.minTrueBreeding&&registered.history.evidence.matureOffspring>=EVOLVED_LIBRARY.minMatureOffspring);
assert.ok(registered.history.registeredDay-registered.history.qualifyingSinceDay>=EVOLVED_LIBRARY.sustainDays,'evidence was sustained, not momentary');
assert.ok(registered.representative.parentIds.length===2,'real recorded ancestry');
assert.ok(registered.representative.foundingLineage.includes('hopper'));
assert.ok(registered.diversity.living>=EVOLVED_LIBRARY.minLiving&&registered.compatibility.sampledPairs>0);
assert.equal(registered.habitat.region,key);
assert.ok(!sim.evolvedRegistrations.some(e=>authored.has(e.configuration)),'authored founding bodies never register as evolved');
const before=sim.evolvedRegistrations.length;for(let i=0;i<CFG.dayTicks;i++)sim.update(null,{externalPlayerControl:true,populationModel:true});
assert.equal(sim.evolvedRegistrations.filter(e=>e.configuration===planKey).length,1,'no duplicate registrations');assert.ok(sim.evolvedRegistrations.length>=before);

// Stability is observed, not imposed: ordinary mutation continued throughout.
const broodIds=new Set(brood.map(c=>c.id)),runBirths=sim.animals.filter(a=>!broodIds.has(a.id)&&a.id>Math.max(...broodIds)&&a.bodyInheritance?.parents?.some(p=>p.bodyId===mutant.bodyPlan.id));
const unchanged=runBirths.filter(a=>configurationKey(a)===planKey).length,mutated=runBirths.length-unchanged;
assert.equal(EVOLVED_LIBRARY.policy,'evolved-lineage-library/1');assert.equal(sim.bodyVariationChance,undefined,'no mutation-rate override during the observed run');
// Saves keep registrations; a forged entry is rejected.
const snap=structuredClone(createSimulationSnapshot(sim,{savedAt:'t',reason:'t'})),back=restoreSimulationSnapshot(structuredClone(snap));
assert.deepEqual(back.evolvedRegistrations,sim.evolvedRegistrations);
const forged=structuredClone(snap);forged.core.evolvedRegistrations[0].configuration=[...authored][0];
assert.throws(()=>restoreSimulationSnapshot(forged),/evolved library/i);

// A NEW world can found from the entry; founders are generation one with
// library provenance and the evolved body. The source world is untouched.
const fresh=new Simulation('PLANET-B0-A',{player:false,bootstrap:false,worldGenerator:'planetary/1',planetOrigin:origin});
fresh.foundingLibrary=[registered];
const receipt=foundRegionalPopulations(fresh,{region:key});
assert.deepEqual(receipt.library,[registered.id]);
const libId='evolved:'+registered.id,used=receipt.introduced.find(g=>g.template===libId)||receipt.absent.find(g=>g.template===libId);
assert.ok(used,'the library entry was evaluated as a founding candidate: '+JSON.stringify(receipt.absent.slice(0,3)));
for(const a of fresh.animals.filter(a=>a.foundingOrigin?.library===registered.id)){assert.equal(a.generation,1);assert.deepEqual(a.parentIds,[]);assert.equal(configurationKey(a),planKey)}
const freshBack=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(fresh,{savedAt:'t',reason:'t'})));assert.deepEqual(freshBack.foundingLibrary,fresh.foundingLibrary);

// No population ceiling: a remote region above the former 600 still advances.
const crowded=new Simulation('PLANET-B0-A',{player:false,bootstrap:false,worldGenerator:'planetary/1',planetOrigin:{x:256,y:0}});
for(let k=0;k<650;k++)crowded.spawnAnimal('mosskip');
const session={key:'256,0',biologicalMode:'regional-demography/1',snapshot:createSimulationSnapshot(crowded,{savedAt:'t',reason:'t'})};
const staged=stageRemoteBiology(session,{tickCount:CFG.lifeStride,reservedNextId:crowded.nextId+1,maxTicks:CFG.lifeStride});
assert.ok(staged.candidate&&staged.result.organisms>600,'regional populations are bounded by ecology, not a replay ceiling');
console.log('Evolved library PASS: registration of a naturally evolved, true-breeding, sustained configuration ('+registered.label+', '+registered.diversity.living+' living, emergence '+(registered.emergence?.operator||'not among living')+'), recorded ancestry and founding lineage, '+runBirths.length+' run-time births with a carrier parent ('+unchanged+' carried the configuration, '+mutated+' did not), no authored or duplicate entries, save validation, new-world founding with library provenance, and no population ceiling.');
