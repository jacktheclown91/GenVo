import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';

const sim=new Simulation('FAMILY-DIRECTIVE-TEST',{player:true});
const p=sim.player();
const child=sim.spawnAnimal('genvo',p.x+6,p.y,[p,sim.animals.find(a=>a.id===sim.starterMateId)]);
child.lineage=true;child.generation=2;child.age=SPECIES.genvo.maturity+2;child.energy=SPECIES.genvo.maxEnergy*.9;child.hydration=SPECIES.genvo.maxHydration*.9;sim.lineage.register(child,[p.id,sim.starterMateId]);

assert.equal(sim.familyDirectives.status().count,1,'grown lineage relative is commandable');
assert.equal(sim.familyDirectives.set('follow'),true);
let d=sim.familyDirectives.decision(child);assert.equal(d.intent,'family-follow');assert.equal(d.target.directive,true);
sim.rebuildSpatial();sim.phaseDecision(null);assert.equal(child.intent,'family-follow','live decision phase honors Follow after urgent needs');

sim.familyDirectives.set('home');sim.shelter.shelters.push({id:77,ownerId:p.id,x:p.x+2,y:p.y+2,integrity:100,weatherSeal:1,foodStore:0,capacity:20,constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount});
d=sim.familyDirectives.decision(child);assert.equal(d.intent,'family-home');assert.equal(d.target.shelterId,77);

sim.familyDirectives.set('forage');d=sim.familyDirectives.decision(child);assert.ok(['feed','family-forage'].includes(d.intent),'forage order either chooses food or spreads out');

child.hydration=SPECIES.genvo.maxHydration*.2;assert.equal(sim.familyDirectives.decision(child),null,'serious survival need overrides family order');
sim.familyDirectives.set('auto');assert.equal(sim.familyDirectives.decision(child),null,'auto restores ordinary autonomous behavior');
console.log('family directive leadership checks: PASS');
