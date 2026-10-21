import {bestFreshwaterFood} from '../ecology/freshwater-food.js';
import {NotificationCenter} from './notification-center.js';
import {groundDiet,canHunt,preyPreference} from '../ecology/functional-diet.js';
import {CFG,PLANTS} from '../sim/config.js';
import {SPECIES} from '../organisms/species.js';
import {developmentFor} from '../family/family.js';
import {buildGenerationReveal} from './generation-reveal.js';
import {drawLineagePortrait} from '../render/lineage-portrait.js';
import {pressureSummaryText} from '../lineage/pressure.js';
import {ADAPTATIONS} from '../lineage/evolution.js';
import {relativeSummary} from './inspector.js';
import {inheritedMovementDifference,visibleDescendantGuide} from './lineage-stakes.js';

const OPENING_BRIEFINGS=[
  {
    kicker:'START SMALL',
    title:'Control one creature. Choose what it does next.',
    lead:'The ecosystem is already moving around you. You have three broad goals and can work on them in any order. Keys show up near your creature when they become useful.',
    points:[
      ['GOALS','Stay fed and watered, find a mate, and make a home.'],
      ['MOVE','WASD / arrows move. Shift sprints, but it costs breath. Walking refills it.'],
      ['USE','Click objects to see actions. Interact (E) uses your selected target; Shift+E drinks reachable water.']
    ],
    button:'Next'
  },
  {
    kicker:'YOUR LINE CONTINUES',
    title:'You are raising a lineage, not managing every animal.',
    lead:'Relatives keep thinking and moving on their own. Later generations unlock more family guidance, inherited forms, and population-scale play.',
    points:[
      ['NOW','Keep this founder alive and make the first home understandable.'],
      ['LATER','The game introduces family controls when they become useful instead of asking you to learn them now.'],
      ['GOAL','Generation 8 is the jam milestone, not an ending.']
    ],
    button:'Start Generation 1'
  }
];

// v1.28: the opening is three broad goals the player can pursue in any order instead of
// a fixed six-step chore list. Older saves that stopped mid-sequence resume here.
const LEGACY_OPENING_STAGES=new Set(['move','food','drink','mate','home','shelter']);

export class TutorialController{
  constructor(sim,renderer){
    this.renderer=renderer;
    this.welcome=document.querySelector('#welcome');
    this.briefing=document.querySelector('#briefing');
    this.briefingKicker=document.querySelector('#briefingKicker');
    this.briefingTitle=document.querySelector('#briefingTitle');
    this.briefingLead=document.querySelector('#briefingLead');
    this.briefingPoints=document.querySelector('#briefingPoints');
    this.briefingProgress=document.querySelector('#briefingProgress');
    this.briefingNext=document.querySelector('#briefingNext');
    this.tutorial=document.querySelector('#tutorial');
    this.toastEl=document.querySelector('#toast');this.notifications=new NotificationCenter(this.toastEl);
    this.transition=document.querySelector('#transition');
    this.transitionKicker=document.querySelector('#transitionKicker');
    this.transitionTitle=document.querySelector('#transitionTitle');
    this.transitionLead=document.querySelector('#transitionLead');
    this.transitionReveal=document.querySelector('#transitionReveal');
    this.transitionParent=document.querySelector('#transitionParent');
    this.transitionChild=document.querySelector('#transitionChild');
    this.transitionParentLabel=document.querySelector('#transitionParentLabel');
    this.transitionChildLabel=document.querySelector('#transitionChildLabel');
    this.transitionChanges=document.querySelector('#transitionChanges');
    this.transitionEvolution=document.querySelector('#transitionEvolution');
    this.transitionEvolutionChoices=document.querySelector('#transitionEvolutionChoices');
    this.transitionDetails=document.querySelector('#transitionDetails');
    this.transitionDetailsBody=document.querySelector('#transitionDetailsBody');
    this.transitionBody=document.querySelector('#transitionBody');
    this.transitionContinue=document.querySelector('#transitionContinue');
    this.startButton=document.querySelector('#startGame');
    this.skipButton=document.querySelector('#skipTutorial');
    this.skip=new URLSearchParams(location.search).get('skipTutorial')==='1';
    this.toastUntil=0;
    this.resumeChoice=false;
    this.startButton?.addEventListener('click',()=>this.begin());
    this.skipButton?.addEventListener('click',()=>this.begin(true));
    this.briefingNext?.addEventListener('click',()=>this.nextBriefing());
    this.transitionContinue?.addEventListener('click',()=>this.continueTransition());
    this.setSimulation(sim,{fresh:true});
  }
  setSimulation(sim,{fresh=false,resume=false}={}){
    this.sim=sim;let restoredStage=resume&&sim.uiTutorialStage?sim.uiTutorialStage:null;if(LEGACY_OPENING_STAGES.has(restoredStage))restoredStage='goals';this.stage=restoredStage||(this.skip?'done':'welcome');this.sim.uiTutorialStage=this.stage;this.startPos=null;this.briefingIndex=0;this.lastActiveId=sim.playerId;this.lastHandoffCount=sim.lineage.handoffs.length;this.establishmentShown=!!sim.lineage.establishmentAnnounced;this.resumeChoice=false;
    this.welcome.hidden=true;if(fresh)sim.paused=true;
    if(this.briefing)this.briefing.hidden=true;if(this.transition)this.transition.hidden=true;this.transitionWasPaused=false;this.lineageEndedShown=false;
    this.renderer.guideTarget=null;this.update(true);
  }
  setResumeChoice(active){this.resumeChoice=!!active}
  beginInWorld(){this.stage='goals';this.sim.uiTutorialStage='goals';this.welcome.hidden=true;if(this.briefing)this.briefing.hidden=true;this.sim.paused=false;this.startPos=this.sim.player()?{x:this.sim.player().x,y:this.sim.player().y}:null;this.update(true);this.showToast('The gold ring marks you. WASD moves; right-click ground to move, or click an object for actions.',6500,'safe','action')}
  begin(skip=false){
    if(skip){this.stage='done';this.sim.uiTutorialStage=this.stage;this.welcome.hidden=true;if(this.briefing)this.briefing.hidden=true;this.sim.paused=false;this.sim.endOpeningGrace?.('tutorial skipped');this.showToast('Tutorial skipped · survival is live.',3000,'warn');return}
    this.stage='briefing';this.briefingIndex=0;this.welcome.hidden=true;this.sim.paused=true;this.showBriefing();
  }
  showBriefing(){
    if(!this.briefing)return this.finishBriefing();const card=OPENING_BRIEFINGS[this.briefingIndex];if(!card)return this.finishBriefing();
    this.briefingKicker.textContent=card.kicker;this.briefingTitle.textContent=card.title;this.briefingLead.textContent=card.lead;
    this.briefingPoints.replaceChildren(...card.points.map(([label,text])=>{const row=document.createElement('div'),b=document.createElement('b'),span=document.createElement('span');b.textContent=label;span.textContent=text;row.append(b,span);return row}));
    this.briefingProgress.replaceChildren(...OPENING_BRIEFINGS.map((_,i)=>{const dot=document.createElement('i');dot.classList.toggle('reached',i<=this.briefingIndex);dot.classList.toggle('active',i===this.briefingIndex);return dot}));
    this.briefingNext.textContent=card.button;this.briefing.hidden=false;
  }
  nextBriefing(){this.briefingIndex++;if(this.briefingIndex>=OPENING_BRIEFINGS.length)this.finishBriefing();else this.showBriefing()}
  finishBriefing(){
    if(this.briefing)this.briefing.hidden=true;this.stage='goals';this.sim.uiTutorialStage=this.stage;this.startPos=this.sim.player()?{x:this.sim.player().x,y:this.sim.player().y}:null;this.sim.paused=false;this.showToast('Stalkers leave you alone until you have a home. Work on the goals in any order.',3600,'safe');this.update(true);
  }
  worldInputBlocked(){return !!((this.welcome&&!this.welcome.hidden)||(this.briefing&&!this.briefing.hidden)||(this.transition&&!this.transition.hidden))}
  handleKey(input){const code=typeof input==='string'?input:input?.code,target=typeof input==='string'?null:input?.target;if(target?.closest?.('details'))return false;if(this.briefing&&!this.briefing.hidden&&(code==='Enter'||code==='Space')){this.nextBriefing();return true}if(this.transition&&!this.transition.hidden){if(/^Digit[1-3]$/.test(code||'')){const i=Number(code.at(-1))-1,offer=this.sim.evolution?.offerFor?.();if(offer&&!offer.chosen&&offer.offers[i])this.chooseEvolution(offer.offers[i].id);return true}if(code==='Enter'||code==='Space'){const offer=this.sim.evolution?.offerFor?.();if(offer&&!offer.chosen){this.showToast('Choose one adaptation first.',1600,'warn');return true}this.continueTransition();return true}}if(this.stage==='welcome'&&(code==='Enter'||code==='Space')){if(this.resumeChoice)return true;this.begin();return true}return false}
  onInteraction(result){if(!result)return;if(result.message)this.showToast(`${result.ok?'✓':'×'} ${result.message}`,result.ok?1900:1600,result.ok?'success':'warn','action');if(!result.ok)return;if(this.stage==='goals')this.update(true)}
  onShelterAction(result){if(!result)return;const message=result.ok?(result.action==='build'?'Shelter built.':result.action==='repair'?'Shelter repaired.':result.action==='reinforce'?'Shelter reinforced.':result.action==='cache'?'Food stored.':'Done.'):(result.reason||'That cannot be done here.');this.showToast(`${result.ok?'✓':'×'} ${message}`,result.ok?1900:1700,result.ok?'success':'warn','action');if(result.ok&&result.action==='build'&&this.stage==='goals')this.sim.endOpeningGrace?.('first shelter built');if(result.ok)this.update(true)}
  advance(stage){this.stage=stage;this.sim.uiTutorialStage=this.stage;this.renderer.guideTarget=null;this.update(true)}
  // v1.32.6: firsts are read from cognition's permanent record of what it has seen, not only the
  // 24-entry recent history. A first drink recorded once used to scroll out of that history and
  // untick the opening goal for good, because a second drink is never recorded again.
  historyHas(typePrefix){const p=this.sim.player(),state=p?this.sim.cognition.state(p):null;if(!state)return false;const match=k=>k===typePrefix||String(k).startsWith(typePrefix);if(state.seen)for(const k of state.seen)if(match(k))return true;return !!state.history?.some(h=>match(h.type))}
  update(force=false){
    if(this.briefing&&!this.briefing.hidden)return;
    const p=this.sim.player();this.detectHandoff();const milestone=this.sim.generationProgress?.takeNotice?.();if(milestone)this.showToast(milestone.text,5200,milestone.tone||'success','progress');const lostKnowledge=this.sim.cognition?.takeKnowledgeNotice?.();if(lostKnowledge)this.showToast(lostKnowledge.text,5200,lostKnowledge.tone||'warn');const fear=this.sim.cognition?.takeFearNotice?.();if(fear)this.showToast(fear.text,4200,fear.tone||'warn');const designed=this.sim.evolutionEditor?.takeNotice?.();if(designed)this.showToast(designed.text,4200,designed.tone||'success','progress');const found=!designed&&this.sim.discovery?.takeNotice?.();if(found)this.showToast(found.text,4200,found.tone||'safe','progress');const autoHome=this.sim.autoHomeNotice;if(autoHome){this.sim.autoHomeNotice=null;this.showToast(autoHome.text,5200,autoHome.tone||'warn')}
    if(!p){this.renderer.guideTarget=null;this.render('Your family line ended.','Press R to start again.');if(!this.lineageEndedShown&&this.sim.lineage?.founderId){this.lineageEndedShown=true;this.showTransition('The family line ended','No grown descendant survived to take over. Press R to start a new run.','Close',true)}return}
    this.noteEnergyBalance(p);
    if(this.stage==='goals'){if(this.renderOpeningGoals(p))return}
    this.renderer.guideTarget=null;this.renderDynamicGoal(p);
  }
  // Phase 4: make a slow energy deficit visible with real numbers (no bonus, no change to biology).
  // Once a sim day, if the creature is below 70% and lost energy over the last day, say so at most
  // every 3 days, naming the measured daily loss and what genuinely helps under the same rules.
  noteEnergyBalance(p){
    const s=SPECIES[p.species],day=this.sim.day;if(!s)return;
    if(!this.energyLog||this.energyLog.id!==p.id){this.energyLog={id:p.id,day,energy:p.energy,noticeDay:-Infinity};return}
    if(day===this.energyLog.day)return;
    const loss=(this.energyLog.energy-p.energy)/Math.max(1,day-this.energyLog.day);this.energyLog.day=day;this.energyLog.energy=p.energy;
    if(loss>.5&&p.energy/s.maxEnergy<.7&&day-this.energyLog.noticeDay>=3){this.energyLog.noticeDay=day;
      this.showToast(`Losing about ${Math.round(loss)} energy a day: meals are not keeping up with what this body burns. Richer food (bigger meal numbers), less time fleeing or drinking, or a quieter patch helps.`,5200,'warn');}
  }
  // The three opening goals, read from real state so any order works.
  openingGoals(p){
    const fed=this.historyHas('first-meal:'),watered=this.historyHas('first-drink'),paired=!!p.lastMate||!!p.pregnant||this.sim.family.livingChildren(p).length>0;
    const shelter=this.sim.shelter.nearest(p,{radius:Infinity,familyOnly:true}),home=this.sim.territory.state(p);
    return{fed,watered,needs:fed&&watered,paired,home:!!shelter,homeSettled:!!home?.established,familiarity:Math.min(100,Math.round((home?.totalFamiliarity||0)/2.5*100)),shelter};
  }
  renderOpeningGoals(p){
    const g=this.openingGoals(p);
    if(g.needs&&g.paired&&g.home){this.stage='done';this.sim.uiTutorialStage=this.stage;this.renderer.guideTarget=null;this.sim.endOpeningGrace?.('opening goals complete');this.showToast('Fed, paired and housed. Your lineage is underway and the living world now reacts normally.',4300,'warn');return false}
    if(this.renderPredatorAlert(p))return true;
    const s=SPECIES[p.species],energy=p.energy/s.maxEnergy,water=p.hydration/s.maxHydration;
    // The first goal has two halves; show each half as soon as it is done (v1.32.6).
    const needsItem=g.needs?'✓ Fed and watered':g.watered?'◐ Watered · now feed':g.fed?'◐ Fed · now drink':'○ Fed and watered';
    const list=`${needsItem} · ${g.paired?'✓':'○'} Mate · ${g.home?'✓':'○'} Home`;
    // Suggest one useful next step, chosen by what the creature needs most right now.
    let tip='',target=null;
    const moved=!this.startPos||Math.hypot(p.x-this.startPos.x,p.y-this.startPos.y)>=1.5;
    const needWater=!g.watered||water<.45,needFood=!g.fed||energy<.45;
    if(!moved&&!g.fed&&!g.watered)tip='the gold ring marks your creature · WASD / arrows move';
    else if(needWater&&(water<=energy||!needFood)){if(this.sim.world.isDrinkable(p.x,p.y))tip='Drink in the dock · Shift+E also drinks here';else{const w=this.sim.world.nearestDrinkable(p.x,p.y,28);if(w)target={...w,label:'Water'};tip=g.watered?'water is low · follow the cyan cue':'click water for Approach & Drink · Shift+E drinks nearby'}}
    else if(needFood){const f=this.findFood(p,24);if(f)target={...f,label:'Food'};tip=f?.kind==='prey'?'click prey · Space attacks within reach':f?'click edible food for actions · Interact / E uses your target':'explore for food this mouth can use'}
    else if(!g.paired){this.sim.reproduction.refreshSelection();const mate=this.sim.reproduction.selectedMate();if(mate)target={x:mate.x,y:mate.y,label:'Mate'};tip=mate?'click a creature, then Court · C also courts; M shows details':'explore nearby ground to find a compatible mate'}
    else if(!g.home){if(!g.homeSettled)tip=`stay around food and water here so it becomes home · familiarity ${g.familiarity}%`;else{const can=this.sim.shelter.canBuildHere(p);tip=can.ok?'N builds a family shelter here':'move near dense plants in your home area, then press N'}}
    // v1.33.6: in AUTO the creature acts on its own, so the tip says what it is doing and what only you can do.
    if(this.sim.playerAutonomy){tip=!g.needs?'your creature looks for food and water on its own':!g.paired?'it courts a mate when one is close':!g.home?(g.homeSettled?'it builds the family shelter on its own on good ground near home':`it builds a family shelter on its own once this ground becomes home · familiarity ${g.familiarity}%`):tip}
    this.renderer.guideTarget=target;
    // Phase 4: the collapsed pill names the next goal, so the goal is visible without opening the panel.
    const next=!g.needs?(g.watered?'Find food':g.fed?'Find water':'Eat and drink'):!g.paired?'Find a mate':!g.home?'Make a home':'';
    this.render('Your first goals',`${list}${tip?' · next: '+tip:''}`,{step:`${(g.needs?1:0)+(g.paired?1:0)+(g.home?1:0)}/3`,compact:true,next});return true;
  }
  preferredBirthShelter(p){return this.sim.shelter?.broodShelterFor?.(p)||this.sim.shelter?.nearest?.(p,{radius:Infinity,familyOnly:true})||null}
  shouldFoundBroodHome(p){
    if(!p?.lastMate||(p.generation||1)<2||this.sim.shelter?.broodShelterFor?.(p))return false;
    const shelters=this.sim.shelter?.activeShelters?.()||[];return shelters.length===1;
  }
  renderBroodHomeGoal(p){
    if(!this.shouldFoundBroodHome(p))return false;const existing=this.sim.shelter.activeShelters()[0],d=existing?Math.hypot(p.x-existing.x,p.y-existing.y):Infinity,can=this.sim.shelter.canBuildHere(p);
    if(existing&&d<7.5){this.renderer.guideTarget={x:existing.x,y:existing.y,label:'old family shelter'};this.render('Found a new brood home','Your G2 pair can establish a second shelter · move at least 7.5 tiles from the old home with your mate, then press N.',{compact:true});return true}
    this.renderer.guideTarget=null;this.render('Build the new brood shelter',can.ok?"N · establish this pair's second family home using nearby plant material":can.reason,{compact:true});return true
  }
  renderDynamicGoal(p){
    if(this.renderPredatorAlert(p))return;
    if(this.renderStalkerDenWarning(p))return;
    if(this.renderTerritoryShift(p))return;
    if(this.renderSuccession(p))return;
    if(this.renderGenerationChallenge(p))return;
    const children=this.sim.family.livingChildren(p),heirs=this.sim.lineage.eligibleHeirs();
    if(children.length){const priority=this.sim.family.priorityChild(p);if(priority?.urgent){const child=priority.child,dev=developmentFor(child);this.renderer.guideTarget={x:child.x,y:child.y,label:`G${child.generation} young`};const near=priority.distance<=1.7;const action=priority.need==='fear'?'Stay with it or drive the Stalker away':priority.need==='separation'?'Regroup with your young':near?`E · tend ${dev.stage}`:`Reach your ${dev.stage} and tend it`;this.render(`Young ${priority.label}`,`G${child.generation} ${dev.stage} · stress ${Math.round(priority.stress*100)}% · ${action}`,{compact:true});return}}
    if(this.renderIllness(p))return;
    if(this.renderFamilyIllness(p))return;
    if(this.renderExposure(p))return;
    if(this.renderFamilyWeather(p))return;
    if(this.renderStormAftermath(p))return;
    if(this.renderInjury(p))return;
    if(this.renderKnownWater(p))return;
    if(this.renderForagePatch(p))return;
    if(p.age<SPECIES[p.species].maturity){
      const caregiver=this.sim.animals.find(a=>a.id===p.caregiverId&&a.alive),remaining=Math.ceil(SPECIES[p.species].maturity-p.age);
      if(caregiver)this.renderer.guideTarget={x:caregiver.x,y:caregiver.y,label:'Caregiver'};
      this.render('Grow into your body',`${developmentFor(p).stage} · about ${remaining} days to maturity. Stay fed, watered and safe${caregiver?'; your caregiver is marked nearby':''}. Courtship becomes available when your body matures.`,{compact:true});return;
    }
    // For G1, an actual grown successor is the immediate stake. Secondary
    // species/lifestyle projects yield only after the real handoff opportunity.
    if(p.generation!==1){if(this.renderSpeciesGoal(p))return;if(this.renderLifestyleGoal(p))return}
    if(this.sim.lineage.established){this.render('Lineage established','Generation 8 is the milestone, not the ending · descendants and adaptations can continue.',{compact:true});return}
    if(heirs.length){
      const h=heirs[0],practice=this.sim.family.practiceProfile(h),prep=practice&&!practice.ready?` · ${practice.completed}/2 solo routes`:' · field-ready';
      // First handoff is an embodied choice, not an abstract generation counter.
      // Only mark this descendant when the current creature can really see it.
      if(p.generation===1){
        const movement=inheritedMovementDifference(this.sim,p,h);
        this.renderer.guideTarget=visibleDescendantGuide(this.sim,p,h);
        const difference=movement.gained.length?` · this descendant's body can ${movement.gained.map(v=>v.label).join(' and ')} when conditions allow`:movement.lost.length?` · this descendant cannot ${movement.lost.map(v=>v.label).join(' or ')} with its current body`:' · the descendant carries its own inherited body';
        this.render(heirs.length>1?`${heirs.length} possible successors`:`G${h.generation} successor is grown`,`A living descendant can carry your line forward${difference} · H compares living heirs and takes over${prep}`,{compact:true});return;
      }
      this.render(heirs.length>1?`${heirs.length} grown descendants ready`:`G${h.generation} successor ready`,heirs.length>1?`They differ in body, adaptations and habits · H compares them and you choose who continues the line${prep}`:`This is how the lineage advances · H takes over · L shows the family${prep}`,{compact:true});return
    }
    if(p.generation===1){if(this.renderSpeciesGoal(p))return;if(this.renderLifestyleGoal(p))return}
    if(children.length){
      // Do not reveal the position of a descendant outside the embodied view.
      // Urgent family care and known-danger guidance above retain priority.
      if(p.generation===1)this.renderer.guideTarget=visibleDescendantGuide(this.sim,p,children[0]);
      const oldest=[...children].sort((a,b)=>b.age-a.age)[0],spec=SPECIES[oldest.species],shelter=this.sim.shelter.nearest(p,{radius:Infinity,familyOnly:true});
      if(!shelter){this.render('Protect the next generation','Your young are future successors · N builds a family shelter once your home range settles.',{compact:true});return}if(shelter.foodStore<3){if(this.renderStrategyGoal(p,{branches:['utility']}))return;this.render('Stock the shelter','Stand beside it · F stores nearby food for the family.',{compact:true});return}const learning=this.sim.family.learningProfile(oldest);if(learning&&oldest.age<spec.maturity&&!learning.complete){const lessonAction={water:'walk with it to a drinkable bank, then E · drink',food:'let it follow you while you feed',shelter:'bring it back to the family shelter',danger:'keep it with you, let a Stalker notice you, then sprint away or defend'}[learning.next]||`practice ${learning.next}`;this.renderer.guideTarget=p.generation===1?visibleDescendantGuide(this.sim,p,oldest):{x:oldest.x,y:oldest.y,label:`G${oldest.generation} learning`};const copying=this.sim.habits?.summary?.(oldest,{limit:1})||'still copying you';this.render('Your young copy you',`${developmentFor(oldest).stage} · ${Math.round(learning.independence*100)}% independent · picking up: ${copying} · to show it more, ${lessonAction}`,{compact:true});return}if(learning&&oldest.age<spec.maturity&&learning.independence<.68){this.render('Growing independent',`${developmentFor(oldest).stage} · ${Math.round(learning.independence*100)}% independent · habits: ${this.sim.habits?.summary?.(oldest)||'none yet'} · give it room to practice`,{compact:true});return}const practice=this.sim.family.practiceProfile(oldest);if(practice&&oldest.age<spec.maturity&&!practice.ready){this.renderer.guideTarget=p.generation===1?visibleDescendantGuide(this.sim,p,oldest):{x:oldest.x,y:oldest.y,label:`G${oldest.generation} practice`};if(practice.run){const phase=practice.run.phase==='return'?'finding its way home':`solo ${practice.run.type} route`;this.render('Practicing alone',`${developmentFor(oldest).stage} · ${phase} · ${practice.completed}/2 completed${practice.recoveries?` · ${practice.recoveries} danger recovery`:''}`,{compact:true});return}this.render('Practice independence',`${developmentFor(oldest).stage} · ${practice.completed}/2 solo routes · keep it fed, calm, and give it room to leave shelter`,{compact:true});return}if(this.renderStrategyGoal(p))return;{const movement=p.generation===1?inheritedMovementDifference(this.sim,p,oldest):null;const inherited=movement?.gained.length?` · may grow up able to ${movement.gained.map(v=>v.label).join(' and ')}`:'';this.render('Raise the next generation',`${developmentFor(oldest).stage} · ${Math.floor(oldest.age)}/${spec.maturity} days toward adulthood · care stress ${Math.round((oldest.careStress||0)*100)}%${inherited}`,{compact:true});return}
    }
    if(p.pregnant){
      const pr=this.sim.family.pregnancyProgress(p),home=this.sim.territory.state(p);if(this.renderBroodHomeGoal(p))return;const shelter=this.preferredBirthShelter(p);
      if(!home?.established&&!shelter){this.render('Choose a home',`~${Math.ceil(pr.remaining)}d until birth · familiarity ${Math.min(100,Math.round((home?.totalFamiliarity||0)/2.5*100))}%`,{compact:true});return}
      if(!shelter){const can=this.sim.shelter.canBuildHere(p);this.render('Build a family shelter',can.ok?'N · build here with nearby plant material':'Stay near useful ground with dense plants nearby.',{compact:true});return}
      if(Math.hypot(p.x-shelter.x,p.y-shelter.y)>2.2){this.renderer.guideTarget={x:shelter.x,y:shelter.y,label:shelter.kind==='brood'?'new brood shelter':'family shelter'};this.render(shelter.kind==='brood'?'Prepare the new home':'Return to the family shelter',`~${Math.ceil(pr.remaining)}d until birth · reach the shelter to stock it`,{compact:true});return}
      if(shelter.foodStore<3){if(this.renderStrategyGoal(p,{branches:['utility']}))return;this.render('Stock the shelter',`~${Math.ceil(pr.remaining)}d until birth · stand beside it and press F`,{compact:true});return}
      if(this.renderStrategyGoal(p))return;this.render('Prepare for birth',`~${Math.ceil(pr.remaining)}d · shelter stocked · keep yourself safe`,{compact:true});return
    }
    if(p.lastMate){if(this.renderBroodHomeGoal(p))return;const home=this.sim.territory.state(p),shelter=this.preferredBirthShelter(p);if(!home?.established&&!shelter){this.render('Choose a home',`Stay around one useful area · familiarity ${Math.min(100,Math.round((home?.totalFamiliarity||0)/2.5*100))}%`,{compact:true});return}if(!shelter){const can=this.sim.shelter.canBuildHere(p);this.render('Build a family shelter',can.ok?'N · build here with nearby plant material':'Stay near useful ground with dense plants nearby.',{compact:true});return}if(Math.hypot(p.x-shelter.x,p.y-shelter.y)>2.2){this.renderer.guideTarget={x:shelter.x,y:shelter.y,label:shelter.kind==='brood'?'new brood shelter':'family shelter'};this.render('Return to the new home','Reach the shelter before stocking food for the family.',{compact:true});return}if(shelter.foodStore<3){if(this.renderStrategyGoal(p,{branches:['utility']}))return;this.render('Store food for the family','Stand beside the shelter · F stores nearby food.',{compact:true});return}if(this.renderStrategyGoal(p))return;this.render('Prepare for young','Keep yourself fed and watered. Watch for Stalkers.',{compact:true});return}
    this.render(p.lastMate?'Prepare Generation 2':'Find a mate',p.lastMate?'Stay alive together. The next generation begins with a child.':'Explore until a mate is nearby. M inspects, C courts.',{compact:true});
  }
  renderPredatorAlert(p){
    const threat=this.sim.predator?.playerStatus?.(p);if(!threat)return false;
    const d=Math.max(0,threat.distance).toFixed(1),pack=threat.threatCount>1?`${threat.threatCount} Stalkers · `:'';
    if(threat.phase==='charge'){this.render(threat.threatCount>1?'ONE STALKER COMMITTED':'STALKER COMMITTED',`${pack}~${d} away · cross the marked lane or hold J facing it · the others will pressure rather than charge together`,{compact:true});return true}
    if(threat.phase==='windup'){const tell=threat.style==='rusher'?'short tell: sidestep now':threat.style==='wary'?'long tell: counterbite or break the angle':'it waited until close: cross its marked line';this.render(threat.threatCount>1?'One Stalker commits':'Stalker coiling to strike',`${pack}~${d} away · ${tell} · or hold J facing it · Space counterbite if close`,{compact:true});return true}
    if(threat.phase==='recover'){const outcome=threat.outcome==='braced'?'your brace stopped it dead':threat.outcome==='countered'?'your counter broke its attack':threat.outcome==='hit'?'it is resetting after the bite':threat.outcome==='evaded'||threat.outcome==='contact-miss'?'it overran the attack':'it is overextended';this.render('Stalker overextended',`${pack}${outcome} · Space opening bite if close · two clean wounds drive it off · or slip away`,{compact:true});return true}
    if(threat.phase==='stalk'&&threat.pursuit==='search'){this.render('The Stalker lost sight of you',`${pack}it is checking where it last saw you · stay quiet in dense plants or slip away · sprinting gives you away`,{compact:true});return true}
    if(threat.phase==='stalk'&&threat.pursuit==='chase'){const tired=threat.stamina<.35?' · it is tiring':'';this.render('Stalker giving chase',`${pack}~${d} away · it is faster than your walk, slower than your sprint${tired} · dense plants break its sight`,{compact:true});return true}
    if(threat.phase==='stalk'&&threat.distance<5.8){const title=threat.threatCount>1?'Stalkers closing in':threat.style==='ambusher'?'Stalker circling nearby':threat.style==='rusher'?'Stalker bearing down':'Stalker testing your distance';const tip=threat.threatCount>1?'they are spreading around you; only one commits a charge at a time':threat.style==='ambusher'?'watch the flank; V can break sight if camouflage evolved':threat.style==='rusher'?'make room before its early commitment':`a clean wound can make this hunter retreat`;this.render(title,`${pack}~${d} away · ${tip}`,{compact:true});return true}
    return false;
  }
  renderStalkerDenWarning(p){
    const territory=this.sim.stalkerTerritory,near=territory?.knownStatus?.(p,3.2);
    const den=territory?.playerStatus?.(p);
    if(near?.abandoned){
      if(!near.known){this.render('Old Stalker scrape','Move onto the dark scrape · E reads the tracks and feeding sign.',{compact:true});return true}
      this.render('Abandoned Stalker den','No living owner is defending this scrape. The tracks remain useful field sign.',{compact:true});return true
    }
    if(near&&!near.known&&near.distance<=1.9){const changed=near.den?.changed;this.render(changed?'Changed Stalker sign':'Fresh Stalker sign',changed?'Fresh tracks cross the marks you learned · E rereads the scrape.':'E · read the scrape before deciding whether to stay or leave.',{compact:true});return true}
    if(!den||!den.insideCore||this.sim.isOpeningProtected?.(p))return false;
    const owner=this.sim.animals.find(a=>a.id===den.ownerId&&a.alive),d=owner?Math.hypot(owner.x-p.x,owner.y-p.y):Infinity;
    const proximity=Number.isFinite(d)&&d<11?` · owner ~${d.toFixed(1)} away`:'';
    if(near?.known){const tip=den.style==='rusher'?'deep straight tracks: expect an early fast charge':den.style==='wary'?'broken tracks: a clean wound may drive it off':'side-scuffed tracks: expect circling and a close commitment';this.render('Known Stalker den',`${tip}${proximity} · leave the core or prepare to use what you learned`,{compact:true});return true}
    this.render('Inside a Stalker den',`The dark ground scrape marks defended territory${proximity} · leave the core or be ready to hide, sprint, or fight`,{compact:true});return true;
  }
  renderTerritoryShift(p){
    const notice=this.sim.stalkerTerritory?.landscapeNotice?.(p);if(!notice)return false;this.render(notice.title,notice.body,{compact:true});return true;
  }
  renderSuccession(p){
    const state=this.sim.lineage?.successionStatus?.();if(!state)return false;const t=state.target;this.renderer.guideTarget=t?{x:t.x,y:t.y,label:t.label||'Bearing'}:null;
    const prep=state.preparedness?.fieldReady?'field-ready':'underpracticed';
    if(state.stage==='resource'){const action=t?.type==='water'?'drink at the remembered bank':'eat at the remembered food patch';this.render(`First steps as G${p.generation}`,`${prep} · follow the familiar guide and ${action} · E confirms your bearings`,{compact:true});return true}
    if(state.stage==='home'){const label=t?.kind==='shelter'?'family shelter':'family anchor';this.render('Find your footing',`${prep} takeover · return to the ${label} before ranging out on your own`,{compact:true});return true}
    return false;
  }
  renderGenerationChallenge(p){
    const state=this.sim.generationProgress?.status?.(p);if(!state)return false;this.renderer.guideTarget=state.guideTarget?{...state.guideTarget}:null;this.render(state.title,state.body,{compact:!state.goals,step:state.step||''});return true;
  }
  renderIllness(p){
    const illness=this.sim.illness?.snapshot?.(p);if(!illness)return false;
    if(!illness.infected){const family=this.sim.familyIllness?.snapshot?.(p);if(family?.active)return false;if(illness.recovering){const need=illness.replenish?' · restore food and water before ranging far':' · your strength is returning';this.render('Fever broke',`Marsh fever cleared · temporary immunity ${illness.immuneDays}d${need}`,{compact:true});return true}return false;}
    const shelter=this.sim.shelter?.nearest?.(p,{radius:Infinity,familyOnly:true})||null,d=shelter?Math.hypot(p.x-shelter.x,p.y-shelter.y):Infinity;
    if(illness.mode==='shelter-rest'){
      const risk=illness.familyAtRisk?` · ${illness.familyAtRisk} susceptible family member${illness.familyAtRisk===1?'':'s'} nearby`:'';const family=this.sim.familyIllness?.snapshot?.(p),spacing=family?.distancingCount?` · ${family.distancingCount} relative${family.distancingCount===1?' is':'s are'} making space`:'';
      this.render('Resting through Marsh fever',`day ${illness.days}/${illness.duration} · shelter rest is reducing the strain${risk}${spacing}${illness.familyAtRisk?' · close shelter contact can still spread it':''}`,{compact:true});return true;
    }
    if(illness.mode==='isolation-rest'){this.render('Resting apart with Marsh fever',`day ${illness.days}/${illness.duration} · dense cover gives slower recovery support · family contact is reduced`,{compact:true});return true}
    if(illness.strained){this.render('Fever strain',`Marsh fever day ${illness.days}/${illness.duration} · sprinting increases the physiological cost · slow down and rest`,{compact:true});return true}
    if(shelter&&d<=18){this.renderer.guideTarget={x:shelter.x,y:shelter.y,label:'Family shelter'};const choice=illness.familyAtRisk?'Shelter gives the strongest rest, but sharing close cover can spread the fever. Dense cover away from family is a slower isolation option.':'Quiet shelter rest gives the strongest recovery support.';this.render('Marsh fever',`day ${illness.days}/${illness.duration} · ${d.toFixed(1)} tiles to shelter · ${choice}`,{compact:true});return true}
    this.render('Marsh fever',`day ${illness.days}/${illness.duration} · stop moving in dense cover to reduce strain · stay fed and watered while the fever runs its course`,{compact:true});return true;
  }


  renderFamilyIllness(p){
    const state=this.sim.familyIllness?.snapshot?.(p);if(!state)return false;
    if(state.active){
      const sick=state.nearestSick;if(!sick)return false;const dev=developmentFor(sick),d=state.nearestDistance;
      const playerImmune=this.sim.disease.isImmune(p),careTarget=this.sim.familyIllness?.sickCareTarget?.(p,{radius:1.8});
      if(state.sickYoung.some(a=>a.id===sick.id)&&(sick.parentIds?.includes(p.id)||playerImmune)){
        if(d>1.8)this.renderer.guideTarget={x:sick.x,y:sick.y,label:`Sick G${sick.generation} young`};
        const action=d<=1.8?'E · check and reassure it':'stay close enough to help';const safety=playerImmune?' · recovered immunity lets you stay close':' · other susceptible family are making space';
        this.render('Marsh fever in the young',`G${sick.generation} ${dev.stage} · ${action}${safety}`,{compact:true});return true;
      }
      const young=state.healthyYoungCount?` · healthy young buffered ${state.protectedYoungCount}/${state.healthyYoungCount}`:'',immune=state.immuneCount?` · ${state.immuneCount} temporarily immune`:'';
      if(playerImmune){if(d>2.1)this.renderer.guideTarget={x:sick.x,y:sick.y,label:'Sick family'};this.render('Recovered immunity',`Marsh fever is still in the family · you can stay near the sick while ${state.distancingCount} susceptible relative${state.distancingCount===1?' keeps':'s keep'} space${young}`,{compact:true});return true}
      this.render('Marsh fever in the family',`G${sick.generation} ${dev.stage} #${sick.id} is sick · ${state.distancingCount} relative${state.distancingCount===1?' is':'s are'} keeping space${immune}${young} · avoid unnecessary crowding`,{compact:true});return true;
    }
    if(state.after){const immune=state.immuneCount?` · ${state.immuneCount} relative${state.immuneCount===1?' has':'s have'} temporary immunity`:'';this.render('Fever broke in the family',`Marsh fever has cleared · relatives are regrouping now that close contact is safer${immune}`,{compact:true});return true}
    return false;
  }

  renderExposure(p){
    const exposure=this.sim.exposure?.snapshot?.(p);if(!exposure?.urgent)return false;
    const shelter=this.sim.shelter?.nearest?.(p,{radius:Infinity,familyOnly:true})||null;
    if(shelter){const d=Math.hypot(p.x-shelter.x,p.y-shelter.y);if(d>1.7)this.renderer.guideTarget={x:shelter.x,y:shelter.y,label:'Shelter'};if(exposure.sheltered&&exposure.shelterLeaking){const label=this.sim.shelter.weatherLabel(shelter).toLowerCase(),action=this.sim.shelter.maintenanceAction(shelter)==='repair'?'repair the structure':'reinforce the roof';this.render('Shelter leaking',`${label} shelter · N · ${action} with nearby plant material`,{compact:true});return true}const verb=exposure.heatStress>exposure.coldStress?'cool down':'dry off and warm up';this.render(exposure.label,`${Math.round(exposure.wetness*100)}% soaked · ${d.toFixed(1)} tiles to shelter · ${verb} before ranging farther`,{compact:true});return true}
    const cover=exposure.cover>=.45?'Dense cover is helping, but a shelter would protect you better.':'Dense plants can break some rain; a family shelter gives real protection.';this.render(exposure.label,`${Math.round(exposure.wetness*100)}% soaked · ${cover}`,{compact:true});return true
  }

  renderFamilyWeather(p){
    const refuge=this.sim.familyWeather?.snapshot?.(p);if(!refuge||refuge.familyCount<2)return false;
    const sh=refuge.shelter,d=refuge.distance;if(d>1.7)this.renderer.guideTarget={x:sh.x,y:sh.y,label:'Family shelter'};
    if(refuge.gathering){this.render('Family seeking shelter',`${refuge.insideCount}/${refuge.familyCount} nearby family under cover${refuge.dependentCount?` · young ${refuge.dependentInside}/${refuge.dependentCount}`:''} · ${refuge.conditions.label} is interrupting low-priority outings`,{compact:true});return true}
    if(refuge.insideCount>=2){const condition=refuge.quality<.48?' · shelter is leaking':refuge.quality<.68?' · shelter is weathered':'';this.render('Storm refuge',`${refuge.insideCount}/${refuge.familyCount} nearby family under cover${refuge.dependentCount?` · young ${refuge.dependentInside}/${refuge.dependentCount}`:''}${condition}`,{compact:true});return true}
    return false;
  }

  renderStormAftermath(p){
    const after=this.sim.familyWeather?.aftermathStatus?.(p);if(!after)return false;
    if(after.pendingCount){const child=after.pending.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0],d=Math.hypot(child.x-p.x,child.y-p.y);this.renderer.guideTarget=d>1.8?{x:child.x,y:child.y,label:`G${child.generation} young`}:null;const action=d<=1.8?'E · check and reassure':'regroup with your young';this.render('Storm passed',`G${child.generation} ${developmentFor(child).stage} · ${action}${after.resumedCount?` · ${after.resumedCount} outing${after.resumedCount===1?'':'s'} reopening`:''}`,{compact:true});return true}
    const patch=this.sim.foraging?.routeSuggestion?.(p),rainPatch=patch&&this.sim.familyWeather?.postRainBoost?.(patch.kind)>0?patch:null;
    if(after.resumedCount||rainPatch){if(rainPatch){this.renderer.guideTarget={x:rainPatch.x,y:rainPatch.y,label:`${rainPatch.label} patch`};this.render('After the rain',`${after.resumedCount?`${after.resumedCount} family outing${after.resumedCount===1?'':'s'} resumed · `:''}${rainPatch.label} recovery may improve after the storm · verify the patch in person`,{compact:true});return true}this.render('Family regrouped',`${after.resumedCount} interrupted outing${after.resumedCount===1?'':'s'} resumed after sheltering · conditions are easing`,{compact:true});return true}
    return false;
  }

  renderInjury(p){
    const wound=this.sim.injury?.snapshot?.(p);if(!wound?.active)return false;
    const shelter=this.sim.shelter?.nearest?.(p,{radius:Infinity,familyOnly:true})||null,d=shelter?Math.hypot(p.x-shelter.x,p.y-shelter.y):Infinity;
    if(wound.mode==='shelter-rest'){this.render('Recovering from wounds',`${wound.label.toLowerCase()} · about ${wound.remainingDays}d to steady movement · quiet shelter rest speeds healing`,{compact:true});return true}
    if(wound.mode==='cover-rest'){this.render('Resting an injury',`${wound.label.toLowerCase()} · about ${wound.remainingDays}d remaining · dense cover helps while you stay still`,{compact:true});return true}
    if(shelter&&d<=18){this.renderer.guideTarget={x:shelter.x,y:shelter.y,label:'Family shelter'};this.render(wound.level==='severe'?'Badly wounded':'Wounded after attack',`${d.toFixed(1)} tiles to shelter · movement is slower · sprinting strains the injury`,{compact:true});return true}
    this.render(wound.label,`about ${wound.remainingDays}d recovery · slow down and rest in cover when safe · sprint only to escape`,{compact:true});return true;
  }


  renderSpeciesGoal(p){
    const goal=this.sim.speciesCoexistence?.goalFor?.(p);if(!goal)return false;this.renderer.guideTarget=goal.target?{...goal.target}:null;this.render(goal.title,`${goal.body} · Family Command stays on ${goal.label} unless you explicitly choose whole lineage.`,{compact:true});return true;
  }
  renderLifestyleGoal(p){
    const goal=this.sim.speciesLifestyle?.goalFor?.(p);if(!goal)return false;this.renderer.guideTarget=goal.target?{...goal.target}:null;this.render(goal.title,goal.body,{compact:true});return true;
  }
  // v1.33 Knowledge: a thirsty creature is guided only to water it knows itself; with none in
  // sight and none remembered it has to search. The founder's opening keeps its own guide.
  renderKnownWater(p){
    const spec=SPECIES[p.species],water=p.hydration/spec.maxHydration;if(water>.4||this.sim.world.isDrinkable(p.x,p.y))return false;
    if(this.sim.world.nearestDrinkable(p.x,p.y,6))return false;
    const known=this.sim.cognition?.knownWater?.(p);
    if(!known){this.renderer.guideTarget=null;this.render('Find water',`Thirsty · this creature knows no water nearby · search low, wet ground and banks · water ${Math.round(water*100)}%`,{compact:true});return true}
    this.renderer.guideTarget={x:known.x,y:known.y,label:'Known water'};
    this.render('Known water',`${known.distance.toFixed(1)} tiles · ${known.source==='taught'?'shown by its caregiver':'a bank it has drunk at'}${known.sureness<.5?' · an old memory':''} · E drinks there`,{compact:true});return true;
  }
  renderForagePatch(p){
    const spec=SPECIES[p.species],energy=p.energy/spec.maxEnergy;if(energy>.48||this.sim.playerFoodTarget(p))return false;
    const patch=this.sim.foraging?.routeSuggestion?.(p);if(!patch)return false;this.renderer.guideTarget={x:patch.x,y:patch.y,label:`${patch.label} patch`};
    const note=this.sim.foraging.projectedPatchNote(patch),confidence=patch.confidence<.5?'old memory':'learned patch';
    this.render(`Known ${patch.label} patch`,`${patch.distance.toFixed(1)} tiles · ${note} · ${confidence} · follow the guide or keep searching`,{compact:true});return true;
  }
  renderStrategyGoal(p,{branches=null}={}){
    const goal=this.sim.specialization?.playerChallenge?.(p);if(!goal||branches&&!branches.includes(goal.branch))return false;
    this.renderer.guideTarget=goal.target?{...goal.target}:null;this.render(goal.title,goal.body,{compact:true});return true;
  }
  findFood(a,radius){
    const sim=this.sim,w=sim.world,key=a.id+'|'+a.bodyPlan?.id+'|'+Math.floor(a.x)+'|'+Math.floor(a.y)+'|'+radius,cache=this.foodGuideCache;
    if(cache?.sim===sim&&cache.key===key&&performance.now()<cache.until)return cache.target;
    const nearby=sim.foraging.options(a);if(nearby.length){const meal=[...nearby].sort((p,q)=>q.needScore-p.needScore)[0],target={x:meal.i%w.n+.5,y:Math.floor(meal.i/w.n)+.5,kind:meal.kind};this.foodGuideCache={sim,key,target,until:performance.now()+750};return target}
    let best=null,bestScore=-Infinity;const diet=Object.entries(groundDiet(a));
    const minX=Math.max(1,Math.floor(a.x-radius)),maxX=Math.min(w.n-2,Math.ceil(a.x+radius)),minY=Math.max(1,Math.floor(a.y-radius)),maxY=Math.min(w.n-2,Math.ceil(a.y+radius));
    for(let y=minY;y<=maxY;y+=2)for(let x=minX;x<=maxX;x+=2){const d=Math.hypot(x+.5-a.x,y+.5-a.y);if(d>radius||!sim.canReach(a,x+.5,y+.5))continue;const i=w.idx(x,y);for(const [kind,eff] of diet){const amount=kind==='carrion'?w.carrion[i]:w.plants[kind]?.[i]||0,score=amount*eff-d*.018;if(amount>.16&&score>bestScore){bestScore=score;best={x:x+.5,y:y+.5,kind}}}}
    const wet=bestFreshwaterFood(sim,a,radius);if(wet&&wet.score>bestScore)best=wet;
    if(!best){const prey=sim.playerCombat.nearestPrey(a,radius);if(prey&&sim.canReach(a,prey.x,prey.y))best={x:prey.x,y:prey.y,kind:'prey'}}
    this.foodGuideCache={sim,key,target:best,until:performance.now()+750};return best;
  }
  detectHandoff(){
    const count=this.sim.lineage.handoffs.length;
    if(count>this.lastHandoffCount){
      const h=this.sim.lineage.handoffs[count-1],fromRec=this.sim.lineage.records.get(h.from),toRec=this.sim.lineage.records.get(h.to);
      const pressures=pressureSummaryText(this.sim.pressure?.lifetimeSummary?.(h.from,{limit:3}),{empty:'no sustained pressure dominated'});
      const cause=h.reason==='death'?friendlyCause(fromRec?.cause):'';
      if(h.newlyEstablished){this.sim.lineage.establishmentAnnounced=true;this.establishmentShown=true}
      const strategy=this.sim.specialization?.generationSummary?.(h.from)||'';
      const heir=this.sim.animals.find(a=>a.id===h.to)||null,careText=heir?this.sim.family.upbringingSummary(heir):'';
      const previous=this.sim.animals.find(a=>a.id===h.from)||null,divergenceText=heir?this.sim.divergence?.revealText?.(heir)||'':'',divergenceChip=heir?this.sim.divergence?.chipText?.(heir,previous)||'':'';
      const progression=heir?this.sim.generationProgress?.revealFor?.(heir):null,progressionText=progression?.text||'',progressionChip=progression?.chip||'';
      const affinity=heir?this.sim.populationMemory?.affinityFor?.(heir):null,memoryProfile=affinity?this.sim.populationMemory?.profile?.(affinity.key):null,populationHistoryText=memoryProfile?.days>=2?`${affinity.label} · ${memoryProfile.days} recorded days · ${memoryProfile.axes.slice(0,2).map(a=>a.label).join(' + ')}`:'',populationHistoryChip=populationHistoryText?`RAISED · ${affinity.label.toUpperCase()}`:'';
      const protoText=heir?this.sim.protoSpeciation?.revealText?.(heir)||'':'',protoChip=heir?this.sim.protoSpeciation?.chipText?.(heir,previous)||'':'';
      const speciesText=heir?this.sim.speciation?.revealText?.(heir)||'':'',speciesChip=heir?this.sim.speciation?.chipText?.(heir)||'':'';
      const lifestyleText=heir?this.sim.speciesLifestyle?.revealText?.(heir)||'':'',lifestyleChip=heir?this.sim.speciesLifestyle?.chipText?.(heir)||'':'';
      const bringsText=heir?relativeSummary(this.sim,heir):'';
      const inheritedMovement=previous&&heir?inheritedMovementDifference(this.sim,previous,heir):null;
      const reveal=buildGenerationReveal({bringsText,handoff:h,fromRecord:fromRec,toRecord:toRec,inheritedMovement,pressureText:pressures,causeText:cause,strategyText:strategy,careText,divergenceText,divergenceChip,progressionText,progressionChip,populationHistoryText,populationHistoryChip,protoText,protoChip,speciesText,speciesChip,lifestyleText,lifestyleChip});
      this.showGenerationReveal(reveal);
      this.lastHandoffCount=count;
    }
    const p=this.sim.player();if(p&&p.id!==this.lastActiveId)this.lastActiveId=p.id;
  }


  showGenerationReveal(model){
    if(!this.transition||!model)return;this.transitionWasPaused=this.sim.paused;this.sim.paused=true;
    this.transitionKicker.textContent=model.kicker;this.transitionTitle.textContent=model.title;this.transitionLead.textContent=model.lead;this.transitionBody.textContent='';
    this.transitionParentLabel.textContent=model.fromLabel;this.transitionChildLabel.textContent=model.toLabel;this.transitionReveal.hidden=false;
    this.currentReveal=model;drawLineagePortrait(this.transitionParent,model.fromGenes,{frame:1,dir:2,bodyPlan:model.fromPlan,adaptations:model.fromAdaptations,divergence:model.fromDivergence,protoTrait:model.fromProtoTrait,speciesBranch:model.fromSpeciesBranch,lifestyle:model.fromLifestyle});drawLineagePortrait(this.transitionChild,model.toGenes,{frame:1,dir:2,emphasis:true,bodyPlan:model.toPlan,adaptations:model.toAdaptations,divergence:model.toDivergence,protoTrait:model.toProtoTrait,speciesBranch:model.toSpeciesBranch,lifestyle:model.toLifestyle});
    this.transitionChanges.replaceChildren(...model.chips.map(text=>{const el=document.createElement('span');el.textContent=text;return el}));this.transitionChanges.hidden=false;
    this.transitionDetailsBody.replaceChildren();const grid=document.createElement('div');grid.className='transition-detail-grid';for(const [label,value] of model.details){const row=document.createElement('div'),b=document.createElement('b'),span=document.createElement('span');b.textContent=label;span.textContent=value;row.append(b,span);grid.append(row)}this.transitionDetailsBody.append(grid);this.transitionDetails.hidden=false;this.transitionDetails.open=false;
    this.renderEvolutionChoices();
    this.transitionContinue.textContent=model.button;
    this.transition.querySelectorAll('.eight-mark i').forEach((el,i)=>{el.classList.toggle('reached',i<Math.min(8,model.generation||1));el.classList.toggle('active',i===Math.min(7,(model.generation||1)-1))});
    this.transition.dataset.keepPaused='0';this.transition.hidden=false;
  }
  showTransition(title,body,button='Continue',keepPaused=false){
    if(!this.transition)return;this.transitionWasPaused=this.sim.paused;this.sim.paused=true;this.transitionKicker.textContent='NOTICE';this.transitionTitle.textContent=title;this.transitionLead.textContent='';this.transitionBody.textContent=body;this.transitionReveal.hidden=true;this.transitionChanges.hidden=true;if(this.transitionEvolution)this.transitionEvolution.hidden=true;this.transitionDetails.hidden=true;this.transitionDetails.open=false;this.transitionContinue.textContent=button;this.transition.dataset.keepPaused=keepPaused?'1':'0';this.transition.hidden=false;
  }
  continueTransition(){
    if(!this.transition||this.transition.hidden)return;const offer=this.sim.evolution?.offerFor?.();if(offer&&!offer.chosen){this.showToast('Choose one adaptation first.',1600,'warn');return}const keep=this.transition.dataset.keepPaused==='1';this.transition.hidden=true;if(!keep)this.sim.paused=this.transitionWasPaused;this.transition.dataset.keepPaused='0';this.sim.evolution?.clearChosen?.();
  }
  renderEvolutionChoices(){
    if(!this.transitionEvolution||!this.transitionEvolutionChoices)return;const offer=this.sim.evolution?.offerFor?.();if(!offer?.offers?.length){this.transitionEvolution.hidden=true;this.transitionContinue.disabled=false;return}this.transitionEvolution.hidden=false;this.transitionEvolutionChoices.replaceChildren(...offer.offers.map((o,i)=>{const b=document.createElement('button');b.type='button';b.className='evolution-choice';b.dataset.adaptation=o.id;b.innerHTML=`<i>${i+1}</i><span><strong>${o.name}</strong><small>${o.tier===2?`Second-stage ${o.branch} branch · `:''}${o.summary}</small><em>${o.tradeoff}</em></span>`;b.addEventListener('click',()=>this.chooseEvolution(o.id));return b}));this.transitionContinue.disabled=!offer.chosen;if(offer.chosen)this.markEvolutionChoice(offer.chosen)
  }
  chooseEvolution(id){
    const chosen=this.sim.evolution?.choose?.(id);if(!chosen)return false;const p=this.sim.player(),rec=p?this.sim.lineage.records.get(p.id):null;this.markEvolutionChoice(id);this.transitionContinue.disabled=false;if(this.currentReveal&&p){this.currentReveal.toAdaptations=[...(p.adaptations||[])];drawLineagePortrait(this.transitionChild,this.currentReveal.toGenes,{frame:1,dir:2,emphasis:true,bodyPlan:this.currentReveal.toPlan,adaptations:this.currentReveal.toAdaptations,divergence:this.currentReveal.toDivergence,protoTrait:this.currentReveal.toProtoTrait,speciesBranch:this.currentReveal.toSpeciesBranch,lifestyle:this.currentReveal.toLifestyle})}this.showToast(`${chosen.name} emerged.`,2200,'success');return true
  }
  markEvolutionChoice(id){for(const b of this.transitionEvolutionChoices?.querySelectorAll?.('.evolution-choice')||[]){const selected=b.dataset.adaptation===id;b.classList.toggle('selected',selected);b.disabled=!selected}}

  render(title,body,{step='',compact=false,next=''}={}){if(!this.tutorial)return;if(this.sim?.playerAutonomy&&/((press|·)\s+([A-Z]|Space|Shift)\b|^([A-Z]|Space|Shift) ·)/.test(body)&&!/take over/.test(body))body+=' · take over to do this';this.tutorial.hidden=false;this.tutorial.className=`objective${compact?' compact':''}`;this.tutorial.dataset.guideTitle=title;this.tutorial.dataset.guideBody=body;this.tutorial.dataset.guideCompact=compact?'1':'0';const p=this.sim.player?.(),progress=compact&&p?`G${Math.min(8,p.generation||1)}/8`:'·';this.tutorial.dataset.guideStep=step||progress;this.tutorial.title=compact?'Open task steps':'';this.tutorial.setAttribute('role',compact?'button':'region');this.tutorial.tabIndex=compact?0:-1;this.tutorial.setAttribute('aria-label',compact?title+' - open task steps':title);this.tutorial.innerHTML=`<div class="objective-step">${step||progress}</div><div><strong>${title}${compact&&next?`<b class="objective-next">· ${next}</b>`:''}</strong><span>${body}</span></div>`}
  showToast(text,ms=3500,tone='info',channel=tone==='warn'?'critical':'action'){this.notifications.post(text,ms,tone,channel)}
}
function friendlyCause(c){return c==='predation'?'predation':c==='starvation'?'starvation':c==='age'?'old age':c||'health collapse'}
