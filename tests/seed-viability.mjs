import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SEED_VIABILITY,seedUnit,settleSeedCell} from '../src/ecology/seed-viability.js';
import {checkEcologicalIntegrity} from '../tools/ecological-integrity.mjs';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

// seed-viability/1 (creator direction 2026-10-22): seeds are discrete; sub-seed
// cohorts pool into whole seeds by weighted draw, or return to litter.
const world=on=>new Simulation('PLANET-OBS-2',{player:false,worldGenerator:'planetary/1',seedViability:on});
const sim=world(true);assert.equal(sim.seedViabilityRules,SEED_VIABILITY.policy);
assert.equal(new Simulation('GENVO8-SEEDS',{player:false}).seedViabilityRules,undefined);assert.equal(world(false).seedViabilityRules,undefined);

// Unit behaviour on a controlled cell (kind with dispersal; one seed = ovule unit).
const kind='bramble',unit=seedUnit(kind);assert.ok(unit>0);
const shared=world(true);
function cell(amounts,day=1){const s=shared;s.day=day;const d=s.dispersal,i=5000,rows=new Map();amounts.forEach((a,k)=>rows.set('g'+k,{amount:a,originCell:i,route:'test'}));d.floraState.seeds[kind].set(i,rows);return{s,d,i,rows}}
// Whole-seed cohorts are untouched.
{const {d,i,rows}=cell([unit*3,unit*1.5]);assert.equal(settleSeedCell(d,kind,i),0);assert.deepEqual([...rows.values()].map(r=>r.amount),[unit*3,unit*1.5])}
// Sub-seed cohorts: mass is conserved when seeds survive, and returned whole when none does.
{let survived=0,litter=0,trials=0,rareKept=0;const parts=[unit*.05,unit*.15,unit*.1];const pool=parts.reduce((a,b)=>a+b,0);
 for(let day=1;day<=4000;day++){const {d,i,rows}=cell(parts,day),dead=settleSeedCell(d,kind,i),left=[...rows.values()].reduce((n,r)=>n+r.amount,0);trials++;
  assert.ok(Math.abs(left+dead-pool)<1e-12,'mass is conserved: surviving seeds plus litter equal the pool');
  assert.ok(rows.size<=1,'a pool below one seed funds at most one seed');if(rows.size)survived++;else litter++;if(rows.has('g0'))rareKept++}
 const expected=pool/unit;assert.ok(Math.abs(survived/trials-expected)<.03,'expected seed count is unbiased: '+(survived/trials).toFixed(3)+' vs '+expected.toFixed(3));
 assert.ok(rareKept>0&&Math.abs(rareKept/trials-expected*(parts[0]/pool))<.02,'a rare genotype persists in proportion to its seed share')}
// Hashed draws never touch the simulation RNG.
{const {s,d,i}=cell([unit*.2,unit*.3,unit*.4]),before=s.rng.state;settleSeedCell(d,kind,i);assert.equal(s.rng.state,before)}

// Natural run: integrity holds, bank stocks equal their cohort ledgers, and the
// genetic bookkeeping stays far below the policy-free run.
const off=world(false),initial=sim.animals.filter(a=>a.alive).length;
for(let day=0;day<20;day++){for(let t=0;t<CFG.dayTicks;t++){sim.update(null);off.update(null)}checkEcologicalIntegrity(sim,initial)}
const count=s=>{let n=0;for(const c of Object.values(s.dispersal.floraState.seeds))for(const r of c.values())n+=r.size;return n};
for(const [k,cells] of Object.entries(sim.dispersal.floraState.seeds)){const bank=sim.dispersal.seedBank(k);for(const [i,rows] of cells){const total=[...rows.values()].reduce((n,r)=>n+r.amount,0);assert.ok(Math.abs(total-bank[i])<1e-6,'bank equals cohort ledger: '+k+'@'+i)}}
const cohorts=count(sim),offCohorts=count(off),genomes=sim.dispersal.floraState.genomes.size,offGenomes=off.dispersal.floraState.genomes.size;
assert.ok(cohorts<offCohorts/2&&genomes<offGenomes,'discrete seeds bound the bookkeeping: '+cohorts+' vs '+offCohorts+' cohorts, '+genomes+' vs '+offGenomes+' genomes');

// Exact save, restore and continuation; historical saves stay without the policy.
const snap=structuredClone(createSimulationSnapshot(sim,{savedAt:'t',reason:'t'})),back=restoreSimulationSnapshot(structuredClone(snap));
assert.equal(back.seedViabilityRules,SEED_VIABILITY.policy);assert.deepEqual(structuredClone(createSimulationSnapshot(back,{savedAt:'t',reason:'t'})),snap);
for(let t=0;t<CFG.dayTicks*2;t++){sim.update(null);back.update(null)}
assert.deepEqual(structuredClone(createSimulationSnapshot(back,{savedAt:'t',reason:'t'})),structuredClone(createSimulationSnapshot(sim,{savedAt:'t',reason:'t'})));
const old=structuredClone(snap);delete old.core.seedViabilityRules;assert.equal(restoreSimulationSnapshot(old).seedViabilityRules,undefined);
const bad=structuredClone(snap);bad.core.seedViabilityRules='immortal-seeds/9';assert.throws(()=>restoreSimulationSnapshot(bad),/Unknown seed viability/);
console.log('Seed viability PASS: whole seeds untouched, sub-seed pools conserve mass with unbiased seed counts and share-proportional rare survival, no RNG use, natural integrity and exact ledgers ('+cohorts+' vs '+offCohorts+' cohorts, '+genomes+' vs '+offGenomes+' genomes at day 20), exact save/continuation and historical policy.');
