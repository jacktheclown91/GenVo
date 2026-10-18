import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {recordSoilDig} from '../src/ecology/soil-disturbance.js';

// Fast, deterministic causal contract for disturbed soil, independent of stochastic seed arrival.
// Two identical worlds receive the same real viable seeds (dispersal.deposit) at one cell; only one
// cell carries a canonical dig record. Germination is called with identical habitat inputs.
// Disturbance may raise establishment of seeds that are present; it can never create seed supply.
// Natural outcomes stay in autonomous-soil-engineering.mjs as observations.

const KIND='thistlepod';
function world(){return new Simulation('SOIL-ESTABLISHMENT',{player:false})}
function siteOf(sim){
  const w=sim.world;
  for(let y=8;y<w.n-8;y++)for(let x=8;x<w.n-8;x++){const i=w.idx(x,y);if(w.water[i]||w.plants[KIND][i]>0||w.seedBank[KIND][i]>0||sim.dispersal.isEstablished(KIND,i))continue;if(w.fertility[i]>.55&&Math.abs(w.moisture[i]-.25)<.12)return{x,y,i}}
  throw Error('no suitable land cell');
}
function trial(seedAmount,disturbed){
  const sim=world(),{x,y,i}=siteOf(sim),w=sim.world,rng=sim.rng.state;
  const added=seedAmount>0?sim.dispersal.deposit(KIND,x,y,seedAmount):0;
  if(disturbed){for(let k=0;k<3;k++)recordSoilDig(sim.partAbilities.soilDisturbance,i,sim.day,-1)}
  const bankBefore=w.seedBank[KIND][i],litterBefore=sim.dispersal.litter[i];
  const established=sim.dispersal.germinate(KIND,i,w.moisture[i],w.fertility[i],.58);
  const bankLoss=bankBefore-w.seedBank[KIND][i],litterGain=sim.dispersal.litter[i]-litterBefore;
  return{added,disturbance:sim.partAbilities.disturbedSoilAt(x,y),established,bankLoss,litterGain,rngUnchanged:sim.rng.state===rng};
}

// 1. Ample viable seed (rate-limited establishment): prepared ground establishes more.
const ample={control:trial(.6,false),dug:trial(.6,true)};
assert.equal(ample.control.added,ample.dug.added,'both worlds receive the same real seeds');
assert.ok(ample.dug.disturbance>.5&&ample.control.disturbance===0);
assert.ok(ample.control.established>0,'the control site germinates on its own merits');
assert.ok(ample.dug.established>ample.control.established*1.05,`disturbed soil raises establishment: ${ample.dug.established} vs ${ample.control.established}`);

// 2. Seed-limited: disturbance cannot establish more than the viable seed actually present.
const trace={control:trial(.013,false),dug:trial(.013,true)};
for(const t of [trace.control,trace.dug])assert.ok(t.established<=t.added+1e-12,'establishment never exceeds the seed present');

// 3. No seed: prepared ground alone creates nothing.
const none=trial(0,true);assert.equal(none.established,0,'disturbed soil without viable seed establishes nothing');

// 4. Conservation: every seed taken from the bank is either established biomass or litter.
for(const t of [ample.control,ample.dug,trace.control,trace.dug]){
  assert.ok(Math.abs(t.bankLoss-(t.established+t.litterGain))<1e-6, // seed bank and litter are Float32Array storage
  `seed taken (${t.bankLoss}) equals established + litter (${t.established}+${t.litterGain})`);
  assert.ok(t.rngUnchanged,'germination draws no simulation RNG');
}

console.log('Disturbed-soil establishment: causal advantage with ample seed, no seed creation when seed-limited or absent, propagules conserved PASS',
  JSON.stringify({ample:{control:+ample.control.established.toFixed(5),dug:+ample.dug.established.toFixed(5)},trace:{control:+trace.control.established.toFixed(5),dug:+trace.dug.established.toFixed(5)}}));
