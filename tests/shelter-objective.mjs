import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {TutorialController} from '../src/ui/tutorial.js';

const sim=new Simulation('GENVO8-SHELTER-OBJECTIVE',{player:true});
const p=sim.player();
const mate=sim.animals.find(a=>a.id!==p.id&&a.species==='genvo'&&a.alive);
assert.ok(mate,'mate exists for objective setup');
p.lastMate=mate.id;
p.pregnant={fatherId:mate.id,days:5,totalDays:8,startedDay:sim.day,startedYear:sim.year};
const home=sim.territory.state(p);home.established=true;home.home={x:p.x,y:p.y};home.radius=8;home.totalFamiliarity=3;

const controller=Object.create(TutorialController.prototype);controller.sim=sim;
let shown=null;controller.render=(title,body,opts={})=>{shown={title,body,opts}};

controller.renderDynamicGoal(p);
assert.equal(shown.title,'Build a family shelter','pregnant player is prompted to build before a shelter exists');

sim.shelter.shelters.push({id:1,ownerId:p.id,x:p.x,y:p.y,integrity:100,foodStore:0,capacity:28,constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount});
controller.renderDynamicGoal(p);
assert.equal(shown.title,'Stock the shelter','objective advances immediately after pregnant player builds shelter');
assert.match(shown.body,/press F/i,'stocking objective gives the next action');

sim.shelter.shelters[0].foodStore=4;
controller.renderDynamicGoal(p);
assert.equal(shown.title,'Prepare for birth','objective advances again after shelter is stocked');
assert.match(shown.body,/shelter stocked/i);

console.log('pregnant shelter objective progression: PASS');
