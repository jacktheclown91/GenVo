import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {Renderer} from '../src/render/renderer.js';

// Stale terrain must be drawn immediately and refreshed out of band instead of
// rebuilding synchronously on the movement/render path.
{
  const r=Object.create(Renderer.prototype),oldCanvas={tag:'stale'};
  r.terrainChunkCache=new Map([['2,3,4',{sig:1,canvas:oldCanvas}]]);
  r.terrainRefreshQueue=[];r.terrainRefreshQueued=new Set();r.terrainRefreshFrame=0;
  r.terrainChunkSignature=()=>2;
  let builds=0;
  // Refreshes are incremental work units; count each started rebuild.
  r.buildTerrainChunk=()=>{builds++;return{tag:'fresh'}};r.createTerrainChunkWork=()=>{builds++;return{tag:'fresh-work'}};r.stepTerrainChunkWork=()=>true;
  assert.strictEqual(r.terrainChunk(2,3,4),oldCanvas,'stale terrain remains drawable while refresh is queued');
  assert.equal(builds,0,'movement/render path does not synchronously rebuild a stale chunk');
  assert.equal(r.terrainRefreshQueue.length,1,'stale chunk is queued exactly once');
  r.terrainChunk(2,3,4);
  assert.equal(r.terrainRefreshQueue.length,1,'repeat draws do not duplicate queued refresh work');
  r.processTerrainRefreshQueue();
  assert.equal(builds,0,'background terrain refresh is throttled instead of rebuilding every frame');
  r.processTerrainRefreshQueue();
  assert.equal(builds,1,'queued terrain eventually refreshes');
}

// Once a creature already carries its taxon lifestyle, hot movement paths must
// not redo evolutionary-tree resolution on every multiplier query.
{
  const sim=new Simulation('GENVO8-PERF-LIFESTYLE-CACHE',{player:true}),p=sim.player();
  p.ecoLifestyle={id:'aquatic',label:'Aquatic'};
  const tree=sim.evolutionTree,orig=tree.taxonFor;
  tree.taxonFor=()=>{throw new Error('cached lifestyle should bypass taxon lookup')};
  assert.equal(sim.speciesLifestyle.lifestyleFor(p).id,'aquatic');
  assert.equal(sim.speciesLifestyle.movementMultiplier(p,{swimming:true}),1.25);
  tree.taxonFor=orig;
}

// Plant dispersal keeps deterministic per-kind codes cached instead of hashing
// mature plant names thousands of times during every daily vegetation pass.
{
  const sim=new Simulation('GENVO8-PERF-DISPERSAL-CACHE',{player:false});
  assert.ok(Object.keys(sim.dispersal.kindCodes).length>=3,'dispersal precomputes plant kind codes');
  const before={...sim.dispersal.kindCodes};
  sim.phaseClimate();
  sim.phaseVegetation();
  assert.deepEqual(sim.dispersal.kindCodes,before,'daily vegetation does not mutate cached dispersal identities');
}

console.log('performance hotfix contracts: PASS');
