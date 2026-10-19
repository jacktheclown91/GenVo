// Controlled existing actor/food placement; tests canonical remote action, not natural ecological outcomes.
import assert from 'node:assert/strict';import {isDeepStrictEqual} from 'node:util';
import {Simulation} from '../src/sim/simulation.js';import {CFG} from '../src/sim/config.js';import {SPECIES} from '../src/organisms/species.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {planetaryTravelAvailability,crossPlanetaryBorder} from '../src/world/planetary-travel.js';
import {advanceRemoteBiology} from '../src/world/planetary-offscreen-biology.js';
import {provideRootFood} from './helpers/finite-root-food.js';
const source=new Simulation('PLANET-B0-A',{player:true,worldGenerator:'planetary/1'});
let found=false;for(let y=8.5;y<118.5;y++){source.player().x=125.2;source.player().y=y;if(planetaryTravelAvailability(source).enabled){found=true;break}}assert.ok(found);
const trip=crossPlanetaryBorder(source);assert.equal(trip.ok,true);const active=trip.simulation,session=active.planetaryTravel.sessions[0];
const local=restoreSimulationSnapshot(structuredClone(session.snapshot)),root=local.animals.find(a=>a.species==='rootling');assert.ok(root);
for(const a of local.animals){a.x=110.5;a.y=110.5}
let position;for(let y=8.5;y<64&&!position;y++)for(let x=8.5;x<64;x++)if(local.canOccupy(root,x,y)&&!local.world.isDrinkable(x,y)){position={x,y};break}assert.ok(position);Object.assign(root,position);
root.energy=SPECIES[root.species].maxEnergy*.4;root.hydration=SPECIES[root.species].maxHydration;root.health=100;root.pregnant=null;root.intent='idle';root.target=null;root.vx=0;root.vy=0;root.age=SPECIES[root.species].maturity+1;
// Explicit isolated-food fixture: remove competing standing foods, then supply one declared meal.
for(const field of Object.values(local.world.plants))field.fill(0);
for(const field of Object.values(local.world.freshwaterFood))field.fill(0);local.world.carrion.fill(0);
const cell=provideRootFood(local,root),stock=local.world.plants.marshroot[cell];
local.nextId=Math.max(active.nextId,local.nextId);session.snapshot=createSimulationSnapshot(local,{savedAt:'fixed',reason:'finite-remote-fixture'});
const reference=restoreSimulationSnapshot(structuredClone(session.snapshot));
// Controlled debt isolates the remote kernel. No biological result is claimed for this clock setup.
active.tickCount+=CFG.lifeStride;const result=advanceRemoteBiology(active,session,{maxTicks:CFG.lifeStride});assert.equal(result.ticks,CFG.lifeStride);
for(let t=0;t<CFG.lifeStride;t++)reference.update(null,{externalPlayerControl:true});
const remote=restoreSimulationSnapshot(structuredClone(session.snapshot));
assert.ok(remote.world.plants.marshroot[cell]<stock,JSON.stringify({reason:'real remote biology consumes finite producer food',root:remote.animals.filter(a=>a.id===root.id).map(a=>({id:a.id,x:a.x,y:a.y,intent:a.intent,target:a.target,energy:a.energy})),stock,remaining:remote.world.plants.marshroot[cell],dug:remote.partAbilities.dug}));
assert.equal(remote.partAbilities.dug[cell],remote.day,'the actual remote anatomy-gated dig completed');
const snap=s=>createSimulationSnapshot(s,{savedAt:'fixed',reason:'finite-remote-parity'});
assert.ok(isDeepStrictEqual(snap(remote),snap(reference)),'full remote biology equals ordinary canonical continuation');
const saved=snap(active);assert.ok(isDeepStrictEqual(snap(restoreSimulationSnapshot(structuredClone(saved))),saved),'planet save retains finite work and policy');
console.log('canonical finite remote digging: actual food debit/work, full local parity and planet save continuity PASS');
