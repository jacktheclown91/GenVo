export const CFG={
  version:'1.65.0', worldSize:128, tileSize:16, simHz:8, controlHz:64, cameraFollowHz:42, dayTicks:48, legacyDayTicks:8, lifeStride:6, manualMoveCostScale:1/6, seasonDays:8, seasons:['SPRING','SUMMER','AUTUMN','WINTER'],
  maxAnimals:900, performanceTarget:560, nearAmbientDecisionStride:2, backgroundDecisionDistance:30, farDecisionDistance:52, backgroundDecisionStride:4, farDecisionStride:8, backgroundMovementStride:2, farMovementStride:4,
  initial:{mosskip:64,rootling:32,needlejaw:12,genvo:24,rillsifter:18,mirelick:20,podshell:18,bankjaw:8},
  playerChallenge:{energyScale:6,waterScale:8},
  // v1.28 decisions under pressure. Exertion is short-term breath, separate from food energy.
  exertion:{max:100,sprintDrain:22,braceDrain:9,attackCost:16,walkRecover:20,idleRecover:30,recoverDelay:.5,windedRecoverTo:35,braceStartMin:10,blockCostPerDamage:1.1},
  // v1.33.3 grazing scars: heavily grazed ground regrows more slowly until the wear fades.
  grazingScar:{start:.6,span:1,maxSlow:.4},
  pounce:{reach:[2.5,3.5],minRange:1.7,frontDot:.5,cost:32,windup:.3,leap:.22,recovery:.62,missRecovery:.95,landGap:.8,stalkerDamage:1.35,preyBonus:.25},
  attack:{windup:.22,slowWindup:.36,recovery:.36,windupMove:.55,recoverMove:.72,stalkerReach:1.7,preyReach:1.5,slowDamage:.75},
  brace:{move:.42,frontalDot:.5,sideDot:-.2,frontalDamage:.32,sideDamage:.9,rearDamage:1.15,frontalKnockback:.2,sideKnockback:.85,rearKnockback:1.1,knockback:1.05,stagger:.7,brokenLock:.9},
  // v1.31 founder-line heredity: blended genes with real sibling variation, partial carry of
  // single-parent adaptations, and new adaptations appearing in newborns from lived pressure.
  heredity:{segregation:.7,mutation:.045,largeMutationChance:.07,largeMutation:.1,singleParentCarry:.72,emergenceMinPressure:3,emergenceBase:.08,emergencePerPressure:.006,emergenceMax:.3,anatomyDriftPerPressure:.003,anatomyDriftMax:.1},
  // The handoff pick-one-of-three draft is retired. Offers already pending in a save stay choosable.
  evolution:{handoffDraft:false},
  // v1.61.0 arms race (creator direction 2026-10-10): a hunter's bite on a wild animal wounds rather than
  // always kills (so armour, shells and spines decide survival), hunt odds use leg speed, and hunters
  // prefer wounded prey.
  wildHunt:{maxBite:60,woundedHealth:45,woundedBonus:.1,biteMeal:.7,scarceRadius:12,scarceCount:6,scarceFloor:.15,deterScale:1.6,deterMax:.6,avoidDays:2,interference:.15,interferenceRadius:8},
  stalkerPursuit:{chaseSpeed:1,searchSpeed:.62,stamina:100,chaseDrain:10,closeRecover:4,chargeCost:16,woundCost:24,braceCost:32,woundsToBreak:2,sight:9,coverHide:.36,coverHideRange:3,stillCoverRange:1.6,lightCoverHide:.22,lightCoverRange:5.2,searchSeconds:2.4,windupCreep:.55,chargeTimeScale:1.35,chargeOvershoot:2.2,contactBonus:.34,engageRadius:14,outrunAversion:6,lostAversion:4,drivenOffAversion:5}, phaseNames:['Climate','Water & soil','Vegetation & decomposition','Perception','Decision','Movement & interaction','Metabolism & disease','Reproduction, death & statistics']
};

// Rule of 8 organizes systems; it does not cap content. Plant entries are registry-driven.
export const PLANTS={
  sunmoss:{label:'Moss',guild:'ground_producer',growth:.075,carry:1.0,nutrition:7,waterNeed:.32,render:'tuft',color:'#668447',init:'ground'},
  bramble:{label:'Berries',guild:'fruiting_shrub',growth:.032,carry:.82,nutrition:16,waterNeed:.42,render:'shrub',color:'#486b38',init:'shrub',dispersal:{seedLimited:true,animal:true,seedLoad:1.15,transitDays:[1,3],germination:.18,establish:.045,mature:.34,localRelease:.010,bankDecay:.982}},
  marshroot:{label:'Reeds',guild:'wetland_producer',growth:.042,carry:.9,nutrition:13,waterNeed:.64,render:'reed',color:'#75915b',init:'wetland',dispersal:{seedLimited:true,animal:false,germination:.16,establish:.040,mature:.30,localRelease:.018,bankDecay:.986}},
  rotcap:{label:'Mushrooms',guild:'decomposer',growth:.025,carry:.55,nutrition:10,waterNeed:.48,render:'fungus',color:'#c6b48a',init:'fungus'},
  // E2: Long-lived, seeded woody canopy. Real tissue, finite growth inputs and inherited seed cohorts.
  woodspire:{label:'Woodspire',guild:'woody_producer',growth:.012,carry:1.8,nutrition:5,waterNeed:.53,render:'tree',color:'#35654b',init:'woodland',dispersal:{seedLimited:true,animal:true,seedLoad:.52,transitDays:[2,5],germination:.075,establish:.023,mature:.85,localRelease:.007,bankDecay:.991}},
  // Ninth organism family: a drought-tolerant seed plant proving content is not hard-capped at eight.
  thistlepod:{label:'Seed Pods',guild:'seed_producer',growth:.026,carry:.58,nutrition:11,waterNeed:.25,render:'pod',color:'#9a9b54',init:'dry_seed',dispersal:{seedLimited:true,animal:true,seedLoad:.86,transitDays:[1,2],germination:.20,soilDisturbanceResponse:.25,establish:.038,mature:.24,localRelease:.024,bankDecay:.976}},
  // E7: complementary scarce-water food chains. Both require funded growth and real seed arrival.
  // The fleshy fruit of the bulb favors browsers; the coated sage heads favor seed-crackers.
  dunebulb:{label:'Dune Bulbs',guild:'fruiting_shrub',growth:.018,carry:.44,nutrition:12,waterNeed:.19,render:'bulb',color:'#8d9a70',init:'dry_bulb',dispersal:{seedLimited:true,animal:true,seedLoad:.42,transitDays:[2,4],germination:.12,establish:.026,mature:.23,localRelease:.008,bankDecay:.992}},
  dustsage:{label:'Dust Sage',guild:'seed_producer',growth:.022,carry:.64,nutrition:9,waterNeed:.30,render:'sage',color:'#87957d',init:'dry_shrub',dispersal:{seedLimited:true,animal:true,seedLoad:.64,transitDays:[1,3],germination:.16,soilDisturbanceResponse:.16,establish:.032,mature:.28,localRelease:.016,bankDecay:.979}},
  // E11 cold lineages occupy genuine tundra/alpine soil and compete for existing resources.
  frostlichen:{label:'Frost Lichen',guild:'ground_producer',tempOptimum:.16,tempTolerance:2.1,growth:.028,carry:.58,nutrition:8,waterNeed:.29,render:'lichen',color:'#a2b8a5',init:'cold_lichen',dispersal:{seedLimited:true,animal:false,germination:.13,establish:.035,mature:.18,localRelease:.019,bankDecay:.992}},
  snowberry:{label:'Snowberries',guild:'fruiting_shrub',growth:.017,carry:.49,nutrition:16,waterNeed:.41,render:'snowberry',color:'#657d75',init:'cold_berry',dispersal:{seedLimited:true,animal:true,seedLoad:.46,transitDays:[2,5],germination:.10,establish:.023,mature:.21,localRelease:.009,bankDecay:.991}}
};

export const ECO_GUILDS={
  ground_producer:'Ground producer',
  woody_producer:'Woody canopy producer',
  fruiting_shrub:'Fruiting shrub',
  wetland_producer:'Wetland producer',
  decomposer:'Decomposer',
  seed_producer:'Seed producer',
  grazer:'Grazer',
  burrower:'Burrower / browser',
  predator:'Predator / scavenger',
  omnivore:'Adaptable omnivore',
  filterer:'Aquatic filter feeder',
  scavenger:'Wetland scavenger',
  seed_carrier:'Armored seed disperser',
  shore_hunter:'Amphibious shoreline predator'
};
