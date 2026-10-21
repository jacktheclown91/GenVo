import assert from 'node:assert/strict';
import {World} from '../src/world/world.js';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {PlanetGeography,createPlanetDescriptor,validatePlanetDescriptor,PLANET_PROJECTIONS,CONTINENTAL_LIMITS} from '../src/world/planet-geography.js';
import {planetaryTravelAvailability,crossPlanetaryBorder,preparePlanetaryDestination} from '../src/world/planetary-travel.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

const seed='PLANET-B0-A',regional=createPlanetDescriptor(seed,{projection:PLANET_PROJECTIONS.regional}),continental=createPlanetDescriptor(seed);
assert.equal(continental.projection,PLANET_PROJECTIONS.continental,'new worlds use the continental projection');
assert.equal(validatePlanetDescriptor(seed,regional).projection,PLANET_PROJECTIONS.regional,'historical descriptors remain valid');
assert.throws(()=>validatePlanetDescriptor(seed,{...regional,projection:'mercator/9'}),/unsupported/);
assert.deepEqual({...regional,projection:null},{...continental,projection:null},'both versions share the landing anchor');

// Identical terrain wherever the original projection reached.
const old=new PlanetGeography(seed,regional),wide=new PlanetGeography(seed,continental);
for(const [x,y] of [[0,0],[12800,-9000],[-30000,20000]])assert.deepEqual(old.region(x,y,32,32),wide.region(x,y,32,32));

// Extent: the original window ends near 15 degrees; the continental one does not.
assert.throws(()=>old.localToGeo(60000,0),/outside/);
const far=wide.localToGeo(300000,0);assert.ok(Math.abs(far.longitude-continental.anchor.longitude)>Math.PI/2);
const C=1048576,lat=continental.anchor.latitude,toPole=Math.floor((lat+CONTINENTAL_LIMITS.polarLatitude)/(2*Math.PI)*C);
assert.doesNotThrow(()=>wide.localToGeo(0,toPole-256));assert.throws(()=>wide.localToGeo(0,toPole+256),/outside/,'polar limit');
const half=C*Math.cos(lat)/2;assert.throws(()=>wide.localToGeo(half+10,0),/outside/,'no wrap past the antimeridian: terrain never repeats');

// Genuinely different climates become reachable.
const mean=(origin)=>{const w=new World(seed,{generator:'planetary/1',planetOrigin:origin});let t=0,n=0,wet=0;for(let i=0;i<w.len;i++){if(w.water[i]){wet++;continue}t+=w.temperature[i];n++}return{t:n?t/n:null,water:wet/w.len}};
const equatorY=Math.round(lat/(2*Math.PI)*C/128)*128,northY=-Math.round((70*Math.PI/180-lat)/(2*Math.PI)*C/128)*128;
const climates={landing:mean({x:0,y:0}),equatorial:mean({x:0,y:equatorY}),subpolar:mean({x:0,y:northY})};
const land=Object.values(climates).filter(c=>c.t!==null);
assert.ok(land.length>=2);
const temps=land.map(c=>c.t);assert.ok(Math.max(...temps)-Math.min(...temps)>.2,'latitude changes real climate: '+JSON.stringify(climates));

// Historical worlds keep their projection through travel, preparation and saves.
const legacy=new Simulation(seed,{player:true,worldGenerator:'planetary/1',planetDescriptor:regional});
assert.equal(legacy.world.planet.descriptor.projection,PLANET_PROJECTIONS.regional);
assert.equal(preparePlanetaryDestination(legacy,{x:128,y:0}).world.planet.descriptor.projection,PLANET_PROJECTIONS.regional);
const p=legacy.player();p.energy=SPECIES[p.species].maxEnergy*.94;p.hydration=SPECIES[p.species].maxHydration*.95;let east=null;
for(let y=8.5;y<118.5&&!east;y++){p.x=125.2;p.y=y;legacy.rebuildSpatial();if(planetaryTravelAvailability(legacy).enabled)east=crossPlanetaryBorder(legacy).simulation}
assert.equal(east.world.planet.descriptor.projection,PLANET_PROJECTIONS.regional,'crossing never adopts the wider map');
const back=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(east,{savedAt:'t',reason:'t'})));
assert.equal(back.world.planet.descriptor.projection,PLANET_PROJECTIONS.regional);
assert.equal(new Simulation(seed,{player:false,bootstrap:false,worldGenerator:'planetary/1'}).world.planet.descriptor.projection,PLANET_PROJECTIONS.continental);
console.log('Continental projection PASS: versioned descriptors, identical terrain in the original window, polar and antimeridian limits, distinct reachable climates '+JSON.stringify(Object.fromEntries(Object.entries(climates).map(([k,v])=>[k,v.t===null?'ocean':+v.t.toFixed(3)])))+', and historical worlds keeping their projection.');
