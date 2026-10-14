import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';import {SPECIES} from '../src/organisms/species.js';
import {GENETIC_DOMAIN} from '../src/organisms/species.js';
import {placeSupportedBreedingPair} from './helpers/breeding-pair.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
const s=new Simulation('SMALL-COUSIN-OPPORTUNITIES'),founders=s.animals.filter(a=>a.species==='genvo').slice(0,8),[g1,g2,u1,u2,u3,u4]=founders;
const birth=(left,right)=>{const a=s.spawnAnimal('genvo',left.x,left.y,[left,right]);s.lineage.registerBirth(a,[left,right]);s.family.registerBirth(a,left,right);return a};
const l=birth(g1,g2),r=birth(g1,g2),lc=birth(l,u1),rc=birth(r,u2),a=birth(lc,u3),b=birth(rc,u4);
assert.equal(s.recovery.kinship(lc,rc),'close','Existing first-cousin restriction remains');assert.equal(s.recovery.kinship(a,b),'none','Second cousin branches remain eligible under existing rules');
// Controlled valid mounted bodies; manual genealogical spawn helpers do not materialize birth anatomy.
for(const v of [a,b])v.bodyPlan=structuredClone(g1.bodyPlan);b.bodyPlan.nodes.find(n=>n.socket==='mouth').partId='nibbler-mouth';
s.animals=[a,b];s.playerEnabled=false;a.sex='F';b.sex='M';b.species='rootling';for(const v of [a,b]){v.age=SPECIES[v.species].maturity+10;v.reproCooldown=0;v.energy=SPECIES[v.species].maxEnergy;v.hydration=SPECIES[v.species].maxHydration;v.health=100;v.pregnant=null}
placeSupportedBreedingPair(s,a,b);const rng=s.rng.state,reserves=a.energy+b.energy;
assert.equal(s.autonomousMateTarget(a,{far:true})?.id,b.id,'Compatible cousin branches are discoverable despite founding labels and social-group boundaries');assert.equal(s.rng.state,rng);assert.equal(a.energy+b.energy,reserves);assert.equal(s.animals.length,2,'Search creates no rescue animals');
const saved=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(s))),sa=saved.animals.find(v=>v.id===a.id),sb=saved.animals.find(v=>v.id===b.id);assert.equal(saved.recovery.kinship(sa,sb),'none');assert.equal(saved.autonomousMateTarget(sa,{far:true})?.id,sb.id);assert.deepEqual(sb.reproductiveGenome,b.reproductiveGenome);
a.reproductiveGenome.loci.gamete=[GENETIC_DOMAIN.min,GENETIC_DOMAIN.min];b.reproductiveGenome.loci.gamete=[GENETIC_DOMAIN.max,GENETIC_DOMAIN.max];assert.equal(s.autonomousMateTarget(a,{far:true}),null,'No biological compatibility means no emergency partner');assert.equal(s.conceptionAvailability(a,b).reasonCode,'inherited-compatibility');assert.equal(s.rng.state,rng);assert.equal(a.energy+b.energy,reserves);assert.equal(s.animals.length,2);
console.log('Small compatible second-cousin branches across labels remain searchable, first-cousin restriction retained, isolated incompatible pair has no rescue, saves preserve opportunities PASS');
