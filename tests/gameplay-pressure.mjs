import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';

const sim=new Simulation('GENVO8-PRESSURE-PLAYER',{player:true});
const p=sim.player(),spec=SPECIES[p.species];
assert.ok(sim.isOpeningProtected(p),'tutorial starts protected');

// Controlled animals must not quietly solve survival on their own while idle.
p.energy=spec.maxEnergy*.40;p.hydration=spec.maxHydration*.40;
const x=p.x,y=p.y;
for(let i=0;i<CFG.lifeStride;i++)sim.update({});
assert.equal(p.intent,'idle','idle player remains under direct control');
assert.ok(Math.hypot(p.x-x,p.y-y)<.001,'idle player does not auto-walk toward food/water');

// Completing onboarding can end protection immediately rather than waiting out the clock.
assert.equal(sim.endOpeningGrace('test'),true);
assert.equal(sim.isOpeningProtected(p),false);

// Player-time needs should matter on a human play-session timescale.
p.energy=spec.maxEnergy*.90;p.hydration=spec.maxHydration*.90;
const e0=p.energy,h0=p.hydration;
for(let i=0;i<CFG.dayTicks;i++)sim.update({});
assert.ok(e0-p.energy>1.5,'one active day consumes meaningful player energy');
assert.ok(h0-p.hydration>1.5,'one active day consumes meaningful player hydration');

// A nearby edible animal can be hunted manually with the same interaction key.
let dry=null;outer:for(let yy=4;yy<CFG.worldSize-4;yy++)for(let xx=4;xx<CFG.worldSize-4;xx++){if(!sim.world.water[sim.world.idx(xx,yy)]&&!sim.world.isDrinkable(xx,yy)){dry={x:xx+.5,y:yy+.5};break outer}}assert.ok(dry);p.x=dry.x;p.y=dry.y;const prey=sim.spawnAnimal('mosskip',p.x+.6,p.y);
prey.health=100;
const oldChance=sim.rng.chance;sim.rng.chance=()=>true;
assert.notEqual(sim.playerInteract().type,'hunt','E no longer bites prey; the attack key does');
assert.equal(sim.playerCombat.startAttack().ok,true);let hunt=null;for(let i=0;i<64&&!hunt;i++){sim.playerControlStep({},64);hunt=sim.playerCombat.consumeResult()}
sim.rng.chance=oldChance;
assert.equal(hunt.type,'hunt');
assert.ok(prey.health<100,'manual hunt can damage prey');
assert.ok(prey.playerThreat?.untilTick>sim.tickCount,'attacked prey recognizes the player as a temporary threat');

// Predator hits should be serious but survivable enough to create an escape decision.
const stalker=sim.animals.find(a=>a.alive&&a.species==='needlejaw');
stalker.x=p.x+.5;stalker.y=p.y;p.health=100;
const chance2=sim.rng.chance;sim.rng.chance=()=>true;
const hit=sim.tryKill(stalker,p);sim.rng.chance=chance2;
assert.equal(hit,true);
assert.ok(p.health>0&&p.health<70,'one Stalker strike hurts badly without guaranteed one-shot');
assert.ok(sim.lastPlayerDamage?.amount>20,'player hit feedback is recorded');

// Shelter protection matters for an adult too.
sim.shelter.shelters=[{id:1,ownerId:p.id,x:p.x,y:p.y,integrity:100,foodStore:0,capacity:28}];
assert.ok(sim.shelter.protectionFactor(p)<1,'adult gains shelter predation protection');

// A close Stalker should create player-facing danger without changing headless ecology.
const chase=new Simulation('GENVO8-PLAYER-CHASE',{player:true});
const cp=chase.player();chase.endOpeningGrace('test');
const hunter=chase.animals.find(a=>a.alive&&a.species==='needlejaw');
let hp=null;for(let r=4;r<=7&&!hp;r++)for(let oy=-r;oy<=r&&!hp;oy++)for(let ox=-r;ox<=r;ox++){if(Math.hypot(ox,oy)<r-.5||Math.hypot(ox,oy)>r+.5)continue;const tx=cp.x+ox,ty=cp.y+oy;if(!chase.world.water[chase.world.idx(tx,ty)]&&chase.world.sameLand(cp.x,cp.y,tx,ty)){hp={x:tx,y:ty};break}}assert.ok(hp,'same-land predator test point exists');
hunter.x=hp.x;hunter.y=hp.y;hunter.energy=SPECIES.needlejaw.maxEnergy*.82;
chase.rebuildSpatial();chase.phaseDecision({});
assert.equal(hunter.intent,'stalk-player','nearby Stalker begins a readable player-facing hunt after grace');
assert.equal(hunter.target?.id,cp.id,'Stalker targets active lineage member');

console.log('gameplay pressure + direct-control checks: PASS');
