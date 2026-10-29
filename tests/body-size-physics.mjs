// body-size S2: physical consequences of inherited size. Mass-proportional costs
// follow the scaling physics sets for them and enter each body's own reserves:
// transport M^0.68, work M, sustained power M^0.75, surface heat loss M^(2/3),
// flapping flight M^(7/6). Tissue stress grows as s, so falls and impacts land
// harder and wings and legs carry more load; jump height stays the anatomy's own
// (Borelli). Nothing grants speed for size. Bodies without the rule are unchanged.
import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {SIZE_PHYSICS,scaleMassCost,massCostToReserve,structuralScale,reserveScale} from '../src/organisms/body-size.js';
import {adultBodyMass,anatomicalAdultMass} from '../src/organisms/body-mass.js';
import {jumpKinematics,jumpLoad,finishJump} from '../src/lineage/jumping.js';
import {flightMass,flightLoading,advanceFlight} from '../src/lineage/flight.js';
import {glideLoading} from '../src/lineage/gliding.js';
import {stepClimb} from '../src/lineage/climbing.js';

const S=2,R=S**3;
const close=(x,y,label,tol=1e-9)=>assert.ok(Math.abs(x-y)<=tol*Math.max(1,Math.abs(x),Math.abs(y)),`${label}: ${x} vs ${y}`);
const sized=(a,s)=>{a.bodySize={schema:1,alleles:[Math.log(s),Math.log(s)]};return a};
const sim=new Simulation('SIZE-PHYSICS',{player:true,dayClock:true,metabolism:true,bodySize:true}),w=sim.world;
function paired(a,run){const keep=structuredClone(a),out={};for(const s of [1,S]){Object.assign(a,structuredClone(keep));sized(a,s);out[s]=run(s)}Object.assign(a,structuredClone(keep));return out}

// 0. The conversions. A cost proportional to M becomes M^e in absolute units and
// enters reserves (capacity ∝ M), so its reserve share changes by R^(e-1).
{
 const plain={species:'genvo'},big=sized({species:'genvo'},S);
 for(const e of Object.values(SIZE_PHYSICS)){assert.equal(massCostToReserve(plain,3.3,e),3.3);assert.equal(scaleMassCost(plain,3.3,e),3.3);
  close(scaleMassCost(big,R,e),R**e,'absolute cost follows M^e');close(massCostToReserve(big,R,e),R**(e-1),'reserve share changes by R^(e-1)')}
 assert.equal(structuralScale(plain),1);close(structuralScale(big),S,'tissue stress follows s');
}
// 1. Ground travel (the shared movement step): same distance, cost of transport M^0.68.
// A 2x body (8x mass) pays 8^0.68 = 4.1x the absolute food per tile, which is
// 8^-0.32 = 0.51 of the reserve share a reference body pays.
{
 const a=sim.player();w.water.fill(0);w.buildLandRegions();w.buildHydrology();
 const step=paired(a,()=>{Object.assign(a,{x:40.5,y:40.5,age:SPECIES[a.species].maturity,energy:80,health:100});const e=a.energy;sim.phasePlayerMovement({right:true});return{cost:e-a.energy,distance:a.x-40.5}});
 assert.ok(step[1].cost>0&&step[1].distance>0);
 assert.equal(step[S].distance,step[1].distance,'size grants no speed');
 close(step[S].cost/step[1].cost,R**(SIZE_PHYSICS.transport-1),'reserve share per tile follows M^-0.32');
 close(step[S].cost*R/step[1].cost,R**SIZE_PHYSICS.transport,'absolute cost per tile follows M^0.68');
}
// 2. Jumping: the same anatomy scaled up jumps as high and as far (muscle work and
// mass both s^3); its legs carry s times the stress; impacts injure s times as much.
{
 const a=sim.animals.find(x=>x.alive&&!x.player);
 const kin=paired(a,()=>({kin:jumpKinematics(a),load:jumpLoad(a),anat:anatomicalAdultMass(a),mass:adultBodyMass(a)}));
 assert.deepEqual(kin[S].kin,kin[1].kin,'jump height and range do not change with size');
 close(kin[S].load,kin[1].load*S,'limb loading follows s');close(kin[S].mass,kin[1].mass*R,'mass follows s^3');close(kin[S].anat,kin[1].anat,'anatomy unchanged');
 const land=paired(a,()=>{a.airborne=true;a.aerialMode='jump';a.health=100;a.jump={verticalVelocity:-8};return finishJump(a,w,{swimmer:true}).damage});
 assert.ok(land[1]>0);close(land[S],land[1]*S,'hard landings injure in proportion to tissue stress');
}
// 3. Flight: wing loading grows as s and the power margin shrinks as s^0.5, so a
// scaled anatomy loads its wings as mass·s^-1.5; flapping power is M^(7/6).
{
 const a=sim.animals.find(x=>x.alive&&!x.player);
 const fl=paired(a,()=>({mass:flightMass(a),loading:flightLoading(a),glide:glideLoading(a)}));
 close(fl[S].loading,fl[1].loading*S**1.5,'flight loading follows s^1.5');close(fl[S].glide,fl[1].glide*S,'glide loading follows s');
 const burn=paired(a,()=>{Object.assign(a,{airborne:true,aerialMode:null,energy:90,health:100});const e=a.energy;advanceFlight(a,w,1,{swimmer:true});return e-a.energy});
 close(burn[S]/burn[1],R**(SIZE_PHYSICS.flight-1),'flapping costs relatively more for larger bodies (M^7/6)');
}
// 4. Climbing: lifting the body is work (same reserve share per height); a fall injures by tissue stress.
{
 const a=sim.animals.find(x=>x.alive&&!x.player);
 const fall=paired(a,()=>{Object.assign(a,{health:100,perched:true,climb:{schema:1,height:2,target:3,x:a.x,y:a.y,elapsed:0}});const r=stepClimb(sim,a,.1);return r?.type==='climb-fall'?r.damage:null});
 assert.ok(fall[1]>0,'an unsupported climb falls');close(fall[S],fall[1]*S,'falls injure in proportion to tissue stress');
}
// 5. Cold-water immersion loses heat through the body surface (M^2/3).
{
 const a=sim.animals.find(x=>x.alive&&!x.player);
 close(massCostToReserve(sized({...a},S),R,SIZE_PHYSICS.surface)*R,R**(2/3),'immersion heat loss follows surface');
}
// 6. Bodies without the rule are unchanged: identity in every conversion.
{
 const plain=new Simulation('SIZE-PHYSICS',{player:true,dayClock:true,metabolism:true}),a=plain.animals.find(x=>x.alive);
 assert.equal(a.bodySize,undefined);assert.equal(flightLoading(a),flightMass(a));assert.equal(glideLoading(a),adultBodyMass(a));assert.equal(jumpLoad(a),anatomicalAdultMass(a));assert.equal(anatomicalAdultMass(a),adultBodyMass(a));
}
console.log(`Body size physics PASS: transport M^0.68 (reserve share x${(R**-.32).toFixed(3)} per tile at 2x, no speed gain), Borelli jumps with s-scaled limb load and impacts, flight loading s^1.5 and M^7/6 power, glide loading s, climbing falls by tissue stress, unsized bodies unchanged`);
