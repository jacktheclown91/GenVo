import {TutorialControlCue} from './tutorial-control-cue.js';
import {visuallyObservable,visualSurveyRange,creatureView} from '../ecology/atmospheric-visibility.js';
import {SPECIES} from '../organisms/species.js';
import {CFG} from '../sim/config.js';
import {HUNTING} from '../ecology/threat-appraisal.js';

// Read actual visible hunters. No undiscovered identity or position is disclosed.
export function observedSurvivalThreat(sim,actor){
  const view=creatureView(sim,actor),range=view?.range??visualSurveyRange(actor);
  const seen=sim.animals.filter(a=>a.alive&&a.id!==actor.id&&
    Math.hypot(a.x-actor.x,a.y-actor.y)<=range&&sim.isPredatorTo(a,actor)&&(SPECIES[a.species]?.hunter||
      a.playerHunt?.targetId===actor.id||HUNTING.has(a.intent))&&
    visuallyObservable(sim,actor,a,8,view));
  seen.sort((a,b)=>Math.hypot(a.x-actor.x,a.y-actor.y)-Math.hypot(b.x-actor.x,b.y-actor.y));
  const hunter=seen.find(a=>a.playerHunt?.targetId===actor.id||a.target?.id===actor.id&&HUNTING.has(a.intent))||seen[0];
  if(!hunter)return null;
  const hunt=hunter.playerHunt?.targetId===actor.id?hunter.playerHunt:null;
  const pursuit=!!(hunt&&['windup','charge'].includes(hunt.phase)||hunt?.pursuit==='chase'||hunter.target?.id===actor.id&&HUNTING.has(hunter.intent));
  return{hunter,hunt,pursuit};
}
export class SurvivalThreatGuide extends TutorialControlCue{
  constructor(root){super(root);this.seen=new Set();this.active=null}
  reset(){this.clear();this.seen.clear();this.active=null}
  read(sim){
    const actor=sim.player(),threat=observedSurvivalThreat(sim,actor);
    if(!threat){this.active=null;this.clear();return null}
    const {hunter,hunt,pursuit}=threat,key=hunter.id+':'+(pursuit?'chase':'nearby');
    if(this.active?.key!==key){
      if(this.seen.has(key)&&!pursuit){this.clear();return null}
      this.seen.add(key);this.active={key,until:sim.tickCount+sim.cfgHz*6};
      // CFG is intentionally not read from mutable game state below.
      this.active.until=sim.tickCount+CFG.simHz*6;
    }
    if(!pursuit&&sim.tickCount>this.active.until){this.clear();return null}
    const imminent=hunt&&['windup','charge'].includes(hunt.phase);
    const brace=this.query('[data-command="brace"], [data-tutorial-action="brace"]').find(b=>!b.disabled);
    const attack=this.query('[data-tutorial-action="attack"]').find(b=>!b.disabled&&String(b.dataset.targetId)===String(hunter.id)&&sim.playerCombat.attackAvailability({targetId:hunter.id}).enabled);
    this.setCue(imminent?brace:!pursuit?attack:null,imminent?'brace':'attack');
    if(imminent)return{title:'FACE THE INCOMING ATTACK',text:'Hold Brace (J) while facing it. Guard uses breath and only reduces frontal damage; moving out of its path may be safer.'};
    if(pursuit)return{title:"YOU'RE BEING CHASED",text:'Move with WASD + Shift to sprint using breath. Change direction or break sight; escape is not guaranteed.'};
    const warning=sim.isOpeningProtected?.(actor)?' Approaching or attacking it ends your protected opening.':'';
    return{title:hunter.species==='needlejaw'?'STALKER NEARBY':'PREDATOR NEARBY',text:'Keep your distance. Attack (Space) needs a reachable target, costs breath and can provoke it.'+warning};
  }
}
