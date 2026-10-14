import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';

const sim=new Simulation('GENVO8-WATER-TEACHING-HOTFIX',{player:true});
const parent=sim.player();
let mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==parent.id&&a.sex!==parent.sex);
if(!mate){mate=sim.spawnAnimal('genvo',parent.x+.5,parent.y);mate.sex=parent.sex==='F'?'M':'F'}
parent.age=mate.age=SPECIES.genvo.maturity+3;
const child=sim.spawnAnimal('genvo',parent.x+.6,parent.y,[parent,mate]);
sim.lineage.registerBirth(child,[parent,mate]);sim.family.registerBirth(child,parent,mate);
child.age=11;child.careStress=.08;

const bank=sim.world.nearestDrinkable(parent.x,parent.y,80);
assert.ok(bank,'a reachable dry shoreline/drinkable tile exists');
assert.equal(sim.world.water[sim.world.idx(bank.x,bank.y)],0,'the canonical drinking tile is land, not open water');
assert.equal(sim.world.isDrinkable(bank.x,bank.y),true,'the dry bank tile is drinkable');
parent.x=bank.x;parent.y=bank.y;child.x=bank.x+.55;child.y=bank.y+.15;
assert.equal(sim.world.water[sim.world.idx(child.x,child.y)],0,'the juvenile can stand beside the caregiver on land');
parent.hydration=SPECIES.genvo.maxHydration*.45;
sim.rebuildSpatial();
const result=sim.playerInteract();
assert.equal(result.type,'drink','the caregiver drinks from the bank using the normal E interaction');
sim.family.phaseCare();
assert.ok((child.learningLessons?.water||0)>=1,'the juvenile learns water from a caregiver drinking at the bank');
assert.equal(sim.world.water[sim.world.idx(parent.x,parent.y)],0,'the caregiver never entered open water to teach the lesson');
assert.equal(sim.world.water[sim.world.idx(child.x,child.y)],0,'the juvenile never entered open water to learn the lesson');

const tutorialSource=readFileSync(new URL('../src/ui/tutorial.js',import.meta.url),'utf8');
assert.ok(tutorialSource.includes('walk with it to a drinkable bank, then E · drink'),'the tutorial explicitly teaches bank-side drinking');
assert.ok(!tutorialSource.includes('follow you through ${lessonLabel}'),'the misleading generic “through water” task text is removed');

console.log('shoreline water-teaching hotfix checks: PASS');
