import {processingCapacity,processingCapacityMessage} from '../sim/processing-capacity.js';
import {creatureIdentity} from './creature-identity.js';
import {escapePanel,knowledgeFold,updateKnowledgeHTML} from './knowledge-panel.js';
import {reproductiveCompatibility,reproductiveGenomeFor} from '../reproduction/reproductive-compatibility.js';
import {reciprocalMateChoice,preferenceSummary,mateOptionAssessment,LOCAL_ASSORTMENT} from '../reproduction/mate-preferences.js';
import {availableCourtshipMoves} from '../reproduction/courtship-performance.js';
import {reproductiveMode,conceptionMode} from '../reproduction/reproductive-anatomy.js';
import {samePhysicalBuild} from '../lineage/body-inheritance.js';
import {comparePhysicalBuilds} from '../lineage/breeding-guidance.js';
import {partEffectFactors} from '../lineage/part-abilities.js';
import {CFG,PLANTS} from '../sim/config.js';
import {SPECIES} from '../organisms/species.js';
import {traitMidpoint,geneticContrast,maturityLabel} from '../reproduction/reproduction.js';
import {developmentFor} from '../family/family.js';
import {nearestThreat,directionWord} from './readability.js';
import {dominantTraits,founderShift,compareGenes,traitListText,strongestTraitText,visualChangeText} from '../lineage/adaptation.js';
import {playerMoodLabel} from '../render/life.js';
import {vitalModel,compactFamilyLabel,contextTone} from './presentation.js';
import {hasAdaptation,ADAPTATIONS} from '../lineage/evolution.js';
import {tasteText} from '../reproduction/mate-preferences.js';
import {parentalAdaptationText} from './parental-adaptations.js';

// The E prompt names the action E will actually run (the context tray's resolved choice), so the
// prompt and the key can never disagree. Danger/combat prompts (not "E · ...") are unchanged.
let interactPromptSource=null;
export function setInteractPromptSource(fn){interactPromptSource=fn}
function eKeyPrompt(hint){if(!/^E · /.test(hint)||!interactPromptSource)return hint;const label=interactPromptSource();if(!label)return hint;return 'E · '+label+(hint.includes('Q switch')?' · Q switch':hint.includes('reveals cover')?' · reveals cover':'')}
export function updateHUD(sim,{renderer=null,mateOpen=false,mindOpen=false,territoryOpen=false,shelterOpen=false,migrationOpen=false,ecologyOpen=false,helpOpen=false,guideOpen=false,journalOpen=false,commandMode=false}={}){
  const clock=document.querySelector('#clock'),ps=document.querySelector('#playerStats'),pop=document.querySelector('#populations'),help=document.querySelector('#help'),guide=document.querySelector('#guide'),context=document.querySelector('#context'),mate=document.querySelector('#mate'),mind=document.querySelector('#mind'),territory=document.querySelector('#territory'),shelter=document.querySelector('#shelter'),migration=document.querySelector('#migration');
  let capacityNotice=document.querySelector('#processingCapacity');
  const capacity=processingCapacity(sim);
  const capacityMessage=processingCapacityMessage(capacity);
  if(capacityMessage&&!capacityNotice){capacityNotice=document.createElement('div');capacityNotice.id='processingCapacity';capacityNotice.setAttribute('role','status');capacityNotice.style.cssText='position:fixed;bottom:90px;left:50%;transform:translateX(-50%);max-width:min(620px,90vw);padding:10px 14px;border:1px solid #bf9a55;border-radius:8px;background:#25251ff2;color:#ffe4ae;font:13px/1.4 sans-serif;z-index:90;pointer-events:none';document.querySelector('#app')?.appendChild(capacityNotice)}
  if(capacityNotice){capacityNotice.hidden=!capacityMessage;capacityNotice.textContent=capacityMessage}
  const p=sim.player(),counts=sim.population(),day=((sim.day-1)%CFG.seasonDays)+1;
  if(clock)clock.innerHTML=`<span class="season-mark">${titleCase(sim.season)}</span><strong>Day ${day}</strong><span>Y${sim.year}</span>${sim.paused?'<em>Paused</em>':''}`;
  if(p){
    const spec=SPECIES[p.species],dev=developmentFor(p),preg=sim.family.pregnancyProgress(p),children=sim.family.livingChildren(p),safe=sim.isOpeningProtected?.(p);
    const familyCount=children.length,laidEggs=(sim.eggs||[]).filter(e=>e.motherId===p.id).length,familyTitle=preg?.progress>0?`${p.pregnant?.mode==='egg'?'Egg development':'Pregnancy'} ${Math.round(preg.progress*100)}%`:laidEggs?`${laidEggs} incubating egg${laidEggs===1?'':'s'}`:familyCount?`${familyCount} living child${familyCount===1?'':'ren'}`:'';
    const control=sim.familyControlStatus?.()||{count:1,index:0,autonomy:false},controlTitle=control.count>1?`Tab switches family · ${control.index+1}/${control.count}`:(control.autonomy?'Automation on':'');
    const health=vitalModel('health','Health',p.health/100,Math.round(p.health));
    const energy=vitalModel('energy','Energy',p.energy/spec.maxEnergy,Math.round(p.energy/spec.maxEnergy*100));
    const water=vitalModel('water','Water',p.hydration/spec.maxHydration,Math.round(p.hydration/spec.maxHydration*100));
    const markup=`<div class="lineage-head">
        <div class="lineage-sigil" aria-label="Generation ${p.generation}"><span>G</span><b>${p.generation}</b></div>
        <div class="lineage-copy"><strong>${dev.stage}</strong>${hudDoingLine(sim,p)||hudHabitLine(sim,p)}</div>
        ${controlTitle?`<div class="control-chip ${control.autonomy?'auto':''}" title="${controlTitle}">${control.autonomy?'AUTO':`TAB ${control.index+1}/${control.count}`}</div>`:familyTitle?`<div class="family-chip" title="${familyTitle}"><b>${preg?.progress>0?'•':familyCount}</b></div>`:''}
      </div>
      <div class="needs" aria-label="Survival needs">${compactVital(health)}${compactVital(energy)}${compactVital(water)}${breathVital(sim,p)}</div>
      ${priorityHudAlert(sim,p,safe)}`;
    if(ps._lastMarkup!==markup){const focused=ps.contains(document.activeElement)?document.activeElement:null,kind=focused?.classList.contains('need')?['health','energy','water','breath'].find(k=>focused.classList.contains(k)):null;ps.innerHTML=markup;ps._lastMarkup=markup;if(kind)ps.querySelector('.need.'+kind)?.focus({preventScroll:true})}
  }else {ps._lastMarkup=null;ps.innerHTML='<div class="lineage-head ended"><div class="lineage-sigil"><span>G</span><b>×</b></div><div class="lineage-copy"><strong>Family ended</strong><span>R · new run</span></div></div>';}
  if(pop){pop.hidden=!ecologyOpen;if(ecologyOpen){
    const rows=Object.entries(SPECIES).map(([id,s])=>`${s.label} ${counts[id]||0}`),dir=sim.familyDirectives?.status?.()||{},reach=sim.expansion?.snapshot?.(),sustain=sim.sustainability?.snapshot?.(),tree=sim.evolutionTree?.leadershipSnapshot?.(p),life=sim.speciesLifestyle?.lifestyleFor?.(p),centerEco=sim.populationEcology?.snapshot?.();
    const familySummary=sim.family.relationshipSummary(p);
    const total=Object.values(counts).reduce((a,b)=>a+(b||0),0),activeTaxon=tree?.label||'GenVo',rangeStatus=sustain?.status?.label||'UNMEASURED';
    const evolution=[behaviorTendencyText(sim),lineageDivergenceText(sim),speciesLifestyleText(sim),protoSpeciationText(sim),speciationText(sim)].join('\n\n');
    const ecology=[populationCenterEcologyText(sim),populationPressureMemoryText(sim),speciesCoexistenceText(sim)].join('\n\n');
    const treeText=[evolutionaryTreeText(sim),speciesLeadershipText(sim)].join('\n\n');
    const history=`Births ${sim.stats.births} · Deaths ${sim.stats.deaths} · Incubating eggs ${(sim.eggs||[]).length} · Nests ${(sim.nests||[]).length}\nSeeds carried ${Math.round(sim.dispersal?.stats?.ingested||0)} · established ${Math.round((sim.dispersal?.stats?.germinated||0)*100)/100}\nMarsh fever cases ${sim.disease?.stats?.infections||0} · recoveries ${sim.disease?.stats?.recoveries||0} · deaths ${sim.stats.byCause.disease||0}`;
    renderReadablePanel(pop,`<header class="panel-head"><div><span>POPULATION</span><strong>Year ${sim.year}</strong></div><small>O · close</small></header>
      <div class="panel-summary">
        ${summaryCard('LIVING',`${total} animals`,rows.join(' · '))}
        ${summaryCard('ACTIVE TAXON',activeTaxon,life?.label?`${life.label} lifestyle`:'lifestyle not established')}
        ${summaryCard('RANGE',rangeStatus,`${Math.round((sustain?.food||0)*100)}% forage · ${sustain?.competitors||0} competitors`)}
        ${summaryCard('LINEAGE GUIDANCE',dir.short||'Autonomous',`${reach?.adults||0} lineage adults · ${reach?.cells?.length||0} familiar cells`)}
        ${summaryCard('ACTIVE FAMILY',`${familySummary.active} member${familySummary.active===1?'':'s'}`,`${familySummary.dependents} dependents · nearby relatives and actual care or partner bonds`)}
      </div>
      ${sectionBlock('Evolution and lifestyles',evolution,false)}
      ${sectionBlock('Population centers and ecology',ecology,false)}
      ${sectionBlock('Evolutionary tree and leadership',treeText,false)}
      ${sectionBlock('Births, dispersal, and illness',history,false)}
      <footer class="panel-foot">Scroll for more · click a section to expand or collapse</footer>`);
  }}
  if(help)help.hidden=!helpOpen;
  updateTaskGuide(guide,guideOpen,sim);
  updateQuickMenu({guideOpen,journalOpen,territoryOpen,ecologyOpen,helpOpen,commandMode,sim});
  updateContext(context,sim,p,renderer,commandMode);
  updateMate(mate,sim,mateOpen);
  updateMind(mind,sim,mindOpen);
  updateTerritory(territory,sim,territoryOpen);
  updateShelter(shelter,sim,shelterOpen);
  updateMigration(migration,sim,migrationOpen);
  for(const [el,show,title,summary] of [
   [mate,mateOpen,'Nearby partners',p?(()=>{const target=sim.reproduction.selectedMate();if(!target)return 'No ready, unrelated compatible partners nearby. Explore and check again.';const state=sim.reproduction.courtshipAvailability({targetId:target.id});return creatureIdentity(sim,target).label+'. '+(state.enabled?'Court can begin an encounter. Acceptance is reciprocal.':state.reason)})():'Family line ended.'],
   [mind,mindOpen,'Creature memory',p?(()=>{const v=sim.cognition.snapshot(p),places=sim.cognition.knownPlaces(p),patches=sim.foraging.knownPatches(p);return `${v.temperament.label} temperament. Knows ${places.filter(x=>x.type==='water').length} water banks and ${patches.length} food patches. ${places.some(x=>x.type==='danger')?'Remembers places where danger struck.':'No danger places remembered yet.'}`})():'Family line ended.'],
   [shelter,shelterOpen,'Family shelter',p?(()=>{const v=sim.shelter.snapshot(p);return v.exists?`${v.inside?'Under cover':'Outside shelter'} · ${v.weatherLabel}. ${v.intruder?'An intruder is nearby. ':''}Hungry family can eat stored food. N repairs; F stores nearby food.`:v.canBuild.ok?'Ready to build here · N.':v.canBuild.reason})():'Family line ended.'],
   [migration,migrationOpen,'Seasonal routes',p?(()=>{const v=sim.migration.snapshot(p);return v.reason||v.recommendation?.reason||'No route estimate yet.'})():'Family line ended.']
  ])if(el&&show){const raw=el._rawKnowledge;renderReadablePanel(el,`<header class="panel-head"><div><span>FIELD KNOWLEDGE</span><strong>${escapePanel(title)}</strong><span class="knowledge-subject">${escapePanel(creatureIdentity(sim,el===mate?sim.reproduction.selectedMate():p).label)}</span></div></header><div class="knowledge-summary">${escapePanel(summary)}</div>${knowledgeFold('Biological details & recorded observations',raw)}`)}

}



function escapeHtml(value=''){return String(value).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]))}
function summaryCard(label,value,detail=''){return`<div><b>${escapeHtml(label)}</b><strong>${escapeHtml(value)}</strong>${detail?`<span>${escapeHtml(detail)}</span>`:''}</div>`}
function renderReadablePanel(el,html){el.classList.add('knowledge-panel');html=html.replace('</header>',`<button type="button" data-knowledge-close="${escapePanel(el.id)}" data-focus-key="close" aria-label="Close ${escapePanel(el.id)} panel">Close</button></header>`);updateKnowledgeHTML(el,html,{preserveTextNodes:el.id==='mate'})}
function sectionBlock(title,text,open=false){return`<details data-section="${escapeHtml(title)}"${open?' open':''}><summary data-focus-key="${escapeHtml(title)}">${escapeHtml(title)}</summary><div class="panel-section">${escapeHtml(text||'Nothing recorded yet.')}</div></details>`}

function behaviorTendencyText(sim){
  const t=sim.tendency?.snapshot?.();if(!t)return'Lineage behavior unmeasured';
  const bar=v=>{const n=Math.max(0,Math.min(8,Math.round(v*8)));return '■'.repeat(n)+'·'.repeat(8-n)};
  if(!t.dominant||t.stage===0)return`Lineage behavior UNDECIDED · independent ${bar(t.shares.forager)} · colony ${bar(t.shares.colony)}`;
  const def=t.definition,label=t.stage>=2?def.label.toUpperCase():`${def.label.toUpperCase()} FORMING`;
  return`Lineage behavior ${label}
  independent ${bar(t.shares.forager)} · colony ${bar(t.shares.colony)}
  ${def.summary}`;
}


function populationCenterEcologyText(sim){
  const s=sim.populationEcology?.snapshot?.();if(!s?.total)return'Center ecology NONE YET';
  const rows=s.centers.slice(0,5).map(c=>{const kind=c.kind==='range-band'?'RANGING':c.kind==='satellite-colony'?'SATELLITE':'SPECIES SETTLEMENT',cross=c.lineageCompetitors?` · cross-taxon ${c.lineageCompetitors}`:'';return`  #${c.id} ${kind} ${c.status.label} · carrying ${c.load}/${c.capacity} · forage ${Math.round(c.food*100)}% · competitors ${c.competitors}${cross}`});
  return`Center ecology ${s.strong+s.viable} viable${s.contested+s.critical?` · ${s.contested+s.critical} pressured`:''}
${rows.join('\n')}`;
}


function populationPressureMemoryText(sim){
  const memory=sim.populationMemory;if(!memory)return'Pressure memory unavailable';const lines=memory.lines?.()||[];if(!lines.length)return'Pressure memory NOT YET ESTABLISHED';
  const split=memory.divergence?.()?.[0]||null;return`Population pressure memory${split?` · separation ${Math.round(split.score*100)}%`:''}
${lines.slice(0,4).map(v=>`  ${v}`).join('\n')}`;
}


function protoSpeciationText(sim){
  const ctrl=sim.protoSpeciation;if(!ctrl)return'Proto-divergence unavailable';
  const lines=ctrl.lines?.()||[],active=sim.player?.(),trait=active?ctrl.traitFor?.(active):null;
  if(!lines.length)return'Proto-divergence NONE YET · separated populations need sustained different pressure before descendants inherit a local trait';
  const split=sim.speciation?.snapshots?.().some(e=>e.state?.recognized);return`Proto-divergence ${split?'HISTORY':'BEGINNING'}${trait?` · active ${ctrl.mechanicsText(active)}`:''}
${lines.slice(0,4).map(v=>`  ${v}`).join('\n')}
  Traits can reinforce, weaken, or mix through gene flow; ${split?'a sustained branch has crossed the species threshold.':'GenVo remains one species.'}`;
}


function evolutionaryTreeText(sim){
  const tree=sim.evolutionTree;if(!tree)return'Evolutionary tree unavailable';const lines=tree.treeLines?.()||[];
  return`${tree.summaryLine?.()||'Evolutionary tree'}\n${lines.slice(0,7).map(v=>`  ${v}`).join('\n')}`;
}


function speciesLeadershipText(sim){
  const active=sim.player?.(),tree=sim.evolutionTree,snap=tree?.leadershipSnapshot?.(active);if(!snap)return'Species leadership unavailable';
  if(!snap.multipleTaxa)return`Species leadership ONE TAXON · family guidance remains lineage-wide`;
  const scope=sim.familyDirectives?.scopeMeta?.()||{scope:'taxon',label:snap.label},shared=snap.sharedPopulations.length?`${snap.sharedPopulations.length} shared population center${snap.sharedPopulations.length===1?'':'s'}`:'no shared population centers',contact=snap.closeContacts?`${snap.closeContacts} close cross-taxon contact${snap.closeContacts===1?'':'s'}`:'little close cross-taxon contact';
  return`Species leadership ${snap.label.toUpperCase()} · living ${snap.living} · guidance ${scope.scope==='taxon'?'THIS TAXON':'WHOLE LINEAGE'}
  ${shared} · ${contact}
  Species guidance follows the active creature by default; whole-lineage guidance is an explicit command-wheel choice.`;
}

function speciesCoexistenceText(sim){
  const ctrl=sim.speciesCoexistence;if(!ctrl)return'Species coexistence unavailable';const lines=ctrl.lines?.()||[];if(lines.length<2)return'Species coexistence ONE TAXON';const active=ctrl.goalFor?.(sim.player?.());return`${ctrl.summaryLine?.()||'Species coexistence'}${active?` · active goal ${active.title}`:''}
${lines.slice(0,5).map(v=>`  ${v}`).join('\n')}
  Cross-taxon residents consume the same forage and reduce local carrying quality; taxon settlements use branch-scoped workers and shelter access.`;
}


function speciesLifestyleText(sim){
  const ctrl=sim.speciesLifestyle;if(!ctrl)return'Species lifestyles unavailable';const lines=ctrl.lines?.()||[];
  return`${ctrl.summaryLine?.()||'Species lifestyles'}
${lines.slice(0,5).map(v=>`  ${v}`).join('\n')}
  Lifestyles emerge from sustained branch behavior and habitat use; they are not menu-selected adaptations.`;
}

function speciationText(sim){
  const ctrl=sim.speciation;if(!ctrl)return'Speciation threshold unavailable';const lines=ctrl.lines?.()||[];
  if(!lines.length)return'Speciation threshold NONE YET · a separated population needs several reinforced generations and low gene flow';
  return`${ctrl.statusLine?.()||'Speciation threshold forming'}
${lines.slice(0,4).map(v=>`  ${v}`).join('\n')}`;
}

function lineageDivergenceText(sim){
  const living=sim.animals.filter(a=>a.alive&&a.lineage&&a.species==='genvo'&&sim.divergence?.formFor?.(a)),counts={forager:0,colony:0};for(const a of living){const kind=sim.divergence.formFor(a).kind;if(kind in counts)counts[kind]++}
  const active=sim.player?.(),profile=sim.divergence?.formFor?.(active);if(!living.length)return'Inherited form NONE YET · sustained family behavior can begin shaping G2 descendants';
  const activeText=profile?sim.divergence?.mechanicsText?.(active)||profile.label:'active body has no inherited form';
  const unlocks=sim.generationProgress?.unlockSummary?.()||[],centers=sim.generationProgress?.centerSummary?.()||'';return`Inherited forms FORAGER ${counts.forager} · COLONY ${counts.colony}
  active ${activeText}${unlocks.length?`
  generation gains ${unlocks.join(' · ')}`:''}${centers?`
  ${centers}`:''}`;
}


function updateTaskGuide(el,open,sim){
  if(!el)return;el.hidden=!open;if(!open)return;
  const objective=document.querySelector('#tutorial'),title=objective?.dataset?.guideTitle||'Current task',body=objective?.dataset?.guideBody||'Keep exploring. The task guide updates as your lineage changes.',step=objective?.dataset?.guideStep||'';
  const pieces=body.split(' · ').map(v=>v.trim()).filter(Boolean);
  const controls=pieces.filter(v=>/\b(WASD|arrows?|press|\b[A-Z]\b|Shift|follow|bring|stand|build|store|explore|court|drink|feed|practice|room|shelter|guide|search|run|hide|bite|handoff|transfer)\b/i.test(v));
  const state=pieces.filter(v=>!controls.includes(v));
  let lessonBlock='';
  if(title==='Teach the young'){const p=sim.player?.(),child=p?[...sim.family.livingChildren(p)].sort((a,b)=>b.age-a.age)[0]:null,learning=child?sim.family.learningProfile(child):null;if(learning){const lessonRows=[['water','Water','Walk together to a drinkable bank, then E to drink.'],['food','Food','Let the young follow while you eat.'],['shelter','Shelter','Bring the young back to a family shelter.'],['danger','Danger','Keep it nearby. Let a Stalker notice you, then sprint away or defend. Fleeing counts.']];lessonBlock=`<div class="lesson-grid">${lessonRows.map(([id,label,how])=>`<div class="lesson-row ${learning.lessons[id]>0?'done':learning.next===id?'next':''}"><i></i><b>${label}</b><span>${learning.lessons[id]>0?'learned':how}</span></div>`).join('')}</div>`}}
  el.innerHTML=`<div class="task-guide-head"><span>${step&&step!=='·'?step:'NOW'}</span><b>CURRENT TASK</b></div><strong>${title}</strong>${controls.length?`<div class="task-guide-how"><b>How</b>${controls.map(v=>`<p>${v}</p>`).join('')}</div>`:`<p class="task-guide-body">${body}</p>`}${lessonBlock}${state.length?`<div class="task-guide-state">${state.map(v=>`<span>${v}</span>`).join('')}</div>`:''}<small>Click the target icon or the objective card to close this guide.</small>`;
}

function updateQuickMenu({guideOpen=false,journalOpen=false,territoryOpen=false,ecologyOpen=false,helpOpen=false,commandMode=false,sim=null}={}){
  const states={guide:guideOpen,journal:journalOpen,territory:territoryOpen,population:ecologyOpen,help:helpOpen};
  for(const b of document.querySelectorAll('#quickMenu button[data-panel]')){const active=!!states[b.dataset.panel];b.classList.toggle('active',active);b.setAttribute('aria-pressed',active?'true':'false')}
  const command=document.querySelector('#quickMenu button[data-command="leadership"]');if(command){command.classList.toggle('active',commandMode);command.setAttribute('aria-pressed',commandMode?'true':'false')}
  const autonomy=document.querySelector('#quickMenu button[data-action="autonomy"]');if(autonomy){const on=!!sim?.playerAutonomy;autonomy.classList.toggle('active',on);autonomy.setAttribute('aria-pressed',on?'true':'false');autonomy.title=`Automation: ${on?'on':'off'}`}
}

function updateContext(context,sim,p,renderer,commandMode=false){
  if(!context)return;
  const scope=sim.familyDirectives?.scopeMeta?.();let prompt=commandMode?`CHOOSE GROUND${scope?.multipleTaxa?` · ${scope.scope==='taxon'?scope.label.toUpperCase()+' ONLY':'WHOLE LINEAGE'}`:''} · click or tap · R cancel`:(eKeyPrompt(sim.interactionHint?.()||''));
  const tutorialStage=sim.uiTutorialStage||'done';
  if(p&&!commandMode){
    const sp=SPECIES[p.species],wr=p.hydration/sp.maxHydration,er=p.energy/sp.maxEnergy,threat=nearestThreat(sim,p,8*(partEffectFactors(p)?.threatSense??1));
    const swimming=!!sim.world.water[sim.world.idx(p.x,p.y)]&&sim.canSwim?.(p);
    const recentHit=sim.lastPlayerDamage&&sim.tickCount-sim.lastPlayerDamage.tick<=CFG.simHz*2?sim.lastPlayerDamage:null;
    const stance=sim.playerCombat?.status?.(p),winded=sim.exertion?.isWinded?.(p);
    if(recentHit)prompt=recentHit.brace==='frontal'?`BRACED · -${Math.round(recentHit.amount)} · SPACE BITE NOW`:`HIT · -${Math.round(recentHit.amount)}${recentHit.brace?' · WRONG ANGLE':''} · SPACE BITE · J BRACE · SHIFT RUN${hasAdaptation(p,'mobbing-instinct')?' · X RALLY':hasAdaptation(p,'alarm-pulse')?' · X ALARM':''}`;
    else if(stance?.bracing)prompt='BRACING · face the charge · release your hold to move freely';
    else if(p.hidden)prompt=threat&&sim.camouflageConceals?.(p,threat.animal,threat.distance)?'HIDDEN · stay still · V emerge':'HIDDEN · something is very close · V emerge';
    else if(threat&&!sim.isOpeningProtected?.(p)&&threat.distance<7){
      const encounter=sim.predator?.playerStatus?.(p)||null,multi=encounter?.threatCount>1?` · ${encounter.threatCount} STALKERS`:'';
      if(encounter?.hunterId===threat.animal.id&&encounter.phase==='windup')prompt=`SIDESTEP MARKED LANE${multi} · J BRACE FACING IT · SPACE COUNTER IF CLOSE${hasAdaptation(p,'mobbing-instinct')?' · X RALLY':hasAdaptation(p,'alarm-pulse')?' · X ALARM':''}`;
      else if(encounter?.hunterId===threat.animal.id&&encounter.phase==='charge')prompt=`CROSS THE CHARGE LANE${multi} · OR J BRACE FACING IT${hasAdaptation(p,'mobbing-instinct')?' · X RALLY':''}`;
      else if(encounter?.hunterId===threat.animal.id&&encounter.phase==='recover')prompt=threat.distance<1.9?`OPENING${multi} · SPACE BITE OR RUN`:`MAKE DISTANCE${multi} · BREAK PURSUIT`;
      else if(encounter?.hunterId===threat.animal.id&&encounter.pursuit==='search')prompt=`IT LOST SIGHT OF YOU${multi} · STAY QUIET IN COVER OR SLIP AWAY`;
      else if(encounter?.hunterId===threat.animal.id&&encounter.pursuit==='chase'&&threat.distance>=1.9)prompt=winded?`STALKER CHASING${multi} · WINDED · REACH DENSE PLANTS`:`STALKER CHASING${multi} · SHIFT SPRINT · DENSE PLANTS BREAK SIGHT`;
      else prompt=threat.distance<1.9?`${threat.label.toUpperCase()} CLOSE${multi} · SPACE BITE · J BRACE · SHIFT RUN${hasAdaptation(p,'mobbing-instinct')?' · X RALLY':hasAdaptation(p,'alarm-pulse')?' · X ALARM':''}`:`${threat.label.toUpperCase()} ${directionWord(p,threat.animal).toUpperCase()}${multi} · RUN · SHIFT${hasAdaptation(p,'mobbing-instinct')?' · X RALLY':hasAdaptation(p,'alarm-pulse')?' · X ALARM':hasAdaptation(p,'camouflage-mantle')?' · V HIDE':''}`
    }
    else if(winded&&!prompt)prompt='WINDED · walk to catch your breath';
    else if(swimming&&!prompt)prompt=sim.speciesLifestyle?.lifestyleFor?.(p)?.id==='aquatic'?'AQUATIC · water travel is efficient · long dry-land travel costs more':'SWIMMING · slower travel · reach dry ground before energy runs low';
    else if(p.health<30)prompt='HEALTH LOW · Find safety';
    else if(wr<.22&&!prompt)prompt='WATER LOW · follow the cyan cue';
    else if(er<.22&&!prompt)prompt='ENERGY LOW · follow the green cue';
    else if(!prompt&&hasAdaptation(p,'camouflage-mantle')&&sim.coverAt?.(p)>=.36)prompt='V · Hide in cover';
    else if(!prompt&&hasAdaptation(p,'grasping-limbs'))prompt='Z · Carry / drop food';
    // During the opening goals, verbs appear contextually near the creature instead of being gated by a step.
    if(tutorialStage==='welcome'||tutorialStage==='briefing')prompt='';
    else if(tutorialStage==='goals'&&!prompt&&sim.territory?.state?.(p)?.established&&!sim.shelter?.nearest?.(p,{radius:Infinity,familyOnly:true})&&sim.shelter?.canBuildHere?.(p)?.ok)prompt='N · BUILD FAMILY SHELTER';
  }
  context.hidden=!prompt;
  if(!prompt)return;
  context.textContent=prompt;
  context.dataset.tone=contextTone(prompt);
  context.style.left='50%';context.style.top='auto';context.style.bottom='50px';
}

function priorityHudAlert(sim,p,safe=false){
  const disease=sim.disease?.snapshot?.(p);
  if(disease?.infected)return `<div class="hud-alert danger"><i></i><b>${disease.label||'Sick'}</b><span>G${p.generation}</span></div>`;
  const injury=sim.injury?.snapshot?.(p);
  if(injury?.active)return `<div class="hud-alert ${injury.level==='severe'?'danger':'warn'}"><i></i><b>${injury.label}</b><span>${injury.remainingDays}d</span></div>`;
  const exposure=sim.exposure?.snapshot?.(p);
  if(exposure?.severe||exposure?.urgent)return `<div class="hud-alert warn"><i></i><b>${exposure.label}</b></div>`;
  const child=sim.family?.priorityChild?.(p);
  if(child?.urgent)return `<div class="hud-alert warn"><i></i><b>Young need you</b><span>G${child.child?.generation||p.generation+1}</span></div>`;
  const familyIllness=sim.familyIllness?.snapshot?.(p);
  if(familyIllness?.active)return `<div class="hud-alert warn"><i></i><b>Family fever</b><span>${familyIllness.infectedCount} sick</span></div>`;
  return'';
}

// v1.30: the strongest habit of the controlled creature, shown only once one exists.
// v1.33.4: in AUTO the HUD says what the creature is doing right now.
// v1.33.5: who a relative is when you switch to it: its settled habits and what it knows.
export function relativeSummary(sim,a){
  if(!a)return'';const habits=sim.habits?.summary?.(a,{limit:2})||'',parts=[];if(habits&&!/^no settled|^still copying/.test(habits))parts.push(habits);else parts.push('no settled habits yet');
  const places=sim.cognition?.knownPlaces?.(a)||[],known=places.filter(p=>p.type!=='danger').length+(sim.foraging?.knownPatches?.(a)||[]).length,fears=places.filter(p=>p.type==='danger').length;
  parts.push(known?`knows ${known} place${known===1?'':'s'}`:'knows no places yet');if(fears)parts.push(`fears ${fears}`);
  return parts.join(' · ');
}
export function hudDoingLine(sim,p){if(!sim.playerAutonomy||!p?.intent)return'';const text=p.target?.avoiding?'Steering clear of a feared place':String(friendlyIntent(p.intent)||'').replace(/\s+(independently|by direction|on its own|as directed|with the family|for the family)(?:\s.*)?$/i,'');return text?`<span class="habit-line doing" title="What it is doing">now: ${text}</span>`:''}
function hudHabitLine(sim,p){const text=sim.habits?.summary?.(p,{limit:1})||'';return text&&!/^no settled|^still copying/.test(text)?`<span class="habit-line" title="Habit">${text}</span>`:''}
// Breath is short-term exertion (sprint, brace, attack). It refills quickly while walking.
function breathVital(sim,p){
  const st=sim.exertion?.status?.(p);if(!st)return'';
  const model=vitalModel('breath','Breath',st.ratio,Math.round(st.ratio*100));
  if(st.winded){model.tone='critical';return compactVital(model).replace(`>${model.value}%</em>`,'>winded</em>')}
  if(st.ratio>=.995)model.tone='stable';else if(model.tone==='stable')model.tone='low';
  return compactVital(model);
}
function compactVital(model){
  const cells=Array.from({length:model.count},(_,i)=>`<i class="${i<model.filled?'on':''}"></i>`).join('');
  return `<div class="need ${model.kind} ${model.tone}" tabindex="0" role="meter" aria-label="${model.label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${model.value}" title="${model.label} ${model.value}% · ${{health:'Injury lowers health; wounds need time and recovery.',energy:'Eat compatible food to restore energy.',water:'Drink beside water to restore hydration.',breath:'Rest while still to regain breath; fighting and sprinting spend it.'}[model.kind]}"><span>${model.label}</span><b aria-hidden="true">${cells}</b><em>${model.tone==='stable'?'':model.value+'%'}</em></div>`;
}


function socialLine(sim,p){
  const s=sim.social?.snapshot?.(p);if(!s||s.size<2)return'';
  const alarm=s.alarmSpecies?`alarm · ${SPECIES[s.alarmSpecies]?.label||s.alarmSpecies}`:'calm';
  const guide=s.guideId==null?'':s.guideId===p.id?' · guiding group':` · guide #${s.guideId}`;
  return `<div class="socialline ${s.alarmSpecies?'alarm':''}"><span>${s.label}</span><b>${s.size} nearby · ${alarm}${guide}</b></div>`;
}

function diseaseLine(sim,p){
  const d=sim.disease?.snapshot?.(p),care=sim.illness?.snapshot?.(p);if(!d?.infected)return d?.immune&&d.immuneDays>0?`<div class="illness immune">Recovered immunity · ${d.immuneDays}d${care?.recovering?' · fever recently broke':''}</div>`:'';
  const pct=d.duration?Math.min(100,Math.round(d.days/d.duration*100)):0,mode=care?.label?` · ${care.label.toLowerCase()}`:'',help=care?.bonusDays?` · ${care.bonusDays}d shortened by rest`:care?.supportedDays?` · ${care.supportedDays} supported day${care.supportedDays===1?'':'s'}`:'';
  return `<div class="illness"><b>${d.label||'Infection'}</b><span>day ${d.days}/${d.duration} · ${pct}% course${mode}${help}</span></div>`;
}



function injuryLine(sim,p){
  const w=sim.injury?.snapshot?.(p);if(!w?.active)return'';
  const tone=w.level==='severe'?'urgent':w.level==='wounded'?'watch':'steady';
  return `<div class="injuryline ${tone}"><span>${w.label}</span><b>~${w.remainingDays}d · ${w.modeLabel.toLowerCase()}</b></div>`;
}

function familyIllnessLine(sim,p){
  const f=sim.familyIllness?.snapshot?.(p);if(!f)return'';
  if(f.active){const young=f.healthyYoungCount?` · young buffered ${f.protectedYoungCount}/${f.healthyYoungCount}`:'',immune=f.immuneCount?` · ${f.immuneCount} temporarily immune`:'';return `<div class="illness family"><b>Family fever</b><span>${f.infectedCount} sick · ${f.distancingCount} making space${immune}${young}</span></div>`}
  if(f.after)return `<div class="illness immune"><b>Family regrouping</b><span>Marsh fever cleared · close contact can resume</span></div>`;
  return'';
}

function exposureLine(sim,p){
  const x=sim.exposure?.snapshot?.(p);if(!x||x.label==='Comfortable'||x.label==='Sheltered')return'';const tone=x.severe?'urgent':x.urgent?'watch':'steady';return `<div class="weatherline ${tone}"><span>${x.label}</span><b>${Math.round(x.wetness*100)}% wet${x.sheltered?(x.shelterLeaking?' · partial cover':' · protected'):''}</b></div>`;
}

function youngCareLine(sim,p){
  const children=sim.family?.livingChildren?.(p)||[];if(!children.length)return'';
  const status=sim.family?.priorityChild?.(p),child=status?.child||[...children].sort((a,b)=>b.age-a.age)[0];if(!child)return'';
  const dev=developmentFor(child),learning=sim.family?.learningProfile?.(child),practice=sim.family?.practiceProfile?.(child),stress=status?.stress??(child.careStress||0),tone=status?.urgent?'urgent':stress>.34?'watch':'steady';
  const practiceText=practice?.run?`${practice.label} · ${practice.completed}/2 routes`:practice&&learning?.complete?`${practice.ready?'field-ready':'practice'} · ${practice.completed}/2 routes`:null;
  const care=status?.urgent?`${status.label} · stress ${Math.round(stress*100)}%`:practiceText||(learning&&child.age<SPECIES[child.species].maturity?`${learning.label} · ${learning.mastered}/4 lessons · ${Math.round(learning.independence*100)}% independent`:`${status?.label||'steady'} · stress ${Math.round(stress*100)}%`);
  return `<div class="youngline ${tone}"><span>G${child.generation} ${dev.stage}</span><b>${care}</b></div>`;
}

function pressureLine(sim,p){
  const pressure=sim.pressure?.strongest?.(p);if(!pressure||pressure.severity<.58)return'';
  const strength=pressure.severity>=.72?'strong':pressure.severity>=.42?'moderate':'mild';
  const tone=pressure.tone||'neutral';
  return `<div class="pressureline ${strength} ${tone}"><span>Pressure · ${pressure.label}</span><b>${pressure.effect}</b></div>`;
}
function generationPath(sim,p){
  const reached=Math.min(8,sim.lineage.highestGeneration||p.generation||1),active=Math.min(8,p.generation||1);
  const cells=Array.from({length:8},(_,i)=>{const g=i+1,cls=[g<=reached?'reached':'',g===active?'active':''].filter(Boolean).join(' ');return `<i class="${cls}" aria-label="Generation ${g}"><span>${g}</span></i>`}).join('');
  return `<div class="genpath" aria-label="Family progress to Generation 8"><span>${cells}</span><em>${sim.lineage.established?'G8 reached':`${reached}/8`}</em></div>`;
}
function familyDirectiveLine(sim){
  const s=sim.familyDirectives?.status?.();if(!s?.available)return'';
  const modes=[['1','AUTO','auto',true],['2','FOLLOW','follow',true],['3','FORAGE','forage',true],['4','HOME','home',true],['5','SCOUT','scout',!!s.scoutUnlocked]];
  const scoutNeed=s.reach?.nextUnlock;const chips=modes.map(([key,label,id,enabled])=>`<span class="${s.mode===id?'active ':''}${enabled?'':'locked'}" title="${enabled?'':scoutNeed?`Unlock: ${scoutNeed.targetAdults} adults + ${scoutNeed.targetCells} familiar cells`:'Locked'}"><i>${key}</i>${label}${enabled?'':' ·'}</span>`).join('');
  return `<div class="family-directive"><b>Family direction</b><div>${chips}</div><em>${s.count} grown relative${s.count===1?'':'s'} · needs + danger override orders</em></div>`;
}
function familyReachLine(sim){
  const r=sim.expansion?.snapshot?.();if(!r||r.members<2)return'';
  const progress=Math.max(0,Math.min(8,Math.round(r.cells.length/10*8))),bar='■'.repeat(progress)+'·'.repeat(8-progress);
  let unlock='';if(!r.scoutUnlocked)unlock=`Scout needs ${r.nextUnlock.cellsNeeded} cell${r.nextUnlock.cellsNeeded===1?'':'s'} + ${r.nextUnlock.adultsNeeded} adult${r.nextUnlock.adultsNeeded===1?'':'s'}`;
  else if(!r.nestUnlocked)unlock=`New nest needs ${r.nestNeed.cells} cell${r.nestNeed.cells===1?'':'s'} + ${r.nestNeed.adults} adult${r.nestNeed.adults===1?'':'s'}`;
  else unlock=`Shelters ${r.activeShelters}/${r.shelterCapacity}${r.nestAvailable?' · radial Nest available':''}`;
  return `<div class="family-reach ${r.scoutUnlocked?'unlocked':''}"><b>${r.tier.label}</b><span>${bar} ${r.cells.length} familiar cells · ${r.adults} adults</span><em>${unlock}</em></div>`;
}

function familySustainabilityLine(sim){
  const s=sim.sustainability?.snapshot?.();if(!s||s.members<2)return'';
  const filled=Math.max(0,Math.min(8,Math.round(s.balance*8))),bar='■'.repeat(filled)+'·'.repeat(8-filled),competitors=s.competitors?`${s.competitors} competitor${s.competitors===1?'':'s'} in range`:'little competing pressure';
  const note=s.status.id==='depleted'?'Forage/Scout toward richer ground':s.status.id==='strained'?'Family Forage spreads toward better cells':s.reserve.stored>=4?`Shelter reserve ${Math.round(s.reserve.stored)}`:'Watch local food as the family grows';
  return `<div class="family-sustainability ${s.status.tone}"><b>RANGE FOOD · ${s.status.label}</b><span>${bar} ${Math.round(s.food*100)}% forage · ${competitors}</span><em>${note}</em></div>`;
}

function runGoal(sim,p){
  if(sim.lineage.established)return'<div class="run-goal reached"><b>Line established</b><span>Keep the family alive · evolution continues</span></div>';
  const heirs=sim.lineage.eligibleHeirs?.()||[];
  if(heirs.length)return`<div class="run-goal"><b>Hand off when ready</b><span>L family · H take over a grown descendant</span></div>`;
  const children=sim.family?.livingChildren?.(p)||[];
  if(children.length)return`<div class="run-goal"><b>Raise G${Math.max(...children.map(c=>c.generation||2))}</b><span>Protect + teach · prepare your successor</span></div>`;
  if(p.lastMate)return'<div class="run-goal"><b>Start G2</b><span>Survive together · a child is how this lineage continues</span></div>';
  return'<div class="run-goal"><b>Build the first family</b><span>Survive → pair → raise G2 → hand off</span></div>';
}
function friendlyIntent(intent){const map={'family-follow':'Following your direction','family-forage':'Foraging by direction','family-relief-forage':'Seeking richer family ground','family-home':'Returning home','family-hold':'Waiting near family','family-scout':'Scouting the family frontier','family-scout-hold':'Watching the frontier','family-area-gather':'Gathering at your mark','family-area-forage':'Foraging at your mark','family-area-scout':'Scouting your mark','family-area-nest':'Establishing a new nest','family-area-avoid':'Avoiding your marked area','family-area-hold':'Holding at your mark','tendency-forage':'Foraging independently','tendency-roam':'Ranging independently','tendency-home':'Returning to the colony','tendency-gather':'Keeping with the colony',player:'Moving',drink:'Seeking water',feed:'Foraging',hunt:'Hunting',mate:'Courting',escape:'Fleeing',shelter:'Seeking shelter','shelter-feed':'Returning to food cache',follow:'Following family',guard:'Protecting family',social:'Staying with family',group:'Keeping with group','group-space':'Making space','group-alarm':'Following group alarm','wary':'Wary: keeping away from a predator',migrate:'Migrating','migration-return':'Returning home','return-home':'Returning home','aquatic-range':'Moving toward wet habitat','guardian-hold':'Holding defended ground','burrow-return':'Returning to the burrow','learn-water':'Following a water lesson','learn-food':'Following a feeding lesson','learn-shelter':'Learning shelter safety','practice-return':'Returning from solo practice','storm-shelter':'Returning for storm refuge','storm-refuge':'Sheltering with family','illness-distance':'Keeping illness distance','illness-buffer':'Buffering young from illness','illness-isolate':'Resting apart while sick','illness-care':'Staying with sick young','illness-immune-care':'Safely caring after recovery','illness-immune-support':'Staying near sick family','illness-regroup':'Regrouping after fever',explore:'Exploring',idle:'Watching',ward:'Warding intruder','leave-core':'Leaving territory',swim:'Swimming'};return map[intent]||titleCase(intent||'exploring')}
function titleCase(v){return String(v||'').toLowerCase().replace(/(^|[- ])./g,m=>m.toUpperCase())}

function updateMate(el,sim,open){
  if(!el)return;el.hidden=!open;if(!open)return;
  const active=sim.player();
  if(!active){el._rawKnowledge='NEARBY MATES\nFamily line ended.';return}
  const candidates=sim.reproduction.eligibleMates(),selected=sim.reproduction.selectedMate();
  if(!selected){el._rawKnowledge=`NEARBY MATES\n${maturityLabel(active).toUpperCase()} #${active.id} · ${active.sex}\nNo ready, unrelated compatible partners nearby.\n\nMove around and check again.\nM: close`;return}
  const dist=Math.hypot(active.x-selected.x,active.y-selected.y),mid=traitMidpoint(active,selected),contrast=geneticContrast(active,selected),taxon=sim.reproduction.taxonRelation?.(active,selected)||{same:true,from:'GenVo',to:'GenVo'};
  const tendency=compareGenes(mid,active.genes,{limit:4,threshold:.009});
  const assortment={assortment:sim.mateAssortmentRules===LOCAL_ASSORTMENT};
  const choice=reciprocalMateChoice(active,selected,sim.seed,assortment);
  const court=sim.reproduction.courtTargetId===selected.id?'COURTSHIP ACTIVE':'C: begin courtship';
  // A short, actionable comparison. Values are qualitative preferences, not
  // reproductive probabilities or guaranteed offspring outcomes.
  const mateOptions=candidates.slice(0,6).map(a=>{
    const d=Math.hypot(active.x-a.x,active.y-a.y);
    const fit=mateOptionAssessment(active,a,sim.seed,d,Math.max(12,24*active.genes.senses),assortment);
    const body=comparePhysicalBuilds(active,a);
    const bodyLabel=body?(body.exact?'matching body':`${body.different} different sockets`):'body unknown';
    return `${a.id===selected.id?'▸':' '} #${a.id} · ${d.toFixed(1)} tiles · ${fit.label} · ${bodyLabel}`;
  }).join('\n');
  const compatibility=reproductiveCompatibility(active,selected),loci=reproductiveGenomeFor(selected);
  const biologyLine=`Biological conception potential ${Math.round(compatibility.conceptionChance*100)}% · gamete match ${Math.round(compatibility.gameteMatch*100)}% · individual fertility ${Math.round(compatibility.fertilityA*100)}% / ${Math.round(compatibility.fertilityB*100)}%\nDedicated inherited loci (provisional model): ${JSON.stringify(loci?.loci)}\nConditional on reciprocal acceptance and ordinary roles, kinship, readiness and resource checks. Species names and physical build do not determine compatibility.`;
  const choiceLine=choice.accepted?'Both currently favor this pairing':choice.reason==='first-declines'?`Your creature is not drawn to this partner: ${tasteText({axis:choice.a?.dominant,direction:choice.a?.direction})}`:'The other creature is currently less receptive';
  const moves=availableCourtshipMoves(active);
  const actionNames=['dance','call','flare','scent','gesture'];
  const actionHint=actionNames.map((m,i)=>`${i+1} ${m}${moves.includes(m)?'':' (unavailable)'}`).join(' · ');
  const queuedRitual=sim.reproduction.ritualQueue?.join(' → ')||'explore from experience';
  const recentRefusal=active.lastCourtshipRefusal?.otherId===selected.id?'\nLast approach was declined.': ''; 
  const display=active.courtshipPerformance?.partnerId===selected.id?active.courtshipPerformance:null;
  const performanceLine=display?`\nRITUAL: ${(display.sequence||['approach']).join(' → ')} · energy ${display.energySpent.toFixed(2)}`:'';
  const contestLine=active.lastCourtshipCompetition?.partnerId===selected.id?`\nLast contest: #${active.lastCourtshipCompetition.winnerId} favored by this mate`:'';
  const selectedPreg=sim.family.pregnancyProgress(selected),pregLine=selectedPreg?`\nPregnancy ${Math.round(selectedPreg.progress*100)}%` : '';
  const bodyComparison=comparePhysicalBuilds(active,selected);
  const anatomyLine=samePhysicalBuild(active,selected)?'Matching physical builds · mating offers next-generation editor':'Different physical builds · young can inherit a mixture · editor waits for a matching pair';
  const anatomyDetail=bodyComparison?bodyComparison.exact?'All mounted parts and sockets match':`${bodyComparison.matched}/${bodyComparison.total} mounted positions match · ${bodyComparison.different} differ\n${bodyComparison.differences.slice(0,5).map(d=>`  ${d.location}: yours ${d.first} / mate ${d.second}`).join('\n')}${bodyComparison.different>5?'\n  …more differences':''}`:'Body-plan comparison unavailable';
  const reproAbility=reproductiveMode(active),reproPlan=conceptionMode(active,sim.world);
  const broodLine=reproAbility==='dual'?`DUAL ANATOMY: ${active.sex==='F'?`${active.reproductiveStrategy||'adaptive'} · next brood ${reproPlan} · V: change choice (cannot change pregnancy)`:'offspring may inherit both organs · gestating parent chooses mode'}`:`REPRODUCTION: ${reproAbility==='egg'?'egg laying':'live birth'} · dual requires egg chamber + live womb`;
  const flowLine=taxon.same?`Taxon: ${taxon.to} · local pairing`:`GENE FLOW: ${taxon.from} × ${taxon.to} · repeated cross-branch births can weaken a young species boundary`;
  el._rawKnowledge=`NEARBY MATES\nNearby candidates ${candidates.length}\nSelected #${selected.id} · ${selected.sex} · ${maturityLabel(selected)} · ${dist.toFixed(1)} tiles${pregLine}\n${flowLine}\n${broodLine}\nANATOMY: ${anatomyLine}\n${anatomyDetail}\nMatching here describes bodies, not guaranteed mating or offspring.\nCHOICE: ${choiceLine}\n${biologyLine}${recentRefusal}${performanceLine}${contestLine}\nPARTNER OPTIONS (individual preference and distance)\n${mateOptions}\nYour inherited preference: ${preferenceSummary(active,sim.seed)}\nPartner preference: ${preferenceSummary(selected,sim.seed)}\n\nYOU\n  ${strongestTraitText(active)}\nMATE\n  ${strongestTraitText(selected)}\nLIKELY CHILD TRAITS\n  ${traitListText(tendency,{empty:'likely close to you'})}\nOBSERVED PARENTAL ADAPTATIONS\n  ${parentalAdaptationText(active,selected)}\n\nGenetic difference: ${contrast<.025?'subtle':contrast<.06?'moderate':'strong'}\n${court}\nRitual moves: ${actionHint}\nChosen: ${queuedRitual}\nBackspace: clear · C: perform · Q / E: mates · M: close`;
}

function updateMind(el,sim,open){
  if(!el)return;el.hidden=!open;if(!open)return;
  const active=sim.player();
  if(!active){el._rawKnowledge='MEMORY\nFamily line ended.';return}
  const snapshot=sim.cognition.snapshot(active),profile=snapshot.temperament,diet=sim.foraging?.snapshot?.(active);
  const memoryLines=[
    `Water  ${memoryLine(sim,active,snapshot.water,'water')}`,
    `Food   ${memoryLine(sim,active,snapshot.food,'food')}`,
    `Threat ${memoryLine(sim,active,snapshot.threat,'threat')}`
  ];
  const relationLines=snapshot.relations.slice(0,6).map(r=>`  ${r.relation.padEnd(10,' ')} #${r.animal.id} · ${r.distance.toFixed(1)} tiles · ${developmentFor(r.animal).stage}`);
  const history=snapshot.history.slice(0,7).map(h=>`  Y${h.year} D${h.day}: ${h.text}`);
  const dietFoods=diet?.recentKinds?.length?diet.recentKinds.map(k=>PLANTS[k]?.label||(k==='carrion'?'Carrion':k)).join(' · '):'none yet';
  const dietLine=diet?.recentKinds?.length?`  ${dietFoods}\n  breadth ${diet.breadth}/4 · assimilation +${Math.round((diet.assimilation-1)*100)}%`:'  no meals recorded yet';
  const patchLines=(diet?.patches||[]).slice(0,5).map(p=>{const estimate=sim.foraging.projectedPatchNote(p),age=p.ageDays<.2?'just checked':`${p.ageDays.toFixed(1)}d since check`;return`  ${p.label.padEnd(10,' ')} ${p.distance.toFixed(1)} tiles · ${estimate} · ${age}`});
  el._rawKnowledge=`MEMORY · #${active.id}\nTemperament ${profile.label}\nBoldness ${profile.boldness.toFixed(2)} · Sociality ${profile.sociality.toFixed(2)}\n\nPLACES REMEMBERED\n${memoryLines.join('\n')}\n\nFORAGE PATCHES\n${patchLines.join('\n')||'  no learned patches yet'}\n\nRECENT DIET\n${dietLine}\n\nFAMILY NEARBY\n${relationLines.join('\n')||'  none currently sensed'}\n\nLIFE HISTORY\n${history.join('\n')||'  no recorded events yet'}\n\nMarkers: cyan water · green food · red threat\nI: close`;
}


function updateTerritory(el,sim,open){
  if(!el)return;el.hidden=!open;if(!open)return;
  const active=sim.player();
  if(!active){el.innerHTML=`<header class="panel-head"><div><span>HOME RANGE</span><strong>Family line ended</strong></div><small>T · close</small></header>`;return}
  const snap=sim.territory.snapshot(active),home=snap.home,state=snap.established?'ESTABLISHED':'LEARNING';
  const homeLine=home?`${home.distance.toFixed(1)} tiles from learned center · radius ${home.radius.toFixed(1)} · core ${home.coreRadius.toFixed(1)}`:'not established yet';
  const top=snap.cells.slice(0,8).map(c=>`cell ${String(c.cx).padStart(2,'0')},${String(c.cy).padStart(2,'0')} · familiarity ${c.familiarity.toFixed(1)}`);
  const intruder=snap.intruder?`#${snap.intruder.id} · ${Math.hypot(snap.intruder.x-active.x,snap.intruder.y-active.y).toFixed(1)} tiles from you`:'none in familiar core';
  const stalker=sim.stalkerTerritory?.familyLandscape?.(active),stalkerLine=stalker?`Known-den risk ${Math.round(stalker.risk*100)}% · stale-sign uncertainty ${Math.round(stalker.uncertainty*100)}% · recent opening ${Math.round(stalker.opening*100)}%`:'No learned Stalker landscape yet';
  const reach=sim.expansion?.snapshot?.(),reachLine=reach?`${reach.tier.label} · ${reach.cells.length} familiar cells · ${reach.adults} adults · span ${reach.span.toFixed(1)} tiles${reach.scoutUnlocked?' · Scout unlocked':` · Scout needs ${reach.nextUnlock.cellsNeeded} cells / ${reach.nextUnlock.adultsNeeded} adults`}${reach.nestUnlocked?` · shelters ${reach.activeShelters}/${reach.shelterCapacity}`:` · nest needs ${reach.nestNeed.cells} cells / ${reach.nestNeed.adults} adults`}`:'not yet measured';
  const sustain=sim.sustainability?.snapshot?.(),sustainLine=sustain?`${sustain.status.label} · forage ${Math.round(sustain.food*100)}% · reserve ${sustain.reserve.stored.toFixed(1)} · ${sustain.competitors} competing feeder${sustain.competitors===1?'':'s'}`:'not yet measured';
  const weakCell=sustain?.worst?`Weakest known cell ${sustain.worst.key} · forage ${Math.round(sustain.worst.foodIndex*100)}% · competitors ${sustain.worst.competitors}`:'No sustained range yet';
  const centerEco=sim.populationEcology?.snapshot?.(),centerLines=centerEco?.centers?.length?centerEco.centers.map(c=>`#${c.id} ${c.kind==='range-band'?'Ranging Band':c.kind==='satellite-colony'?'Satellite Colony':c.label||'Species Settlement'} · ${c.status.label} · carrying ${c.load}/${c.capacity} · forage ${Math.round(c.food*100)}% · ${c.dominantPressure}${c.lineageCompetitors?` · cross-taxon ${c.lineageCompetitors}`:''}`).join('\n'):'No second population center yet';
  const pressureLines=sim.populationMemory?.lines?.()||[],pressureSplit=sim.populationMemory?.divergence?.()?.[0]||null,pressureMemory=pressureLines.length?pressureLines.join('\n'):'No sustained population histories yet';
  const taxon=sim.evolutionTree?.leadershipSnapshot?.(active),taxonLine=taxon?.multipleTaxa?`${taxon.label} · ${taxon.living} living · ${taxon.sharedPopulations.length} shared centers · ${taxon.closeContacts} close cross-taxon contacts`:'Single living taxon';
  const foodStatus=sustain?.status?.label||'UNMEASURED',centerCount=centerEco?.centers?.length||0;
  renderReadablePanel(el,`<header class="panel-head"><div><span>HOME RANGE · #${active.id}</span><strong>${state}</strong></div><small>T · close</small></header>
    <div class="panel-summary">
      ${summaryCard('FAMILIARITY',`${snap.totalFamiliarity.toFixed(1)} total`,`${Math.round(snap.familiarityHere*100)}% in current cell`)}
      ${summaryCard('RANGE FOOD',foodStatus,`${Math.round((sustain?.food||0)*100)}% forage · ${sustain?.competitors||0} competitors`)}
      ${summaryCard('ACTIVE TAXON',taxon?.label||'GenVo',taxonLine)}
      ${summaryCard('CENTERS',String(centerCount),centerCount?'secondary population sites active':'home range only')}
    </div>
    ${sectionBlock('Home and family reach',`${homeLine}\n${reachLine}\n\nGold overlay = shared family presence. Dotted gold frontier = possible Scout ground.`,true)}
    ${sectionBlock('Food and carrying pressure',`${sustainLine}\n${weakCell}\n\nFood is real biomass. Family and wildlife feeding can thin the same ground.`)}
    ${sectionBlock('Population centers',`${centerLines}\n\nCarrying capacity responds to forage, competitors, predators, and local family load.`)}
    ${sectionBlock(`Lived pressure history${pressureSplit?` · separation ${Math.round(pressureSplit.score*100)}%`:''}`,`${pressureMemory}\n\nSustained separation can seed inherited proto-traits.`)}
    ${sectionBlock('Most familiar cells',top.join('\n')||'Still learning this habitat.')}
    ${sectionBlock('Threat landscape',`Core intruder: ${intruder}\n${stalkerLine}\n\nFamily roaming avoids learned active den cores. Recently abandoned learned ranges can reopen ground.`)}
    <footer class="panel-foot">Overlay: teal active range · gold family presence · dotted gold Scout frontier</footer>`);
}

function updateShelter(el,sim,open){
  if(!el)return;el.hidden=!open;if(!open)return;
  const active=sim.player();
  if(!active){el._rawKnowledge='SHELTER\nFamily line ended.';return}
  const snap=sim.shelter.snapshot(active),reach=sim.expansion?.snapshot?.(),projects=sim.shelter?.activeProjects?.()||[];
  if(!snap.exists){
    const check=snap.canBuild;
    el._rawKnowledge=`SHELTER · #${active.id}
NO SHELTER YET
Nearby material ${snap.material.toFixed(2)} / 1.15
${check.ok?'READY: press N to build here.':check.reason}

Needs: a settled home range · familiar ground · 52%+ energy · nearby plants
B: close`;
    return;
  }
  const sh=snap.shelter,owner=sim.lineage.records.get(sh.ownerId),intruder=snap.intruder,weather=sim.exposure?.snapshot?.(active),refuge=sim.familyWeather?.snapshot?.(active),aftermath=sim.familyWeather?.aftermathStatus?.(active);
  const protection=Math.round(64*(sh.integrity/100)),thermal=Math.round((1-snap.thermalMultiplier)*100);
  el._rawKnowledge=`SHELTER #${sh.id}${sh.denStyle==='burrow'?' · BURROW DEN':sh.kind==='satellite'?' · SATELLITE NEST':''}
Family shelters ${reach?.activeShelters||1}/${reach?.shelterCapacity||1}${projects.length?` · ${projects.length} nest building`:''}
Built Y${sh.constructedYear} D${sh.constructedDay} · built by #${sh.ownerId}${owner&&!owner.alive?' (deceased)':''}
Distance ${snap.distance.toFixed(1)} tiles · ${snap.inside?'INSIDE':'outside'}
Integrity ${bar(sh.integrity/100)} ${sh.integrity.toFixed(1)}%
Weatherproofing ${snap.weatherLabel}
Stored food ${bar(sh.foodStore/sh.capacity)} ${sh.foodStore.toFixed(1)} / ${sh.capacity}
Nearby material ${snap.material.toFixed(2)}

WHILE INSIDE
Thermal stress reduction ${thermal}%
Young predation risk reduction ${protection}%
Weather now: ${weather?.label||'comfortable'}${weather?.sheltered?(weather?.shelterLeaking?' · partial protection':' · protected here'):''}
${refuge?`Family refuge ${refuge.insideCount}/${refuge.familyCount} under cover${refuge.dependentCount?` · young ${refuge.dependentInside}/${refuge.dependentCount}`:''}`:aftermath?`After storm ${aftermath.pendingCount} young check${aftermath.pendingCount===1?'':'s'} pending · ${aftermath.resumedCount} outing${aftermath.resumedCount===1?'':'s'} resumed`:'Family refuge inactive'}
Hungry family can eat stored food

NEARBY INTRUDER
  ${intruder?`#${intruder.id} · ${Math.hypot(intruder.x-sh.x,intruder.y-sh.y).toFixed(1)} tiles from shelter`:'none nearby'}

N: repair / reinforce with nearby plant material
F: store nearby food
B: close`;
}

function updateMigration(el,sim,open){
  if(!el)return;el.hidden=!open;if(!open)return;
  const active=sim.player();
  if(!active){el._rawKnowledge='MIGRATION\nFamily line ended.';return}
  const snap=sim.migration.snapshot(active),rec=snap.recommendation;
  if(!rec){el._rawKnowledge='MIGRATION\nNo route estimate yet.';return}
  const target=snap.target||rec.target,home=rec.homeQuality,current=snap.current;
  const targetQuality=target?.quality??rec.target.quality,routeGain=targetQuality-home.score;
  const routeDist=target?Math.hypot(active.x-target.x,active.y-target.y):0;
  const refuges=Object.entries(snap.seasonalRefuges).map(([season,r])=>`  ${season.padEnd(6,' ')} ${Math.round(r.quality*100)}% · Y${r.year} D${r.day}`).join('\n');
  const action=snap.status==='settled'?(rec.shouldMigrate?'G: take suggested route':'Staying home still looks better.'):'G: cancel route';
  el._rawKnowledge=`MIGRATION · #${active.id}
Status ${snap.status.toUpperCase()} · ${sim.season}
Reason ${snap.reason||rec.reason}

HABITAT
Current ${qualityBar(current.score)} ${Math.round(current.score*100)}%
Home    ${qualityBar(home.score)} ${Math.round(home.score*100)}%
Refuge  ${qualityBar(targetQuality)} ${Math.round(targetQuality*100)}% · +${Math.round(Math.max(0,routeGain)*100)} pts
Route   ${routeDist.toFixed(1)} tiles from current position

AT HOME
Food ${Math.round(home.food*100)}% · Water ${Math.round(home.water*100)}% · Temp ${Math.round(home.temp*100)}%
Danger ${Math.round(home.danger*100)}% · Shelter resilience ${Math.round(home.shelter*100)}%
Known-den risk ${Math.round((home.denRisk||0)*100)}% · stale-sign uncertainty ${Math.round((home.denUncertainty||0)*100)}% · territory opening ${Math.round((home.territoryOpening||0)*100)}%

KNOWN SEASONAL AREAS
${refuges||'  none visited yet'}

${action}
Overlay: cyan route · white destination · gold home
K: close`;
}

function qualityBar(v){v=Math.max(0,Math.min(1,v));const n=Math.round(v*8);return '■'.repeat(n)+'·'.repeat(8-n)}

function memoryLine(sim,active,memory,type){
  if(!memory)return'none';
  const age=sim.cognition.memoryAgeDays(memory),dist=Math.hypot(memory.x-active.x,memory.y-active.y);
  let label='';
  if(type==='food')label=(PLANTS[memory.kind]?.label||SPECIES[memory.kind]?.label||memory.kind)+' · ';
  if(type==='threat')label=(SPECIES[memory.species]?.label||memory.species)+' · ';
  return`${label}${dist.toFixed(1)} tiles · ${age.toFixed(1)}d ago`;
}
function eventText(e){if(e.type==='birth')return`BIRTH · G${e.generation} #${e.animalId}`;return e.type.toUpperCase()}
function bar(v){v=Math.max(0,Math.min(1,v));const n=Math.round(v*8);return '█'.repeat(n)+'░'.repeat(8-n)}
function pad(n){return String(n).padStart(3,' ')}
function gene(v){const n=Math.round((v-1)*100);return `${n>=0?'+':''}${n}%`}
