// In-memory demand candidate. Does not modify canonical source during validation.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {CarryingPressureController} from '../../src/ecology/carrying.js';
import {SPECIES} from '../../src/organisms/species.js';
import {CFG,PLANTS} from '../../src/sim/config.js';
import {FRESHWATER_FOOD,freshwaterPreference,freshwaterField} from '../../src/ecology/freshwater-food.js';
const original=fs.readFileSync('src/ecology/carrying.js');
export class DemandCandidate extends CarryingPressureController{
  waterAccess(a,x,y,p){
    if(this.sim.canOccupy(a,x,y)&&this.sim.canReach(a,x,y))return true;
    return !!p.surface&&[[0,-1],[-1,0],[1,0],[0,1]].some(([dx,dy])=>this.sim.canOccupy(a,x+dx,y+dy)&&this.sim.canReach(a,x+dx,y+dy));
  }
  forageAt(a){const rows=this.supplyAt(a);return rows.eligibleCells?rows.reduce((n,r)=>n+r.energy*r.preference,0)/rows.eligibleCells:0}
  supplyAt(a){
    const w=this.sim.world,seen=new Set(),rows=[];rows.eligibleCells=0;
    const x0=Math.floor(a.x/this.bucketSize)*this.bucketSize+this.bucketSize*.5,y0=Math.floor(a.y/this.bucketSize)*this.bucketSize+this.bucketSize*.5;
    for(let oy=-10;oy<=10;oy+=3)for(let ox=-10;ox<=10;ox+=3){
      const x=Math.max(1,Math.min(CFG.worldSize-2,x0+ox)),y=Math.max(1,Math.min(CFG.worldSize-2,y0+oy)),i=w.idx(x,y);if(seen.has(i))continue;seen.add(i);
      if(w.water[i]){let accessible=false;
        for(const [kind,p] of Object.entries(FRESHWATER_FOOD)){const preference=freshwaterPreference(a,kind);if(preference<=0||!this.waterAccess(a,x,y,p))continue;accessible=true;const amount=freshwaterField(w,kind)?.[i]||0;if(amount>0)rows.push({kind,x,y,wet:true,preference,energy:amount*p.nutrition})}
        if(accessible)rows.eligibleCells++;
      }else if(this.sim.canReach(a,x,y)){rows.eligibleCells++;for(const [kind,p] of Object.entries(PLANTS)){const preference=SPECIES[a.species].diets?.[kind]||0,amount=w.plants[kind]?.[i]||0;if(preference>0&&amount>0)rows.push({kind,x,y,wet:false,preference,energy:amount*p.nutrition})}}
    }
    return rows;
  }
  breedingState(a,options={}){
    const result=super.breedingState(a,options),point=options.at?{...a,...options.at}:a,rows=this.supplyAt(point);
    // Retain the existing land-only rule in this candidate. Water supply is a
    // single shared pool; overlap never adds a second claim on that same pool.
    if(!rows.some(r=>r.wet))return result;
    const total=rows.reduce((n,r)=>n+r.energy*r.preference,0),density=SPECIES[a.species].density;
    let competitors=0;
    this.sim.forEachNearby(point,density.radius,b=>{
      if(!b.alive||b.id===a.id||b.species===a.species||Math.hypot(b.x-point.x,b.y-point.y)>density.radius)return;
      let shared=0;for(const r of rows){
        if(r.wet?!this.waterAccess(b,r.x,r.y,FRESHWATER_FOOD[r.kind]):!this.sim.canReach(b,r.x,r.y))continue;
        const preference=r.wet?freshwaterPreference(b,r.kind):(SPECIES[b.species].diets?.[r.kind]||0);
        shared+=r.energy*Math.min(r.preference,preference);
      }
      competitors+=shared/total;
    });
    const ratio=(result.local+competitors)/Math.max(1,density.softCap),crowd=ratio<=.32?1:ratio>=1.18?0:Math.max(0,Math.min(1,1-(ratio-.32)/.86));
    return{...result,competitors,ratio,crowd,allowed:ratio<1.18&&result.resource>.04,driveRate:result.crowd?result.driveRate*crowd/result.crowd:.20*(SPECIES[a.species].reproduction?.driveScale??1)*(this.sim.recovery?.driveBoost(a.species)??1)*crowd*Math.max(.05,result.resource)};
  }
}
const simURL=pathToFileURL(path.resolve('src/sim/simulation.js')).href,candidateURL=pathToFileURL(path.resolve('tools/freshwater-demand-candidate.mjs')).href;
const test=fs.readFileSync('tests/freshwater-competition-demand.mjs','utf8').replace("import {Simulation} from '../../src/sim/simulation.js';",`import {Simulation as BaseSimulation} from '${simURL}';\nconst DemandCandidate=globalThis.__GENVO8_DEMAND_CANDIDATE__;\nclass Simulation extends BaseSimulation{constructor(...args){super(...args);this.carrying=new DemandCandidate(this)}}`).replace(/from '(\.\.\/src\/[^']+)'/g,(_,p)=>`from '${pathToFileURL(path.resolve('tests',p)).href}'`);
// Run only when invoked directly; dynamic test imports reuse this class safely.
if(pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url){
  globalThis.__GENVO8_DEMAND_CANDIDATE__=DemandCandidate;
  try{await import('data:text/javascript;base64,'+Buffer.from(test).toString('base64'))}finally{delete globalThis.__GENVO8_DEMAND_CANDIDATE__}
  const bankTest=fs.readFileSync('tests/freshwater-bank-capacity.mjs','utf8').replace("import {Simulation} from '../../src/sim/simulation.js';",`import {Simulation as BaseSimulation} from '${simURL}';\nconst DemandCandidate=globalThis.__GENVO8_DEMAND_CANDIDATE__;\nclass Simulation extends BaseSimulation{constructor(...args){super(...args);this.carrying=new DemandCandidate(this)}}`).replace(/from '(\.\.\/src\/[^']+)'/g,(_,p)=>`from '${pathToFileURL(path.resolve('tests',p)).href}'`);
  globalThis.__GENVO8_DEMAND_CANDIDATE__=DemandCandidate;
  try{await import('data:text/javascript;base64,'+Buffer.from(bankTest).toString('base64'))}finally{delete globalThis.__GENVO8_DEMAND_CANDIDATE__}
  if(!fs.readFileSync('src/ecology/carrying.js').equals(original))throw Error('source changed');
  const receipt={candidateOnly:true,productionChanged:false,tests:['freshwater-competition-demand.mjs','freshwater-bank-capacity.mjs'],passed:true,sourceFileSha256:crypto.createHash('sha256').update(original).digest('hex'),incomplete:['hunter resource gating','full actual-diet parity','natural ecology and performance','production caching and performance']};
  fs.writeFileSync('reports/pass-w-demand-candidate.json',JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));
}
