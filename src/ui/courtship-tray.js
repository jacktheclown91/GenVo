import {creatureIdentity} from './creature-identity.js';
import {courtshipObservation} from './courtship-observation.js';
import {appendActionSymbol} from './action-symbols.js';
import {interactionDock} from './interaction-dock.js';
import {courtshipView} from './courtship-view.js';
import {drawLineagePortrait,lineagePortraitBounds} from '../render/lineage-portrait.js';
import {nativeArtRevision} from '../render/runtime-part-art.js';
import {drawPartAlone} from '../render/part-sprites.js';
import {phenotypeFor} from '../organisms/species.js';
import {creaturePalette} from '../render/creature-palette.js';
import {PARTS} from '../lineage/part-registry.js';
export class CourtshipTray{
 constructor({getSim,blocked,onManual,onFeedback,onObserve,onDetails}){
  Object.assign(this,{getSim,blocked,onManual,onFeedback,onObserve,onDetails});this.isOpen=false;
  this.el=document.createElement('section');this.el.className='courtship-tray';this.el.hidden=true;this.el.setAttribute('aria-label','Courtship encounter');interactionDock().body.append(this.el);
  this.title=document.createElement('strong');this.portraits=document.createElement('div');this.portraits.className='courtship-portraits';this.cards=document.createElement('div');this.cards.className='courtship-cards';this.sequence=document.createElement('ol');this.sequence.className='courtship-sequence';this.status=document.createElement('p');this.status.setAttribute('role','status');this.reaction=document.createElement('p');this.reaction.className='courtship-reaction';this.reaction.setAttribute('role','status');this.tools=document.createElement('div');this.tools.className='courtship-tools';this.el.append(this.title,this.portraits,this.cards,this.sequence,this.status,this.reaction,this.tools);
 }
 show(targetId){const sim=this.getSim(),mate=sim.reproduction.selectMate(targetId);if(!mate)return false;
  this.world=sim;this.actor=sim.player();this.targetId=targetId;this.refusal=this.actor.lastCourtshipRefusal;this.failure=this.actor.lastCourtshipFailure;this.lastMate=this.actor.lastMate;this.isOpen=true;this.futureSlot=null;this.sawBusy=false;this.baseline={refusal:this.refusal,failure:this.failure,lastMate:this.lastMate,distance:Math.hypot(this.actor.x-mate.x,this.actor.y-mate.y),targetX:mate.x,targetY:mate.y};this.signature=null;this.lastUpdate=0;this.update();return true;
 }
 close(){this.isOpen=false;this.el.hidden=true}
 valid(){return this.isOpen&&this.world===this.getSim()&&this.actor===this.getSim().player()&&!this.blocked()}
 feedback(result){this.onFeedback?.(result);this.signature=null;this.update()}
 queue(move){if(!this.valid())return false;const sim=this.getSim(),r=sim.player().courtshipPerformance?sim.reproduction.changeLiveMove(move,{index:this.futureSlot??undefined}):sim.reproduction.queueRitualMove(move);if(r.ok)this.futureSlot=null;this.feedback(r);return r.ok}
 play(){if(!this.valid())return false;const sim=this.getSim();if(!sim.reproduction.ritualQueue.length){this.feedback({ok:false,reason:'Choose Approach or a display first.'});return false}
  this.onManual?.();const status=sim.reproduction.courtshipAvailability({targetId:this.targetId}),ok=status.enabled&&sim.reproduction.courtSelected({targetId:this.targetId});this.feedback({ok:!!ok,reason:status.reason||'The selected partner is no longer available.'});return !!ok;
 }
 update(){if(!this.isOpen)return;if(!this.valid()){this.close();return}const now=performance.now();if(this.signature&&now-(this.lastUpdate||0)<100)return;this.lastUpdate=now;
  const sim=this.getSim(),v=courtshipView(sim,this.targetId);if(!v.target){this.close();return}if(v.busy)this.sawBusy=true;else if(this.sawBusy){const outcome=courtshipObservation(sim,v.actor,v.target,this.baseline);this.onFeedback?.({ok:outcome.kind==='accepted',message:outcome.kind==='nearby'||outcome.kind==='facing'?'Courtship ended.':outcome.text});this.close();return}
  const refusal=v.actor.lastCourtshipRefusal,failed=v.actor.lastCourtshipFailure;
  const reaction=courtshipObservation(sim,v.actor,v.target,this.baseline).text;if(this.reaction.textContent!==reaction)this.reaction.textContent=reaction;
  let status=v.active?'Performing '+v.move+(this.futureSlot!==null?' · choose replacement':' · add a next display')+' · spent '+v.active.energySpent.toFixed(2)+' energy':v.busy?'Approaching the selected partner':v.availability.reason||'Choose moves · '+v.cost.toFixed(2)+' energy. Partner may decline.';
  if(refusal!==this.refusal&&refusal?.otherId===v.target.id)status='That attempt was declined.';
  if(v.actor.lastMate===v.target.id&&v.actor.lastMate!==this.lastMate)status='A mating occurred. Offspring and pregnancy follow the existing biology.';
  if(failed!==this.failure&&failed?.partnerId===v.target.id)status=failed.reason;if(this.reaction.hidden!==!!v.active)this.reaction.hidden=!!v.active;const statusText=v.active?'Performing '+v.move+' · '+v.active.energySpent.toFixed(2)+' energy · '+reaction:status;if(this.status.textContent!==statusText)this.status.textContent=statusText;
  // Moving partners change reaction text, not the identity of live controls.
  const key=JSON.stringify([nativeArtRevision(),v.actor.bodyPlan?.id,v.target.bodyPlan?.id,v.queue,v.active?.sequence,this.futureSlot,v.busy,v.move,v.step,v.active?.startedAt,v.availability,refusal,failed,v.actor.lastMate]);if(key===this.signature)return;this.signature=key;
  this.el.hidden=false;this.el.dataset.targetId=String(this.targetId);this.title.textContent='Courtship · '+creatureIdentity(sim,v.target).label;
  interactionDock().heading.textContent=this.title.textContent;
  const portraitOptions=a=>({bodyPlan:a.bodyPlan,adaptations:a.adaptations||[],anatomy:a.anatomy,pigmentGenome:a.pigmentGenome,divergence:a.lineageForm,protoTrait:a.populationTrait,speciesBranch:a.speciesBranch,lifestyle:a.ecoLifestyle,dir:3});
  const subjects=[[v.actor,'Your performer'],[v.target,'Selected partner']],fitScale=Math.min(...subjects.map(([a])=>{const b=lineagePortraitBounds(a.genes,portraitOptions(a));return Math.min(60/b.w,44/b.h,8)}));
  this.portraits.replaceChildren();for(const [a,label] of subjects){const box=document.createElement('figure'),cv=document.createElement('canvas'),caption=document.createElement('figcaption');cv.width=96;cv.height=80;cv.setAttribute('aria-label',label+' · adult anatomy');caption.textContent=label;box.append(cv,caption);this.portraits.append(box);drawLineagePortrait(cv,a.genes,{...portraitOptions(a),fitScale})}
  const add=(root,label,enabled,reason,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.disabled=!enabled;b.title=reason||label;if(label==='Play'||label==='Back Off'){b.dataset.tutorialAction=label==='Play'?'play':'back-off';b.dataset.targetId=String(this.targetId)}b.onclick=()=>{if(!this.valid())return;fn();this.signature=null;this.update()};root.append(b);return b};
  this.cards.replaceChildren();for(const move of v.moves){const live=v.active?sim.reproduction.liveMoveAvailability(move.id,{index:this.futureSlot??undefined}):null;const b=add(this.cards,move.label,live?live.enabled:!sim.paused&&!v.busy&&v.queue.length<3,live?.reason||(move.source?'Uses '+move.source.replace(/-/g,' '):'Basic approach'),()=>this.queue(move.id));b.dataset.move=move.id;if(move.id==='approach'){b.dataset.tutorialAction='approach';b.dataset.targetId=String(this.targetId)}
   if(move.source){const cv=document.createElement('canvas');cv.width=64;cv.height=64;cv.setAttribute('aria-hidden','true');const c=cv.getContext('2d');c.imageSmoothingEnabled=false;c.translate(32,32);drawPartAlone(c,move.source,{type:PARTS[move.source].compatibleSocketTypes[0],s:6,p:creaturePalette(phenotypeFor(v.actor))});b.prepend(cv)}
  }
  const committed=v.active?.sequence||v.actor.queuedCourtshipSequence,sequence=v.busy&&committed?committed:v.queue;
  this.sequence.replaceChildren();this.sequence.dataset.empty=String(!sequence?.length);this.sequence.setAttribute('aria-label',v.busy?'Committed courtship sequence':'Chosen courtship sequence');for(const [i,move] of (sequence||[]).entries()){const step=document.createElement('li');step.textContent=move[0].toUpperCase()+move.slice(1);appendActionSymbol(step,step.textContent);step.className=v.step===i?'current':v.step>i?'complete':'';if(step.className==='current')step.setAttribute('aria-current','step');if(v.active&&i>v.step){const choose=document.createElement('button');choose.type='button';choose.textContent='Change';choose.title='Choose a different display for this upcoming beat';choose.dataset.futureBeat=i;choose.setAttribute('aria-pressed',String(this.futureSlot===i));choose.onclick=()=>{this.futureSlot=i;this.signature=null;this.update()};step.append(choose)}this.sequence.append(step)}if(!sequence?.length){const empty=document.createElement('li');empty.textContent='Choose up to three actions';this.sequence.append(empty)}
  this.tools.replaceChildren();add(this.tools,'Play',v.queue.length>0&&v.availability.enabled,v.queue.length?v.availability.reason:'Choose an action first.',()=>this.play());
  add(this.tools,'Undo',!v.busy&&v.queue.length>0,'Remove the last chosen action',()=>sim.reproduction.undoRitualMove());add(this.tools,'Clear',!v.busy&&v.queue.length>0,'Clear the chosen sequence',()=>sim.reproduction.clearRitualQueue());
  add(this.tools,'Observe',true,'',()=>this.onObserve(v.target));add(this.tools,'Details',true,'Advanced mate information',()=>this.onDetails());
  add(this.tools,'Back Off',true,'Stop this approach or performance',()=>{sim.reproduction.cancelCourtship();this.close()});
 }
}
