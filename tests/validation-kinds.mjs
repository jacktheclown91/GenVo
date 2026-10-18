import assert from 'node:assert/strict';
import {validationFailureKind} from '../tools/validation-kind.mjs';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {CANONICAL_HORIZONS} from '../tools/ecological-observation.mjs';
const catalog=JSON.parse(fs.readFileSync('tests/validation-kinds.json','utf8')),tiers=JSON.parse(fs.readFileSync('tests/test-tiers.json','utf8')),ledger=JSON.parse(fs.readFileSync('tests/known-failures.json','utf8'));
for(const [suite,entry] of Object.entries(catalog.suites)){assert.ok(fs.existsSync('tests/'+suite+'.mjs'),suite);assert.ok(entry.kinds.length);for(const kind of entry.kinds)assert.ok(Object.hasOwn(catalog.kinds,kind),kind)}
assert.deepEqual(catalog.defaultKinds,['unclassified']);
assert.equal(tiers.long['wild-evolution-observation'].timeoutSeconds,900);assert.equal(tiers.long['natural-world-soak'].timeoutSeconds,1500);assert.equal(tiers.long['wild-evolution'],undefined);
assert.equal(ledger.failures['wild-evolution'],undefined);assert.equal(ledger.historicalObservations['wild-evolution'].match,'needlejaw bodies have evolved');
assert.deepEqual(Object.keys(tiers.long).filter(k=>k==='natural-world-soak'),['natural-world-soak']);
console.log('Explicit categories, unchanged original long ceilings, and preserved historical ecological finding PASS');

assert.deepEqual(CANONICAL_HORIZONS,{'GENVO8-TEST-A':640,'GENVO8-TEST-B':320,'GENVO8-TEST-C':640,'GENVO8-TEST-D':320,'GENVO8-TEST-E':640});
const historical=ledger.historicalObservations['wild-evolution'];assert.equal(createHash('sha256').update(fs.readFileSync(historical.frozenAssertionFile)).digest('hex'),historical.frozenAssertionSha256,'the original outcome assertions remain intact');

assert.equal(validationFailureKind('wild-evolution-observation','timeout','',catalog),'performance');
assert.equal(validationFailureKind('observer-play','fail','4x costs 546 ms per real second of play',catalog),'performance');
assert.equal(validationFailureKind('natural-world-soak','fail','invalid finite resource stock: algae',catalog),'biological-invariant');
assert.equal(validationFailureKind('natural-world-soak','fail','an unaudited failure',catalog),'unclassified');
assert.equal(validationFailureKind('ai-disclosure','known-fail','',catalog),'release-gate');
