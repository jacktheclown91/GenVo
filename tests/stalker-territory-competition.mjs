import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';

function dryPatch(sim,radius=8){
  const w=sim.world;
  for(let y=14;y<CFG.worldSize-14;y++)for(let x=14;x<CFG.worldSize-14;x++){
    let ok=true;
    for(let oy=-radius;oy<=radius&&ok;oy++)for(let ox=-radius;ox<=radius;ox++){
      if(ox*ox+oy*oy>radius*radius)continue;
      if(w.water[w.idx(x+ox,y+oy)]){ok=false;break}
    }
    if(ok)return{x,y};
  }
  return null;
}

const sim=new Simulation('GENVO8-STALKER-COMPETITION',{player:true}),p=sim.player();
const hunters=sim.animals.filter(a=>a.alive&&a.species==='needlejaw').slice(0,2);assert.equal(hunters.length,2);
const [strong,weak]=hunters,patch=dryPatch(sim);assert.ok(patch);sim.endOpeningGrace('test');
for(const h of hunters){h.age=SPECIES.needlejaw.maturity+8;h.health=100;h.hydration=SPECIES.needlejaw.maxHydration;h.playerHunt=null;h.playerAversion=null;h.denContestCooldownUntil=0}
strong.genes.body=1.2;strong.genes.motion=1.13;strong.energy=SPECIES.needlejaw.maxEnergy*.96;strong.x=patch.x;strong.y=patch.y;
weak.genes.body=.88;weak.genes.motion=.90;weak.energy=SPECIES.needlejaw.maxEnergy*.68;weak.health=72;weak.x=patch.x+7;weak.y=patch.y;
const rngBefore=sim.rng.state;const strongDen=sim.stalkerTerritory.ensure(strong),weakDen=sim.stalkerTerritory.ensure(weak);assert.ok(strongDen&&weakDen);assert.equal(sim.rng.state,rngBefore,'den establishment must remain RNG-free');
assert.notEqual(strongDen.id,weakDen.id);assert.ok(Math.hypot(strongDen.x-weakDen.x,strongDen.y-weakDen.y)<strongDen.radius+weakDen.radius,'test dens should overlap');
weakDen.known=true;weakDen.everKnown=true;weakDen.lastInspectedTick=sim.tickCount;

const approach=sim.stalkerTerritory.competitionDecision(strong);assert.equal(approach?.intent,'territory-challenge');assert.equal(approach?.target?.siteId,weakDen.id);
const yieldDecision=sim.stalkerTerritory.competitionDecision(weak);assert.equal(yieldDecision?.intent,'territory-yield','weaker resident should yield when stronger challenger presses its core');

strong.x=weakDen.x+.5;strong.y=weakDen.y;const rngBeforeClaim=sim.rng.state;
const claim=sim.stalkerTerritory.competitionDecision(strong);assert.equal(claim?.intent,'territory-claim');assert.equal(sim.rng.state,rngBeforeClaim,'territorial takeover must not consume simulation RNG');
assert.equal(weakDen.ownerId,strong.id,'challenger should become current den owner');assert.equal(weakDen.takeovers,1);assert.equal(weakDen.previousOwnerId,weak.id);assert.equal(weakDen.known,false,'takeover must invalidate old tactical reading');assert.equal(weakDen.changed,true,'previously learned den should advertise changed sign until reread');assert.ok(strongDen.abandonedTick!=null,'winner relocates and leaves its former scrape abandoned');
assert.ok((weak.denDisplacedUntil||0)>sim.tickCount);assert.deepEqual(weak.denDisplacedFrom,{x:weakDen.x,y:weakDen.y});
assert.equal(sim.stalkerTerritory.siteFor(strong).id,weakDen.id,'site lookup follows transferred ownership rather than creation key');
assert.equal(sim.stalkerTerritory.lastTakeover?.fromOwnerId,weak.id);assert.equal(sim.stalkerTerritory.lastTakeover?.toOwnerId,strong.id);

strong.x=weakDen.x+5.2;strong.y=weakDen.y;weak.x=weakDen.x-5.2;weak.y=weakDen.y;p.x=weakDen.x+.5;p.y=weakDen.y+.2;p.hidden=false;sim.rebuildSpatial();
const changed=sim.stalkerTerritory.nearbySite(p,{radius:1.9});assert.equal(changed.den.id,weakDen.id);assert.equal(changed.known,false);assert.match(sim.interactionHint(),/Reread changed Stalker signs/);
const reread=sim.stalkerTerritory.inspect(p);assert.equal(reread.ok,true);assert.equal(reread.changed,true);assert.match(reread.message,/New tracks cross older sign/);assert.equal(weakDen.known,true);assert.equal(weakDen.changed,false);

const displaced=sim.stalkerTerritory.competitionDecision(weak);assert.equal(displaced?.intent,'territory-displaced');
weak.denDisplacedUntil=sim.tickCount;weak.x=weakDen.x+7;weak.y=weakDen.y;const beforeSites=sim.stalkerTerritory.activeSites().length;sim.stalkerTerritory.observe();
const newWeakDen=sim.stalkerTerritory.siteFor(weak);assert.ok(newWeakDen);assert.notEqual(newWeakDen.id,weakDen.id,'displaced resident should establish a new scrape after moving clear');assert.equal(newWeakDen.ownerId,weak.id);assert.ok(sim.stalkerTerritory.activeSites().length>=beforeSites);

const headless=new Simulation('GENVO8-STALKER-COMPETITION',{player:false});const hs=headless.animals.filter(a=>a.alive&&a.species==='needlejaw').slice(0,2);for(const h of hs)h.age=SPECIES.needlejaw.maturity+5;
const headlessRng=headless.rng.state;headless.stalkerTerritory.observe();assert.equal(headless.stalkerTerritory.activeSites().length,0);assert.equal(headless.stalkerTerritory.competitionDecision(hs[0]),null);assert.equal(headless.rng.state,headlessRng);

console.log('Stalker territorial competition / den takeover: PASS');
