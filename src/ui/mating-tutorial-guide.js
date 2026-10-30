import {TutorialControlCue} from './tutorial-control-cue.js';
import {courtshipObservation} from './courtship-observation.js';

// Presentation only. Eligibility, costs, consent and outcomes stay with the
// shared reproduction authority. This guide never selects or starts a mating.
export function matingTutorialState(sim,ui={}){
 const actor=sim.player(),reproduction=sim.reproduction;
 if(!actor?.alive)return{step:'unavailable',title:'Take care of your creature',text:'There is no living creature to guide.'};
 const busyId=actor.courtshipPerformance?.partnerId??
  (actor.intent==='mate'?actor.target?.id:null);
 const busy=sim.animals.find(a=>a.alive&&a.id===busyId);
 if(busy)return{step:'watch',mate:busy,title:'A little courtship',text:actor.courtshipPerformance?
  'Watch their response. Either creature may decline.':'Your creature is approaching. Watch what happens next.'};
 const trayMate=ui.courtOpen&&sim.animals.find(a=>a.alive&&a.id===ui.courtTargetId);
 if(trayMate){
  const status=reproduction.courtshipAvailability({targetId:trayMate.id});
  if(!status.enabled)return{step:'unavailable',title:'Not ready just now',text:status.reason+
   (sim.paused?'':' Choose Back Off to pick another partner.'),action:sim.paused?null:'back-off'};
 }
 const candidates=reproduction.eligibleMates().filter(a=>
  reproduction.courtshipAvailability({targetId:a.id}).enabled);
 // A resident chosen from the living world has no founding partner: the default
 // starter mate belongs to the world's generated founder, not to this animal.
 const starterId=sim.creatureStart?.kind==='existing-resident'?null:sim.starterMateId;
 const preferred=[ui.courtTargetId,ui.contextTargetId,starterId,reproduction.selectedMateId];
 const mate=preferred.map(id=>candidates.find(a=>a.id===id)).find(Boolean)||candidates[0];
 if(!mate){
  const radius=Math.max(12,24*(actor.genes?.senses??1));
  const nearby=sim.animals.filter(a=>a.alive&&a.id!==actor.id&&
   Math.hypot(a.x-actor.x,a.y-actor.y)<=radius).sort((a,b)=>
    Number(b.id===starterId)-Number(a.id===starterId)||
    Number(b.sex!==actor.sex)-Number(a.sex!==actor.sex)||
    Math.hypot(a.x-actor.x,a.y-actor.y)-Math.hypot(b.x-actor.x,b.y-actor.y)||a.id-b.id);
  const reason=nearby.length?reproduction.courtshipAvailability({targetId:nearby[0].id}).reason:null;
  return{step:'unavailable',title:'No ready partner nearby',text:sim.paused?'Resume the world to continue.':
   reason?'Nearby option: '+reason+' '+(/food|energy/i.test(reason)?'Eat and let the partner feed, or look for another partner.':/adulthood/i.test(reason)?'Wait for adulthood, or look for an adult partner.':/recover|unwell|health/i.test(reason)?'Allow recovery, or look for another partner.':'Look for another reachable, unrelated adult.'):
    'Explore a little farther. A Mate marker appears when a reachable partner is ready.'};
 }
 if(ui.courtOpen&&ui.courtTargetId===mate.id)return reproduction.ritualQueue.length?
  {step:'play',mate,action:'play',title:'Ready for a little hello?',text:'Click the glowing Play button to begin. Your creature pays the display cost.'}:
  {step:'approach',mate,action:'approach',title:'Choose your first move',text:'Click the glowing Approach button. It adds a simple hello to your sequence.'};
 if(ui.contextTargetId===mate.id)return{step:'court',mate,action:'court',title:'Say hello',text:'Click the glowing Court button to open their courtship controls.'};
 return{step:'mate',mate,title:'Meet a possible mate',text:'Click the creature marked Mate. We will take the next little step together.'};
}

export class MatingTutorialGuide extends TutorialControlCue{
 reset(){this.clear();this.actor=null;this.outcome=null;this.wasBusy=false;this.baseline=null}
 read(sim){
  const actor=sim.player();if(this.actor!==actor){this.reset();this.actor=actor;this.refusal=actor?.lastCourtshipRefusal;this.failure=actor?.lastCourtshipFailure}
  if(!actor?.alive){this.clear();return matingTutorialState(sim)}
  const query=selector=>this.query(selector);
  const tray=query('.courtship-tray')[0],court=query('[data-tutorial-action="court"]')[0];
  const ui={courtOpen:!!tray,courtTargetId:tray?Number(tray.dataset.targetId):null,
   contextTargetId:court?Number(court.dataset.targetId):null};
  const state=matingTutorialState(sim,ui);
  if(state.step==='watch'&&!this.wasBusy){this.baseline={refusal:this.refusal,failure:this.failure,lastMate:actor.lastMate};this.outcome=null;this.attemptedPartner=state.mate}
  if(actor.lastCourtshipRefusal!==this.refusal||actor.lastCourtshipFailure!==this.failure){
   const observed=courtshipObservation(sim,actor,this.attemptedPartner||state.mate,this.baseline||{refusal:this.refusal,failure:this.failure,lastMate:actor.lastMate});
   if(['declined','interrupted','accepted-no-conception'].includes(observed.kind))this.outcome=observed;
   this.refusal=actor.lastCourtshipRefusal;this.failure=actor.lastCourtshipFailure;
  }
  this.wasBusy=state.step==='watch';
  if(this.outcome)state.text=this.outcome.text+' '+state.text;
  let next=null;
  if(state.action){const candidates=query(`[data-tutorial-action="${state.action}"]`).filter(element=>
    !element.disabled&&element.getAttribute('aria-disabled')!=='true'&&
    (!state.mate||Number(element.dataset.targetId)===state.mate.id));
   // The wheel is nearest the clicked creature; the dock remains an accessible fallback.
   const element=candidates.find(e=>e.closest('.context-radial'))||candidates[0];
   next=element;
  }
  this.setCue(next,state.action);
  return state;
 }
}
