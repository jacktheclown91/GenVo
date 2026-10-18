import {groundDiet,canHunt,plantPreference} from '../ecology/functional-diet.js';
import {CFG,PLANTS} from '../sim/config.js';
import {SPECIES} from '../organisms/species.js';

const clamp01=v=>Math.max(0,Math.min(1,Number(v)||0));
const PLANT_KEYS=Object.keys(PLANTS);
// Family forage is computed from living bodies, not a fixed GenVo8 diet.

const STATUS=[
  {id:'depleted',label:'DEPLETED',min:0,tone:'danger',help:'Food inside the family range is running thin. Spread pressure or move toward richer ground.'},
  {id:'strained',label:'STRAINED',min:.28,tone:'warn',help:'Family and competitors are putting noticeable pressure on local food.'},
  {id:'stable',label:'STABLE',min:.47,tone:'stable',help:'The current range is feeding the family without heavy depletion.'},
  {id:'abundant',label:'ABUNDANT',min:.69,tone:'rich',help:'The family range has strong forage and room to absorb more pressure.'}
];

// Population-scale readout built from ecology that already exists: living family,
// real plant biomass, observed grazing history, shelter reserves, and other animals
// eating overlapping foods. It does not create food or change plant growth.
export class FamilySustainabilityController{
  constructor(sim){this.sim=sim;this.cacheDay=-1;this.cacheTick=-Infinity;this.cacheMemberCount=-1;this.cacheCellCount=-1;this.cache=null;this.cellCache=new Map()}
  invalidate(){this.cacheDay=-1;this.cacheTick=-Infinity;this.cacheMemberCount=-1;this.cacheCellCount=-1;this.cache=null;this.cellCache.clear()}
  // Mean family preference per plant, computed once per query (same summation order as before).
  familyDietProfile(){
    const relatives=this.sim.animals.filter(a=>a.alive&&a.lineage);
    if(!relatives.length)return null;
    return PLANT_KEYS.map(key=>relatives.reduce((sum,a)=>sum+plantPreference(a,key),0)/relatives.length);
  }
  dietOverlap(animal,profile=this.familyDietProfile()){
    if(!profile)return 0;
    let overlap=0;
    for(let k=0;k<PLANT_KEYS.length;k++)overlap+=Math.min(profile[k],plantPreference(animal,PLANT_KEYS[k]));
    return overlap;
  }
  competitorsIn(cell){
    const size=this.sim.territory.cellSize,x0=cell.cx*size,y0=cell.cy*size,x1=x0+size,y1=y0+size,out=[];
    // Bounds first and one family profile per call: previously every animal re-scanned every
    // animal for relatives (N x N x plants per cell). Results are identical.
    let profile;
    for(const a of this.sim.animals){
      if(!a.alive||a.lineage||!(a.x>=x0&&a.x<x1&&a.y>=y0&&a.y<y1)||canHunt(a))continue;
      if(profile===undefined)profile=this.familyDietProfile();
      if(this.dietOverlap(a,profile)<=.35)continue;
      out.push(a);
    }
    return out;
  }
  familyIn(cell){
    const size=this.sim.territory.cellSize,x0=cell.cx*size,y0=cell.cy*size,x1=x0+size,y1=y0+size;
    return this.sim.animals.filter(a=>a.alive&&a.lineage&&a.species==='genvo'&&a.x>=x0&&a.x<x1&&a.y>=y0&&a.y<y1);
  }
  dangerAt(cell){let n=0;this.sim.forEachNearby({x:cell.x,y:cell.y},9,a=>{if(a.alive&&canHunt(a))n++});return n}
  sampleCell(cell,{cache=true}={}){
    const key=cell.key||`${cell.cx},${cell.cy}`,segment=Math.floor(this.sim.tickCount/Math.max(1,CFG.dayTicks/4)),cacheKey=`${segment}:${key}`;
    if(cache&&this.cellCache.has(cacheKey))return this.cellCache.get(cacheKey);
    const w=this.sim.world,size=this.sim.territory.cellSize,x0=cell.cx*size,y0=cell.cy*size;let food=0,land=0,grazing=0,recovery=0;
    const eaters=this.familyIn(cell),familyDiet={};
    const active=eaters.length?eaters:this.sim.animals.filter(a=>a.alive&&a.lineage);
    for(const kind of PLANT_KEYS)familyDiet[kind]=active.length?active.reduce((n,a)=>n+plantPreference(a,kind),0)/active.length:0;
    for(let oy=1;oy<size;oy+=2)for(let ox=1;ox<size;ox+=2){
      const x=Math.max(1,Math.min(CFG.worldSize-2,x0+ox)),y=Math.max(1,Math.min(CFG.worldSize-2,y0+oy)),i=w.idx(x,y);if(w.water[i])continue;land++;
      for(const kind of PLANT_KEYS){const eff=familyDiet[kind]||0;if(eff<=0)continue;food+=(w.plants[kind]?.[i]||0)*eff*(PLANTS[kind].nutrition||1)}
      const hist=this.sim.history?.cell?.(i);if(hist){grazing+=hist.grazing||0;recovery+=hist.recovery||0}
    }
    const family=eaters,competitors=this.competitorsIn(cell),foodMean=land?food/land:0,grazingMean=land?grazing/land:0,recoveryMean=land?recovery/land:0,foodIndex=clamp01(foodMean/5.4);
    const pressure=clamp01(family.length*.10+competitors.length*.12+grazingMean*.24);
    const score=clamp01(foodIndex+recoveryMean*.08-pressure*.62);
    const out={...cell,key,land,foodMean,foodIndex,grazing:grazingMean,recovery:recoveryMean,family:family.length,competitors:competitors.length,competitorSpecies:[...new Set(competitors.map(a=>a.species))],danger:this.dangerAt(cell),score};
    if(cache){const prefix=`${segment}:`;for(const old of [...this.cellCache.keys()])if(!old.startsWith(prefix))this.cellCache.delete(old);this.cellCache.set(cacheKey,out)}
    return out;
  }
  reserveRatio(members){
    const stored=(this.sim.shelter?.shelters||[]).filter(s=>s.integrity>0).reduce((n,s)=>n+(s.foodStore||0),0);
    return{stored,ratio:clamp01(stored/Math.max(8,members*7))};
  }
  statusFor(balance){let status=STATUS[0];for(const candidate of STATUS)if(balance>=candidate.min)status=candidate;return status}
  snapshot({force=false}={}){
    const footprint=this.sim.expansion?.occupiedCells?.()||[],members=this.sim.expansion?.members?.()||[],refresh=Math.max(1,CFG.dayTicks/4);
    if(!force&&this.cache&&this.cacheDay===this.sim.day&&this.sim.tickCount-this.cacheTick<refresh&&this.cacheMemberCount===members.length&&this.cacheCellCount===footprint.length)return this.cache;
    const sampled=footprint.map(c=>this.sampleCell(c,{cache:!force}));
    const reserve=this.reserveRatio(members.length),cellCount=Math.max(1,sampled.length),food=sampled.reduce((n,c)=>n+c.foodIndex,0)/cellCount,grazing=sampled.reduce((n,c)=>n+c.grazing,0)/cellCount,competitors=sampled.reduce((n,c)=>n+c.competitors,0),danger=sampled.reduce((n,c)=>n+c.danger,0);
    const crowd=Math.max(0,(members.length-cellCount*.7)/Math.max(3,cellCount*1.8)),competition=competitors/Math.max(3,cellCount*1.5),balance=clamp01(food*.80+reserve.ratio*.20+Math.min(.08,sampled.reduce((n,c)=>n+c.recovery,0)/cellCount*.05)-crowd*.12-competition*.14-grazing*.10);
    const status=this.statusFor(balance),speciesCounts={};for(const c of sampled)for(const id of c.competitorSpecies)speciesCounts[id]=(speciesCounts[id]||0)+1;
    const best=[...sampled].sort((a,b)=>b.score-a.score||a.key.localeCompare(b.key))[0]||null,worst=[...sampled].sort((a,b)=>a.score-b.score||a.key.localeCompare(b.key))[0]||null;
    const out={status,balance,food,reserve,competitors,competition,crowd,grazing,danger,cells:sampled,members:members.length,best,worst,competitorSpecies:speciesCounts};
    if(!force){this.cacheDay=this.sim.day;this.cacheTick=this.sim.tickCount;this.cacheMemberCount=members.length;this.cacheCellCount=footprint.length;this.cache=out}return out;
  }
  needsRelief(){const s=this.snapshot();return s.status.id==='strained'||s.status.id==='depleted'}
  reliefCells(){
    const occupied=this.sim.expansion?.occupiedCells?.()||[],known=new Set(occupied.map(c=>c.key)),size=this.sim.territory.cellSize,candidates=[...occupied];
    for(const cell of occupied)for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){
      if(!ox&&!oy)continue;const cx=cell.cx+ox,cy=cell.cy+oy,key=`${cx},${cy}`;if(known.has(key))continue;known.add(key);const x=(cx+.5)*size,y=(cy+.5)*size;if(x<2||y<2||x>CFG.worldSize-2||y>CFG.worldSize-2||this.sim.world.water[this.sim.world.idx(x,y)])continue;candidates.push({key,cx,cy,x,y,frontier:true});
    }
    return candidates.map(c=>this.sampleCell(c,{cache:false})).sort((a,b)=>(b.score-b.danger*.16)-(a.score-a.danger*.16)||a.key.localeCompare(b.key));
  }
  reliefTarget(animal){
    if(!animal?.alive||!this.needsRelief())return null;const cells=this.reliefCells().filter(c=>c.danger===0&&c.score>=.36);if(!cells.length)return null;
    const top=cells.slice(0,Math.min(8,cells.length)),chosen=top[Math.abs(animal.id*5)%top.length];return{x:chosen.x,y:chosen.y,cellKey:chosen.key,resourceRelief:true,frontier:!!chosen.frontier};
  }
}
