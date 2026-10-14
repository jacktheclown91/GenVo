import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildBaseline} from '../tools/evolution-baseline.mjs';
import {SPECIES} from '../src/organisms/species.js';
const SPECIES_SPRINT=SPECIES.genvo.speed*1.55;

// Evolution consolidation Stage A guard. The baseline records how today's evolution systems
// combine into a creature's speed, range, senses, metabolism, water use, shelter and food value.
// A consolidation stage that changes any of these must regenerate the baseline on purpose
// (node tools/evolution-baseline.mjs --write) and say why in its pass notes.
const stored=JSON.parse(fs.readFileSync(new URL('../docs/evolution-baseline.json',import.meta.url),'utf8'));
const now=buildBaseline();
for(const [row,vals] of Object.entries(stored.matrix))for(const [k,v] of Object.entries(vals))assert.equal(now.matrix[row]?.[k],v,`${row}.${k} changed from the consolidation baseline`);
assert.deepEqual(Object.keys(now.matrix).sort(),Object.keys(stored.matrix).sort(),'the measured factor list is unchanged');
assert.deepEqual(now.natural,stored.natural,'natural AUTO runs match the consolidation baseline');

// Stage C: lineage systems meet under one shared limit, so stacks are bounded while every
// single system keeps its full effect.
import {EFFECT_LIMITS} from '../src/lineage/effects.js';
const m=stored.matrix;
assert.ok(m['stack:widest-ranger'].forageRange<=m.neutral.forageRange*1.2*EFFECT_LIMITS.forageRange[1]+1e-9,'stacked forage range is capped');
assert.ok(m['stack:widest-ranger'].landSpeed<SPECIES_SPRINT,'stacked travel no longer reaches a plain sprint');
assert.ok(m['stack:most-vigilant'].threatSense<=m.neutral.threatSense*1.2*EFFECT_LIMITS.threatSense[1]+1e-9,'stacked vigilance is capped');
assert.ok(m['stack:most-sheltered'].shelterExposure>=EFFECT_LIMITS.shelterExposure[0]-1e-9,'stacked shelter protection is floored');
for(const [row,v] of Object.entries(m))if(!row.startsWith('stack:')){assert.ok(v.forageRange/m.neutral.forageRange<EFFECT_LIMITS.forageRange[1]*1.25,`${row} is not clipped by the range limit`)}
console.log('evolution baseline ok');
