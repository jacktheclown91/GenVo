// Controlled player/hunter placement; exercise existing discovery tick, not natural encounter rates.
import fs from 'node:fs';import assert from 'node:assert/strict';import {isDeepStrictEqual} from 'node:util';
import {Simulation} from '../../src/sim/simulation.js';import {CFG} from '../../src/sim/config.js';
import {canHunt} from '../../src/ecology/functional-diet.js';
import {createSimulationSnapshot} from '../../src/persistence/save-manager.js';
import {FiniteCarcassDiscoveryCandidate} from './finite-carcass-discovery-candidate.mjs';
const out=process.argv[2];assert.ok(out&&!fs.existsSync(out));
const s=new Simulation('FINITE-CARCASS-LURE',{player:true});Object.setPrototypeOf(s.discovery,FiniteCarcassDiscoveryCandidate.prototype);
const p=s.player(),hunter=s.animals.find(a=>a.alive&&canHunt(a)&&!a.player),victim=s.animals.find(a=>a.alive&&!a.player&&a!==hunter&&!s.world.water[s.world.idx(a.x,a.y)]);assert.ok(p&&hunter&&victim);
s.kill(victim,'controlled-audit-fixture');p.x=victim.x;p.y=victim.y;hunter.x=p.x+1;hunter.y=p.y;hunter.playerHunt=null;
s.openingGraceEnded=true;s.tickCount=CFG.simHz;
assert.equal(s.discovery.spawnCarcass(p),true);const site=s.discovery.sites.at(-1),before=createSimulationSnapshot(s).world,deathCount=s.stats.deaths;
s.discovery.tick();assert.equal(site.lured,true);assert.equal(hunter.playerHunt?.targetId,p.id);assert.equal(hunter.intent,'stalk-player');assert.equal(hunter.target,p);
assert.ok(s.discovery.notices.some(n=>n.text==='The carcass has drawn a Stalker.'));
assert.equal(s.stats.deaths,deathCount);assert.ok(isDeepStrictEqual(createSimulationSnapshot(s).world,before),'lure and discovery do not change physical food/resources');
// Isolate a depleted-food boundary; direct fixture debit is not ecological consumption proof.
const i=s.world.idx(site.x,site.y);s.world.carrion[i]=0;s.tickCount+=CFG.simHz;s.discovery.tick();assert.equal(site.gone,true);
const report={status:'staged-only-not-installed',scope:'Actual existing discovery.tick and predator beginStalk with controlled player/hunter placement, protection ended, and a controlled canonical mortality fixture. Depletion boundary uses an explicit direct fixture debit; no claim of natural encounter frequency, feeding, decay or browser acceptance.',existingPredatorLurePreserved:true,playerWarningPreserved:true,noResourceChangeDuringLure:true,noExtraDeath:true,depletedMarkerRetires:true};fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
