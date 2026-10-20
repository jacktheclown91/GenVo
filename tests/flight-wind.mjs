import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {movementProfile} from '../src/lineage/lifestyle.js';
import {FLIGHT_WIND,flightWindAt,flightWindFactors,flightWindReading} from '../src/lineage/flight-wind.js';
import {validateEnvironment} from '../src/world/environment.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

const sim=new Simulation('FLIGHT-WIND-INTEGRATION',{worldGenerator:'planetary/1'}),w=sim.world,p=sim.player();
assert.equal(w.environment.flightWindPolicy,FLIGHT_WIND.policy);
const rng=sim.rng.state;
// Controlled airborne fixture: this test isolates shared directional movement,
// not the already separately verified evolutionary route to wings/takeoff.
p.x=64.5;p.y=64.5;p.airborne=true;
const wind=flightWindAt(w,p.x,p.y),length=Math.hypot(wind.east,wind.south);
assert.ok(length>0);
const dx=wind.east/length,dy=wind.south/length,
 along={toX:p.x+dx,toY:p.y+dy},against={toX:p.x-dx,toY:p.y-dy},
 across={toX:p.x-dy,toY:p.y+dx};
const tail=movementProfile(p,w,along),head=movementProfile(p,w,against),cross=movementProfile(p,w,across);
assert.ok(tail.speed>1.48&&head.speed<1.48,'ground speed responds to actual heading in the same atmosphere');
assert.ok(head.energy>tail.energy&&cross.energy>tail.energy,'head/crosswind maneuvering has a real movement energy cost');
assert.deepEqual(movementProfile({...p,player:false,lineage:false},w,against),head,'identical wild and controlled bodies share wind rules');
assert.deepEqual(flightWindFactors(p,w),{speed:1,energy:1,along:0,cross:0,wind},'idle reading does not manufacture directional work');
assert.equal(sim.rng.state,rng,'readings never consume biological RNG');
assert.match(flightWindReading(p,w).description,/costs more food energy/);
const snapshot=structuredClone(createSimulationSnapshot(sim,{savedAt:'fixed',reason:'wind'}));
const restored=restoreSimulationSnapshot(structuredClone(snapshot));
assert.deepEqual(movementProfile(restored.player(),restored.world,against),head,'restore preserves the physical clock and exact flight effect');
assert.equal(restored.world.environment.flightWindPolicy,FLIGHT_WIND.policy);

// Actual controlled motion pays from the same organism's existing energy.
// Compare policy-on/off copies of the same recorded world and organism.
const current=restoreSimulationSnapshot(structuredClone(snapshot)),legacySnapshot=structuredClone(snapshot);
delete legacySnapshot.world.environment.flightWindPolicy;
const legacy=restoreSimulationSnapshot(legacySnapshot);
assert.equal(legacy.world.environment.flightWindPolicy,undefined,'restore must not opt historical saves into new movement');
assert.equal(movementProfile(legacy.player(),legacy.world,against).speed,1.48);
assert.equal(movementProfile(legacy.player(),legacy.world,against).energy,1.85);
// Choose a cardinal headwind so the exact same input can drive both paths.
const input=Math.abs(wind.east)>=Math.abs(wind.south)?(wind.east>0?{left:true}:{right:true}):(wind.south>0?{up:true}:{down:true});
const start={x:p.x,y:p.y};
const ec=current.player().energy,el=legacy.player().energy;
assert.equal(current.phasePlayerMovement(input),true);
assert.equal(legacy.phasePlayerMovement(input),true);
const distance=a=>Math.hypot(a.x-start.x,a.y-start.y);
assert.ok(distance(current.player())<distance(legacy.player()),'real input traverses less distance against wind');
assert.ok(ec-current.player().energy>0&&el-legacy.player().energy>0,'both movements are actually funded');
assert.ok((ec-current.player().energy)/distance(current.player())>(el-legacy.player().energy)/distance(legacy.player()),'real headwind charges more energy per traveled tile');
const a=restoreSimulationSnapshot(structuredClone(snapshot)),b=restoreSimulationSnapshot(structuredClone(snapshot));
a.phasePlayerMovement(input);b.phasePlayerMovement(input);
assert.deepEqual(a.player(),b.player(),'identical restored input continues exactly');

const before=movementProfile({...p,airborne:false},w,{toX:p.x,toY:p.y});
delete w.environment.flightWindPolicy;
assert.deepEqual(movementProfile({...p,airborne:false},w,{toX:p.x,toY:p.y}),before,'ground movement is unaffected');
w.environment.flightWindPolicy='unknown/9';
assert.throws(()=>validateEnvironment(w,w.environment),/flight-wind policy/);
const forged=structuredClone(snapshot);forged.world.environment.flightWindPolicy='unknown/9';
assert.throws(()=>restoreSimulationSnapshot(forged),/flight-wind policy/,'unknown saved rules fail closed');
console.log('Flight wind: shared directional costs, real control movement, no RNG, exact restore/continuation, legacy preservation and unknown-policy refusal PASS');
