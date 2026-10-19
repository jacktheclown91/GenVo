import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {PLANTS} from '../src/sim/config.js';
import {FLORA_TISSUES,founderFloraGenome,floraMealChannels} from '../src/ecology/flora-genotype.js';
import {plantPreference} from '../src/ecology/functional-diet.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {FOOD_PROFILES,SEASONAL_FORAGE} from '../src/gameplay/foraging.js';
import {drawFloraPlant,drawFloraTrace} from '../src/render/flora.js';

const kinds=['dunebulb','dustsage'];
for(const kind of kinds){
 const p=PLANTS[kind],t=FLORA_TISSUES[kind];
 assert.ok(p?.dispersal?.seedLimited&&p.dispersal.animal);
 assert.ok(p.growth>0&&p.carry>0&&p.nutrition>0&&p.waterNeed<.35);
 assert.ok(t.seed>0&&t.coat>0&&t.seed+t.coat<1);
 assert.ok(FOOD_PROFILES[kind]&&SEASONAL_FORAGE[kind]);
 assert.ok(founderFloraGenome(kind)?.traits.seedAllocation===t.seed);
}
const mouth=id=>({bodyPlan:{nodes:[{socket:'mouth',partId:id}]}});
assert.ok(plantPreference(mouth('grazing-mouth'),'dunebulb')>0);
assert.ok(plantPreference(mouth('kernel-beak'),'dustsage')>plantPreference(mouth('grazing-mouth'),'dustsage'));
assert.ok(floraMealChannels(mouth('kernel-beak'),'dustsage').some(x=>x.tissue==='kernel'));
assert.ok(floraMealChannels(mouth('grazing-mouth'),'dunebulb').some(x=>x.tissue==='crop'));
const s=new Simulation('E7-DRYLAND-LIFECYCLE',{player:true}),w=s.world,d=s.dispersal,p=s.player();
for(const kind of kinds){
 let plants=0,dry=0;
 for(let i=0;i<w.len;i++)if(w.plants[kind][i]>.04&&!w.water[i]){
   plants++;if(w.moisture[i]<.55)dry++;
 }
 assert.ok(plants>0,kind+' must actually exist in a new world');
 assert.ok(dry>0,kind+' must initially occupy physically dry land');
 assert.equal(w.plantResources.energy[kind].length,w.len);
 assert.equal(w.plantResources.limits[kind].length,w.len);
 assert.equal(d.seedReserve[kind].length,w.len);
 assert.equal(d.coatReserve[kind].length,w.len);
 assert.ok(d.floraState.genomes.has('flora1-'+kind));
}
// Verify one real finite meal, credited propagules and save continuity.
const kind='dunebulb';
let i=-1;
for(let cell=0;cell<w.len;cell++){
 const x=cell%w.n+.5,y=Math.floor(cell/w.n)+.5;
 if(w.isPlayable(x,y)&&!w.water[cell]&&w.plants[kind][cell]>.10){i=cell;break;}
}
assert.ok(i>=0,'find playable natural dune bulbs');
p.x=i%w.n+.5;p.y=Math.floor(i/w.n)+.5;p.energy=12;p.hydration=20;
const before=w.plants[kind][i],seedBefore=d.seedReserve[kind][i];
assert.ok(seedBefore>0,'natural crop has finite seed allocation');
const meal=s.playerInteract({kind:'plant',food:kind,i,x:p.x,y:p.y},'eat:'+kind+':'+i);
assert.ok(meal.ok,'eating new flora is a real gameplay action: '+meal.message);
assert.ok(w.plants[kind][i]<before,'physical standing plant stock is removed');
assert.ok(d.seedReserve[kind][i]<seedBefore,'crop seeds leave original source');
assert.ok(p.seedCargo?.[kind]?.load>0,'eater carries viable seeds, not free growth');
const saved=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'e7-flora'})));
assert.equal(saved.world.plants[kind][i],w.plants[kind][i]);
assert.equal(saved.dispersal.seedReserve[kind][i],d.seedReserve[kind][i]);
assert.equal(saved.player().seedCargo[kind].load,p.seedCargo[kind].load);
for(const name of kinds){
 assert.deepEqual(saved.world.plants[name],w.plants[name]);
 assert.deepEqual(saved.world.seedBank[name],w.seedBank[name]);
}
// Pure overhead fallback draws through the existing renderer entrypoints.
// A stub is enough here to check no DOM dependency or unsupported shape.
const calls=[];
const ctx={save(){},restore(){},translate(){},scale(){},fillRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},fill(){},set fillStyle(v){},set strokeStyle(v){},set lineWidth(v){},drawImage:null};
for(const name of kinds){
 const q=PLANTS[name];
 drawFloraPlant(ctx,{shape:q.render,color:q.color,amount:.3,px:0,py:0,u:1,x:2,y:3,kind:name});
 drawFloraTrace(ctx,{shape:q.render,color:q.color,px:0,py:0,u:1,x:2,y:3,kind:name,amount:.2});
}
console.log('E7 dryland flora: founders, two feeding niches, finite seed meal, cargo, save and overhead fallbacks PASS');
