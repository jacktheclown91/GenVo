import assert from 'node:assert/strict';
import {World} from '../src/world/world.js';
import {Simulation} from '../src/sim/simulation.js';
import {PARTS,registryProblems} from '../src/lineage/part-registry.js';
import {founderPlan} from '../src/lineage/body-inheritance.js';
import {makePlan,validatePlan} from '../src/lineage/body-plan.js';
import {createDraft,place,draftProblems,whyNot} from '../src/lineage/evolution-draft.js';
import {thermalCoverFactor,aridityWaterFactor,aridFooting} from '../src/lineage/terrain-cover-physiology.js';
import {movementProfile} from '../src/lineage/lifestyle.js';
import {PART_SPRITES} from '../src/render/part-sprites.js';
import {WAVE2_TEXT} from '../src/lineage/part-abilities.js';

assert.deepEqual(registryProblems(),[]);
const parts=['heat-frill','wax-plates','arid-pad'];
for(const id of parts){
 assert.ok(PARTS[id]?.mutationCost>=3,id+' needs substantial inheritance cost');
 assert.ok(PARTS[id]?.upkeep>0,id+' has ongoing metabolic upkeep');
 assert.ok(PART_SPRITES[id],id+' has an in-game fallback visual');
 assert.ok(WAVE2_TEXT[id]?.gain&&WAVE2_TEXT[id]?.cost,id+' describes a real tradeoff');
 assert.ok(!PARTS[id].actionCapabilities.includes('fly'),'dryland part must not grant flight');
}
const base=founderPlan();
function change(plan,partId,socket,parent='root'){
 return makePlan([...plan.nodes.filter(n=>!(n.parent===parent&&n.socket===socket)).map(n=>({partId:n.partId,parent:n.parent,socket:n.socket})),{partId,parent,socket}],{headMode:plan.headMode});
}
const crest=change(base,'signal-crest','dorsal'),heat=change(crest,'heat-frill','dorsal');
const plate=change(base,'armor-plate','flank.left'),wax=change(plate,'wax-plates','flank.left');
const padded=change(base,'padded-leg','limb.1'),single=change(padded,'arid-pad','limb.1'),
 paired=change(change(base,'arid-pad','limb.1'),'arid-pad','limb.7');
for(const plan of [crest,heat,plate,wax,padded,single,paired])assert.ok(validatePlan(plan).ok,'mount must be physically legal');
for(const [part,socket,precursor] of [['heat-frill','dorsal','signal-crest'],['wax-plates','flank.left','armor-plate'],['arid-pad','limb.1','padded-leg']]){
 const initial=createDraft({base,ancestry:[],budget:8});
 assert.match(whyNot(initial,part,'root',socket),new RegExp('Requires','i'));
 const gen1=createDraft({base,ancestry:[],budget:8});
 assert.equal(place(gen1,precursor,'root',socket).ok,true,precursor+' is an accessible starting precursor');
 const next=createDraft({base:gen1.plan,ancestry:[precursor],budget:8});
 assert.equal(place(next,part,'root',socket).ok,true,part+' is an accessible inherited descendant');
 assert.deepEqual(draftProblems(next),[]);
}
const as=bodyPlan=>({alive:true,species:'genvo',x:22.5,y:22.5,bodyPlan});
assert.equal(thermalCoverFactor(as(base),1,.55),1);
assert.ok(thermalCoverFactor(as(heat),1,.55)<1,'actual hot-adapted form saves heat-related energy');
assert.ok(thermalCoverFactor(as(heat),.1,.55)>1,'heat frill pays a cold penalty');
assert.ok(thermalCoverFactor(as(wax),.9,.55)>1,'wax barrier increases overheating cost');
assert.equal(aridityWaterFactor(as(base),.05),1);
assert.ok(aridityWaterFactor(as(wax),.05)<1,'wax barrier reduces dehydration on dry soil');
assert.equal(aridityWaterFactor(as(wax),.85),1,'wet ground grants no wax benefit');
assert.equal(aridFooting(as(single),.05).speed,1,'one pad cannot supply a gait');
assert.ok(aridFooting(as(paired),.05).speed>1,'two pads enable dry-ground speed');
assert.ok(aridFooting(as(paired),.05).energy<1,'two pads save effort on dry ground');
assert.ok(aridFooting(as(paired),.95).speed<1,'wet substrate imposes wide-pad cost');
const world=new World('E6-DRY-SURFACE',{generator:'coastal/1'});
let spot=null;
for(let y=6;y<world.n-6&&!spot;y++)for(let x=6;x<world.n-6;x++)if(!world.water[world.idx(x,y)]&&!world.water[world.idx(x+1,y)]){spot={x:x+.5,y:y+.5};break}
assert.ok(spot);
const dest={toX:spot.x+1,toY:spot.y,fromX:spot.x,fromY:spot.y};
const cell=world.idx(dest.toX,dest.toY);
world.moisture[cell]=.04;
const animal=p=>({...as(p),x:spot.x,y:spot.y});
const dryBase=movementProfile(animal(base),world,dest),dryPads=movementProfile(animal(paired),world,dest);
assert.ok(dryPads.speed>dryBase.speed&&dryPads.energy<dryBase.energy,'shared movement authority responds to real dry soil');
world.moisture[cell]=.96;
const wetBase=movementProfile(animal(base),world,dest),wetPads=movementProfile(animal(paired),world,dest);
assert.ok(wetPads.speed<wetBase.speed&&wetPads.energy>wetBase.energy,'same mounted feet lose efficiency in wet soil');
// Check actual creature stores, not just a standalone formula.
const sim=new Simulation('E6-HYDRATION',{player:false});
const a=sim.animals.find(x=>x.alive&&x.species==='genvo');
assert.ok(a);
const i=sim.world.idx(a.x,a.y);
a.bodyPlan=structuredClone(wax);a.hydration=100;a.energy=100;sim.world.moisture[i]=.04;
sim.climate={temp:.8,rain:.1};const before=a.hydration;sim.phaseMetabolism();
const spentWithWax=before-a.hydration;
a.bodyPlan=structuredClone(base);a.hydration=100;a.energy=100;sim.phaseMetabolism();
const spentBare=100-a.hydration;
assert.ok(spentWithWax<spentBare,'real metabolism deducts less water with mounted wax plates');
console.log('E6 dryland ancestry, ecology, movement, metabolism and overhead fallback PASS');
