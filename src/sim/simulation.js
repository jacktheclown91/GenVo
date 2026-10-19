import {ECOLOGY_RULES} from '../ecology/rule-policy.js';
import {BIRTH_RULES} from '../lineage/birth-rules.js';
import {localTemperature,advanceEnvironmentWater,salinityAt} from '../world/environment.js';
import {physicalAttackProfile} from '../lineage/physical-attack.js';
import {thermalCoverFactor,aridityWaterFactor} from '../lineage/terrain-cover-physiology.js';
import {canLactate,thermoregulation,neonatalWarmthFactor,neonatalColdExposure} from '../ecology/mammalian-care.js';
import {torporStatus,enterTorpor,wakeTorpor,maintainTorpor,torporMetabolism,torporPredationMultiplier,decideTorpor} from '../ecology/cold-wildlife.js';
import {conceptionAvailability} from '../reproduction/conception-availability.js';
import {advanceFungi,extractCarriedMaterial,returnCarriedMaterial} from '../ecology/organic-resource-cycle.js';
import {advancePlantInputs,growLandProducers,mineralizePlantLitter} from '../ecology/plant-resources.js';
import {inheritReproductiveGenome,reproductiveCompatibility} from '../reproduction/reproductive-compatibility.js';
import {contextualInteractions,executeInteraction} from '../gameplay/interaction-command.js';
import {isFeedingIntent} from '../ecology/feeding-intents.js';
import {rememberBreedingSite,breedingSiteDecision} from '../ecology/breeding-sites.js';
import {engineeringCourtshipSpecies,partnerAvailability,respondingPartner,localReceptivePartner} from '../reproduction/partner-encounters.js';
import {founderMatePreferences,inheritMatePreferences,reciprocalMateChoice,compareMateOptions,SAME_TAXON_AFFINITY} from '../reproduction/mate-preferences.js';
import {COURTSHIP_PERFORMANCE,performCourtship,activeCourtship,performedMateChoice,learnCourtshipOutcome} from '../reproduction/courtship-performance.js';
import {CFG,PLANTS} from './config.js';
import {RNG} from '../core/rng.js';
import {World} from '../world/world.js';
import {PlanetRegionAtlas} from '../world/planet-regions.js';
import {advanceOffscreenEnvironments} from '../world/planetary-offscreen-environment.js';
import {landRouteTarget,planLandDetour} from '../world/land-route.js';
import {escapeDestination} from '../world/escape-route.js';
import {explorationDestination} from '../world/exploration-destination.js';
import {advanceFreshwater,harvestFreshwater,bestFreshwaterFood,FRESHWATER_FOOD,freshwaterField,freshwaterPreference,freshwaterHarvestCandidate} from '../ecology/freshwater-food.js';
import {SPECIES,makeGenes} from '../organisms/species.js';
import {canHunt,preyPreference,plantPreference,groundDiet,weakBiteAttempt,WEAK_BITE_DAMAGE} from '../ecology/functional-diet.js';
import {amphibiousForager,shoreHabitatCenter} from '../ecology/ecology-review.js';
import {advanceAgeDay,preyAppraisal} from '../ecology/juvenile-biology.js';
import {resourceInformedFounding} from '../ecology/resource-founding.js';
import {LIFE_HISTORY,breedingEnergyGate} from '../ecology/breeding-calibration.js';
import {bodyMass,bodyMassFraction,basalResourceCosts,ANATOMICAL_MASS,LEGACY_MASS} from '../organisms/body-mass.js';
import {LineageTracker} from '../lineage/lineage.js';
import {ReproductionController} from '../reproduction/reproduction.js';
import {FamilyController} from '../family/family.js';
import {FamilyDirectiveController} from '../family/directives.js';
import {FamilyExpansionController} from '../family/expansion.js';
import {FamilySustainabilityController} from '../family/sustainability.js';
import {CognitionController} from '../cognition/cognition.js';
import {TerritoryController} from '../cognition/territory.js';
import {ShelterController} from '../habitat/shelter.js';
import {MigrationController} from '../ecology/migration.js';
import {RegionalEcologyController} from '../ecology/regions.js';
import {CarryingPressureController} from '../ecology/carrying.js';
import {RecoveryController} from '../ecology/recovery.js';
import {paternalInheritance} from '../ecology/gestation.js';
import {conceptionFunding,birthFunding} from '../ecology/birth-investment.js';
import {reproductiveMode,conceptionMode,eggSiteQuality,INCUBATION_DAYS,DUAL_ENERGY_UPKEEP,DUAL_WATER_UPKEEP} from '../reproduction/reproductive-anatomy.js';
import {constructNest,nestForEgg,nestIncubationQuality,advanceNests,chooseCareNest,careForNest,edibleEggTarget,eatEgg} from '../reproduction/egg-ecology.js';
import {committedFoodTarget} from '../ecology/food-commitment.js';
import {preyBodyMass,remainingPreyBiomass,consumePreyBiomass,regrowPreyBiomass} from '../ecology/prey-biomass.js';
import {SelectionPressureController} from '../lineage/pressure.js';
import {EnvironmentalHistoryController} from '../ecology/history.js';
import {PlantDispersalController} from '../ecology/dispersal.js';
import {DiseaseController} from '../ecology/disease.js';
import {SocialController} from '../cognition/social.js';
import {EvolutionController,inheritedAdaptations,adaptationEffects,hasAdaptation} from '../lineage/evolution.js';
import {canSwim,canOccupy,canReach,movementProfile} from '../lineage/lifestyle.js';
import {flightAvailability,landingAvailability,toggleFlight,takeoff,land,advanceFlight} from '../lineage/flight.js';
import {roostAvailability,perch,descend,checkCanopyHold,canopyFeedingPosition,canopySupport} from '../ecology/canopy-site.js';
import {LineageSpecializationController} from '../lineage/specialization.js';
import {BehavioralTendencyController} from '../lineage/behavioral-tendency.js';
import {LineageDivergenceController} from '../lineage/divergence.js';
import {GenerationProgressionController} from '../lineage/generation-progression.js';
import {PredatorEncounterController} from '../gameplay/predator-encounter.js';
import {StalkerTerritoryController} from '../gameplay/stalker-territory.js';
import {ExertionController} from '../gameplay/exertion.js';
import {HabitController} from '../cognition/habits.js';
import {EvolutionBudgetController} from '../lineage/evolution-budget.js';
import {EvolutionEditorController} from '../lineage/evolution-editor.js';
import {PartAbilityController,partEffectFactors} from '../lineage/part-abilities.js';
import {giveFounderBody,inheritBody} from '../lineage/body-inheritance.js';
import {DiscoveryController} from '../gameplay/discovery.js';
import {wildTraits,isWildSpecies} from '../organisms/wild-bodies.js';
import {isWaterDweller,waterFoodRate,nearestWater,roamWater,hasGills,AQUATIC} from '../lineage/aquatic.js';
const FACE_V=[[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]];
import {movementEffect,forageRangeEffect,threatSenseEffect,metabolismEffect,waterUseEffect} from '../lineage/effects.js';
import {inheritLineageGenes,inheritLineageAnatomy} from '../lineage/heredity.js';
import {expressedAdaptations} from '../lineage/evolution.js';
import {GENE_KEYS} from '../organisms/species.js';
import {ADAPTATIONS} from '../lineage/evolution.js';
import {PlayerCombatController} from '../gameplay/player-combat.js';
import {ForagingController} from '../gameplay/foraging.js';
import {WeatherExposureController} from '../gameplay/weather-exposure.js';
import {FamilyWeatherController} from '../gameplay/family-weather.js';
import {IllnessRecoveryController} from '../gameplay/illness-recovery.js';
import {FamilyIllnessController} from '../gameplay/family-illness.js';
import {needsRecoveryForage} from '../lineage/engineer-recovery-foraging.js';
import {InjuryRecoveryController} from '../gameplay/injury-recovery.js';
import {ActivityBudgetController,ACTIVITY_REVIEW,atInteractionTarget} from '../ecology/activity.js';
import {HEALING_REVIEW,healingStep} from '../ecology/healing-review.js';
import {PREDATION_PARITY} from '../gameplay/predation-parity.js';
import {REFUGE_PARITY,refugeAgainst,coverHides,refugeTarget,still} from '../ecology/refuges.js';
import {PHYSIOLOGY_PARITY,breadthBonusFor,noteFoodGroup,mealBiteFor} from '../ecology/physiology.js';
import {RARITY_REVIEW} from '../ecology/prey-encounter.js';
import {trophicallyMateable} from '../reproduction/trophic-recognition.js';
import {HUNT_COMMITMENT} from '../ecology/hunt-commitment.js';
import {appearsThreatening,THREAT_APPRAISAL} from '../ecology/threat-appraisal.js';
import {PREY_RISK,riskFactor,biteBack} from '../ecology/prey-risk.js';
import {THREAT_STAGES,thresholds,detects,threatLevel,watching,noteVigilance,applyAlarm} from '../ecology/threat-perception.js';
import {MOVEMENT_PARITY} from '../ecology/movement-parity.js';
const NO_INTERACTION=()=>{};
// Render-time cache of "no living player" per actor list (never saved; see Simulation.player).
const PLAYER_MISS=new WeakMap();
import {WildlifeRhythmController} from '../ecology/wildlife-rhythm.js';
import {PopulationCenterEcologyController} from '../ecology/population-centers.js';
import {PopulationPressureMemoryController} from '../ecology/population-memory.js';
import {ProtoSpeciationController} from '../lineage/proto-speciation.js';
import {SpeciationController} from '../lineage/speciation.js';
import {EvolutionaryTreeController} from '../lineage/evolution-tree.js';
import {SpeciesCoexistenceController} from '../ecology/species-coexistence.js';
import {SpeciesLifestyleController} from '../lineage/species-lifestyle.js';
import {SOIL_WATER,advanceSoilDay} from '../ecology/soil-water.js';
import {beginPageVegetationDay,visitLandByWorldPage,completePageVegetationDay} from '../world/page-vegetation-work.js';
import {beginPageFaunaTick,visitLivingFaunaByPage,completePageFaunaTick} from '../ecology/page-fauna-work.js';
import {WEATHER_PATTERNS,createWeatherState,advanceWeatherTo,validWeatherState} from '../ecology/weather.js';

const DIRS=[[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]];
export class Simulation{
  constructor(seed='GENVO8-0001',{player=true,bootstrap=true,worldGenerator=undefined,massRules=ANATOMICAL_MASS,planetOrigin={x:0,y:0}}={}){if(massRules!==ANATOMICAL_MASS&&massRules!==LEGACY_MASS)throw Error('Unknown world mass rules: '+massRules);this.massRules=massRules;this.seed=seed;this.ecologyRules={...ECOLOGY_RULES};this.ecologyRuleMigrations=[];this.birthRules={...BIRTH_RULES};this.birthRuleMigrations=[];this.rng=new RNG(seed);this.world=new World(seed,{generator:worldGenerator,planetOrigin});this.planetaryRegions=this.world.planet?new PlanetRegionAtlas(this.world,origin=>new World(this.seed,{generator:'planetary/1',planetOrigin:origin})):null;this.animals=[];this.eggs=[];this.nextEggId=1;this.nests=[];this.nextNestId=1;this.nextId=1;this.tickCount=0;this.day=1;this.year=1;this.seasonIndex=0;this.phase=0;this.paused=false;this.playerId=null;this.playerEnabled=player;this.stats={births:0,deaths:0,byCause:{},extinctions:[]};this.spawnCenters={};this.spatialBucketSize=8;this.spatialCols=Math.ceil(CFG.worldSize/this.spatialBucketSize);this.spatial=Array.from({length:this.spatialCols*this.spatialCols},()=>[]);this.lineage=new LineageTracker(this);this.reproduction=new ReproductionController(this);this.family=new FamilyController(this);this.expansion=new FamilyExpansionController(this);this.familyDirectives=new FamilyDirectiveController(this);this.cognition=new CognitionController(this);this.habits=new HabitController(this);this.evolutionBudget=new EvolutionBudgetController(this);this.evolutionEditor=new EvolutionEditorController(this);this.partAbilities=new PartAbilityController(this);this.discovery=new DiscoveryController(this);this.territory=new TerritoryController(this);this.shelter=new ShelterController(this);this.migration=new MigrationController(this);this.regionalEcology=new RegionalEcologyController(this);this.recovery=new RecoveryController(this);this.carrying=new CarryingPressureController(this);this.pressure=new SelectionPressureController(this);this.history=new EnvironmentalHistoryController(this);this.sustainability=new FamilySustainabilityController(this);this.populationEcology=new PopulationCenterEcologyController(this);this.populationMemory=new PopulationPressureMemoryController(this);this.protoSpeciation=new ProtoSpeciationController(this);this.evolutionTree=new EvolutionaryTreeController(this);this.speciesCoexistence=new SpeciesCoexistenceController(this);this.speciesLifestyle=new SpeciesLifestyleController(this);this.speciation=new SpeciationController(this);this.dispersal=new PlantDispersalController(this);this.disease=new DiseaseController(this);this.social=new SocialController(this);this.evolution=new EvolutionController(this);this.specialization=new LineageSpecializationController(this);this.tendency=new BehavioralTendencyController(this);this.divergence=new LineageDivergenceController(this);this.generationProgress=new GenerationProgressionController(this);this.predator=new PredatorEncounterController(this);this.exertion=new ExertionController(this);this.playerCombat=new PlayerCombatController(this);this.stalkerTerritory=new StalkerTerritoryController(this);this.foraging=new ForagingController(this);this.exposure=new WeatherExposureController(this);this.familyWeather=new FamilyWeatherController(this);this.illness=new IllnessRecoveryController(this);this.familyIllness=new FamilyIllnessController(this);this.injury=new InjuryRecoveryController(this);this.activity=new ActivityBudgetController(this);this.wildlifeRhythm=new WildlifeRhythmController(this);this.openingGraceUntilDay=20;this.openingGraceEnded=false;this.playerAutonomy=false;this.familyControlExplained=false;this.lastPlayerAction=null;this.lastPlayerDamage=null;this.lastDefenseReceipt=null;if(bootstrap){this.spawnInitial();this.prepareStarterMate();this.regionalEcology.resetPageResidency();this.reproduction.refreshSelection();}}
  get season(){return CFG.seasons[this.seasonIndex]}
  spawnInitial(){
    const kinds=Object.keys(CFG.initial).filter(k=>SPECIES[k]);
    for(const k of kinds)this.spawnCenters[k]=[this.pickHabitatCenter(k),this.pickHabitatCenter(k)];
    for(const k of kinds){const s=SPECIES[k];if(!s.spawnNear?.length)continue;const related=s.spawnNear.flatMap(id=>this.spawnCenters[id]||[]);if(related.length)this.spawnCenters[k]=related.slice(0,Math.max(2,related.length));}
    for(const k of kinds)if(this.spawnCenters[k])this.spawnCenters[k]=this.spawnCenters[k].map(c=>shoreHabitatCenter(this.world,k,c));
    for(const [k,count] of Object.entries(CFG.initial)){if(!SPECIES[k])continue;for(let i=0;i<count;i++){const centers=this.spawnCenters[k]||[];const center=centers.length?this.rng.pick(centers):null;const p=this.safeSpawn(k,center);const a=this.spawnAnimal(k,p.x,p.y);if(k==='genvo'&&this.playerEnabled&&!this.playerId){this.prepareFounder(a);this.playerId=a.id;a.player=true;this.lineage.establishFounder(a)}}}
    this.spawnHuntersByPrey();
    this.foundingReport=resourceInformedFounding(this);
  }
  prepareFounder(a){
    const s=SPECIES[a.species],spot=this.pickStarterLocation(a);
    a.x=spot.x;a.y=spot.y;a.age=s.maturity+2;a.energy=s.maxEnergy*.92;a.hydration=s.maxHydration*.90;a.health=100;a.reproCooldown=0;
  }
  pickStarterLocation(a){
    const w=this.world,origin={x:a.x,y:a.y};let best={x:a.x,y:a.y,score:-Infinity};
    let candidates=w.drinkSpots.filter(spot=>Math.hypot(spot.x-origin.x,spot.y-origin.y)<=22);if(!candidates.length)candidates=w.drinkSpots;
    for(const spot of candidates){
      if(spot.x<5||spot.y<5||spot.x>CFG.worldSize-5||spot.y>CFG.worldSize-5)continue;
      const i=w.idx(spot.x,spot.y);let score=(w.plants.bramble?.[i]||0)*2+(w.plants.sunmoss?.[i]||0)+(w.plants.thistlepod?.[i]||0)*.7;
      let nearestPred=30;for(const b of this.animals){if(!b.alive||!canHunt(b))continue;nearestPred=Math.min(nearestPred,Math.hypot(b.x-spot.x,b.y-spot.y))}
      score+=(nearestPred<7?-(7-nearestPred)*.18:Math.min(.12,(nearestPred-7)*.012))-Math.hypot(spot.x-origin.x,spot.y-origin.y)*.025;if(score>best.score)best={x:spot.x,y:spot.y,score};
    }
    return best;
  }
  prepareStarterMate(){
    const founder=this.player();if(!founder)return;const s=SPECIES[founder.species];
    let mate=this.animals.filter(a=>a.alive&&a.species===founder.species&&a.id!==founder.id).sort((a,b)=>Math.hypot(a.x-founder.x,a.y-founder.y)-Math.hypot(b.x-founder.x,b.y-founder.y))[0];
    if(!mate)return;mate.sex=founder.sex==='F'?'M':'F';mate.age=s.maturity+this.rng.range(1,4);mate.energy=s.maxEnergy*.88;mate.hydration=s.maxHydration*.88;mate.health=100;mate.reproCooldown=0;
    const d=Math.hypot(mate.x-founder.x,mate.y-founder.y);if(d>16){const ang=this.rng.range(0,Math.PI*2);const tx=founder.x+Math.cos(ang)*10,ty=founder.y+Math.sin(ang)*10;if(!this.world.water[this.world.idx(tx,ty)]){mate.x=tx;mate.y=ty}}
    this.starterMateId=mate.id;
  }
  isOpeningProtected(a){return !PHYSIOLOGY_PARITY.enabled&&!!(a&&!this.openingGraceEnded&&this.day<=this.openingGraceUntilDay&&(a.lineage||a.id===this.starterMateId))}
  // v1.33.7: in AUTO the active creature builds the family's first shelter on its own, the same
  // way N would, once its home range settles and the build conditions hold. Only the first home:
  // a second home or a brood shelter is still the player's decision. Checked once a second.
  autoFounderHome(){
    if(!this.playerAutonomy||this.tickCount%CFG.simHz)return null;const p=this.player();if(!p?.alive)return null;
    if(this.shelter.activeShelters().some(s=>this.shelter.familyCanUse(p,s)))return null;
    const can=this.shelter.canBuildHere(p);if(!can.ok||can.kind!=='family')return null;
    const r=this.shelter.constructOrRepair(p);if(!r?.ok||r.action!=='build')return null;
    this.endOpeningGrace('first shelter built');this.cognition.record(p,'auto-home','Built the family shelter on its own',{shelterId:r.shelter?.id??null});
    this.autoHomeNotice={text:'Your creature built the family shelter on its own · Stalkers now hunt your family like any other',tone:'warn'};return r;
  }
  endOpeningGrace(reason='ready'){if(this.openingGraceEnded)return false;this.openingGraceEnded=true;this.openingGraceReason=reason;return true}
  pickHabitatCenter(species){const s=SPECIES[species],weights=s.habitat||{};let best={x:64,y:64,score:-Infinity};for(let t=0;t<112;t++){const x=this.rng.range(8,CFG.worldSize-8),y=this.rng.range(8,CFG.worldSize-8),i=this.world.idx(x,y);if(!!this.world.water[i]!==!!s.spawnInWater)continue;let score=0;for(const [key,weight] of Object.entries(weights)){if(key==='moisture')score+=this.world.moisture[i]*weight;else if(key==='fertility')score+=this.world.fertility[i]*weight;else if(this.world.plants[key])score+=this.world.plants[key][i]*weight}score+=this.rng.range(0,.015);if(score>best.score)best={x,y,score}}return best}
  // v1.61.0: a hunter species is founded on each land mass in proportion to the prey living there
  // (weighted by diet), each group with both sexes, so no island starts with prey and no predators
  // only because the spawn centres missed it. Animals are never added after the world begins.
  spawnHuntersByPrey(){
    // Uses its own random stream, so worlds where every land already has hunters are unchanged.
    const rng=new RNG(this.seed+':hunter-founding');
    for(const [k,s] of Object.entries(SPECIES)){if(!CFG.initial[k]||!canHunt(this.animals.find(a=>a.species===k)))continue;
      const hunters=this.animals.filter(a=>a.alive&&a.species===k),prey=this.animals.filter(a=>a.alive&&preyPreference(hunters[0],a)>0&&SPECIES[a.species]);if(!hunters.length||!prey.length)continue;
      const lands=new Map(),land=r=>{if(!lands.has(r))lands.set(r,{w:0,prey:[],hunters:[]});return lands.get(r)};
      for(const a of prey){const r=this.world.regionAt(a.x,a.y);if(r)land(r).w+=preyPreference(hunters[0],a),land(r).prey.push(a)}
      for(const a of hunters){const r=this.world.regionAt(a.x,a.y);if(r)land(r).hunters.push(a)}
      const total=[...lands.values()].reduce((t,g)=>t+g.w,0);
      for(const g of lands.values()){if(g.w<total*.2)continue;const want=Math.max(2,Math.round(hunters.length*g.w/total));
        while(g.hunters.length<want){const donor=[...lands.values()].filter(d=>d!==g&&d.hunters.length>2).sort((a,b)=>b.hunters.length-a.hunters.length)[0];if(!donor)break;
          const a=donor.hunters.pop(),near=rng.pick(g.prey);a.x=near.x+rng.range(-3,3);a.y=near.y+rng.range(-3,3);if(!this.world.sameLand(a.x,a.y,near.x,near.y)){a.x=near.x;a.y=near.y}g.hunters.push(a)}
        if(g.hunters.length>=2&&!g.hunters.some(a=>a.sex==='F'))g.hunters[0].sex='F';if(g.hunters.length>=2&&!g.hunters.some(a=>a.sex==='M'))g.hunters[1].sex='M'}}
  }
  safeSpawn(species=null,center=null){for(let tries=0;tries<80;tries++){const x=center?center.x+this.rng.range(-7,7):this.rng.range(4,CFG.worldSize-4),y=center?center.y+this.rng.range(-7,7):this.rng.range(4,CFG.worldSize-4);if(x<2||y<2||x>CFG.worldSize-3||y>CFG.worldSize-3)continue;if(!!this.world.water[this.world.idx(x,y)]===!!SPECIES[species]?.spawnInWater)return{x,y}}if(center&&!!this.world.water[this.world.idx(center.x,center.y)]===!!SPECIES[species]?.spawnInWater)return{x:center.x,y:center.y};return this.pickHabitatCenter(species||'genvo')}
  spawnAnimal(species,x=null,y=null,parents=null){const p=x==null?this.safeSpawn(species):{x,y};const s=SPECIES[species];if(!s)throw new Error(`Unknown species: ${species}`);const inheritedBirth=parents?.length===2&&parents.every(p=>p?.genes),anatomy=inheritedBirth?inheritLineageAnatomy(this.rng,parents,this.nextId):null,genes=inheritedBirth?inheritLineageGenes(this.rng,parents[0].genes,parents[1].genes,GENE_KEYS):makeGenes(this.rng);const inbreeding=this.recovery?.inbreedingLoad(parents)||0;if(inbreeding){genes.immunity=Math.max(.72,genes.immunity*(1-inbreeding*.22));genes.metabolism=Math.max(.72,genes.metabolism*(1-inbreeding*.12))}const a={id:this.nextId++,species,x:p.x,y:p.y,vx:0,vy:0,dir:this.rng.int(0,7),age:parents?0:this.rng.range(s.maturity*.25,s.maturity*1.3),energy:s.maxEnergy*this.rng.range(.62,.95),hydration:s.maxHydration*this.rng.range(.65,.98),health:100-inbreeding*18,genes,reproductiveGenome:inheritReproductiveGenome(this.seed,this.nextId-1,parents,{species}),matePreferences:parents?inheritMatePreferences(this.seed,this.nextId-1,parents[0],parents[1]):founderMatePreferences(this.seed,this.nextId-1),inbreeding,sex:this.rng.chance(.5)?'F':'M',pregnant:null,reproCooldown:this.rng.range(0,10),intent:'explore',target:null,alive:true,infected:false,infection:null,immune:false,immuneUntilDay:0,player:false,lineage:false,parentIds:parents?[parents[0].id,parents[1].id]:[],grandparentIds:parents?[...new Set(parents.flatMap(p=>p.parentIds||[]))]:[],generation:parents?Math.max(parents[0].generation,parents[1].generation)+1:1,lastMate:null,reproDrive:0,caregiverId:null,birthTick:this.tickCount,birthDay:this.day,birthYear:this.year,anim:0,adaptations:inheritedBirth?expressedAdaptations(anatomy):inheritedAdaptations(parents)};if(this.massRules===ANATOMICAL_MASS)a.massPolicy=ANATOMICAL_MASS;if(parents?.some(p=>(p.massPolicy??LEGACY_MASS)!==(this.massRules??LEGACY_MASS)))throw Error('Parental mass policy differs from world');if(anatomy)a.anatomy=anatomy;if((species==='genvo'||isWildSpecies(species))&&!parents)giveFounderBody(a);if(parents&&this.massRules===ANATOMICAL_MASS)inheritBody(this,a,parents[0],parents[1]);this.animals.push(a);this.regionalEcology?.notePageBirth(a);return a}
  update(input=null,{externalPlayerControl=false}={}){
    if(this.paused)return;this.tickCount++;
    // E17 replays archived physical seasons over bounded ecology strides, not
    // inside rendering or input control. No inactive fauna tick is run.
    if(this.tickCount%CFG.lifeStride===0)advanceOffscreenEnvironments(this);
    const manualMoved=externalPlayerControl?this.playerInputActive(input):this.phasePlayerMovement(input);
    // Player-facing Stalker pursuit runs on real time (every tick for decisions, every
    // control step for movement) instead of the slower ambient life stride.
    this.predator.tickEngaged();this.partAbilities.tick();this.discovery.tick();if(!externalPlayerControl)this.predator.moveEngaged(1/CFG.simHz);
    this.lineage.updateSuccession?.();this.generationProgress?.update?.();this.autoFounderHome();
    if(this.tickCount%CFG.lifeStride!==0){if(MOVEMENT_PARITY.enabled)this.phaseMovement({skipManualPlayer:manualMoved,locomotionOnly:true});return}
    this.phase=0;this.phaseClimate();this.phase=1;this.phaseSoil();this.phase=2;if(this.tickCount%CFG.dayTicks===0)this.phaseVegetation({once:true});this.phase=3;this.phasePerception();this.phase=4;this.phaseDecision(input);this.phase=5;this.phaseMovement({skipManualPlayer:manualMoved});this.phase=6;this.phaseMetabolism();this.phase=7;this.phaseLifecycle({once:true});if(this.tickCount%CFG.dayTicks===0){this.disease.advanceDay();this.injury.advanceDay();this.advanceDay()}
  }
  playerInputActive(input){if(!input)return false;const [dx,dy]=inputVector(input);return !!(dx||dy)}
  isManualPlayer(animal){return !!(animal?.player&&!this.playerAutonomy)}
  setPlayerAutonomy(enabled){
    this.playerAutonomy=!!enabled;
    const p=this.player();if(p){p.target=null;p.intent=this.playerAutonomy?'explore':'idle'}
    return this.playerAutonomy;
  }
  togglePlayerAutonomy(){return this.setPlayerAutonomy(!this.playerAutonomy)}
  controllableFamily(){
    return this.animals.filter(a=>a.alive&&a.lineage).sort((a,b)=>a.generation-b.generation||a.birthTick-b.birthTick||a.id-b.id);
  }
  familyControlStatus(){const members=this.controllableFamily(),index=Math.max(0,members.findIndex(a=>a.id===this.playerId));return{members,count:members.length,index,current:members[index]||this.player(),unlocked:members.length>1,autonomy:!!this.playerAutonomy}}
  switchFamilyControl(step=1){
    const members=this.controllableFamily();if(members.length<2)return{ok:false,message:'Family switching unlocks when another lineage member is living.',count:members.length};
    let index=members.findIndex(a=>a.id===this.playerId);if(index<0)index=0;const nextIndex=(index+(step<0?-1:1)+members.length)%members.length,next=members[nextIndex],current=this.player();
    if(current){current.player=false;this.playerCombat.clearFor(current)}next.player=true;this.playerId=next.id;next.target=null;next.intent=this.playerAutonomy?'explore':'idle';
    this.reproduction?.onActiveChanged?.();this.foraging?.observeNearby?.(next);
    return{ok:true,from:current||null,to:next,index:nextIndex,count:members.length,autonomy:!!this.playerAutonomy};
  }
  restoreFamilyControlAfterDeath(dead){
    const active=this.animals.find(a=>a.id===this.lineage?.activeId&&a.alive),members=this.controllableFamily(),next=active||members[0]||null;
    if(!next){this.playerId=null;return false}
    for(const a of this.animals)if(a.player)a.player=false;next.player=true;this.playerId=next.id;next.target=null;next.intent=this.playerAutonomy?'explore':'idle';this.reproduction?.onActiveChanged?.();return true;
  }
  roostStatus(animal=this.player()){return animal?.perched?{enabled:true,reason:'Descend to the ground beneath this canopy.'}:roostAvailability(animal,this.world)}
  torporStatus(animal=this.player()){return torporStatus(this,animal)}
  playerToggleTorpor(){if(this.paused)return{ok:false,type:'torpor',message:'Resume the world first.'};const a=this.player();if(!a)return{ok:false,type:'torpor',message:'No active creature.'};return a.torpor?wakeTorpor(a,{reason:'Woke from cold-season torpor.'}):enterTorpor(this,a)}
  playerToggleRoost(){if(this.paused)return{ok:false,type:'roost',message:'Resume the world first.'};const a=this.player();if(!a)return{ok:false,type:'roost',message:'No active creature.'};const result=a.perched?descend(a,this.world):perch(a,this.world);if(result.ok){a.intent='idle';a.target=null;this.lastPlayerAction={type:a.perched?'roost':'descend',actorId:a.id,tick:this.tickCount}}return result}
  canopyFoodAvailability(animal=this.player()){
    if(!canopyFeedingPosition(animal,this.world))return{enabled:false,reason:'A healthy Woodspire canopy and two gripping legs are required.'};
    const index=this.world.idx(animal.x,animal.y),meal=this.foraging.options(animal,{index,kind:'woodspire',tissue:'crop'}).find(m=>m.i===index&&m.tissue==='crop');
    return meal?.handling.enabled?{enabled:true,reason:'Feed from the finite canopy crop.',meal}:{enabled:false,reason:meal?.handling.reason||'No edible canopy tissue for this mouth, or the crop is depleted.'};
  }
  playerCanopyFeed(){const a=this.player(),status=this.canopyFoodAvailability(a);if(!status.enabled)return{ok:false,type:'canopy-feed',message:status.reason};const result=this.foraging.consume(a,status.meal);if(result.ok)this.lastPlayerAction={type:'canopy-feed',actorId:a.id,kind:'woodspire',energyGain:result.energyGain,tick:this.tickCount};return{...result,type:'canopy-feed'}}
  flightStatus(animal=this.player()){return animal?.airborne?landingAvailability(animal,this.world,{swimmer:canSwim(animal)}):flightAvailability(animal,this.world)}
  playerToggleFlight(){if(this.paused)return{ok:false,type:'flight',message:'Resume the world first.'};const a=this.player();if(!a)return{ok:false,type:'flight',message:'No active creature.'};if(this.playerCombat.attackActive(a))return{ok:false,type:'flight',message:'Finish the attack before flying.'};const result=toggleFlight(a,this.world,{swimmer:canSwim(a)});if(result.ok){a.target=null;a.hidden=false;a.intent='idle';this.lastPlayerAction={type:a.airborne?'takeoff':'landing',actorId:a.id,tick:this.tickCount}}return result}
  canSwim(animal){return canSwim(animal)}
  canOccupy(animal,x,y){return this.world.isPlayable(x,y)&&canOccupy(animal,this.world,x,y)}
  canReach(animal,x,y){return canReach(animal,this.world,x,y)}
  playerControlStep(input,stepHz=CFG.controlHz){if(this.paused)return false;const moved=this.phasePlayerMovement(input,{stepHz});this.predator.moveEngaged(1/Math.max(CFG.simHz,Number.isFinite(stepHz)?stepHz:CFG.simHz));return moved}
  phasePlayerMovement(input,{stepHz=CFG.simHz}={}){
    const a=this.player();if(!a||a.perched)return false;
    if(a.torpor){const [vx,vy]=input?inputVector(input):[0,0];if(!vx&&!vy)return false;wakeTorpor(a,{reason:'Moving woke the creature.'})}
    const hz=Math.max(CFG.simHz,Number.isFinite(stepHz)?stepHz:CFG.simHz),stance=this.playerCombat.step(a,input,1/hz);
    if(!input)return false;const [dx0,dy0]=inputVector(input);if(!dx0&&!dy0)return false;
    const stepScale=CFG.simHz/hz,s=SPECIES[a.species],fx=adaptationEffects(a),dx=dx0,dy=dy0,sprint=stance.sprint,carrySlow=a.carryingFood?fx.carrySprint:1,injuryMove=this.injury.movementMultiplier(a)*stance.scale,landLifestyle=this.speciesLifestyle?.movementMultiplier?.(a,{swimming:false})||1,landBase=s.speed*a.genes.motion*carrySlow*injuryMove*movementEffect(this,a,landLifestyle);
    let prelimX=a.x+dx*landBase*(sprint?1.55*fx.sprintSpeed:1)/hz,prelimY=a.y+dy*landBase*(sprint?1.55*fx.sprintSpeed:1)/hz,travel=movementProfile(a,this.world,{fromX:a.x,fromY:a.y,toX:prelimX,toY:prelimY,sprint});
    if(!travel.allowed){this.pressure?.noteWaterBarrier?.(a);a.intent=a.hidden?'hide':'player';a.target=a.hidden?null:{dx,dy,sprint};a.dir=dirIndex(dx,dy);a.anim=(a.anim+stepScale)%8;return true}
    const sprintFactor=travel.swimming?travel.sprint:(sprint?1.55*fx.sprintSpeed:1),lifestyleSpeed=travel.swimming?(this.speciesLifestyle?.movementMultiplier?.(a,{swimming:true})||1)/Math.max(.001,landLifestyle):1,sp=landBase*travel.speed*sprintFactor*lifestyleSpeed,nx=a.x+dx*sp/hz,ny=a.y+dy*sp/hz;
    if(a.hidden){const canShift=!travel.swimming&&fx.adaptiveCamouflage&&!sprint&&this.coverAt({x:nx,y:ny})>=.32;if(!canShift)a.hidden=false}
    a.intent=a.hidden?'hide':'player';a.target=a.hidden?null:{dx,dy,sprint};
    if(this.canOccupy(a,nx,ny)){const oldX=a.x,oldY=a.y;a.x=nx;a.y=ny;this.regionalEcology.notePageMove(a,oldX,oldY);a.movedTick=this.tickCount;a.energy-=.009*sp*bodyMass(a)/a.genes.metabolism*(PHYSIOLOGY_PARITY.enabled?1:CFG.manualMoveCostScale)*stepScale*(sprint?fx.sprintEnergy:1)*travel.energy*(this.speciesLifestyle?.movementEnergyMultiplier?.(a,{swimming:travel.swimming})||1)*(a.hidden?1.10:1)*this.injury.movementCostMultiplier(a,{sprint});this.history.noteStep(a,stepScale);this.speciesLifestyle?.noteMovement?.(a,{swimming:travel.swimming,distance:sp/hz});if(!travel.swimming)this.breakOpeningSafetyOnContact(a)}
    a.dir=dirIndex(dx,dy);a.anim=(a.anim+stepScale*(travel.swimming?1.35:1))%8;return true;
  }
  breakOpeningSafetyOnContact(a){
    if(!this.isOpeningProtected(a))return false;
    let hunter=null,best=1.7;for(const other of this.animals){if(!other.alive||!canHunt(other))continue;const d=Math.hypot(other.x-a.x,other.y-a.y);if(d<best&&this.world.sameLand(a.x,a.y,other.x,other.y)){hunter=other;best=d}}
    if(!hunter)return false;this.endOpeningGrace('approached stalker');this.lastPlayerAction={type:'danger-engaged',hunterId:hunter.id,tick:this.tickCount};return true;
  }
  phaseClimate(){const dayInSeason=(this.day-1)%CFG.seasonDays;const seasonTemp=[.54,.78,.58,.30][this.seasonIndex];const rain=[.58,.35,.46,.26][this.seasonIndex];const temp=seasonTemp+.04*Math.sin(dayInSeason/CFG.seasonDays*Math.PI*2),draw=this.rng.next();if(WEATHER_PATTERNS.enabled){/* The sim.rng draw above is kept so every other random sequence is identical with weather patterns on or off; weather uses its own seeded stream. */const st=validWeatherState(this.weatherPattern)?this.weatherPattern:(this.weatherPattern=createWeatherState(this.seed));advanceWeatherTo(st,Math.floor(this.tickCount/CFG.dayTicks));this.climate={temp,rain:rain*st.factor,weatherFactor:st.factor};return}this.climate={temp,rain:rain*(.75+.5*draw)}}
  phaseSoil(){if(this.tickCount%CFG.dayTicks!==0)return;const w=this.world;if(SOIL_WATER.enabled){advanceEnvironmentWater(w,this.climate,this.day);advanceSoilDay(w,this.climate,this.day);for(let i=0;i<w.len;i++)if(w.environment||!w.water[i])w.temperature[i]+=(localTemperature(w,this.climate,i)-w.temperature[i])*(w.water[i]?.04:.12);return}for(let i=0;i<w.len;i++){if(w.water[i]){w.moisture[i]=1;continue}const weather=Math.max(.05,Math.min(1,w.moisture[i]+this.climate.rain*.06-(.025+.035*this.climate.temp)));const groundwater=(w.seepage[i]||0)*.72;w.moisture[i]=Math.max(weather,groundwater);w.temperature[i]+=(this.climate.temp-w.temperature[i])*.12;}}
  phaseVegetation({once=false}={}){if(once&&!beginPageVegetationDay(this))return;advanceFreshwater(this.world);advancePlantInputs(this);const w=this.world,temp=this.climate.temp,season=this.season,dispersal=this.dispersal,entries=Object.entries(PLANTS).filter(([kind])=>kind!=='rotcap').map(([kind,p])=>({kind,p,d:p.dispersal,plants:w.plants[kind],bank:w.seedBank?.[kind]||null,seasonBoost:kind==='bramble'&&season==='AUTUMN'?1.012:kind==='thistlepod'&&season==='SUMMER'?1.007:1}));dispersal.advanceDay();const pageCounts=visitLandByWorldPage(w,i=>{const m=w.moisture[i],f=w.fertility[i],scar=this.history.scarAt(i);growLandProducers(this,i,entries,{m,f,temp:w.environment?w.temperature[i]:temp,scar,grow});advanceFungi(this,i);});dispersal.advanceBotanicalReproduction();this.partAbilities.advanceSoilDay();this.history.advanceDay();if(once)completePageVegetationDay(this,pageCounts)}
  phasePerception(){this.rebuildSpatial();this.regionalEcology.observe();this.carrying.observe();this.cognition.observe();this.foraging.observeNearby(this.player());this.territory.observe();this.stalkerTerritory.observe();this.migration.observe();this.social.observe();this.pressure.observe()}
  rebuildSpatial(){for(const bucket of this.spatial)bucket.length=0;for(const a of this.animals){if(!a.alive)continue;const bx=Math.max(0,Math.min(this.spatialCols-1,Math.floor(a.x/this.spatialBucketSize))),by=Math.max(0,Math.min(this.spatialCols-1,Math.floor(a.y/this.spatialBucketSize)));this.spatial[by*this.spatialCols+bx].push(a)}}
  forEachNearby(a,radius,fn){const bs=this.spatialBucketSize,c=this.spatialCols,minX=Math.max(0,Math.floor((a.x-radius)/bs)),maxX=Math.min(c-1,Math.floor((a.x+radius)/bs)),minY=Math.max(0,Math.floor((a.y-radius)/bs)),maxY=Math.min(c-1,Math.floor((a.y+radius)/bs));for(let by=minY;by<=maxY;by++)for(let bx=minX;bx<=maxX;bx++){const bucket=this.spatial[by*c+bx];for(const b of bucket)if(fn(b)===false)return false}return true}
  isPredatorTo(pred,prey){
    if(!pred?.alive||!prey?.alive||pred.id===prey.id)return false;
    return preyPreference(pred,prey)>0;
  }
  phaseDecision(input){const escapeThreats=new Map(),alarmed=new Map();this._decisionPopulation=this.population();for(const a of this.animals){if(!a.alive)continue;if(!a.player&&!this.carrying.shouldRefreshDecision(a))continue;
      if(a.torpor){const predator=this.findNearest(a,b=>b.alive&&this.isPredatorTo(b,a),5);if(predator)wakeTorpor(a,{reason:'Nearby predator disturbed torpor.'});else{a.intent='torpor';a.target=null;continue}}
      if(a.player&&input&&!this.playerAutonomy){const [dx,dy]=inputVector(input);if(dx||dy){a.intent='player';a.target={dx,dy,sprint:!!input.sprint};continue}if(a.hidden){a.intent='hide';a.target=null;continue}const court=this.reproduction.courtTarget();if(court){a.intent='mate';a.target=court;continue}a.intent='idle';a.target=null;continue}
      const s=SPECIES[a.species];const e=a.energy/s.maxEnergy,h=a.hydration/s.maxHydration;
      // v1.61.0 water dwellers live in water: ashore they return to it (unless hunting or fleeing), and
      // a filter or grazing mouth feeds there.
      const dweller=!a.player&&isWaterDweller(a),inWater=dweller&&!!this.world.water[this.world.idx(a.x,a.y)];
      if(dweller&&!inWater&&(h<.7||a.intent!=='hunt')){const wtr=nearestWater(this.world,a.x,a.y);if(wtr){a.intent='to-water';a.target=wtr;continue}}
      if(h<.28&&!dweller){const water=this.world.nextDrinkStep(a.x,a.y);if(water){a.intent='drink';a.target=water;continue}}
      if(a.familyRally?.untilTick>this.tickCount&&a.species==='genvo'&&a.age>=SPECIES.genvo.maturity){const target=this.animals.find(b=>b.id===a.familyRally.targetId&&b.alive);if(target&&canHunt(target)&&Math.hypot(target.x-a.x,target.y-a.y)<=11){a.intent='mob';a.target=target;continue}else a.familyRally=null}else if(a.familyRally)a.familyRally=null;
      if(a.playerThreat?.untilTick>this.tickCount){const dx=a.x-a.playerThreat.x,dy=a.y-a.playerThreat.y,len=Math.hypot(dx,dy)||1;a.intent='escape';a.target={x:a.x+dx/len*6,y:a.y+dy/len*6};continue}else if(a.playerThreat)a.playerThreat=null;
      const baseThreatRadius=5*a.genes.senses*threatSenseEffect(this,a);const threatRadius=a.lineage?this.cognition.flightRadius(a,baseThreatRadius):baseThreatRadius;
      const perceived=[];const stages=THREAT_STAGES.enabled&&THREAT_APPRAISAL.enabled?thresholds(a):null;let alarmBy=null,alarmLevel=0,watchBy=null,watchLevel=0;const threat=this.findNearest(a,b=>{const d=Math.hypot(b.x-a.x,b.y-a.y);if(!stages){const sensed=this.isPredatorTo(b,a)&&d<threatRadius&&d<=threatRadius*wildTraits(b).stealth&&appearsThreatening(b,a,d);if(sensed)perceived.push(b);return sensed}
        // Staged perception (threat-perception.js): detection by senses, then a threat level against vigilance, alarm and flight thresholds.
        if(!this.isPredatorTo(b,a)||d>=threatRadius||d>threatRadius*wildTraits(b).stealth&&!watching(this,a,b)||!detects(this,a,b,d,threatRadius))return false;const L=threatLevel(a,b,d,threatRadius);if(L>=stages.alarm){perceived.push(b);if(L>alarmLevel){alarmLevel=L;alarmBy=b}}else if(L>=stages.vigilance&&L>watchLevel){watchLevel=L;watchBy=b}return L>=stages.flight},threatRadius);if(perceived.length)escapeThreats.set(a.id,perceived);
      if(stages){const st=this.stats.threatStages??={vigilance:0,alarm:0,flight:0,wary:0};if(threat)st.flight++;else if(alarmBy){st.alarm++;noteVigilance(this,a,alarmBy);alarmed.set(a,alarmBy)}else if(watchBy){st.vigilance++;noteVigilance(this,a,watchBy)}}
      if(threat){
        if(a.perched&&!threat.perched){a.intent='idle';a.target=null;continue}
        if(a.perched&&threat.perched&&flightAvailability(a,this.world).enabled)takeoff(a,this.world);
        if(!a.airborne&&!a.perched&&!a.player&&a.energy>24&&flightAvailability(a,this.world).enabled)takeoff(a,this.world);
        if(a.airborne&&!threat.airborne&&roostAvailability(a,this.world).enabled){perch(a,this.world);continue}
        const lifestyleDefense=this.speciesLifestyle?.threatDecision?.(a,threat);if(lifestyleDefense){a.intent=lifestyleDefense.intent;a.target=lifestyleDefense.target;continue}const specialized=this.specialization.threatResponse(a,threat);if(specialized){a.intent=specialized.intent;a.target=specialized.target;continue}if(a.lineage&&canHunt(threat)&&this.habits.standsGround(a)){this.habits.noteStand(a);a.intent='mob';a.target=threat;continue}if(a.lineage)this.habits.noteFlee(a);const caregiver=this.family.caregiver(a),shelterTarget=(a.lineage&&this.family.isDependent(a))?this.shelter.safeTarget(a,{maxDistance:12}):null;const refuge=!a.lineage&&!shelterTarget&&canSwim(a)&&!canSwim(threat)?nearestWater(this.world,a.x,a.y,AQUATIC.refuge):null;if(refuge){a.intent='escape';a.target=refuge;continue}const den=!shelterTarget?refugeTarget(this,a,threat):null;if(den){a.intent='refuge';a.target={x:den.x,y:den.y,siteId:den.id};continue}
        a.intent=shelterTarget?'shelter':'escape';a.target=shelterTarget||((this.family.isDependent(a)&&caregiver)?{x:caregiver.x,y:caregiver.y}:{x:a.x+(a.x-threat.x)*2,y:a.y+(a.y-threat.y)*2});continue}
      const sharedAlarm=this.social.alarmResponse(a);if(sharedAlarm){a.intent='group-alarm';a.target=sharedAlarm;this.social.noteAlarm(a);continue}
      const dormancy=decideTorpor(this,a);if(dormancy){a.intent=dormancy.intent;a.target=dormancy.target;continue}
      const pressured=this.territory.pressureTarget(a);if(pressured){a.intent='leave-core';a.target=pressured;continue}
      const weatherRefuge=a.lineage?this.familyWeather.decision(a):null;if(weatherRefuge){a.intent=weatherRefuge.intent;a.target=weatherRefuge.target;continue}
      const illnessFamily=this.familyIllness.decision(a);if(illnessFamily){a.intent=illnessFamily.intent;a.target=illnessFamily.target;continue}
      const learning=a.lineage?this.family.learningDecision(a):null;if(learning){a.intent=learning.intent;a.target=learning.target;continue}
      const practice=a.lineage?this.family.practiceDecision(a):null;if(practice){a.intent=practice.intent;a.target=practice.target;continue}
      if(h<.58){const water=this.world.nextDrinkStep(a.x,a.y);if(water){a.intent='drink';a.target=water;continue}}
      const cached=(a.lineage&&e<.48)?this.shelter.safeTarget(a,{maxDistance:this.specialization.cacheReturnRadius(a),requireFood:true}):null;if(cached){a.intent='shelter-feed';a.target=cached;continue}
      const directive=a.lineage?this.familyDirectives.decision(a):null;if(directive){a.intent=directive.intent;a.target=directive.target;continue}
      const speciesPriority=a.lineage?this.speciesCoexistence?.autonomousDecision?.(a):null;if(speciesPriority){a.intent=speciesPriority.intent;a.target=speciesPriority.target;continue}
      const lifestyleDecision=a.lineage?this.speciesLifestyle?.autonomousDecision?.(a):null;if(lifestyleDecision){a.intent=lifestyleDecision.intent;a.target=lifestyleDecision.target;continue}
      // A paid courtship display may continue, but never outranks urgent survival.
      const ongoingDisplay=activeCourtship(this,a);if(ongoingDisplay){a.intent='mate';a.target=ongoingDisplay;continue}
      // Eligible reproduction precedes optional learned tendencies. Earlier survival and commands retain priority.
      // Breeding-ready sparse cohorts use the recovery search range before reserves reach 82%.
      const repro=s.reproduction||{};const reproEnergy=breedingEnergyGate(a.species);
      if(!this.isManualPlayer(a)&&!a.infected&&a.age>s.maturity&&a.reproCooldown<=0&&e>reproEnergy){const carrying=this.carrying.breedingState(a);a.reproDrive=Math.min(1.25,(a.reproDrive||0)+(carrying.allowed?carrying.driveRate:0));if(carrying.allowed&&a.reproDrive>=1){const mate=this.autonomousMateTarget(a,{far:e>.82||this.recovery.sparse(a.species)});if(mate){a.intent='mate';a.target=mate;continue}}}else if(!this.isManualPlayer(a)&&a.reproDrive>0)a.reproDrive=Math.max(0,a.reproDrive-.025);
      const dispersal=a.lineage&&e>=.72&&this.migration.states.get(a.id)?.purpose==='dispersal'?this.migration.targetFor(a):null;if(dispersal){a.intent='migrate';a.target=dispersal;continue}
      const tendency=a.lineage?this.tendency?.autonomousDecision?.(a):null;if(tendency){a.intent=tendency.intent;a.target=tendency.target;continue}
      const follow=this.family.followTarget(a);if(follow){a.intent='follow';a.target=follow;continue}
      const strategy=this.specialization.strategicDecision(a);if(strategy){a.intent=strategy.intent;a.target=strategy.target;continue}
      const guard=this.family.guardTarget(a);if(guard){a.intent='guard';a.target=guard.child;continue}
      const provision=this.specialization.provisioningDecision(a);if(provision){a.intent=provision.intent;a.target=provision.target;continue}
      if(canHunt(a)&&a.playerAversion?.untilTick>this.tickCount){const active=this.player();if(active&&a.playerAversion.targetId===active.id){const denRetreat=this.stalkerTerritory.retreatTarget(a,active);if(denRetreat){a.intent='return-den';a.target=denRetreat;continue}const dx=a.x-active.x,dy=a.y-active.y,len=Math.hypot(dx,dy)||1;a.intent='escape';a.target={x:a.x+dx/len*7,y:a.y+dy/len*7};continue}}else if(a.playerAversion)a.playerAversion=null;
      if(canHunt(a)&&this.playerEnabled){const active=this.player(),pd=active?Math.hypot(active.x-a.x,active.y-a.y):Infinity,concealed=active?!this.predator.canSee(a,active,pd):false,engaged=!!(active&&a.playerHunt?.targetId===active.id),denPressure=active?this.stalkerTerritory.pressureFor(a,active):null,commitRange=(denPressure?.inside?10.5:9)*a.genes.senses,commitEnergy=denPressure?.insideCore?.98:.9;if(active&&(!concealed||engaged)&&!this.isOpeningProtected(active)&&active.id!==a.id&&preyPreference(a,active)>0&&this.world.sameLand(a.x,a.y,active.x,active.y)&&pd<=(engaged?10.5*a.genes.senses:commitRange)&&(engaged||(PREDATION_PARITY.enabled?(e<.72||needsRecoveryForage(a))&&this.bestPrey(a,26*a.genes.senses)===active:e<commitEnergy))){const encounter=this.predator.decision(a,active);if(encounter){this.predator.markEngaged();a.intent=encounter.intent;a.target=encounter.target;continue}}else if(a.playerHunt)this.predator.clear(a)}
      if(canHunt(a)&&this.playerEnabled){const territorial=this.stalkerTerritory.competitionDecision(a);if(territorial){a.intent=territorial.intent;a.target=territorial.target;continue}}
      if(e<.72&&(inWater||amphibiousForager(a))&&!this.isManualPlayer(a)){const food=bestFreshwaterFood(this,a,9*a.genes.senses);if(food){a.intent='feed';a.target=food;continue}}
      // A reachable meal at the current site costs less than a new pursuit.
      if(e<.72&&plantPreference(a,'carrion')>0&&this.world.carrion[this.world.idx(a.x,a.y)]>.08){a.intent='feed';a.target={x:a.x,y:a.y,kind:'carrion'};continue}
      // Hungry hunters can discover tangible eggs, using existing dietary compatibility.
      if(e<.64&&canHunt(a)&&!a.player){const egg=edibleEggTarget(this,a);if(egg){a.intent='egg-hunt';a.target={x:egg.x,y:egg.y,eggId:egg.id};continue}}
      if(e<.72||needsRecoveryForage(a)){if(canHunt(a)){if(HUNT_COMMITMENT.enabled&&a.intent==='hunt'&&a.target?.alive&&a.target.species){const t=a.target,d=Math.hypot(t.x-a.x,t.y-a.y);if(d<=26*a.genes.senses&&preyPreference(a,t)>0&&!this.preyHiddenFrom(t,a,d,{tracking:true})&&this.world.sameLand(a.x,a.y,t.x,t.y)&&!(a.avoidPrey?.id===t.id&&a.avoidPrey.untilTick>this.tickCount)){continue}}const prey=this.bestPrey(a,26*a.genes.senses);if(prey){a.intent='hunt';a.target=prey;continue}}else if(a.lineage&&a.species==='genvo'){const huntR=this.habits.huntRadius(a);if(huntR){const prey=this.bestPrey(a,huntR,{allowNonHunter:true});if(prey){a.intent='hunt';a.target=prey;continue}}}let remembered=a.lineage?this.cognition.foodTarget(a):null;if(remembered&&a.lineage&&!this.isManualPlayer(a)&&this.stalkerTerritory.landscapeAt(remembered.x,remembered.y,{animal:a}).risk>.52)remembered=null;const food=committedFoodTarget(this,a)||remembered||this.bestFood(a);if(food){const roots=this.partAbilities.digDecision(a,{food});a.intent=roots?'dig':'feed';a.target=roots||food;continue}const roots=this.partAbilities.digDecision(a);if(roots){a.intent='dig';a.target=roots;continue}}
      if(canHunt(a)&&this.playerEnabled){const denDecision=this.stalkerTerritory.restDecision(a,e);if(denDecision){a.intent=denDecision.intent;a.target=denDecision.target;continue}}
      // Optional parent care must never outrank hunger, danger, thirst, or courtship.
      if(!a.player){const nest=chooseCareNest(this,a);if(nest){a.intent='nest-care';a.target={x:nest.x,y:nest.y,nestId:nest.id};continue}}
      // EP: an autonomous receptive colony animal may meet an approaching suitor.
      // Existing survival and individual mate search retain precedence.
      const breedingSite=!a.lineage&&!a.player?breedingSiteDecision(this,a,{energy:e,hydration:h}):null;if(breedingSite){a.intent=breedingSite.intent;a.target=breedingSite.target;continue}
      // An established breeding site is not abandoned for a passing courtship.
      const responding=respondingPartner(this,a);if(responding){a.intent='mate';a.target=responding;continue}
      const wildlifeMigration=!a.lineage&&!a.player?this.migration.targetFor(a):null;if(wildlifeMigration){a.intent='migrate';a.target=wildlifeMigration;continue}
      const intrusion=a.lineage?this.territory.intrusionResponse(a):null;if(intrusion){a.intent=intrusion.intent;a.target=intrusion.target;continue}
      const familySocial=a.lineage?this.cognition.socialTarget(a):null;if(familySocial){a.intent='social';a.target=familySocial;continue}
      const spacing=this.social.spacingTarget(a);if(spacing){a.intent='group-space';a.target=spacing;continue}
      const cohesion=this.social.cohesionTarget(a);if(cohesion){a.intent='group';a.target=cohesion;continue}
      const rhythm=this.wildlifeRhythm.decision(a,{energy:e,hydration:h});if(rhythm){a.intent=rhythm.intent;a.target=rhythm.target;continue}
      const migration=a.lineage?this.migration.targetFor(a):null;if(migration){a.intent=migration.status==='returning'?'migration-return':'migrate';a.target=migration;continue}
      const home=(a.lineage&&!this.migration.isAway(a))?this.territory.returnTarget(a):null;if(home){a.intent='return-home';a.target=home;continue}
      if(inWater&&!(canHunt(a)&&e<.72)){if(a.intent!=='swim'||!a.target||this.rng.chance(.03)){a.target=roamWater(this.world,this.rng,a.x,a.y)||{x:a.x,y:a.y}}a.intent='swim';continue}
      a.intent='explore';if(!a.target||this.rng.chance(.025)){const ang=this.rng.int(0,7),baseD=this.rng.range(3,10),d=a.lineage?this.cognition.exploreDistance(a,baseD):baseD;a.target=(a.lineage?this.territory.roamTarget(a,d):null)||{x:a.x+DIRS[ang][0]*d,y:a.y+DIRS[ang][1]*d}}a.target=explorationDestination(this,a,a.target);
    }
    // v1.33.2 learned fear: autonomous family keep optional trips out of places they fear.
    for(const a of this.animals)if(a.alive&&a.lineage&&a.target)this.cognition.steerFromFear(a);
    // Staged alarm: an alarmed animal keeps its activity but does not walk toward the predator.
    for(const [a,b] of alarmed)if(!this.isManualPlayer(a)&&applyAlarm(a,b))this.stats.threatStages.wary++;
    for(const a of this.animals)if(a.alive&&!this.isManualPlayer(a)&&(a.intent==='escape'||a.intent==='group-alarm')&&a.target)a.target=escapeDestination(this,a,a.target,escapeThreats.get(a.id));
  }
  phaseMovement({skipManualPlayer=false,locomotionOnly=false}={}){const ri=locomotionOnly?NO_INTERACTION:a=>this.resolveInteraction(a);for(const a of this.animals){if(!a.alive||a.torpor)continue;
    // Wildlife can physically approach an elevated clutch, then take off and
    // perch before caring for it or raiding it. They cannot do so from the soil.
    if(!a.player&&!a.perched&&!locomotionOnly&&(a.intent==='nest-care'||a.intent==='egg-hunt')){
      const elevated=a.intent==='nest-care'?this.nests.find(n=>n.id===a.target?.nestId):this.nests.find(n=>n.id===this.eggs.find(e=>e.id===a.target?.eggId)?.nestId);
      if(elevated?.layer==='canopy'&&Math.hypot(a.x-elevated.x,a.y-elevated.y)<1.1){
        if(a.airborne)perch(a,this.world);
        else if(flightAvailability(a,this.world).enabled)takeoff(a,this.world);
      }
    }
    if(a.perched){
      // A perched animal cannot walk to a ground goal. When it must leave its
      // refuge, relaunch if funded, otherwise climb down and walk normally.
      if(a.intent!=='nest-care'&&a.intent!=='egg-hunt'&&a.intent!=='idle'&&a.intent!=='hide'){
        if(flightAvailability(a,this.world).enabled)takeoff(a,this.world);
        else descend(a,this.world);
      }
      if(a.perched){ri(a);continue}
    }
    if(a.airborne&&!a.player&&a.intent!=='escape'&&a.intent!=='flee'&&(a.energy<18||!a.target||Math.hypot((a.target.x??a.x)-a.x,(a.target.y??a.y)-a.y)<1.6))land(a,this.world,{swimmer:canSwim(a)});if(a.refugeSiteId!=null&&a.intent!=='refuge')a.refugeSiteId=null;if((skipManualPlayer||locomotionOnly)&&a.player&&a.intent==='player'){ri(a);continue}if(a.pursuitEngaged&&this.predator.isEngagedMover(a))continue;const movement=this.activity.movementBudget(a);if(!movement.advance){if(ACTIVITY_REVIEW.continuousInteraction&&(a.intent==='drink'||isFeedingIntent(a.intent))&&atInteractionTarget(this,a))ri(a);continue}if(!this.activity.ambientMoveAllowed(a)){ri(a);continue}if(a.intent==='mate'&&a.target?.alive&&Math.hypot(a.x-a.target.x,a.y-a.target.y)<COURTSHIP_PERFORMANCE.radius){ri(a);continue}const s=SPECIES[a.species],moveScale=movement.scale||1;let dx=0,dy=0,sprint=false;if(a.intent==='player'&&a.target){dx=a.target.dx;dy=a.target.dy;sprint=a.target.sprint}else if(a.target){const routeTarget=landRouteTarget(this,a,a.target),tx=routeTarget.x,ty=routeTarget.y;dx=(tx??a.x)-a.x;dy=(ty??a.y)-a.y}const len=Math.hypot(dx,dy);if(len>.03){dx/=len;dy/=len;const fx=adaptationEffects(a),carrySlow=a.carryingFood?fx.carrySprint:1,predatorMove=this.predator.speedMultiplier(a),landLifestyle=this.speciesLifestyle?.movementMultiplier?.(a,{swimming:false})||1,landBase=s.speed*a.genes.motion*carrySlow*predatorMove*movementEffect(this,a,landLifestyle)*(HEALING_REVIEW.enabled&&a.injuryCare?.active?this.injury.movementMultiplier(a):1),prelimX=a.x+dx*landBase*(sprint?1.55*fx.sprintSpeed:1)/CFG.simHz*moveScale,prelimY=a.y+dy*landBase*(sprint?1.55*fx.sprintSpeed:1)/CFG.simHz*moveScale;let travel=movementProfile(a,this.world,{fromX:a.x,fromY:a.y,toX:prelimX,toY:prelimY,sprint}),sprintFactor=travel.swimming?travel.sprint:(sprint?1.55*fx.sprintSpeed:1),lifestyleSpeed=travel.swimming?(this.speciesLifestyle?.movementMultiplier?.(a,{swimming:true})||1)/Math.max(.001,landLifestyle):1,sp=Math.min(landBase*travel.speed*sprintFactor*lifestyleSpeed,a.navigationRoute&&!a.navigationRoute.failed?len*CFG.simHz/Math.max(.001,moveScale):Infinity),nx=a.x+dx*sp/CFG.simHz*moveScale,ny=a.y+dy*sp/CFG.simHz*moveScale;this.specialization.maintainConcealment(a,nx,ny);if(!travel.allowed||!this.canOccupy(a,nx,ny)){const steer=this.steerAroundWater(a,dx,dy,landBase,moveScale);if(steer){dx=steer.dx;dy=steer.dy;nx=steer.x;ny=steer.y;travel=movementProfile(a,this.world,{fromX:a.x,fromY:a.y,toX:nx,toY:ny,sprint:false});sp=landBase}else{a.target=null;ri(a);continue}}const oldX=a.x,oldY=a.y;a.x=nx;a.y=ny;this.regionalEcology.notePageMove(a,oldX,oldY);a.movedTick=this.tickCount;a.energy-=.009*sp*bodyMass(a)/a.genes.metabolism*moveScale*travel.energy*(this.speciesLifestyle?.movementEnergyMultiplier?.(a,{swimming:travel.swimming})||1);this.speciesLifestyle?.noteMovement?.(a,{swimming:travel.swimming,distance:sp/CFG.simHz*moveScale});a.dir=dirIndex(dx,dy);a.anim=(a.anim+moveScale*(travel.swimming?1.35:1))%8;this.history.noteStep(a,moveScale)}ri(a)}}
  steerAroundWater(a,dx,dy,sp,moveScale=1){
    if(this.canSwim(a))return null;
    const step=sp/CFG.simHz*moveScale,target=a.target&&Number.isFinite(a.target.x)&&Number.isFinite(a.target.y)?a.target:null;const waypoint=planLandDetour(this,a,target);if(waypoint){const rx=waypoint.x-a.x,ry=waypoint.y-a.y,len=Math.hypot(rx,ry);if(len>.001){const sx=rx/len,sy=ry/len,x=a.x+sx*Math.min(step,len),y=a.y+sy*Math.min(step,len);if(this.canOccupy(a,x,y))return{x,y,dx:sx,dy:sy}}}let best=null,bestScore=Infinity;const base=Math.atan2(dy,dx);
    for(const turn of [Math.PI/4,-Math.PI/4,Math.PI/2,-Math.PI/2,3*Math.PI/4,-3*Math.PI/4,Math.PI]){const ang=base+turn,sx=Math.cos(ang),sy=Math.sin(ang),x=a.x+sx*step,y=a.y+sy*step;if(x<=1||y<=1||x>=CFG.worldSize-2||y>=CFG.worldSize-2||this.world.water[this.world.idx(x,y)])continue;const score=target?Math.hypot(target.x-x,target.y-y):Math.abs(turn);if(score<bestScore){bestScore=score;best={x,y,dx:sx,dy:sy}}}
    return best
  }
  resolveInteraction(a){if(a.airborne)return; if(a.perched&&a.intent!=='nest-care'&&a.intent!=='egg-hunt')return; if(a.intent==='refuge'&&a.target?.siteId!=null){if(Math.hypot(a.x-a.target.x,a.y-a.target.y)<1.1)a.refugeSiteId=a.target.siteId;return}if(a.intent==='egg-hunt'&&a.target?.eggId!=null){const egg=this.eggs.find(e=>e.id===a.target.eggId);if(egg&&Math.hypot(a.x-egg.x,a.y-egg.y)<1.1)eatEgg(this,a,egg);if(!egg||!this.eggs.includes(egg))a.target=null;return}
    if(a.intent==='nest-care'&&a.target?.nestId!=null){const nest=this.nests.find(n=>n.id===a.target.nestId);if(nest)careForNest(this,a,nest);if(!nest||nest.lastCareDay===this.day)a.target=null;return}
    if(a.intent==='dig'&&a.target?.kind==='roots')return this.partAbilities.resolveDig(a);const s=SPECIES[a.species],w=this.world;if(a.intent==='drink'&&w.isDrinkable(a.x,a.y)){const beforeWater=a.hydration;a.hydration=Math.min(s.maxHydration,a.hydration+5.2);this.regionalEcology.noteEngineerDrink(a,a.hydration-beforeWater);{const filter=partEffectFactors(a)?.mouthFood?.drinkEnergyTick;if(filter){const meal=harvestFreshwater(this,a,Math.min(filter,s.maxEnergy-a.energy));if(meal)a.energy+=meal.energyGain}}this.cognition.onDrink(a);this.family.notePracticeInteraction(a,'water',{x:a.x,y:a.y,amount:a.hydration-beforeWater});if(a.hydration/s.maxHydration>.82)a.target=null}
    if(isFeedingIntent(a.intent)){if(a.target?.species){return this.tryKill(a,a.target)}const kind=a.target?.kind;if(kind&&Math.hypot(a.x-a.target.x,a.y-a.target.y)<1.1&&this.canReach(a,a.target.x,a.target.y)){const tx=a.target.x,ty=a.target.y,foodScale=this.speciesLifestyle?.foodEnergyMultiplier?.(a,{kind})||1;if(FRESHWATER_FOOD[kind]){const meal=harvestFreshwater(this,a,Math.min(5,s.maxEnergy-a.energy),a.target);if(meal){a.energy+=meal.energyGain;this.cognition.onFeed(a,kind,{x:tx,y:ty});this.speciesLifestyle?.noteFeeding?.(a,{kind,amount:meal.amount,energyGain:meal.energyGain});if(a.player||a.lineage)this.foraging.rememberPatch(a,kind,a.target.foodX??tx,a.target.foodY??ty,{meal:true});this.family.notePracticeInteraction(a,'food',{x:a.target.foodX??tx,y:a.target.foodY??ty,kind,amount:meal.amount})}}else if(kind==='carrion'){if(plantPreference(a,'carrion')<=0){a.target=null;return}const i=w.idx(tx,ty),got=Math.min(.09,w.carrion[i]);w.carrion[i]-=got;a.energy=Math.min(s.maxEnergy,a.energy+got*34*plantPreference(a,'carrion')*a.genes.digestion*adaptationEffects(a).foodGain*foodScale);if(got>0){this.disease.onCarrionFeed(a,i,got);this.cognition.onFeed(a,kind,{x:tx,y:ty});this.speciesLifestyle?.noteFeeding?.(a,{kind,amount:got});this.family.notePracticeInteraction(a,'food',{x:tx,y:ty,kind,amount:got})}}else if(PLANTS[kind]){const parity=PHYSIOLOGY_PARITY.enabled,prof=this.foraging.profile(kind),bite=parity?mealBiteFor(prof):.16,crop=this.dispersal.seedReserve[kind],meal=crop?this.foraging.options(a,{index:w.idx(tx,ty),kind,tissue:a.target.tissue??null}).sort((p,q)=>q.needScore-p.needScore)[0]:null,receipt=meal?this.dispersal.harvestMeal(a,kind,meal.i,parity?mealBiteFor(meal.profile):Math.min(.16,meal.profile.bite),meal.tissue):null,got=crop?(receipt?.removed||0):w.consume(kind,tx,ty,bite);this.history.notePlantConsumption(kind,tx,ty,got);if(!crop)this.dispersal.onFeed(a,kind,got);a.energy=Math.min(s.maxEnergy,a.energy+(receipt?.edible??got)*(receipt?this.dispersal.genomeAt(kind,meal.i).traits.nutrition:PLANTS[kind].nutrition)*(meal?.eff??plantPreference(a,kind))*a.genes.digestion*3.6*adaptationEffects(a).foodGain*foodScale*(parity?prof.energy*breadthBonusFor(a,prof.group):1));if(parity&&got>0){if(PHYSIOLOGY_PARITY.foodWater&&meal?.tissue!=='kernel'){const water=prof.water*Math.min(1,got/prof.bite)*(receipt?receipt.edible/Math.max(.001,got):1);a.hydration=Math.min(s.maxHydration,a.hydration+water)}noteFoodGroup(a,prof.group)}if(got>0){this.cognition.onFeed(a,kind,{x:tx,y:ty});this.speciesLifestyle?.noteFeeding?.(a,{kind,amount:got});this.family.notePracticeInteraction(a,'food',{x:tx,y:ty,kind,amount:got})}}a.target=null}}
    if(a.intent==='hunt'&&a.target?.alive&&Math.hypot(a.x-a.target.x,a.y-a.target.y)<.85)this.tryKill(a,a.target);
    if(a.intent==='charge-player')this.predator.resolveCharge(a);
    if(a.intent==='mate'&&a.target?.alive&&Math.hypot(a.x-a.target.x,a.y-a.target.y)<.9&&performCourtship(this,a,a.target))this.tryMate(a,a.target);
    if(a.intent==='ward'&&a.target?.alive&&Math.hypot(a.x-a.target.x,a.y-a.target.y)<1.15){this.territory.applyWard(a,a.target);a.target=null}
    if(a.intent==='mob'&&a.target?.alive&&Math.hypot(a.x-a.target.x,a.y-a.target.y)<1.2)this.familyMobStrike(a,a.target);
    this.specialization.resolve(a)}
  tryKill(pred,prey,{chanceBonus=0}={}){
    if(!pred?.alive||!prey?.alive||pred===prey||(pred.airborne?'air':pred.perched?'canopy':'ground')!==(prey.airborne?'air':prey.perched?'canopy':'ground'))return false;
    if(this.isOpeningProtected(prey))return false;
    // A prey inside a refuge its hunter cannot enter cannot be bitten (Phase 3I refuges, any prey).
    if(refugeAgainst(this,prey,pred)){pred.target=null;pred.avoidPrey={id:prey.id,untilTick:this.tickCount+CFG.simHz*4};return false}
    const ps=SPECIES[pred.species],qs=SPECIES[prey.species],eff=preyPreference(pred,prey),weak=!eff&&weakBiteAttempt(pred,prey);if((!eff&&!weak)||!qs)return false;
    if(pred.player&&!prey.player)prey.playerThreat={x:pred.x,y:pred.y,untilTick:this.tickCount+CFG.simHz*3};
    if(pred.lineage&&pred.species==='genvo')this.habits.noteHunt(pred);
    // Predation parity (Phase 3I): one capture, damage and bite-meal rule for every predator and prey; the
    // player-specific branches below remain only when ?predationParity=0.
    const special=!PREDATION_PARITY.enabled&&!!(prey.player||pred.player);
    const shelterProtection=prey.lineage?this.shelter.protectionFactor(prey):1,vulnerability=qs.predationVulnerability??1,huntScale=this.speciesLifestyle?.huntSuccessMultiplier?.(pred)||1;
    // Rare prey is harder to find (v1.61.0): a wild hunt succeeds less often where that prey is locally scarce.
    const scarce=special||RARITY_REVIEW.enabled?1:Math.max(CFG.wildHunt.scarceFloor,Math.min(1,this.localCount(prey,prey.species,CFG.wildHunt.scarceRadius)/CFG.wildHunt.scarceCount));
    // Hunters crowding the same ground get in each other's way (predator interference), so a dense
    // predator population eats less per head before it can empty an area of prey.
    const crowd=special||!CFG.wildHunt.interference?1:1/(1+CFG.wildHunt.interference*Math.max(0,this.localCount(pred,pred.species,CFG.wildHunt.interferenceRadius)-1));
    const legs=special?1:(wildTraits(pred).chaseSpeed||1)/Math.max(.5,partEffectFactors(prey)?.landSpeed??1);
    const bodyRatio=special&&pred.massPolicy!==ANATOMICAL_MASS&&prey.massPolicy!==ANATOMICAL_MASS?ps.mass/qs.mass:preyBodyMass(pred)/Math.max(.001,preyBodyMass(prey));
    const chance=Math.min(.90,(.18+.18*(pred.genes.motion/prey.genes.motion)*legs+.10*bodyRatio)*vulnerability*torporPredationMultiplier(prey)*shelterProtection*huntScale*scarce*crowd+(chanceBonus+(partEffectFactors(pred)?.huntBonus||0))*shelterProtection);
    let hit=false,killed=false;
    if(this.rng.chance(chance)){
      if(prey.torpor)wakeTorpor(prey,{reason:'A predator attack broke torpor.'});
      const fx=adaptationEffects(prey);let damage=(special?Math.min(82,32*bodyRatio):(canHunt(pred)?Math.min(CFG.wildHunt.maxBite,55*bodyRatio):55*bodyRatio))*wildTraits(pred).damage;const rawDamage=damage;let mantleReduction=0,coordinatedReduction=0,shellReduction=0,organRepel=false;
      if((prey.player||!special&&PREDATION_PARITY.enabled)&&canHunt(pred)){damage*=fx.predatorDamage;mantleReduction=Math.max(0,rawDamage-damage)}{const pf=partEffectFactors(prey),torso=pf?.damageTaken??1;if(torso!==1){const before=damage;damage*=torso;mantleReduction+=before-damage}
        // Wave 1: a dome shell protects against hits from behind.
        if(pf&&pf.rearDamage!==1){const v=FACE_V[prey.dir&7],dx=pred.x-prey.x,dy=pred.y-prey.y,d=Math.hypot(dx,dy)||1;if((v[0]*dx+v[1]*dy)/(Math.hypot(v[0],v[1])*d)<-.3){const before=damage;damage*=pf.rearDamage;mantleReduction+=before-damage;shellReduction=before-damage}}}
      if(prey.familyRally?.coordinated&&canHunt(pred)){const beforeCoordinated=damage;damage*=.82;coordinatedReduction=Math.max(0,beforeCoordinated-damage)}
      const brace=(prey.player&&canHunt(pred))?this.playerCombat.braceResponse(prey,pred):null;let braceReduction=0;if(brace){const beforeBrace=damage;damage*=brace.damage;braceReduction=beforeBrace-damage}
      // A weak attempt on oversized prey can wound but never subdue, and yields no meal.
      if(weak)damage=Math.min(damage*WEAK_BITE_DAMAGE,Math.max(0,prey.health-1));
      prey.health-=damage;hit=true;if(HEALING_REVIEW.enabled&&!prey.player&&prey.health>0)this.injury.onDamage(prey,{damage,attacker:pred});if(!weak&&prey.health>0&&canHunt(pred)&&(PREDATION_PARITY.enabled||!pred.player&&!prey.player)){const meal=consumePreyBiomass(prey,preyBodyMass(prey)*CFG.wildHunt.biteMeal*Math.min(1,damage/100));pred.energy=Math.min(ps.maxEnergy,pred.energy+meal*34*eff)}if(prey.health>0)this.partAbilities.envenom(pred,prey);
      // Wave 2: a club tail or spine cluster can make a hunter recoil and break off.
      {const rp=partEffectFactors(prey)?.repel||0;if(rp>0&&prey.health>0&&canHunt(pred)&&this.rng.chance(rp)){organRepel=true;pred.playerAversion={targetId:prey.id,untilTick:this.tickCount+CFG.simHz*3,reason:'repelled'};pred.target=null;pred.avoidPrey={id:prey.id,untilTick:this.tickCount+CFG.dayTicks*CFG.wildHunt.avoidDays}}}
      // v1.61.0: a bite blunted by armour or a shell may make a hunter give up on that animal for a while.
      if(prey.health>0&&(PREDATION_PARITY.enabled||!prey.player&&!pred.player)&&canHunt(pred)&&mantleReduction>0&&this.rng.chance(Math.min(CFG.wildHunt.deterMax,mantleReduction/Math.max(1,rawDamage)*CFG.wildHunt.deterScale))){pred.target=null;pred.avoidPrey={id:prey.id,untilTick:this.tickCount+CFG.dayTicks*CFG.wildHunt.avoidDays}}
      // Bitter slime deters any hunter that bites it, wild or player-owned (parity); the player branch below keeps its own receipt.
      if(PREDATION_PARITY.enabled&&!prey.player&&fx.bitterSlime&&prey.health>0&&canHunt(pred)){pred.avoidPrey={id:prey.id,untilTick:this.tickCount+CFG.simHz*4};pred.target=null;prey.energy=Math.max(0,prey.energy-5)}
      if(prey.lineage&&canHunt(pred))this.cognition.noteDanger(prey,pred,{killed:prey.health<=0});
      if(prey.player){prey.hidden=false;this.lastPlayerDamage={tick:this.tickCount,amount:damage,rawAmount:rawDamage,mantleReduction,coordinatedReduction,braceReduction,brace:brace?.kind||null,attackerId:pred.id,species:pred.species};if(prey.health>0)this.injury.onDamage(prey,{damage,attacker:pred});if(prey.health>0&&canHunt(pred))this.playerCombat.onPlayerHit(prey,pred,{damage,rawDamage:damage+Math.max(0,braceReduction),brace});if(fx.bitterSlime&&prey.health>0){pred.playerAversion={targetId:prey.id,untilTick:this.tickCount+CFG.simHz*4};pred.target=null;prey.energy=Math.max(0,prey.energy-5)}}
      // Presentation evidence for player-involved hits: what the defending body actually did.
      if(prey.player||pred.player)this.lastDefenseReceipt={tick:this.tickCount,preyId:prey.id,attackerId:pred.id,hit:true,raw:rawDamage,damage,armor:Math.max(0,mantleReduction-shellReduction),shell:shellReduction,repelled:organRepel,killed:prey.health<=0};
      if(pred.player)this.notePlayerCombatImpact(prey,prey.health<=0?'kill':'hit',damage);
      if(prey.health<=0){
        killed=true;const meal=remainingPreyBiomass(prey);if(prey.massPolicy===ANATOMICAL_MASS){consumePreyBiomass(prey,meal);this.kill(prey,'predation')}else{this.kill(prey,'predation');consumePreyBiomass(prey,meal);const carcass=this.world.idx(prey.x,prey.y);this.world.carrion[carcass]=Math.max(0,this.world.carrion[carcass]-meal);}this.evolutionBudget?.noteHunt?.(pred,true);const foodScale=this.speciesLifestyle?.foodEnergyMultiplier?.(pred,{kind:prey.species,livePrey:true})||1;pred.energy=Math.min(ps.maxEnergy,pred.energy+meal*34*eff*foodScale);this.cognition.onHunt(pred,prey);if(canHunt(pred))this.stalkerTerritory.noteKill(pred);
      }
    }else{pred.energy-=.8;if(prey.player||pred.player)this.lastDefenseReceipt={tick:this.tickCount,preyId:prey.id,attackerId:pred.id,hit:false,raw:0,damage:0,armor:0,shell:0,repelled:false,killed:false};if(pred.player)this.notePlayerCombatImpact(prey,'miss',0)}
    // Prey risk (Phase 3K): prey with real attack anatomy that survives the contact may bite back.
    if(PREY_RISK.enabled&&!killed&&prey.alive&&prey.health>0&&!this.isManualPlayer(prey))biteBack(this,pred,prey);
    this.speciesLifestyle?.noteHunt?.(pred,{prey,killed});pred.target=null;return hit;
  }
  matePairAvailability(a,b,{ready=false}={}){
    const fail=reason=>({enabled:false,reason});
    if(!a?.alive||!b?.alive||a.id===b.id)return fail('The selected partner is no longer available.');
    const compatibility=reproductiveCompatibility(a,b);if(!compatibility.enabled)return fail(compatibility.reason);
    if(!trophicallyMateable(a,b))return fail('One of these creatures would hunt the other.');
    if(a.sex===b.sex)return fail('Compatible reproductive roles are required.');
    if(this.closeKin(a,b))return fail('Close relatives cannot pair.');
    const s=SPECIES[a.species],partnerSpec=SPECIES[b.species];if(!s||!partnerSpec||a.age<s.maturity||b.age<partnerSpec.maturity)return fail('Both creatures must reach adulthood.');
    if(a.reproCooldown>0||b.reproCooldown>0)return fail('One creature is recovering from reproduction.');
    const female=a.sex==='F'?a:b;if(female.pregnant)return fail('The partner is already carrying offspring.');
    if(ready){if(!(a.health>=55&&b.health>=55))return fail('Both creatures need healthier bodies before courtship.');if(!(a.energy/s.maxEnergy>=(partEffectFactors(a)?.courtship??.62)&&b.energy/partnerSpec.maxEnergy>=(partEffectFactors(b)?.courtship??.62)))return fail('Both creatures need more food before courtship.');}
    return{enabled:true,reason:'',compatibility};
  }
  canMatePair(a,b,options={}){return this.matePairAvailability(a,b,options).enabled}

  autonomousMateTarget(a,{far=false}={}){
    if(!a?.alive)return null;
    const support=new WeakMap(),supported=b=>{if(!support.has(b))support.set(b,this.carrying.breedingState(b).allowed);return support.get(b)};
    const baseMate=b=>b.alive&&SPECIES[b.species]&&trophicallyMateable(a,b)&&reproductiveCompatibility(a,b).enabled&&b.sex!==a.sex&&b.age>SPECIES[b.species].maturity&&
      b.reproCooldown<=0&&(!engineeringCourtshipSpecies(a)||!b.pregnant)&&supported(b);
    const unrelated=b=>baseMate(b)&&this.recovery.kinship(a,b)==='none';
    const nearRadius=this.recovery.mateRadius(a.species)*a.genes.senses;
    const farRadius=this.recovery.mateRadius(a.species,{far:true})*a.genes.senses;
    // One bounded physical search per permitted radius. Attraction varies with
    // each chooser's inherited genotype; no universal appearance hierarchy,
    // fixed mating outcomes or second fertility controller is introduced.
    const choose=(filter,radius)=>{
      const options=[],r2=radius*radius;
      this.forEachNearby(a,radius,b=>{
        if(b===a)return;const dx=a.x-b.x,dy=a.y-b.y;
        if(dx*dx+dy*dy>=r2||!this.canReach(a,b.x,b.y)||!filter(b))return;
        options.push(b);
      });
      // Same-taxon search TENDENCY (docs/HERITABLE_MATE_CHOICE.md), weighed with inherited
      // preference; a clearly preferred compatible hybrid can still rank first.
      const tree=this.evolutionTree,affinity=tree?.sameTaxon?b=>tree.sameTaxon(a,b)?SAME_TAXON_AFFINITY:0:null;
      options.sort((b,c)=>compareMateOptions(a,b,c,this.seed,radius,{affinity}));
      return options[0]||null;
    };
    let mate=choose(unrelated,nearRadius);
    if(!mate&&far)mate=choose(unrelated,farRadius);
    if(!mate&&this.recovery.mayRelaxSibling(a)){
      const sibling=b=>baseMate(b)&&this.recovery.kinship(a,b)==='sibling';
      mate=choose(sibling,farRadius);
    }
    return localReceptivePartner(this,a,mate);
  }
  conceptionAvailability(a,b){return conceptionAvailability(this,a,b)}
  endBlockedCourtship(a,b,status){for(const [animal,partner] of [[a,b],[b,a]]){if(!animal?.alive)continue;const involved=animal===a||animal.courtshipPerformance?.partnerId===partner?.id||animal.completedCourtship?.partnerId===partner?.id||animal.intent==='mate'&&animal.target?.id===partner?.id;if(!involved)continue;animal.lastCourtshipFailure={tick:this.tickCount,day:this.day,partnerId:partner?.id,reason:status.reason,reasonCode:status.reasonCode,stage:status.stage??'conception'};if(animal===a||animal.courtshipPerformance?.partnerId===partner?.id)animal.courtshipPerformance=null;if(animal===a||animal.completedCourtship?.partnerId===partner?.id)animal.completedCourtship=null;if(animal.intent==='mate'&&animal.target?.id===partner?.id){animal.target=null;animal.intent='idle';}}this.reproduction.endSelectedEncounter(a,b);return false}
  tryMate(a,b){const availability=this.conceptionAvailability(a,b);if(!availability.enabled)return this.endBlockedCourtship(a,b,availability);const choice=performedMateChoice(this,a,b)||reciprocalMateChoice(a,b,this.seed);if(!choice.accepted){learnCourtshipOutcome(this,a,b,false);const decliner=choice.reason==='first-declines'?a:choice.reason==='second-declines'?b:null,declined=decliner===a?choice.a:decliner===b?choice.b:null,count=(a.lastCourtshipRefusal?.otherId===b.id?(a.lastCourtshipRefusal.count||1):0)+1;const refusal={tick:this.tickCount,reason:choice.reason,day:this.day,declinerId:decliner?.id??null,taste:declined?.dominant?{axis:declined.dominant,direction:declined.direction}:null,count};a.lastCourtshipRefusal={...refusal,otherId:b.id};b.lastCourtshipRefusal={...refusal,otherId:a.id};a.target=null;b.target=null;this.reproduction.endSelectedEncounter(a,b);return false}const female=a.sex==='F'?a:b,male=a.sex==='M'?a:b,s=SPECIES[female.species],compatibility=reproductiveCompatibility(a,b);
      const conceived=compatibility.conceptionChance===1||this.rng.chance(compatibility.conceptionChance);
      const attempt={tick:this.tickCount,day:this.day,parentIds:[a.id,b.id],accepted:true,conceived,compatibility:structuredClone(compatibility)};a.lastReproductiveAttempt=b.lastReproductiveAttempt=attempt;
      if(!conceived){learnCourtshipOutcome(this,a,b,true);a.reproCooldown=b.reproCooldown=8;a.lastCourtshipFailure={tick:this.tickCount,partnerId:b.id,reason:'Both accepted; no pregnancy formed. Recover before trying again.'};b.lastCourtshipFailure={tick:this.tickCount,partnerId:a.id,reason:a.lastCourtshipFailure.reason};a.courtshipPerformance=b.courtshipPerformance=null;a.target=b.target=null;a.intent=b.intent='idle';this.reproduction.endSelectedEncounter(a,b);return false}
      female.pregnant={fatherId:male.id,paternalInheritance:paternalInheritance(male),maternalInheritance:paternalInheritance(female),days:s.gestation,totalDays:s.gestation,startedDay:this.day,startedYear:this.year,mode:conceptionMode(female,this.world),dualAtConception:reproductiveMode(female)==='dual',compatibilityAtConception:structuredClone(compatibility)};Object.assign(female.pregnant,conceptionFunding(this.rng,female,male,s,female.pregnant.mode,{dual:female.pregnant.dualAtConception}));female.reproCooldown=s.gestation+8;male.reproCooldown=8;female.lastMate=male.id;male.lastMate=female.id;female.reproDrive=0;male.reproDrive=0;a.target=b.target=null;this.reproduction.onMated(a,b);this.cognition.onMate(a,b);this.disease.onMate(a,b);this.regionalEcology.noteMating(female,male);rememberBreedingSite(this,female,male);learnCourtshipOutcome(this,a,b,true);return true}
  phaseMetabolism(){for(const a of this.animals){if(!a.alive)continue;const s=SPECIES[a.species],fx=adaptationEffects(a),basal=basalResourceCosts(a);const hold=checkCanopyHold(a,this.world);if(hold)a.lastFlightIncident={...hold,tick:this.tickCount};const fall=advanceFlight(a,this.world,CFG.lifeStride/CFG.simHz,{rain:this.climate.rain,swimmer:canSwim(a),moving:a.movedTick===this.tickCount});if(fall)a.lastFlightIncident={...fall,tick:this.tickCount};const cell=this.world.idx(a.x,a.y),temp=this.world.temperature[cell],comfort=.55*a.genes.climate,thermalKind=temp>comfort?'heat':'cold';maintainTorpor(this,a,temp);const sleep=torporMetabolism(a);const heat=thermoregulation(a,temp),maternalWarmth=temp<comfort?neonatalWarmthFactor(a,this.tickCount,CFG.lifeStride):1;const thermal=Math.abs(temp-comfort)*.12*sleep.coldExposure*(a.lineage?this.shelter.thermalMultiplier(a):1)*(this.protoSpeciation?.thermalMultiplier?.(a,thermalKind)||1)*thermalCoverFactor(a,temp,comfort,{wet:this.climate.rain>.65&&this.world.moisture[cell]>.6})*(temp<comfort?heat.coldFactor*neonatalColdExposure(a,temp):1)*maternalWarmth;a.energy-=heat.extraEnergy*sleep.heat;const activePressure=!PHYSIOLOGY_PARITY.enabled&&a.player&&!this.isOpeningProtected(a);const energyScale=(activePressure?(CFG.playerChallenge?.energyScale??1):1)*metabolismEffect(this,a,fx),waterScale=(activePressure?(CFG.playerChallenge?.waterScale??1):1)*waterUseEffect(this,a,fx);a.energy-=basal.energy*sleep.energy*(1+thermal)/a.genes.metabolism*energyScale;a.hydration-=basal.water*sleep.water*(1+this.climate.temp*.3)*waterScale*aridityWaterFactor(a,this.world.moisture[cell]);if(reproductiveMode(a)==='dual'){a.energy-=DUAL_ENERGY_UPKEEP;a.hydration-=DUAL_WATER_UPKEEP;}if(a.energy<=0){a.health-=1.1}else if(a.health<100){healingStep(this,a,fx,a.injuryCare?.active&&this.injury.enabled(a)?this.injury.mode(a).mode:(still(this,a)?'rest':'active'))}if(a.bodyPlan&&!a.player&&!a.airborne){const inWater=!!this.world.water[this.world.idx(a.x,a.y)],gills=hasGills(a);if(inWater){const food=waterFoodRate(a);if(food){const meal=harvestFreshwater(this,a,Math.min(s.maxEnergy-a.energy,basal.energy*food));if(meal)a.energy+=meal.energyGain}if(gills)a.hydration=Math.min(s.maxHydration,a.hydration+AQUATIC.waterRefill*Math.max(0,1-salinityAt(this.world,this.world.idx(a.x,a.y))*20))}else if(gills)a.hydration-=basal.water*(AQUATIC.dryRate-1)*waterScale}
      if(a.hydration<=0)a.health-=1.55;if(a.reproCooldown>0){a.reproCooldown-=CFG.lifeStride/CFG.dayTicks;if(LIFE_HISTORY.conditionRecovery&&a.lastBirthDay!=null&&this.day-a.lastBirthDay>=s.gestation&&a.energy/s.maxEnergy>=breedingEnergyGate(a.species))a.reproCooldown=0}}this.exposure.phasePlayer();this.familyWeather.phase();this.illness.phase();this.familyIllness.phase();this.injury.phase();this.disease.phaseEffects();this.family.phaseCare();this.shelter.phaseSupport()}
  phaseLifecycle({once=false}={}){if(once&&!beginPageFaunaTick(this))return;if(this.tickCount%CFG.dayTicks===0)this.advanceEggs();const work=visitLivingFaunaByPage(this,a=>{const s=SPECIES[a.species];if(a.health<=0){this.kill(a,a.energy<=0?'starvation':a.hydration<=0?'dehydration':a.infected?'disease':'health');return}if(a.age>s.lifespan&&this.rng.chance((a.age-s.lifespan)/(s.lifespan*700)+.00015))this.kill(a,'age');if(a.pregnant&&this.tickCount%CFG.dayTicks===0){a.pregnant.days--;if(a.pregnant.days<=0)this.giveBirth(a)}});this.animals=this.animals.filter(a=>a.alive||a.player);if(once)completePageFaunaTick(this,work)}
  // The live-birth and hatching paths converge on this SINGLE newborn authority.
  // The stored parental snapshots protect inheritance if either parent dies or changes form.
  spawnFundedOffspring(mother,father,parents,{count,x,y,energyBudget,hydrationBudget,layingId=null}={}){
    const s=SPECIES[mother.species],children=[];
    // Computational capacity must not select which funded offspring exist.
    const slots=count;
    for(let i=0;i<slots;i++){
      const child=this.spawnAnimal(mother.species,x+this.rng.range(-.5,.5),y+this.rng.range(-.5,.5),parents);
      child.energy=Math.min(s.maxEnergy*.72*bodyMassFraction(child),slots?energyBudget/slots:0);
      child.hydration=Math.min(s.maxHydration*.82*bodyMassFraction(child),slots?hydrationBudget/slots:0);
      if(layingId!==null)child.hatchedFromEggId=layingId;
      // Milk membership is established by real live birth and actual birth-parent anatomy.
      // A cloned egg snapshot, adoptive caregiver or species tag cannot grant it.
      if(layingId===null&&canLactate(mother))child.lactationParentId=mother.id;
      if(this.massRules!==ANATOMICAL_MASS)inheritBody(this,child,parents[0],parents[1]);
      this.evolutionEditor?.onBirth?.(child,mother);
      if(child.bodyVariation){child.bodyVariation.guidedOverride=child.bodyVariation.finalBody!==child.bodyPlan?.id;child.bodyVariation.finalBody=child.bodyPlan?.id||null;child.bodyVariation.expression=[...(child.adaptations||[])];}
      const parentalTraits=new Set(parents.flatMap(p=>p?.adaptations||[]));
      child.bornWith=(child.adaptations||[]).filter(id=>!parentalTraits.has(id));
      if(child.bornWith.length)child.birthVariationSource=mother?.lineageTarget?.plan?'guided-design':'inherited-variation';
      for(const id of child.bornWith)this.cognition?.record?.(child,'born-adaptation',`Born with ${ADAPTATIONS[id]?.name||id}`,{adaptation:id,source:child.birthVariationSource});
      this.lineage.registerBirth(child,[mother,father],parents);
      this.family.registerBirth(child,mother,father);
      this.evolutionBudget?.noteBirth?.(child);
      this.cognition.onBirth(child,mother,father);this.disease.onBirth(child,mother,father);
      this.stats.births++;this.regionalEcology.noteBirth(child);children.push(child);
    }
    return children;
  }
  giveBirth(mother){
    if(!mother?.alive||!mother.pregnant)return[];
    const pregnancy=mother.pregnant,s=SPECIES[mother.species];
    const father=this.animals.find(x=>x.id===pregnancy.fatherId&&x.alive)||pregnancy.paternalInheritance;
    if(!father){mother.pregnant=null;return[]}
    const inheritedMother=pregnancy.maternalInheritance||mother,inheritedFather=pregnancy.paternalInheritance||father;
    const parents=[inheritedMother,inheritedFather],count=pregnancy.plannedLitterSize??this.rng.int(...s.litter);
    const funding=birthFunding(mother,s,pregnancy);
    if(pregnancy.mode==='egg'){
      // Eggs are tangible, finite entities. Funding moves into eggs at laying,
      // not duplicated at hatch. The parent need not stay alive for incubation.
      const available=count;
      const nest=available>0&&mother.energy>=funding.payment+3.4?constructNest(this,mother):null;
      // If a tree can no longer fund a proper canopy clutch, lay on soil, never
      // spawn unsupported floating eggs or a free tree nest.
      if(mother.perched&&!nest)descend(mother,this.world);
      // Egg hydration is a bounded parental investment, not the entire adult water reserve.
      const eggWaterBudget=Math.min(funding.hydrationBudget,mother.hydration*.30);
      const total=Math.max(0,available);const laid=[];
      for(let i=0;i<total;i++){
        const egg={id:this.nextEggId++,species:mother.species,motherId:mother.id,fatherId:father.id,
          x:mother.x+this.rng.range(-.35,.35),y:mother.y+this.rng.range(-.35,.35),
          incubationDays:INCUBATION_DAYS,condition:1,nestId:nest?.id??null,energy:funding.budget/Math.max(1,count),
          hydration:eggWaterBudget/Math.max(1,count),
          maternalInheritance:structuredClone(inheritedMother),paternalInheritance:structuredClone(inheritedFather),
          lineageTarget:mother.lineageTarget?.plan?structuredClone(mother.lineageTarget.plan):null};
        this.eggs.push(egg);laid.push(egg);
      }
      mother.energy-=funding.payment;
      mother.hydration=Math.max(0,mother.hydration-laid.reduce((sum,e)=>sum+e.hydration,0));
      mother.reproCooldown=s.postpartum??24;mother.lastBirthDay=this.day;mother.pregnant=null;
      this.evolutionEditor?.onLitterDone?.(mother);
      this.family.pushEvent({type:'eggs-laid',animalId:mother.id,count:laid.length});
      return laid;
    }
    const children=this.spawnFundedOffspring(mother,father,parents,{count,x:mother.x,y:mother.y,
      energyBudget:funding.budget,hydrationBudget:funding.hydrationBudget});
    mother.energy-=funding.payment;
    mother.hydration=Math.max(0,mother.hydration-children.reduce((sum,c)=>sum+c.hydration,0));
    mother.reproCooldown=s.postpartum??24;mother.lastBirthDay=this.day;mother.pregnant=null;
    this.evolutionEditor?.onLitterDone?.(mother);
    return children;
  }
  advanceEggs(){
    if(!this.eggs?.length)return;
    const remaining=[];
    for(const egg of this.eggs){
      // Eggs cannot move or drink. Exposure over real days matters.
      const quality=nestIncubationQuality(nestForEgg(this,egg),eggSiteQuality(this.world,egg.x,egg.y));
      egg.condition-=quality>=.75?0:(1-quality)*.18+.015;
      if(egg.condition<=0){this.family.pushEvent({type:'egg-loss',animalId:egg.motherId,eggId:egg.id});continue}
      egg.incubationDays--;
      if(egg.incubationDays>0){remaining.push(egg);continue}
      const liveMother=this.animals.find(a=>a.id===egg.motherId&&a.alive);
      const liveFather=this.animals.find(a=>a.id===egg.fatherId&&a.alive);
      const mother=liveMother||egg.maternalInheritance,father=liveFather||egg.paternalInheritance;
      if(!mother||!father)continue;
      // Only the inheritance snapshots govern genotype; the living parents, when
      // present, supply care and event identity but not post-conception body edits.
      const birthMother={...egg.maternalInheritance,lineageTarget:egg.lineageTarget?{plan:egg.lineageTarget}:null};
      const [child]=this.spawnFundedOffspring(birthMother,father,[egg.maternalInheritance,egg.paternalInheritance],
        {count:1,x:egg.x,y:egg.y,energyBudget:egg.energy,hydrationBudget:egg.hydration,layingId:egg.id});
      if(child){child.caregiverId=liveMother?.id??liveFather?.id??null;
        this.family.pushEvent({type:'egg-hatched',animalId:child.id,motherId:egg.motherId,eggId:egg.id});}
      else remaining.push(egg); // Retain funding if a future newborn authority cannot complete delivery.
    }
    this.eggs=remaining;
    advanceNests(this);
  }

  kill(a,cause){if(!a.alive)return;this.migration?.states?.delete?.(a.id);this.regionalEcology.noteDeath(a,cause);this.discovery?.onDeath?.(a);a.alive=false;a.health=0;const wasPlayer=a.player,s=SPECIES[a.species],i=this.world.idx(a.x,a.y);if(a.carryingFood){returnCarriedMaterial(this,a,a.carryingFood);a.carryingFood=null}this.world.carrion[i]+=remainingPreyBiomass(a);this.world.organicResources.totals.carcassImported+=remainingPreyBiomass(a);this.history.noteDeath(a);this.dispersal.onDeath(a);this.disease.onDeath(a);this.stats.deaths++;this.stats.byCause[cause]=(this.stats.byCause[cause]||0)+1;this.cognition.onDeath(a,cause);const wasActiveLineage=a.id===this.lineage?.activeId;this.lineage.registerDeath(a,cause);if(wasActiveLineage)this.lineage.handleActiveDeath(a);else if(wasPlayer)this.restoreFamilyControlAfterDeath(a)}
  advanceDay(){this.habits?.advanceDay?.();this.evolutionBudget?.advanceDay?.();this.tendency?.advanceDay?.();this.populationEcology?.advanceDay?.();this.populationMemory?.advanceDay?.();this.speciesLifestyle?.advanceDay?.();this.speciesCoexistence?.advanceDay?.();this.speciation?.advanceDay?.();this.shelter.advanceDay();this.day++;for(const a of this.animals)if(a.alive)advanceAgeDay(a,this.stats);if((this.day-1)%CFG.seasonDays===0){this.seasonIndex=(this.seasonIndex+1)%4;if(this.seasonIndex===0)this.year++}}

  bestPrey(a,radius,{allowNonHunter=false}={}){
    const s=SPECIES[a.species];if(!s||(!canHunt(a)&&!allowNonHunter))return null;const candidates=[],localCounts={};const r2=radius*radius;
    const swims=canSwim(a),avoid=a.avoidPrey?.untilTick>this.tickCount?a.avoidPrey.id:null;this.forEachNearby(a,radius,b=>{if(b===a||!b.alive||b.id===avoid||(!swims&&!this.world.sameLand(a.x,a.y,b.x,b.y))||this.isOpeningProtected(b)||!preyPreference(a,b)>0)return;const dx=b.x-a.x,dy=b.y-a.y,d2=dx*dx+dy*dy;if(d2>r2||this.preyHiddenFrom(b,a,Math.sqrt(d2)))return;candidates.push({b,d2});localCounts[b.species]=(localCounts[b.species]||0)+1});
    if(!candidates.length)return null;const global=this._decisionPopulation||this.population();const edible=[...new Set(candidates.map(({b})=>b.species))];const maxGlobal=Math.max(1,...edible.map(k=>global[k]||0));const maxLocal=Math.max(1,...Object.values(localCounts));const nonRefuge=RARITY_REVIEW.enabled?candidates:candidates.filter(({b})=>!this.recovery.preyIsRefuged(a,b.species,global,localCounts));if(!nonRefuge.length)return null;const abundant=nonRefuge.filter(({b})=>(localCounts[b.species]||0)>=maxLocal*.55);const pool=abundant.length?abundant:nonRefuge;let best=null,bestScore=-Infinity;
    for(const {b,d2} of pool){const prey=SPECIES[b.species],eff=preyPreference(a,b),relativeGlobal=(global[b.species]||1)/maxGlobal,gfreq=Math.pow(relativeGlobal,1.55),lfreq=Math.pow((localCounts[b.species]||1)/maxLocal,.72);const frequency=RARITY_REVIEW.enabled?lfreq:.78*lfreq+.22*gfreq;const rarityRefuge=RARITY_REVIEW.enabled?1:relativeGlobal<.18?.28:relativeGlobal<.32?.58:1;const value=remainingPreyBiomass(b)*eff*(.08+1.18*frequency)*rarityRefuge;const distance=Math.sqrt(d2);const score=value*preyAppraisal(a,b)*(PREY_RISK.enabled?riskFactor(a,b):1)-distance*.045+(b.energy/prey.maxEnergy<.35?.08:0)+(canHunt(a)&&b.health<CFG.wildHunt.woundedHealth?CFG.wildHunt.woundedBonus:0);if(score>bestScore){bestScore=score;best=b}}
    return best
  }
  localPreyCount(a,radius){let n=0;const r2=radius*radius,swims=canSwim(a);this.forEachNearby(a,radius,b=>{if(b===a||!b.alive||(!swims&&!this.world.sameLand(a.x,a.y,b.x,b.y))||!preyPreference(a,b)>0)return;const dx=b.x-a.x,dy=b.y-a.y;if(dx*dx+dy*dy<=r2)n++});return n}
  bestFood(a){const s=SPECIES[a.species],riskBias=(x,y)=>this.stalkerTerritory?.forageAdjustment?.(a,x,y)||0,rangeScale=forageRangeEffect(this,a);let best=null,bestScore=0;for(const [kind,eff] of Object.entries(groundDiet(a))){if(!PLANTS[kind]||eff<=0)continue;const lifestyleFood=this.speciesLifestyle?.foodEnergyMultiplier?.(a,{kind})||1,p=this.findBestCell(a,(x,y)=>(this.dispersal.seedReserve[kind]?this.dispersal.cropYield(a,kind,this.world.idx(x,y)):this.world.plants[kind][this.world.idx(x,y)]*eff)*lifestyleFood+riskBias(x,y),9*a.genes.senses*rangeScale);if(p&&p.score>bestScore){bestScore=p.score;best={...p,kind}}}if(plantPreference(a,'carrion')>0){const carrionScale=this.speciesLifestyle?.foodEnergyMultiplier?.(a,{kind:'carrion'})||1,here=this.world.idx(a.x,a.y);if(this.world.carrion[here]>.08)return{x:a.x,y:a.y,kind:'carrion'};const cp=this.findBestCell(a,(x,y)=>this.world.carrion[this.world.idx(x,y)]*plantPreference(a,'carrion')*carrionScale+riskBias(x,y),12*a.genes.senses*rangeScale);if(cp&&cp.score>bestScore&&cp.score>.03)best={...cp,kind:'carrion'}}const aquatic=bestFreshwaterFood(this,a,9*a.genes.senses*rangeScale);if(aquatic&&(!best||aquatic.score>bestScore))best=aquatic;return best}
  findBestCell(a,scoreFn,radius){let best=null,bestScore=-Infinity;for(let k=0;k<36;k++){const x=Math.max(1,Math.min(CFG.worldSize-2,a.x+this.rng.range(-radius,radius))),y=Math.max(1,Math.min(CFG.worldSize-2,a.y+this.rng.range(-radius,radius)));if(!this.canReach(a,x,y))continue;const sc=scoreFn(x,y)-Math.hypot(x-a.x,y-a.y)*.015;if(sc>bestScore){bestScore=sc;best={x,y,score:sc}}}return best}

  playerFoodTarget(a=this.player()){return this.foraging.selected(a)}
  cyclePlayerFood(step=1){return this.foraging.cycle(this.player(),step)}
  facePlayerTarget(id){
    const a=this.player(),target=this.animals.find(b=>b.id===id&&b.alive);
    if(!a||!target||this.paused||this.playerCombat.attackActive(a)||a.bracing)return false;
    a.dir=dirIndex(target.x-a.x,target.y-a.y);return true;
  }
  resourceAvailability(type){
    const a=this.player();if(!a?.alive)return{enabled:false,reason:'No active creature.'};
    if(this.paused)return{enabled:false,reason:'Resume the world first.'};
    if(a.airborne||a.perched)return{enabled:false,reason:'Use a surface position for ground food and water; canopy feeding has its own action.'};
    if(type==='drink'){if(!this.world.isDrinkable(a.x,a.y))return{enabled:false,reason:'Move beside drinkable water.'};const spec=SPECIES[a.species],limit=Math.min((this.discovery?.poolBonus?.(a)||0)+(partEffectFactors(a)?.mouthFood?.drinkEnergy||0),spec.maxEnergy-a.energy);if(a.hydration>=spec.maxHydration-.05&&!freshwaterHarvestCandidate(this,a,limit))return{enabled:false,reason:'Already hydrated; no usable filter food here.'};return{enabled:true,reason:''}}
    if(type==='eat')return this.foraging.availability(a);
    return{enabled:false,reason:'Unknown resource action.'};
  }
  resourceAction(type,target=null){
    const base=this.resourceAvailability(type),a=this.player();
    const fail=reason=>({state:'unavailable',enabled:false,reason});
    if(!a?.alive||this.paused)return fail(base.reason);
    if(!target)return{...base,state:base.enabled?'available':'unavailable'};
    const w=this.world;
    if(type==='drink'){
      if(target.kind!=='water'||!w.water[target.i])return fail('That water source is no longer present.');
      const spec=SPECIES[a.species],limit=Math.min((this.discovery?.poolBonus?.(a)||0)+(partEffectFactors(a)?.mouthFood?.drinkEnergy||0),spec.maxEnergy-a.energy);if(a.hydration>=spec.maxHydration-.05&&!freshwaterHarvestCandidate(this,a,limit,target))return fail('Already hydrated; no usable filter food at this source.');
      const adjacent=Math.abs(Math.floor(a.x)-Math.floor(target.x))<=1&&Math.abs(Math.floor(a.y)-Math.floor(target.y))<=1;
      return{state:adjacent&&base.enabled?'available':'approachable',enabled:adjacent&&base.enabled,reason:adjacent&&base.enabled?'Drink from this shore.':'Move beside this water source first.'};
    }
    if(type==='eat'){
      if(base.reason==='Already full and hydrated.')return fail(base.reason);
      const stock=target.food==='carrion'?w.carrion:FRESHWATER_FOOD[target.food]?freshwaterField(w,target.food):w.plants[target.food];if(!['plant','corpse','food'].includes(target.kind)||!(stock?.[target.i]>.01))return fail('That food patch is depleted.');
      // Query the same foraging validator at the target; never invent a UI diet.
      const probe=Object.assign(Object.create(Object.getPrototypeOf(a)),a,{x:target.x,y:target.y});
      if(target.tissue==='crop'&&this.dispersal.seedReserve[target.food]&&!this.dispersal.previewMeal(a,target.food,target.i,.1,'crop'))return fail('A compatible fruit or pod feeding mouth is required.');if(target.tissue==='kernel'&&!this.dispersal.previewMeal(a,target.food,target.i,.1,'kernel'))return fail('A seed-cracking mouth is required, with edible kernels still present.');if(!this.foraging.options(probe,{index:target.i,kind:target.food,tissue:target.tissue??null}).length){const preference=FRESHWATER_FOOD[target.food]?freshwaterPreference(a,target.food):plantPreference(a,target.food);return fail(preference<=0?'A compatible feeding mouth is required.':(stock?.[target.i]||0)<=.06?'That food patch is depleted.':'No reachable feeding position for this resource.');}
      const atSource=this.foraging.availability(probe,{i:target.i,kind:target.food,tissue:target.tissue??null});if(!atSource.enabled)return fail(atSource.reason);const local=this.foraging.availability(a,{i:target.i,kind:target.food,tissue:target.tissue??null}),meal=local.meal;
      return{state:meal?'available':'approachable',enabled:!!meal,meal,reason:meal?(local.reason||'Eat from this patch.'):'Move beside this food patch first. '+(atSource.reason||'')};
    }
    return fail('Unknown resource action.');
  }
  playerDrink(target=null){
    const status=this.resourceAction('drink',target);if(!status.enabled)return{ok:false,type:'drink',message:status.reason};
    const a=this.player(),s=SPECIES[a.species];

    if(a.hidden)a.hidden=false;
    const before=a.hydration;a.hydration=Math.min(s.maxHydration,a.hydration+Math.max(18,s.maxHydration*.22));this.cognition.onDrink(a);const pool=this.discovery?.poolBonus?.(a)||0,filter=partEffectFactors(a)?.mouthFood?.drinkEnergy||0;const meal=harvestFreshwater(this,a,Math.min(pool+filter,s.maxEnergy-a.energy),target);if(meal){a.energy+=meal.energyGain;this.cognition.onFeed(a,meal.kind);this.foraging.rememberPatch(a,meal.kind,a.x,a.y,{meal:true});this.family.notePracticeInteraction(a,'food',{x:(a.lastFreshwaterMeal.i%this.world.n)+.5,y:Math.floor(a.lastFreshwaterMeal.i/this.world.n)+.5,kind:meal.kind,amount:meal.amount});this.lastPlayerAction={type:'drink',actorId:a.id,kind:meal.kind,energyGain:meal.energyGain,tick:this.tickCount};return{ok:true,type:'drink',message:`Drank and ate ${meal.kind} · +${meal.energyGain.toFixed(1)} energy.`}}
    this.lastPlayerAction={type:'drink',actorId:a.id,tick:this.tickCount};return{ok:a.hydration>before,type:'drink',message:'Drank water.'};
  }
  playerEat(target=null){
    const status=this.resourceAvailability('eat');if(!status.enabled)return{ok:false,type:'eat',message:status.reason};
    const a=this.player(),best=target?this.foraging.options(a,{index:target.i,kind:target.kind,tissue:target.tissue??null})[0]:this.playerFoodTarget(a);if(!best)return{ok:false,type:'eat',message:target?'The selected food is unreachable or incompatible with this body.':'No edible food nearby.'};
    const result=this.foraging.consume(a,best);if(!result.ok&&this.nearestPlayerCombatTarget(a,1.9))return{ok:false,type:'none',message:'E does not attack. Space attacks, hold J to brace.'};if(result.ok)this.lastPlayerAction={type:'eat',actorId:a.id,kind:best.kind,tissue:result.tissue,processingCost:result.processingCost,producerGenomeId:result.plantReceipt?.genome?.id,energyGain:result.energyGain,waterGain:result.waterGain,tick:this.tickCount};return this.specialization.notePlayerAction(a,result,{hidden:a.hidden})
  }
  interactionOptions(target=null){return contextualInteractions(this,target)}
  playerInteract(target=null,actionId=null){return executeInteraction(this,target,actionId)}
  interactionHint(){
    const a=this.player();if(!a)return'';const s=SPECIES[a.species];
    const stalker=this.nearestPlayerCombatTarget(a,CFG.attack.stalkerReach);if(stalker){const phase=stalker.playerHunt?.phase,label=SPECIES[stalker.species].label;if(phase==='recover')return`Space · Opening bite ${label} · or retreat`;if(phase==='windup')return`Space · Counterbite ${label} · J brace · or sidestep`;return`Space · Bite ${label} · J brace`}
    if(this.world.isDrinkable(a.x,a.y))return a.hidden?'E · Drink water · reveals cover':'E · Drink water';
    const pounce=this.playerCombat?.pounceHint?.(a);if(pounce)return pounce;
    let prey=null,preyD=1.45;for(const other of this.animals){if(!other.alive||other.id===a.id||!(preyPreference(a,other)>0))continue;const d=Math.hypot(other.x-a.x,other.y-a.y);if(d<preyD){preyD=d;prey=other}}
    if(prey)return a.hidden?`Space · Hunt ${SPECIES[prey.species].label} · reveals cover`:`Space · Hunt ${SPECIES[prey.species].label}`;
    const care=this.family.careTarget(a,{radius:1.7,urgentOnly:true});if(care){const dev=this.family.development(care.child);return`E · Tend G${care.child.generation} ${dev.stage} · ${care.status.label}`}
    const sickYoung=this.familyIllness?.sickCareTarget?.(a,{radius:1.8});if(sickYoung){const dev=this.family.development(sickYoung.child),immune=this.disease.isImmune(a)?' · recovered immunity':'';return`E · Check sick G${sickYoung.child.generation} ${dev.stage}${immune}`}
    const aftercare=this.familyWeather?.aftercareTarget?.(a,{radius:1.8});if(aftercare){const dev=this.family.development(aftercare.child);return`E · Check G${aftercare.child.generation} ${dev.stage} after storm`}
    const eggNest=chooseCareNest(this,a);if(eggNest&&Math.hypot(a.x-eggNest.x,a.y-eggNest.y)<=1.4)return'E · Tend your egg clutch';
    const denSite=this.stalkerTerritory?.nearbySite?.(a,{radius:1.9,includeAbandoned:true});if(denSite&&!denSite.known)return denSite.den?.changed?'E · Reread changed Stalker signs':`E · Read ${denSite.abandoned?'old ':''}Stalker signs`;
    const D=this.discovery;if(D){if(D.siteAt(a,'relic',1.4))return'E · Take the relic';if(D.siteAt(a,'nest-ruin',1.4))return'E · Gather nest material';if(D.logAt(a))return a.hidden?'V · Leave the log':'V · Hide in the hollow log';if(D.siteAt(a,'root-mound',1.6))return this.partAbilities.canDigAt(a)?'E · Dig the root mound':'Root mound · needs digging forelimbs';if(D.siteAt(a,'lookout',1.3))return'Lookout · nearby places and Stalkers revealed';if(D.refugeFor(a))return D.armored(a)?'Thorn brake · Stalkers will not follow':'Thorn brake · safe from Stalkers, but it scratches'}
    const food=this.playerFoodTarget(a);
    if(a.hidden)return food?`E · Eat ${PLANTS[food.kind]?.label||food.kind}${food.count>1?' · Q switch':''} · V emerge`:'V · Leave cover';
    if(a.carryingFood)return`Z · ${this.shelter.nearest(a,{radius:2.0,familyOnly:true})?'Store':'Drop'} ${a.carryingFood.label}`;
    return food?`E · Eat ${this.foraging.hint(food)}`:(this.partAbilities.digAvailability(a).enabled?'E · Dig for roots':'');
  }
  nearestPlayerCombatTarget(a=this.player(),radius=1.6){if(!a||a.airborne||a.perched)return null;let best=null,bestD=radius;for(const other of this.animals){if(!other.alive||other.id===a.id||other.airborne||other.perched||!canHunt(other))continue;const d=Math.hypot(other.x-a.x,other.y-a.y);if(d<bestD){best=other;bestD=d}}return best}
  notePlayerCombatImpact(target,kind='hit',damage=0,detail=null){this.lastPlayerCombatImpact={tick:this.tickCount,targetId:target?.id??null,kind,damage:Number(damage)||0,...(detail||{})};return this.lastPlayerCombatImpact}
  playerStrike(target,{damageScale=1}={}){const a=this.player();if(a?.hidden)a.hidden=false;if(!a||!target?.alive||!canHunt(target)||a.airborne||a.perched||target.airborne||target.perched)return{ok:false,type:'fight',message:'Surface strikes cannot reach an airborne or perched creature.'};const finish=result=>this.specialization.notePlayerAction(a,result,{target}),fx=adaptationEffects(a),distance=Math.hypot(target.x-a.x,target.y-a.y);if(distance>1.65)return{ok:false,type:'fight',message:'Too far away.'};if(a.energy<4)return{ok:false,type:'fight',message:'Too exhausted to strike.'};const endedSafety=this.isOpeningProtected(a);if(endedSafety)this.endOpeningGrace('attacked stalker');const warning=endedSafety?'You picked a fight. Safe start ended. ':'';const crushing=hasAdaptation(a,'crushing-jaw'),window=this.predator.strikeWindow(target),chance=Math.min(.96,.62+(a.genes.senses-1)*.35+(a.genes.motion-1)*.20+(crushing?.06:0)+window.accuracyBonus);a.energy=Math.max(0,a.energy-(hasAdaptation(a,'barbed-limbs')?2.8:2.2)*fx.strikeEnergy*window.energyMultiplier);if(!this.rng.chance(chance)){target.target=a;this.notePlayerCombatImpact(target,'miss',0);const result=finish({ok:false,type:'fight',engaged:true,combatWindow:window.phase,message:`${warning}${window.label?`${window.label} missed.`:`Missed ${SPECIES[target.species].label}.`}`});this.predator.onPlayerStrike(target,result);return result}const tt=wildTraits(target),damage=(5.5+Math.max(0,(a.genes.body-1)*18))*fx.playerStrike*window.damageMultiplier*damageScale*(tt?.toughness??1)*(target.elder?.8:1);target.health-=damage;if(tt?.spines)a.health=Math.max(1,a.health-tt.spines*.8);const envenomed=target.health>0&&this.partAbilities.envenom(a,target);let repelled=false;const repelChance=hasAdaptation(a,'barbed-limbs')?.58:crushing?.42:0;if(repelChance&&this.rng.chance(repelChance)){target.playerAversion={targetId:a.id,untilTick:this.tickCount+CFG.simHz*(crushing?1.35:2.5)};target.target=null;repelled=true}else target.target=a;if(target.health<=0){this.notePlayerCombatImpact(target,'kill',damage);const meal=plantPreference(a,'carrion')>0?consumePreyBiomass(target,remainingPreyBiomass(target)*12/34):0;this.kill(target,'predation');a.energy=Math.min(SPECIES[a.species].maxEnergy,a.energy+meal*34);const result=finish({ok:true,type:'fight',damage,killed:true,engaged:true,combatWindow:window.phase,message:`${warning}Killed ${SPECIES[target.species].label}.`});this.predator.onPlayerStrike(target,result);return result}this.notePlayerCombatImpact(target,repelled?'stagger':'hit',damage,{spines:(tt?.spines||0)>0,armored:(tt?.toughness??1)<.97});const attackMode=physicalAttackProfile(a).mode,verb=attackMode==='strike'?'Struck':attackMode==='peck'?'Pecked':'Bit';const base=repelled?(crushing?`Crushing bite · ${SPECIES[target.species].label} staggered.`:`Struck ${SPECIES[target.species].label} · it recoiled.`):window.label?`${window.label} · ${Math.round(damage)} damage.`:`${verb} ${SPECIES[target.species].label} · ${Math.round(damage)} damage.`;const result=finish({ok:true,type:'fight',damage,repelled,engaged:true,combatWindow:window.phase,opening:!!window.label,message:`${warning}${base}${envenomed?' · Venom took hold, it breaks off.':''}`});this.predator.onPlayerStrike(target,result);return result}
  playerAlarm(){
    const a=this.player(),alarm=hasAdaptation(a,'alarm-pulse'),mobbing=hasAdaptation(a,'mobbing-instinct'),coordinated=hasAdaptation(a,'coordinated-defense');
    if(!a||(!alarm&&!mobbing))return{ok:false,type:'alarm',message:'You have no family signal.'};
    if((a.alarmCooldownUntil||0)>this.tickCount)return{ok:false,type:'alarm',message:'Your family signal is recovering.'};
    const threat=this.findNearest(a,b=>b.alive&&canHunt(b),9);if(!threat)return{ok:false,type:'alarm',message:'No Stalker close enough to warn about.'};
    let warned=0,rallied=0;for(const other of this.animals){if(!other.alive||other.id===a.id||!other.lineage||other.species!=='genvo')continue;if(Math.hypot(other.x-a.x,other.y-a.y)>11)continue;
      if(alarm){other.playerThreat={x:threat.x,y:threat.y,untilTick:this.tickCount+CFG.simHz*5};warned++}
      if(mobbing&&other.age>=SPECIES.genvo.maturity){other.familyRally={targetId:threat.id,untilTick:this.tickCount+CFG.simHz*(coordinated?8:5),coordinated};rallied++}
    }
    a.energy=Math.max(0,a.energy-(mobbing?7:5));a.alarmCooldownUntil=this.tickCount+CFG.simHz*(mobbing?(coordinated?9:10):8);this.lastPlayerAction={type:mobbing?'rally':'alarm',tick:this.tickCount};
    const result={ok:true,type:mobbing?'rally':'alarm',warned,rallied,message:mobbing?(coordinated?`Coordinated defense · ${rallied} adult${rallied===1?'':'s'} brace with you.`:`Family rally · ${rallied} adult${rallied===1?'':'s'} answer.`):`Alarm pulse · ${warned} family member${warned===1?'':'s'} warned.`};return this.specialization.notePlayerAction(a,result,{threat})
  }
  coverAt(animal){
    if(!animal)return 0;const w=this.world,i=w.idx(animal.x,animal.y);return Math.min(1,(w.plants.bramble?.[i]||0)*.82+(w.plants.marshroot?.[i]||0)*.72+(w.plants.sunmoss?.[i]||0)*.42+(w.plants.thistlepod?.[i]||0)*.45);
  }
  // Any prey, wild or player (Phase 3I refuges): camouflage, a physical refuge the hunter cannot enter, or cover.
  preyHiddenFrom(prey,pred,distance=Math.hypot((prey?.x||0)-(pred?.x||0),(prey?.y||0)-(pred?.y||0)),{tracking=false}={}){return this.camouflageConceals(prey,pred,distance)||(REFUGE_PARITY.enabled&&(!!refugeAgainst(this,prey,pred)||coverHides(this,prey,pred,distance,{tracking})))}
  camouflageConceals(prey,pred,distance=Math.hypot((prey?.x||0)-(pred?.x||0),(prey?.y||0)-(pred?.y||0))){
    if(prey?.hidden&&this.discovery?.logAt?.(prey))return true;
    const adaptive=hasAdaptation(prey,'adaptive-chromatophores'),cover=this.coverAt(prey),reveal=(adaptive?1.45:2.15)*(pred?.genes?.senses||1);
    return !!(prey?.hidden&&hasAdaptation(prey,'camouflage-mantle')&&cover>=(this.partAbilities?.coverNeeded(prey,adaptive?.30:.36)??(adaptive?.30:.36))&&distance>reveal);
  }
  playerHide(){
    const a=this.player();if(a&&!a.hidden&&this.discovery?.logAt?.(a)){a.hidden=true;a.intent='hide';a.target=null;this.lastPlayerAction={type:'hide',tick:this.tickCount};return{ok:true,type:'hide',hidden:true,message:'Hidden inside the hollow log.'}}
    if(!a||!hasAdaptation(a,'camouflage-mantle'))return{ok:false,type:'hide',message:'You have no camouflage adaptation.'};
    if(a.hidden){a.hidden=false;this.lastPlayerAction={type:'emerge',tick:this.tickCount};return{ok:true,type:'hide',hidden:false,message:'You leave cover.'}}
    if(this.world.water[this.world.idx(a.x,a.y)])return{ok:false,type:'hide',message:'You cannot hide in open water.'};
    const cover=this.coverAt(a);if(cover<this.partAbilities.coverNeeded(a,.36))return{ok:false,type:'hide',message:'Find denser plants to hide in.'};
    a.hidden=true;a.intent='hide';a.target=null;this.lastPlayerAction={type:'hide',tick:this.tickCount};this.habits.noteHide(a);return{ok:true,type:'hide',hidden:true,message:'Hidden in cover · stay still.'};
  }
  playerCarry(){
    const a=this.player();if(!a||!hasAdaptation(a,'grasping-limbs'))return{ok:false,type:'carry',message:'You have no grasping limbs.'};
    const w=this.world,s=SPECIES[a.species];
    if(a.carryingFood){const load=a.carryingFood,shelter=this.shelter.nearest(a,{radius:2.0,familyOnly:true});
      if(shelter){const stored=Math.min(shelter.capacity-shelter.foodStore,load.stored*(this.divergence?.cacheMultiplier?.(a)||1));if(stored<=0)return{ok:false,type:'carry',message:'The shelter is full.'};shelter.foodStore+=stored;shelter.lastUsedTick=this.tickCount;const fraction=Math.min(1,stored/Math.max(.001,load.stored*(this.divergence?.cacheMultiplier?.(a)||1)));load.biomass*=1-fraction;load.stored*=1-fraction;load.reserve=(load.reserve||0)*(1-fraction);if(load.tissues){load.tissues.seed*=1-fraction;load.tissues.coat*=1-fraction;}if(load.biomass<1e-8)a.carryingFood=null;this.lastPlayerAction={type:'store-carry',tick:this.tickCount};const result={ok:true,type:'carry',stored,message:`Stored carried ${load.label}.`};return this.specialization.notePlayerAction(a,result,{load,shelter})}
      returnCarriedMaterial(this,a,load);a.carryingFood=null;this.lastPlayerAction={type:'drop',tick:this.tickCount};return{ok:true,type:'carry',message:`Dropped ${load.label}.`}
    }
    let best=null;for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){const x=a.x+ox,y=a.y+oy,i=w.idx(x,y);for(const [kind,eff] of Object.entries(groundDiet(a))){if(eff<=0)continue;const arr=kind==='carrion'?w.carrion:w.plants[kind];if(!arr)continue;const amount=arr[i]||0,minimum=kind==='carrion'?0:.07;if(amount<=minimum+.06)continue;const nutrition=kind==='carrion'?34:(PLANTS[kind]?.nutrition||0)*3.6,score=amount*eff*nutrition;if(!best||score>best.score)best={kind,x,y,i,arr,amount,minimum,nutrition,eff,score}}}
    if(!best)return{ok:false,type:'carry',message:'No food nearby to carry.'};const fx=adaptationEffects(a),biomass=Math.min(.18*fx.carryCapacity,Math.max(0,best.arr[best.i]-best.minimum));const material=extractCarriedMaterial(this,best.kind,best.i,biomass);if(best.kind!=='carrion')this.history.notePlantConsumption(best.kind,best.x,best.y,biomass);const label=PLANTS[best.kind]?.label||(best.kind==='carrion'?'carrion':best.kind);a.carryingFood={...material,kind:best.kind,label,biomass,stored:biomass*best.nutrition*best.eff*(fx.provisioning?.78:.72),origin:{x:best.x,y:best.y}};a.energy=Math.max(0,a.energy-(fx.provisioning?.65:.45));this.lastPlayerAction={type:'carry',kind:best.kind,tick:this.tickCount};return{ok:true,type:'carry',message:fx.provisioning?`Provisioning ${label} · double load ready for shelter.`:`Carrying ${label} · bring it to shelter.`};
  }
  familyMobStrike(a,target){
    if(!a?.alive||!target?.alive||!canHunt(target)||(a.mobStrikeCooldownUntil||0)>this.tickCount)return false;
    this.habits.noteStand(a);
    const coordinated=!!a.familyRally?.coordinated;a.mobStrikeCooldownUntil=this.tickCount+CFG.simHz*(coordinated?.62:.8);a.energy=Math.max(0,a.energy-(coordinated?1.0:1.2));const damage=(coordinated?4.1:2.4)+Math.max(0,(a.genes.body-1)*(coordinated?10:8));target.health-=damage;
    const active=this.player(),nearby=this.animals.filter(o=>o.alive&&o.species==='genvo'&&o.lineage&&o.age>=SPECIES.genvo.maturity&&o.familyRally?.targetId===target.id&&Math.hypot(o.x-target.x,o.y-target.y)<3.2).length;
    if(target.health<=0){this.kill(target,'predation');return true}
    if(active&&nearby>=2&&this.rng.chance(Math.min(coordinated?.9:.78,(coordinated?.44:.28)+nearby*(coordinated?.16:.13)))){target.playerAversion={targetId:active.id,untilTick:this.tickCount+CFG.simHz*(coordinated?4:3)};target.target=null}else target.target=a;
    return true;
  }
  closeKin(a,b){
    if(!a||!b)return false;
    return this.recovery.kinship(a,b)!=='none';
  }
  localCount(a,species,radius,{sharedHabitat=false,excludeId=null}={}){let n=0,r2=radius*radius;this.forEachNearby(a,radius,b=>{if(!b.alive||b.species!==species||b.id===excludeId)return;const dx=b.x-a.x,dy=b.y-a.y;if(dx*dx+dy*dy<=r2&&(!sharedHabitat||this.canReach(a,b.x,b.y)||this.canReach(b,a.x,a.y)))n++});return n}
  findNearest(a,pred,radius){let best=null,d2=radius*radius;this.forEachNearby(a,radius,b=>{if(b===a||!this.canReach(a,b.x,b.y)||!pred(b))return;const dx=b.x-a.x,dy=b.y-a.y,dd=dx*dx+dy*dy;if(dd<d2){d2=dd;best=b}});return best}
  population(){const o={};for(const k of Object.keys(SPECIES))o[k]=0;for(const a of this.animals)if(a.alive)o[a.species]=(o[a.species]||0)+1;return o}
  // v1.55.0: the active creature is looked up very often (every frame, many systems); it is
  // remembered until the controlled id changes or that creature dies.
  player(){const c=this._player;if(c&&c.id===this.playerId&&c.alive)return c;
    // No living player (e.g. awaiting succession): remember the miss until the id, the actor list or its length changes.
    const miss=PLAYER_MISS.get(this.animals);if(!c&&miss&&miss.id===this.playerId&&miss.length===this.animals.length)return null;
    const p=this.animals.find(a=>a.id===this.playerId&&a.alive)||null;this._player=p;if(p)PLAYER_MISS.delete(this.animals);else PLAYER_MISS.set(this.animals,{id:this.playerId,length:this.animals.length});return p}
}
function grow(v,p,m,f,t,{seedLimited=false}={}){if(seedLimited&&v<=.0005)return 0;const moisture=Math.max(0,1-Math.abs(m-p.waterNeed)*1.7),temp=Math.max(0,1-Math.abs(t-(p.tempOptimum??.58))*(p.tempTolerance??1.4));return Math.max(0,Math.min(p.carry,v+p.growth*moisture*temp*f*(1-v/p.carry)-.004*v))}
function dirIndex(dx,dy){const a=Math.atan2(dy,dx),oct=Math.round(a/(Math.PI/4));return(oct+2+8)%8}
function inputVector(i){let dx=(i.right?1:0)-(i.left?1:0),dy=(i.down?1:0)-(i.up?1:0);if(dx&&dy){dx*=.707106;dy*=.707106}return[dx,dy]}
