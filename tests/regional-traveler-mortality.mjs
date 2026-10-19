import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {planetaryTravelAvailability,crossPlanetaryBorder} from '../src/world/planetary-travel.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {compactRegionalTravelerPositions} from '../src/world/planet-regions.js';
import {isDeepStrictEqual} from 'node:util';
const sim=new Simulation('PLANET-B0-A',{player:true,worldGenerator:'planetary/1'});
let found=false;for(let y=8.5;y<118.5;y++){sim.player().x=125.2;sim.player().y=y;if(planetaryTravelAvailability(sim).enabled){found=true;break}}
assert.ok(found);const trip=crossPlanetaryBorder(sim);assert.equal(trip.ok,true);
const active=trip.simulation,archive=active.planetaryTravel.sessions[0],before=archive.snapshot.core.regionalTravelerSlot;
assert.ok(before>0);const doomed=archive.snapshot.animals[0];doomed.health=-.1;doomed.energy=0;
for(let t=0;t<=CFG.lifeStride;t++)active.update(null,{externalPlayerControl:true});
assert.ok(!archive.snapshot.animals.some(a=>a.id===doomed.id),'actual remote lifecycle removes dead fauna');
assert.equal(archive.snapshot.core.regionalTravelerSlot,before-1,'departed traveler slot follows removal of preceding fauna');
const snap=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'traveler-mortality'}));
const saved=snap(active),restored=restoreSimulationSnapshot(structuredClone(saved));assert.ok(isDeepStrictEqual(snap(restored),saved));
console.log('Regional traveler mortality PASS: real remote death, shifted return position and exact save roundtrip');

const order=archive.snapshot.animals.map(a=>a.id);restored.player().x=2.5;restored.player().y=sim.player().y;
const homeTrip=crossPlanetaryBorder(restored);assert.equal(homeTrip.ok,true,homeTrip.message);
const home=homeTrip.simulation;assert.equal(home.animals[before-1].id,home.playerId,'return restores position among surviving wildlife');
assert.deepEqual(home.animals.filter(a=>a.id!==home.playerId).map(a=>a.id),order,'return preserves surviving wildlife order');
const fixture={animals:[{alive:false},{alive:true},{alive:false},{alive:true},{alive:true}],regionalTravelerSlots:[{id:100,index:1},{id:101,index:3}]};
compactRegionalTravelerPositions(fixture);assert.deepEqual(fixture.regionalTravelerSlots,[{id:100,index:0},{id:101,index:2}],'cohort slots follow deaths before/between them while appended newborn remains after them');
const retainedPlayer={animals:[{alive:false,player:true},{alive:false},{alive:true}],regionalTravelerSlot:2};compactRegionalTravelerPositions(retainedPlayer);assert.equal(retainedPlayer.regionalTravelerSlot,1,'retained dead player is not counted as a removed animal');
assert.throws(()=>compactRegionalTravelerPositions({animals:[],regionalTravelerSlot:1}),/Corrupt regional traveler/);
console.log('Traveler return, surviving order, cohort mortality/newborn positioning and retained-player compaction PASS');
