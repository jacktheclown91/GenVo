import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {PARTS,limbSlot} from '../src/lineage/part-registry.js';
import {createDraft,place,remove,replaceRoot,draftCost,draftProblems,mirrorSocket} from '../src/lineage/evolution-draft.js';
import {planFor,applyLineageTarget} from '../src/lineage/reproduction-bridge.js';
import {bodyPlanFromLegacy} from '../src/lineage/body-plan.js';
import {adaptationEffects} from '../src/lineage/evolution.js';
import {threatSenseEffect,forageRangeEffect} from '../src/lineage/effects.js';
import {movementProfile} from '../src/lineage/lifestyle.js';
import {partEffectFactors,partFoodFactor,WAVE1} from '../src/lineage/part-abilities.js';
import {assemblyFor} from '../src/render/creature-assembler.js';
import {drawGenvoSprite} from '../src/render/genvo-draw.js';
import {phenotypeFor} from '../src/organisms/species.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

// Wave 1 (creator decision 2026-10-09): eight bodies, legs, mouths and eyes. Bodies differ in
// shape and slots (bigger bodies carry more parts and cost more), and leg count sets land speed.

const ALL=Object.keys(PARTS);
// Designs start from the old eight-legged body, now a mid-developed creature (v1.39.0).
const draftOf=a=>createDraft({base:bodyPlanFromLegacy(a),ancestry:ALL,budget:99});
function designed(a,fn){const d=draftOf(a);fn(d);assert.deepEqual(draftProblems(d).filter(p=>!/MP/.test(p)),[]);applyLineageTarget(a,d.plan);return d}
const sim=new Simulation('GENVO8-WAVE1',{player:true}),w=sim.world;
const genvos=sim.animals.filter(a=>a.alive&&a.species==='genvo').slice(0,16);let next=0;const body=()=>{const a=genvos[next++];a.adaptations=[];a.anatomy={};return a};
const land=a=>movementProfile(a,w,{fromX:20.5,fromY:20.5,toX:20.5,toY:20.5}).speed;
const at=w.water[w.idx(20,20)];assert.equal(at,0,'test tile is land');

// Socket counts by body: small bodies have fewer slots, big bodies more.
const limbs=id=>PARTS[id].providedSockets.filter(s=>s.type==='limb').length,flank=id=>PARTS[id].providedSockets.find(s=>s.id==='flank.left').max,eyes=id=>PARTS[id].providedSockets.filter(s=>s.type==='eye').length;
assert.equal(limbs('light-torso'),6);assert.equal(limbs('soft-torso'),8);assert.equal(limbs('barrel-torso'),10);assert.equal(limbs('long-torso'),12);
assert.equal(flank('sleek-torso'),1);assert.equal(flank('stout-torso'),3);assert.equal(eyes('long-torso'),4);
assert.ok(PARTS['long-torso'].mutationCost>PARTS['soft-torso'].mutationCost&&PARTS['barrel-torso'].mutationCost>PARTS['stout-torso'].mutationCost,'bigger bodies cost more');
assert.equal(mirrorSocket('limb.9'),'limb.14');assert.equal(mirrorSocket('limb.10'),'limb.13');assert.equal(limbSlot('limb.13'),11);

// Leg count sets land speed: fewer legs are slower, more legs faster with upkeep.
{const four=body();designed(four,d=>{for(const i of [0,2,4,6])remove(d,`root/limb.${i}`)});
 const eight=body();designed(eight,d=>{});
 const twelve=body();designed(twelve,d=>{replaceRoot(d,'long-torso');for(const i of [9,10,13,14])place(d,'walking-leg','root',`limb.${i}`)});
 assert.equal(partEffectFactors(four).legs,4);assert.equal(partEffectFactors(twelve).legs,12);
 assert.ok(land(four)<land(eight)&&land(eight)<land(twelve)*.99,`speed ${land(four)} < ${land(eight)} < ${land(twelve)}`);
 assert.ok(adaptationEffects(twelve).metabolism>adaptationEffects(eight).metabolism,'extra legs cost upkeep');
 // Runner legs are faster, sturdy legs slower but brace harder.
 const run=body();designed(run,d=>{for(const i of [0,1,2,3,4,5,6,7])place(d,'runner-leg','root',`limb.${i}`)});
 const sturdy=body();designed(sturdy,d=>{for(const i of [0,1,2,3,4,5,6,7])place(d,'sturdy-leg','root',`limb.${i}`)});
 assert.ok(land(run)>land(eight)&&land(sturdy)<land(eight));assert.ok(partEffectFactors(sturdy).brace<1&&partEffectFactors(run).brace>1)}

// Replacing the torso drops parts on sockets the new body lacks, and charges for the body.
{const a=body(),d=draftOf(a);const before=draftCost(d);replaceRoot(d,'light-torso');assert.equal(d.plan.nodes.filter(n=>/^root\/limb\.\d+$/.test(n.id)).length,6);assert.ok(draftCost(d)>before);
 const d2=draftOf(a);replaceRoot(d2,'long-torso');for(const i of [9,10,13,14])assert.equal(place(d2,'walking-leg','root',`limb.${i}`).ok,true);assert.equal(place(d2,'simple-eye','root','eye.left.2').ok,true);
 assert.equal(place(draftOf(a),'walking-leg','root','limb.9').ok,false,'a soft torso has no middle leg slots')}

// Bodies: shape and trade-offs.
{const dome=body();designed(dome,d=>replaceRoot(d,'dome-torso'));assert.equal(partEffectFactors(dome).rearDamage,WAVE1.bodies['dome-torso'].rearDamage);
 const barrel=body();designed(barrel,d=>replaceRoot(d,'barrel-torso'));assert.ok(adaptationEffects(barrel).waterUse<1);
 const sleek=body();designed(sleek,d=>replaceRoot(d,'sleek-torso'));assert.ok(adaptationEffects(sleek).sprintSpeed>1);
 assert.ok(assemblyFor(sleek).shape.length>assemblyFor(barrel).shape.length*.99&&assemblyFor(barrel).shape.width>assemblyFor(sleek).shape.width,'distinct shapes')}

// Mouths and eyes.
{const beak=body();designed(beak,d=>place(d,'beak-mouth','root','mouth'));assert.ok(partFoodFactor(beak,{kind:'thistlepod'})>1&&partFoodFactor(beak,{kind:'bramble'})<1);
 const sucker=body();designed(sucker,d=>place(d,'sucker-mouth','root','mouth'));assert.ok(sim.speciesLifestyle.foodEnergyMultiplier(sucker,{kind:'carrion'})>=1.4*sim.speciesLifestyle.lifestyleFoodMultiplier(sucker,{kind:'carrion'})-1e-9);
 const stalk=body();designed(stalk,d=>{place(d,'stalk-eye','root','eye.left');place(d,'stalk-eye','root','eye.right')});assert.ok(forageRangeEffect(sim,stalk)>forageRangeEffect(sim,genvos[15]));
 const spot=body();designed(spot,d=>{place(d,'eyespot','root','eye.left');place(d,'eyespot','root','eye.right')});assert.ok(threatSenseEffect(sim,spot)<threatSenseEffect(sim,genvos[15]))}
// Display eyes court at lower energy.
{const p=sim.player(),m=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.sex!==p.sex&&a.id!==p.id&&!genvos.slice(0,next).includes(a));for(const a of [p,m]){a.age=SPECIES.genvo.maturity+5;a.reproCooldown=0;a.pregnant=null;a.health=100;a.energy=SPECIES.genvo.maxEnergy*.55}
 sim.recovery.kinship=()=>'none';const plainOk=sim.canMatePair(p,m,{ready:true});for(const a of [p,m])designed(a,d=>{place(d,'display-eye','root','eye.left');place(d,'display-eye','root','eye.right')});
 assert.equal(plainOk,false);assert.equal(sim.canMatePair(p,m,{ready:true}),true,'display eyes court at lower energy')}

// Every new part draws in all facings without errors on a designed body.
{const a=body();designed(a,d=>{replaceRoot(d,'long-torso');for(const i of [9,10,13,14])place(d,'padded-leg','root',`limb.${i}`);place(d,'gape-mouth','root','mouth');place(d,'compound-eye','root','eye.left');place(d,'stalk-eye','root','eye.right');place(d,'tracker-eye','root','eye.left.2');place(d,'display-eye','root','eye.right.2')});
 let ops=0;const c={set fillStyle(v){},fillRect(){ops++}};for(let dir=0;dir<8;dir++)for(let frame=0;frame<8;frame++)drawGenvoSprite(c,{animal:{...a,dir},phenotype:phenotypeFor(a),scale:3,frame,moving:true,palette:{body:'#7aa8e8',shade:'#3d5e9a',light:'#cfe3ff'},pose:{dir}});
 assert.ok(ops>1000)}

// Saves keep designed bodies and their abilities.
{const r=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(sim)));for(const a of genvos.slice(0,next)){const b=r.animals.find(x=>x.id===a.id);assert.deepEqual(partEffectFactors(b),partEffectFactors(a))}}
console.log('parts wave 1 ok');
