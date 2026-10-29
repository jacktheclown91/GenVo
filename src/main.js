import {informationNavigationEvent} from './ui/information-input.js';
import {resolveRegionalCreature} from './world/regional-fauna.js';
import {preparePlanetarySeams,cancelPlanetarySeams} from './world/planetary-seam-work.js';
import {PlanetaryPreparation} from './world/planetary-preparation.js';
import {advanceNextDemographicRegion} from './world/planetary-demography.js';
import {clearWarmRegions} from './world/regional-warm-cache.js';
import {ecologyRuleMigrationMessage} from './ecology/rule-policy.js';
import {birthRuleMigrationMessage} from './lineage/birth-rules.js';
import {FrameStepper} from './sim/frame-stepper.js';
import {PlanetaryWorkQueue} from './sim/planetary-work-queue.js';
import {setProcessingLoad} from './sim/processing-capacity.js';
import {planetaryTravelAvailability,crossPlanetaryBorder} from './world/planetary-travel.js';
import {planetaryWalkIntent,planetaryPositionLabel} from './world/planetary-walkthrough.js';
import {PointerApproach} from './ui/pointer-approach.js';
import {approachGoal} from './ui/world-resource-target.js';
import {CourtshipTray} from './ui/courtship-tray.js';
import {MovementInputBuffer} from './ui/movement-input-buffer.js';
import {HeldBraceInput} from './ui/held-brace-input.js';
import {CreatureContextTray} from './ui/creature-context-tray.js';
import {combatActions} from './ui/gameplay-actions.js';
import {FrontEnd} from './ui/front-end.js';
import {chooseResidentStart} from './ui/resident-start.js';
import {chooseAuthoredFounder} from './ui/founder-start.js';
import {installPhysicalStarter,physicalStarterIds,PHYSICAL_STARTERS} from './ui/physical-starter-presets.js';
import {selectResidentStart} from './persistence/resident-start.js';
import {matchStartingFounderAppearance} from './persistence/authored-founders.js';
import {loadNativePartCatalog,nativeArtStatus} from './render/runtime-part-art.js';
import {Simulation} from './sim/simulation.js';
import {REGIONAL_FOUNDING} from './ecology/regional-founding.js';
import {Renderer,TERRAIN_POOL} from './render/renderer.js';
import {GAIT_REVIEW} from './render/genvo.js';
import {BREEDING_REVIEW,LIFE_HISTORY} from './ecology/breeding-calibration.js';
import {ECOLOGY_REVIEW} from './ecology/ecology-review.js';
import {AQUATIC_REVIEW} from './ecology/freshwater-food.js';
import {FOUNDING_GENETICS} from './reproduction/reproductive-compatibility.js';
import {JUVENILE_SWITCH} from './ecology/juvenile-biology.js';
import {ACTIVITY_REVIEW} from './ecology/activity.js';
import {HEALING_REVIEW} from './ecology/healing-review.js';
import {PREDATION_PARITY} from './gameplay/predation-parity.js';
import {REFUGE_PARITY,MOTION_REVEALS} from './ecology/refuges.js';
import {PHYSIOLOGY_PARITY} from './ecology/physiology.js';
import {RARITY_REVIEW} from './ecology/prey-encounter.js';
import {TROPHIC_RECOGNITION} from './reproduction/trophic-recognition.js';
import {HUNT_COMMITMENT} from './ecology/hunt-commitment.js';
import {PLANT_TURNOVER} from './ecology/plant-resources.js';
import {MODULAR_HEAD,SPRITE_CACHE,SPRITE_BATCH} from './render/genvo-draw.js';
import {THREAT_APPRAISAL} from './ecology/threat-appraisal.js';
import {MOVEMENT_PARITY} from './ecology/movement-parity.js';
import {SOIL_WATER} from './ecology/soil-water.js';
import {WEATHER_PATTERNS} from './ecology/weather.js';
import {THREAT_STAGES} from './ecology/threat-perception.js';
import {PREY_RISK} from './ecology/prey-risk.js';
import {DEVELOPMENTAL_SYMMETRY} from './lineage/developmental-symmetry.js';
import {RESOURCE_FOUNDING} from './ecology/resource-founding.js';
import {updateHUD,relativeSummary,setInteractPromptSource} from './ui/inspector.js';
import {TutorialController} from './ui/tutorial.js';
import {CFG} from './sim/config.js';
import {FieldJournal} from './ui/journal.js';
import {AudioDirector} from './audio/audio.js';
import {LeadershipWheel} from './ui/leadership-wheel.js';
import {EffectFeedbackController} from './ui/effect-feedback.js';
import {PlaytestDiagnostics} from './diagnostics/playtest-telemetry.js';
import {SaveManager,restoreSimulationSnapshot} from './persistence/save-manager.js';
import {packageScenarioSnapshot,openScenarioSnapshot,loadBundledScenario,sha256Hex,parseScenarioDocument} from './persistence/scenario-library.js';
import {ObserverController} from './ui/observer.js';
import {SuccessionChooser} from './ui/succession-chooser.js';
import {LegacySummary} from './ui/legacy-summary.js';
import {YoungSummary} from './ui/young-summary.js';
import {WorldStory} from './gameplay/world-story.js';
import {cameraZoom,stepCameraZoom} from './render/camera-zoom.js';
import {verdictText} from './gameplay/threat-display.js';
import {CreatureEditor} from './ui/creature-editor.js';
import {FieldGuide} from './ui/field-guide.js';
import {setForm,formReading} from './lineage/readings.js';

let seed=new URLSearchParams(location.search).get('seed')||'GENVO8-8FOLD';
// Creator visual review of gait stride (?strideReview=1.5). Shipped default stays 1x.
{const review=Number(new URLSearchParams(location.search).get('strideReview'));if([1,1.5,2].includes(review))GAIT_REVIEW.strideScale=review}
// Creator review of the aquatic/marsh breeding calibration candidate (?breedingReview=1). Off by default.
{const breeding=new URLSearchParams(location.search).get('breedingReview');if(breeding==='0')BREEDING_REVIEW.enabled=false;else if(breeding==='1')BREEDING_REVIEW.enabled=true}
{const q=new URLSearchParams(location.search);if(q.get('lodInteraction')==='0')ACTIVITY_REVIEW.continuousInteraction=false;if(q.get('healing')==='0')HEALING_REVIEW.enabled=false;if(q.get('predationParity')==='0')PREDATION_PARITY.enabled=false;if(q.get('refuges')==='0')REFUGE_PARITY.enabled=false;if(q.get('physiologyParity')==='0')PHYSIOLOGY_PARITY.enabled=false;if(q.get('rarityReview')==='0')RARITY_REVIEW.enabled=false;if(q.get('trophicRecognition')==='0')TROPHIC_RECOGNITION.enabled=false;if(q.get('huntCommitment')==='1')HUNT_COMMITMENT.enabled=true;if(q.get('motionReveals')==='1')MOTION_REVEALS.enabled=true;if(q.get('plantTurnover')==='1')PLANT_TURNOVER.enabled=true;if(q.get('modularHead')==='1')MODULAR_HEAD.enabled=true;if(q.get('threatAppraisal')==='0')THREAT_APPRAISAL.enabled=false;if(q.get('movementParity')==='0')MOVEMENT_PARITY.enabled=false;if(q.get('soilWater')==='0')SOIL_WATER.enabled=false;if(q.get('weatherPatterns')==='0')WEATHER_PATTERNS.enabled=false;if(q.get('threatStages')==='0')THREAT_STAGES.enabled=false;if(q.get('preyRisk')==='0')PREY_RISK.enabled=false;if(q.get('developmentalSymmetry')==='0')DEVELOPMENTAL_SYMMETRY.enabled=false;if(q.get('spriteCacheMoving')==='1')SPRITE_CACHE.skipMoving=false;if(q.get('spriteBatch')==='0')SPRITE_BATCH.enabled=false;if(q.get('tilePool')==='0')TERRAIN_POOL.enabled=false;if(q.get('batchMode'))SPRITE_BATCH.mode=q.get('batchMode');if(q.get('batchPage'))SPRITE_BATCH.pageSize=Number(q.get('batchPage'))||1024;if(q.get('batchPages'))SPRITE_BATCH.maxPages=Number(q.get('batchPages'))||4;if(q.get('scratchPool'))SPRITE_CACHE.scratchPool=Number(q.get('scratchPool'))||1;if(q.get('ecologyReview')==='0')ECOLOGY_REVIEW.amphibiousForage=ECOLOGY_REVIEW.shoreHabitat=false;if(q.get('aquaticReview')==='0')AQUATIC_REVIEW.fryGrowth=AQUATIC_REVIEW.founding=false;if(q.get('foundingGenetics')==='0')FOUNDING_GENETICS.enabled=false;if(q.get('juvenileBiology')==='0')JUVENILE_SWITCH.growthCost=JUVENILE_SWITCH.preyAppraisal=false;if(q.get('resourceFounding')==='0')RESOURCE_FOUNDING.enabled=false;if(q.get('lifeHistory')==='1')LIFE_HISTORY.fundedGate=LIFE_HISTORY.conditionRecovery=true}
// 30-second days (sim/day-clock.js) and real daily needs (ecology/metabolism-policy.js) are opt-in
// with ?day=30 until the ecology under them has been balanced and measured; new worlds otherwise
// keep the recorded 6-second day and resting costs.
const dayParam=new URLSearchParams(globalThis.location?.search||'').get('day');
const DAY_CLOCK_OPT_IN=dayParam!=='legacy'&&dayParam!=='6';
const SURVIVAL_OPT_IN={autonomousPopulations:true,courtshipSimilarity:true,regionalFounding:REGIONAL_FOUNDING.policy,dayClock:DAY_CLOCK_OPT_IN,metabolism:DAY_CLOCK_OPT_IN,foodProperties:DAY_CLOCK_OPT_IN,tissueWater:DAY_CLOCK_OPT_IN,winterWater:DAY_CLOCK_OPT_IN,escapeLanding:DAY_CLOCK_OPT_IN,tissueEnergy:DAY_CLOCK_OPT_IN,perennialRegrowth:DAY_CLOCK_OPT_IN,bodySize:DAY_CLOCK_OPT_IN,inertia:DAY_CLOCK_OPT_IN,structuralSupport:DAY_CLOCK_OPT_IN,aridPhysiology:DAY_CLOCK_OPT_IN};
let sim=new Simulation(seed,{player:true,reuseGeneratedBase:true,...SURVIVAL_OPT_IN});
const canvas=document.querySelector('#game'),renderer=new Renderer(canvas,sim),keys={},pauseNotice=document.querySelector('#pauseNotice');
renderer.zoom=cameraZoom();
// Camera zoom: mouse wheel over the world, or - and = (presentation only).
function zoomCamera(dir){const before=renderer.zoom;renderer.zoom=stepCameraZoom(dir);if(renderer.zoom!==before)tutorial.showToast(`Zoom ${renderer.zoom}×`,900,'safe','action');frontEnd.syncSettings?.()}
canvas.addEventListener('wheel',e=>{if(frontEnd.isOpen||editor.open||!e.deltaY)return;e.preventDefault();zoomCamera(e.deltaY<0?1:-1)},{passive:false});
let mateOpen=false,mindOpen=false,territoryOpen=false,shelterOpen=false,migrationOpen=false,ecologyOpen=false,helpOpen=false,guideOpen=false,manualPause=false;
let pointerApproach=null;
const movementInputBuffer=new MovementInputBuffer({controlHz:CFG.controlHz});
const MOVE_CODES=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight','KeyJ']);
const WORLD_ACTION_CODES=new Set(['PageDown','PageUp','Enter','Space','KeyE','KeyQ','KeyN','KeyF','KeyX','KeyV','KeyZ','KeyC','KeyG','KeyH','Digit1','Digit2','Digit3','Digit4','Digit5','Digit0','Digit6','Digit7','Digit8','Digit9','Semicolon']);
const MANUAL_TAKEOVER_CODES=new Set(['KeyJ','PageDown','PageUp','Enter','Space','KeyE','KeyQ','KeyN','KeyF','KeyX','KeyV','KeyZ','KeyC','KeyG','Digit0','Digit6','Digit7','Digit8','Digit9','Semicolon']);
function clearMovementKeys(){pointerApproach?.cancel();braceInput?.release();sim.playerCombat?.releaseBrace(sim.player());movementInputBuffer.clear();for(const code of MOVE_CODES)keys[code]=false}
function takeManualControl(){if(!sim.playerAutonomy)return false;sim.setPlayerAutonomy(false);tutorial?.showToast?.('Manual control',900,'safe');return true}
function setManualPause(value){if(tutorial.worldInputBlocked?.())return false;manualPause=!!value;sim.paused=manualPause;clearMovementKeys();if(pauseNotice)pauseNotice.hidden=!manualPause;audio.note('confirm');return true}
const braceInput=new HeldBraceInput({getSim:()=>sim,blocked:()=>sim.paused||!!tutorial.worldInputBlocked?.()||frontEnd.isOpen||editor.open||succession.open,onBegin:()=>{sim.discovery.cancelTraceFollow();pointerApproach?.cancel();takeManualControl();applyObserverResult(observer.onManualInput());if(courtshipTray.isOpen){sim.reproduction.cancelCourtship();courtshipTray.close()}}});
const tutorial=new TutorialController(sim,renderer);
const observer=new ObserverController(()=>sim);
const editor=new CreatureEditor({getSim:()=>sim,onDone:r=>{if(tutorial.worldInputBlocked?.())sim.paused=true;if(r.ok)audio.note('confirm');else tutorial.showToast('Design cancelled · the litter inherits normally · nothing was spent',2600,'safe')}});
const fieldGuide=new FieldGuide({getSim:()=>sim,getRenderer:()=>renderer});
const succession=new SuccessionChooser({getSim:()=>sim,onDone:r=>{if(!r.ok){tutorial.showToast('That descendant cannot take over yet.',1800,'warn');audio.note('deny')}else audio.note('confirm')}});
// Legacy milestones follow the generation reveal; the world continues afterwards.
const legacySummary=new LegacySummary({getSim:()=>sim,onNewWorld:()=>{clearMovementKeys();sim.paused=true;frontEnd.show('new')}});tutorial.onLegacy=kind=>{if(legacySummary.show(kind))audio.note('confirm')};
// First-generation arc: what each of the player's young actually inherited.
// Early ecological drama: real local change told as short story beats.
const worldStory=new WorldStory(),toldVerdicts=new Set();
const youngSummary=new YoungSummary({getSim:()=>sim,blocked:()=>frontEnd.isOpen||editor.open||succession.open||legacySummary.open||!document.querySelector('#transition')?.hidden||!!tutorial.worldInputBlocked?.(),notify:text=>tutorial.showToast(text,5600,'success','progress')});
const speedButton=document.querySelector('#quickMenu button[data-action="speed"]');
function syncSpeedButton(){if(!speedButton)return;const s=observer.speed;speedButton.classList.toggle('active',s>1);speedButton.setAttribute('aria-pressed',s>1?'true':'false');speedButton.title=`Speed: ${s}x`;const label=speedButton.querySelector('.quick-speed-label');if(label)label.textContent=`${s}x`}
function applyObserverResult(r){if(!r)return;if(r.summary)tutorial.showToast(r.summary.text,5200,r.summary.danger?'warn':'safe');else if(r.message)tutorial.showToast(r.message,r.ok?1800:2200,r.ok?'safe':'warn');syncSpeedButton()}
function changeSpeed(kind){if(tutorial.worldInputBlocked?.())return;const r=kind==='wrap'?observer.cycleWrap():observer.cycle(kind);applyObserverResult(r);audio.note(r.ok?'confirm':'deny');updateHUD(sim,{renderer,mateOpen,mindOpen,territoryOpen,shelterOpen,migrationOpen,ecologyOpen,helpOpen,guideOpen,journalOpen:journal.open,commandMode:leadershipWheel.commandMode})}
const effectFeedback=new EffectFeedbackController(sim);
const journal=new FieldJournal(sim);
const audio=new AudioDirector(sim);
const quickMenu=document.querySelector('#quickMenu');
const continueGame=document.querySelector('#continueGame'),newLineage=document.querySelector('#newLineage'),startGame=document.querySelector('#startGame'),skipTutorial=document.querySelector('#skipTutorial'),welcomeSaveSummary=document.querySelector('#welcomeSaveSummary'),saveStatus=document.querySelector('#saveStatus'),saveNowButton=document.querySelector('#saveNow'),loadSaveButton=document.querySelector('#loadSave'),saveDetails=document.querySelector('#saveDetails');
let saveStatusTimer=null;
function showSaveStatus(message,{error=false,duration=1600}={}){
  if(!saveStatus)return;saveStatus.textContent=message;saveStatus.classList.toggle('error',!!error);saveStatus.hidden=false;
  if(saveStatusTimer)clearTimeout(saveStatusTimer);saveStatusTimer=setTimeout(()=>{saveStatus.hidden=true;saveStatus.classList.remove('error')},duration);
}
const diagnostics=new PlaytestDiagnostics({sim});
const saveManager=new SaveManager({getSim:()=>sim,onStatus:({kind,message,meta})=>{
  if(kind==='saving')showSaveStatus(message,{duration:2200});
  else if(kind==='saved'){showSaveStatus(message);diagnostics.recordSave({ok:true,day:meta?.day});if(saveDetails)saveDetails.textContent=`Last save: G${meta?.generation||1}, Year ${meta?.year||1} Day ${meta?.day||1}.`;}
  else if(kind==='error'){showSaveStatus(message,{error:true,duration:2600});diagnostics.recordSave({ok:false,error:message});}
}});
let inGameplay=false;
function closeGameMenus(){frontEnd.close();sim.paused=!!(tutorial.worldInputBlocked?.()||editor.open||succession.open);clearMovementKeys();if(pauseNotice)pauseNotice.hidden=true;inGameplay=true}
// Starting or loading a world: the loading message is painted before the heavy work, and stays until the first
// world frame has been drawn: the renderer prepares the visible terrain over several bounded frames first (Phase 3L,
// renderer.prepareScene), so the page never freezes and the scene appears complete. The world-start save runs once
// the world is live.
const nextPaint=()=>new Promise(r=>requestAnimationFrame(()=>setTimeout(r,0)));
async function loadWorldFromMenu(slotId){
  if(inGameplay){const checkpoint=await saveManager.saveNow('before-world-switch');if(!checkpoint)throw Error('Save the active world before switching.');}
  showSaveStatus('Loading world...',{duration:60000});await nextPaint();
  const loaded=await saveManager.load(slotId);if(!loaded){showSaveStatus('This world could not be loaded',{error:true,duration:4000});throw Error('This world has no playable save.')}
  installSimulation(loaded,{resume:true});closeGameMenus();await renderer.sceneReady();await nextPaint();const migration=[birthRuleMigrationMessage(loaded),ecologyRuleMigrationMessage(loaded)].filter(Boolean).join(' ');showSaveStatus(migration?`World loaded. ${migration}`:'World loaded',{duration:migration?6500:1400});return true;
}
async function exportScenarioFromMenu(slotId){
  if(inGameplay&&slotId===saveManager.activeSlotId){
    const saved=await saveManager.saveNow('scenario-export');
    if(!saved)throw Error('Save this world before exporting it.');
  }
  if(saveManager.activeSave)await saveManager.activeSave;
  const snapshot=await saveManager.loadSnapshot(slotId);
  if(!snapshot)throw Error('Saved world could not be found.');
  const savedWorld=(await saveManager.listWorlds()).find(w=>w.key===slotId);
  const label=savedWorld?.worldName||'GenVo Evolved World';
  const id='recorded-'+Date.now().toString(36);
  const bundle=packageScenarioSnapshot(snapshot,{id,label,
    description:'Recorded from a real GenVo world. Independent history and RNG preserved.'});
  const blob=new Blob([JSON.stringify(bundle)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  try{
    a.href=url;a.download=id+'.json';document.body.append(a);a.click();
  }finally{a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);}
}
async function createWorldFromMenu({name,seed:chosenSeed,geography='freshwater/1',
 start='new',scenarioFile=null,catalogEntry=null,creature='recorded',movementRules='recorded'}){
  if(!['recorded','current'].includes(movementRules))throw Error('Unsupported movement continuation mode.');
  if(start==='new'&&movementRules==='current')throw Error('New ecology already uses current movement rules.');
  if(!['recorded','resident','guided','sandbox',...physicalStarterIds.map(id=>'starter-'+id)].includes(creature))throw Error('Unsupported starting creature mode.');
  if(creature.startsWith('starter-')&&start!=='new')throw Error('Physical starting bodies require a fresh Day 1 world.');
  if(start==='new'&&!['freshwater/1','planetary/1'].includes(geography))
    throw Error('Unsupported new-world geography.');
  if(inGameplay){const checkpoint=await saveManager.saveNow('before-world-switch');
    if(!checkpoint)throw Error('Save the active world before switching.');}
  showSaveStatus(start==='new'?'Preparing ecosystem...':'Restoring evolved ecosystem...', {duration:60000});
  await nextPaint();
  let next,sourceSnapshot;
  if(start==='new'){
    const nextSeed=chosenSeed||'GENVO-'+Math.random().toString(16).slice(2,10).toUpperCase();
    next=new Simulation(nextSeed,{player:true,...SURVIVAL_OPT_IN,worldGenerator:geography,regionalFrontier:geography==='planetary/1'});
    // Freeze this world's copy of the living library; later registrations from
    // other worlds never change how this world founds its regions.
    if(next.evolvedLibraryRules){try{const entries=await saveManager.listEvolvedLibrary();if(entries.length)next.foundingLibrary=entries.map(({sightings,...e})=>e)}catch(error){console.warn('Evolutionary library unavailable',error)}}
  }else{
    let snapshot;
    if(start.startsWith('fork:')){
      if(saveManager.activeSave)await saveManager.activeSave;
      const slot=start.slice(5);
      if(!(await saveManager.listWorlds()).some(w=>w.key===slot))throw Error('Source world not found.');
      snapshot=await saveManager.loadSnapshot(slot);
    }else if(start==='import'){
      if(!scenarioFile)throw Error('Choose a recorded GenVo scenario package.');
      if(scenarioFile.size>160*1024*1024)throw Error('Scenario package is too large.');
      snapshot=openScenarioSnapshot(await parseScenarioDocument(await scenarioFile.arrayBuffer(),{name:scenarioFile.name}));
    }else if(start.startsWith('catalog:')){
      if(!catalogEntry||catalogEntry.id!==start.slice(8))throw Error('Unknown curated scenario.');
      snapshot=await loadBundledScenario(catalogEntry,{digest:sha256Hex});
    }else throw Error('Unsupported starting world.');
    if(!snapshot)throw Error('Selected world contains no checkpoint.');
    // Restoration validates the entire real simulation state, rather than
    // inventing an advanced organism or faking its ancestry/generation.
    sourceSnapshot=snapshot;next=restoreSimulationSnapshot(structuredClone(snapshot));
    if(creature==='recorded'&&!next.player()?.alive)throw Error('This checkpoint has no living controllable lineage. Select a playable saved world.');
  }
  // A new slot is only allocated AFTER the source has been fully validated.
  // The source snapshot, RNG, player ancestry and archived regions stay intact.
  if(creature==='resident'){
    const id=await chooseResidentStart(next);if(id===null)return false;
    selectResidentStart(next,id);
  }
  if(creature==='guided'||creature==='sandbox'){
    const authored=await chooseAuthoredFounder(next,creature);if(!authored)return false;
  }
  if(creature.startsWith('starter-'))installPhysicalStarter(next,creature.slice('starter-'.length));
  if(start==='new'&&creature==='recorded')matchStartingFounderAppearance(next);
  let adoptedSlot=null;
  if(movementRules==='current')adoptedSlot=await saveManager.storeMovementContinuation(next,sourceSnapshot,{name,source:start==='import'?'import:'+scenarioFile.name:start});
  else await saveManager.allocateWorld(name);
  installSimulation(next,start==='new'?{fresh:true}:{resume:true});
  if(adoptedSlot)saveManager.setActiveSlot(adoptedSlot.slotId);
  if(start==='new'||creature==='guided'||creature==='sandbox')tutorial.showWelcome();
  if(next.creatureStart?.starterFocus)tutorial.showToast(PHYSICAL_STARTERS[next.creatureStart.starterFocus].hint,7200,'safe','action');
  closeGameMenus();await renderer.sceneReady();await nextPaint();
  try{const saved=await saveManager.saveNow(start==='new'?'world-start':'world-scenario-fork');
    if(!saved)showSaveStatus(adoptedSlot?'The continuation and original backup are saved; recent play could not be saved.':'Storage unavailable. This world is not saved.',{error:true,duration:6500});
  }catch(error){console.error(error);showSaveStatus(adoptedSlot?'The continuation and original backup are saved; recent play could not be saved.':'Could not save the new world.',{error:true,duration:6500});}
  return true;
}
const frontEnd=new FrontEnd({saveManager,audio,
  getWorldInfo:()=>`Generation ${sim.player()?.generation||sim.lineage?.highestGeneration||1} · Year ${sim.year||1}, Day ${sim.day||1}${sim.creatureStart?.kind==='authored-founder'?' · Authored '+sim.creatureStart.mode+' start':''}${planetaryPositionLabel(sim)?' · '+planetaryPositionLabel(sim):''}`,
  onContinue:loadWorldFromMenu,onLoad:loadWorldFromMenu,onCreate:createWorldFromMenu,onExportScenario:exportScenarioFromMenu,
  onSave:async()=>{const checkpoint=await saveManager.saveNow('manual');if(!checkpoint)throw Error('Unable to save this world.');return checkpoint},
  onResume:()=>closeGameMenus(),
  onReturn:async(save)=>{
    if(save){const checkpoint=await saveManager.saveNow('manual-return');if(!checkpoint)throw Error('Unable to save this world.');}
    sim.paused=true;clearMovementKeys();inGameplay=false;closeDetailPanels();journal.setOpen(false);
    if(pauseNotice)pauseNotice.hidden=true;return true;
  }
});
frontEnd.onZoom=z=>{renderer.zoom=z};
sim.paused=true;
// Progressive load: procedural fallback remains playable if native art is absent or invalid.
loadNativePartCatalog().then(result=>{if(result.errors.length)console.warn('GenVo art fallback:',result.errors)});
function closeDetailPanels(except=''){
  if(except!=='journal')journal.setOpen(false);
  if(except!=='mate')mateOpen=false;if(except!=='mind')mindOpen=false;if(except!=='territory')territoryOpen=false;
  if(except!=='shelter')shelterOpen=false;if(except!=='migration')migrationOpen=false;if(except!=='population')ecologyOpen=false;
  if(except!=='help')helpOpen=false;if(except!=='guide')guideOpen=false;
}
document.addEventListener('click',e=>{const close=e.target.closest('[data-knowledge-close]');if(close){closeDetailPanels();document.getElementById(close.dataset.knowledgeClose).hidden=true}});
function toggleQuickPanel(name){
  audio.unlock();
  if(name==='guide'){const next=!guideOpen;closeDetailPanels('guide');guideOpen=next}
  else if(name==='journal'){const next=!journal.open;closeDetailPanels('journal');journal.setOpen(next)}
  else if(name==='map'){const next=!(fieldGuide.open&&fieldGuide.page==='map');closeDetailPanels();fieldGuide.page='map';fieldGuide.setOpen(next);quickMenu.hidden=true;document.querySelector('#stageUtilities>button')?.setAttribute('aria-expanded','false')}
  else if(name==='territory'){const next=!territoryOpen;closeDetailPanels('territory');territoryOpen=next}
  else if(name==='population'){const next=!ecologyOpen;closeDetailPanels('population');ecologyOpen=next}
  else if(name==='help'){const next=!helpOpen;closeDetailPanels('help');helpOpen=next}
  audio.note('confirm');
}
tutorial.tutorial?.addEventListener('click',e=>{if(!tutorial.tutorial.classList.contains('compact'))return;e.preventDefault();toggleQuickPanel('guide')});
tutorial.tutorial?.addEventListener('keydown',e=>{if(tutorial.tutorial.classList.contains('compact')&&(e.code==='Enter'||e.code==='Space')){e.preventDefault();e.stopPropagation();toggleQuickPanel('guide')}});
const leadershipWheel=new LeadershipWheel({
  canvas,renderer,getSim:()=>sim,
  canOpen:()=>!sim.paused&&!tutorial.worldInputBlocked?.()&&!journal.open&&!mateOpen&&!mindOpen&&!territoryOpen&&!shelterOpen&&!migrationOpen&&!ecologyOpen&&!helpOpen&&!guideOpen,
  onFeedback:r=>{tutorial.showToast(r.message,r.quiet?2600:r.ok?1350:1900,r.ok?'safe':'warn');if(!r.quiet)audio.note(r.ok?'confirm':'deny')},
  onModeChange:active=>{if(active)closeDetailPanels();updateHUD(sim,{renderer,mateOpen,mindOpen,territoryOpen,shelterOpen,migrationOpen,ecologyOpen,helpOpen,guideOpen,journalOpen:journal.open,commandMode:active})}
});
quickMenu?.addEventListener('click',e=>{
  const command=e.target.closest('button[data-command="leadership"]');if(command){e.preventDefault();e.stopPropagation();if(!leadershipWheel.commandMode)closeDetailPanels();leadershipWheel.toggleCommandMode();return}
  const speed=e.target.closest('button[data-action="speed"]');if(speed){e.preventDefault();e.stopPropagation();changeSpeed('wrap');return}
  const autonomy=e.target.closest('button[data-action="autonomy"]');if(autonomy){e.preventDefault();e.stopPropagation();const on=sim.togglePlayerAutonomy();if(!on)applyObserverResult(observer.onManualInput());clearMovementKeys();tutorial.showToast(on?'Automation on · selected creature is acting on its own.':'Automation off · manual control.',1800,on?'safe':'success');audio.note('confirm');updateHUD(sim,{renderer,mateOpen,mindOpen,territoryOpen,shelterOpen,migrationOpen,ecologyOpen,helpOpen,guideOpen,journalOpen:journal.open,commandMode:leadershipWheel.commandMode});return}
  const b=e.target.closest('button[data-panel]');if(!b)return;e.preventDefault();e.stopPropagation();leadershipWheel.setCommandMode(false);toggleQuickPanel(b.dataset.panel)
});

function toggleFamilyPassage(){
  if(!sim.planetaryRegions||tutorial.worldInputBlocked?.()||frontEnd.isOpen)return;
  sim.travelFamilyGroup=!sim.travelFamilyGroup;
  tutorial.showToast(sim.travelFamilyGroup?'Family passage on. Gather relatives and dependents close to the border.':'Family passage off. Cross alone if no young depend on you.',2600,'safe');
  audio.note('confirm');
}
let planetaryTravelPending=false;
async function travelPlanetaryRegion({automatic=false}={}){
  if(planetaryTravelPending||sim.tickInProgress||tutorial.worldInputBlocked?.()||frontEnd.isOpen||editor.open||succession.open)return;
  planetaryTravelPending=true;
  try{
    const source=sim,status=planetaryTravelAvailability(source);if(!status.enabled){tutorial.showToast(status.reason,2600,'warn');return}
    let preparedDestination=null;
    if(!source.planetaryTravel?.sessions?.some(s=>s.key===status.to.x+','+status.to.y)&&!source.planetaryRegions.get(status.to,{create:false})){
      const ready=await planetaryPreparation.request(source,status.to);
      if(sim!==source||source.paused||frontEnd.isOpen||editor.open||succession.open)return;
      if(automatic&&(planetaryWalkIntent(source,{up:keys.KeyW||keys.ArrowUp,down:keys.KeyS||keys.ArrowDown,left:keys.KeyA||keys.ArrowLeft,right:keys.KeyD||keys.ArrowRight})||pointerApproach?.regionalIntent(source))!==status.direction)return;
      if(!ready)throw Error('Neighbor preparation could not finish.');preparedDestination=planetaryPreparation.take(source,status.to);
      if(!preparedDestination)return;
    }
    const result=crossPlanetaryBorder(sim,{preparedDestination});
    if(!result.ok){tutorial.showToast(result.message,2600,'warn');audio.note('deny');return}
    installSimulation(result.simulation,{resume:true,keepMovement:automatic,regionalCrossing:true});closeDetailPanels();if(!automatic)clearMovementKeys();
    tutorial.showToast(result.message,3500,'success');audio.note('confirm');
  }catch(error){console.error('Regional crossing failed:',error);tutorial.showToast('Regional passage could not be completed. Current world remains active.',3500,'warn');audio.note('deny')}finally{planetaryTravelPending=false}
}
function installSimulation(next,{fresh=false,resume=false,keepMovement=false,regionalCrossing=false}={}){const previous=sim;previous?.finishTick?.();clearWarmRegions();
  cancelPlanetarySeams(sim);planetaryWork.clear();planetaryPreparation.clear();const continuedScene=regionalCrossing&&renderer.continueRegionalScene(previous,next);seed=next.seed;sim=next;renderer.sim=sim;observer.reset();succession.close();editor.close();syncSpeedButton();frameStepper.reset();last=performance.now();hudTimer=0;if(!keepMovement)clearMovementKeys();
  manualPause=resume?!!sim.paused:false;if(!resume)sim.paused=false;if(pauseNotice)pauseNotice.hidden=!manualPause;
  leadershipWheel.resetDiscovery();tutorial.setSimulation(sim,{fresh,resume:resume||regionalCrossing});effectFeedback.setSimulation(sim);journal.setSimulation(sim);audio.setSimulation(sim);diagnostics.setSim(sim);
  mateOpen=false;mindOpen=false;territoryOpen=false;shelterOpen=false;migrationOpen=false;ecologyOpen=false;helpOpen=false;guideOpen=false;leadershipWheel.setCommandMode(false);saveManager.resetObservation(sim);if(!continuedScene)renderer.beginScenePreparation();if(regionalCrossing&&keepMovement)pointerApproach?.continueRegional(previous,next);
  updateHUD(sim,{renderer,mateOpen,mindOpen,territoryOpen,shelterOpen,migrationOpen,ecologyOpen,helpOpen,guideOpen,journalOpen:journal.open,commandMode:false});journal.update();
}
function resetRun(){
  const nextSeed='GENVO8-'+Math.random().toString(16).slice(2,8).toUpperCase();
  installSimulation(new Simulation(nextSeed,{player:true,...SURVIVAL_OPT_IN,worldGenerator:sim.world.generator,regionalFrontier:sim.world.generator==='planetary/1'}),{fresh:true});
}
async function loadSavedLineage(){
  try{
    const loaded=await saveManager.load();
    if(!loaded){showSaveStatus('No saved checkpoint found',{error:true});return false}
    installSimulation(loaded,{resume:true});closeGameMenus();showSaveStatus([birthRuleMigrationMessage(loaded),ecologyRuleMigrationMessage(loaded)].filter(Boolean).join(' ')||'World restored',{duration:6000});return true;
  }catch(error){console.error(error);showSaveStatus('Could not load saved checkpoint',{error:true,duration:3500});return false}
}
saveNowButton?.addEventListener('click',()=>saveManager.saveNow('manual').catch(error=>console.error(error)));
loadSaveButton?.addEventListener('click',()=>{if(confirm('Load the last saved lineage? Unsaved progress since that save will be lost.'))loadSavedLineage()});
// Day-boundary slicing: input that arrives while a tick is running across frames
// is held and replayed in order once it completes, so no command acts on a
// half-advanced world. Text fields and browser shortcuts are never held.
const heldInput={queue:[],replaying:new WeakSet(),
  hold(e){
    if(informationNavigationEvent(e)||!sim.tickInProgress||this.replaying.has(e)||e.ctrlKey||e.metaKey||e.target?.closest?.('input,textarea,select,[contenteditable="true"],[data-knowledge-close],[data-notice-scroll],[data-processing-disclosure]'))return;
    if(MOVE_CODES.has(e.code))return;
    if(e.repeat){e.preventDefault();e.stopImmediatePropagation();return}
    if(this.queue.some(q=>q.type===e.type&&q.code===e.code)){e.preventDefault();e.stopImmediatePropagation();return}
    e.preventDefault();e.stopImmediatePropagation();this.queue.push(e);
  },
  replay(){const queue=this.queue;this.queue=[];for(const e of queue){const init={bubbles:e.bubbles,cancelable:e.cancelable,composed:e.composed};for(const k of ['key','code','location','repeat','shiftKey','altKey','ctrlKey','metaKey','clientX','clientY','screenX','screenY','button','buttons','detail','pointerId','pointerType','isPrimary','width','height','pressure'])if(k in e)init[k]=e[k];const copy=new e.constructor(e.type,init);this.replaying.add(copy);(e.target?.isConnected?e.target:window).dispatchEvent(copy)}}};
for(const type of ['keydown','keyup','pointerdown','pointerup','mousedown','mouseup','click','dblclick','contextmenu'])addEventListener(type,e=>heldInput.hold(e),{capture:true});
addEventListener('pointerdown',()=>{audio.unlock()},{passive:true});
addEventListener('keydown',e=>{
  if(informationNavigationEvent(e))return;
  if(e.target.closest?.('#interactionDock,.context-radial,#stageUtilities,[data-knowledge-close]')&&['Tab','Enter','Space'].includes(e.code))return;
  if(!MOVE_CODES.has(e.code)&&(!e.repeat||!audio.unlocked))audio.unlock();
  if(frontEnd.handleKey(e))return;
  if(legacySummary.open){if(!e.repeat&&(e.code==='Escape'||e.code==='Enter')){e.preventDefault();legacySummary.close()}return}
  if(youngSummary.open){if(!e.repeat&&(e.code==='Escape'||e.code==='Enter')){e.preventDefault();youngSummary.close()}return}
  if(!e.repeat&&e.code==='Escape'&&(fieldGuide.open||journal.open)){e.preventDefault();fieldGuide.setOpen(false);journal.setOpen(false);return}
  if(!e.repeat&&e.code==='Escape'&&(guideOpen||helpOpen||mateOpen||mindOpen||territoryOpen||shelterOpen||migrationOpen||ecologyOpen)){e.preventDefault();closeDetailPanels();return}
  if(!e.repeat&&(e.code==='Escape'||e.code==='KeyP')&&!tutorial.worldInputBlocked?.()&&!editor.open&&!succession.open){e.preventDefault();closeDetailPanels();journal.setOpen(false);sim.paused=true;clearMovementKeys();frontEnd.show('pause');return}
  if(tutorial.handleKey(e)){e.preventDefault();return}
  if(editor.handleKey(e)){e.preventDefault();return}
  if(succession.handleKey(e)){e.preventDefault();return}
  const panelOpen=journal.open||mateOpen||courtshipTray.isOpen||mindOpen||territoryOpen||shelterOpen||migrationOpen||ecologyOpen||helpOpen||guideOpen||leadershipWheel.commandMode;
  if(e.code==='Tab'&&!e.repeat&&!panelOpen){e.preventDefault();if(sim.paused){if(manualPause)tutorial.showToast('Paused · press P to resume.',1200,'safe');return}const result=sim.switchFamilyControl(e.shiftKey?-1:1);clearMovementKeys();if(result.ok){tutorial.showToast(`G${result.to.generation} #${result.to.id} · ${relativeSummary(sim,result.to)} · ${result.index+1}/${result.count}${result.autonomy?' · AUTO':''}`,2600,'safe');audio.note('confirm')}else{tutorial.showToast(result.message,1800,'warn');audio.note('deny')}return}
  if(MOVE_CODES.has(e.code)||MANUAL_TAKEOVER_CODES.has(e.code)){applyObserverResult(observer.onManualInput());takeManualControl()}
  if((e.code==='BracketRight'||e.code==='BracketLeft')&&!e.repeat){e.preventDefault();changeSpeed(e.code==='BracketRight'?1:-1);return}
  if(e.code==='KeyR'&&!e.repeat){e.preventDefault();if(!sim.player())resetRun();else if(!sim.paused){if(!leadershipWheel.commandMode)closeDetailPanels();leadershipWheel.toggleCommandMode()}return}
  if(!leadershipWheel.el?.hidden&&e.code!=='Escape')leadershipWheel.close();
  // P and Escape are handled by the authored pause navigator above.
  if(sim.paused&&WORLD_ACTION_CODES.has(e.code)){e.preventDefault();if(manualPause)tutorial.showToast('Paused · press P to resume.',1200,'safe');return}
  if(sim.paused&&MOVE_CODES.has(e.code)){e.preventDefault();return}
  if(MOVE_CODES.has(e.code)){sim.discovery.cancelTraceFollow();if(pointerApproach?.validate)pointerApproach.interrupt('Home approach cancelled by movement.');else pointerApproach?.cancel();keys[e.code]=true;movementInputBuffer.onKeyDown(e.code,e.timeStamp||performance.now());}if(e.code==='KeyJ'&&!e.repeat&&courtshipTray.isOpen){sim.reproduction.cancelCourtship();courtshipTray.close()}
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();
  // Space is the dedicated attack: a short wind-up, then the strike resolves on its own.
  if(e.code==='Space'&&!e.repeat){if(document.activeElement?.tagName==='BUTTON')document.activeElement.blur();contextTray.attack({pounce:!!(keys.ShiftLeft||keys.ShiftRight)})}
  if(e.code==='KeyY'&&!e.repeat){fieldGuide.toggle();return}
  // v1.57.0: the backquote key shows a frame-rate counter, so a player can report how the game runs.
  if(e.code==='Backquote'&&!e.repeat){if(e.shiftKey)fpsMeter.toggleLow();else fpsMeter.toggle();return}
  if(e.code==='KeyU'&&!e.repeat){const enabled=audio.toggleMute();tutorial.showToast(`Audio ${enabled?'on':'muted'}.`,1500,enabled?'success':'safe');if(enabled)audio.note('confirm')}
  if(/^Digit[1-5]$/.test(e.code)&&!e.repeat&&!mateOpen&&!courtshipTray.isOpen){const index=Number(e.code.slice(-1))-1,ok=sim.familyDirectives.setByIndex(index),st=sim.familyDirectives.status(),scope=st.scope?.multipleTaxa?(st.scope.scope==='taxon'?st.scope.label:'Whole lineage'):'Family';const locked=index===4&&!st.scoutUnlocked;tutorial.showToast(locked?'Scout unlocks when 3 adults sustain 6 familiar cells.':st.available?`${scope} · ${st.short}`:`${scope} · ${st.short} · no grown relatives yet`,locked?2200:1500,locked?'warn':'safe');audio.note(ok?'confirm':'deny')}
  if(e.code==='Slash'&&!e.repeat){guideOpen=false;helpOpen=!helpOpen;}
  if(e.code==='KeyO'&&!e.repeat){guideOpen=false;ecologyOpen=!ecologyOpen;}
  if(e.code==='KeyL'&&!e.repeat){journal.toggle();if(journal.open){mateOpen=false;mindOpen=false;territoryOpen=false;shelterOpen=false;migrationOpen=false;ecologyOpen=false;helpOpen=false;guideOpen=false}}
  if(e.code==='KeyM'&&!e.repeat){mateOpen=!mateOpen;if(mateOpen)sim.reproduction.refreshSelection()}
  if(e.code==='KeyI'&&!e.repeat)mindOpen=!mindOpen;
  if(e.code==='KeyT'&&!e.repeat){guideOpen=false;territoryOpen=!territoryOpen;}
  if(e.code==='KeyB'&&!e.repeat)shelterOpen=!shelterOpen;
  if(e.code==='KeyK'&&!e.repeat)migrationOpen=!migrationOpen;
  if(e.code==='KeyG'&&!e.repeat)sim.migration.togglePlayer(sim.player());
  if((e.code==='PageDown'||e.code==='PageUp')&&!e.repeat){e.preventDefault();const r=sim.playerDive({surface:e.code==='PageUp',deeper:e.code==='PageDown'});tutorial.onInteraction(r);audio.noteResult(r)}
  if(e.code==='Enter'&&!e.repeat){e.preventDefault();const r=sim.playerJump();tutorial.onInteraction(r);audio.noteResult(r)}
  if(e.code==='Digit0'&&!e.repeat){const r=sim.playerToggleGlide();tutorial.onInteraction(r);audio.noteResult(r)}
  if(e.code==='Digit6'&&!e.repeat){const r=sim.playerToggleFlight();tutorial.onInteraction(r);audio.noteResult(r)}
  if(e.code==='Digit7'&&!e.repeat){const r=sim.playerToggleRoost();tutorial.onInteraction(r);audio.noteResult(r)}
  if(e.code==='Digit8'&&!e.repeat){const r=sim.playerToggleTorpor();tutorial.onInteraction(r);audio.noteResult(r)}
  if(e.code==='Digit9'&&!e.repeat){e.preventDefault();travelPlanetaryRegion();return}
  if(e.code==='KeyN'&&!e.repeat){if(sim.shelter.canBuildHere(sim.player()).ok&&!tutorial.confirmProtectedAction('build a shelter'))return;const r=sim.shelter.constructOrRepair(sim.player());tutorial.onShelterAction?.(r);audio.noteResult(r)}
  if(e.code==='KeyF'&&!e.repeat){const r=sim.shelter.cacheNearbyFood(sim.player());tutorial.onShelterAction?.(r);audio.noteResult(r)}
  if(e.code==='KeyX'&&!e.repeat){const r=sim.playerAlarm();tutorial.onInteraction(r);audio.noteResult(r)}
  if(e.code==='KeyV'&&!e.repeat){if(mateOpen){const r=sim.reproduction.cycleBroodStrategy();tutorial.showToast(r.ok?`Brood strategy: ${r.strategy}`:r.reason,1800,r.ok?'safe':'warn');audio.note(r.ok?'confirm':'deny')}else{const r=sim.playerHide();tutorial.onInteraction(r);audio.noteResult(r)}}
  if(e.code==='KeyZ'&&!e.repeat){const r=sim.playerCarry();tutorial.onInteraction(r);audio.noteResult(r)}
  if(['Minus','NumpadSubtract','Equal','NumpadAdd'].includes(e.code)&&!e.repeat){e.preventDefault();zoomCamera(e.code==='Minus'||e.code==='NumpadSubtract'?-1:1)}
  if(e.code==='Semicolon'&&!e.repeat){const r=sim.playerThreatDisplay();tutorial.onInteraction(r);audio.noteResult(r)}
  if(e.code==='KeyQ'&&!e.repeat){if(mateOpen)sim.reproduction.cycleMate(-1);else if(journal.open)journal.cycle(-1);else contextTray.cycleInteract()}
  if(e.code==='KeyE'&&!e.repeat){
    if(mateOpen){sim.reproduction.cycleMate(1);audio.note('confirm')}
    else if(journal.open){journal.cycle(1);audio.note('confirm')}
    else if(e.shiftKey)contextTray.drink();else contextTray.interact();
  }
  if((mateOpen||courtshipTray.isOpen)&&!e.repeat&&['Digit1','Digit2','Digit3','Digit4','Digit5'].includes(e.code)){
    const action={Digit1:'dance',Digit2:'call',Digit3:'flare',Digit4:'scent',Digit5:'gesture'}[e.code];
    const r=sim.player()?.courtshipPerformance?sim.reproduction.changeLiveMove(action):sim.reproduction.queueRitualMove(action);
    tutorial.showToast(r.ok?'Ritual: '+r.sequence.join(' → '):r.reason,1700,r.ok?'safe':'warn');
    audio.note(r.ok?'confirm':'deny');
  }
  if((mateOpen||courtshipTray.isOpen)&&!e.repeat&&e.code==='Backspace'){
    e.preventDefault();sim.reproduction.clearRitualQueue();tutorial.showToast('Ritual cleared',1200,'safe');
  }
  if(e.code==='KeyC'&&!e.repeat){
    // Phase 4: C courts the best nearby ready partner even when the mate panel was never opened, and
    // a refusal says why on screen instead of failing silently.
    let ok;if(courtshipTray.isOpen)ok=courtshipTray.play();else{if(!sim.reproduction.selectedMate())sim.reproduction.refreshSelection();ok=sim.reproduction.courtSelected();if(ok&&!mateOpen)courtshipTray.show(sim.reproduction.courtTargetId);
      if(!ok){const why=sim.reproduction.selectedMate()?sim.reproduction.courtshipAvailability().reason:'No ready partner nearby. Partners need to be adult, healthy and well fed.';tutorial.showToast(why||'No partner can be courted right now.',2000,'warn')}}
    audio.note(ok?'court':'deny');
  }
  if(e.code==='KeyH'&&!e.repeat){if(journal.open)journal.handoffSelected();else if(!sim.paused||succession.open){const r=succession.request();if(!r.ok&&r.message){tutorial.showToast(r.message,1800,'warn');audio.note('deny')}}}
  if(e.code==='Escape'&&!e.repeat&&fieldGuide.open){fieldGuide.setOpen(false);return}
  if(e.code==='Escape'&&!e.repeat){leadershipWheel.setCommandMode(false);journal.setOpen(false);mateOpen=false;mindOpen=false;territoryOpen=false;shelterOpen=false;migrationOpen=false;ecologyOpen=false;helpOpen=false;guideOpen=false}
});
addEventListener('keyup',e=>{if(MOVE_CODES.has(e.code)){keys[e.code]=false;movementInputBuffer.onKeyUp(e.code,e.timeStamp||performance.now());if(!audio.unlocked)audio.unlock()}});
addEventListener('blur',clearMovementKeys);

function input(consume=false){const manual=movementInputBuffer.read({...keys,brace:braceInput.read()||!!keys.KeyJ},consume);return pointerApproach?pointerApproach.read(manual):manual}
// One fair background admission per rendered frame; canonical ticks remain atomic.
const planetaryWork=new PlanetaryWorkQueue({isCurrent:target=>target===sim});
const playing=target=>target===sim&&!frontEnd.isOpen&&!target.paused&&!target.tickInProgress&&renderer.sceneShown;
const planetaryPreparation=new PlanetaryPreparation({schedule:run=>planetaryWork.enqueue('destination',sim,run,{ready:playing})});
const farRegions={jobs:0,observe(target){
 if(!target.regionalDemographyRules)return;
 if(!target.farRegionDriver)Object.defineProperty(target,'farRegionDriver',{value:true,configurable:true});
 planetaryWork.enqueue('biology',target,()=>{if(advanceNextDemographicRegion(target))this.jobs++},{ready:playing});
}};
const borderPreparation={observe(target){
 if(!target.world.planet||!renderer.borderTerrain)return;
 planetaryWork.enqueue('border',target,()=>renderer.borderTerrain.prepareNext(target),{ready:()=>!frontEnd.isOpen&&!sim.tickInProgress&&renderer.sceneShown});
}};
const regionalResidency={last:null,observe(target){
 if(!saveManager.available||!target.regionalResidencyRules)return;
 planetaryWork.enqueue('residency',target,async()=>{try{const result=await saveManager.maintainRegionalResidency(target);if(result&&target===sim)this.last=result}catch(error){if(target===sim)this.last={action:'error',message:error.message};throw error}},{ready:playing});
}};
const frameStepper=new FrameStepper({controlHz:CFG.controlHz,simHz:CFG.simHz});
const planetLocation=document.querySelector('#planetLocation');
let last=performance.now(),hudTimer=0,lastFrontierWarning=-Infinity;
function frame(now){
  const frameWorkStart=performance.now();
  const dt=Math.max(0,Math.min(.1,(now-last)/1000));last=now;
  const controls=input(false);
  // An archived-region job runs across frames like a sliced tick: once started it
  // always completes first, even while paused, and admits nothing else that frame.
  const regionalJob=sim.regionalJobPending,regionalDeadline=frameWorkStart+frameStepper.sliceMs;
  if(regionalJob){sim.stepRegionalBiology(regionalDeadline);if(!sim.tickInProgress)heldInput.replay()}
  const processing=frameStepper.advance(dt,observer.speed,hz=>sim.playerControlStep(input(true),hz),deadline=>sim.beginTick(input(false),{externalPlayerControl:true},deadline),{paused:sim.paused||!renderer.sceneShown,beforeStep:()=>!regionalJob&&!sim.stepRegionalBiology(regionalDeadline)&&!preparePlanetarySeams(sim),
    resume:deadline=>{const done=sim.continueTick(deadline);if(done)heldInput.replay();return done}});
  // While a tick runs across frames only the scene is drawn: no travel, regional
  // work, tutorial, editor, notices or HUD reads that act on a half-advanced world.
  if(processing.tickPending){renderer.renderOrPrepare();fpsMeter.frame();fpsMeter.recordWork(performance.now()-frameWorkStart);requestAnimationFrame(frame);return}
  setProcessingLoad(sim,processing);
  if(!frontEnd.isOpen&&!sim.paused)planetaryPreparation.observe(sim);
  if(!frontEnd.isOpen&&!sim.paused)regionalResidency.observe(sim);
  if(!frontEnd.isOpen)borderPreparation.observe(sim);
  if(!frontEnd.isOpen&&!sim.paused)farRegions.observe(sim);
  planetaryWork.frame();
  // Walking farther keeps expanding the SAME procedurally generated planet.
  // A real region swap still uses canonical family, physics and save authorities.
  const outward=planetaryWalkIntent(sim,{up:keys.KeyW||keys.ArrowUp,down:keys.KeyS||keys.ArrowDown,left:keys.KeyA||keys.ArrowLeft,right:keys.KeyD||keys.ArrowRight})||pointerApproach?.regionalIntent(sim);
  if(outward&&!frontEnd.isOpen&&!tutorial.worldInputBlocked?.()&&!editor.open&&!succession.open){
    const status=planetaryTravelAvailability(sim);
    if(status.enabled&&status.direction===outward)travelPlanetaryRegion({automatic:true});
    else if(pointerApproach?.regionalStep&&!status.retryable){const reason=status.reason||'No traversable crossing here.';pointerApproach.interrupt(reason);tutorial.showToast(reason,2800,'warn')}else if(performance.now()-lastFrontierWarning>3600){lastFrontierWarning=performance.now();tutorial.showToast(status.reason||'No traversable crossing here.',2800,'warn')}
  }
  const combatResult=sim.playerCombat.consumeResult();if(combatResult){if(!combatResult.quiet||combatResult.type!=='attack')tutorial.onInteraction(combatResult);audio.noteResult(combatResult)}
  sim.cognition.showOverlay=mindOpen;sim.territory.showOverlay=territoryOpen;sim.shelter.showOverlay=shelterOpen;sim.migration.showOverlay=migrationOpen;
  renderer.setPlayerPresentation(controls,frameStepper.presentationAhead);
  // Evolution Expansion: a waiting design opportunity opens the editor once nothing else is modal.
  if(!frontEnd.isOpen&&!editor.open&&!succession.open&&sim.evolutionEditor?.pending?.()&&editor.request())clearMovementKeys();
  if(!frontEnd.isOpen)tutorial.update();if(!frontEnd.isOpen)audio.update(dt,controls,renderer.encounters?.time);renderer.renderOrPrepare();contextTray.update();courtshipTray.update();tutorial.notifications.layout();fpsMeter.frame();hudTimer+=dt;fieldGuide.refresh(dt);
  if(hudTimer>.12){youngSummary.check();if(!frontEnd.isOpen&&!sim.paused){const beat=worldStory.observe(sim);if(beat)tutorial.showToast(beat.text,7000,beat.tone,'progress')}for(const v of sim.threatDisplayVerdicts||[]){const key=v.tick+':'+v.hunterId;if(!toldVerdicts.has(key)&&sim.tickCount-v.tick<CFG.simHz){if(toldVerdicts.size>64)toldVerdicts.clear();toldVerdicts.add(key);tutorial.showToast(verdictText(v),3200,v.deterred?'success':'warn','action')}}sim.lineage.refreshSelection();sim.reproduction.refreshSelection();leadershipWheel.sync();updateHUD(sim,{renderer,mateOpen,mindOpen,territoryOpen,shelterOpen,migrationOpen,ecologyOpen,helpOpen,guideOpen,journalOpen:journal.open,commandMode:leadershipWheel.commandMode});journal.update();const tendencyNotice=sim.tendency?.consumeNotice?.();if(tendencyNotice)tutorial.showToast(tendencyNotice.message,2600,'safe');const centerNotice=sim.populationEcology?.consumeNotice?.();if(centerNotice)tutorial.showToast(centerNotice.message,3200,centerNotice.tone||'warn');const memoryNotice=tutorial.toastEl?.hidden?sim.populationMemory?.consumeNotice?.():null;if(memoryNotice)tutorial.showToast(memoryNotice.message,3400,memoryNotice.tone||'safe');const protoNotice=tutorial.toastEl?.hidden?sim.protoSpeciation?.consumeNotice?.():null;if(protoNotice)tutorial.showToast(protoNotice.message,3600,protoNotice.tone||'success');const speciesNotice=tutorial.toastEl?.hidden?sim.speciation?.consumeNotice?.():null;if(speciesNotice)tutorial.showToast(speciesNotice.message,4000,speciesNotice.tone||'success');const coexistNotice=tutorial.toastEl?.hidden?sim.speciesCoexistence?.consumeNotice?.():null;if(coexistNotice)tutorial.showToast(coexistNotice.message,3600,coexistNotice.tone||'warn');const lifestyleNotice=tutorial.toastEl?.hidden?sim.speciesLifestyle?.consumeNotice?.():null;if(lifestyleNotice)tutorial.showToast(lifestyleNotice.message,3600,lifestyleNotice.tone||'success');const effectNotice=tutorial.toastEl?.hidden?effectFeedback.observe():null;if(effectNotice)tutorial.showToast(effectNotice.message,3000,effectNotice.tone||'safe');const controlStatus=sim.familyControlStatus?.();if(controlStatus?.unlocked&&!sim.familyControlExplained&&!tutorial.worldInputBlocked?.()&&tutorial.toastEl?.hidden){sim.familyControlExplained=true;tutorial.showToast('Family control unlocked · TAB switches relatives · AUTO lets the selected creature act on its own.',3600,'success')}saveManager.observe({eligible:!frontEnd.isOpen&&!sim.paused&&!tutorial.worldInputBlocked?.()});applyObserverResult(observer.observe());hudTimer=0}
  const label=planetaryPositionLabel(sim);
  if(planetLocation){planetLocation.hidden=!label;if(label&&planetLocation.textContent!==label)planetLocation.textContent=label}
  fpsMeter.recordWork(performance.now()-frameWorkStart);
  diagnostics.recordFrame(performance.now()-frameWorkStart,dt*1000);
  requestAnimationFrame(frame)
}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&!frontEnd.isOpen&&!tutorial.worldInputBlocked?.())saveManager.saveNow('visibility').catch(()=>{})});
addEventListener('pagehide',()=>{if(!frontEnd.isOpen&&!tutorial.worldInputBlocked?.())saveManager.saveNow('pagehide').catch(()=>{})});
frontEnd.refreshHome().catch(()=>{});
updateHUD(sim,{renderer,mateOpen,mindOpen,territoryOpen,shelterOpen,migrationOpen,ecologyOpen,helpOpen,guideOpen,journalOpen:journal.open,commandMode:leadershipWheel.commandMode});journal.update();requestAnimationFrame(frame);
// v1.57.0 frame-rate counter (toggle with the backquote key): frames per second, the slowest frame
// of the last second and the window size. v1.57.2: a second line shows the average milliseconds per
// frame spent in each part of drawing and in the simulation, so a slow machine can show what is slow.
// Performance mode (decorative foreground and weather layers off) turns on by itself after three
// slow seconds; Shift+backquote switches it by hand.
const fpsMeter=(()=>{const el=document.createElement('div');el.id='fpsMeter';el.hidden=true;document.querySelector('#app')?.appendChild(el);let n=0,worst=0,last=performance.now(),acc=0,slow=0,totalJS=0,worstJS=0;const parts={},phases={};
  const wrap=(o,name,label,bucket=parts)=>{const f=o?.[name];if(typeof f!=='function')return;o[name]=function(...a){if(el.hidden)return f.apply(this,a);const t=performance.now();try{return f.apply(this,a)}finally{bucket[label]=(bucket[label]||0)+performance.now()-t}}};
  for(const [m,l] of [['drawTerrainChunks','terrain'],['drawTile','tiles'],['drawTileDynamic','tiles'],['drawHabitatScenes','scenes'],['drawHabitatTransitions','scenes'],['drawRegionalFocals','scenes'],['drawSites','places'],['drawAnimal','creatures'],['drawForegroundHabitat','fringe'],['drawHabitatSceneForeground','fringe'],['drawSceneDepthForeground','fringe'],['drawWeatherOverlay','weather'],['processTerrainRefreshQueue','builds'],['syncScene','setup'],['drawLiveVegetationWindow','livePlants'],['stepTerrainChunkWork','chunkTasks'],['buildTerrainChunk','chunkSync'],['renderOrPrepare','renderTotal']])wrap(renderer,m,l);
  wrap(frameStepper,'advance','stepper');
  const simMethods=Object.getPrototypeOf(sim);
  wrap(simMethods,'update','sim');
  for(const name of ['phaseClimate','phaseSoil','phaseVegetation','phasePerception','phaseDecision','phaseMovement','phaseMetabolism','phaseLifecycle','advanceDay']){
    wrap(simMethods,name,name.replace('phase','').toLowerCase(),phases);
  }
  return{recordWork(ms){totalJS+=ms;worstJS=Math.max(worstJS,ms)},toggle(){el.hidden=!el.hidden},setLow(v){renderer.lowDetail=v},toggleLow(){renderer.lowDetail=!renderer.lowDetail},frame(){const t=performance.now(),dt=t-last;last=t;n++;acc+=dt;if(dt>worst)worst=dt;if(acc>=1000){const fps=Math.round(n*1000/acc);slow=fps<40?slow+1:0;if(slow>=3&&!renderer.lowDetail)renderer.lowDetail=true;
    if(!el.hidden){const top=Object.entries(parts).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${(v/n).toFixed(1)}`).join(' · ');const phaseTop=Object.entries(phases).sort((a,b)=>b[1]-a[1]).slice(0,9).map(([k,v])=>`${k} ${(v/n).toFixed(1)}`).join(' · ');const queue=frameStepper.pendingSeconds.toFixed(2),ticks=frameStepper.last.steps;el.textContent=`${fps} FPS · slowest ${Math.round(worst)} ms · JS ${Math.round(totalJS/n)} avg / ${Math.round(worstJS)} peak · ${innerWidth}×${innerHeight}${renderer.lowDetail?' · performance mode':''}\nms per frame: ${top}\nSim phases: ${phaseTop||'none'} · queued ${queue}s · steps ${ticks} · speed ${observer.speed}x`}
    for(const k in parts)parts[k]=0;for(const k in phases)phases[k]=0;n=0;acc=0;worst=0;totalJS=0;worstJS=0}}}})();
const courtshipTray=new CourtshipTray({getSim:()=>sim,blocked:()=>frontEnd.isOpen||editor.open||succession.open||journal.open||fieldGuide.open||mateOpen,
 onManual:()=>{takeManualControl();applyObserverResult(observer.onManualInput())},
 onFeedback:r=>{if(r.message||!r.ok&&r.reason)tutorial.showToast(r.message||r.reason,2400,r.ok?'success':'warn','action');audio.note(r.ok?'confirm':'deny')},
 onObserve:a=>{sim.discovery.noteCreatureAppearance(a);fieldGuide.specimenId=a.bodyPlan?.id?'observed:'+a.bodyPlan.id:null;fieldGuide.page='creatures';fieldGuide.catalogOpen=false;fieldGuide.setOpen(true)},onDetails:()=>{mateOpen=true;courtshipTray.close()}
});
pointerApproach=new PointerApproach({getSim:()=>sim,getRegionalCreature:target=>resolveRegionalCreature(sim,renderer.borderTerrain,target),getRegionWorld:origin=>renderer.borderTerrain?.sim===sim?renderer.borderTerrain.views.get(origin.x+','+origin.y)?.world:null,blocked:()=>frontEnd.isOpen||editor.open||succession.open||journal.open||fieldGuide.open||guideOpen||helpOpen||mateOpen||courtshipTray.isOpen});
const contextTray=new CreatureContextTray({canvas,renderer,braceInput,getSim:()=>sim,
 onSelect:()=>{sim.discovery.cancelTraceFollow();pointerApproach?.cancel();takeManualControl();if(courtshipTray.isOpen){sim.reproduction.cancelCourtship();courtshipTray.close()}},
 onClear:()=>{sim.discovery.cancelTraceFollow();pointerApproach?.cancel();sim.reproduction.cancelCourtship();courtshipTray.close()},
 canUseFamilyGuidance:(creature,resource)=>leadershipWheel.available()&&(!resource||resource.kind==='ground')&&(!creature||sim.controllableFamily().some(a=>a.id===creature.id)),
 onApproachAvailability:target=>pointerApproach.availability(approachGoal(sim,target)),
 onApproach:(target,onArrival,{quiet=false,ready=null,onInterrupted=null,validate=null}={})=>{const goal=approachGoal(sim,target);if(!goal)return;takeManualControl();clearMovementKeys();sim.reproduction.cancelCourtship();courtshipTray.close();applyObserverResult(observer.onManualInput());const result=pointerApproach.start(goal,onArrival,{ready,onInterrupted,validate});if(!quiet){tutorial.onInteraction(result);audio.noteResult(result)}return result},
 onCancelApproach:message=>pointerApproach?.interrupt(message),
 onFamilyTravel:toggleFamilyPassage,
 onRest:()=>{sim.discovery.cancelTraceFollow();pointerApproach?.cancel();if(sim.paused||sim.playerCombat.attackActive(sim.player()))return;takeManualControl();clearMovementKeys();sim.reproduction.cancelCourtship();courtshipTray.close();const a=sim.player();if(a){a.intent='idle';a.target=null;tutorial.showToast('Resting · regain breath while still. Move to resume.',1800,'safe');audio.note('confirm')}},stageBlocked:()=>tutorial.worldInputBlocked?.()||frontEnd.isOpen||editor.open||fieldGuide.open||journal.open||guideOpen||helpOpen||mindOpen||territoryOpen||shelterOpen||migrationOpen||ecologyOpen||mateOpen||succession.open||leadershipWheel.commandMode,
 onMode:mode=>{if(mode==='combat'&&courtshipTray.isOpen){const id=courtshipTray.targetId;sim.reproduction.cancelCourtship();courtshipTray.close();contextTray.targetId=id;contextTray.world=sim}},blocked:()=>tutorial.worldInputBlocked?.()||frontEnd.isOpen||editor.open||fieldGuide.open||journal.open||guideOpen||helpOpen||mindOpen||territoryOpen||shelterOpen||migrationOpen||ecologyOpen||mateOpen||courtshipTray.isOpen||succession.open||leadershipWheel.commandMode,
 onResult:r=>{if(!(r.ok&&r.type==='trace-follow'))sim.discovery.cancelTraceFollow();pointerApproach?.cancel();takeManualControl();tutorial.onInteraction(r);audio.noteResult(r)},
 onObserve:a=>{sim.discovery.noteCreatureAppearance(a);fieldGuide.specimenId=a.bodyPlan?.id?'observed:'+a.bodyPlan.id:null;fieldGuide.page='creatures';fieldGuide.catalogOpen=false;fieldGuide.setOpen(true)},
 onCourt:a=>{takeManualControl();if(!courtshipTray.show(a.id))tutorial.showToast('This creature is not currently an eligible mate.',1800,'warn')}
});
setInteractPromptSource(()=>{try{const c=contextTray.directChoice?.();return c?.enabled?c.label:null}catch{return null}});
journal.onRevisit=id=>{const o=sim.discovery.seedObservations?.find(o=>o.id===id);if(!o)return;journal.setOpen(false);const target=sim.discovery.seedPatchTarget(o);if(!contextTray.selectResource(target))return;const choice=contextTray.directChoice();if(choice?.enabled)contextTray.interact();else tutorial.showToast(choice?.reason||'This body cannot revisit the patch.',1800,'warn')};

window.__GENVO8__={installSimulation,travelPlanetaryRegion,diagnostics,movementInputBuffer,frameStepper,heldInput,youngSummary,worldStory,planetaryWork,planetaryPreparation,regionalResidency,borderPreparation,farRegions,get pointerApproach(){return pointerApproach},nativeArtStatus,courtshipTray,braceInput,contextTray,combatActions:()=>combatActions(sim),get sim(){return sim},CFG,setForm,formReading,tutorial,renderer,journal,audio,leadershipWheel,saveManager,loadSavedLineage,observer,editor,fieldGuide};
