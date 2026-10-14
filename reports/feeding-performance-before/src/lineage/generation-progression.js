import {CFG} from '../sim/config.js';
import {SPECIES} from '../organisms/species.js';

const G2_TRIALS={
  forager:{
    id:'rangebreak',label:'Rangebreak',chip:'New G2 challenge · break the old range',
    reveal:'This generation can prove its Forager form by opening a feeding route beyond the familiar family range.',
    unlock:'trail-scout',unlockLabel:'Trail Scout',
    reward:'A proven outer feeding route lowers the family Scout threshold to 2 adults across 4 familiar cells.'
  },
  colony:{
    id:'kin-gather',label:'Kin Gathering',chip:'New G2 challenge · lead the family together',
    reveal:'This generation can prove its Colony form by using family guidance to gather grown relatives at home.',
    unlock:'kin-network',unlockLabel:'Kin Network',
    reward:'A proven home network lowers the satellite-nest threshold to 3 adults across 6 familiar cells.'
  }
};

const G3_TRIALS={
  forager:{
    id:'range-band',label:'Found a Ranging Band',chip:'New G3 challenge · found an outer ranging band',
    reveal:'Generation 3 can stop treating exploration as a personal trip and establish a second family activity center on the frontier.',
    unlock:'range-network',unlockLabel:'Range Network',
    reward:'A proven ranging band becomes a persistent outer population center. Some autonomous Forager relatives will use it as a roaming anchor.'
  },
  colony:{
    id:'satellite-colony',label:'Found a Satellite Colony',chip:'New G3 challenge · found a second family home',
    reveal:'Generation 3 can turn close family living into a real second settlement by establishing and occupying a satellite nest.',
    unlock:'satellite-colony',unlockLabel:'Satellite Colony',
    reward:'An occupied satellite nest becomes a persistent population center. Some autonomous Colony relatives will treat it as their home anchor.'
  }
};

const clamp01=v=>Math.max(0,Math.min(1,Number(v)||0));
// v1.32 Stage F: the G2 trials are goals read from real state, in any order, like the
// v1.28 opening goals. Each pairs one lived event with the habit the inherited form implies.
// G3 stays a population goal (a second population center) shown the same way.
export const G2_HABIT_GOAL=.3;
const mark=done=>done?'✓':'○';

// Generation progression turns handoffs into new ecological jobs rather than
// restarting the founder loop. G2 proves inherited form. G3 then requires the
// player to use family-scale leadership to establish a second population center.
export class GenerationProgressionController{
  constructor(sim){
    this.sim=sim;
    this.active=null;
    this.completed=[];
    this.unlocks=new Set();
    this.populationCenters=[];
    this.nextCenterId=1;
    this.lastCompletion=null;
    this.notice=null;
  }
  trialMeta(kind,generation=2){return(generation>=3?G3_TRIALS:G2_TRIALS)[kind]||null}
  hasUnlock(id){return this.unlocks.has(id)}
  onHandoff(from,to,handoff){
    if(!to?.alive||to.species!=='genvo')return null;
    const generation=to.generation||1,form=this.sim.divergence?.formFor?.(to);if(!form)return null;
    let trial=null;
    if(generation===2)trial=form.kind==='forager'?this.startForagerG2(to):this.startColonyG2(to);
    else if(generation===3)trial=form.kind==='forager'?this.startForagerG3(to):this.startColonyG3(to);
    if(!trial)return null;
    handoff.generationChallenge={id:trial.id,kind:trial.kind,label:trial.label,generation};
    this.sim.cognition?.record?.(to,'generation-challenge',`Generation ${generation} challenge: ${trial.label}`,{kind:trial.kind,id:trial.id,generation});
    return trial;
  }
  startForagerG2(animal){
    const candidates=this.sim.expansion?.frontierCells?.()||[];
    const reachable=candidates.filter(c=>c.danger===0&&this.sim.canReach(animal,c.x,c.y));
    const target=(reachable.length?reachable:candidates)[0];if(!target)return null;
    this.active={id:'rangebreak',kind:'forager',label:G2_TRIALS.forager.label,animalId:animal.id,generation:2,stage:'goals',target:{x:target.x,y:target.y,cellKey:target.key,label:'outer forage'},startedTick:this.sim.tickCount,lastActionTick:-1,outerFed:false,progress:0};
    return this.active;
  }
  colonyAnchor(animal){
    const shelter=this.sim.shelter?.nearest?.(animal,{radius:Infinity,familyOnly:true});if(shelter)return{x:shelter.x,y:shelter.y,label:'family shelter',shelterId:shelter.id};
    const home=this.sim.territory?.state?.(animal)?.home;if(home)return{x:home.x,y:home.y,label:'family home'};
    return{x:animal.x,y:animal.y,label:'family gathering'};
  }
  startColonyG2(animal){
    this.active={id:'kin-gather',kind:'colony',label:G2_TRIALS.colony.label,animalId:animal.id,generation:2,stage:'goals',target:this.colonyAnchor(animal),startedTick:this.sim.tickCount,holdTicks:0,requiredTicks:Math.max(18,Math.round(CFG.dayTicks*.65)),gathered:false,progress:0};
    return this.active;
  }
  startForagerG3(animal){
    const target=this.chooseFrontierTarget(animal);
    this.active={id:'range-band',kind:'forager',label:G3_TRIALS.forager.label,animalId:animal.id,generation:3,stage:this.sim.expansion?.scoutUnlocked?.()?'mark':'unlock',target:target?{x:target.x,y:target.y,cellKey:target.key,label:'suggested frontier'}:null,startedTick:this.sim.tickCount,holdTicks:0,requiredTicks:Math.max(20,Math.round(CFG.dayTicks*.72)),progress:0};
    return this.active;
  }
  startColonyG3(animal){
    const suggested=this.chooseNestTarget(animal),snap=this.sim.expansion?.snapshot?.()||null;
    this.active={id:'satellite-colony',kind:'colony',label:G3_TRIALS.colony.label,animalId:animal.id,generation:3,stage:snap?.nestAvailable?'mark':'unlock',target:suggested?{x:suggested.x,y:suggested.y,label:'suggested settlement'}:null,startedTick:this.sim.tickCount,holdTicks:0,requiredTicks:Math.max(20,Math.round(CFG.dayTicks*.68)),progress:0,startingShelterIds:(this.sim.shelter?.activeShelters?.()||[]).map(s=>s.id),projectId:null,shelterId:null};
    return this.active;
  }
  chooseFrontierTarget(animal){
    const candidates=this.sim.expansion?.frontierCells?.()||[];
    const reachable=candidates.filter(c=>c.danger===0&&this.sim.canReach(animal,c.x,c.y));
    const viable=reachable.filter(c=>this.sim.populationEcology?.settlementCheck?.(c,{kind:'range-band'})?.ok!==false);
    const safe=viable.filter(c=>c.resource>=.18);
    return(safe.length?safe:viable.length?viable:reachable.length?reachable:candidates)[0]||null;
  }
  chooseNestTarget(animal){
    const candidates=this.sim.expansion?.frontierCells?.()||[];
    for(const cell of candidates){const check=this.sim.shelter?.canEstablishNestAt?.({x:cell.x,y:cell.y});if(check?.ok)return check}
    return this.chooseFrontierTarget(animal);
  }
  update(){
    const t=this.active,p=this.sim.player();if(!t||t.completed||!p||p.id!==t.animalId)return t;
    if(t.generation===2){if(t.kind==='forager')this.updateForagerG2(t,p);else if(t.kind==='colony')this.updateColonyG2(t,p)}
    else if(t.generation===3){if(t.kind==='forager')this.updateForagerG3(t,p);else if(t.kind==='colony')this.updateColonyG3(t,p)}
    return t;
  }
  // G2 goals, read from state so they can be done in any order.
  g2Goals(t,p){
    const habit=k=>this.sim.habits?.value?.(p,k)||0;
    if(t.kind==='forager'){const r=habit('range');return[{id:'outer-feed',label:'Feed beyond the old range',done:!!t.outerFed},{id:'range-habit',label:`Make ranging a habit ${Math.round(Math.min(r,G2_HABIT_GOAL)/G2_HABIT_GOAL*100)}%`,done:r>=G2_HABIT_GOAL}]}
    const h=habit('home');return[{id:'gather',label:t.gathered?'Gather the family at home':`Gather the family at home ${Math.round(clamp01(t.holdTicks/t.requiredTicks)*100)}%`,done:!!t.gathered},{id:'home-habit',label:`Make home a habit ${Math.round(Math.min(h,G2_HABIT_GOAL)/G2_HABIT_GOAL*100)}%`,done:h>=G2_HABIT_GOAL}];
  }
  finishG2(t,p){const goals=this.g2Goals(t,p),done=goals.filter(g=>g.done).length;t.progress=done/goals.length;if(done===goals.length)this.complete(t,p)}
  updateForagerG2(t,p){
    const action=this.sim.lastPlayerAction;
    if(!t.outerFed&&action&&action.tick!==t.lastActionTick){t.lastActionTick=action.tick;
      if(action.type==='eat'){const nearTarget=t.target&&Math.hypot(p.x-t.target.x,p.y-t.target.y)<=2.8,far=(this.sim.habits?.homeDistance?.(p)??0)>8;
        if(nearTarget||far){t.outerFed=true;this.sim.cognition?.record?.(p,'rangebreak-reached','Fed beyond the old family range',{cellKey:t.target?.cellKey||null})}}}
    this.finishG2(t,p);
  }
  updateColonyG2(t,p){
    if(!t.gathered){
      const area=this.sim.familyDirectives?.areaStatus?.().order||null,dHome=Math.hypot(p.x-t.target.x,p.y-t.target.y);
      const gather=area?.type==='gather'&&Math.hypot(area.x-t.target.x,area.y-t.target.y)<=3.2,radius=area?.radius||2.2,nearPlayer=dHome<=Math.max(3.0,radius+1.0);
      const grown=gather?this.sim.animals.filter(a=>a.alive&&a.lineage&&a.species==='genvo'&&a.id!==p.id&&a.age>=SPECIES.genvo.maturity&&Math.hypot(a.x-t.target.x,a.y-t.target.y)<=Math.max(3.1,radius+1.0)):[];
      if(gather&&nearPlayer&&grown.length>=1)t.holdTicks++;else t.holdTicks=Math.max(0,t.holdTicks-2);
      if(t.holdTicks>=t.requiredTicks)t.gathered=true;
    }
    this.finishG2(t,p);
  }
  updateForagerG3(t,p){
    if(t.stage==='unlock'){
      if(this.sim.expansion?.scoutUnlocked?.()){t.stage='mark';t.target=t.target||this.chooseFrontierTarget(p);t.progress=.08}else return;
    }
    const area=this.sim.familyDirectives?.areaStatus?.().order||null;
    if(t.stage==='mark'&&area?.type==='scout'){
      t.stage='hold';t.target={x:area.x,y:area.y,label:'ranging band'};t.progress=.16;
      this.sim.cognition?.record?.(p,'range-band-marked','Marked a frontier for a family ranging band',{x:area.x,y:area.y});
    }
    if(t.stage!=='hold'||!area||area.type!=='scout')return;
    if(Math.hypot(area.x-t.target.x,area.y-t.target.y)>2.5){t.target={x:area.x,y:area.y,label:'ranging band'};t.holdTicks=0;t.progress=.16;t.siteIssue=null}
    const ecology=this.sim.populationEcology?.siteAssessment?.(t.target)||null;t.siteEcology=ecology;if(ecology&&ecology.score<.34){t.siteIssue=ecology.competition>.45?'competitor pressure':'weak local forage';t.holdTicks=Math.max(0,t.holdTicks-2);t.progress=clamp01(.16+.84*(t.holdTicks/t.requiredTicks));return}else t.siteIssue=null;
    const radius=Math.max(3.0,area.radius||4),relatives=this.sim.animals.filter(a=>a.alive&&a.lineage&&a.species==='genvo'&&a.id!==p.id&&a.age>=SPECIES.genvo.maturity&&Math.hypot(a.x-t.target.x,a.y-t.target.y)<=radius);
    if(relatives.length>=1)t.holdTicks++;else t.holdTicks=Math.max(0,t.holdTicks-2);
    t.progress=clamp01(.16+.84*(t.holdTicks/t.requiredTicks));
    if(t.holdTicks>=t.requiredTicks)this.complete(t,p,{center:{kind:'range-band',x:t.target.x,y:t.target.y,label:'Ranging Band'}})
  }
  updateColonyG3(t,p){
    const snap=this.sim.expansion?.snapshot?.()||null;
    if(t.stage==='unlock'){
      if(snap.nestAvailable){t.stage='mark';t.target=this.chooseNestTarget(p)||t.target;t.progress=.08}else return;
    }
    const area=this.sim.familyDirectives?.areaStatus?.().order||null;
    if(t.stage==='mark'&&area?.type==='nest'){
      const project=this.sim.shelter?.nearestProject?.(area.x,area.y,2.8);if(project){t.stage='build';t.projectId=project.id;t.target={x:project.x,y:project.y,label:'satellite nest'};t.progress=.18}
    }
    if(t.stage==='build'){
      const newShelter=(this.sim.shelter?.activeShelters?.()||[]).find(s=>s.kind==='satellite'&&!t.startingShelterIds.includes(s.id));
      if(newShelter){t.stage='occupy';t.shelterId=newShelter.id;t.target={x:newShelter.x,y:newShelter.y,label:'new satellite home',shelterId:newShelter.id};t.progress=.64;this.sim.cognition?.record?.(p,'satellite-colony-built','A second physical family home is ready',{shelterId:newShelter.id})}
      return;
    }
    if(t.stage!=='occupy')return;
    const shelter=(this.sim.shelter?.activeShelters?.()||[]).find(s=>s.id===t.shelterId);if(!shelter)return;
    const grown=this.sim.animals.filter(a=>a.alive&&a.lineage&&a.species==='genvo'&&a.age>=SPECIES.genvo.maturity&&Math.hypot(a.x-shelter.x,a.y-shelter.y)<=3.1),relatives=grown.filter(a=>a.id!==p.id);
    if(grown.length>=2&&relatives.length>=1)t.holdTicks++;else t.holdTicks=Math.max(0,t.holdTicks-2);
    t.progress=clamp01(.64+.36*(t.holdTicks/t.requiredTicks));
    if(t.holdTicks>=t.requiredTicks)this.complete(t,p,{center:{kind:'satellite-colony',x:shelter.x,y:shelter.y,label:'Satellite Colony',shelterId:shelter.id}})
  }
  complete(t,animal,{center=null}={}){
    if(!t||t.completed)return false;const meta=this.trialMeta(t.kind,t.generation);if(!meta)return false;t.completed=true;t.completedTick=this.sim.tickCount;t.progress=1;this.unlocks.add(meta.unlock);
    let centerRecord=null;if(center)centerRecord=this.addPopulationCenter({...center,form:t.kind,generation:t.generation,animalId:t.animalId});
    const record={id:t.id,kind:t.kind,generation:t.generation,animalId:t.animalId,completedTick:this.sim.tickCount,day:this.sim.day,unlock:meta.unlock,centerId:centerRecord?.id||null};this.completed.push(record);this.lastCompletion=record;this.notice={text:`${meta.label} complete · ${meta.unlockLabel} learned. ${meta.reward}`,tone:'success'};this.active=null;
    this.sim.cognition?.record?.(animal,'generation-challenge-complete',`${meta.label} complete · ${meta.unlockLabel} learned`,{unlock:meta.unlock,centerId:centerRecord?.id||null,generation:t.generation});
    return true;
  }
  addPopulationCenter({kind,x,y,label,form,generation,animalId,shelterId=null,taxonId=null,taxonLabel=null}){
    const near=this.populationCenters.find(c=>c.kind===kind&&Math.hypot(c.x-x,c.y-y)<3);if(near)return near;
    const center={id:this.nextCenterId++,kind,x,y,label:label||kind,form:form||null,generation:generation||null,animalId:animalId||null,shelterId:shelterId||null,taxonId:taxonId||null,taxonLabel:taxonLabel||null,createdTick:this.sim.tickCount,createdDay:this.sim.day};
    this.populationCenters.push(center);return center;
  }
  centers(kind=null){return kind?this.populationCenters.filter(c=>c.kind===kind):this.populationCenters.map(c=>({...c}))}
  populationAssignment(animal,kind){
    if(!animal?.alive||this.sim.isManualPlayer?.(animal)||animal.species!=='genvo'||animal.age<SPECIES.genvo.maturity)return null;
    const form=this.sim.divergence?.formFor?.(animal);if(!form||form.kind!==kind)return null;
    const centerKind=kind==='forager'?'range-band':'satellite-colony',centers=this.populationCenters.filter(c=>c.kind===centerKind);if(!centers.length)return null;
    // Keep a real split instead of moving the whole family. The first half of the
    // autonomous inherited-form cohort receives a stable secondary-center assignment.
    const cohort=(this.sim.expansion?.adults?.()||[]).filter(a=>!this.sim.isManualPlayer?.(a)&&this.sim.divergence?.formFor?.(a)?.kind===kind).sort((a,b)=>a.id-b.id),index=cohort.findIndex(a=>a.id===animal.id),assigned=Math.max(1,Math.floor((cohort.length+1)/2));
    if(index<0||index>=assigned)return null;
    return centers[index%centers.length];
  }
  populationAnchor(animal,kind){
    const center=this.populationAssignment(animal,kind);if(!center)return null;
    const ecological=this.sim.populationEcology?.anchorTarget?.(center,animal)||center;
    return{...ecological,populationCenter:true};
  }
  // G3 population goals, shown as a checklist like the other goals.
  g3Goals(t){
    const pct=Math.round(clamp01(t.holdTicks/t.requiredTicks)*100);
    if(t.kind==='forager')return[{id:'scout',label:'Scout available',done:t.stage!=='unlock'},{id:'mark',label:'Scout marked on outer ground',done:t.stage==='hold'},{id:'hold',label:`A relative holds the frontier${t.stage==='hold'?` ${pct}%`:''}`,done:!!t.completed}];
    return[{id:'nest',label:'New nest available',done:t.stage!=='unlock'},{id:'build',label:'Satellite home built',done:t.stage==='occupy'},{id:'occupy',label:`Family lives there${t.stage==='occupy'?` ${pct}%`:''}`,done:!!t.completed}];
  }
  status(animal=this.sim.player()){
    const s=this.trialStatus(animal);if(!s||s.generation!==3)return s;
    const goals=this.g3Goals(s),done=goals.filter(g=>g.done).length;
    return{...s,goals,step:`${done}/${goals.length}`,body:`${goals.map(g=>`${mark(g.done)} ${g.label}`).join(' · ')} · ${s.body}`};
  }
  trialStatus(animal=this.sim.player()){
    if(!animal)return null;const t=this.active&&this.active.animalId===animal.id?this.active:null;if(!t)return null;const meta=this.trialMeta(t.kind,t.generation);
    if(t.generation===2){
      const goals=this.g2Goals(t,animal),done=goals.filter(g=>g.done).length,list=goals.map(g=>`${mark(g.done)} ${g.label}`).join(' · ');let tip='',guideTarget=null;
      if(t.kind==='forager'){if(!t.outerFed){guideTarget=t.target;tip=`eat at the marked outer forage cell or anywhere well beyond home · ${Math.hypot(animal.x-t.target.x,animal.y-t.target.y).toFixed(1)} tiles`}else tip='keep feeding far from home; your body is built to range'}
      else{if(!t.gathered){guideTarget=t.target;tip=`use Family Command, mark Gather at ${t.target.label}, and stay there with a grown relative`}else tip='spend your days near home; your body is built for close family living'}
      return{...t,meta,goals,title:meta.label,body:`${list}${tip?' · next: '+tip:''}`,step:`${done}/${goals.length}`,guideTarget};
    }
    if(t.generation===3&&t.kind==='forager'){
      if(t.stage==='unlock'){const need=this.sim.expansion?.nextUnlock?.();return{...t,meta,title:'Grow into population leadership',body:need?`Scout needs ${need.targetAdults} adults across ${need.targetCells} familiar cells. Grow and use the family range until Scout becomes available.`:'Grow the family range until Scout becomes available.',guideTarget:null}}
      const pct=Math.round(clamp01(t.holdTicks/t.requiredTicks)*100),eco=t.siteEcology?`${t.siteEcology.status.label} site · carrying ${t.siteEcology.load}/${t.siteEcology.capacity}`:'';return{...t,meta,title:t.stage==='mark'?'Found an outer ranging band':t.siteIssue?'Choose stronger frontier ground':'Let a relative establish the frontier',body:t.stage==='mark'?'Use Family Command and mark Scout on outer ground. You do not need to walk the route yourself.':t.siteIssue?`${t.siteIssue} is preventing a durable population center. Move Scout to stronger ground${eco?` · ${eco}`:''}.`:`Keep at least one grown relative working the marked Scout area · ${pct}%${eco?` · ${eco}`:''} · this will become a second population center.`,guideTarget:t.target};
    }
    if(t.generation===3&&t.kind==='colony'){
      if(t.stage==='unlock'){const reach=this.sim.expansion?.snapshot?.();return{...t,meta,title:'Grow into a second home',body:reach?.nestNeed?`New nest needs ${reach.nestNeed.targetAdults} adults across ${reach.nestNeed.targetCells} familiar cells. Grow the family range until a satellite nest is available.`:'Build and grow the family until another nest can be supported.',guideTarget:null}}
      if(t.stage==='mark')return{...t,meta,title:'Choose a second family home',body:'Use Family Command and mark New nest on learned, well-fed outer ground. The suggested site is only a guide.',guideTarget:t.target};
      if(t.stage==='build')return{...t,meta,title:'Build the satellite home',body:'Let grown relatives work at the marked nest. Construction uses real local plant material.',guideTarget:t.target};
      const pct=Math.round(clamp01(t.holdTicks/t.requiredTicks)*100);return{...t,meta,title:'Occupy the satellite home',body:`Keep at least two grown family members at the new shelter · ${pct}% · this will become a second population center.`,guideTarget:t.target};
    }
    return null;
  }
  revealFor(animal){
    if(!animal)return null;const generation=animal.generation||1,form=this.sim.divergence?.formFor?.(animal),meta=this.trialMeta(form?.kind,generation);if(!meta||![2,3].includes(generation))return null;
    return{chip:meta.chip,text:`${meta.reveal} ${meta.reward}`,label:meta.label};
  }
  takeNotice(){const n=this.notice;this.notice=null;return n}
  unlockSummary(){
    const out=[];
    if(this.hasUnlock('trail-scout'))out.push('Trail Scout · Scout threshold 2 adults / 4 cells');
    if(this.hasUnlock('kin-network'))out.push('Kin Network · satellite nest threshold 3 adults / 6 cells');
    if(this.hasUnlock('range-network'))out.push('Range Network · outer ranging band anchors autonomous Foragers');
    if(this.hasUnlock('satellite-colony'))out.push('Satellite Colony · second home anchors autonomous Colony relatives');
    return out;
  }
  centerSummary(){
    const bands=this.populationCenters.filter(c=>c.kind==='range-band').length,colonies=this.populationCenters.filter(c=>c.kind==='satellite-colony').length;if(!bands&&!colonies)return'';
    return`Population centers ${bands?`RANGING ${bands}`:''}${bands&&colonies?' · ':''}${colonies?`SATELLITE ${colonies}`:''}`;
  }
}
