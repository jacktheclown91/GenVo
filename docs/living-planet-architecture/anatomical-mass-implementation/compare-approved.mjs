import fs from 'node:fs';import assert from 'node:assert/strict';
import {ANATOMICAL_MASS,adultBodyMass,basalResourceCosts} from '../../../src/organisms/body-mass.js';
import {growthCostForDay} from '../../../src/ecology/juvenile-biology.js';
const candidate=JSON.parse(fs.readFileSync('docs/living-planet-architecture/anatomical-mass-proposal/candidate.json'));
const rows=candidate.rows.map(row=>{const bodyPlan={schema:'genvo8.bodyplan/0',nodes:row.mass.components.map(c=>c.nodeId)};return row});
// Source candidate retains component identities but not parent/socket placement. Reuse the exact declared plan sources via a read-only comparison script.
const source=fs.readFileSync('docs/living-planet-architecture/anatomical-mass-proposal/compare.mjs','utf8');
const replaced=source.slice(0,source.indexOf('const rows=fixtures.map')).replaceAll("'./model.mjs'","'../anatomical-mass-proposal/model.mjs'");
const suffix=`const results=fixtures.map(([name,bodyPlan])=>{const animal={species:'genvo',massPolicy:ANATOMICAL_MASS,bodyPlan,age:10,genes:{metabolism:1}},expected=candidate.rows.find(r=>r.name===name),adultMass=adultBodyMass(animal),growthCost=growthCostForDay(animal);assert.equal(adultMass,expected.mass.adultMass);assert.equal(growthCost,expected.atAge10GrowthCost);return{name,adultMass,growthCost}});fs.writeFileSync('docs/living-planet-architecture/anatomical-mass-implementation/approved-model-comparison.json',JSON.stringify({scope:'Current live mass/growth authorities compared with the creator-approved candidate on exactly the same read-only archived and constructed bodies; no living organism was edited.',results},null,2));console.log(JSON.stringify(results));`;
const imports="import {ANATOMICAL_MASS,adultBodyMass} from '../../../src/organisms/body-mass.js';import {growthCostForDay} from '../../../src/ecology/juvenile-biology.js';const candidate=JSON.parse(fs.readFileSync('docs/living-planet-architecture/anatomical-mass-proposal/candidate.json'));\n";
fs.writeFileSync('docs/living-planet-architecture/anatomical-mass-implementation/compare-live.mjs',replaced+imports.replace('\\n','\n')+suffix);
