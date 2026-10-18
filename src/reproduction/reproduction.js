import {SPECIES} from '../organisms/species.js';
import {compareMateOptions,SAME_TAXON_AFFINITY} from './mate-preferences.js';
import {availableCourtshipMoves,courtshipCost,COURTSHIP_PERFORMANCE,activeCourtship,upcomingMoveAvailability,changeUpcomingMove} from './courtship-performance.js';
import {reproductiveMode} from './reproductive-anatomy.js';

export class ReproductionController{
  constructor(sim){
    this.sim=sim;
    this.selectedMateId=null;
    this.courtTargetId=null;
    this.ritualQueue=[];
  }
  eligibleMates({fromId=this.sim.playerId,radius=null}={}){
    const active=this.sim.animals.find(a=>a.id===fromId&&a.alive);
    if(!active)return[];
    const senseRadius=radius??Math.max(12,24*active.genes.senses);
    const out=[];
    this.sim.forEachNearby(active,senseRadius,b=>{
      if(b===active||!b.alive)return;
      if(!this.sim.canMatePair(active,b,{ready:true}))return;
      const distance=Math.hypot(b.x-active.x,b.y-active.y);
      if(distance<=senseRadius)out.push({animal:b,distance});
    });
    // Same-taxon search tendency, weighed with inherited preference (docs/HERITABLE_MATE_CHOICE.md).
    const tree=this.sim.evolutionTree,affinity=tree?.sameTaxon?b=>tree.sameTaxon(active,b)?SAME_TAXON_AFFINITY:0:null;
    return out.sort((a,b)=>compareMateOptions(active,a.animal,b.animal,this.sim.seed,senseRadius,{affinity})).map(x=>x.animal);
  }
  taxonRelation(a,b){const tree=this.sim.evolutionTree;if(!a||!b||!tree)return{same:true,kind:'same',from:'GenVo',to:'GenVo'};const from=tree.taxonLabel(a),to=tree.taxonLabel(b),same=tree.sameTaxon(a,b);return{same,kind:same?'same':'gene-flow',from,to,label:same?`same taxon · ${to}`:`gene flow · ${from} × ${to}`}}
  selectedMate(){
    return this.sim.animals.find(a=>a.id===this.selectedMateId&&a.alive)||null;
  }
  refreshSelection(){
    const candidates=this.eligibleMates();
    if(!candidates.length){this.selectedMateId=null;return null}
    if(!candidates.some(a=>a.id===this.selectedMateId))this.selectedMateId=candidates[0].id;
    return this.selectedMate();
  }
  cycleMate(delta=1){
    const candidates=this.eligibleMates();
    if(!candidates.length){this.selectedMateId=null;return null}
    let index=candidates.findIndex(a=>a.id===this.selectedMateId);
    if(index<0)index=0;else index=(index+delta+candidates.length)%candidates.length;
    this.selectedMateId=candidates[index].id;
    return candidates[index];
  }
  selectMate(id){
    const candidate=this.eligibleMates().find(a=>a.id===id)||null;
    this.selectedMateId=candidate?.id??null;
    return candidate;
  }
  queueRitualMove(move){
    const active=this.sim.player();
    if(this.sim.paused)return{ok:false,reason:'Resume the world first.'};
    if(active?.courtshipPerformance||(this.courtTargetId&&active?.intent==='mate'&&active.target?.id===this.courtTargetId))return{ok:false,reason:'Finish or back off from the current attempt first.'};
    if(!active||(move!=='approach'&&!availableCourtshipMoves(active).includes(move)))return {ok:false,reason:'This creature lacks a body part for '+move};
    if(this.ritualQueue.length>=3)return {ok:false,reason:'Ritual has reached three moves'};
    this.ritualQueue.push(move);return {ok:true,sequence:[...this.ritualQueue]};
  }
  liveMoveAvailability(move,options={}){return upcomingMoveAvailability(this.sim,this.sim.player(),move,options)}
  changeLiveMove(move,options={}){return changeUpcomingMove(this.sim,this.sim.player(),move,options)}
  undoRitualMove(){return this.ritualQueue.pop()||null}
  clearRitualQueue(){this.ritualQueue=[];}
  cycleBroodStrategy(){
    const mother=this.sim.player();
    if(!mother||reproductiveMode(mother)!=='dual')return {ok:false,reason:'Both egg and live-bearing organs are required.'};
    if(mother.sex!=='F')return {ok:false,reason:'The gestating parent chooses the brood route.'};
    if(mother.pregnant)return {ok:false,reason:'Current brood mode is already committed.'};
    const choices=['adaptive','live','egg'];
    mother.reproductiveStrategy=choices[(choices.indexOf(mother.reproductiveStrategy||'adaptive')+1)%choices.length];
    return {ok:true,strategy:mother.reproductiveStrategy};
  }
  approachAvailability(active,mate){
    const pair=this.sim.matePairAvailability(active,mate,{ready:true});if(!pair.enabled)return pair;
    if(!this.sim.canReach(active,mate.x,mate.y))return{enabled:false,reasonCode:'unreachable',reason:'Your body cannot reach this partner from here.'};
    return pair;
  }
  courtshipAvailability({targetId=this.selectedMateId}={}){
    const active=this.sim.player(),mate=this.sim.animals.find(a=>a.id===targetId&&a.alive);
    if(!active?.alive||!mate)return{enabled:false,reason:'The selected partner is no longer here.'};
    if(this.sim.paused)return{enabled:false,reason:'Resume the world first.'};
    const pair=this.approachAvailability(active,mate);if(!pair.enabled)return pair;
    if(active.courtshipPerformance||(this.courtTargetId===mate.id&&active.intent==='mate'&&active.target?.id===mate.id))return{enabled:false,reason:'An approach or performance is already underway.'};
    const allowed=availableCourtshipMoves(active),sequence=this.ritualQueue;
    if(sequence.length>3||sequence.some(m=>m!=='approach'&&!allowed.includes(m)))return{enabled:false,reason:'This body cannot perform the chosen sequence.'};
    if(active.infected||active.health<COURTSHIP_PERFORMANCE.minHealth)return{enabled:false,reason:'Too unwell to perform.'};
    const cost=courtshipCost(active,sequence.length?sequence:null);
    if(active.energy<cost)return{enabled:false,reason:'Not enough energy to perform.',cost};
    return{enabled:true,reason:'',cost};
  }
  courtSelected({targetId=this.selectedMateId}={}){
    if(!this.courtshipAvailability({targetId}).enabled)return false;
    const active=this.sim.player(),mate=this.sim.animals.find(a=>a.id===targetId&&a.alive);
    this.selectedMateId=mate.id;this.courtTargetId=mate.id;
    active.queuedCourtshipSequence=this.ritualQueue.length?[...this.ritualQueue]:null;
    this.ritualQueue=[];active.intent='mate';active.target=mate;return true;
  }
  cancelCourtship(){
    const active=this.sim.player(),id=this.courtTargetId;this.courtTargetId=null;this.ritualQueue=[];
    if(active){if(active.intent==='mate'&&active.target?.id===id){active.intent='idle';active.target=null}active.courtshipPerformance=null;active.queuedCourtshipSequence=null}
  }
  courtTarget(){
    const active=this.sim.player();
    // Manual decisions bypass the autonomous display validator. Use the same
    // validity/lifetime authority so a paid but interrupted display cannot
    // remain a permanent lock after movement, partner loss or save/restore.
    const display=active?.courtshipPerformance;
    if(display&&!activeCourtship(this.sim,active)){
      const partner=this.sim.animals.find(a=>a.id===display.partnerId)||{id:display.partnerId};
      this.sim.endBlockedCourtship(active,partner,{reason:'The courtship performance ended before pairing.',reasonCode:'performance-ended',stage:'performance'});
    }
    const mate=this.sim.animals.find(a=>a.id===this.courtTargetId)||null;
    if(this.courtTargetId==null)return null;
    if(!active){this.courtTargetId=null;return null}
    const status=this.approachAvailability(active,mate);
    if(!status.enabled){this.sim.endBlockedCourtship(active,mate,{...status,stage:'approach'});this.courtTargetId=null;return null}
    return mate;
  }
  endSelectedEncounter(a,b){
    const active=this.sim.player();if(!active)return false;
    const involved=a?.id===active.id&&b?.id===this.courtTargetId||b?.id===active.id&&a?.id===this.courtTargetId;
    if(involved)this.courtTargetId=null;return involved;
  }
  onMated(a,b){
    a.lastMatingTick=b.lastMatingTick=this.sim.tickCount;
    this.sim.evolutionEditor?.onMated?.(a,b);
    const active=this.sim.player();
    if(active&&(a.id===active.id||b.id===active.id)){
      this.courtTargetId=null;
      this.selectedMateId=null;
      this.refreshSelection();
    }
  }
  onActiveChanged(){
    this.selectedMateId=null;
    this.courtTargetId=null;
    this.ritualQueue=[];
    this.refreshSelection();
  }
}

export function traitMidpoint(a,b){
  const out={};
  for(const key of Object.keys(a.genes||{}))out[key]=((a.genes[key]??1)+(b.genes?.[key]??1))/2;
  return out;
}

export function geneticContrast(a,b){
  const keys=Object.keys(a?.genes||{});
  if(!keys.length||!b)return 0;
  return keys.reduce((sum,key)=>sum+Math.abs((a.genes[key]??1)-(b.genes?.[key]??1)),0)/keys.length;
}

export function maturityLabel(animal){
  const spec=SPECIES[animal.species];
  if(animal.age<spec.maturity)return 'juvenile';
  if(animal.age>spec.lifespan*.78)return 'elder';
  return 'adult';
}
