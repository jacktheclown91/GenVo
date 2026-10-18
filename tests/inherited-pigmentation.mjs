import assert from 'node:assert/strict';
import {PIGMENT_GENOME_SCHEMA,validPigmentGenome,founderPigmentGenome,inheritPigmentGenome,pigmentExpression} from '../src/organisms/pigmentation.js';
import {phenotypeFor} from '../src/organisms/species.js';
import {creaturePalette} from '../src/render/creature-palette.js';
import {paternalInheritance} from '../src/ecology/gestation.js';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

// No simulation RNG or environmental pressure is used to select inherited pigments.
const f1=founderPigmentGenome('pigment-test',1,'genvo');
const f2=founderPigmentGenome('pigment-test',2,'genvo');
assert.equal(f1.schema,PIGMENT_GENOME_SCHEMA);
assert.ok(validPigmentGenome(f1)&&validPigmentGenome(f2));
assert.deepEqual(founderPigmentGenome('pigment-test',1,'genvo'),f1);
assert.equal(validPigmentGenome({...f1,hue:24}),false);
assert.equal(validPigmentGenome({...f1,hue:NaN}),false);
assert.equal(inheritPigmentGenome('pigment-test',4,[{pigmentGenome:f1},{}]),null,'legacy mixed ancestry stays legacy until migrated');

const children=[];
for(let id=3;id<83;id++){
  const child=inheritPigmentGenome('pigment-test',id,[{pigmentGenome:f1},{pigmentGenome:f2}]);
  assert.ok(validPigmentGenome(child));
  assert.deepEqual(child,inheritPigmentGenome('pigment-test',id,[{pigmentGenome:f1},{pigmentGenome:f2}]));
  children.push(child);
}
assert.ok(children.some(c=>c.hue===f1.hue||c.hue===f2.hue),'children can carry parental hue');
assert.ok(new Set(Array.from({length:80},(_,i)=>founderPigmentGenome('pigment-test',i+1,'genvo').hue)).size>10,'fresh founders have distinct hue possibilities');

const historical={genes:{body:1,motion:1,metabolism:1,digestion:1,senses:1,climate:1,immunity:1,temperament:1}};
const previous=phenotypeFor(historical),previousPalette=creaturePalette(previous);
assert.equal(previous.hueShift,0);
assert.equal(previous.lightShift,0);
assert.equal(previous.pigmentChroma,null);
assert.equal(previousPalette.body,'#5b9a75','legacy skin tone retains old quantized palette');
const modern=phenotypeFor({...historical,pigmentGenome:founderPigmentGenome('NEW-WORLD',11,'genvo')});
assert.ok(Number.isFinite(modern.pigmentChroma));
assert.notDeepEqual(creaturePalette(modern),previousPalette);

const frozen=paternalInheritance({id:1,species:'genvo',genes:historical.genes,pigmentGenome:f1});
assert.deepEqual(frozen.pigmentGenome,f1,'conception captures pigment loci');
f1.hue=(f1.hue+1)%24;
assert.notDeepEqual(frozen.pigmentGenome,f1,'later parent change cannot revise frozen gametes');

// Controlled spawn fixture, not a claimed ordinary funded birth.
const sim=new Simulation('PIGMENT-SAVE-ROUNDTRIP',{player:true}),parents=sim.animals.filter(a=>a.alive&&validPigmentGenome(a.pigmentGenome)).slice(0,2);
assert.equal(parents.length,2);
const child=sim.spawnAnimal(parents[0].species,parents[0].x,parents[0].y,parents);
assert.ok(validPigmentGenome(child.pigmentGenome));
const snap=structuredClone(createSimulationSnapshot(sim,{reason:'pigment-test'}));
const restored=restoreSimulationSnapshot(snap);
assert.deepEqual(restored.animals.find(a=>a.id===child.id)?.pigmentGenome,child.pigmentGenome);
assert.equal(restored.rng.state,sim.rng.state,'save restoration adds no pigment RNG draws');
console.log('independent inherited pigmentation: OK');
