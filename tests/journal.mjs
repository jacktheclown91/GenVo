import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {buildJournalEntry} from '../src/ui/journal.js';
const sim=new Simulation('JOURNAL-CHECK',{player:true}),p=sim.player(),mate=sim.animals.find(a=>a.id===sim.starterMateId);
const child=sim.spawnAnimal('genvo',p.x+.3,p.y+.2,[p,mate]);sim.lineage.registerBirth(child,[p,mate]);sim.family.registerBirth(child,p,mate);sim.cognition.onBirth(child,p,mate);child.age=20;
sim.cognition.record(child,'stage','Became adult',{stage:'adult'});sim.territory.ensure(child).home={x:child.x,y:child.y};sim.territory.ensure(child).radius=7;sim.territory.ensure(child).established=true;
const entry=buildJournalEntry(sim,child.id);
assert.equal(entry.id,child.id);assert.equal(entry.generation,2);assert.ok(entry.parents.length>=1,'parents are retained');assert.ok(entry.ancestry.length>=2,'ancestry path reaches founder');assert.match(entry.home,/settled home/);assert.ok(entry.notes.some(n=>/adult/i.test(n.text)),'life notes are readable');
console.log('field journal checks: PASS');
