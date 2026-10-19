import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {PLANTS} from '../src/sim/config.js';
import {COLD_FLORA,coldFloraSuitability,coldFloraTemperatureFactor,coldFloraDieback} from '../src/ecology/cold-flora.js';
import {FLORA_TISSUES,founderFloraGenome,floraMealChannels} from '../src/ecology/flora-genotype.js';
import {plantPreference} from '../src/ecology/functional-diet.js';
import {FOOD_PROFILES,SEASONAL_FORAGE} from '../src/gameplay/foraging.js';
import {growLandProducers} from '../src/ecology/plant-resources.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {drawFloraPlant,drawFloraTrace} from '../src/render/flora.js';
const kinds=['frostlichen','snowberry'];
const mouth=id=>({bodyPlan:{nodes:[{socket:'mouth',partId:id}]}});
for(const kind of kinds){
 const p=PLANTS[kind],t=FLORA_TISSUES[kind];
 assert.ok(p?.dispersal?.seedLimited&&p.carry>0&&p.nutrition>0,kind+' needs real resources');
 assert.ok(p.tempOptimum<.35&&p.tempTolerance>1&&COLD_FLORA[kind],kind+' has a cold growth range');
 assert.ok(t.seed>0&&t.coat>0&&t.seed+t.coat<1);
 assert.ok(FOOD_PROFILES[kind]&&SEASONAL_FORAGE[kind]);
 assert.equal(founderFloraGenome(kind).traits.seedAllocation,t.seed);
 assert.ok(coldFloraTemperatureFactor(kind,p.tempOptimum)>coldFloraTemperatureFactor(kind,.8));
 assert.equal(coldFloraSuitability(kind,{temperature:.9,elevation:.85,moisture:.45,fertility:.7}),0,'a hot mountain cannot found a cold plant');
 assert.ok(coldFloraDieback(kind,.9)>0,'warm spells kill cold-biome specialist tissue');
 assert.equal(coldFloraDieback(kind,p.tempOptimum),0);
}
assert.ok(plantPreference(mouth('grazing-mouth'),'frostlichen')>0);
assert.ok(plantPreference(mouth('nibbler-mouth'),'snowberry')>0);
assert.ok(floraMealChannels(mouth('grazing-mouth'),'snowberry').some(c=>c.tissue==='crop'));
assert.ok(floraMealChannels(mouth('kernel-beak'),'snowberry').some(c=>c.tissue==='kernel'));
const sim=new Simulation('E11-COLD-FOOD',{player:true}),w=sim.world,d=sim.dispersal,p=sim.player();
const candidate={};
for(const kind of kinds){
 let covered=0;
 for(let i=0;i<w.len;i++)if(w.plants[kind][i]>.012&&!w.water[i]){
  const score=coldFloraSuitability(kind,{temperature:w.temperature[i],elevation:w.terrain.elevation[i],moisture:w.moisture[i],fertility:w.fertility[i]});
  assert.ok(score>0,'initial '+kind+' is in a physically viable cold habitat');
  covered++;if(w.isPlayable(i%w.n+.5,(i/w.n|0)+.5)&&(candidate[kind]==null||w.plants[kind][i]>w.plants[kind][candidate[kind]]))candidate[kind]=i;
 }
 assert.ok(covered>0,'newly generated world has real cold founders for '+kind);
 assert.ok(candidate[kind]!=null,'cold food must appear on playable ground');
 assert.ok(w.plants[kind][candidate[kind]]>.08,'mature enough accessible wild cold plants must occur naturally');
 assert.equal(w.plantResources.energy[kind].length,w.len);
 assert.equal(w.plantResources.limits[kind].length,w.len);
 assert.equal(d.seedReserve[kind].length,w.len);
 assert.equal(d.coatReserve[kind].length,w.len);
 assert.ok(d.floraState.genomes.has('flora1-'+kind));
}
const kind='snowberry',i=candidate[kind];
p.x=i%w.n+.5;p.y=(i/w.n|0)+.5;p.energy=15;p.hydration=25;
const stock=w.plants[kind][i],seeds=d.seedReserve[kind][i];
assert.ok(seeds>0);
const meal=sim.playerInteract({kind:'plant',food:kind,i,x:p.x,y:p.y},'eat:'+kind+':'+i);
assert.ok(meal.ok,'cold fruit is a real interaction: '+meal.message);
assert.ok(w.plants[kind][i]<stock,'fruit consumption removes standing stock');
assert.ok(d.seedReserve[kind][i]<seeds,'fruit removes canonical seed tissue');
assert.ok(p.seedCargo?.[kind]?.load>0,'anatomy-compatible feeding disperses true plant propagules');
const saved=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(sim,{savedAt:'fixed',reason:'e11'})));
assert.equal(saved.world.plants[kind][i],w.plants[kind][i]);
assert.equal(saved.dispersal.seedReserve[kind][i],d.seedReserve[kind][i]);
assert.equal(saved.player().seedCargo[kind].load,p.seedCargo[kind].load);
for(const name of kinds)assert.deepEqual(saved.world.plants[name],w.plants[name]);

// Warm spell causes a real mass return to decomposer litter and proportional
// seed/coat loss through the canonical growth pass, with no invented plant food.
const l='frostlichen',j=candidate[l],initial=w.plants[l][j],beforeLitter=d.litter[j],beforeSeeds=d.seedReserve[l][j];
const entry={kind:l,p:PLANTS[l],d:PLANTS[l].dispersal,plants:w.plants[l],bank:w.seedBank[l],seasonBoost:1};
growLandProducers(sim,j,[entry],{m:w.moisture[j],f:w.fertility[j],temp:.90,scar:0,grow:v=>v});
assert.ok(w.plants[l][j]<initial,'heat kills real lichen biomass');
assert.ok(d.litter[j]>beforeLitter,'decayed cold flora returns to ordinary soil nutrient cycle');
assert.ok(d.seedReserve[l][j]<beforeSeeds,'lost plants cannot keep all their reproductive stock');

// Existing warm plants retain old germination physics when cold flora is added.
assert.ok(Math.abs(coldFloraTemperatureFactor('bramble',.58)-1)<1e-9);
const ctx={save(){},restore(){},translate(){},scale(){},fillRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},fill(){},set fillStyle(v){},set strokeStyle(v){},set lineWidth(v){},drawImage:null};
for(const name of kinds){
 const q=PLANTS[name];
 drawFloraPlant(ctx,{shape:q.render,color:q.color,amount:.32,px:0,py:0,u:1,x:2,y:3,kind:name});
 drawFloraTrace(ctx,{shape:q.render,color:q.color,px:0,py:0,u:1,x:2,y:3,kind:name,amount:.22});
}
console.log('E11 cold flora founders, temperature niches, genuine fruit feeding, seed transport, heat litter receipts, save/load and overhead art PASS');
