import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES_LIFESTYLES} from '../src/lineage/species-lifestyle.js';
import {SPECIES} from '../src/organisms/species.js';
import {ROOT_TAXON_ID} from '../src/lineage/evolution-tree.js';
import {PLANTS} from '../src/sim/config.js';

function setLifestyle(sim,id){
  const ctrl=sim.speciesLifestyle,state=ctrl.ensure(ROOT_TAXON_ID),def=SPECIES_LIFESTYLES[id];
  const lifestyle={id,label:def.label,short:def.short,formedDay:sim.day,formedGeneration:5,taxonId:ROOT_TAXON_ID,taxonLabel:'GenVo8',evidence:'test',score:1};
  state.lifestyle=lifestyle;state.loopDay=-1;state.loop=null;
  const node=ctrl.node(ROOT_TAXON_ID);if(node)node.lifestyle={...lifestyle};
  ctrl.applyToMembers(ROOT_TAXON_ID,lifestyle);
  return ctrl;
}

function drySpot(sim,radius=16){
  const w=sim.world;
  for(let y=20;y<108;y+=4)for(let x=20;x<108;x+=4){
    let ok=true;
    for(let oy=-radius;oy<=radius&&ok;oy+=2)for(let ox=-radius;ox<=radius;ox+=2){if(w.water[w.idx(x+ox,y+oy)]){ok=false;break}}
    if(ok)return{x:x+.5,y:y+.5};
  }
  throw new Error('No dry staging area');
}

// An established Hunter GenVo8 is part of the food web, not an invisible predator.
// Edible wildlife should recognize it as danger and herd alarms should relay it.
{
  const sim=new Simulation('GENVO8-FOOD-WEB-HUNTER',{player:true}),p=sim.player(),spot=drySpot(sim,8);
  p.x=spot.x;p.y=spot.y;p.age=SPECIES.genvo.maturity+8;p.generation=5;sim.lineage.highestGeneration=5;
  const prey=sim.animals.find(a=>a.alive&&a.species==='mosskip');assert.ok(prey);
  prey.x=p.x+2.1;prey.y=p.y;prey.health=100;prey.energy=SPECIES.mosskip.maxEnergy;prey.hydration=SPECIES.mosskip.maxHydration;
  sim.rebuildSpatial();
  assert.equal(sim.isPredatorTo(p,prey),false,'ancestral GenVo8 is not automatically a predator to Hoppers');
  setLifestyle(sim,'hunter');sim.rebuildSpatial();
  assert.equal(sim.isPredatorTo(p,prey),true,'Hunter GenVo8 is recognized as a predator to edible wildlife');
  sim.social.observe({force:true});
  const social=sim.social.state(prey);assert.equal(social?.alarm?.threat?.id,p.id,'Hopper herd alarm identifies the Hunter GenVo8');
  sim.phaseDecision({});
  assert.ok(['escape','group-alarm'].includes(prey.intent),`prey reacts to Hunter GenVo8, got ${prey.intent}`);
}

// Grazers should not keep stripping the same ground once it is worn down. Existing
// grazing history should push them toward fresh plant patches even before deep hunger.
{
  const sim=new Simulation('GENVO8-FOOD-WEB-GRAZER',{player:true}),p=sim.player(),spot=drySpot(sim,16),ctrl=setLifestyle(sim,'grazer');
  const grazer=sim.animals.find(a=>a.alive&&a.species==='genvo'&&!a.player);assert.ok(grazer);
  grazer.lineage=true;grazer.age=SPECIES.genvo.maturity+5;grazer.generation=5;grazer.x=spot.x;grazer.y=spot.y;grazer.energy=SPECIES.genvo.maxEnergy*.84;grazer.hydration=SPECIES.genvo.maxHydration*.9;
  if(!sim.lineage.records.has(grazer.id))sim.lineage.register(grazer,[p.id]);
  ctrl.applyToMembers(ROOT_TAXON_ID,ctrl.ensure(ROOT_TAXON_ID).lifestyle);
  const w=sim.world;
  for(let y=Math.floor(spot.y)-15;y<=Math.floor(spot.y)+15;y++)for(let x=Math.floor(spot.x)-15;x<=Math.floor(spot.x)+15;x++){
    const i=w.idx(x,y);if(w.water[i])continue;
    for(const kind of Object.keys(PLANTS))w.plants[kind][i]=0;
  }
  // Worn nearby patch.
  const near={x:spot.x+2,y:spot.y},ni=w.idx(near.x,near.y);w.plants.bramble[ni]=.82;sim.history.grazing[ni]=1.2;
  // Slightly smaller but fresh patch farther away.
  const fresh={x:spot.x+8,y:spot.y},fi=w.idx(fresh.x,fresh.y);w.plants.bramble[fi]=.72;sim.history.grazing[fi]=0;sim.history.recovery[fi]=.25;
  // Mark the current local ground as depleted enough to trigger rotation.
  for(let oy=-4;oy<=4;oy+=2)for(let ox=-4;ox<=4;ox+=2){const i=w.idx(spot.x+ox,spot.y+oy);sim.history.grazing[i]=Math.max(sim.history.grazing[i],.65)}
  const ground=ctrl.grazingGroundState(grazer);assert.equal(ground.depleted,true,'worked grazing ground is recognized as depleted');
  const target=ctrl.grazerFoodTarget(grazer,{radius:14});assert.ok(target,'fresh forage target exists');
  assert.ok(Math.hypot(target.x-fresh.x,target.y-fresh.y)<1,'fresh patch outranks the more worn nearby patch');
  const decision=ctrl.autonomousDecision(grazer);assert.equal(decision?.intent,'feed','Grazer rotates toward forage before deep hunger when ground is depleted');
  assert.equal(decision?.grazingShift,true,'decision records a grazing-ground rotation');
  assert.ok(Math.hypot(decision.target.x-fresh.x,decision.target.y-fresh.y)<1,'rotation points to fresh forage');
}

console.log('food-web feedback checks: PASS');
