import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {World} from '../src/world/world.js';
import {PARTS,partDef,registryProblems} from '../src/lineage/part-registry.js';
import {makePlan,validatePlan} from '../src/lineage/body-plan.js';
import {founderPlan} from '../src/lineage/body-inheritance.js';
import {createDraft,place,draftProblems,draftCost,whyNot} from '../src/lineage/evolution-draft.js';
import {thermalCoverFactor,inclineGrip} from '../src/lineage/terrain-cover-physiology.js';
import {movementProfile} from '../src/lineage/lifestyle.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

assert.deepEqual(registryProblems(),[],'all E3 parts use legitimate mounts and capabilities');
const ids=['filament-tuft','fur-mantle','feather-mantle','proto-wing','climber-leg','hook-pad'];
for(const id of ids)assert.ok(partDef(id)?.mutationCost>=2,'every evolved novelty has a real generation mutation cost');
assert.ok(!partDef('proto-wing').actionCapabilities.includes('fly'),'an ornamental wing precursor must not permit flight');

const base=founderPlan();
const target=(plan,id,socket,parent='root')=>makePlan([
 ...plan.nodes.filter(n=>!(n.parent===parent&&n.socket===socket)).map(n=>({partId:n.partId,parent:n.parent,socket:n.socket})),
 {partId:id,parent,socket}
],{headMode:plan.headMode});
const toDraft=(plan,ancestry)=>createDraft({base:plan,ancestry,budget:8});
const g1=toDraft(base,[]);
assert.match(whyNot(g1,'fur-mantle','root','dorsal'),/Requires filament tuft/i);
assert.match(whyNot(g1,'feather-mantle','root','dorsal'),/Requires filament tuft/i);
assert.match(whyNot(g1,'proto-wing','root','dorsal'),/Requires feather mantle/i);
assert.equal(place(g1,'filament-tuft','root','dorsal').ok,true);
assert.equal(draftCost(g1),2);
assert.deepEqual(draftProblems(g1),[]);
assert.ok(validatePlan(g1.plan,{ancestry:[...g1.ancestry]}).ok);
const g2=toDraft(g1.plan,['filament-tuft']);
assert.equal(place(g2,'fur-mantle','root','dorsal').ok,true);
assert.equal(draftCost(g2),4);
assert.deepEqual(draftProblems(g2),[]);
const feathers=toDraft(g1.plan,['filament-tuft']);
assert.equal(place(feathers,'feather-mantle','root','dorsal').ok,true);
assert.equal(draftCost(feathers),5);
assert.deepEqual(draftProblems(feathers),[]);
const later=toDraft(feathers.plan,['filament-tuft','feather-mantle']);
assert.equal(place(later,'proto-wing','root','dorsal').ok,true);
assert.equal(draftCost(later),7);
assert.deepEqual(draftProblems(later),[]);
assert.ok(later.plan.nodes.some(n=>n.partId==='proto-wing'));
assert.ok(!later.plan.nodes.some(n=>n.partId==='feather-mantle'),'wing precursor replaces its parent mount, it is not an added free socket');
for(const plan of [g1.plan,g2.plan,feathers.plan,later.plan])
 assert.ok(!plan.nodes.some(n=>partDef(n.partId).actionCapabilities.includes('fly')),'no build receives unimplemented flight');

// Actual thermal tradeoff must be present on the mounted body, not a renamed taxon.
const naked={bodyPlan:base},filament={bodyPlan:g1.plan},fur={bodyPlan:g2.plan},feather={bodyPlan:feathers.plan},proto={bodyPlan:later.plan};
assert.equal(thermalCoverFactor(naked,.10,.55),1);
assert.equal(thermalCoverFactor(fur,.10,.55),.48);
assert.equal(thermalCoverFactor(feather,.10,.55),.55);
assert.ok(thermalCoverFactor(fur,.1,.55,{wet:true})>thermalCoverFactor(fur,.1,.55));
assert.ok(thermalCoverFactor(feather,.1,.55,{wet:true})<thermalCoverFactor(fur,.1,.55,{wet:true}),
 'wet feather coats retain better insulation than wet fur');
assert.ok(thermalCoverFactor(fur,.9,.55)>1,'fur incurs a real heat penalty');
assert.ok(thermalCoverFactor(proto,.9,.55)>1,'flightless wing precursor costs thermal burden');
assert.ok(thermalCoverFactor(filament,.1,.55)<1,'simple precursors confer limited cold protection');

// An ordinary scheduled metabolism uses covering for the REAL energy store.
const source=new Simulation('E3-INSULATED-ENERGY',{player:false}),snap=structuredClone(createSimulationSnapshot(source,{savedAt:'fixed',reason:'e3-insulation'}));
function energyAfter(plan,temp){
 const sim=restoreSimulationSnapshot(structuredClone(snap)),a=sim.animals.find(a=>a.alive&&a.species==='genvo');
 assert.ok(a);a.bodyPlan=structuredClone(plan);a.energy=120;a.hydration=120;a.genes.climate=1;
 sim.world.temperature[sim.world.idx(a.x,a.y)]=temp;sim.climate={temp:.55,rain:0};
 sim.phaseMetabolism();
 return a.energy;
}
const coldBenefit=energyAfter(g2.plan,0)-energyAfter(base,0),
 heatPenalty=energyAfter(g2.plan,1)-energyAfter(base,1);
assert.ok(coldBenefit>heatPenalty+1e-5,
 'real organism food expenditure favors thick insulation in cold compared with hot conditions');

// Climbing is surface traction ONLY, not cliff teleportation, altitude or flight.
const climbing=target(target(base,'climber-leg','limb.1'),'climber-leg','limb.7');
assert.equal(validatePlan(climbing).ok,true);
const hookPlan=target(target(base,'hook-pad','spur','root/limb.1'),'hook-pad','spur','root/limb.7');
assert.equal(validatePlan(hookPlan).ok,true);
assert.equal(inclineGrip({bodyPlan:target(base,'climber-leg','limb.1')},2).climbing,false,'one unsupported limb is not a climbing gait');
assert.ok(inclineGrip({bodyPlan:climbing},2).speed>1,'paired climbing limbs earn uphill purchase');
assert.ok(inclineGrip({bodyPlan:climbing},0).speed<1,'climbing feet cost flat-ground speed');
assert.ok(inclineGrip({bodyPlan:hookPlan},2).speed>1,'paired ancestral hook pads can confer small uphill purchase');
const wild=toDraft(base,[]);assert.match(whyNot(wild,'climber-leg','root','limb.1'),/Requires grasper/i);
const withGraspers=target(target(base,'grasper','limb.1'),'grasper','limb.7');
const gripper=toDraft(withGraspers,['grasper']);
assert.equal(place(gripper,'climber-leg','root','limb.1').ok,true,'climbing remains lineage gated');
assert.equal(draftCost(gripper),4);
assert.deepEqual(draftProblems(gripper),[]);
const world=new World('E3-SLOPES',{generator:'coastal/1'});
let x=-1,y=-1;for(let row=5;row<world.n-5&&x<0;row++)for(let col=5;col<world.n-5;col++){
 const a=world.idx(col,row),b=world.idx(col+1,row);
 if(!world.water[a]&&!world.water[b]){x=col;y=row;break}
}
assert.ok(x>0);
world.terrain.elevation[world.idx(x,y)]=.1;world.terrain.elevation[world.idx(x+1,y)]=.9;
const normal=movementProfile({alive:true,bodyPlan:base,x:x+.5,y:y+.5},world,{toX:x+1.5,toY:y+.5});
const traction=movementProfile({alive:true,bodyPlan:climbing,x:x+.5,y:y+.5},world,{toX:x+1.5,toY:y+.5});
assert.ok(normal.grade>0&&traction.speed>normal.speed,'real topography favors paired gripping parts');
assert.ok(traction.speed<1,'anatomical grip does not erase steepness or allow arbitrary vertical movement');
assert.ok(traction.energy>=1,'slopes retain a real movement cost');

// Save exactly the inherited anatomical body plan, and continue the same world.
const sim=new Simulation('E3-BODY-RESTORE',{player:false}),a=sim.animals.find(a=>a.alive&&a.species==='genvo');
a.bodyPlan=structuredClone(feathers.plan);
const save=structuredClone(createSimulationSnapshot(sim,{savedAt:'fixed',reason:'e3-body'}));
const copy=restoreSimulationSnapshot(structuredClone(save));
assert.deepEqual(copy.animals.find(b=>b.id===a.id).bodyPlan,a.bodyPlan);
for(let tick=0;tick<72;tick++){sim.update(null);copy.update(null);}
const saved=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'e3-body'}));
assert.deepEqual(saved(copy),saved(sim),'body anatomy, thermal costs, real organisms and world RNG resume exactly');
console.log('E3 filament/fur/feather precursors, true thermal energy, paired uphill grip, cost/prereqs and exact save PASS');
