import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
const s=new Simulation('SHARED-DIETARY-DEMAND'),a=s.player(),b=s.animals.find(v=>v.id!==a.id&&v.species===a.species),w=s.world;
s.animals=[a,b];for(const v of [a,b]){v.x=59.5;v.y=53.5;v.energy=100;v.bodyPlan=structuredClone(v.bodyPlan)}
w.water.fill(0);w.buildLandRegions();w.buildHydrology();for(const f of Object.values(w.plants))f.fill(0);for(const f of Object.values(w.freshwaterFood))f.fill(0);w.carrion.fill(0);w.plants.sunmoss[w.idx(59,54)]=1;
const mouth=(v,id)=>v.bodyPlan.nodes.find(n=>n.socket==='mouth').partId=id;mouth(a,'grazing-mouth');mouth(b,'tearing-jaw');s.rebuildSpatial();
const separate=s.carrying.breedingState(a);assert.equal(separate.competitors,0,'Same founding label, disjoint evolved diet contributes no shared food demand');assert.equal(separate.local,2,'Habitat headcount is not dietary demand');
mouth(b,'grazing-mouth');const shared=s.carrying.breedingState(a);assert.equal(shared.competitors,1);assert.ok(shared.ratio>separate.ratio);
b.species='rootling';assert.equal(s.carrying.breedingState(a).competitors,1,'Different founding label with identical diet contributes the same full consumer');
const rng=s.rng.state,stock=w.plants.sunmoss[w.idx(59,54)];s.carrying.breedingState(a);assert.equal(w.plants.sunmoss[w.idx(59,54)],stock);assert.equal(s.rng.state,rng);
w.plants.sunmoss.fill(0);assert.equal(s.carrying.breedingState(a).competitors,0,'Depleted food creates no imaginary shared resource');assert.equal(s.carrying.breedingState(a).allowed,false);
w.water.fill(1);w.buildLandRegions();w.buildHydrology();for(const v of [a,b]){v.adaptations.push('webbed-limbs');mouth(v,'tearing-jaw')}w.freshwaterFood.fry[w.idx(59,54)]=.35;
const aquatic=s.carrying.breedingState(a);assert.ok(aquatic.competitors>0&&aquatic.resource>0);b.adaptations=b.adaptations.filter(v=>v!=='webbed-limbs');assert.equal(s.carrying.breedingState(a).competitors,0,'Anatomically inaccessible aquatic prey cannot create competitor demand');
console.log('Same-label divergent diets, cross-label identical diets, finite depleted stocks, aquatic-only overlap and inaccessible consumers PASS');
