import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {createDraft,place} from '../src/lineage/evolution-draft.js';
import {PARTS} from '../src/lineage/part-registry.js';
import {canSwim,movementProfile} from '../src/lineage/lifestyle.js';
import {isWaterDweller,swimsByBody,nearestWater,AQUATIC} from '../src/lineage/aquatic.js';
import {wildBranch,wildStartPlan} from '../src/organisms/wild-bodies.js';
import {mutatePlan} from '../src/lineage/body-inheritance.js';
import {RNG} from '../src/core/rng.js';
import {FRESHWATER_FOOD,freshwaterPreference} from '../src/ecology/freshwater-food.js';

// v1.61.0 (creator direction 2026-10-10): "a purely aquatic stalker or hopper should be able to evolve".
const sim=new Simulation('GENVO8-AQUATIC',{player:false});sim.update(null);
const evolve=(a,edits)=>{const d=createDraft({base:a.bodyPlan,ancestry:Object.keys(PARTS),budget:99});for(const [part,socket] of edits){const r=place(d,part,'root',socket);assert.equal(r.ok,true,`${part}@${socket}: ${r.reason}`)}a.bodyPlan=d.plan;return a};
const legsOf=a=>a.bodyPlan.nodes.filter(n=>/^root\/limb\.\d+$/.test(n.id)).map(n=>n.socket);
const aquatic=(a,mouth)=>evolve(a,[...legsOf(a).map(s=>['webbed-leg',s]),['paddle-tail','tail'],['storage-sac','flank.left'],['gill-slits','flank.left'],...(mouth?[[mouth,'mouth']]:[])]);

// Two webbed legs swim, for wild creatures too (the part's own promise).
const hop=sim.animals.find(a=>a.alive&&a.species==='mosskip');
{const h={...hop,id:-1};evolve(h,[['webbed-leg','limb.3'],['webbed-leg','limb.5']]);assert.equal(swimsByBody(h),true);assert.equal(canSwim(h),true);assert.equal(isWaterDweller(h),false,'a swimmer is not yet a water dweller')}
assert.equal(canSwim(hop),false,'the starting Hopper cannot swim');

// A water dweller: every leg webbed, a paddle tail and gills. Fast in water, slow ashore, and named for it.
const fish=aquatic({...hop,id:-2},'filter-mouth');assert.equal(isWaterDweller(fish),true);assert.equal(wildBranch(fish).label,'Aquatic Hopper');
const w=sim.world,water=nearestWater(w,64,64,64);assert.ok(water,'the world has water');
const land=movementProfile(fish,w,{fromX:hop.x,fromY:hop.y,toX:hop.x,toY:hop.y}),swim=movementProfile(fish,w,{fromX:water.x,fromY:water.y,toX:water.x,toY:water.y});
const plainSwimmer=evolve({...hop,id:-3},[['webbed-leg','limb.3'],['webbed-leg','limb.5']]),plainSwim=movementProfile(plainSwimmer,w,{fromX:water.x,fromY:water.y,toX:water.x,toY:water.y});
assert.ok(swim.speed>plainSwim.speed&&swim.energy<plainSwim.energy,'a dweller swims faster and cheaper than a webbed swimmer');
assert.ok(land.speed<movementProfile(plainSwimmer,w,{fromX:hop.x,fromY:hop.y,toX:hop.x,toY:hop.y}).speed,'and is slow on land');

// It lives in water: in a world run it stays in or returns to water, keeps its water up and feeds there.
{const s=new Simulation('GENVO8-AQUATIC-LIFE',{player:false});s.update(null);const h=s.animals.find(a=>a.alive&&a.species==='mosskip'&&nearestWater(s.world,a.x,a.y,10));assert.ok(h,'a Hopper lives near water');aquatic(h,'filter-mouth');
 // Start it ashore two tiles from water (land animals cover only a tile or so a day).
 {const wt=nearestWater(s.world,h.x,h.y,10);for(const [dx,dy] of [[2,0],[-2,0],[0,2],[0,-2],[2,2],[-2,-2]]){const x=wt.x+dx,y=wt.y+dy;if(!s.world.water[s.world.idx(x,y)]){h.x=x;h.y=y;break}}s.rebuildSpatial?.()}
 const ashore=!s.world.water[s.world.idx(h.x,h.y)];let wet=0,steps=0,reached=false;const ashoreWhy={};let bankMeals=0;const startDay=s.day;
 while(s.day<startDay+12&&h.alive){s.update(null);steps++;if(s.world.water[s.world.idx(h.x,h.y)]){wet++;reached=true}else if(reached){ashoreWhy[h.intent]=(ashoreWhy[h.intent]||0)+1;const m=h.lastFreshwaterMeal;if(h.intent==='feed'&&m?.tick===s.tickCount&&m.amount>0&&Number.isFinite(m.amount)&&FRESHWATER_FOOD[m.kind]?.surface&&freshwaterPreference(h,m.kind)>0){let adjacent=false;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const x=Math.floor(h.x)+dx+.5,y=Math.floor(h.y)+dy+.5;if(s.world.water[s.world.idx(x,y)]&&Math.hypot(x-h.x,y-h.y)<=1.5)adjacent=true}if(adjacent)bankMeals++}}}
 assert.equal(h.alive,true,'an aquatic filter feeder survives 12 days');assert.ok(reached&&wet/steps>.4,`it reaches water and spends much of its time there (${(wet/steps*100).toFixed(0)}%, started ${ashore?'ashore':'in water'})`);
 for(const why of Object.keys(ashoreWhy))assert.ok(['to-water','mate','swim','escape','flee'].includes(why)||(why==='feed'&&bankMeals===ashoreWhy.feed),`shore actions require return, mating, escape or a verified compatible freshwater bank meal (${why})`);
 assert.ok(h.hydration/SPECIES.mosskip.maxHydration>.5&&h.energy/SPECIES.mosskip.maxEnergy>.4,'water and food come from where it lives')}

// An aquatic Stalker hunts from the water: it can reach prey a land-bound Stalker cannot.
{const s=new Simulation('GENVO8-AQUATIC-HUNT',{player:false});s.update(null);const st=s.animals.find(a=>a.alive&&a.species==='needlejaw');aquatic(st);assert.equal(wildBranch(st).label,'Aquatic Stalker');
 const wt=nearestWater(s.world,st.x,st.y,64);st.x=wt.x;st.y=wt.y;const prey=s.animals.find(a=>a.alive&&a.species==='mosskip');prey.x=wt.x+2;prey.y=wt.y;s.rebuildSpatial?.();st.energy=SPECIES.needlejaw.maxEnergy*.4;
 assert.ok(s.bestPrey(st,26),'a swimming hunter finds prey across the water line')}

// It can evolve: random mutation reaches a water-dwelling body from both starting bodies.
for(const sp of ['mosskip','needlejaw']){let reached=0;const rng=new RNG('aquatic-reach-'+sp);
 for(let l=0;l<1500&&!reached;l++){let p=wildStartPlan(sp);for(let g=0;g<150;g++){p=mutatePlan(rng,p);if(isWaterDweller({bodyPlan:p})){reached++;break}}}
 assert.ok(reached,`${sp}: mutation can reach a water-dwelling body`)}
console.log('aquatic ok');
