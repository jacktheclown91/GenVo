import {restoreCarcassRules,validateCarcassSnapshot} from '../gameplay/carcass-rules.js';
import {restoreDiggingRules,validateDiggingSnapshot} from '../lineage/digging-rules.js';
import {restoreMassRules} from '../organisms/body-mass.js';
import {restoreEcologyRules} from '../ecology/rule-policy.js';
import {PlanetGeography} from '../world/planet-geography.js';
import {planetRegionOrigin,regionKey,validatePlanetaryTravelState,validatePlanetAnimalOwnership} from '../world/planet-regions.js';
import {World} from '../world/world.js';
import {restoreBirthRules} from '../lineage/birth-rules.js';
import {packFloraSeedBanks,unpackFloraSeedBanks} from './flora-seed-codec.js';
import {initializeOrganicResources,validateOrganicResources,validateCarriedMaterial} from '../ecology/organic-resource-cycle.js';
import {initializePlantResources,validatePlantResources} from '../ecology/plant-resources.js';
import {ancestralReproductiveGenome,validReproductiveGenome} from '../reproduction/reproductive-compatibility.js';
import {matePreferencesFor} from '../reproduction/mate-preferences.js';
import {CFG} from '../sim/config.js';
import {Simulation} from '../sim/simulation.js';
import {LEGACY_PRESSURE_KINDS} from '../lineage/pressure.js';
import {anatomyFromAdaptations} from '../lineage/evolution.js';
import {migrateLegacyReadings} from '../lineage/readings.js';
import {initializeFreshwater} from '../ecology/freshwater-food.js';
import {validatePageLayout} from '../world/pages.js';
import {restoreSurfaceTopology} from '../world/surface-topology.js';
import {deriveDrainage,validateTopography} from '../world/topography.js';
import {validateSoilWater} from '../ecology/soil-water.js';
import {validateSnowpack} from '../world/snowpack.js';
import {validateRemoteEnvironmentalLedger} from '../world/planetary-offscreen-environment.js';
import {validateRemoteBiologyLedger,regionalReplayPolicy} from '../world/planetary-offscreen-biology.js';
import {validatePageResidency} from '../ecology/page-residency.js';
import {validatePageDayWork} from '../world/page-vegetation-work.js';
import {validatePageSeedTransfers} from '../ecology/page-seed-transfers.js';
import {validatePageFaunaWork} from '../ecology/page-fauna-work.js';

// Schema 9 (v1.39.0): the new creature bodies. Creator decision 2026-10-09: start fresh, so older
// saves before schema 9 are not carried over.
// Schema 10 persists finite freshwater stocks; schema 9 initializes these stocks once.
export const SAVE_SCHEMA=10;
// Older schemas this build can upgrade in place. Schema 1 is v1.24 to v1.27.
export const MIGRATABLE_SAVE_SCHEMAS=Object.freeze([9]);
export const SAVE_DB='genvo8-saves';
export const SAVE_KEY='autosave';
const ACTIVE_WORLD_KEY='genvo-active-world-v1';
const safeSlot=id=>typeof id==='string'&&(id==='autosave'||/^world-[A-Za-z0-9-]{8,72}$/.test(id));
const SAVE_STORE='saves';
const META_STORE='meta';

const CONTROLLER_KEYS=[
  'lineage','reproduction','family','expansion','familyDirectives','cognition','territory','shelter','migration','regionalEcology',
  'recovery','carrying','pressure','history','sustainability','populationEcology','populationMemory','protoSpeciation',
  'evolutionTree','speciesCoexistence','speciesLifestyle','speciation','dispersal','disease','social','evolution',
  'specialization','tendency','divergence','generationProgress','predator','stalkerTerritory','foraging','exposure',
  'familyWeather','illness','familyIllness','injury','activity','wildlifeRhythm','exertion','playerCombat','habits','evolutionBudget','evolutionEditor','partAbilities','discovery'
];
const STRUCTURAL_KEYS=new Set(['seed','rng','world','animals','planetaryRegions','_player','spatial','spatialBucketSize','spatialCols',...CONTROLLER_KEYS]);
const WORLD_MUTABLE_FIELDS=['moisture','fertility','temperature','carrion'];

function ownState(object,{skip=[]}={}){
  const ignored=new Set(skip),state={};
  for(const [key,value] of Object.entries(object||{})){
    if(ignored.has(key)||typeof value==='function')continue;
    state[key]=value;
  }
  return state;
}

function snapshotWorld(world){
  const state={};
  for(const key of WORLD_MUTABLE_FIELDS)state[key]=world[key];
  state.organicResources=world.organicResources;state.plantResources=world.plantResources;if(world.soilWater){const {scratch,...soil}=world.soilWater;state.soilWater=soil;}
  state.plants={...world.plants};
  state.seedBank={...world.seedBank};
  state.freshwaterFood={...world.freshwaterFood};
  state.pageLayout=world.pages.layout();
  if(world.planet){state.planet=world.planet.descriptor;state.regionOrigin=planetRegionOrigin(world.regionOrigin);}
  state.generator=world.generator;state.topology=structuredClone(world.topology);
  state.environment=world.environment?{...world.environment}:null;
  state.terrain=world.terrain?{schema:1,elevation:world.terrain.elevation.slice(),travelEnabled:world.terrain.travelEnabled??false}:null;
  state.surfaceWater={schema:1,mask:world.water.slice()};
  return state;
}

function restoreTyped(target,source,label){
  if(!target||!source||typeof target.set!=='function')throw new Error(`Save is missing ${label}.`);
  if(target.length!==source.length)throw new Error(`Save ${label} size does not match this build.`);
  target.set(source);
}

function restoreWorld(world,state,{initializeMissingFreshwater=false}={}){
  if(!state)throw new Error('Save has no world state.');
  if(state.generator==='planetary/1'){
    const expected=planetRegionOrigin(world.regionOrigin),actual=planetRegionOrigin(state.regionOrigin||{x:0,y:0});
    if(expected.x!==actual.x||expected.y!==actual.y)throw Error('Saved planet region does not match its physical World.');
  }else if(state.regionOrigin!==undefined){
    if(state.planet)throw Error('Saved planet descriptor conflicts with saved generator.');
    throw Error('Nonplanetary world cannot have a region origin.');
  }
  if(state.generator==='planetary/1'){if(!state.planet)throw Error('Saved planet descriptor is missing.');world.planet=new PlanetGeography(world.seed,state.planet)}else{if(state.planet!=null)throw Error('Planet descriptor conflicts with saved generator.');delete world.planet}
  if(state.pageLayout)validatePageLayout(world,state.pageLayout);
  restoreSurfaceTopology(world,state);
  // Existing saves retain flat-ground hydrology; terrain is never retrofitted from a new generator.
  if(state.terrain!=null){validateTopography(world,state.terrain);world.terrain={schema:1,elevation:state.terrain.elevation.slice(),travelEnabled:state.terrain.travelEnabled??false};deriveDrainage(world);}else delete world.terrain;
  world.buildLandRegions();world.buildHydrology();
  for(const key of WORLD_MUTABLE_FIELDS)restoreTyped(world[key],state[key],`world.${key}`);
  if(!state.freshwaterFood&&initializeMissingFreshwater)initializeFreshwater(world);
  else for(const [kind,target] of Object.entries(world.freshwaterFood))restoreTyped(target,state.freshwaterFood?.[kind],`world.freshwaterFood.${kind}`);
  for(const [kind,source] of Object.entries(state.plants||{})){
    if(!world.plants[kind])continue;
    restoreTyped(world.plants[kind],source,`world.plants.${kind}`);
  }
  for(const [kind,source] of Object.entries(state.seedBank||{})){
    if(!world.seedBank[kind])continue;
    restoreTyped(world.seedBank[kind],source,`world.seedBank.${kind}`);
  }
  // New flora must not appear from generator defaults when an older world is loaded.
  for(const kind of Object.keys(world.plants))if(!Object.hasOwn(state.plants||{},kind))world.plants[kind].fill(0);
  for(const kind of Object.keys(world.seedBank))if(!Object.hasOwn(state.seedBank||{},kind))world.seedBank[kind].fill(0);
  if(state.plantResources){
    for(const kind of Object.keys(world.plantResources.energy)){
      if(!Object.hasOwn(state.plantResources.energy||{},kind))state.plantResources.energy[kind]=new Float64Array(world.len);
      if(!Object.hasOwn(state.plantResources.limits||{},kind))state.plantResources.limits[kind]=new Uint8Array(world.len);
    }
    validatePlantResources(world,state.plantResources);world.plantResources=state.plantResources;
  }else initializePlantResources(world);if(state.organicResources){validateOrganicResources(world,state.organicResources);world.organicResources=state.organicResources;}else initializeOrganicResources(world);if(state.soilWater){validateSoilWater(world,state.soilWater);
    // Earlier worlds never accumulated snow. Initialize only absent historical
    // fields to zero, never reconstruct invented past snowfall from the biome.
    const snowpack=state.soilWater.snowpack??new Float64Array(world.len);validateSnowpack(world,snowpack);
    world.soilWater={...state.soilWater,snowpack,totals:{...state.soilWater.totals,snowfall:state.soilWater.totals.snowfall??0,snowmelt:state.soilWater.totals.snowmelt??0},scratch:new Float32Array(world.len)};
  }else delete world.soilWater;
}

function snapshotControllers(sim){
  const out={};
  for(const key of CONTROLLER_KEYS){out[key]=ownState(sim[key],{skip:key==='familyIllness'?['sim','_familyTick','_familySize','_familyPlayer','_familyCache']:['sim']});if(key==='dispersal'&&out[key].floraState?.seeds)out[key].floraState={...out[key].floraState,seeds:packFloraSeedBanks(out[key].floraState.seeds)};}
  return out;
}

function restoreControllers(sim,state={}){
  for(const key of CONTROLLER_KEYS){
    const target=sim[key];let saved=state[key];if(key==='dispersal'&&saved?.floraState?.seeds?.codec)saved={...saved,floraState:{...saved.floraState,seeds:unpackFloraSeedBanks(saved.floraState.seeds)}};
    if(!target||!saved)continue;
    for(const ownKey of Object.keys(target))if(ownKey!=='sim'&&!(ownKey in saved))delete target[ownKey];
    Object.assign(target,saved);
    target.sim=sim;
  }
  // Active care membership is derived from restored actors, never stale saved references.
  sim.familyIllness._familyTick=-1;sim.familyIllness._familyCache=[];sim.familyIllness._familyPlayer=null;
  // Mouse routes are not saved; preserve learned evidence, never restore an unattended command.
  sim.discovery.following=null;
  // Public title changed GenVo8 -> GenVo. Old snapshots retain their technical
  // `genvo8-root` ID and any historically recorded descendant branch names.
  // Normalize only the ancestral display label, not branch IDs or lineage history.
  const root=sim.evolutionTree?.root?.();
  if(root?.id==='genvo8-root'&&root.label==='GenVo8')root.label='GenVo';
}

export function saveMetadata(sim,{savedAt=new Date().toISOString(),reason='autosave'}={}){
  const player=sim.player?.();
  return{
    key:SAVE_KEY,
    schema:SAVE_SCHEMA,
    gameVersion:CFG.version,
    savedAt,
    reason,
    seed:sim.seed,
    day:sim.day,
    year:sim.year,
    generation:player?.generation||sim.lineage?.highestGeneration||1,
    playerId:sim.playerId,
    lineageEstablished:!!sim.lineage?.established
  };
}

export function createSimulationSnapshot(sim,{reason='autosave',savedAt=new Date().toISOString()}={}){
  if(!sim)throw new Error('Cannot save without a simulation.');
  const core={};
  for(const [key,value] of Object.entries(sim)){
    if(STRUCTURAL_KEYS.has(key)||typeof value==='function')continue;
    core[key]=value;
  }
  return{
    key:SAVE_KEY,
    schema:SAVE_SCHEMA,
    gameVersion:CFG.version,
    savedAt,
    reason,
    seed:sim.seed,
    rngState:sim.rng.state,
    core,
    world:snapshotWorld(sim.world),
    // Remote physical regions are owned independently, never duplicated into
    // the active biome or inventing stock when a save is resumed.
    ...(sim.planetaryRegions&&sim.planetaryRegions.entries().some(e=>e.world!==sim.world&&!sim.planetaryTravel?.sessions?.some(s=>s.key===e.key))?{regionalWorlds:sim.planetaryRegions.entries().filter(e=>e.world!==sim.world&&!sim.planetaryTravel?.sessions?.some(s=>s.key===e.key)).map(e=>({origin:planetRegionOrigin(e.origin),world:snapshotWorld(e.world)}))}:{}),
    animals:sim.animals,
    controllers:snapshotControllers(sim),
    meta:saveMetadata(sim,{savedAt,reason})
  };
}

// v1.28 (schema 2): adds breath/brace/attack state on the active creature and pursuit
// stamina on engaged Stalkers. Old saves get full breath, no stance, and any in-progress
// Stalker hunt gets fresh pursuit stamina so it resolves under the new rules.
export function migrateSaveSnapshot(snapshot){
  if(!snapshot||typeof snapshot!=='object'||snapshot.schema===SAVE_SCHEMA)return snapshot;
  if(!MIGRATABLE_SAVE_SCHEMAS.includes(snapshot.schema))return snapshot;
  // Schema9 has current anatomy and protection state; add finite world food only.
  if(snapshot.schema===9){snapshot.migratedFrom=9;snapshot.schema=SAVE_SCHEMA;return snapshot}
  const animals=Array.isArray(snapshot.animals)?snapshot.animals:[];
  for(const a of animals){
    if(!a||typeof a!=='object')continue;
    if(a.species==='genvo'&&snapshot.schema<2){if(!Number.isFinite(a.exertion))a.exertion=CFG.exertion.max;a.exertionWinded=false;a.exertionDelay=0;a.bracing=false;a.attackAction=null}
    // Schema 3 (v1.30): lineage creatures start with no settled habits.
    if(a.species==='genvo'&&a.lineage&&!a.habits)a.habits={range:0,home:0,caution:0,boldness:0,hunting:0};
    // Schema 4 (v1.31): adaptations already earned stay on the animal; nobody was born with them this way.
    if(a.species==='genvo'&&!Array.isArray(a.bornWith))a.bornWith=[];
    if(a.species==='genvo'&&!Array.isArray(a.adaptations))a.adaptations=[];
    // Schema 6 (v1.32 Stage D): each adaptation becomes the body part that expresses it, so no creature gains or loses one.
    if(a.species==='genvo'&&!a.anatomy)a.anatomy=anatomyFromAdaptations(a.adaptations);
    // Schemas 7 and 8 (v1.32 Stages E and G): form and proto-trait strengths live on the body and
    // their history beside it, so every creature keeps exactly the form and trait it had.
    if(a.species==='genvo'&&('lineageForm' in a||'populationTrait' in a))migrateLegacyReadings(a)
    if(a.playerHunt&&typeof a.playerHunt==='object'&&!Number.isFinite(a.playerHunt.stamina)){a.playerHunt.stamina=CFG.stalkerPursuit.stamina;a.playerHunt.wounds=a.playerHunt.wounds||0}
    a.pursuitEngaged=false;
  }
  // Schema 5 (v1.32 Stage B): per-creature pressure kinds join the shared vocabulary.
  if(snapshot.schema<5)migratePressureKinds(snapshot.controllers?.pressure);
  snapshot.migratedFrom=snapshot.migratedFrom||snapshot.schema;snapshot.schema=SAVE_SCHEMA;
  return snapshot;
}

function remapKinds(obj,{peak=false}={}){
  if(!obj||typeof obj!=='object')return obj;
  for(const [old,to] of Object.entries(LEGACY_PRESSURE_KINDS)){
    if(!(old in obj))continue;const v=Number(obj[old])||0;delete obj[old];
    for(const id of Array.isArray(to)?to:[to])obj[id]=peak?Math.max(obj[id]||0,v):(obj[id]||0)+(Array.isArray(to)?v/to.length:v);
  }
  return obj;
}
function migratePressureKinds(pressure){
  const states=pressure?.states;if(!states)return;
  const values=states instanceof Map?states.values():Object.values(states);
  for(const st of values){if(!st)continue;remapKinds(st.exposure);remapKinds(st.peak,{peak:true});
    if(Array.isArray(st.last))st.last=st.last.map(p=>{const to=LEGACY_PRESSURE_KINDS[p?.kind];return to?{...p,kind:Array.isArray(to)?(p.label==='Cold'?'cold':'heat'):to}:p})}
}

// Own the restored runtime while decoding a read-only packed bank directly.
// The codec creates independent rows/metadata; all other snapshot state is cloned.
export function restoreDetachedSimulationSnapshot(snapshot){
 const packed=snapshot?.controllers?.dispersal?.floraState?.seeds;
 if(snapshot?.schema!==SAVE_SCHEMA||packed?.codec!=='genvo.flora-seed-columns/1')return restoreSimulationSnapshot(structuredClone(snapshot));
 const detached=structuredClone({...snapshot,controllers:{...snapshot.controllers,dispersal:{...snapshot.controllers.dispersal,floraState:{...snapshot.controllers.dispersal.floraState,seeds:null}}}});
 detached.controllers.dispersal.floraState.seeds=packed;
 return restoreSimulationSnapshot(detached);
}

export function restoreSimulationSnapshot(snapshot){
  if(!snapshot||typeof snapshot!=='object')throw new Error('Save data is missing.');
  const initializeMissingFreshwater=snapshot.schema===9;
  snapshot=migrateSaveSnapshot(snapshot);
  if(Number.isFinite(snapshot.schema)&&snapshot.schema<SAVE_SCHEMA)throw new Error("This save predates GenVo's modular creature bodies. Start a new lineage.");
  if(snapshot.schema!==SAVE_SCHEMA)throw new Error(`Unsupported save schema ${snapshot.schema ?? 'unknown'}. Expected ${SAVE_SCHEMA}.`);
  if(!snapshot.seed)throw new Error('Save has no world seed.');
  if(!Array.isArray(snapshot.animals))throw new Error('Save has no animal state.');
  validateDiggingSnapshot(snapshot);
  validateCarcassSnapshot(snapshot);

  const planetOrigin=snapshot.world?.generator==='planetary/1'?planetRegionOrigin(snapshot.world.regionOrigin||{x:0,y:0}):{x:0,y:0};
  const sim=new Simulation(snapshot.seed,{player:snapshot.core?.playerEnabled!==false,bootstrap:false,worldGenerator:snapshot.world?.generator==='planetary/1'?'planetary/1':undefined,planetOrigin,reuseGeneratedBase:true,deferDispersalInitialization:!!snapshot.controllers?.dispersal});
  Object.assign(sim,snapshot.core||{});
  if(!Object.hasOwn(snapshot.core||{},'regionalReplayPolicy'))delete sim.regionalReplayPolicy;
  regionalReplayPolicy(sim);
  restoreDiggingRules(sim,snapshot.core||{});
  restoreCarcassRules(sim,snapshot.core||{});
  validatePlanetaryTravelState(sim.planetaryTravel,sim.world.planet?regionKey(sim.world.regionOrigin):null);
  for(const session of sim.planetaryTravel?.sessions||[]){validateRemoteEnvironmentalLedger(session);validateRemoteBiologyLedger(session)}
  delete sim._player; // Runtime lookup cache is rebuilt from canonical playerId/animals.
  sim.seed=snapshot.seed;
  sim.rng.state=snapshot.rngState>>>0;
  restoreBirthRules(sim,snapshot.core||{});
  restoreEcologyRules(sim,snapshot.core||{});
  restoreWorld(sim.world,snapshot.world,{initializeMissingFreshwater});
  if(snapshot.regionalWorlds!==undefined){
    if(!sim.planetaryRegions||!Array.isArray(snapshot.regionalWorlds)||snapshot.regionalWorlds.length>16)
      throw Error('Invalid saved planetary region set.');
    const seen=new Set([regionKey(planetOrigin)]);
    for(const entry of snapshot.regionalWorlds){
      const origin=planetRegionOrigin(entry?.origin),key=regionKey(origin);
      if(seen.has(key))throw Error('Duplicate planetary region authority.');seen.add(key);
      if(!entry.world||regionKey(planetRegionOrigin(entry.world.regionOrigin))!==key)
        throw Error('Regional world has inconsistent geographic identity.');
      const region=new World(snapshot.seed,{generator:'planetary/1',planetOrigin:origin});
      restoreWorld(region,entry.world);sim.planetaryRegions.install(region);
    }
  }
  validatePageDayWork(sim.pageDayWork,sim.world);
  if(sim.pageDayWork&&sim.pageDayWork.lastDay>sim.day)throw Error('Vegetation page work day is in the future.');
  sim.animals=snapshot.animals;
  validatePlanetAnimalOwnership(sim.animals,sim.planetaryTravel);
  restoreMassRules(sim,snapshot.core||{});
  for(const a of sim.animals)if(!a.matePreferences)a.matePreferences=matePreferencesFor(snapshot.seed,a);
  // Older gestations already carry snapshots of both parents. Keep their new
  // preference alleles frozen at conception when upgrading a saved world.
  for(const a of sim.animals)if(a.pregnant){for(const k of ['maternalInheritance','paternalInheritance']){const parent=a.pregnant[k];if(parent&&!parent.matePreferences)parent.matePreferences=matePreferencesFor(snapshot.seed,parent)}}
  // Existing pregnancies/eggs keep neutral ancestral compatibility if they predate
  // dedicated loci. Migration consumes no RNG and never derives fertility from labels.
  const restoreGenome=a=>{if(!a)return;if(a.reproductiveGenome===undefined)a.reproductiveGenome=ancestralReproductiveGenome();if(!validReproductiveGenome(a.reproductiveGenome))throw Error('Invalid saved reproductive genome.')};
  for(const a of sim.animals){restoreGenome(a);for(const key of ['maternalInheritance','paternalInheritance'])restoreGenome(a.pregnant?.[key])}
  for(const egg of snapshot.core?.eggs||[])for(const key of ['maternalInheritance','paternalInheritance'])restoreGenome(egg[key]);
  restoreControllers(sim,snapshot.controllers);
  // Observational page identities cannot create or replace an organism on load.
  // Old snapshots may lack this field; do not invent historical crossings.
  validatePageResidency(sim.regionalEcology.pageTransit,sim.world);
  validatePageSeedTransfers(sim.dispersal.pageSeedTransfers,sim.world);
  validatePageFaunaWork(sim.pageFaunaWork,sim.world);
  if(sim.pageFaunaWork?.lastTick>sim.tickCount)throw Error('Fauna lifecycle receipt is in the future.');
  sim.dispersal.upgrade();for(const a of sim.animals)validateCarriedMaterial(a);
  sim.rebuildSpatial();
  // Restore keeps the saved heir and mate selections exactly (Phase 3I): re-running the HUD's refresh here
  // could pick a new selection that an uninterrupted run never had (the player's courtship uses it), so a
  // resumed world diverged from the same world played on. A selection whose animal no longer lives is
  // cleared; the HUD refreshes selections itself during play.
  const alive=id=>id!=null&&sim.animals.some(a=>a.id===id&&a.alive);
  if(sim.lineage&&!alive(sim.lineage.selectedHeirId))sim.lineage.selectedHeirId=null;
  if(sim.reproduction&&!alive(sim.reproduction.selectedMateId))sim.reproduction.selectedMateId=null;
  return sim;
}

function requestToPromise(request){return new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||new Error('IndexedDB request failed.'))})}
function transactionDone(tx){return new Promise((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error||new Error('Save transaction aborted.'));tx.onerror=()=>reject(tx.error||new Error('Save transaction failed.'))})}

export class SaveManager{
  constructor({getSim,onStatus=null,autosaveMs=45000}={}){
    this.getSim=getSim;
    this.onStatus=onStatus;
    this.autosaveMs=autosaveMs;
    this.dbPromise=null;
    this.busy=false;
    this.pendingReason=null;
    this.pendingTimer=null;
    this.idleHandle=null;
    this.lastSavedAt=0;
    this.lastSavedTick=-1;
    this.lastObservedSignature='';
    this.available=typeof indexedDB!=='undefined';
    this.activeSlotId=this.restoreActiveSlot();this.worldNames=new Map();
  }
  status(kind,message,meta=null){this.onStatus?.({kind,message,meta})}
  restoreActiveSlot(){try{const id=localStorage.getItem(ACTIVE_WORLD_KEY);return safeSlot(id)?id:SAVE_KEY}catch{return SAVE_KEY}}
  setActiveSlot(id){if(!safeSlot(id))throw Error('Invalid world slot.');this.activeSlotId=id;try{localStorage.setItem(ACTIVE_WORLD_KEY,id)}catch{};this.lastSavedAt=0;this.lastSavedTick=-1;this.lastObservedSignature=''}
  async listWorlds(){
    if(!this.available)return [];
    const db=await this.db(),tx=db.transaction(META_STORE,'readonly'),store=tx.objectStore(META_STORE);
    const result=await requestToPromise(store.getAll());
    return result.filter(v=>v&&safeSlot(v.key)).sort((a,b)=>String(b.savedAt||'').localeCompare(String(a.savedAt||'')));
  }
  async renameWorld(id,name){
    if(!safeSlot(id))throw Error('Invalid world slot.');name=String(name||'').trim().slice(0,40);
    if(!name)throw Error('Enter a world name.');const db=await this.db(),tx=db.transaction(META_STORE,'readwrite'),store=tx.objectStore(META_STORE);
    const current=await requestToPromise(store.get(id));if(!current)throw Error('World not found.');
    store.put({...current,worldName:name},id);await transactionDone(tx);this.worldNames.set(id,name);
  }
  async deleteWorld(id){
    if(!safeSlot(id))throw Error('Invalid world slot.');
    const db=await this.db(),tx=db.transaction([SAVE_STORE,META_STORE],'readwrite');
    tx.objectStore(SAVE_STORE).delete(id);tx.objectStore(META_STORE).delete(id);await transactionDone(tx);
    if(id===this.activeSlotId)this.setActiveSlot(SAVE_KEY);this.worldNames.delete(id);
  }
  async allocateWorld(name){
    const id='world-'+(typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`);
    this.worldNames.set(id,String(name||'New World').trim().slice(0,40)||'New World');this.setActiveSlot(id);return id;
  }
  async db(){
    if(!this.available)throw new Error('Browser storage is unavailable.');
    if(this.dbPromise)return this.dbPromise;
    this.dbPromise=new Promise((resolve,reject)=>{
      const req=indexedDB.open(SAVE_DB,1);
      req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(SAVE_STORE))db.createObjectStore(SAVE_STORE);if(!db.objectStoreNames.contains(META_STORE))db.createObjectStore(META_STORE)};
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error||new Error('Could not open save storage.'));
    });
    return this.dbPromise;
  }
  async metadata(id=this.activeSlotId){
    if(!this.available)return null;
    try{const db=await this.db(),tx=db.transaction(META_STORE,'readonly');return await requestToPromise(tx.objectStore(META_STORE).get(id))||null}catch{return null}
  }
  async loadSnapshot(id=this.activeSlotId){
    const db=await this.db(),tx=db.transaction(SAVE_STORE,'readonly');
    return await requestToPromise(tx.objectStore(SAVE_STORE).get(id))||null;
  }
  async load(id=this.activeSlotId){
    if(!safeSlot(id))throw Error('Invalid world slot.');
    const snapshot=await this.loadSnapshot(id);
    if(!snapshot)return null;
    const sim=restoreSimulationSnapshot(snapshot);this.setActiveSlot(id);this.worldNames.set(id,snapshot.meta?.worldName||'');this.lastSavedAt=Date.now();this.lastSavedTick=sim.tickCount;this.lastObservedSignature=this.signature(sim);return sim;
  }
  schedule(reason='autosave',delay=900){
    if(!this.available)return;
    this.pendingReason=reason;
    if(this.pendingTimer)clearTimeout(this.pendingTimer);
    this.pendingTimer=setTimeout(()=>{
      this.pendingTimer=null;
      const run=()=>{this.idleHandle=null;const nextReason=this.pendingReason||reason;this.pendingReason=null;this.saveNow(nextReason).catch(()=>{})};
      if(typeof requestIdleCallback==='function')this.idleHandle=requestIdleCallback(run,{timeout:1800});else this.idleHandle=setTimeout(run,0);
    },Math.max(0,delay));
  }
  signature(sim){
    return[
      sim.stats?.births||0,sim.stats?.deaths||0,sim.shelter?.shelters?.length||0,
      sim.lineage?.handoffs?.length||0,sim.evolutionTree?.events?.length||0,
      sim.generationProgress?.completed?.length||0,sim.lineage?.highestGeneration||1
    ].join('|');
  }
  observe({eligible=true}={}){
    if(!eligible||!this.available||this.busy)return;
    const sim=this.getSim?.();if(!sim?.player?.())return;
    const now=Date.now(),sig=this.signature(sim);
    if(!this.lastObservedSignature){this.lastObservedSignature=sig;if(!this.lastSavedAt)this.schedule('lineage-start',2200);return}
    if(sig!==this.lastObservedSignature){this.lastObservedSignature=sig;this.schedule('lineage-milestone',900)}
    if(now-this.lastSavedAt>=this.autosaveMs&&sim.tickCount!==this.lastSavedTick)this.schedule('autosave',700);
  }
  async saveNow(reason='manual'){
    if(!this.available)return null;
    const sim=this.getSim?.();if(!sim?.player?.())return null;
    if(this.busy){this.pendingReason=reason;return null}
    // A new world's first save is part of preparing it; every other save says what it is.
    this.busy=true;this.status('saving',reason==='world-start'?'Preparing ecosystem...':'Saving...');
    try{
      const slotId=this.activeSlotId;
      const worldName=this.worldNames.get(slotId)||(await this.metadata(slotId))?.worldName||(slotId===SAVE_KEY?'First Lineage':'New World');
      const db=await this.db();
      // Capture and enqueue transport in one turn: nested state may still be live.
      const capturedSignature=this.signature(sim),snapshot=createSimulationSnapshot(sim,{reason});
      snapshot.meta.key=slotId;
      snapshot.meta.worldName=worldName;
      const tx=db.transaction([SAVE_STORE,META_STORE],'readwrite');
      tx.objectStore(SAVE_STORE).put(snapshot,slotId);
      tx.objectStore(META_STORE).put(snapshot.meta,slotId);
      await transactionDone(tx);
      this.lastSavedAt=Date.now();this.lastSavedTick=snapshot.core.tickCount;this.lastObservedSignature=capturedSignature;
      this.status('saved','Saved',snapshot.meta);
      return snapshot.meta;
    }catch(error){this.status('error','Save failed');throw error}
    finally{this.busy=false;if(this.pendingReason&&this.pendingReason!==reason){const next=this.pendingReason;this.pendingReason=null;this.schedule(next,500)}}
  }
  async clear(){
    if(!this.available)return;
    const db=await this.db(),tx=db.transaction([SAVE_STORE,META_STORE],'readwrite');
    tx.objectStore(SAVE_STORE).delete(this.activeSlotId);tx.objectStore(META_STORE).delete(this.activeSlotId);await transactionDone(tx);
    this.lastSavedAt=0;this.lastSavedTick=-1;this.lastObservedSignature='';this.status('cleared','Save cleared');
  }
  resetObservation(sim=this.getSim?.()){
    this.lastObservedSignature=sim?this.signature(sim):'';
    this.lastSavedTick=-1;
  }
}
