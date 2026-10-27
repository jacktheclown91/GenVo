import {CFG} from '../sim/config.js';
import {SPECIES} from '../organisms/species.js';
import {ROOT_TAXON_ID} from '../lineage/evolution-tree.js';

const clamp01=v=>Math.max(0,Math.min(1,Number(v)||0));
const TRAIT_PREF={
  'frugal-frame':'scarcity','range-sense':'competition','watch-crest':'predation','close-brood':'crowding',
  'dryland-skin':'dryness','splayfoot':'wetness','heat-shed-mantle':'heat','cold-mantle':'cold'
};

// Species-level coexistence authority. This layer does not create resources or
// invent territory ownership. It reads living taxonomy, real population centers,
// residence history, biomass and local animal overlap, then exposes the practical
// consequences of multiple related taxa sharing the same landscape.
export class SpeciesCoexistenceController{
  constructor(sim){this.sim=sim;this.cacheSegment=-1;this.cache=new Map();this.notice=null;this.lastDay=0}
  livingTaxa(){return this.sim.evolutionTree?.leadershipTaxa?.()||this.sim.evolutionTree?.livingTaxa?.()||[]}
  multipleTaxa(){return this.livingTaxa().length>1}
  node(taxonId){return this.sim.evolutionTree?.node?.(taxonId)||this.sim.evolutionTree?.root?.()||null}
  members(taxonId,{adultsOnly=false}={}){
    const maturity=SPECIES.genvo.maturity;
    return this.sim.animals.filter(a=>a.alive&&a.lineage&&a.species==='genvo'&&this.sim.evolutionTree?.taxonFor?.(a)===taxonId&&(!adultsOnly||a.age>=maturity));
  }
  originPopulation(taxonId){
    const node=this.node(taxonId),key=node?.originPopulationKey||'home';
    return this.sim.populationMemory?.populationByKey?.(key)||this.sim.populationMemory?.populations?.().find(p=>p.key==='home')||null;
  }
  taxonForPopulation(popKey){
    if(!popKey)return{id:ROOT_TAXON_ID,label:'GenVo8'};
    const living=this.livingTaxa().filter(n=>n.originPopulationKey===popKey).sort((a,b)=>(b.depth||0)-(a.depth||0)||a.formedDay-b.formedDay);
    const node=living[0]||this.sim.evolutionTree?.root?.();return{id:node?.id||ROOT_TAXON_ID,label:node?.label||'GenVo8'};
  }
  populationKeyForTarget(target,center=null){
    if(center?.id!=null)return`center:${center.id}`;
    const pops=this.sim.populationMemory?.populations?.()||[];let best=null,bestD=Infinity;
    for(const p of pops){const d=Math.hypot((target?.x??0)-p.x,(target?.y??0)-p.y);if(d<bestD){bestD=d;best=p}}
    return best&&bestD<=Math.max(3.2,(this.sim.territory?.cellSize||6)*.7)?best.key:null;
  }
  competitionAt(target,{radius=null,center=null,taxonId=null}={}){
    if(!target||!this.multipleTaxa())return{ownerTaxonId:taxonId||ROOT_TAXON_ID,ownerLabel:this.node(taxonId||ROOT_TAXON_ID)?.label||'GenVo8',sameTaxon:0,crossTaxon:0,pressure:0,byTaxon:[]};
    const popKey=this.populationKeyForTarget(target,center),owner=taxonId?{id:taxonId,label:this.node(taxonId)?.label||'GenVo8'}:this.taxonForPopulation(popKey),r=radius??Math.max(6,(this.sim.territory?.cellSize||6)*1.45),by=new Map();let same=0,cross=0;
    for(const a of this.sim.animals){if(!a.alive||!a.lineage||a.species!=='genvo'||Math.hypot(a.x-target.x,a.y-target.y)>r)continue;const id=this.sim.evolutionTree?.taxonFor?.(a)||ROOT_TAXON_ID,label=this.sim.evolutionTree?.taxonLabel?.(a)||'GenVo8';if(id===owner.id)same++;else{cross++;const row=by.get(id)||{id,label,count:0};row.count++;by.set(id,row)}}
    const pressure=clamp01(cross/Math.max(2,same+cross*.65));return{populationKey:popKey,ownerTaxonId:owner.id,ownerLabel:owner.label,sameTaxon:same,crossTaxon:cross,pressure,byTaxon:[...by.values()].sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label))};
  }
  habitatPreference(taxonId,target){
    const node=this.node(taxonId);if(!node)return{score:.5,label:'general habitat',pressure:null};
    const pop={x:target.x,y:target.y},hab=this.sim.populationMemory?.habitatAt?.(pop)||{moisture:.5,temperature:.58,waterEdge:0},pressure=node.pressure||TRAIT_PREF[node.traitId]||null;
    let score=.5,label='general habitat';
    if(pressure==='dryness'){score=clamp01((.58-hab.moisture)/.45);label='drier ground'}
    else if(pressure==='wetness'){score=clamp01(Math.max((hab.moisture-.38)/.48,hab.waterEdge));label='wet ground'}
    else if(pressure==='heat'){score=clamp01((hab.temperature-.48)/.34);label='warmer ground'}
    else if(pressure==='cold'){score=clamp01((.66-hab.temperature)/.38);label='cooler ground'}
    else if(pressure==='predation'){const d=this.sim.populationEcology?.predatorCount?.(target.x,target.y,8)||0;score=clamp01(1-d/2);label='low predator pressure'}
    else if(pressure==='crowding'){const c=this.competitionAt(target,{radius:6,taxonId});score=clamp01(.62+c.sameTaxon*.055-c.crossTaxon*.10);label='cohesive kin ground'}
    else if(pressure==='competition'||pressure==='scarcity'){const size=this.sim.territory.cellSize,cx=Math.floor(target.x/size),cy=Math.floor(target.y/size),sample=this.sim.sustainability?.sampleCell?.({key:`${cx},${cy}`,cx,cy,x:(cx+.5)*size,y:(cy+.5)*size},{cache:false}),cross=this.competitionAt(target,{radius:7,taxonId});score=clamp01((sample?.foodIndex??.45)*.68+(1-cross.pressure)*.32);label=pressure==='competition'?'low-competition forage':'rich forage'}
    const lifestyle=this.sim.speciesLifestyle?.habitatPreference?.(taxonId,target)||null;if(lifestyle){score=clamp01(score*.55+lifestyle.score*.45);label=pressure?`${label} + ${lifestyle.label}`:lifestyle.label}
    return{score,label,pressure,lifestyle:lifestyle?.label||null,moisture:hab.moisture,temperature:hab.temperature,waterEdge:hab.waterEdge};
  }
  candidateCells(taxonId,pop){
    if(!pop)return[];const size=this.sim.territory.cellSize,cx=Math.floor(pop.x/size),cy=Math.floor(pop.y/size),out=[];
    for(let oy=-2;oy<=2;oy++)for(let ox=-2;ox<=2;ox++){
      const nx=cx+ox,ny=cy+oy,x=(nx+.5)*size,y=(ny+.5)*size;if(x<2||y<2||x>CFG.worldSize-2||y>CFG.worldSize-2||this.sim.world.water[this.sim.world.idx(x,y)])continue;
      const cell=this.sim.sustainability?.sampleCell?.({key:`${nx},${ny}`,cx:nx,cy:ny,x,y},{cache:false});if(!cell)continue;const cross=this.competitionAt({x,y},{radius:7,taxonId}),pref=this.habitatPreference(taxonId,{x,y}),score=clamp01(cell.score*.58+(1-cross.pressure)*.22+pref.score*.20-cell.danger*.08);out.push({x,y,key:cell.key,score,food:cell.foodIndex,danger:cell.danger,crossPressure:cross.pressure,crossTaxon:cross.crossTaxon,preference:pref});
    }
    return out.sort((a,b)=>b.score-a.score||b.food-a.food||a.key.localeCompare(b.key));
  }
  preferredSite(taxonId,pop){return this.candidateCells(taxonId,pop)[0]||null}
  settlementPreference(taxonId,target){
    const size=this.sim.territory.cellSize,cx=Math.floor(target.x/size),cy=Math.floor(target.y/size),cell=this.sim.sustainability?.sampleCell?.({key:`${cx},${cy}`,cx,cy,x:(cx+.5)*size,y:(cy+.5)*size},{cache:false})||null,cross=this.competitionAt(target,{radius:7,taxonId}),pref=this.habitatPreference(taxonId,target);const score=clamp01((cell?.score??.4)*.58+(1-cross.pressure)*.22+pref.score*.20-(cell?.danger||0)*.08);return{score,cell,cross,preference:pref,label:pref.label};
  }
  snapshotForTaxon(taxonId,{force=false}={}){
    const segment=Math.floor(this.sim.tickCount/Math.max(1,CFG.dayTicks/4)),key=`${segment}:${taxonId}`;if(!force&&this.cacheSegment===segment&&this.cache.has(key))return this.cache.get(key);if(this.cacheSegment!==segment){this.cacheSegment=segment;this.cache.clear()}
    const node=this.node(taxonId),pop=this.originPopulation(taxonId),size=this.sim.territory?.cellSize||6,members=this.members(taxonId),adults=this.members(taxonId,{adultsOnly:true}),affinity=a=>this.sim.populationMemory?.affinityFor?.(a)?.key||'home',residents=members.filter(a=>affinity(a)===(pop?.key||'home')),otherResidents=this.sim.animals.filter(a=>a.alive&&a.lineage&&a.species==='genvo'&&this.sim.evolutionTree?.taxonFor?.(a)!==taxonId&&affinity(a)===(pop?.key||'home'));
    const center=pop&&!pop.primary?pop:null,eco=pop?(center?this.sim.populationEcology?.centerState?.(center,{force}):this.sim.populationEcology?.siteAssessment?.(pop,{force})):null,cross=pop?this.competitionAt(pop,{center,taxonId,radius:Math.max(7,(this.sim.territory?.cellSize||6)*1.5)}):{pressure:0,crossTaxon:0,byTaxon:[]},preferred=pop?this.preferredSite(taxonId,pop):null;
    const residentShare=members.length?residents.length/members.length:0;let priority='hold',priorityLabel='Hold the branch range',body='Local conditions are stable enough for this taxon to remain autonomous.',urgency=0,target=pop?{x:pop.x,y:pop.y,label:pop.label}:null;
    if(cross.pressure>=.30){priority='separate';priorityLabel=`Separate ${node?.label||'taxon'} feeding range`;body=`${cross.crossTaxon} other-taxon resident${cross.crossTaxon===1?' is':'s are'} overlapping this branch's origin range. Taxon-scoped Forage or Scout orders can reduce direct competition and gene flow.`;urgency=clamp01(.45+cross.pressure*.5);target=preferred?{x:preferred.x,y:preferred.y,label:`preferred ${preferred.preference.label}`} : target}
    else if(eco&&eco.status?.rank<=1){priority='relief';priorityLabel=`Relieve ${node?.label||'taxon'} carrying pressure`;body=`${pop?.label||'This range'} is ${eco.status.label.toLowerCase()} with carrying ${eco.load}/${eco.capacity}. Move part of this taxon toward stronger nearby ground.`;urgency=clamp01(.4+(1-eco.score)*.45);target=preferred?{x:preferred.x,y:preferred.y,label:`stronger ${preferred.preference.label}`} : target}
    else if(adults.length>=3&&residentShare<.42){priority='consolidate';priorityLabel=`Rebuild ${node?.label||'taxon'} population center`;body=`Only ${residents.length}/${members.length} living members still spend most of their time around ${pop?.label||'the branch origin'}. Taxon-scoped Gather or Home guidance can restore a viable resident cohort.`;urgency=.42;target=pop?{x:pop.x,y:pop.y,label:pop.label}:target}
    else if(preferred&&pop&&Math.hypot(preferred.x-pop.x,preferred.y-pop.y)>=size*1.2&&preferred.score>.62){priority='expand';priorityLabel=`Open ${node?.label||'taxon'} habitat`;body=`Nearby ${preferred.preference.label} is currently stronger than the branch origin. A taxon-scoped Scout order can test expansion without moving the whole lineage.`;urgency=.28;target={x:preferred.x,y:preferred.y,label:`preferred ${preferred.preference.label}`}}
    const out={taxonId,label:node?.label||'GenVo8',node,population:pop,members:members.length,adults:adults.length,residents:residents.length,residentShare,otherResidents:otherResidents.length,cross,ecology:eco,preferred,priority,priorityLabel,body,urgency,target};if(!force)this.cache.set(key,out);return out;
  }
  snapshot({force=false}={}){return this.livingTaxa().map(t=>this.snapshotForTaxon(t.id,{force})).sort((a,b)=>b.urgency-a.urgency||a.label.localeCompare(b.label))}
  goalFor(animal=this.sim.player?.()){
    if(!animal||!this.multipleTaxa())return null;const taxonId=this.sim.evolutionTree?.taxonFor?.(animal)||ROOT_TAXON_ID,s=this.snapshotForTaxon(taxonId);if(!s||s.urgency<.25)return null;return{taxonId,label:s.label,title:s.priorityLabel,body:s.body,target:s.target,priority:s.priority,urgency:s.urgency};
  }
  autonomousDecision(animal){
    if(!animal?.alive||this.sim.isManualPlayer?.(animal)||!animal.lineage||animal.species!=='genvo'||animal.age<SPECIES.genvo.maturity||!this.multipleTaxa())return null;
    const taxonId=this.sim.evolutionTree?.taxonFor?.(animal)||ROOT_TAXON_ID,s=this.snapshotForTaxon(taxonId);if(!s||!s.target||!['separate','relief','expand'].includes(s.priority))return null;const affinity=this.sim.populationMemory?.affinityFor?.(animal);if(affinity&&s.population&&affinity.key!==s.population.key)return null;
    const stride=s.priority==='separate'?2:3;if(animal.id%stride!==0)return null;const angle=(animal.id%8)*(Math.PI/4),r=1+(animal.id%3)*.45,target={x:s.target.x+Math.cos(angle)*r,y:s.target.y+Math.sin(angle)*r,speciesPriority:true,taxonId};return{intent:`species-${s.priority}`,target};
  }
  onSettlementBuilt(shelter,project){
    if(!shelter||project?.scope!=='taxon'||!project.taxonId)return null;const label=project.taxonLabel||this.node(project.taxonId)?.label||'Species';const center=this.sim.generationProgress?.addPopulationCenter?.({kind:'species-settlement',x:shelter.x,y:shelter.y,label:`${label} Settlement`,form:null,generation:this.sim.lineage?.highestGeneration||1,animalId:project.ownerId,shelterId:shelter.id,taxonId:project.taxonId,taxonLabel:label})||null;if(center){this.notice={message:`${label} established a taxon settlement · local ecology and residents now shape this branch independently.`,tone:'success'};this.cache.clear();this.cacheSegment=-1}return center;
  }
  advanceDay(){if(this.lastDay===this.sim.day)return;this.lastDay=this.sim.day;if(!this.multipleTaxa())return;for(const s of this.snapshot({force:true})){if(s.urgency>=.78){this.notice={message:`${s.label} range under pressure · ${s.priorityLabel.toLowerCase()}.`,tone:'warn'};break}}}
  consumeNotice(){const n=this.notice;this.notice=null;return n}
  lines(){return this.snapshot().map(s=>`${s.label} · ${s.population?.label||'no origin'} · residents ${s.residents}/${s.members} · cross-taxon ${s.cross.crossTaxon} · ${s.priorityLabel}`)}
  summaryLine(){const rows=this.snapshot();if(rows.length<2)return'Species coexistence ONE TAXON';const shared=rows.filter(r=>r.cross.crossTaxon>0).length,pressured=rows.filter(r=>r.urgency>=.4).length;return`Species coexistence ${rows.length} living taxa · ${shared} overlapping origin range${shared===1?'':'s'}${pressured?` · ${pressured} branch goal${pressured===1?'':'s'} active`:''}`}
}
