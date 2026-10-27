import assert from 'node:assert/strict';
import {mergeEvolutionaryTreeHistory,evolutionaryHistoryForBodies} from '../src/lineage/evolution-tree-history.js';
import {recordedRegionalTaxonCensus,validateRecordedTaxonCensus} from '../src/lineage/evolution-tree-census.js';
import {AUTONOMOUS_EVOLUTION} from '../src/lineage/autonomous-evolution.js';

// Controlled saved-history fixtures, not ecological or species emergence proof.
const root={id:'root',label:'Recorded root',parentId:null,depth:0,kind:'founding',
  species:'genvo',originPopulationKey:null,traitId:null,formedDay:1,
  formedGeneration:1,status:'living',endedDay:null,endedReason:null,
  recognitions:0,memberIds:new Set([1])};
const branch={id:'branch',label:'Recorded branch',parentId:'root',depth:1,
  originPopulationKey:'natural:-128,0:1',traitId:'anatomy:walking-leg:gain',
  formedDay:2,formedGeneration:4,status:'living',endedDay:null,
  endedReason:null,recognitions:1,memberIds:new Set([1])};
const formed={type:'formed',day:2,generation:4,branchId:'branch',parentId:'root'};
const target={nodes:new Map([['root',root],['branch',branch]]),events:[formed]};
const source=structuredClone(target);
source.nodes.get('root').memberIds.add(2);
Object.assign(source.nodes.get('branch'),{status:'rejoined',endedDay:3,endedReason:'Recorded gene flow'});
source.nodes.get('branch').memberIds.add(2);
source.events.push({type:'rejoined',day:3,generation:4,branchId:'branch',reason:'Recorded gene flow'});
const originalTarget=structuredClone(target),originalSource=structuredClone(source);
const merged=mergeEvolutionaryTreeHistory(target,source);
assert.deepEqual(target,originalTarget);assert.deepEqual(source,originalSource);
assert.deepEqual([...merged.nodes.get('branch').memberIds],[1,2]);
assert.equal(merged.nodes.get('branch').status,'rejoined');
assert.deepEqual(merged.events,source.events);
assert.deepEqual(mergeEvolutionaryTreeHistory(merged,source),merged,'Repeated publication is idempotent');
assert.deepEqual(mergeEvolutionaryTreeHistory(merged,target),merged,'Older checkpoint cannot restore an ended boundary');

const sameDay=structuredClone(source);sameDay.nodes.get('branch').endedDay=2;sameDay.events[1].day=2;
assert.equal(mergeEvolutionaryTreeHistory(target,sameDay).nodes.get('branch').status,'rejoined',
  'A recorded same-day event-chain extension retains its actual order');
const duplicates=structuredClone(target);duplicates.events.push(structuredClone(formed));
assert.equal(mergeEvolutionaryTreeHistory(duplicates,target).events.length,2,
  'Historical identical-event multiplicity is never rewritten');

const conflicting=structuredClone(source);conflicting.nodes.get('branch').originPopulationKey='natural:128,0:1';
assert.throws(()=>mergeEvolutionaryTreeHistory(target,conflicting),/Conflicting recorded taxon identity/);
const cyclic=structuredClone(source);cyclic.nodes.set('cycle',{...branch,id:'cycle',parentId:'cycle'});
assert.throws(()=>mergeEvolutionaryTreeHistory(target,cyclic),/Cyclic recorded/);
const missing=structuredClone(source);missing.nodes.set('orphan',{...branch,id:'orphan',parentId:'absent'});
assert.throws(()=>mergeEvolutionaryTreeHistory(target,missing),/Missing recorded/);
assert.deepEqual(target,originalTarget,'Failed merges are read-only');

const carrier={id:1,evolutionaryAncestry:{rootId:'root',parentTaxonIds:['branch']},
  speciesBranch:{id:'branch'},speciesBranchHistory:[{id:'branch'}],
  pregnant:{maternalInheritance:{id:1,evolutionaryAncestry:{rootId:'root',parentTaxonIds:[]}},
    paternalInheritance:{id:2,speciesBranch:{id:'branch'},
      evolutionaryPopulationAtConception:{taxonId:'branch'}}}};
const payload=evolutionaryHistoryForBodies(source,[carrier]);
assert.equal(payload.nodes.size,2);assert.deepEqual(payload.events,source.events);
assert.deepEqual(source,originalSource);
assert.throws(()=>evolutionaryHistoryForBodies(target,[carrier]),/tree membership/,
  'A carrier cannot manufacture a parent membership absent from the authority');
assert.throws(()=>evolutionaryHistoryForBodies(source,[{evolutionaryAncestry:{rootId:'absent'}}]),/lacks recorded/);
const adopted=mergeEvolutionaryTreeHistory({nodes:new Map([['root',{...root,kind:undefined,species:undefined,
  originPopulationKey:'home',memberIds:new Set()}]]),events:[]},source);
assert.equal(adopted.nodes.get('root').kind,'founding');
assert.deepEqual([...adopted.nodes.get('root').memberIds],[1,2]);
// A persisted projection derives only from actual owned bodies and the same
// recorded identity read. It cannot invent a living taxon or lose its owner.
const owned={core:{tickCount:8,autonomousEvolutionRules:AUTONOMOUS_EVOLUTION.policy},
  controllers:{evolutionTree:source},animals:[
    {id:1,alive:true,evolutionaryAncestry:{rootId:'root',parentTaxonIds:[]},speciesBranch:{id:'branch'}},
    {id:2,alive:true,evolutionaryAncestry:{rootId:'root',parentTaxonIds:[]}},
    {id:3,alive:false,evolutionaryAncestry:{rootId:'root',parentTaxonIds:[]}},
  ]};
const censusBefore=structuredClone(owned),projection=recordedRegionalTaxonCensus(owned);
assert.deepEqual(projection.counts,[{id:'branch',living:1},{id:'root',living:1}]);
assert.deepEqual(owned,censusBefore);
validateRecordedTaxonCensus(projection,{tick:8,living:2});
assert.throws(()=>validateRecordedTaxonCensus(projection,{tick:9,living:2}),/Invalid recorded/);
assert.throws(()=>validateRecordedTaxonCensus(projection,{tick:8,living:3}),/does not match/);
const duplicate=structuredClone(projection);duplicate.counts.push({...duplicate.counts[1]});
assert.throws(()=>validateRecordedTaxonCensus(duplicate,{tick:8,living:3}),/Invalid recorded/);
const unsupported=structuredClone(projection);unsupported.schema=2;
assert.throws(()=>validateRecordedTaxonCensus(unsupported,{tick:8,living:2}),/Invalid recorded/);
const oldProjection=structuredClone(owned);oldProjection.core.autonomousEvolutionRules=AUTONOMOUS_EVOLUTION.legacy;
assert.equal(recordedRegionalTaxonCensus(oldProjection),undefined,'Recorded /1 headers stay unchanged');
console.log('Recorded evolutionary history PASS: real-record union, no input mutation, idempotent events, chronology, retained multiplicity, conflicts/cycles rejected, carrier and conception-parent ancestry closure. Controlled fixtures only.');
