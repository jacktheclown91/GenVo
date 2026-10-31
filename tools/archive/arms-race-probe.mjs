// Arms-race probe (creator direction 2026-10-10, "Build one complete ecological arms race").
// Runs several seeded worlds with no player and measures, from the simulation itself:
//   - how common each part that the species did not start with becomes over time;
//   - whether predation is selective: are prey killed by Stalkers less likely to carry protective parts
//     than the living prey around them at that moment? (a selection differential, not a story)
//   - causes of death per species.
// Usage: node tools/arms-race-probe.mjs [days=420] [seeds=4] [out.json]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {Simulation} from '../../src/sim/simulation.js';
import {wildStartPlan,isWildSpecies} from '../../src/organisms/wild-bodies.js';
import {partEffectFactors} from '../../src/lineage/part-abilities.js';
import {CFG} from '../../src/sim/config.js';
import {canSwim} from '../../src/lineage/lifestyle.js';
import {isWaterDweller,aquaticScore} from '../../src/lineage/aquatic.js';
// ARMS_CFG='{"maxBite":70}' overrides CFG.wildHunt for a sweep.
if(process.env.ARMS_CFG)Object.assign(CFG.wildHunt,JSON.parse(process.env.ARMS_CFG));

const days=+(process.argv[2]||420),seeds=+(process.argv[3]||4),out=process.argv[4];
assert.ok(Number.isInteger(days)&&days>0&&Number.isInteger(seeds)&&seeds>0);
const hash=crypto.createHash('sha256');
function hashSource(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const file=path.join(dir,entry.name);if(entry.isDirectory())hashSource(file);else hash.update(file).update(fs.readFileSync(file))}}
hashSource(fileURLToPath(new URL('../../src',import.meta.url)));
const meta={days,seeds,start:+process.env.ARMS_SEED0||0,player:process.env.ARMS_PLAYER==='1',sourceFingerprint:hash.digest('hex'),config:structuredClone(CFG.wildHunt),complete:false};
function persist(complete=false){if(!out)return;meta.complete=complete;meta.completedSeeds=runs.length;fs.writeFileSync(out+'.tmp',JSON.stringify(runs,null,1));fs.renameSync(out+'.tmp',out);fs.writeFileSync(out+'.meta.json',JSON.stringify(meta,null,2))}
const SPECIES=['needlejaw','mosskip','rootling'];
const novel=a=>{const start=new Set(wildStartPlan(a.species).nodes.map(n=>n.partId));return [...new Set(a.bodyPlan.nodes.map(n=>n.partId))].filter(p=>!start.has(p))};
// "Protected": the body takes less damage from a hit, shields its rear, or can repel a hunter.
const protectedBody=a=>{const pf=partEffectFactors(a);return !!pf&&((pf.damageTaken??1)<.97||(pf.rearDamage??1)<1||(pf.repel||0)>0)};
const runs=[];
persist();
for(let s=0;s<seeds;s++){
  const seed=`ARMS-${s+(+process.env.ARMS_SEED0||0)}`,w=new Simulation(seed,{player:process.env.ARMS_PLAYER==='1'}),t0=Date.now();
  const deaths={},sel={killed:0,killedProt:0,livingSamples:0,livingProt:0},timeline=[];
  const kill=w.kill.bind(w);
  w.kill=(a,cause,...rest)=>{if(a?.alive&&isWildSpecies(a.species)){const k=`${a.species}:${cause}`;deaths[k]=(deaths[k]||0)+1;
      if(cause==='predation'&&a.species==='mosskip'){sel.killed++;if(protectedBody(a))sel.killedProt++;const live=w.animals.filter(x=>x.alive&&x.species==='mosskip'&&x.id!==a.id);sel.livingSamples+=live.length;sel.livingProt+=live.filter(protectedBody).length}}
    return kill(a,cause,...rest)};
  let next=0;
  while(w.day<=days){w.update(null);if(w.day>=next){next+=30;const snap={day:w.day};for(const sp of SPECIES){const live=w.animals.filter(a=>a.alive&&a.species===sp),freq={};for(const a of live)for(const p of novel(a))freq[p]=(freq[p]||0)+1;
      snap[sp]={n:live.length,swimmers:live.filter(canSwim).length,dwellers:live.filter(isWaterDweller).length,aquatic:+Math.max(0,...live.map(aquaticScore)).toFixed(2),protected:+(live.filter(protectedBody).length/Math.max(1,live.length)).toFixed(3),top:Object.entries(freq).sort((x,y)=>y[1]-x[1]).slice(0,4).map(([p,c])=>`${p}:${(c/live.length).toFixed(2)}`)}}timeline.push(snap)}}
  const killedRate=sel.killed?sel.killedProt/sel.killed:null,livingRate=sel.livingSamples?sel.livingProt/sel.livingSamples:null;
  runs.push({seed,seconds:Math.round((Date.now()-t0)/1000),deaths,selection:{hopperPredationDeaths:sel.killed,protectedAmongKilled:killedRate&&+killedRate.toFixed(3),protectedAmongLiving:livingRate&&+livingRate.toFixed(3),counts:{...sel}},timeline});
  persist();
  const last=timeline.at(-1);console.log(seed,`${runs.at(-1).seconds}s`,'hopper predation deaths',sel.killed,'protected: killed',killedRate?.toFixed(3),'living',livingRate?.toFixed(3),'| end',SPECIES.map(sp=>`${sp} n=${last[sp].n} prot=${last[sp].protected} ${last[sp].top.join(' ')}`).join(' | '));
}
persist(true);
