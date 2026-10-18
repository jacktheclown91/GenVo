import {SPECIES} from '../organisms/species.js';
import {CFG} from '../sim/config.js';
import {compareGenes} from './adaptation.js';
import {formReading,protoReading} from './readings.js';
import {serializePlan} from './body-plan.js';

export class LineageTracker{
  constructor(sim){
    this.sim=sim;
    this.records=new Map();
    this.founderId=null;
    this.activeId=null;
    this.selectedHeirId=null;
    this.highestGeneration=0;
    this.established=false;
    this.establishedTick=null;
    this.handoffs=[];
    this.establishmentAnnounced=false;
    this.succession=null;
  }
  establishFounder(animal){
    animal.lineage=true;
    this.founderId=animal.id;
    this.activeId=animal.id;
    this.register(animal,[]);
    this.refreshSelection();
  }
  register(animal,parents=animal.parentIds||[]){
    if(!animal.lineage)return null;
    const existing=this.records.get(animal.id);
    if(existing)return existing;
    const record={
      id:animal.id,
      generation:animal.generation,
      sex:animal.sex,
      parentIds:[...parents],
      children:[],
      bornDay:this.sim.day,
      bornYear:this.sim.year,
      diedDay:null,
      diedYear:null,
      cause:null,
      alive:true,
      genes:{...animal.genes},
      pigmentGenome:animal.pigmentGenome?structuredClone(animal.pigmentGenome):null,
      reproductiveGenome:animal.reproductiveGenome?structuredClone(animal.reproductiveGenome):null,
      matePreferences:animal.matePreferences?structuredClone(animal.matePreferences):null,
      adaptations:[...(animal.adaptations||[])],
      divergence:formReading(animal),
      protoTrait:protoReading(animal),
      speciesBranch:animal.speciesBranch?{...animal.speciesBranch}:null,
      bodyPlanParts:animal.bodyPlan?[...new Set(animal.bodyPlan.nodes.map(n=>n.partId))]:null,
      // v1.57.0: the body itself, so portraits (handoff, journal) show the real creature.
      bodyPlan:animal.bodyPlan?serializePlan(animal.bodyPlan):null,
      ...(animal.bodyVariation?{bodyVariation:structuredClone(animal.bodyVariation)}:{}),
      ...(animal.bodyInheritance?{bodyInheritance:structuredClone(animal.bodyInheritance)}:{}),
      speciesBranchHistory:(animal.speciesBranchHistory||[]).map(v=>({...v})),
      strategy:null
    };
    this.records.set(animal.id,record);
    for(const pid of record.parentIds){const parent=this.records.get(pid);if(parent&&!parent.children.includes(animal.id))parent.children.push(animal.id)}
    this.highestGeneration=Math.max(this.highestGeneration,animal.generation);
    return record;
  }
  registerBirth(child,parents,conceptionParents=parents){
    child.lineage=parents.some(p=>p?.lineage);
    this.sim.divergence?.onBirth?.(child,conceptionParents);this.sim.protoSpeciation?.onBirth?.(child,conceptionParents);
    if(child.lineage){this.sim.speciation?.noteBirth?.(child,parents);const record=this.register(child,parents.map(p=>p.id));
      // Birth-time evidence from actual gestational parent snapshots (not their own
      // historical birth records). Never alters the live recombination pipeline.
      if(record){record.parentBodyPlans=(conceptionParents||[]).map(p=>p?.bodyPlan?serializePlan(p.bodyPlan):null);record.parentPhenotypes=(conceptionParents||[]).map(p=>p?{id:p.id,genes:{...p.genes},pigmentGenome:p.pigmentGenome?structuredClone(p.pigmentGenome):null,adaptations:[...(p.adaptations||[])],anatomy:{...(p.anatomy||{})},ecoLifestyle:p.ecoLifestyle?structuredClone(p.ecoLifestyle):null}:null);}}
    this.refreshSelection();
  }
  registerDeath(animal,cause){
    const record=this.records.get(animal.id);
    if(record){record.alive=false;record.diedDay=this.sim.day;record.diedYear=this.sim.year;record.cause=cause;record.habits=animal.habits?{...animal.habits}:null}
    if(animal.id===this.selectedHeirId)this.refreshSelection();
  }
  isDescendant(candidateId,ancestorId){
    if(candidateId===ancestorId)return false;
    const seen=new Set();
    const stack=[candidateId];
    while(stack.length){
      const id=stack.pop();
      if(seen.has(id))continue;
      seen.add(id);
      const rec=this.records.get(id);
      if(!rec)continue;
      for(const pid of rec.parentIds){if(pid===ancestorId)return true;if(this.records.has(pid))stack.push(pid)}
    }
    return false;
  }
  eligibleHeirs({matureOnly=true,fromId=this.activeId}={}){
    const current=this.sim.animals.find(a=>a.id===fromId);
    if(!current)return[];
    const tree=this.sim.evolutionTree,fromTaxon=tree?.taxonFor?.(current)||null;
    return this.sim.animals.filter(a=>{
      if(!a.alive||!a.lineage||a.id===fromId||!this.isDescendant(a.id,fromId))return false;
      if(!matureOnly)return true;
      return a.age>=SPECIES[a.species].maturity;
    }).sort((a,b)=>{const at=fromTaxon&&tree?.taxonFor?.(a)===fromTaxon?0:1,bt=fromTaxon&&tree?.taxonFor?.(b)===fromTaxon?0:1;return at-bt||a.generation-b.generation||b.age-a.age||a.id-b.id});
  }
  refreshSelection(){
    const heirs=this.eligibleHeirs();
    if(!heirs.length){this.selectedHeirId=null;return null}
    if(!heirs.some(a=>a.id===this.selectedHeirId))this.selectedHeirId=heirs[0].id;
    return this.selectedHeir();
  }
  selectedHeir(){return this.sim.animals.find(a=>a.id===this.selectedHeirId&&a.alive)||null}
  cycleHeir(delta=1){
    const heirs=this.eligibleHeirs();
    if(!heirs.length){this.selectedHeirId=null;return null}
    let index=heirs.findIndex(a=>a.id===this.selectedHeirId);
    if(index<0)index=0;else index=(index+delta+heirs.length)%heirs.length;
    this.selectedHeirId=heirs[index].id;
    return heirs[index];
  }

  readinessFor(animal){
    const practice=this.sim.family?.practiceProfile?.(animal)||null,learning=practice?.learning||this.sim.family?.learningProfile?.(animal)||null;
    const fieldReady=!!practice?.ready,routes=practice?.completed||0,lessons=learning?.mastered||0,independence=learning?.independence||0;
    const label=fieldReady?'field-ready':routes?`${routes}/2 solo routes`:(lessons>=4?'unpracticed':'still learning');
    return{fieldReady,routes,lessons,independence,label};
  }
  successionResource(animal){
    const memory=animal?.learningMemory||{},spec=SPECIES[animal?.species];if(!animal||!spec)return null;
    const options=[];
    if(memory.water&&this.sim.family?.lessonFresh?.(memory.water,24)&&this.sim.world.isDrinkable(memory.water.x,memory.water.y))options.push({type:'water',x:memory.water.x,y:memory.water.y,label:'remembered water'});
    if(memory.food?.kind&&this.sim.family?.lessonFresh?.(memory.food,24)){const arr=memory.food.kind==='carrion'?this.sim.world.carrion:this.sim.world.plants[memory.food.kind],i=this.sim.world.idx(memory.food.x,memory.food.y);if(arr&&(arr[i]||0)>.04)options.push({type:'food',x:memory.food.x,y:memory.food.y,kind:memory.food.kind,label:'remembered food'});}
    if(!options.length)return null;
    const e=animal.energy/spec.maxEnergy,h=animal.hydration/spec.maxHydration;
    options.sort((a,b)=>((a.type==='water'?h:e)-(b.type==='water'?h:e))||(a.type==='water'?-1:1));
    return options[0];
  }
  beginSuccession(from,to,handoff){
    const preparedness=this.readinessFor(to);handoff.preparedness=preparedness;
    if(!this.sim.playerEnabled){this.succession=null;return null}
    const practiceHome=this.sim.family?.practiceHome?.(to)||null,resource=this.successionResource(to);
    const home=practiceHome?{x:practiceHome.x,y:practiceHome.y,kind:practiceHome.kind||'home',label:practiceHome.kind==='shelter'?'family shelter':'family anchor'}:null;
    const atHome=home?Math.hypot(to.x-home.x,to.y-home.y)<=1.7:false;
    let stage=null,target=null;
    if(preparedness.fieldReady&&resource){stage='resource';target=resource}
    else if(home&&!atHome){stage='home';target=home}
    else if(resource&&!preparedness.fieldReady){stage='resource';target=resource}
    if(!stage){this.succession=null;return null}
    this.succession={fromId:from?.id??null,toId:to.id,handoffIndex:this.handoffs.length-1,reason:handoff.reason,startedTick:this.sim.tickCount,startedDay:this.sim.day,stage,target,preparedness,homeReached:atHome,resourceConfirmed:false,lastActionTick:-1,completed:false};
    this.sim.cognition?.record?.(to,'succession-start',preparedness.fieldReady?'Took control field-ready':'Took control still finding footing',{fromId:from?.id??null,fieldReady:preparedness.fieldReady,routes:preparedness.routes});
    return this.succession;
  }
  updateSuccession(){
    const s=this.succession,p=this.sim.player();if(!s||!p||p.id!==s.toId)return null;
    if(s.stage==='home'&&s.target&&Math.hypot(p.x-s.target.x,p.y-s.target.y)<=1.7){s.homeReached=true;this.completeSuccession('reconnected with family home');return this.succession}
    const action=this.sim.lastPlayerAction;if(s.stage==='resource'&&action&&action.tick!==s.lastActionTick){s.lastActionTick=action.tick;const t=s.target,d=t?Math.hypot(p.x-t.x,p.y-t.y):Infinity;const actionMatch=t?.type==='water'?action.type==='drink':t?.type==='food'?action.type==='eat':false;const match=actionMatch&&d<=2.25&&(t.type!=='food'||!t.kind||action.kind===t.kind);if(match){s.resourceConfirmed=true;this.completeSuccession(`confirmed ${t.label||t.type}`);return this.succession}}
    if(this.sim.tickCount-s.startedTick>CFG.dayTicks*3)this.completeSuccession('settled into the generation');
    return this.succession;
  }
  completeSuccession(text='settled into the generation'){
    const s=this.succession,p=this.sim.player();if(!s||s.completed)return false;s.completed=true;s.completedTick=this.sim.tickCount;s.result=text;
    const handoff=this.handoffs[s.handoffIndex];if(handoff)handoff.succession={fieldReady:!!s.preparedness?.fieldReady,stage:s.stage,result:text,completed:true};
    if(p?.id===s.toId)this.sim.cognition?.record?.(p,'succession-ready',`Generation ${p.generation} found its footing · ${text}`,{fromId:s.fromId,fieldReady:!!s.preparedness?.fieldReady});
    return true;
  }
  successionStatus(){const s=this.succession,p=this.sim.player();if(!s||s.completed||!p||p.id!==s.toId)return null;return s}
  handoffSelected(){const heir=this.selectedHeir();return heir?this.handoffTo(heir.id,{manual:true}):false}
  handoffTo(id,{manual=false,reason='handoff'}={}){
    const current=this.sim.animals.find(a=>a.id===this.activeId&&a.alive&&a.lineage)||null;
    const next=this.sim.animals.find(a=>a.id===id&&a.alive&&a.lineage);
    if(!next||!current||next.id===current.id)return false;
    if(!this.isDescendant(next.id,current.id))return false;
    if(manual&&next.age<SPECIES[next.species].maturity)return false;
    const controlled=this.sim.player();if(controlled)controlled.player=false;current.player=false;
    next.player=true;
    this.sim.playerId=next.id;
    this.activeId=next.id;
    const newlyEstablished=next.generation>=8&&!this.established;
    const founder=this.records.get(this.founderId),tree=this.sim.evolutionTree,fromTaxon={id:tree?.taxonFor?.(current)||null,label:tree?.taxonLabel?.(current)||'GenVo'},toTaxon={id:tree?.taxonFor?.(next)||null,label:tree?.taxonLabel?.(next)||'GenVo'};
    const handoff={from:current.id,to:next.id,generation:next.generation,day:this.sim.day,year:this.sim.year,reason,changes:compareGenes(next.genes,current.genes,{limit:3}),founderChanges:founder?compareGenes(next.genes,founder.genes,{limit:3}):[],newlyEstablished,fromTaxon,toTaxon,crossTaxon:!!fromTaxon.id&&!!toTaxon.id&&fromTaxon.id!==toTaxon.id};this.handoffs.push(handoff);
    if(newlyEstablished){this.established=true;this.establishedTick=this.sim.tickCount}
    this.selectedHeirId=null;
    this.refreshSelection();
    this.sim.reproduction?.onActiveChanged();
    if(handoff.crossTaxon)this.sim.familyDirectives?.setScope?.('taxon');
    this.sim.cognition?.onHandoff(current,next,reason);
    this.sim.evolution?.onHandoff(current,next,handoff);
    this.sim.generationProgress?.onHandoff?.(current,next,handoff);handoff.mutationBudget=this.sim.evolutionBudget?{budget:this.sim.evolutionBudget.budget(),bonus:this.sim.evolutionBudget.earnedBonus()}:null;
    this.beginSuccession(current,next,handoff);
    return true;
  }
  handleActiveDeath(dead){
    const descendants=this.eligibleHeirs({matureOnly:false,fromId:dead.id});
    let heir=descendants.find(a=>a.age>=SPECIES[a.species].maturity)||descendants[0]||null;
    if(!heir){
      // If the active branch has ended, allow another living member of the founder lineage to keep the run alive.
      const living=this.sim.animals.filter(a=>a.alive&&a.lineage&&a.id!==dead.id).sort((a,b)=>b.generation-a.generation||b.age-a.age||a.id-b.id);
      heir=living.find(a=>a.age>=SPECIES[a.species].maturity)||living[0]||null;
    }
    for(const animal of this.sim.animals)if(animal.player)animal.player=false;
    dead.player=false;
    if(!heir){this.sim.playerId=null;this.activeId=null;this.selectedHeirId=null;return false}
    heir.player=true;
    this.sim.playerId=heir.id;
    this.activeId=heir.id;
    const newlyEstablished=heir.generation>=8&&!this.established;
    const founder=this.records.get(this.founderId),tree=this.sim.evolutionTree,fromTaxon={id:tree?.taxonFor?.(dead)||null,label:tree?.taxonLabel?.(dead)||'GenVo'},toTaxon={id:tree?.taxonFor?.(heir)||null,label:tree?.taxonLabel?.(heir)||'GenVo'};
    const handoff={from:dead.id,to:heir.id,generation:heir.generation,day:this.sim.day,year:this.sim.year,reason:'death',changes:compareGenes(heir.genes,dead.genes,{limit:3}),founderChanges:founder?compareGenes(heir.genes,founder.genes,{limit:3}):[],newlyEstablished,fromTaxon,toTaxon,crossTaxon:!!fromTaxon.id&&!!toTaxon.id&&fromTaxon.id!==toTaxon.id};this.handoffs.push(handoff);
    if(newlyEstablished){this.established=true;this.establishedTick=this.sim.tickCount}
    this.selectedHeirId=null;
    this.refreshSelection();
    this.sim.reproduction?.onActiveChanged();
    if(handoff.crossTaxon)this.sim.familyDirectives?.setScope?.('taxon');
    this.sim.cognition?.onHandoff(dead,heir,'death');
    this.sim.evolution?.onHandoff(dead,heir,handoff);
    this.sim.generationProgress?.onHandoff?.(dead,heir,handoff);handoff.mutationBudget=this.sim.evolutionBudget?{budget:this.sim.evolutionBudget.budget(),bonus:this.sim.evolutionBudget.earnedBonus()}:null;
    this.beginSuccession(dead,heir,handoff);
    return true;
  }
  lastHandoff(){return this.handoffs.at(-1)||null}
  ancestryPath(id=this.activeId){
    const path=[];let current=id;const seen=new Set();
    while(current&&this.records.has(current)&&!seen.has(current)){
      seen.add(current);const rec=this.records.get(current);path.push(rec);
      const lineageParents=rec.parentIds.map(pid=>this.records.get(pid)).filter(Boolean).sort((a,b)=>b.generation-a.generation||a.id-b.id);
      current=lineageParents[0]?.id??null;
    }
    return path.reverse();
  }
  childrenOf(id){const rec=this.records.get(id);return(rec?.children||[]).map(cid=>this.records.get(cid)).filter(Boolean)}
  livingCount(){let n=0;for(const rec of this.records.values())if(rec.alive)n++;return n}
}
