import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';
import {makePlan} from '../src/lineage/body-plan.js';
import {applyLineageTarget} from '../src/lineage/reproduction-bridge.js';
import {visionProfile} from '../src/lineage/vision.js';
import {planetaryTravelAvailability,crossPlanetaryBorder} from '../src/world/planetary-travel.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

// Save-and-continue along the player's journey (creator priority 2026-10-22):
// a world saved at each moment and reloaded must continue exactly as the world
// that was never saved — same organisms, inheritance, resources and history.
// A native New World with the menu's options; the founder is driven by AUTO.
const snap=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'t',reason:'journey'}));
const day=s=>{for(let i=0;i<CFG.dayTicks;i++)s.update(null)};
function continues(sim,label,days=2){
 const saved=snap(sim),loaded=restoreSimulationSnapshot(structuredClone(saved));
 assert.deepEqual(snap(loaded),saved,label+': save round-trips exactly');
 for(let d=0;d<days;d++){day(sim);day(loaded)}
 assert.deepEqual(snap(loaded),snap(sim),label+': reloaded world continues identically');
 return loaded;
}
const sim=new Simulation('PLANET-B0-A',{player:true,worldGenerator:'planetary/1',regionalFrontier:true});sim.setPlayerAutonomy(true);
const founder=sim.player().id,carrying=()=>sim.animals.find(a=>a.alive&&a.pregnant&&(a.id===founder||a.pregnant.fatherId===founder));
const seen=[];
for(let d=0;d<30&&!carrying();d++)day(sim);assert.ok(carrying(),'a natural pregnancy');continues(sim,'pregnancy');seen.push('pregnancy day '+sim.day);
let child=null;for(let d=0;d<30&&!child;d++){day(sim);child=sim.animals.find(a=>a.alive&&a.parentIds?.includes(founder))}
assert.ok(child,'a natural birth');continues(sim,'birth');seen.push('birth day '+sim.day);
// Staged for test time only: the natural child is aged to maturity (real
// timing is measured by tools/measure-first-legacy-timing.mjs).
child=sim.animals.find(a=>a.id===child.id&&a.alive)||sim.animals.find(a=>a.alive&&a.parentIds?.includes(founder));
child.age=SPECIES[child.species].maturity;assert.equal(sim.lineage.handoffTo(child.id,{manual:true}),true);
assert.ok(sim.legacyMilestones?.firstLegacy,'The First Legacy recorded');continues(sim,'succession');seen.push('succession day '+sim.day);
// Advanced anatomy through the lineage authority (raptor and sentinel eyes).
const p=sim.player(),keep=p.bodyPlan.nodes.filter(n=>n.parent==='root'&&/^limb\.|^mouth$/.test(n.socket)).map(n=>({partId:n.partId,parent:'root',socket:n.socket}));
applyLineageTarget(p,makePlan([{partId:'barrel-torso',parent:null,socket:null},...keep,{partId:'raptor-eye',parent:'root',socket:'eye.left'},{partId:'raptor-eye',parent:'root',socket:'eye.right'},{partId:'sentinel-eye',parent:'root',socket:'eye.left.2'},{partId:'sentinel-eye',parent:'root',socket:'eye.right.2'}]));
const vision=visionProfile(p),loaded=continues(sim,'advanced anatomy');assert.deepEqual(visionProfile(loaded.player()),visionProfile(sim.player()));assert.ok(vision.range>0);
// Regional travel: the heir is placed at a natural frontier (staged position)
// and crosses alone; the destination world continues exactly after a reload.
const h=sim.player();h.energy=SPECIES[h.species].maxEnergy*.96;h.hydration=SPECIES[h.species].maxHydration*.96;sim.setPlayerAutonomy(false);
let open=null;for(let y=10.5;y<118.5&&!open;y++){h.x=128;h.y=y;const t=planetaryTravelAvailability(sim);if(t.enabled)open=t}
const why=new Set();if(!open)for(let y=10.5;y<118.5;y+=7){h.x=128;h.y=y;why.add(planetaryTravelAvailability(sim).reason)}
assert.ok(open,'a natural traversable frontier: '+[...why].join(' | '));const crossed=crossPlanetaryBorder(sim);assert.equal(crossed.ok,true,crossed.message);
const east=crossed.simulation;assert.equal(east.player().id,h.id);assert.deepEqual(east.player().bodyPlan,h.bodyPlan,'anatomy crosses unchanged');
assert.deepEqual(east.legacyMilestones,sim.legacyMilestones,'world history crosses with the lineage');
continues(east,'after crossing');seen.push('crossing to '+east.world.regionOrigin.x+','+east.world.regionOrigin.y);
console.log('Journey continuity PASS: exact save round-trip and identical continuation at '+seen.join(', ')+', and with advanced eyes.');
