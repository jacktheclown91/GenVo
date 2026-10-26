import assert from 'node:assert/strict';
import {PLANTS} from '../src/sim/config.js';
import {founderFloraGenome} from '../src/ecology/flora-genotype.js';
import {ancestralBotanicalGenome, BOTANICAL_LOCI, botanicalFloraGenome, botanicalGamete, freezeBotanical} from '../src/ecology/botanical-genetics.js';
import {originalBotanicalGamete, originalBotanicalBlob} from './fixtures/botanical-gamete-original.mjs';

assert.match(originalBotanicalBlob, /^[0-9a-f]{40}$/);
const traits = ['growth', 'waterNeed', 'nutrition', 'seedAllocation', 'coatAllocation'];
const base = founderFloraGenome('bramble').traits;
const homozygous = Object.fromEntries(traits.map(key => [key, [base[key], base[key]]]));
const botanical = ancestralBotanicalGenome('GAMETE-PARITY', 'parent');
const producers = Object.values(PLANTS).filter(plant => plant.dispersal);
const heterozygous = Object.fromEntries(traits.map(key => {
  const min = key === 'seedAllocation' ? .08 : key === 'coatAllocation' ? 0 : Math.min(...producers.map(plant => plant[key]));
  const max = key === 'seedAllocation' ? .36 : key === 'coatAllocation' ? .4 : Math.max(...producers.map(plant => plant[key]));
  return [key, [min, max]];
}));
const mixed = structuredClone(botanical);
mixed.cue = [0, 255]; mixed.receptor = [3, 5];
mixed.selfMarker = ['si:quote"|x', 'si:7']; mixed.selfCompatible = [true, false];
for (const locus of ['anther', 'stigma', 'ovule', 'embryo']) mixed[locus] = [true, false];
const signedZero = structuredClone(botanical);
signedZero.cue = [0, -0]; signedZero.receptor = [-0, 0];
const zeroTraits = structuredClone(homozygous); zeroTraits.coatAllocation = [-0, 0];
const cases = [
  botanical,
  botanicalFloraGenome('bramble', homozygous, botanical),
  botanicalFloraGenome('bramble', heterozygous, mixed),
  botanicalFloraGenome('bramble', homozygous, mixed),
  botanicalFloraGenome('bramble', heterozygous, botanical),
  botanicalFloraGenome('bramble', zeroTraits, signedZero),
  freezeBotanical({botanical, traits: {...base}}),
  {botanical: structuredClone(mixed), traitAlleles: structuredClone(heterozygous), traits: {...base}}
];
let comparisons = 0;
for (const parent of cases) {
  const before = structuredClone(parent);
  for (let seed = 0; seed < 256; seed++) for (const mutate of [false, true]) {
    const key = `GAMETE-PARITY-${seed}`;
    const actual = botanicalGamete(parent, key, {mutate});
    assert.deepEqual(actual, originalBotanicalGamete(parent, key, {mutate}), 'Exact original segregation, mutation and trait output, including signed zero');
    assert.ok(Object.isFrozen(actual) && Object.isFrozen(actual.botanical));
    if (actual.traits) assert.ok(Object.isFrozen(actual.traits));
    if (actual.mutation) assert.ok(Object.isFrozen(actual.mutation));
    comparisons++;
  }
  assert.deepEqual(parent, before, 'Gamete construction cannot mutate its parent');
}
// Mutable diagnostic inputs may change between calls; no genotype-result cache
// may silently reuse a prior parent. Canonical factory parents remain frozen.
const mutable = structuredClone(cases[1]);
for (let seed = 0; seed < 64; seed++) {
  mutable.botanical.cue[seed % 2] = seed;
  mutable.traitAlleles.seedAllocation[seed % 2] = .08 + seed / 1000;
  assert.deepEqual(botanicalGamete(mutable, String(seed), {mutate: true}), originalBotanicalGamete(mutable, String(seed), {mutate: true}));
  comparisons++;
}
assert.equal(BOTANICAL_LOCI.length, 8);
console.log(`Botanical gamete parity PASS: ${comparisons} exact original comparisons across homozygous/heterozygous loci, traits, mutation, signed zero, fallback and mutable inputs.`);
