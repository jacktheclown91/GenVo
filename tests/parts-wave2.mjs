import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES,phenotypeFor} from '../src/organisms/species.js';
import {CFG} from '../src/sim/config.js';
import {PARTS} from '../src/lineage/part-registry.js';
import {createDraft,place} from '../src/lineage/evolution-draft.js';
import {applyLineageTarget} from '../src/lineage/reproduction-bridge.js';
import {bodyPlanFromLegacy} from '../src/lineage/body-plan.js';
import {adaptationEffects} from '../src/lineage/evolution.js';
import {movementProfile} from '../src/lineage/lifestyle.js';
import {partEffectFactors,WAVE2} from '../src/lineage/part-abilities.js';
import {mutatePlan,founderPlan} from '../src/lineage/body-inheritance.js';
import {drawGenvoSprite} from '../src/render/genvo-draw.js';

// Wave 2 (2026-10-09): tails, backs, flanks and spurs, eight each, one ability and one cost each.
const ALL=Object.keys(PARTS);
const sim=new Simulation('GENVO8-WAVE2',{player:true});const pool=sim.animals.filter(a=>a.alive&&a.species==='genvo').slice(0,20);let next=0;
function design(edits){const a=pool[next++];a.adaptations=[];a.anatomy={};const d=createDraft({base:bodyPlanFromLegacy(a),ancestry:ALL,budget:99});for(const [part,parent,socket] of edits){const r=place(d,part,parent||'root',socket);assert.equal(r.ok,true,`${part}: ${r.reason}`)}applyLineageTarget(a,d.plan);return a}
const plain=design([]),pf0=partEffectFactors(plain);

// Every wave 2 part has an ability and a cost (at least one benefit and one drawback modifier).
for(const [id,mod] of Object.entries(WAVE2))assert.ok(Object.keys(mod).length>=2,`${id} has an ability and a cost`);

// Tails.
{const a=design([['balance-tail',null,'tail']]);assert.ok(adaptationEffects(a).sprintSpeed>adaptationEffects(plain).sprintSpeed);assert.ok(adaptationEffects(a).metabolism>adaptationEffects(plain).metabolism)}
{const a=design([['fat-tail',null,'tail']]);assert.ok(adaptationEffects(a).metabolism<adaptationEffects(plain).metabolism*1.0001)}
{const a=design([['club-tail',null,'tail']]);assert.ok(partEffectFactors(a).repel>0)}
// Backs and flanks.
{const a=design([['water-hump',null,'dorsal']]);assert.ok(adaptationEffects(a).waterUse<adaptationEffects(plain).waterUse);assert.ok(partEffectFactors(a).landSpeed<pf0.landSpeed)}
{const a=design([['moss-back',null,'dorsal']]);assert.equal(sim.partAbilities.coverNeeded(a,.36),WAVE2['moss-back'].coverHide)}
{const a=design([['sensory-quills',null,'dorsal']]);assert.ok(partEffectFactors(a).threatSense>pf0.threatSense)}
{const a=design([['scent-gland',null,'flank.left']]);assert.ok(partEffectFactors(a).courtship<.62&&partEffectFactors(a).visibility>1)}
{const a=design([['spine-cluster',null,'flank.left'],['spine-cluster',null,'flank.right']]);assert.ok(partEffectFactors(a).repel>0&&adaptationEffects(a).carryCapacity<adaptationEffects(plain).carryCapacity)}
// Gill slits swim better only for a body that can swim.
{const a=design([['gill-slits',null,'flank.left']]),w=sim.world;let wi=0;while(!w.water[wi])wi++;const x=wi%CFG.worldSize+.5,y=Math.floor(wi/CFG.worldSize)+.5;
 assert.equal(movementProfile(a,w,{fromX:x,fromY:y,toX:x,toY:y}).allowed,false,'gill slits alone do not swim');a.adaptations.push('webbed-limbs');
 const m=movementProfile(a,w,{fromX:x,fromY:y,toX:x,toY:y});assert.ok(m.allowed&&Math.abs(m.speed-.66*1.1)<1e-9)}
// Spurs stack per leg, up to four.
{const legs=[1,2,3,5,6,7].map(i=>`root/limb.${i}`);const a=design(legs.map(l=>['hook-spur',l,'spur']));assert.ok(Math.abs(partEffectFactors(a).huntBonus-WAVE2['hook-spur'].huntBonus*4)<1e-9,'capped at four legs')}

// Recoil under stocked, uncrowded exposure. Scarcity/interference have separate
// tests and must not confound this anatomy-effect fixture.
{const a=design([['club-tail',null,'tail'],['spine-cluster',null,'flank.left'],['spine-cluster',null,'flank.right']]),h=sim.animals.find(b=>b.alive&&SPECIES[b.species]?.hunter);let breaks=0;
 const localCount=sim.localCount;sim.localCount=(_animal,species)=>species===h.species?1:CFG.wildHunt.scarceCount;
 for(let k=0;k<200;k++){a.health=100;a.alive=true;a.predationConsumedMass=0;h.playerAversion=null;h.x=a.x+.5;h.y=a.y;if(sim.tryKill(h,a)&&h.playerAversion?.targetId===a.id)breaks++}
 sim.localCount=localCount;
 assert.ok(breaks>10,`hunters sometimes recoil (${breaks})`)}

// Natural variation can reach wave 2 parts.
{let plan=founderPlan(),found=new Set();const rng={i:7,int(a,b){this.i=(this.i*1103515245+12345)&0x7fffffff;return a+this.i%(b-a+1)},chance(){return true},next(){return .5}};
 for(let k=0;k<300;k++){plan=mutatePlan(rng,plan);for(const n of plan.nodes)if(WAVE2[n.partId])found.add(n.partId)}assert.ok(found.size>=4,`wild bodies reach wave 2 parts (${[...found]})`)}

// Every wave 2 part draws on a body in all facings.
{const a=design([['flag-tail',null,'tail'],['sail-fin',null,'dorsal'],['fat-pad',null,'flank.left'],['brood-pouch',null,'flank.right'],['kick-spur','root/limb.2','spur'],['heel-spike','root/limb.3','spur'],['grip-pad','root/limb.5','spur'],['sensory-bristle','root/limb.6','spur'],['dew-claw','root/limb.7','spur']]);
 let ops=0;const c={set fillStyle(v){},fillRect(){ops++}};for(let dir=0;dir<8;dir++)for(let f=0;f<8;f++)drawGenvoSprite(c,{animal:{...a,dir},phenotype:phenotypeFor(a),scale:2,frame:f,moving:true,palette:{body:'#7aa8e8',shade:'#3d5e9a',light:'#cfe3ff'},pose:{dir}});assert.ok(ops>1000)}
console.log('parts wave 2 ok');
