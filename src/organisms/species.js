import {formReading,protoReading} from '../lineage/readings.js';
// Legacy founding-population metadata for birth and save compatibility.
// Runtime feeding and predation MUST use functional-diet.js, not diets/hunter.
export const SPECIES={
  mosskip:{label:'Hopper',guild:'grazer',social:{mode:'herd',label:'Herd',joinRadius:8,cohesionRadius:4.8,separation:.58,alarmRadius:7,maxGroup:8},sprite:'mosskip',color:'#d8d493',speed:2.35,mass:.8,predationVulnerability:1,diseaseSusceptibility:1.08,maxEnergy:88,maxHydration:92,maturity:20,lifespan:170,litter:[1,2],gestation:12,reproCost:32,postpartum:120,density:{radius:7,softCap:7},recovery:{driveBoost:1.45,rarePreyRatio:.70,criticalRatio:.26,criticalMateRadius:88,sparseMateRadius:72},reproduction:{energy:.72,driveScale:1.0,minForage:5.4,optimalForage:9.4},baseMetabolism:.045,waterUse:.045,habitat:{sunmoss:1,thistlepod:.35,moisture:.1},diets:{sunmoss:1,bramble:.8,marshroot:.45,thistlepod:.72,rotcap:.08,carrion:0}},
  rootling:{label:'Digger',guild:'burrower',social:{mode:'colony',label:'Colony',joinRadius:7,cohesionRadius:4.3,separation:.54,alarmRadius:5.8,maxGroup:6},sprite:'rootling',color:'#c18b62',speed:1.7,mass:1.3,predationVulnerability:.58,diseaseSusceptibility:.88,maxEnergy:112,maxHydration:106,maturity:28,lifespan:250,litter:[1,2],gestation:16,reproCost:34,postpartum:80,density:{radius:7,softCap:6},recovery:{driveBoost:1.65,rarePreyRatio:.72,criticalRatio:.45,criticalMateRadius:88},reproduction:{energy:.72,driveScale:.95,minForage:5.8,optimalForage:10.6},baseMetabolism:.052,waterUse:.042,habitat:{marshroot:1,rotcap:.35,moisture:.6},diets:{sunmoss:.78,bramble:.9,marshroot:1,thistlepod:.6,rotcap:.7,carrion:0}},
  needlejaw:{label:'Stalker',guild:'predator',social:{mode:'solitary',label:'Solitary'},sprite:'needlejaw',hunter:true,color:'#a94b53',speed:2.8,mass:2.1,predationVulnerability:1,diseaseSusceptibility:.78,maxEnergy:142,maxHydration:118,maturity:38,lifespan:380,litter:[1,1],gestation:22,reproCost:40,postpartum:96,density:{radius:14,softCap:3},reproduction:{energy:.72,driveScale:.46,preyRadius:14,minPrey:8},baseMetabolism:.045,waterUse:.044,spawnNear:['mosskip','rootling'],habitat:{sunmoss:.25,bramble:.2,moisture:.08},diets:{carrion:.8,mosskip:1,rootling:.72,genvo:.45,rillsifter:.65,mirelick:.7,podshell:.42,bankjaw:.12}},
  // Niche expansion: a water-dwelling filter feeder and a carrion/fungus specialist.
  // Their body parts, not these labels, grant swimming, sieving, and locomotion.
  rillsifter:{label:'Rillsifter',guild:'filterer',social:{mode:'shoal',label:'Shoal',joinRadius:5,cohesionRadius:3.6,separation:.48,alarmRadius:5,maxGroup:9},sprite:'rillsifter',color:'#50b6ba',speed:1.9,mass:.68,predationVulnerability:1.1,diseaseSusceptibility:1.1,maxEnergy:86,maxHydration:94,maturity:23,lifespan:188,litter:[1,2],gestation:13,reproCost:30,postpartum:96,density:{radius:6,softCap:8},reproduction:{energy:.70,driveScale:1,minForage:4,optimalForage:8},baseMetabolism:.039,waterUse:.042,spawnInWater:true,habitat:{moisture:1,marshroot:.35},diets:{sunmoss:.1,bramble:0,marshroot:.65,rotcap:.08,carrion:.12}},
  mirelick:{label:'Mirelick',guild:'scavenger',social:{mode:'loose',label:'Scavengers',joinRadius:6,cohesionRadius:4,separation:.6,alarmRadius:5,maxGroup:5},sprite:'mirelick',color:'#b88d90',speed:1.82,mass:.91,predationVulnerability:.9,diseaseSusceptibility:.75,maxEnergy:97,maxHydration:97,maturity:25,lifespan:210,litter:[1,2],gestation:15,reproCost:32,postpartum:94,density:{radius:8,softCap:5},reproduction:{energy:.74,driveScale:.88,minForage:5,optimalForage:9},baseMetabolism:.043,waterUse:.045,habitat:{moisture:.8,marshroot:.6,rotcap:.45},diets:{sunmoss:.15,bramble:.22,marshroot:.42,rotcap:1,carrion:1,thistlepod:.2}},
  // Seed pods are finite food. Podshells carry viable seed cargo to new ground via the
  // existing dispersal controller; their spiny carapaces can deter a predator.
  podshell:{label:'Podshell',guild:'seed_carrier',social:{mode:'herd',label:'Foraging groups',joinRadius:7,cohesionRadius:4.4,separation:.58,alarmRadius:7,maxGroup:7},sprite:'podshell',color:'#bba46f',speed:1.63,mass:1.42,predationVulnerability:.78,diseaseSusceptibility:.92,maxEnergy:114,maxHydration:98,maturity:29,lifespan:258,litter:[1,2],gestation:17,reproCost:35,postpartum:95,density:{radius:9,softCap:6},reproduction:{energy:.75,driveScale:.88,minForage:5,optimalForage:9},baseMetabolism:.05,waterUse:.047,habitat:{thistlepod:1.5,sunmoss:.35,moisture:-.16},diets:{sunmoss:.32,bramble:.58,marshroot:.12,thistlepod:1,rotcap:.02,carrion:0}},
  // A predator that crosses the river margin with webbed anatomy, feeding on actual
  // nearby animal biomass or aquatic fry rather than a fabricated food reserve.
  bankjaw:{label:'Bankjaw',guild:'shore_hunter',social:{mode:'solitary',label:'Lone hunter'},sprite:'bankjaw',hunter:true,color:'#6e8e6c',speed:2.23,mass:1.36,predationVulnerability:.95,diseaseSusceptibility:1.05,maxEnergy:119,maxHydration:116,maturity:34,lifespan:310,litter:[1,1],gestation:20,reproCost:39,postpartum:108,density:{radius:13,softCap:3},reproduction:{energy:.74,driveScale:.55,preyRadius:12,minPrey:6},baseMetabolism:.047,waterUse:.047,spawnNear:['mirelick'],habitat:{marshroot:.9,moisture:.85},diets:{carrion:.55,rillsifter:1,mirelick:.85,mosskip:.52,rootling:.15,podshell:.38,genvo:.13}},
  genvo:{label:'GenVo',guild:'omnivore',social:{mode:'band',label:'Band',joinRadius:8,cohesionRadius:4.8,separation:.62,alarmRadius:6.6,maxGroup:8,kinBias:1.7},sprite:'genvo',hunter:false,color:'#7f9fd8',speed:2.15,mass:1.45,predationVulnerability:.82,diseaseSusceptibility:1,maxEnergy:124,maxHydration:114,maturity:30,lifespan:290,litter:[1,2],brood:{min:2,max:4,perOffspringCost:17},gestation:16,reproCost:34,postpartum:80,density:{radius:8,softCap:6},recovery:{driveBoost:1.6,rarePreyRatio:.70,criticalRatio:.45,criticalMateRadius:88},reproduction:{energy:.72,driveScale:.90,minForage:5.5,optimalForage:9.6},familyCare:{lineageOnly:true,dependentUntil:.62,followDistance:2.1,nurseRadius:1.6,nurseRate:.065,nurseEfficiency:1.4,nurseTarget:.8,parentReserve:.50,guardThreatRadius:5},baseMetabolism:.052,waterUse:.044,habitat:{bramble:1,thistlepod:.35,moisture:.25},diets:{sunmoss:.55,bramble:1,marshroot:.82,thistlepod:.82,rotcap:.62,carrion:.72,mosskip:.45,rootling:.34,rillsifter:.38,mirelick:.35,podshell:.28,bankjaw:.1}}
};

// Eight top-level gene families remain a player-facing organizing language, not a total gene count.
export const GENETIC_DOMAIN=Object.freeze({min:.72,max:1.28});
export const GENE_KEYS=['body','motion','metabolism','digestion','senses','climate','immunity','temperament'];
export function makeGenes(rng,parentA=null,parentB=null){const g={};for(const k of GENE_KEYS){if(parentA&&parentB){const inherited=rng.chance(.5)?parentA[k]:parentB[k];g[k]=Math.max(GENETIC_DOMAIN.min,Math.min(GENETIC_DOMAIN.max,inherited+rng.range(-.025,.025)))}else g[k]=rng.range(.9,1.1)}return g}

export function phenotypeFor(animal){
  const g=animal?.genes||{},adapt=new Set(animal?.adaptations||[]),form=formReading(animal),formStrength=Math.max(0,Math.min(1,Number(form?.strength)||0)),proto=protoReading(animal),branch=animal?.speciesBranch||null,lifestyle=animal?.ecoLifestyle||null,protoStrength=Math.max(0,Math.min(1,Number(proto?.strength)||0));
  const formVisual=form?.kind==='forager'?{body:1-.065*formStrength,limb:1+.15*formStrength,sensory:1+.15*formStrength,width:1-.10*formStrength,height:1-.02*formStrength}:form?.kind==='colony'?{body:1+.065*formStrength,limb:1-.14*formStrength,sensory:1-.04*formStrength,width:1+.15*formStrength,height:1+.04*formStrength}:{body:1,limb:1,sensory:1,width:1,height:1};
  const protoVisual={body:1,limb:1,sensory:1,width:1,height:1,eye:1,feeler:1};
  const lifestyleVisual={body:1,limb:1,sensory:1,width:1,height:1,eye:1,feeler:1};
  if(proto?.id==='frugal-frame'){protoVisual.body-=.035*protoStrength;protoVisual.height-=.035*protoStrength}
  else if(proto?.id==='range-sense'){protoVisual.limb+=.045*protoStrength;protoVisual.sensory+=.085*protoStrength;protoVisual.eye+=.04*protoStrength;protoVisual.feeler+=.08*protoStrength}
  else if(proto?.id==='watch-crest'){protoVisual.sensory+=.065*protoStrength;protoVisual.eye+=.05*protoStrength;protoVisual.feeler+=.12*protoStrength}
  else if(proto?.id==='close-brood'){protoVisual.body+=.035*protoStrength;protoVisual.width+=.07*protoStrength;protoVisual.limb-=.035*protoStrength}
  else if(proto?.id==='dryland-skin'){protoVisual.body+=.018*protoStrength;protoVisual.width+=.035*protoStrength;protoVisual.height-=.025*protoStrength}
  else if(proto?.id==='splayfoot'){protoVisual.limb+=.05*protoStrength;protoVisual.width+=.018*protoStrength}
  else if(proto?.id==='heat-shed-mantle'){protoVisual.body-=.028*protoStrength;protoVisual.width-=.045*protoStrength;protoVisual.height-=.025*protoStrength}
  else if(proto?.id==='cold-mantle'){protoVisual.body+=.045*protoStrength;protoVisual.width+=.04*protoStrength;protoVisual.height+=.035*protoStrength}
  if(lifestyle?.id==='aquatic'){lifestyleVisual.limb+=.055;lifestyleVisual.width-=.025;lifestyleVisual.feeler+=.035}
  else if(lifestyle?.id==='nomadic'){lifestyleVisual.body-=.025;lifestyleVisual.limb+=.075;lifestyleVisual.sensory+=.055;lifestyleVisual.feeler+=.055}
  else if(lifestyle?.id==='guardian'){lifestyleVisual.body+=.05;lifestyleVisual.width+=.075;lifestyleVisual.sensory+=.035}
  else if(lifestyle?.id==='burrower'){lifestyleVisual.body+=.055;lifestyleVisual.width+=.08;lifestyleVisual.height-=.055;lifestyleVisual.limb-=.065}
  else if(lifestyle?.id==='hunter'){lifestyleVisual.body+=.018;lifestyleVisual.limb+=.045;lifestyleVisual.sensory+=.055;lifestyleVisual.width-=.035;lifestyleVisual.eye+=.045;lifestyleVisual.feeler+=.035}
  else if(lifestyle?.id==='grazer'){lifestyleVisual.body+=.045;lifestyleVisual.width+=.075;lifestyleVisual.height-=.025;lifestyleVisual.limb-=.018}
  // Presentation deliberately exaggerates inherited differences a little more than the underlying
  // survival coefficients. This makes relatives readable without changing simulation outcomes.
  const body=clamp(.74,1.36,(1+((g.body??1)-1)*2.6)*(adapt.has('hardened-mantle')?1.06:1)*(adapt.has('water-sacs')?1.04:1)*formVisual.body*protoVisual.body*lifestyleVisual.body);
  const limb=clamp(.72,1.46,(1+((g.motion??1)-1)*2.8)*(adapt.has('spring-tendons')?1.08:1)*formVisual.limb*protoVisual.limb*lifestyleVisual.limb);
  const sensory=clamp(.72,1.40,(1+((g.senses??1)-1)*2.9)*formVisual.sensory*protoVisual.sensory*lifestyleVisual.sensory);
  const hueShift=((g.climate??1)-1)*165+((g.temperament??1)-1)*36;
  const lightShift=((g.metabolism??1)-1)*48+((g.immunity??1)-1)*14;
  const digestion=g.digestion??1,immunity=g.immunity??1,temperament=g.temperament??1;
  return{
    bodyScale:body,
    limbScale:limb,
    sensoryScale:sensory,
    eyeScale:clamp(.82,1.34,(1+((g.senses??1)-1)*2.0)*protoVisual.eye*lifestyleVisual.eye),
    feelerScale:clamp(.80,1.46,(1+((g.senses??1)-1)*2.45)*protoVisual.feeler*lifestyleVisual.feeler),
    temperamentScale:clamp(.82,1.18,1+(temperament-1)*1.35),
    bodyWidthScale:formVisual.width*protoVisual.width*lifestyleVisual.width,
    bodyHeightScale:formVisual.height*protoVisual.height*lifestyleVisual.height,
    lineageForm:form?.kind||null,
    protoTrait:proto?.id||null,
    protoTraitStrength:protoStrength,
    protoMixedTrait:proto?.mixedFrom?.[0]?.id||null,
    protoGeneFlow:Math.max(0,Math.min(1,Number(proto?.geneFlow)||0)),
    speciesBranch:branch?.id||null,
    speciesLifestyle:lifestyle?.id||null,
    lineageFormStrength:formStrength,
    hueShift,
    lightShift,
    patternBands:Math.max(0,Math.min(3,Math.round(Math.abs(digestion-1)*18))),
    patternSpots:Math.max(0,Math.min(4,Math.round(Math.abs(immunity-1)*20))),
    patternPolarity:digestion>=1?1:-1,
    stripe:Math.abs(digestion-1)>=.035,
    spot:Math.abs(immunity-1)>=.045,
    compact:(g.body??1)<.955,
    energetic:(g.metabolism??1)>1.055,
    adaptations:{hardened:adapt.has('hardened-mantle'),barbed:adapt.has('barbed-limbs'),bitter:adapt.has('bitter-slime'),spring:adapt.has('spring-tendons'),waterSacs:adapt.has('water-sacs'),efficientGut:adapt.has('efficient-gut'),fastHealing:adapt.has('fast-healing'),alarmPulse:adapt.has('alarm-pulse'),camouflage:adapt.has('camouflage-mantle'),heavyJaw:adapt.has('heavy-jaw'),mobbing:adapt.has('mobbing-instinct'),grasping:adapt.has('grasping-limbs'),adaptiveChromatophores:adapt.has('adaptive-chromatophores'),crushingJaw:adapt.has('crushing-jaw'),coordinatedDefense:adapt.has('coordinated-defense'),provisioningPouches:adapt.has('provisioning-pouches'),webbedLimbs:adapt.has('webbed-limbs')}
  };
}

export function animalFoodKeys(species){return Object.keys(SPECIES[species]?.diets||{}).filter(k=>k in SPECIES)}
export function plantFoodKeys(species,plants){return Object.keys(SPECIES[species]?.diets||{}).filter(k=>k in plants)}
export function canPreyOn(predatorSpecies,preySpecies){return (SPECIES[predatorSpecies]?.diets?.[preySpecies]||0)>0}
function clamp(min,max,v){return Math.max(min,Math.min(max,v))}
