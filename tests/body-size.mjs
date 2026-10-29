// body-size/1: inherited continuous adult size, growth toward it, mass, funded
// growth, size-scaled endurance and persistence. Parent sizes below are set as a
// controlled demonstration; inheritance, growth and costs use the real rules.
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {Simulation} from '../src/sim/simulation.js';
import {BODY_SIZE,adultSizeScale,reserveScale,enduranceScale,validateBodySize} from '../src/organisms/body-size.js';
import {adultBodyMass,bodyMass,bodyDimensionsOf,basalResourceCosts} from '../src/organisms/body-mass.js';
import {basalScale} from '../src/ecology/metabolism-policy.js';
import {growthCostForDay} from '../src/ecology/juvenile-biology.js';
import {paternalInheritance} from '../src/ecology/gestation.js';
import {SPECIES} from '../src/organisms/species.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

const base={player:true,dayClock:true,metabolism:true};
assert.equal(new Simulation('SIZE-OFF',base).bodySizeRules,undefined,'worlds without the rule are unchanged');
assert.throws(()=>new Simulation('SIZE-NO-METABOLISM',{player:true,bodySize:true}),/requires fasting-2/);
assert.throws(()=>new Simulation('SIZE-BAD',{...base,bodySize:'body-size/9'}),/Unknown body size policy/);
const sim=new Simulation('SIZE-WORLD',{...base,bodySize:true});
assert.equal(sim.bodySizeRules,BODY_SIZE.policy);
// Founders carry small standing variation around the anatomy's own size.
const scales=sim.animals.map(a=>{validateBodySize(a.bodySize);return adultSizeScale(a)});
assert.ok(scales.every(s=>s>=Math.exp(-.05)-1e-12&&s<=Math.exp(.05)+1e-12));assert.ok(new Set(scales.map(s=>s.toFixed(4))).size>scales.length/2,'founders vary');

// Scenario A: compatible parents of different inherited size.
const species=sim.player().species,adults=sim.animals.filter(a=>a.alive&&a.species===species&&a.age>=SPECIES[species].maturity);
const mother=adults.find(a=>a.sex==='F')||adults[0],father=adults.find(a=>a.sex==='M'&&a!==mother)||adults[1];
mother.bodySize={schema:1,alleles:[Math.log(1.5),Math.log(1.5)]};father.bodySize={schema:1,alleles:[Math.log(1.1),Math.log(1.1)]};
const kids=[];for(let k=0;k<40;k++)kids.push(sim.spawnAnimal(species,mother.x,mother.y,[mother,father]));
for(const kid of kids){validateBodySize(kid.bodySize);const [a,b]=kid.bodySize.alleles;
  const fromMother=[a,b].filter(v=>Math.abs(v-Math.log(1.5))<=BODY_SIZE.mutation+1e-12).length,fromFather=[a,b].filter(v=>Math.abs(v-Math.log(1.1))<=BODY_SIZE.mutation+1e-12).length;
  assert.ok(fromMother>=1&&fromFather>=1,'one allele from each parent');
  const s=adultSizeScale(kid);assert.ok(s>1.1*Math.exp(-BODY_SIZE.mutation)&&s<1.5*Math.exp(BODY_SIZE.mutation),'offspring combine both parents')}
const kidScales=kids.map(adultSizeScale);assert.ok(Math.max(...kidScales)-Math.min(...kidScales)>.01,'offspring differ from each other');
// The conception snapshot carries size, so a father who dies before the birth still contributes.
const snapshot=paternalInheritance(father);assert.ok(isDeepStrictEqual(snapshot.bodySize,father.bodySize));
// Bounds: inheritance never leaves the /1 range.
const giantM={...mother,bodySize:{schema:1,alleles:[Math.log(2),Math.log(2)]}},giantF={...father,bodySize:{schema:1,alleles:[Math.log(2),Math.log(2)]}};
for(let k=0;k<30;k++){const kid=sim.spawnAnimal(species,mother.x,mother.y,[giantM,giantF]);assert.ok(adultSizeScale(kid)<=BODY_SIZE.maxScale+1e-12)}

// Growth toward the inherited adult size, paid for by the existing funded growth.
const kid=kids[0],s=adultSizeScale(kid),reference={...kid,bodySize:undefined};
assert.equal(kid.age,0);const newborn=bodyDimensionsOf(kid);
assert.ok(Object.isFrozen(newborn));assert.equal(newborn.adultScale,s);assert.ok(Math.abs(newborn.currentScale-s*newborn.growth)<1e-12);assert.ok(newborn.growth<1,'newborns are not adult-sized');
assert.ok(Math.abs(adultBodyMass(kid)-adultBodyMass(reference)*s**3)<1e-9,'mass is anatomy times scale cubed');
assert.ok(Math.abs(bodyMass(kid)-bodyMass(reference)*s**3)<1e-9);
assert.ok(Math.abs(growthCostForDay(kid)/growthCostForDay(reference)-s**3)<1e-9,'a larger body pays proportionally more to grow');
const grown={...kid,age:SPECIES[species].maturity};assert.equal(bodyDimensionsOf(grown).growth,1);assert.ok(Math.abs(bodyDimensionsOf(grown).currentScale-s)<1e-12,'adults reach their inherited size');

// Endurance: capacity grows with mass, resting cost as mass^0.75 (energy) and mass^2/3 (water).
const big={...grown,bodySize:{schema:1,alleles:[Math.log(2),Math.log(2)]}},unit={...grown,bodySize:{schema:1,alleles:[0,0]}};
const perStep=a=>{const cost=basalResourceCosts(a),scale=basalScale(sim,a);return{energy:cost.energy*scale.energy,water:cost.water*scale.water}};
const bigCost=perStep(big),unitCost=perStep(unit),noSize=perStep({...grown,bodySize:undefined});
assert.ok(Math.abs(unitCost.energy-noSize.energy)<1e-15&&Math.abs(unitCost.water-noSize.water)<1e-15,'reference size keeps fasting-2 exactly');
assert.ok(Math.abs(bigCost.energy/unitCost.energy-8**-.25)<1e-12,'2x body: energy endurance x8^0.25');
assert.ok(Math.abs(bigCost.water/unitCost.water-8**(-1/3))<1e-12,'2x body: water endurance x8^(1/3)');
assert.equal(reserveScale(big),8);assert.ok(Math.abs(enduranceScale(big).energy*reserveScale(big)-8**.75)<1e-12,'total resting need grows as mass^0.75');

// Saves keep every size; rules and sizes must agree.
const snap=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'body-size'}));
const saved=snap(sim),back=restoreSimulationSnapshot(structuredClone(saved));
assert.equal(back.bodySizeRules,BODY_SIZE.policy);assert.ok(isDeepStrictEqual(back.animals.map(a=>a.bodySize),sim.animals.map(a=>a.bodySize)));
for(let i=0;i<6;i++){sim.update(null);back.update(null)}
assert.ok(isDeepStrictEqual(snap(back).animals,snap(sim).animals),'restored size worlds continue identically');
for(const damage of [s=>{s.animals[0].bodySize.alleles=[0]},s=>{s.animals[0].bodySize.alleles[0]=Math.log(3)},s=>{delete s.animals[0].bodySize},s=>{s.core.bodySizeRules='body-size/9'}]){
  const bad=structuredClone(saved);damage(bad);assert.throws(()=>restoreSimulationSnapshot(bad),/body size/i)}
const plain=new Simulation('SIZE-PLAIN',base),plainSaved=snap(plain);plainSaved.animals[0].bodySize={schema:1,alleles:[0,0]};
assert.throws(()=>restoreSimulationSnapshot(plainSaved),/without its recorded rule/);
console.log(`Body size /1 PASS: founders vary, offspring combine one allele from each parent (scales ${Math.min(...kidScales).toFixed(3)}-${Math.max(...kidScales).toFixed(3)} from 1.5x and 1.1x parents), growth toward inherited size paid in proportion, endurance mass^0.25 / mass^(1/3), exact persistence`);
