import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {makePlan,validatePlan} from '../src/lineage/body-plan.js';
import {PARTS} from '../src/lineage/part-registry.js';
import {partEffectFactors} from '../src/lineage/part-abilities.js';
import {mutatePlan} from '../src/lineage/body-inheritance.js';
import {RNG} from '../src/core/rng.js';
import {VISION,visionProfile,EYE_OPTICS} from '../src/lineage/vision.js';
import {creatureView,viewCanSee,visuallyObservable} from '../src/ecology/atmospheric-visibility.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {CFG} from '../src/sim/config.js';

// anatomical-vision/1 (creator direction 2026-10-22).
const sim=new Simulation('PLANET-B0-A',{player:true,worldGenerator:'planetary/1'}),classic=new Simulation('GENVO8-VISION',{player:true});
assert.equal(sim.visionRules,VISION.policy);assert.equal(classic.visionRules,undefined);
const legacyView=creatureView(classic,classic.player());assert.ok(!legacyView.anatomical&&legacyView.range<=24&&'rearLimit' in legacyView,'historical worlds keep the eye-count cone and 24-tile limit');

const body=(torso,eyes,senses=1)=>({id:-1,species:'genvo',alive:true,dir:2,x:64.5,y:64.5,genes:{senses},adaptations:[],
 bodyPlan:makePlan([{partId:torso,parent:null,socket:null},{partId:'grazing-mouth',parent:'root',socket:'mouth'},...Object.entries(eyes).map(([socket,partId])=>({partId,parent:'root',socket})),...[1,3,5,7].map(i=>({partId:'walking-leg',parent:'root',socket:'limb.'+i}))])});
const pair=(id,second=null)=>({'eye.left':id,'eye.right':id,...(second?{'eye.left.2':second,'eye.right.2':second}:{})});
const simple=body('stout-torso',pair('simple-eye')),hunter=body('stout-torso',pair('hunter-eye')),tele=body('stout-torso',pair('telescopic-eye')),raptor=body('stout-torso',pair('raptor-eye'));
const compound=body('stout-torso',pair('compound-eye')),pano=body('stout-torso',pair('panoramic-eye')),apex=body('barrel-torso',pair('raptor-eye','sentinel-eye'),1.05);
for(const a of [simple,raptor,pano,apex])assert.deepEqual(validatePlan(a.bodyPlan),{ok:true,errors:[]});

// Primitive sight stays poor; range and field of view evolve separately.
const P=a=>visionProfile(a);
assert.ok(P(simple).range<=8.5&&P(simple).fieldOfView<240,'primitive eyes: short range, partial view');
assert.ok(P(simple).range<P(hunter).range&&P(hunter).range<P(tele).range&&P(tele).range<P(raptor).range,'the long-range line improves reach step by step');
assert.ok(P(raptor).fieldOfView<P(simple).fieldOfView,'a specialised long-range eye narrows the view');
assert.ok(P(simple).fieldOfView<P(compound).fieldOfView&&P(compound).fieldOfView<P(pano).fieldOfView&&P(pano).range<P(tele).range,'the panoramic line widens the view without long reach');
assert.equal(P(apex).fieldOfView,360);assert.ok(P(apex).range>=40,'a late four-eyed combination sees far all around');
assert.equal(P(body('stout-torso',{})).range,VISION.eyelessRange);

// Geometry on a level, clear world: the observer stands in the centre.
const flat=new Simulation('PLANET-B0-A',{player:true,worldGenerator:'planetary/1'}),w=flat.world;
w.terrain.elevation.fill(.3);w.moisture.fill(.2);w.temperature.fill(.6);
const at=(a,x,y)=>{flat.animals=[flat.player(),{...a}];const v=creatureView(flat,{...a,x:64.5,y:64.5});return viewCanSee(v,x,y)};
// Facing east (dir 2): far ahead versus close behind.
assert.equal(at(raptor,64.5+36,64.5),true,'a raptor eye sees 36 tiles ahead');assert.equal(at(raptor,64.5-5,64.5),false,'but not 5 tiles behind');
assert.equal(at(pano,64.5-10,64.5),true,'a panoramic eye sees behind');assert.equal(at(pano,64.5+20,64.5),false,'but not 20 tiles ahead');
assert.equal(at(simple,64.5+20,64.5),false);
// Full screen at the normal 2x zoom of a 1920x1080 view (30 x 17 tiles each way),
// in favourable conditions; physical ranges, not monitor pixels, decide it.
const halfW=1920/(CFG.tileSize*2)/2,halfH=1080/(CFG.tileSize*2)/2;let seen=0,total=0,seenSimple=0;
for(let dy=-halfH;dy<=halfH;dy+=1)for(let dx=-halfW;dx<=halfW;dx+=1){total++;if(at(apex,64.5+dx,64.5+dy))seen++;if(at(simple,64.5+dx,64.5+dy))seenSimple++}
assert.equal(seen,total,'the evolved combination perceives the whole gameplay screen');assert.ok(seenSimple/total<.15,'primitive eyes see a small part of it ('+(seenSimple/total*100).toFixed(0)+'%)');

// Physical limits stay meaningful. A ridge 4 tiles high blocks the ray.
for(let y=60;y<70;y++)w.terrain.elevation[w.idx(80,y)]=.8;
assert.equal(at(raptor,64.5+30,64.5),false,'relief blocks long sight');assert.equal(at(raptor,64.5+14,64.5),true,'ground before the ridge stays visible');
w.terrain.elevation.fill(.3);
// Dense cold fog at the observer collapses reach.
for(let i=0;i<w.len;i++){w.moisture[i]=1;w.temperature[i]=.2}
const fogView=creatureView(flat,{...raptor,x:64.5,y:64.5});assert.ok(fogView.extinction>.05);assert.equal(viewCanSee(fogView,64.5+30,64.5),false,'dense fog hides distant targets');assert.equal(viewCanSee(fogView,64.5+3,64.5),true);
w.moisture.fill(.2);w.temperature.fill(.6);
// Below ground and under water the medium still limits every eye.
assert.ok(creatureView(flat,{...raptor,underground:true}).range<=4);assert.ok(creatureView(flat,{...raptor,diveDepth:.5}).range<=3.5);

// One authority: a wildlife hunter perceives (and so can target) through the same eyes.
const hunterAnimal={...raptor,id:9001,x:64.5,y:64.5},preyAhead={id:9002,alive:true,x:64.5+34,y:64.5},preyBehind={id:9003,alive:true,x:64.5-4,y:64.5};
assert.equal(visuallyObservable(flat,hunterAnimal,preyAhead),true);assert.equal(visuallyObservable(flat,hunterAnimal,preyBehind),false);
assert.equal(flat.preyHiddenFrom(preyAhead,hunterAnimal),false);assert.equal(flat.preyHiddenFrom(preyBehind,hunterAnimal),true);

// Organs cost mass, upkeep and food.
for(const id of ['telescopic-eye','raptor-eye','panoramic-eye','sentinel-eye']){const p=PARTS[id];assert.ok(p.mass>PARTS['simple-eye'].mass&&p.upkeep>PARTS['simple-eye'].upkeep,id);assert.ok(EYE_OPTICS[id])}
assert.ok(partEffectFactors(apex).metabolism>partEffectFactors(simple).metabolism,'advanced eyes raise food upkeep');
assert.deepEqual(PARTS['raptor-eye'].developmentalPrerequisites,['telescopic-eye']);assert.deepEqual(PARTS['sentinel-eye'].developmentalPrerequisites,['panoramic-eye']);

// Evolution reaches them step by step only where the policy is recorded.
const reach=(plan,test,vision)=>{for(let s=0;s<4000;s++)if(test(mutatePlan(new RNG('vision-'+s),plan,{vision})))return true;return false};
const has=id=>p=>p.nodes.some(n=>n.partId===id);
assert.equal(reach(hunter.bodyPlan,has('telescopic-eye'),true),true);assert.equal(reach(tele.bodyPlan,has('raptor-eye'),true),true);
assert.equal(reach(compound.bodyPlan,has('panoramic-eye'),true),true);assert.equal(reach(pano.bodyPlan,has('sentinel-eye'),true),true);
assert.equal(reach(simple.bodyPlan,has('raptor-eye'),true),false,'no skipped developmental steps');
const big=body('barrel-torso',pair('compound-eye')).bodyPlan;assert.equal(reach(big,p=>p.nodes.some(n=>n.socket==='eye.left.2'),true),true,'large heads can grow a second eye pair');
assert.equal(reach(hunter.bodyPlan,has('telescopic-eye'),false),false);assert.equal(reach(big,p=>p.nodes.some(n=>n.socket==='eye.left.2'),false),false,'historical lineages keep their mutation options');

// Saves record the policy; historical saves stay without it; unknown rules fail.
const snap=structuredClone(createSimulationSnapshot(sim,{savedAt:'t',reason:'t'}));
assert.equal(restoreSimulationSnapshot(structuredClone(snap)).visionRules,VISION.policy);
const old=structuredClone(snap);delete old.core.visionRules;assert.equal(restoreSimulationSnapshot(old).visionRules,undefined);
const bad=structuredClone(snap);bad.core.visionRules='x-ray/9';assert.throws(()=>restoreSimulationSnapshot(bad),/Unknown anatomical vision/);
console.log('Anatomical vision PASS: poor primitive sight, separate range and field of view, '+seen+'/'+total+' screen cells for the evolved combination ('+(seenSimple/total*100).toFixed(0)+'% primitive), relief/fog/medium limits, one authority for wildlife targeting, costs, stepwise policy-gated evolution and save policy.');
