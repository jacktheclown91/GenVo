import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';

const sim=new Simulation('GENVO8-RETALIATION',{player:true});
const p=sim.player(),hunter=sim.animals.find(a=>a.alive&&a.species==='needlejaw');assert.ok(p&&hunter);
hunter.genes.temperament=1.08;hunter.x=p.x+.65;hunter.y=p.y;hunter.health=100;hunter.energy=SPECIES.needlejaw.maxEnergy*.85;
assert.equal(sim.isOpeningProtected(p),true,'opening begins protected');
const oldChance=sim.rng.chance;sim.rng.chance=()=>true;
const strike=sim.playerStrike(hunter);
assert.equal(sim.isOpeningProtected(p),false,'attacking a Stalker deliberately ends opening safety');
assert.equal(strike.engaged,true);assert.match(strike.message,/safe start ended/i);
assert.equal(hunter.playerHunt?.phase,'windup','attacked Stalker immediately telegraphs retaliation');

hunter.playerHunt.untilTick=sim.tickCount;sim.rebuildSpatial();sim.phaseDecision({});
assert.equal(hunter.intent,'charge-player','provoked windup can become a real charge');
hunter.x=p.x+.65;hunter.y=p.y;p.health=100;sim.resolveInteraction(hunter);
assert.ok(p.health<100,'provoked Stalker can actually damage the player');
sim.rng.chance=oldChance;

const contact=new Simulation('GENVO8-CONTACT-DANGER',{player:true});const cp=contact.player(),ch=contact.animals.find(a=>a.alive&&a.species==='needlejaw');assert.ok(cp&&ch);
ch.x=cp.x+1.42;ch.y=cp.y;const before={x:cp.x,y:cp.y};
contact.playerControlStep({right:true},32);
assert.ok(cp.x>before.x,'player moved toward the nearby Stalker');
assert.equal(contact.isOpeningProtected(cp),false,'walking into combat range also ends tutorial safety instead of allowing harmless enemy collisions');
assert.equal(contact.openingGraceReason,'approached stalker');
console.log('Stalker retaliation after player aggression/contact: PASS');
