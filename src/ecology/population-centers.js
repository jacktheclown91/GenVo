import {canHunt} from '../ecology/functional-diet.js';
import {CFG} from '../sim/config.js';
import {SPECIES} from '../organisms/species.js';

const clamp01=v=>Math.max(0,Math.min(1,Number(v)||0));
const STATUS=[
  {id:'critical',label:'CRITICAL',min:0,tone:'danger',rank:0},
  {id:'contested',label:'CONTESTED',min:.28,tone:'warn',rank:1},
  {id:'viable',label:'VIABLE',min:.45,tone:'stable',rank:2},
  {id:'strong',label:'STRONG',min:.68,tone:'rich',rank:3}
];

// Local ecology for the persistent population centers created in G3. A center
// is not territory ownership or free carrying capacity. Its usefulness comes
// from the same plant biomass, grazing, competitors and predators as the rest
// of the simulation. Sustained pressure can redirect some autonomous relatives
// toward better nearby ground without deleting the physical center.
export class PopulationCenterEcologyController{
  constructor(sim){
    this.sim=sim;
    this.cacheSegment=-1;
    this.cache=new Map();
    this.history=new Map();
    this.notice=null;
  }
  statusFor(score){let out=STATUS[0];for(const s of STATUS)if(score>=s.min)out=s;return out}
  cellsAround(x,y){
    const size=this.sim.territory.cellSize,cx=Math.floor(x/size),cy=Math.floor(y/size),out=[];
    for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){
      const nx=cx+ox,ny=cy+oy,px=(nx+.5)*size,py=(ny+.5)*size;
      if(px<2||py<2||px>CFG.worldSize-2||py>CFG.worldSize-2)continue;
      if(this.sim.world.water[this.sim.world.idx(px,py)])continue;
      out.push({key:`${nx},${ny}`,cx:nx,cy:ny,x:px,y:py});
    }
    return out;
  }
  localAdults(x,y,radius){
    const out=[];this.sim.forEachNearby({x,y},radius,a=>{if(a.alive&&a.lineage&&a.species==='genvo'&&a.age>=SPECIES.genvo.maturity)out.push(a)});return out;
  }
  predatorCount(x,y,radius){let n=0;this.sim.forEachNearby({x,y},radius,a=>{if(a.alive&&canHunt(a))n++});return n}
  assignedAdults(center,taxonId=null){
    if(!center)return[];const kind=center.form||(center.kind==='range-band'?'forager':center.kind==='satellite-colony'?'colony':null);
    if(!kind)return[];return(this.sim.expansion?.adults?.()||[]).filter(a=>!a.player&&(!taxonId||this.sim.evolutionTree?.taxonFor?.(a)===taxonId)&&this.sim.generationProgress?.populationAssignment?.(a,kind)?.id===center.id);
  }
  siteAssessment(target,{center=null,force=false}={}){
    if(!target||!Number.isFinite(target.x)||!Number.isFinite(target.y))return null;
    const segment=Math.floor(this.sim.tickCount/Math.max(1,CFG.dayTicks/4)),key=center?`center:${center.id}`:`site:${Math.floor(target.x*2)/2},${Math.floor(target.y*2)/2}`;
    if(!force&&this.cacheSegment===segment&&this.cache.has(key))return this.cache.get(key);
    if(this.cacheSegment!==segment){this.cacheSegment=segment;this.cache.clear()}
    const cells=this.cellsAround(target.x,target.y),sampled=cells.map(c=>this.sim.sustainability?.sampleCell?.(c,{cache:!force})).filter(Boolean),count=Math.max(1,sampled.length);
    const food=sampled.reduce((n,c)=>n+c.foodIndex,0)/count,recovery=sampled.reduce((n,c)=>n+c.recovery,0)/count,grazing=sampled.reduce((n,c)=>n+c.grazing,0)/count,competitors=sampled.reduce((n,c)=>n+c.competitors,0);
    const radius=this.sim.territory.cellSize*1.55,predators=this.predatorCount(target.x,target.y,radius),localAdults=this.localAdults(target.x,target.y,radius),speciesOverlap=this.sim.speciesCoexistence?.competitionAt?.(target,{radius,center})||{ownerTaxonId:null,sameTaxon:localAdults.length,crossTaxon:0,pressure:0,byTaxon:[]},assigned=center?this.assignedAdults(center,speciesOverlap.ownerTaxonId):[];
    const lineageCompetitors=speciesOverlap.crossTaxon||0,competition=clamp01((competitors+lineageCompetitors*1.1)/Math.max(2,count*.48)),danger=clamp01(predators/2),sameAdults=speciesOverlap.ownerTaxonId?localAdults.filter(a=>this.sim.evolutionTree?.taxonFor?.(a)===speciesOverlap.ownerTaxonId):localAdults,load=center?Math.max(sameAdults.length,assigned.length):sameAdults.length;
    const capacity=Math.max(1,Math.min(8,Math.round(1+food*6+Math.min(.8,recovery*.6)-competition*2-danger*2.5)));
    const overload=clamp01((load-capacity)/Math.max(1,capacity));
    const score=clamp01(food*.62+(1-competition)*.14+(1-danger)*.12+Math.min(.08,recovery*.08)+.08-grazing*.10-overload*.24);
    const status=this.statusFor(score),drivers=[['food scarcity',1-food],['competitor pressure',competition],['predator pressure',danger],['overcrowding',overload]].sort((a,b)=>b[1]-a[1]),dominant=drivers[0];
    const best=[...sampled].sort((a,b)=>b.score-a.score||a.key.localeCompare(b.key))[0]||null,worst=[...sampled].sort((a,b)=>a.score-b.score||a.key.localeCompare(b.key))[0]||null;
    const result={x:target.x,y:target.y,centerId:center?.id||null,status,score,food,recovery,grazing,competitors,competition,lineageCompetitors,crossTaxa:speciesOverlap.byTaxon||[],ownerTaxonId:speciesOverlap.ownerTaxonId||null,ownerTaxonLabel:speciesOverlap.ownerLabel||null,predators,danger,load,capacity,overload,assigned:assigned.length,localAdults:localAdults.length,cells:sampled,best,worst,dominantPressure:lineageCompetitors>0&&speciesOverlap.pressure>=dominant[1]?'cross-taxon competition':dominant[0],pressureStrength:Math.max(dominant[1],speciesOverlap.pressure||0)};
    if(!force)this.cache.set(key,result);return result;
  }
  centerState(center,{force=false}={}){
    if(!center)return null;const current=this.siteAssessment(center,{center,force});if(!current)return null;const hist=this.history.get(center.id)||{strainDays:0,stableDays:0,lastStatus:null,lastDay:0};
    return{...current,strainDays:hist.strainDays,stableDays:hist.stableDays,lastStatus:hist.lastStatus};
  }
  snapshot({force=false}={}){
    const centers=this.sim.generationProgress?.centers?.()||[],states=centers.map(c=>({...c,...this.centerState(c,{force})}));
    const strong=states.filter(s=>s.status.id==='strong').length,viable=states.filter(s=>s.status.id==='viable').length,contested=states.filter(s=>s.status.id==='contested').length,critical=states.filter(s=>s.status.id==='critical').length;
    return{centers:states,strong,viable,contested,critical,total:states.length};
  }
  settlementCheck(target,{kind='population-center'}={}){
    const s=this.siteAssessment(target,{force:true});if(!s)return{ok:false,reason:'This site could not be evaluated.'};
    if(s.predators>0&&s.danger>=.5)return{ok:false,reason:'Predator pressure makes this site too dangerous for a durable second center.',assessment:s};
    if(s.score<.34)return{ok:false,reason:s.competition>.45?'Competing feeders make this site too strained for a durable second center.':'Local forage is too weak for a durable second center.',assessment:s};
    return{ok:true,kind,assessment:s};
  }
  reliefCell(state){
    if(!state?.cells?.length)return null;const base=state.score,best=[...state.cells].filter(c=>c.danger===0).sort((a,b)=>b.score-a.score||a.key.localeCompare(b.key))[0];
    if(!best||best.score<.38||best.score<base+.06)return null;return best;
  }
  anchorTarget(center,animal){
    if(!center||!animal)return center;const state=this.centerState(center),relief=this.reliefCell(state);if(!state)return center;
    const assigned=this.assignedAdults(center).sort((a,b)=>a.id-b.id),rank=assigned.findIndex(a=>a.id===animal.id);
    if(rank>=state.capacity&&relief)return{...center,x:relief.x,y:relief.y,populationRelief:true,ecologyStatus:state.status.id};
    if(state.status.id==='critical'&&relief&&animal.id%2===0)return{...center,x:relief.x,y:relief.y,populationRelief:true,ecologyStatus:state.status.id};
    if(state.status.id==='contested'&&relief&&animal.id%3===0)return{...center,x:relief.x,y:relief.y,populationRelief:true,ecologyStatus:state.status.id};
    return{...center,ecologyStatus:state.status.id};
  }
  advanceDay(){
    const centers=this.sim.generationProgress?.centers?.()||[];if(!centers.length)return;
    for(const center of centers){
      const state=this.centerState(center,{force:true});if(!state)continue;const prev=this.history.get(center.id)||{strainDays:0,stableDays:0,lastStatus:null,lastDay:0};
      let strain=prev.strainDays,stable=prev.stableDays;if(state.status.id==='critical')strain+=1;else if(state.status.id==='contested')strain+=.55;else strain=Math.max(0,strain-.75);
      if(state.status.rank>=2)stable+=1;else stable=0;
      if(prev.lastStatus&&state.status.rank<prev.lastStatus.rank&&state.status.rank<=1)this.notice={message:`${center.label} ${state.status.label.toLowerCase()} · ${state.dominantPressure} is reducing local carrying capacity.`,tone:state.status.id==='critical'?'danger':'warn'};
      else if(prev.lastStatus&&prev.lastStatus.rank<=1&&state.status.rank>=2)this.notice={message:`${center.label} recovered to ${state.status.label.toLowerCase()} carrying conditions.`,tone:'safe'};
      this.history.set(center.id,{strainDays:strain,stableDays:stable,lastStatus:state.status,lastDay:this.sim.day});
    }
    this.cache.clear();this.cacheSegment=-1;
  }
  consumeNotice(){const n=this.notice;this.notice=null;return n}
  summaryLine(){
    const s=this.snapshot();if(!s.total)return'';const stressed=s.contested+s.critical;
    return`Center ecology ${s.strong+s.viable} viable${stressed?` · ${stressed} pressured`:''}`;
  }
}
