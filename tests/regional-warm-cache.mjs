import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';
import {planetaryTravelAvailability,crossPlanetaryBorder} from '../src/world/planetary-travel.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
import {markRegionalOwnerDirty} from '../src/world/regional-revision.js';
import {seedTableReuse} from '../src/world/planetary-offscreen-biology.js';
import {REGIONAL_WARM,regionalWarmSwitch,regionalWarmStats,takeWarmRegion,keepWarmRegion,warmCandidate,clearWarmRegions,warmRegionCount} from '../src/world/regional-warm-cache.js';

// Capacity: canonical neighbours displace far regions, never the reverse.
clearWarmRegions();
const fake=(mode,i)=>({key:'k'+i,biologicalMode:mode,snapshot:{core:{},world:{}}});
const far=[...Array(REGIONAL_WARM.capacity)].map((_,i)=>fake('regional-demography/1',i));
for(const s of far)keepWarmRegion(s,{});assert.equal(warmRegionCount(),REGIONAL_WARM.capacity);
assert.equal(warmCandidate(fake('regional-demography/1',99)),false,'a full cache does not take another far region');
const near=fake('canonical-ticks/1',50);assert.equal(warmCandidate(near),true);keepWarmRegion(near,{});
assert.equal(warmRegionCount(),REGIONAL_WARM.capacity);assert.ok(takeWarmRegion(near),'a canonical region displaced a far one');
// Invalidation: replaced snapshot, revision change, or in-place core edit.
clearWarmRegions();const s0=fake('canonical-ticks/1',1),sim0={};keepWarmRegion(s0,sim0);assert.equal(takeWarmRegion(s0),sim0);
keepWarmRegion(s0,sim0);markRegionalOwnerDirty(s0);assert.equal(takeWarmRegion(s0),null,'an in-place publication invalidates');
keepWarmRegion(s0,sim0);s0.snapshot.core.someRules='adopted';assert.equal(takeWarmRegion(s0),null,'a policy edit invalidates');
keepWarmRegion(s0,sim0);s0.snapshot={core:{},world:{}};assert.equal(takeWarmRegion(s0),null,'a replaced snapshot invalidates');
clearWarmRegions();

// Value parity on a real three-region world: warm continuation equals
// restoring every stride from the published snapshot.
function digest(value){const out=[],stack=new Set();const put=x=>{if(x===null||x===undefined){out.push(String(x));return}const t=typeof x;if(t==='number'){out.push(Object.is(x,-0)?'-0':String(x));return}if(t!=='object'){out.push(t+String(x));return}if(stack.has(x)){out.push('@');return}stack.add(x);
 if(ArrayBuffer.isView(x))out.push(x.constructor.name+Array.from(x,v=>Object.is(v,-0)?'-0':String(v)).join(','));else if(x instanceof Map){out.push('M');for(const [k,v] of x){put(k);put(v)}}else if(x instanceof Set){out.push('S');for(const v of x)put(v)}else if(Array.isArray(x)){out.push('[');for(const v of x)put(v);out.push(']')}else{out.push('{');for(const k of Object.keys(x).sort()){out.push(k);put(x[k])}out.push('}')}stack.delete(x)};put(value);return out.join('|')}
const cross=sim=>{const p=sim.player();p.energy=SPECIES[p.species].maxEnergy*.94;p.hydration=SPECIES[p.species].maxHydration*.95;for(let y=8.5;y<118.5;y++){p.x=125.2;p.y=y;sim.rebuildSpatial();if(planetaryTravelAvailability(sim).enabled)return crossPlanetaryBorder(sim).simulation}throw Error('no border')};
const build=()=>{let s=new Simulation('PLANET-B0-A',{player:true,worldGenerator:'planetary/1'});s=cross(s);for(let i=0;i<CFG.lifeStride*2;i++)s.update();return cross(s)};
regionalWarmSwitch.enabled=true;const warm=build();regionalWarmSwitch.enabled=false;const cold=build();
// Three days: each day's seam transaction publishes into the archived regions and
// applies the same edits to their warm Simulations, which then stay valid.
const before={...regionalWarmStats},reusedBefore=seedTableReuse.reused;seedTableReuse.verify=true;
for(let i=0;i<3*CFG.dayTicks+CFG.lifeStride;i++){regionalWarmSwitch.enabled=true;warm.update();regionalWarmSwitch.enabled=false;cold.update()}
regionalWarmSwitch.enabled=true;
assert.ok(warmRegionCount()>=1,'resident regions were kept warm');
assert.ok(regionalWarmStats.reused-before.reused>=3*CFG.dayTicks/CFG.lifeStride,`warm Simulations continued across seam days (${regionalWarmStats.reused-before.reused} strides)`);
assert.equal(regionalWarmStats.invalidated-before.invalidated,0,'no seam day forced a cold restore');
// Unchanged seed banks reuse their last packed table; each reuse was re-packed and equal.
assert.ok(seedTableReuse.reused-reusedBefore>=CFG.dayTicks/CFG.lifeStride,`unchanged seed banks reused their published table (${seedTableReuse.reused-reusedBefore} passes)`);seedTableReuse.verify=false;
assert.equal(digest(createSimulationSnapshot(warm,{savedAt:'t',reason:'t'})),digest(createSimulationSnapshot(cold,{savedAt:'t',reason:'t'})),'warm replay is value-identical to snapshot replay');
// A published warm checkpoint is independent of the live warm Simulation.
const session=warm.planetaryTravel.sessions[0],published=session.snapshot.world.plants.sunmoss[0];
const live=takeWarmRegion(session);assert.ok(live);live.world.plants.sunmoss[0]=published+5;
assert.equal(session.snapshot.world.plants.sunmoss[0],published,'warm ticks can never alter an archived checkpoint');
console.log('Regional warm cache PASS: canonical-priority capacity, invalidation on publication/policy/replacement, value-identical three-region replay and independent published checkpoints.');
