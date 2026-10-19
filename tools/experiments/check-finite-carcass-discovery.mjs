import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {isDeepStrictEqual} from 'node:util';
import {Simulation} from '../../src/sim/simulation.js';import {createSimulationSnapshot,restoreSimulationSnapshot} from '../../src/persistence/save-manager.js';
import {FiniteCarcassDiscoveryCandidate} from './finite-carcass-discovery-candidate.mjs';
const out=process.argv[2];assert.ok(out&&!fs.existsSync(out));
const sim=new Simulation('FINITE-CARCASS-PROBE',{player:false});Object.setPrototypeOf(sim.discovery,FiniteCarcassDiscoveryCandidate.prototype);
const snapshot=()=>createSimulationSnapshot(sim,{savedAt:'fixed',reason:'finite-carcass-probe'}),before=snapshot();
assert.equal(sim.discovery.spawnCarcass({x:64,y:64}),false,'no death-funded food means no new discovery');assert.ok(isDeepStrictEqual(snapshot().world,before.world));
// Explicit controlled mortality fixture, not a death caused or requested by discovery.
const victim=sim.animals.find(a=>a.alive&&!sim.world.water[sim.world.idx(a.x,a.y)]&&a.x>=2&&a.x<sim.world.n-2&&a.y>=2&&a.y<sim.world.n-2);assert.ok(victim);
sim.kill(victim,'controlled-audit-fixture');const funded=snapshot(),deaths=sim.stats.deaths;
assert.equal(sim.discovery.spawnCarcass(victim),true);const site=sim.discovery.sites.at(-1),i=sim.world.idx(site.x,site.y);assert.ok(sim.world.carrion[i]>=.1);
assert.ok(isDeepStrictEqual(snapshot().world,funded.world),'discovery cannot change any physical World field');assert.equal(sim.stats.deaths,deaths,'discovery cannot force mortality');
assert.equal(sim.discovery.spawnCarcass(victim),false,'no duplicate live marker on same carcass');
const saved=snapshot(),restored=restoreSimulationSnapshot(structuredClone(saved));assert.ok(isDeepStrictEqual(createSimulationSnapshot(restored,{savedAt:'fixed',reason:'finite-carcass-probe'}),saved),'ordinary metadata and existing food roundtrip');
const source='tools/experiments/finite-carcass-discovery-candidate.mjs';const report={status:'staged-only-not-installed',scope:'Controlled canonical mortality fixture, no food injection. Discovery attaches to existing carrion without changing World or death count. No canonical policy/load integration, remote replay, decay/lure gameplay or historical rule migration claimed.',emptyFoodDenied:true,existingDeathCarrionMarked:true,physicalWorldUnchanged:true,noForcedDeath:true,duplicateMarkerDenied:true,ordinaryMetadataRoundTrip:true,site,candidateSha256:createHash('sha256').update(fs.readFileSync(source)).digest('hex')};fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
