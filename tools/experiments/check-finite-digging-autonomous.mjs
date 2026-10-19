// Controlled hunger/placement fixture: shared autonomous action, not natural survival proof.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {deserialize} from 'node:v8';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {restoreSimulationSnapshot,createSimulationSnapshot} from '../../src/persistence/save-manager.js';
import {SPECIES} from '../../src/organisms/species.js';
import {installFiniteDiggingCandidate} from './finite-digging-candidate.mjs';
const [input,out]=process.argv.slice(2);assert.ok(input&&out&&!fs.existsSync(out));
const bytes=fs.readFileSync(input),saved=deserialize(Buffer.from(bytes));
const original=[saved,...saved.core.planetaryTravel.sessions.map(s=>s.snapshot)].find(s=>s.animals.some(a=>a.id===630));assert.ok(original);
const local={...original,core:{...original.core}};delete local.core.planetaryTravel;delete local.regionalWorlds;
const s=installFiniteDiggingCandidate(restoreSimulationSnapshot(local)),a=s.animals.find(a=>a.id===630);
// Only hunger and legal position are controlled; no food, anatomy or genome injection.
a.player=false;a.energy=SPECIES[a.species].maxEnergy*.4;
let found=false;
for(let y=8.5;y<s.world.n-8&&!found;y++)for(let x=8.5;x<s.world.n-8;x++){a.x=x;a.y=y;if(s.partAbilities.digAvailability(a).enabled){found=true;break}}
assert.ok(found,'finite existing food reachable in controlled fixture');
const roots=s.partAbilities.digDecision(a);assert.equal(roots?.kind,'roots');
assert.equal(s.partAbilities.digDecision(a,{food:{x:a.x,y:a.y}}),null,'nearby ordinary food remains preferred');
const before=createSimulationSnapshot(s,{savedAt:'fixed',reason:'autonomous-dig-fixture'});
const direct=installFiniteDiggingCandidate(restoreSimulationSnapshot(structuredClone(before))),da=direct.animals.find(v=>v.id===a.id);
const meal=s.partAbilities.rootMealAt(a),stock=s.world.plants[meal.kind][meal.i],energy=a.energy;
a.intent='dig';a.target=roots;assert.equal(s.partAbilities.resolveDig(a),true);
assert.ok(direct.partAbilities.dig(da).ok);
assert.ok(s.world.plants[meal.kind][meal.i]<stock);
assert.equal(a.energy,da.energy);assert.equal(a.hydration,da.hydration);
const snap=v=>createSimulationSnapshot(v,{savedAt:'fixed',reason:'autonomous-dig-fixture'});
assert.ok(isDeepStrictEqual(snap(s).world,snap(direct).world),'autonomous/direct complete physical resource parity');
assert.ok(isDeepStrictEqual(snap(s).controllers.dispersal,snap(direct).controllers.dispersal),'autonomous/direct seed and tissue parity');
const afterEnergy=a.energy,afterStock=s.world.plants[meal.kind][meal.i];
assert.equal(s.partAbilities.digDecision(a),null,'cooldown blocks immediate new intent');
s.partAbilities.resolveDig(a);assert.equal(a.energy,afterEnergy);assert.equal(s.world.plants[meal.kind][meal.i],afterStock,'stale intent cannot double-harvest');
for(const id of a.parentIds){const p=s.animals.find(v=>v.id===id);assert.ok(p);p.x=a.x;p.y=a.y;p.energy=SPECIES[p.species].maxEnergy*.4;assert.equal(s.partAbilities.digDecision(p),null,'actual parents still lack digging anatomy')}
const source='tools/experiments/finite-digging-candidate.mjs';
const report={status:'staged-only-not-installed',scope:'Actual natural actor 630, controlled low energy and existing legal food position; no injected food/anatomy/genome. Shared digDecision/resolveDig compared with direct action. Not full AI scheduling, offscreen replay, natural navigation, canonical save integration or ecological balance proof.',input,inputSha256:createHash('sha256').update(bytes).digest('hex'),candidateSha256:createHash('sha256').update(fs.readFileSync(source)).digest('hex'),actor:a.id,position:{x:a.x,y:a.y},kind:meal.kind,removed:stock-afterStock,energyGain:afterEnergy-energy,autonomousDirectPhysicalParity:true,nearbyOrdinaryMealPreferred:true,staleIntentDoubleHarvestDenied:true,parentsDenied:true};
fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
