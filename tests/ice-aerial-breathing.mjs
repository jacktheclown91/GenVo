import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {FounderDesign} from '../src/lineage/founder-design.js';
import {place} from '../src/lineage/evolution-draft.js';
import {bodyMass} from '../src/organisms/body-mass.js';
import {advanceSurfaceIce,iceCapacity,fractureSurfaceIce} from '../src/world/surface-ice.js';
import {finishJump} from '../src/lineage/jumping.js';
import {endGlide} from '../src/lineage/gliding.js';
import {landingAvailability,land} from '../src/lineage/flight.js';
import {underIceBreathingTarget,stepDiving} from '../src/lineage/diving.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
const s=new Simulation('ICE-AERIAL-BREATHING',{surfaceIce:true,worldGenerator:'planetary/1'}),w=s.world,a=s.player();
let i=-1;for(let k=0;k<w.len;k++){const x=k%w.n,y=k/w.n|0;if(x>12&&y>12&&x<w.n-12&&y<w.n-12&&[k,k+1,k+2,k+w.n,k+w.n+1,k+w.n+2].every(j=>!w.water[j])){i=k;break}}assert.ok(i>=0);
const cells=[i,i+1,i+2,i+w.n,i+w.n+1,i+w.n+2];w.setSurfaceWater(cells.map(i=>({i,water:1,depth:1.5,salinity:0})),{reason:'Accounted aerial/under-ice routing fixture'});a.x=i%w.n+.5;a.y=(i/w.n|0)+.5;a.age=40;a.health=100;a.energy=90;
const e=w.environment;let day=0;while(iceCapacity(e,i)<bodyMass(a)&&day<100)advanceSurfaceIce(w,{temp:.1,rain:0},++day);
const stocks={ice:e.ice.slice(),volume:e.volume.slice(),salt:e.salt.slice()},rng=s.rng.state;
a.airborne=true;a.aerialMode='jump';a.jump={verticalVelocity:-3};const jumped=finishJump(a,w,{tick:s.tickCount});assert.equal(jumped.water,false);assert.equal(jumped.damage,0,'supported sheet is a real jump landing');
a.airborne=true;a.aerialMode='glide';a.glideAltitude=0;assert.equal(endGlide(a,w).water,false);a.airborne=true;assert.ok(landingAvailability(a,w).enabled);assert.ok(land(a,w).ok);assert.equal(a.airborne,false);assert.deepEqual(e.ice,stocks.ice);
a.airborne=true;a.aerialMode='jump';a.jump={verticalVelocity:-30};const impact=finishJump(a,w);assert.equal(e.iceBroken[i],1,'impact load can break a statically supporting sheet');assert.ok(impact.water&&impact.damage>0);assert.deepEqual(e.volume,stocks.volume);assert.deepEqual(e.salt,stocks.salt);assert.deepEqual(e.ice,stocks.ice);assert.equal(s.rng.state,rng);
// A bent liquid route requires a real waypoint rather than a diagonal across dry land.
const design=new FounderDesign('sandbox');for(const slot of ['limb.3','limb.5'])assert.ok(place(design.draft,'webbed-leg','root',slot).ok);a.bodyPlan=design.draft.plan;a.health=100;a.energy=90;a.x=(i+2)%w.n+.5;a.y=((i+2)/w.n|0)+.5;a.diveDepth=.2;a.diveTarget=0;a.diveAir=12;
const before=structuredClone(a),state=s.rng.state,opening=underIceBreathingTarget(s,a);assert.ok(opening);assert.equal(opening.breathingOpening,i);assert.equal(w.idx(opening.x,opening.y),i+1);assert.deepEqual(a,before);assert.equal(s.rng.state,state);
s.playerAutonomy=true;s.phaseDecision(null);assert.equal(a.intent,'escape');assert.equal(a.target.breathingOpening,i);assert.equal(a.diveTarget,0);
const restored=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(s,{savedAt:'breathing-route'})));assert.deepEqual(restored.player().target,a.target,'saved opening waypoint persists');
const startX=a.x,energy=a.energy;for(let k=0;k<500&&a.diveAir<24;k++){s.tickCount++;stepDiving(s,a,1/30);if(k%5===0)s.phaseDecision(null);s.phaseMovement({locomotionOnly:true})}
assert.ok(a.x<startX,'normal AUTO movement follows the breathing waypoint');assert.equal(a.diveDepth,0);assert.equal(a.diveAir,24);assert.ok(a.energy<energy,'route and respiration are paid');assert.ok(a.health>0);
console.log('Ice aerial/breathing PASS: shared supported landings, impact fracture without melt, read-only bounded breathing waypoint, saved target and normal paid AUTO route to exposed air.');
