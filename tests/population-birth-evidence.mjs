import assert from 'node:assert/strict';
import {conceptionPopulationEvidence} from '../src/lineage/population-birth-evidence.js';
import {paternalInheritance} from '../src/ecology/gestation.js';
import {SpeciationController} from '../src/lineage/speciation.js';
import {AUTONOMOUS_EVOLUTION} from '../src/lineage/autonomous-evolution.js';

// Controlled demographic witnesses; no mating, taxon or population is created here.
const regional={key:'source',scope:'regional-source',candidateKeys:new Set()};
const local={key:'deme',scope:'local',sourcePopulationKey:'source',candidateKeys:new Set(['old-candidate'])};
const other={key:'neighbor',scope:'local',sourcePopulationKey:'source',candidateKeys:new Set()};
const populations=[regional,local,other];
const memory={populationForAnimal:a=>populations.find(p=>p.key===a.currentPopulation)};
const sim={autonomousEvolutionRules:AUTONOMOUS_EVOLUTION.policy,day:20,tickCount:800,
 populationMemory:memory,evolutionTree:{taxonFor:a=>a.taxonId||'ancestral-root'},
 protoSpeciation:{sourcePopulationFor:a=>populations.find(p=>p.key===a.currentPopulation)}};
const controller=new SpeciationController(sim);controller.populations=()=>populations;
let nextChild=100;
function parent(id,currentPopulation,taxonId){return{id,alive:true,species:'mosskip',lineage:false,currentPopulation,taxonId,energy:80}}
function conceived(a){return paternalInheritance(a,{population:conceptionPopulationEvidence(sim,a)})}
function birth(pop,a,b){const child={id:nextChild++,alive:true,species:'mosskip',lineage:false,generation:3,currentPopulation:pop};const event=controller.noteBirth(child,[],[a,b]);return{child,event}}
const a=parent(1,'deme'),b=parent(2,'deme'),savedA=conceived(a),savedB=conceived(b);
assert.equal(savedA.evolutionaryPopulationAtConception.key,'deme');
a.currentPopulation='neighbor';a.alive=false;
const first=birth('deme',savedA,savedB);
assert.equal(first.event.cross,false,'A death or later migration does not rewrite the observed conception');
assert.equal(controller.geneFlowFor('deme').local,1);assert.equal(controller.geneFlowFor('source').local,1,'Nested deme birth is also within its actual regional source');
assert.equal(controller.noteBirth(first.child,[],[savedA,savedB]),null,'Repeated bookkeeping cannot invent more births');
const outsider=conceived(parent(3,'neighbor'));
birth('deme',savedB,outsider);
assert.equal(controller.geneFlowFor('deme').cross,1,'Inter-deme reproduction remains gene flow');
assert.equal(controller.geneFlowFor('source').cross,0,'Sibling demes do not invent inter-region gene flow');
const differentTaxon=conceived(parent(4,'deme','recognized-related-branch'));
birth('deme',savedB,differentTaxon);
assert.equal(controller.geneFlowFor('deme').cross,2,'Co-resident distinct taxa retain actual hybrid flow');
assert.equal(controller.geneFlowFor('source').cross,1);
birth('deme',paternalInheritance(parent(5,'deme')),savedB);
assert.equal(controller.geneFlowFor('deme').cross,2);assert.equal(controller.geneFlowFor('deme').unknown,1,'Missing conception provenance is neither local-only breeding nor observed renewed flow');
assert.equal(controller.geneFlowFor('deme').knownRatio,2/3);
const alias=structuredClone(savedB);alias.evolutionaryPopulationAtConception.key='old-candidate';
birth('deme',alias,savedB);assert.equal(controller.geneFlowFor('deme').local,2,'Use the founding authority candidate alias, not a new population registry');
for(let n=0;n<120;n++)birth('neighbor',outsider,outsider);
assert.ok(controller.geneFlowFor('deme').total>=5,'A prolific neighbor cannot evict a rare deme from a global 96-birth cap');
assert.equal(controller.geneFlowFor('neighbor').total,12,'The existing recent twelve-event evidence window remains unchanged');
sim.day=80;controller.trimBirths();assert.equal(controller.births.length,0,'The original 48-day evidence horizon remains unchanged');
const invalid=structuredClone(savedB);invalid.evolutionaryPopulationAtConception.rules='unknown/1';
assert.throws(()=>birth('deme',invalid,savedB),/Unknown conception population/);
delete sim.autonomousEvolutionRules;assert.equal(conceptionPopulationEvidence(sim,b),undefined);
assert.equal(Object.hasOwn(paternalInheritance(b,{population:conceptionPopulationEvidence(sim,b)}),'evolutionaryPopulationAtConception'),false,'Old gestation shape stays exact');
console.log('Population birth evidence PASS: actual conception witnesses, dead/migrant parents, nested source/deme flow, compatible taxon mixing, unknown provenance and per-population retention without player ownership.');
