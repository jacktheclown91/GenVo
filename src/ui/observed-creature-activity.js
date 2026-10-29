import {dormancyCaption} from './dormancy-presentation.js';
import {visuallyObservable} from '../ecology/atmospheric-visibility.js';
import {currentCourtshipMove} from '../reproduction/courtship-performance.js';

const ACTIVITIES=Object.freeze({
  wary:'Backing away cautiously',escape:'Fleeing',flee:'Fleeing',
  'herd-listen':'Listening nearby','ground-probe':'Probing for food',
  'root-roam':'Searching the ground','pod-browse':'Browsing for food',
  'scent-watch':'Watching nearby','shadow-patrol':'Patrolling',
  feed:'Foraging',forage:'Foraging',eat:'Foraging',graze:'Grazing',drink:'Seeking water',rest:'Resting nearby'
});
// A caption for a selected, actually visible creature. It reports existing
// decisions only: no hidden need, preference, target location or offspring.
// Never call activeCourtship here: that execution reader can clear stale state.
export function observedCreatureActivity(sim,observer,target){
  if(!observer?.alive||!target?.alive||observer.id===target.id||
     !Number.isFinite(target.x)||!Number.isFinite(target.y)||
     !visuallyObservable(sim,observer,target))return null;
  if(target.torpor)return dormancyCaption(target);
  const state=target.stranger;
  if(state?.id===observer.id){
    const active=state.untilTick>sim.tickCount;
    if(active&&state.mode==='investigate'){
      if(target.intent==='stranger-investigate')return 'Approaching to investigate you';
      if(target.intent==='stranger-watch')return 'Watching you';
    }
    if(target.intent==='stranger-avoid'&&(active||state.cooldownUntil>sim.tickCount))
      return 'Keeping its distance';
    if(active&&state.mode==='posture'&&target.intent==='stranger-posture')
      return 'Standing its ground';
  }
  const performance=target.courtshipPerformance;
  if(target.intent==='mate'&&performance?.startedAt<=sim.tickCount&&
     performance.endsAt>=sim.tickCount&&currentCourtshipMove(sim,target))
    return 'Performing a courtship display';
  return ACTIVITIES[target.intent]||null;
}
