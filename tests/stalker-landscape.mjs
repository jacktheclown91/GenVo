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

const sim=new Simulation('GENVO8-STALKER-LANDSCAPE',{player:true}),p=sim.player(),patch=dryPatch(sim);assert.ok(p&&patch);sim.endOpeningGrace('test');
const hunters=sim.animals.filter(a=>a.alive&&a.species==='needlejaw').slice(0,2);assert.equal(hunters.length,2);const [resident,challenger]=hunters;
for(const h of hunters){h.age=SPECIES.needlejaw.maturity+7;h.health=100;h.energy=SPECIES.needlejaw.maxEnergy*.92;h.playerHunt=null;h.playerAversion=null;h.denContestCooldownUntil=0}
p.x=patch.x;p.y=patch.y;const home=sim.territory.ensure(p);home.home={x:p.x,y:p.y};home.radius=8;home.established=true;home.totalFamiliarity=5;
resident.x=p.x+5;resident.y=p.y;challenger.x=p.x-6;challenger.y=p.y;
const residentDen=sim.stalkerTerritory.ensure(resident),challengerDen=sim.stalkerTerritory.ensure(challenger);assert.ok(residentDen&&challengerDen);

// Unknown den knowledge must not leak into lineage planning.
let unknown=sim.stalkerTerritory.landscapeAt(residentDen.x,residentDen.y,{animal:p});assert.equal(unknown.risk,0);assert.equal(unknown.uncertainty,0);
const baseline=sim.migration.habitatQuality(p,residentDen.x,residentDen.y).score;
residentDen.known=true;residentDen.everKnown=true;residentDen.lastInspectedTick=sim.tickCount;
let learned=sim.stalkerTerritory.landscapeAt(residentDen.x,residentDen.y,{animal:p});assert.ok(learned.risk>.9,'learned active den should carry strong route risk');
const learnedScore=sim.migration.habitatQuality(p,residentDen.x,residentDen.y);assert.ok(learnedScore.denRisk>.9);assert.ok(learnedScore.score<baseline,'learned active den should reduce habitat desirability');

// Non-player lineage members should bend autonomous roaming away from learned active dens.
const family=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id);assert.ok(family);family.lineage=true;family.player=false;family.x=p.x;family.y=p.y;const familyHome=sim.territory.ensure(family);familyHome.home={x:p.x,y:p.y};familyHome.radius=8;familyHome.established=true;familyHome.totalFamiliarity=5;
const adjusted=sim.stalkerTerritory.adjustRoamTarget(family,{x:residentDen.x,y:residentDen.y,homeRoam:true});assert.equal(adjusted.knownDenAvoidance,true);assert.notDeepEqual({x:adjusted.x,y:adjusted.y},{x:residentDen.x,y:residentDen.y});assert.ok(sim.stalkerTerritory.forageAdjustment(family,residentDen.x,residentDen.y)<0);

// A takeover invalidates learned ownership and becomes uncertainty until reread.
challenger.genes.body=1.2;challenger.genes.motion=1.15;resident.genes.body=.86;resident.genes.motion=.9;resident.health=72;resident.energy=SPECIES.needlejaw.maxEnergy*.65;
challengerDen.known=true;challengerDen.everKnown=true; // when the challenger relocates, this learned old range can become an opening
const oldChallengerSite={x:challengerDen.x,y:challengerDen.y,id:challengerDen.id},oldForageRisk=sim.stalkerTerritory.forageAdjustment(family,challengerDen.x,challengerDen.y);
challenger.x=residentDen.x+.5;challenger.y=residentDen.y;const rngBefore=sim.rng.state;sim.stalkerTerritory.claimSite(challenger,residentDen,resident);assert.equal(sim.rng.state,rngBefore);
assert.equal(residentDen.changed,true);assert.equal(residentDen.known,false);
const stale=sim.stalkerTerritory.landscapeAt(residentDen.x,residentDen.y,{animal:p});assert.ok(stale.risk>.9);assert.ok(stale.uncertainty>.9,'changed ownership should carry stale-sign uncertainty');
const notice=sim.stalkerTerritory.landscapeNotice(p);assert.equal(notice?.type,'changed');assert.match(notice.body,/reread/i);assert.ok(sim.cognition.state(p).history.some(h=>String(h.type).startsWith('stalker-shift:')),'near-home learned takeover should enter field history');

// The winner's previously learned old territory is temporarily more attractive after relocation.
const old=sim.stalkerTerritory.activeSites().find(d=>d.id===oldChallengerSite.id);assert.ok(old?.abandonedTick!=null);assert.equal(old.abandonReason,'relocated-after-takeover');
const opening=sim.stalkerTerritory.landscapeAt(old.x,old.y,{animal:p});assert.ok(opening.opening>.5,'recent learned abandoned range should create a route opening');const openedForage=sim.stalkerTerritory.forageAdjustment(family,old.x,old.y);assert.ok(openedForage>oldForageRisk,'abandonment should improve the family forage value of that learned route');
const openingQuality=sim.migration.habitatQuality(p,old.x,old.y);assert.ok(openingQuality.territoryOpening>.5);

// Rereading the captured site removes uncertainty while retaining known active-den risk.
p.x=residentDen.x+.5;p.y=residentDen.y+.2;challenger.x=residentDen.x+6;challenger.y=residentDen.y;sim.rebuildSpatial();const reread=sim.stalkerTerritory.inspect(p);assert.equal(reread.ok,true);const refreshed=sim.stalkerTerritory.landscapeAt(residentDen.x,residentDen.y,{animal:p});assert.ok(refreshed.risk>.9);assert.equal(refreshed.uncertainty,0);

// Player-off benchmarks remain outside the learned predator landscape entirely.
const headless=new Simulation('GENVO8-STALKER-LANDSCAPE',{player:false}),hp=headless.animals.find(a=>a.alive&&a.species==='genvo');const before=headless.rng.state;const land=headless.stalkerTerritory.landscapeAt(hp.x,hp.y,{animal:hp});assert.deepEqual({risk:land.risk,uncertainty:land.uncertainty,opening:land.opening},{risk:0,uncertainty:0,opening:0});assert.equal(headless.rng.state,before);

console.log('Learned Stalker landscape / family routing: PASS');
