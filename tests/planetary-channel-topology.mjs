import assert from 'node:assert/strict';
import {World} from '../src/world/world.js';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {validateEnvironment} from '../src/world/environment.js';
import {totalPlanetarySurfaceWater} from '../src/world/planetary-runoff.js';
import {PLANETARY_CHANNEL_TOPOLOGY,planChannelRecession} from '../src/world/planetary-channel-topology.js';

const seed='GENVO8-TEST-A',region={x:0,y:2560};
const world=new World(seed,{generator:'planetary/1',planetOrigin:region});
const rule=PLANETARY_CHANNEL_TOPOLOGY.policy,n=world.n;
assert.equal(world.environment.channelTopologyPolicy,rule);
assert.ok(world.environment.floodOrigin instanceof Uint8Array);
let site=-1,buffer=-1,naturalWater=-1;
for(let y=2;y<n-2;y++)for(let x=2;x<n-2;x++){
 const i=y*n+x;
 if(!world.water[i]&&site<0)site=i;
 else if(!world.water[i]&&i!==site&&buffer<0)buffer=i;
 else if(world.water[i]&&naturalWater<0)naturalWater=i;
}
assert.ok(site>=0&&buffer>=0,'there must be dry terrain for funded runoff');
assert.ok(naturalWater>=0,'generated geography must include permanent water');
const original=totalPlanetarySurfaceWater(world);
// A controlled finite runoff store is the sole authority for creating
// this water cell. No reservoir input or new water inventory is permitted.
world.environment.overland[site]=.4;
const fundedBefore=totalPlanetarySurfaceWater(world);
const flood=world.setSurfaceWater([{i:site,water:1,depth:.4,salinity:0,source:'overland'}],
 {reason:'funded-river-flood'});
assert.equal(world.water[site],1);
assert.equal(world.environment.floodOrigin[site],1);
assert.equal(world.environment.overland[site],0);
assert.ok(Math.abs(world.environment.volume[site]-.4)<1e-8);
assert.ok(Math.abs(totalPlanetarySurfaceWater(world)-fundedBefore)<1e-10);
assert.equal(flood.internalWater,.4);
assert.equal(flood.waterInput,0);
assert.ok(world.topology.events.at(-1).reason==='funded-river-flood');
validateEnvironment(world,world.environment);
// Flooded water drained into another physical store on a preceding day;
// the remaining shallow column belongs to the formerly flooded cell.
world.environment.volume[site]=.02;
world.environment.overland[buffer]+=.38;
const beforeRecede=totalPlanetarySurfaceWater(world);
assert.ok(Math.abs(beforeRecede-fundedBefore)<1e-8);
const edits=planChannelRecession(world,2);
assert.deepEqual(edits,[{i:site,water:0,destination:'overland'}]);
const recession=world.setSurfaceWater(edits,{reason:'seasonal-drydown'});
assert.equal(world.water[site],0);
assert.equal(world.environment.floodOrigin[site],0);
assert.equal(world.environment.volume[site],0);
assert.equal(world.environment.depth[site],0);
assert.equal(world.environment.overland[site],.02);
assert.ok(Math.abs(totalPlanetarySurfaceWater(world)-beforeRecede)<1e-9);
assert.equal(recession.waterOutput,0);
assert.equal(recession.recededWater,.02);
assert.equal(world.topology.revision,2);
assert.deepEqual(planChannelRecession(world,3),[]);
validateEnvironment(world,world.environment);
// Permanent rivers, oceans and unowned historical water can NEVER recede.
assert.equal(world.environment.floodOrigin[naturalWater],0);
assert.throws(()=>world.setSurfaceWater([{i:naturalWater,water:0,destination:'overland'}],
 {reason:'invalid-natural-water-drydown'}),/historically funded and owned/);
assert.equal(world.water[naturalWater],1);

// An ordinary new-world save records the physical mask, elevation and
// ownership marker. Invalid saved ownership is rejected, not silently fixed.
const live=new Simulation(seed,{player:false,bootstrap:false,
 worldGenerator:'planetary/1',planetOrigin:region});
const w=live.world;
let p=-1,q=-1;
for(let y=2;y<w.n-2;y++)for(let x=2;x<w.n-2;x++){
 const i=y*w.n+x;
 if(!w.water[i]&&p<0)p=i;
 else if(!w.water[i]&&q<0)q=i;
}
assert.ok(p>=0&&q>=0);
w.environment.overland[p]=.4;
w.setSurfaceWater([{i:p,water:1,depth:.4,salinity:0,source:'overland'}],
 {reason:'funded-river-flood'});
const beforeSave=structuredClone(createSimulationSnapshot(live,
 {savedAt:'fixed',reason:'channel-topology'}));
const restored=restoreSimulationSnapshot(structuredClone(beforeSave));
assert.equal(restored.world.water[p],1);
assert.equal(restored.world.environment.floodOrigin[p],1);
assert.equal(restored.world.environment.channelTopologyPolicy,rule);
assert.equal(restored.world.topology.revision,w.topology.revision);
const invalid=structuredClone(beforeSave);
invalid.world.environment.floodOrigin[q]=1;
assert.throws(()=>restoreSimulationSnapshot(invalid),
 /Unfunded temporary-water ownership/);
const unknown=structuredClone(beforeSave);
unknown.world.environment.channelTopologyPolicy='unsupported-channels/3';
assert.throws(()=>restoreSimulationSnapshot(unknown),
 /Invalid planetary channel-topology policy/);
const historical=structuredClone(beforeSave);
delete historical.world.environment.channelTopologyPolicy;
delete historical.world.environment.floodOrigin;
assert.equal(restoreSimulationSnapshot(historical).world.environment.channelTopologyPolicy,undefined);

// For historical saves no new waters are retroactively identified as
// flood-created. Future rain can still use the historical flood pathway,
// but the new recension policy does not erase existing water.
const old=new World(seed,{generator:'planetary/1',planetOrigin:region});
delete old.environment.channelTopologyPolicy;
delete old.environment.floodOrigin;
assert.deepEqual(planChannelRecession(old,1),[]);
console.log('Funded channels: seasonal flood/recession, terrain-water ownership, permanent-coast guard, full conservation, historical opt-out and corrupted save rejection PASS');
