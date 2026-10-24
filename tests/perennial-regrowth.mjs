import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {PERENNIAL_REGROWTH,seedRain} from '../src/ecology/perennial-regrowth.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

// Perennial regrowth (2026-10-23): grazing takes only the above-ground share of a plant's reserve, so a
// grazed-out tile regrows from its roots; a tile with neither plant nor reserve is recolonised from its
// neighbours' own tissue and reserve; nothing is created; recorded worlds are unchanged.
const make=(perennialRegrowth=true)=>new Simulation('GENVO8-TEST-A',{player:true,dayClock:true,metabolism:true,foodProperties:true,perennialRegrowth,worldGenerator:'planetary/1'});
const covered=sim=>{const w=sim.world,m=w.plants.sunmoss,e=w.plantResources.energy.sunmoss;for(let i=0;i<w.len;i++){const x=i%w.n,y=i/w.n|0;if(x>2&&y>2&&x<w.n-3&&y<w.n-3&&!w.water[i]&&m[i]>.5&&e[i]>.05)return i}};
const xy=(w,i)=>({x:i%w.n+.5,y:(i/w.n|0)+.5});
// 1. Grazing to nothing keeps the root share of the reserve; recorded worlds lose it all.
for(const on of [true,false]){
 const sim=make(on),w=sim.world,i=covered(sim),e=w.plantResources.energy.sunmoss,reserve=e[i],{x,y}=xy(w,i);
 w.consume('sunmoss',x,y,10);assert.equal(w.plants.sunmoss[i],0);
 assert.ok(Math.abs(e[i]-(on?reserve*PERENNIAL_REGROWTH.rootShare:0))<1e-9,(on?'the roots keep ':'recorded worlds keep ')+e[i].toFixed(4)+' of '+reserve.toFixed(4));
}
// 2. The grazed tile regrows over the next days from its roots; on recorded worlds it stays bare.
{
 const grazedAfter=on=>{const sim=make(on),w=sim.world,i=covered(sim),{x,y}=xy(w,i);w.consume('sunmoss',x,y,10);for(let t=0;t<CFG.dayTicks*3;t++)sim.update(null);return w.plants.sunmoss[i]};
 const now=grazedAfter(true),then=grazedAfter(false);assert.ok(now>.02,'regrows from its roots: '+now.toFixed(3));assert.ok(then<.002,'recorded worlds stay bare: '+then.toFixed(4));
}
// 3. Seed rain takes the propagule from the neighbours: biomass and reserve are conserved.
{
 const sim=make(),w=sim.world,m=w.plants.sunmoss,e=w.plantResources.energy.sunmoss;let i=covered(sim);
 m[i]=0;e[i]=0;const x=i%w.n,y=i/w.n|0,cells=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)cells.push(w.idx(x+dx,y+dy));
 const sum=a=>cells.reduce((t,j)=>t+a[j],0),b0=sum(m),e0=sum(e);m[i]=seedRain(sim,'sunmoss',i,0);
 assert.ok(m[i]>0,'a propagule arrives: '+m[i].toFixed(5));assert.ok(Math.abs(sum(m)-b0)<1e-6&&Math.abs(sum(e)-e0)<1e-12,'nothing is created (biomass is stored in single precision): '+(sum(m)-b0));
 const old=make(false);assert.equal(seedRain(old,'sunmoss',i,0),0,'recorded worlds get no seed rain');
}
// 4. Saves keep the policy.
{
 const back=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(make(),{savedAt:'t',reason:'t'})));assert.equal(back.perennialRegrowthRules,PERENNIAL_REGROWTH.policy);
 assert.equal(restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(make(false),{savedAt:'t',reason:'t'}))).perennialRegrowthRules,undefined);
}
console.log('Perennial regrowth PASS: grazing keeps the root reserve and grazed tiles regrow, seed rain conserves biomass and reserve, saved, recorded worlds unchanged.');
