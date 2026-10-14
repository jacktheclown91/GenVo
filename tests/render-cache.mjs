import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {Renderer} from '../src/render/renderer.js';
import {buildSmoothedHabitatField} from '../src/render/habitat.js';
import {visualCompositionAt} from '../src/render/composition.js';
import {riverIdentityAt} from '../src/render/identity.js';

const sim=new Simulation('GENVO8-RENDER-CACHE',{player:false});
const field=buildSmoothedHabitatField(sim.world);
const a=visualCompositionAt(sim.world,32.5,48.5,field),b=visualCompositionAt(sim.world,32.5,48.5,field);
assert.strictEqual(a,b,'composition results are reused for the same daily habitat field');
const r1=riverIdentityAt(sim.world,64,64),r2=riverIdentityAt(sim.world,64,64);
assert.strictEqual(r1,r2,'static river topology results are reused');

const renderer=Object.create(Renderer.prototype);renderer.sim=sim;renderer.habitatField=field;renderer.habitatMaskCache=new Map();
const m1=renderer.visualHabitatMask(31,47),m2=renderer.visualHabitatMask(31,47);
assert.strictEqual(m1,m2,'sub-tile habitat mask is built once and reused');
assert.equal(renderer.habitatMaskCache.size,1);
renderer.staticLandTileCache=new Map();renderer.terrainChunkCache=new Map();
const ci=sim.world.idx(31,47),sig1=renderer.plantVisualSignature(ci);sim.world.plants.sunmoss[ci]=Math.max(0,sim.world.plants.sunmoss[ci]-.12);const sig2=renderer.plantVisualSignature(ci);
assert.notEqual(sig1,sig2,'terrain cache signature notices meaningful live biomass changes');

console.log('renderer cache contracts: PASS');
