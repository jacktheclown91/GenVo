import assert from 'node:assert/strict';
import {observeEngineerSuccession} from '../src/ecology/engineer-succession.js';
import {noteEngineerConception,noteEngineerColonyBirth,observeEngineerColony,engineerColonyEvidence} from '../src/ecology/engineer-colonies.js';

const r={key:'1:1'};
const founder={id:10,species:'rootling',generation:2,from:'1:2'};
const mate={id:11,species:'rootling',generation:2};
function sample(day,occupants){observeEngineerSuccession(r,occupants,day);observeEngineerColony(r,occupants,day);}
sample(1,[founder]);sample(2,[founder]);
for(let day=3;day<=8;day++)sample(day,[]);
for(let day=9;day<=11;day++)sample(day,[founder]);
assert.equal(engineerColonyEvidence(r).length,1);
assert.equal(noteEngineerColonyBirth(r,{id:40,parentIds:[10,11],species:'rootling',generation:3},12),false,'Birth with no witnessed in-region conception is not local mating proof');
assert.equal(noteEngineerConception(r,{id:99,species:'rootling'},{id:100,species:'rootling'},12),false,'Unrelated parents cannot establish founder line');
assert.equal(noteEngineerConception(r,founder,mate,12),true);
assert.equal(noteEngineerColonyBirth(r,{id:40,parentIds:[10,11],species:'rootling',generation:3},13),true);
sample(13,[founder,{id:40}]);sample(14,[founder,{id:40}]);sample(15,[founder]);
let ev=engineerColonyEvidence(r).at(-1);
assert.equal(ev.localBirths,1);assert.equal(ev.recruited,0,'Two-day transient offspring not a resident recruit');
for(let day=16;day<=20;day++)sample(day,[founder,{id:40}]);
ev=engineerColonyEvidence(r).at(-1);
assert.equal(ev.recruited,1);
assert.equal(ev.establishedDay,null);
// A new five-day vacancy must freeze the old colony's evidence.
for(let day=21;day<=26;day++)sample(day,[]);
assert.equal(noteEngineerConception(r,founder,mate,27),false);
assert.equal(noteEngineerColonyBirth(r,{id:41,parentIds:[10,11],species:'rootling',generation:3},28),false);
assert.equal(engineerColonyEvidence(r).at(-1).localBirths,1);
for(let day=27;day<=29;day++)sample(day,[{...founder,from:'1:2'}]);
assert.equal(engineerColonyEvidence(r).length,2);
assert.equal(engineerColonyEvidence(r).at(-1).localBirths,0,'Reoccupied region gets a new episode, not old children');
const copied=engineerColonyEvidence(r);copied[0].births[0].parentIds[0]=-9;
assert.equal(engineerColonyEvidence(r)[0].births[0].parentIds[0],10);
console.log('no synthetic births, no unrelated breeding, no transient recruitment, post-vacancy episode isolation and immutable evidence: PASS');
