import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PLANTS} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';
import {DISEASES} from '../src/ecology/disease.js';

assert.deepEqual(Object.fromEntries(Object.entries(PLANTS).map(([k,v])=>[k,v.label])),{
  sunmoss:'Moss',bramble:'Berries',marshroot:'Reeds',rotcap:'Mushrooms',woodspire:'Woodspire',thistlepod:'Seed Pods'
});
assert.equal(SPECIES.mosskip.label,'Hopper');
assert.equal(SPECIES.rootling.label,'Digger');
assert.equal(SPECIES.needlejaw.label,'Stalker');
assert.equal(DISEASES.mirefever.label,'Marsh fever');
const playerFacing=['index.html','src/ui/tutorial.js','src/ui/inspector.js','src/sim/simulation.js','src/habitat/shelter.js'];
const text=playerFacing.map(f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8')).join('\n');
for(const stale of ['Bramblefruit','Sunmoss','Marshroot','Rotcap','Thistlepod','Mosskip','Rootling','Needlejaw','Mirefever','MATE SENSE','MIGRATION SENSE','FIELD NOTE','GUIDE'])assert.equal(text.includes(stale),false,`stale player-facing term remains: ${stale}`);
console.log('player-facing vocabulary checks: PASS');
