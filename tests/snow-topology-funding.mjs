import assert from 'node:assert/strict';
import {World} from '../src/world/world.js';
import {validateSnowpack} from '../src/world/snowpack.js';
import {initializeSoilWater} from '../src/ecology/soil-water.js';
import {totalPlanetarySurfaceWater} from '../src/world/planetary-runoff.js';

// Changing a dry snowy cell directly into open water would hide an existing
// finite snow reservoir below a new lake. No melting or outside import is
// permitted to silently destroy that stored water. Native thaw owns it.
const w=new World('SNOW-TOPOLOGY-REAL',{generator:'planetary/1'});
const snow=initializeSoilWater(w).snowpack;
assert.ok(snow instanceof Float64Array,'planetary region must own physical persistent snow');
const n=w.n;
let site=-1;
for(let y=2;y<n-2&&site<0;y++)for(let x=2;x<n-2;x++){
 const i=y*n+x;
 if(!w.water[i]){site=i;break;}
}
assert.ok(site>=0,'test needs genuine dry terrain');
const e=w.environment;
const baseline=totalPlanetarySurfaceWater(w);
e.overland[site]=.75;
snow[site]=.10;
const withSnowWater=totalPlanetarySurfaceWater(w);
const beforeRevision=w.topology.revision;
assert.throws(()=>w.setSurfaceWater([
 {i:site,water:1,depth:.75,salinity:0,source:'overland'}
],{reason:'flood-over-snow'}),/Cannot inundate land with stored snow water/);
assert.equal(w.water[site],0);
assert.equal(snow[site],.10,'snow stays physically owned by land');
assert.equal(e.overland[site],.75);
assert.equal(w.topology.revision,beforeRevision);
assert.equal(totalPlanetarySurfaceWater(w),withSnowWater);
validateSnowpack(w,snow);

// The actual thaw process, not a new topology action, has to pay the snow
// debit before a runoff-funded inundation becomes eligible.
snow[site]=0;
const receipt=w.setSurfaceWater([
 {i:site,water:1,depth:.75,salinity:0,source:'overland'}
],{reason:'thawed-runoff'});
assert.equal(w.water[site],1);
assert.equal(w.environment.overland[site],0);
assert.equal(w.environment.volume[site],.75);
assert.equal(receipt.waterInput,0);
assert.equal(receipt.internalWater,.75);
assert.equal(totalPlanetarySurfaceWater(w),withSnowWater);
validateSnowpack(w,w.soilWater.snowpack);
assert.ok(Number.isFinite(baseline));
console.log('Snow topology: physically stored snow blocks flooded-cell creation, no hidden snow under open water, finite thawed runoff remains conserved PASS');
