#!/usr/bin/env node
// Aquatic food-web trace (diagnostic; asserts nothing). Follows producer growth, consumer
// assimilation, grazing by animals, and the per-cell viability condition of each consumer tier.
// A consumer tier grows in a cell only when its encounter rate enc=S/(S+K) exceeds
//   enc* = upkeep/(growth*light+upkeep)      (from advanceFreshwater's own update rule)
// so the source density it needs is S* = K*enc*/(1-enc*), K = half-saturation (source carry * .5).
// Usage: node tools/aquatic-food-web.mjs [seed] [days=120] [--no-grazers] [--out file]
import fs from 'node:fs';
import {Simulation} from '../src/sim/simulation.js';
import {FRESHWATER_FOOD,freshwaterField} from '../src/ecology/freshwater-food.js';
import * as FW from '../src/ecology/freshwater-food.js';
const args=process.argv.slice(2),flag=f=>args.includes(f),opt=(f,d)=>{const i=args.indexOf(f);return i>=0?args[i+1]:d};
const pos=args.filter(a=>!a.startsWith('--')&&args[args.indexOf(a)-1]!=='--out');
const seed=pos[0]||'VIAB-A',days=Number(pos[1]||120),out=opt('--out',null);
const sim=new Simulation(seed,{player:false}),w=sim.world;
if(flag('--no-grazers'))sim.animals=sim.animals.filter(a=>a.species!=='rillsifter');
const cells=[];for(let i=0;i<w.len;i++)if(w.water[i]&&w.isPlayable(i%w.n+.5,(i/w.n|0)+.5))cells.push(i);
const light=i=>Math.max(.15,1-Math.abs(w.temperature[i]-.58)*1.7);
const need=kind=>{const p=FRESHWATER_FOOD[kind],K=(FRESHWATER_FOOD[p.source].carry||1)*.5;return i=>{const e=p.upkeep/(p.growth*light(i)+p.upkeep);return K*e/(1-e)}};
const needLarvae=need('larvae'),needFry=need('fry');
const grazed={};const harvest=FW.harvestFreshwater;
// Count animal harvests through the canonical meal receipts.
const rows=[];
for(let d=0;d<=days;d++){
  if(d%(days>200?40:10)===0){
    const tot=k=>cells.reduce((n,i)=>n+(freshwaterField(w,k)[i]||0),0),L=freshwaterField(w,'larvae'),A=freshwaterField(w,'algae'),F=freshwaterField(w,'fry');
    const larvaeViable=cells.filter(i=>A[i]>needLarvae(i)).length/cells.length,fryViable=cells.filter(i=>L[i]>needFry(i)).length/cells.length;
    const lq=cells.map(i=>L[i]).sort((a,b)=>a-b),q=p=>+lq[Math.floor(p*(lq.length-1))].toFixed(4);
    const meanNeedFry=cells.reduce((n,i)=>n+needFry(i),0)/cells.length;
    const row={day:d,algae:+tot('algae').toFixed(1),larvae:+tot('larvae').toFixed(2),fry:+tot('fry').toFixed(3),detritus:+tot('detritus').toFixed(2),larvaePerCell:{p50:q(.5),p90:q(.9),max:q(1)},fryNeedsLarvae:+meanNeedFry.toFixed(4),cellsWhereLarvaeCanGrow:+larvaeViable.toFixed(3),cellsWhereFryCanGrow:+fryViable.toFixed(3),rillsifters:sim.animals.filter(a=>a.alive&&a.species==='rillsifter').length,eaten:{...grazed}};
    rows.push(row);console.log(JSON.stringify(row));
  }
  for(const a of sim.animals)if(a.alive&&a.lastFreshwaterMeal&&a.lastFreshwaterMeal.tick>=sim.tickCount-48&&!a.__counted?.has(a.lastFreshwaterMeal.tick)){(a.__counted??=new Set()).add(a.lastFreshwaterMeal.tick);const k=a.species+':'+a.lastFreshwaterMeal.kind;grazed[k]=+((grazed[k]||0)+a.lastFreshwaterMeal.amount).toFixed(3)}
  const d0=sim.day;while(sim.day===d0){sim.update(null);for(const a of sim.animals)if(a.alive&&a.lastFreshwaterMeal?.tick===sim.tickCount){const k=a.species+':'+a.lastFreshwaterMeal.kind;grazed[k]=+((grazed[k]||0)+a.lastFreshwaterMeal.amount).toFixed(3)}}
}
if(out)fs.writeFileSync(out,JSON.stringify({schema:'genvo.aquatic-food-web/1',seed,days,noGrazers:flag('--no-grazers'),waterCells:cells.length,rows},null,1));
