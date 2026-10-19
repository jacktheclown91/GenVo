import {planetaryTravelAvailability,crossPlanetaryBorder} from '../src/world/planetary-travel.js';
import assert from 'node:assert/strict';import {isDeepStrictEqual} from 'node:util';
import {Simulation} from '../src/sim/simulation.js';import {CFG} from '../src/sim/config.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {CARCASS_RULES,enableFiniteCarcass} from '../src/gameplay/carcass-rules.js';
import {canHunt} from '../src/ecology/functional-diet.js';
const snap=s=>createSimulationSnapshot(s,{savedAt:'fixed',reason:'carcass-policy'}),same=(a,b,message)=>assert.ok(isDeepStrictEqual(a,b),message);
const empty=new Simulation('CARCASS-EMPTY',{player:false,bootstrap:false});assert.equal(empty.carcassRules,CARCASS_RULES.finite);
const noFood=snap(empty).world;assert.equal(empty.discovery.spawnCarcass({x:64,y:64}),false);same(snap(empty).world,noFood,'no food created in an empty world');assert.equal(empty.stats.deaths,0);
const historical=snap(empty);delete historical.core.carcassRules;
const legacy=restoreSimulationSnapshot(structuredClone(historical));assert.ok(!Object.hasOwn(legacy,'carcassRules'));same(snap(legacy),historical,'missing policy retains exact representation');
assert.equal(legacy.discovery.spawnCarcass({x:64,y:64}),true,'explicit historical fixture retains its original event');assert.ok(legacy.world.carrion.some(v=>v>0));assert.equal(legacy.stats.deaths,0);
const before=snap(legacy);assert.throws(()=>enableFiniteCarcass(legacy),/explicit source/);same(snap(legacy),before);
assert.equal(enableFiniteCarcass(legacy,{source:'controlled-policy-test'}).changed,true);assert.equal(enableFiniteCarcass(legacy,{source:'controlled-policy-test'}).changed,false);
const migrated=snap(legacy),stripped=structuredClone(migrated);delete stripped.core.carcassRules;delete stripped.core.carcassRuleMigrations;same(stripped,before,'migration cannot retrospectively debit old food or alter organisms');same(snap(restoreSimulationSnapshot(structuredClone(migrated))),migrated);
for(const value of [null,undefined,'unknown/9']){const bad=structuredClone(migrated);bad.core.carcassRules=value;assert.throws(()=>restoreSimulationSnapshot(bad),/Unknown carcass rules/)}
const badHistory=structuredClone(migrated);badHistory.core.carcassRuleMigrations[0].globalTick=-1;assert.throws(()=>restoreSimulationSnapshot(badHistory),/Invalid carcass migration/);
const s=new Simulation('FINITE-CARCASS-LURE',{player:true}),p=s.player(),hunter=s.animals.find(a=>a.alive&&canHunt(a)&&!a.player),victim=s.animals.find(a=>a.alive&&!a.player&&a!==hunter&&!s.world.water[s.world.idx(a.x,a.y)]);assert.ok(hunter&&victim);
// Controlled canonical mortality and placement; discovery itself never requests a death.
s.kill(victim,'controlled-audit-fixture');p.x=victim.x;p.y=victim.y;hunter.x=p.x+1;hunter.y=p.y;hunter.playerHunt=null;s.openingGraceEnded=true;s.tickCount=CFG.simHz;
const funded=snap(s).world,rng=s.rng.state,deaths=s.stats.deaths;assert.equal(s.discovery.spawnCarcass(p),true);const site=s.discovery.sites.at(-1);
same(snap(s).world,funded,'marker creation preserves every physical resource');assert.equal(s.rng.state,rng);assert.equal(s.stats.deaths,deaths);assert.equal(s.discovery.spawnCarcass(p),false,'no duplicate live marker');
s.discovery.tick();assert.equal(site.lured,true);assert.equal(hunter.playerHunt?.targetId,p.id);assert.equal(hunter.intent,'stalk-player');assert.ok(s.discovery.notices.some(n=>n.text==='The carcass has drawn a Stalker.'));same(snap(s).world,funded,'lure adds no food');assert.equal(s.stats.deaths,deaths);
const saved=snap(s);same(snap(restoreSimulationSnapshot(structuredClone(saved))),saved,'ordinary save resumes marker, predator and actual food');
// Explicit depletion boundary fixture, not proof of natural feeding/decay.
s.world.carrion[s.world.idx(site.x,site.y)]=0;s.tickCount+=CFG.simHz;s.discovery.tick();assert.equal(site.gone,true);
for(const mode of ['finite','legacy','environmental']){
 const missing=mode!=='finite';
 const s=new Simulation('PLANET-B0-A',{player:true,worldGenerator:'planetary/1'});if(missing)delete s.carcassRules;if(mode==='environmental')s.offscreenBiologyEnabled=false;
 let found=false;for(let y=8.5;y<118.5;y++){s.player().x=125.2;s.player().y=y;if(planetaryTravelAvailability(s).enabled){found=true;break}}assert.ok(found);
 const trip=crossPlanetaryBorder(s);assert.equal(trip.ok,true);const dest=trip.simulation;
 assert.equal(Object.hasOwn(dest,'carcassRules'),!missing);assert.equal(dest.carcassRules,missing?undefined:CARCASS_RULES.finite);
 const saved=snap(dest);assert.ok(isDeepStrictEqual(snap(restoreSimulationSnapshot(structuredClone(saved))),saved));
 const mixed=structuredClone(saved);mixed.core.planetaryTravel.sessions[0].snapshot.core.carcassRules=missing?CARCASS_RULES.finite:CARCASS_RULES.legacy;assert.throws(()=>restoreSimulationSnapshot(mixed),/Inconsistent planetary carcass rules/);
 if(mode==='environmental'){const before=structuredClone(snap(dest));assert.throws(()=>enableFiniteCarcass(dest,{source:'controlled-environmental-adoption'}),/Environmental-only/);same(snap(dest),before,'unsupported clock conversion changes nothing');continue;}
 if(missing){
  const old=structuredClone(snap(dest));dest.tickCount+=CFG.lifeStride;const debtState=structuredClone(snap(dest));assert.throws(()=>enableFiniteCarcass(dest,{source:'controlled-reject-debt'}),/catchup/);same(snap(dest),debtState,'debt rejection is atomic');dest.tickCount=old.core.tickCount;
  assert.equal(enableFiniteCarcass(dest,{source:'controlled-regional-adoption'}).regions,2);
  const changed=snap(dest),without=structuredClone(changed);delete without.core.carcassRules;delete without.core.carcassRuleMigrations;for(const r of without.core.planetaryTravel.sessions){delete r.snapshot.core.carcassRules;delete r.snapshot.core.carcassRuleMigrations}same(without,old,'regional adoption changes metadata only: '+Object.keys(without.core).filter(k=>!isDeepStrictEqual(without.core[k],old.core[k])).join(','));same(snap(restoreSimulationSnapshot(changed)),changed);
 }

}
console.log('carcass rules: finite resources, historical/adoption continuity, regional atomicity, lure, depletion and saves PASS');
