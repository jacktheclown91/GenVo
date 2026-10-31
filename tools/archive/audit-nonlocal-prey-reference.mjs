import assert from 'node:assert/strict';import fs from 'node:fs';import {createSimulationSnapshot} from '../../src/persistence/save-manager.js';
import {Simulation} from '../../src/sim/simulation.js';
import {createDraft,place} from '../../src/lineage/evolution-draft.js';
import {preyNormalization} from '../../src/ecology/prey-normalization.js';
import {bodyMass,bodyMassFraction} from '../../src/organisms/body-mass.js';
import {PARTS} from '../../src/lineage/part-registry.js';
const sim=new Simulation('FRESHWATER-HUNTER-CAPACITY',{player:false}),a=sim.animals.find(a=>a.species==='needlejaw'),w=sim.world;
const terrestrialPlan=a.bodyPlan;const draft=createDraft({base:a.bodyPlan,ancestry:Object.keys(PARTS),budget:99});
for(const n of a.bodyPlan.nodes.filter(n=>n.socket?.startsWith('limb.')))assert.ok(place(draft,'webbed-leg','root',n.socket).ok);
for(const [part,socket] of [['paddle-tail','tail'],['gill-slits','flank.left']])assert.ok(place(draft,part,'root',socket).ok);
a.bodyPlan=draft.plan;a.x=50.5;a.y=50.5;sim.animals=[a];sim.rebuildSpatial();w.water.fill(1);w.buildLandRegions();w.buildHydrology();
for(const f of Object.values(w.plants))f.fill(0);for(const f of Object.values(w.freshwaterFood))f.fill(0);w.carrion.fill(0);

// Diagnostic controlled world only: establish a distant dry island and one real
// initialized eligible animal BEFORE paired observations. No changes between
// branch measurements except that remote animal's alive flag; no updates run.
const remote=sim.spawnAnimal('mosskip',110.5,110.5);remote.age=100;w.water[w.idx(remote.x,remote.y)]=0;w.buildLandRegions();w.buildHydrology();remote.alive=false;sim.rebuildSpatial();
const rows=[];for(const stock of [0,.001,.002,.005,.01,.02,.05,.1,.35]){w.freshwaterFood.fry.fill(stock);remote.alive=false;sim.rebuildSpatial();sim.carrying.forageCache.clear();const before=sim.carrying.breedingState(a),localBefore=sim.localPreyCount(a,14),supplyBefore=sim.carrying.surveyAt(a),rng=sim.rng.state,world=structuredClone(createSimulationSnapshot(sim).world);remote.alive=true;sim.rebuildSpatial();sim.carrying.forageCache.clear();const after=sim.carrying.breedingState(a),localAfter=sim.localPreyCount(a,14),supplyAfter=sim.carrying.surveyAt(a);assert.equal(localBefore,localAfter);assert.deepEqual(supplyBefore,supplyAfter);assert.deepEqual(createSimulationSnapshot(sim).world,world);assert.equal(sim.rng.state,rng);rows.push({stock,remoteDistance:Math.hypot(remote.x-a.x,remote.y-a.y),localPrey:localBefore,waterEnergy:supplyBefore.waterEnergy,before,after});}
const out='docs/living-planet-architecture/physical-authority-audit/nonlocal-prey-reference-before.json';if(fs.existsSync(out))throw Error('Preserve earlier counterfactual');fs.writeFileSync(out,JSON.stringify({scope:'Controlled finite stock sweep. Remote initialized eligible adult presence only; identical local supply, local prey count, world stocks and RNG. No actual deaths, births or natural outcome frequency claim.',changed:rows.filter(r=>r.before.resourceValue!==r.after.resourceValue).length,gateFlips:rows.filter(r=>r.before.allowed!==r.after.allowed).length,rows},null,2));console.log(JSON.stringify({changed:rows.filter(r=>r.before.resourceValue!==r.after.resourceValue).length,flips:rows.filter(r=>r.before.allowed!==r.after.allowed).map(r=>({stock:r.stock,before:r.before.allowed,after:r.after.allowed,beforeResource:r.before.resourceValue,afterResource:r.after.resourceValue}))}));
