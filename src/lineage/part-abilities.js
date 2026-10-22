import {diggingRule,DIGGING_RULES} from './digging-rules.js';
import {canHunt,plantPreference} from '../ecology/functional-diet.js';
import {disturbanceAt,recordSoilDig,pruneRecoveredSoil} from '../ecology/soil-disturbance.js';
import {isWildSpecies,wildStartPlan} from '../organisms/wild-bodies.js';
import {CFG} from '../sim/config.js';
import {SPECIES} from '../organisms/species.js';
import {partDef} from './part-registry.js';

// Evolution Expansion Phase D (GDD v1, sections 6.2, 6.5 and 8): what the six new parts do.
// Creator decision (2026-10-09): each part gets one ability and one cost, with no new keys.
//   Digging forelimb: E digs roots on open ground; hiding needs less plant cover; slower sprint.
//   Claw: attacks land sooner; hits a little weaker; carries less.
//   Venom gland: bites poison (slow and damage for a few seconds), 3 doses a day; extra food.
//   Wide-field eye: threats noticed farther away and from behind; extra food and water.
//   Reinforced torso: less damage taken from any attacker; slower sprint; extra food.
//   Paddle tail: faster, cheaper swimming for bodies that can already swim; slightly slower on land.
// Abilities come only from an explicit body plan (a designed lineage), never from drawing, and
// the same rules apply to the active creature, its family and wild creatures. A creature with no
// plan, or a plan without these parts, is unchanged. No RNG is consumed here.

export const PART_ABILITY={
  dig:{aiHunger:.45,rootEnergy:12,rootWater:2,regrowDays:6,cooldownTicks:CFG.simHz,coverHide:.24,sprint:.95},
  claw:{windup:.6,strike:.9,carry:.8,huntBonus:.06},
  venom:{doses:3,ticks:CFG.simHz*4,damagePerTick:.28,slow:.7,breakOff:3,metabolism:1.04},
  eye:{threatSense:1.4,markerRange:1.4,metabolism:1.03,waterUse:1.04},
  torso:{damageTaken:.85,sprint:.93,metabolism:1.08},
  paddle:{swimSpeed:1.25,swimEnergy:.85,land:.96}
};

// Gains and costs shown in the editor and help, in plain words.
export const PART_ABILITY_TEXT=Object.freeze({
  'digging-forelimb':{gain:'Digs roots with E on open ground · hides in thinner cover',cost:'Sprint is a little slower.'},
  'claw':{gain:'Attacks land sooner',cost:'Hits a little weaker and carries less.'},
  'venom-gland':{gain:'Bites poison: the target slows, weakens and breaks off · 3 doses a day',cost:'Needs a little more food.'},
  'wide-field-eye':{gain:'Spots threats farther away and from behind',cost:'Needs a little more food and water.'},
  'reinforced-torso':{gain:'Takes less damage',cost:'Slower sprint and more food.'},
  'paddle-tail':{gain:'Swims faster and cheaper, if the body can already swim',cost:'Slightly slower on land.'}
});

const EMPTY=Object.freeze({});
const counts=new WeakMap();
// Part counts of an animal's explicit body plan (cached per plan object).
export function planPartCounts(animal){
  const plan=animal?.bodyPlan;if(!plan||!Array.isArray(plan.nodes))return EMPTY;
  let c=counts.get(plan);if(!c){c={};for(const n of plan.nodes)c[n.partId]=(c[n.partId]||0)+1;counts.set(plan,c)}return c;
}
export function hasPart(animal,partId){return (planPartCounts(animal)[partId]||0)>0}

// Wave 1 (creator decision 2026-10-09): eight bodies, legs, mouths and eyes, each with one ability
// and one cost. Bodies differ in shape and in how many parts they carry; the number and kind of
// legs set land speed (more legs are faster, with diminishing returns, and cost upkeep).
export const WAVE1={
  bodies:{
    'sleek-torso':{sprint:1.08,metabolism:1.05},
    'light-torso':{sprint:1.04,metabolism:.9,damageTaken:1.15},
    'stout-torso':{land:.95,metabolism:.9},
    'barrel-torso':{sprint:.94,waterUse:.8},
    'dome-torso':{sprint:.9,metabolism:1.06,damageTaken:.9,rearDamage:.6},
    'long-torso':{carry:1.25,metabolism:1.06}
  },
  // The four-legged founder moves at the original speed; each extra leg is faster, with diminishing
  // returns, and costs a little food.
  legSpeed:{4:1,5:1.03,6:1.06,7:1.09,8:1.12,9:1.135,10:1.15,11:1.16,12:1.17},
  // Food upkeep scales with the whole body: the registry upkeep of every part above the founder's.
  upkeepPerPart:.12,founderUpkeep:1.36,quietSprint:.96,
  legType:{'runner-leg':{land:.025,brace:1.04},'sturdy-leg':{land:-.015,brace:.94},'webbed-leg':{land:-.005}},
  quietPadded:2,quietSight:.85,
  mouths:{
    'beak-mouth':{food:{thistlepod:1.35},plants:.95},
    'kernel-beak':{food:{thistlepod:1.6},plants:.78,metabolism:1.05},
    'nibbler-mouth':{plants:.9,metabolism:.95},
    'sucker-mouth':{food:{carrion:1.4},plants:.94},
    'gape-mouth':{prey:1.15,huntBonus:.08,metabolism:1.03},
    'filter-mouth':{drinkEnergy:6,drinkEnergyTick:.6,plants:.94},
    'reed-sieve-mouth':{plants:.82,metabolism:1.035},
    'tusk-jaw':{plants:.9,prey:1.15}
  },
  eyes:{
    'hunter-eye':{huntBonus:.05,threatSense:.92},
    'stalk-eye':{forage:1.2,metabolism:1.04},
    'compound-eye':{threatSense:1.15,wideField:true,metabolism:1.03},
    'tracker-eye':{forage:1.15,cue:1.5,metabolism:1.03},
    'display-eye':{courtship:.5,metabolism:1.04,threatSense:.92},
    'eyespot':{threatSense:.8,metabolism:.97},
    'telescopic-eye':{huntBonus:.06,threatSense:.9,metabolism:1.04},
    'raptor-eye':{huntBonus:.08,threatSense:.88,metabolism:1.06},
    'panoramic-eye':{threatSense:1.2,wideField:true,metabolism:1.05},
    'sentinel-eye':{threatSense:1.25,wideField:true,metabolism:1.08},
    // Relic eye (Ghost GenVo8): finds food and water farther away, and threats a little sooner.
    'glow-eye':{forage:1.3,cue:1.4,threatSense:1.1,metabolism:1.03}
  },
  eyeCount:{1:.85,2:1,3:1.04,4:1.08}
};
export const WAVE1_TEXT=Object.freeze({
  'sleek-torso':{gain:'Faster sprint',cost:'Gets hungry sooner. One flank slot each side.'},
  'small-torso':{gain:'The starting body: four leg slots, cheap to run',cost:'Few parts fit.'},
  'soft-torso':{gain:'Eight leg slots and two flank slots each side',cost:'More food than the small body.'},
  'light-torso':{gain:'Six leg slots, needs less food, sprints a little faster',cost:'Takes more damage. One flank slot.'},
  'stout-torso':{gain:'Lasts longer without food · three flank slots each side',cost:'Slower on land.'},
  'barrel-torso':{gain:'Holds water, drinks less often · ten leg slots, four eyes, two back slots',cost:'Slower sprint, heavy.'},
  'dome-torso':{gain:'Shell halves hits from behind, less damage overall · two back slots',cost:'Slow sprint, more food.'},
  'long-torso':{gain:'Twelve leg slots, four eyes, three flank and two back slots · carries more',cost:'More food.'},
  'spring-leg':{gain:'Two spring legs can launch a real jump arc in new worlds · Jump / Enter',cost:'Body load limits lift. Launch costs food and breath; hard terrain or water landings can injure.'},
  'runner-leg':{gain:'Faster on land',cost:'Weaker brace.'},
  'sturdy-leg':{gain:'Stronger brace against charges',cost:'A little slower.'},
  'webbed-leg':{gain:'Swims across rivers and open water (brings Water Sacs with it)',cost:'A little slower on land; swimming is slow and tiring.'},
  'padded-leg':{gain:'Quiet steps: sprinting is not heard and Stalkers see you later (two or more)',cost:'Slightly slower sprint.'},
  'beak-mouth':{gain:'Much better on seed pods',cost:'Slightly worse on other plants.'},
  'kernel-beak':{gain:'Cracks hard seed pods for food; crushed seeds cannot grow',cost:'Poor at soft plants; extra energy upkeep.'},
  'filter-mouth':{gain:'Feeds while drinking at the water\'s edge',cost:'Gets a little less from plants.'},
  'reed-sieve-mouth':{gain:'Sifts algae, aquatic larvae and detritus from water',cost:'Poorer land grazing; higher food upkeep.'},
  'nibbler-mouth':{gain:'Very cheap to run',cost:'Gets less from plants.'},
  'sucker-mouth':{gain:'Much better on carrion',cost:'Gets a little less from plants.'},
  'gape-mouth':{gain:'Hunts land more often, more food from prey',cost:'More food upkeep.'},
  'hunter-eye':{gain:'Hunts and pounces land more often',cost:'Narrower view: threats noticed a little later.'},
  'stalk-eye':{gain:'Finds food farther away, through plant cover',cost:'More food upkeep.'},
  'compound-eye':{gain:'Spots threats farther and from behind',cost:'More food upkeep.'},
  'telescopic-eye':{gain:'Sees about 24 tiles straight ahead; hunts land more often',cost:'Narrow forward view; heavier and costs more food.'},
  'raptor-eye':{gain:'Sees about 40 tiles ahead, across the whole screen in clear air',cost:'Very narrow view to the sides and none behind; heavy, costly upkeep.'},
  'panoramic-eye':{gain:'Sees almost all the way around (about 15 tiles)',cost:'Short reach; more food upkeep.'},
  'sentinel-eye':{gain:'Raised eyes see far all around (about 34 tiles) and over low ground',cost:'The heaviest eyes, with the highest food upkeep.'},
  'tracker-eye':{gain:'Food and water shown and found farther away',cost:'More food upkeep.'},
  'display-eye':{gain:'Courts and mates at lower energy',cost:'More food upkeep; threats noticed a little later.'},
  'eyespot':{gain:'Almost no upkeep',cost:'Threats noticed much later.'},
  'glow-eye':{gain:'Relic part: finds food and water much farther away, and spots threats sooner',cost:'More food.'},
  'climber-leg':{gain:'Two or more climbing legs gain purchase on uphill slopes',cost:'Costs food, slower on flats, and needs ancestral graspers.'}
});


// Wave 2 (creator decision 2026-10-09, "proceed with recommended next steps"): tails, backs, flanks
// and spurs, eight of each. Each part is a small set of modifiers on the effects the game already
// applies. Tail, back and flank parts count once; spur parts count per leg, up to four.
export const WAVE2={
  'balance-tail':{sprint:1.05,metabolism:1.02},
  'club-tail':{repel:.25,sprint:.96},
  'spined-tail':{rearDamage:.82,metabolism:1.02},
  'whip-tail':{strike:1.1,metabolism:1.03},
  'prehensile-tail':{carry:1.25,sprint:.98},
  'fat-tail':{metabolism:.93,sprint:.96},
  'flag-tail':{courtship:.55,visibility:1.1},
  'thorn-carapace':{damageTaken:.81,repel:.22,sprint:.89,metabolism:1.075},
  'silt-fin':{swimSpeed:1.16,swimEnergy:.94,land:.91,metabolism:1.03},
  'sail-fin':{waterUse:.92,sprint:.97},
  'spine-ridge':{brace:.92,metabolism:1.02},
  'water-hump':{waterUse:.85,land:.97},
  'display-frill':{courtship:.55,threatSense:.95},
  'moss-back':{coverHide:.28,metabolism:1.02},
  'sensory-quills':{threatSense:1.12,metabolism:1.03},
  'fat-pad':{metabolism:.94,sprint:.97},
  'gill-slits':{swimSpeed:1.1,swimEnergy:.85,waterUse:1.03},
  'salt-gland':{waterUse:1.02,metabolism:1.02},
  'scent-gland':{courtship:.55,visibility:1.08},
  'spine-cluster':{repel:.2,carry:.9},
  'brood-pouch':{carry:1.2,sprint:.97},
  'hook-spur':{huntBonus:.015,metabolism:1.005},
  'dew-claw':{brace:.985,sprint:.997},
  'heel-spike':{rearDamage:.97,land:.997},
  'sensory-bristle':{threatSense:1.02,metabolism:1.005},
  'grip-pad':{land:1.006,brace:1.005},
  'kick-spur':{strike:1.025,metabolism:1.005},
  'patagium':{land:.97,metabolism:1.04},
  // Relic parts.
  'horn-crest':{repel:.25,strike:1.1,metabolism:1.04},
  'tusk-jaw':{strike:1.35,huntBonus:.06,metabolism:1.05},
  'gliding-membrane':{sprint:1.1,land:1.03,metabolism:1.04},
  'luminous-tail':{courtship:.45,huntBonus:.04,visibility:1.15},
  'shell-back':{rearDamage:.55,sprint:.94,metabolism:1.03},
  'armored-hide':{damageTaken:.8,repel:.12,sprint:.97,metabolism:1.04},
  'echo-crest':{threatSense:1.3,metabolism:1.03}
};
export const WAVE2_TEXT=Object.freeze({
  'balance-tail':{gain:'Faster sprint',cost:'A little more food.'},
  'club-tail':{gain:'A struck attacker may recoil and break off',cost:'Slower sprint.'},
  'spined-tail':{gain:'Hits from behind do less damage',cost:'A little more food.'},
  'whip-tail':{gain:'Harder bites in a fight',cost:'More food.'},
  'prehensile-tail':{gain:'Carries more',cost:'Slightly slower sprint.'},
  'fat-tail':{gain:'Lasts longer without food',cost:'Slower sprint.'},
  'flag-tail':{gain:'Courts and mates at lower energy',cost:'Stalkers spot you a little farther away.'},
  'thorn-carapace':{gain:'Heavy dorsal armor reduces bites and can make predators back off; exposed spikes punish contact',cost:'Slower movement and higher food upkeep.'},
  'silt-fin':{gain:'Swims faster and spends less energy swimming',cost:'Slower on land; more food upkeep.'},
  'sail-fin':{gain:'Uses less water',cost:'Slightly slower sprint.'},
  'spine-ridge':{gain:'Stronger brace',cost:'A little more food.'},
  'water-hump':{gain:'Uses much less water',cost:'A little slower on land.'},
  'display-frill':{gain:'Courts and mates at lower energy',cost:'Threats noticed a little later.'},
  'moss-back':{gain:'Hides in thinner cover',cost:'A little more food.'},
  'sensory-quills':{gain:'Feels nearby movement and impacts through connected ground, even outside sight',cost:'More food.'},
  'fat-pad':{gain:'Lasts longer without food',cost:'Slightly slower sprint.'},
  'salt-gland':{gain:'With gills, keeps the body watered in seawater by excreting salt',cost:'A small organ that costs food to maintain; it does nothing on land.'},
  'gill-slits':{gain:'Respire underwater while diving, if swimming anatomy supports the body',cost:'Underwater work consumes food. Uses more water ashore; surface when injured or exhausted.'},
  'scent-gland':{gain:'Courts and mates at lower energy',cost:'Stalkers spot you a little farther away.'},
  'spine-cluster':{gain:'A struck attacker may recoil and break off',cost:'Carries less.'},
  'brood-pouch':{gain:'Carries more',cost:'Slightly slower sprint.'},
  'hook-spur':{gain:'Hunts land a little more often (per leg)',cost:'A little more food.'},
  'dew-claw':{gain:'Slightly stronger brace (per leg)',cost:'Very slightly slower sprint.'},
  'heel-spike':{gain:'Hits from behind do a little less damage (per leg)',cost:'Very slightly slower on land.'},
  'sensory-bristle':{gain:'Feels nearby footsteps and digging through ground contact (per leg)',cost:'A little more food.'},
  'grip-pad':{gain:'Slightly faster on land (per leg)',cost:'Very slightly weaker brace.'},
  'kick-spur':{gain:'Slightly harder bites (per leg)',cost:'A little more food.'},
  'horn-crest':{gain:'Relic part: attackers may recoil, and your bite is harder',cost:'More food.'},
  'tusk-jaw':{gain:'Relic part: much harder bites and better hunts',cost:'More food; plants give less.'},
  'patagium':{gain:'Paired flank membranes glide downhill or from a living canopy in new worlds · Glide / 0',cost:'Cannot hover or climb in the air. Costs food, mass and land speed; requires ancestral climbing legs.'},
  'gliding-membrane':{gain:'Paired relic membranes glide from real height in new worlds · Glide / 0',cost:'More food. Gliding loses height; historical worlds retain recorded rules.'},
  'luminous-tail':{gain:'Relic part: courts at lower energy, and its glow lures prey closer',cost:'Stalkers spot you farther away.'},
  'shell-back':{gain:'Relic part: hits from behind do about half damage',cost:'Slower sprint, a little more food.'},
  'armored-hide':{gain:'Relic part: takes less damage, and attackers may recoil',cost:'Slightly slower sprint, more food.'},
  'echo-crest':{gain:'Relic part: spots threats much farther away',cost:'A little more food.'},
  'filament-tuft':{gain:'Inherited filaments reduce cold energy use',cost:'Small upkeep and heat retention.'},
  'fur-mantle':{gain:'Thick fur reduces cold energy loss',cost:'Needs filament ancestry; wet fur insulates less, and heat costs more.'},
  'endothermic-core':{gain:'Regulates internal heat in cold regions and helps protect newborn young at close range',cost:'Needs ancestral fur, a free organ slot, and significant ongoing food energy. Heat costs rise in hot climates.'},
  'mammary-gland':{gain:'Live-born dependent young can nurse from the birth parent, funded by maternal food energy and water',cost:'Requires earlier endothermy and live birth, another organ slot, and higher food upkeep. Milk competes with adult survival.'},
  'feather-mantle':{gain:'Feathers insulate in cold and resist wetting',cost:'Needs ancestral filaments; costs food and heat. Not a flight ability.'},
  'proto-wing':{gain:'Feather-derived display precursor for future flight evolution',cost:'Needs feather ancestry, high cost and upkeep. Cannot fly or glide.'},
  'flight-wing':{gain:'A lightweight adult can take off and cross open water, rivers and steep slopes using real food energy (6 or the action dock)',cost:'Requires proto-wing ancestry across generations, 8 mutation points, high part upkeep and a body light enough to lift. Flying costs energy each second, and poor landings can injure.'},
  'hook-pad':{gain:'A pair of hooks gives uphill grip on existing slopes',cost:'Needs grip-pad ancestry, food upkeep and at least two supporting grips.'},
  'heat-frill':{gain:'Radiates heat in hot weather, reducing heat-related food loss',cost:'Needs signal-crest ancestry; increases cold exposure and food upkeep.'},
  'wax-plates':{gain:'Reduces water use on dry soil. Also repels rain from inherited fur or feathers in modern planetary worlds.',cost:'Needs armor-plate ancestry; wax retains heat and adds food upkeep.'},
  'arid-pad':{gain:'Two or more wide pads improve dry-ground travel and reduce its energy cost',cost:'Needs padded-leg ancestry; wide pads are slower and tiring on soaked ground.'}
});
// Combined wave 2 modifiers for a plan's part counts.
function wave2Mods(c){
  const m={sprint:1,land:1,metabolism:1,waterUse:1,rearDamage:1,damageTaken:1,brace:1,threatSense:1,carry:1,strike:1,huntBonus:0,repel:0,courtship:null,visibility:1,coverHide:null,swimSpeed:1,swimEnergy:1};
  for(const [id,mod] of Object.entries(WAVE2)){const n=c[id]||0;if(!n)continue;const times=PARTS_SPUR.has(id)?Math.min(4,n):1;
    for(let k=0;k<times;k++)for(const [key,v] of Object.entries(mod)){if(key==='huntBonus'||key==='repel')m[key]+=v;else if(key==='courtship')m.courtship=Math.min(m.courtship??1,v);else if(key==='coverHide')m.coverHide=Math.min(m.coverHide??1,v);else m[key]*=v}}
  m.repel=Math.min(.45,m.repel);return m;
}
const PARTS_SPUR=new Set(['hook-spur','dew-claw','heel-spike','sensory-bristle','grip-pad','kick-spur']);

const factorCache=new WeakMap();
// Multipliers folded into the existing authorities: null for a body with no designed plan.
export function partEffectFactors(animal){
  const plan=animal?.bodyPlan;if(!plan||!Array.isArray(plan.nodes))return null;
  // Anatomy is shared, but legacy founding normalization is contextual. Never
  // let the first animal evaluated choose the cached effects for another label.
  let entry=factorCache.get(plan);if(!entry){entry={raw:computeFactors(plan,planPartCounts(animal)),contexts:new Map()};factorCache.set(plan,entry)}
  const context=isWildSpecies(animal.species)?animal.species:null;
  if(entry.contexts.has(context))return entry.contexts.get(context);
  const c=planPartCounts(animal);let f=entry.raw;
  // Wild species: effects are relative to the species' starting body, which plays like the original creature.
  if(isWildSpecies(animal.species))f=relativeToStart(withLegacyParts(f,c),animal.species,c);
  entry.contexts.set(context,f);return f;
}
const MULT=['sprintSpeed','damageTaken','rearDamage','metabolism','waterUse','playerStrike','strikeWindup','carryCapacity','threatSense','forage','cue','brace','landSpeed','visibility','swimSpeed','swimEnergy'];
const startFactors=new Map();
// Wild species have no lineage anatomy, so the parts that stand for legacy adaptations act directly,
// with the same numbers those adaptations use (GenVo8s get them through anatomy instead).
function withLegacyParts(f,c){const has=id=>(c[id]||0)>0,o={...f};
  if(has('armor-plate')){o.damageTaken*=.74;o.sprintSpeed*=.95}if(has('spring-leg')){o.sprintSpeed*=1.14;o.metabolism*=1.03}
  if(has('tearing-jaw'))o.playerStrike*=1.62;if(has('crushing-jaw'))o.playerStrike*=1.70;if(has('storage-sac'))o.waterUse*=.72;if(has('barb'))o.repel=(o.repel||0)+.25;if(has('grasper'))o.carryCapacity*=1.5;
  return o}
function relativeToStart(f,species,c){
  let s=startFactors.get(species);if(!s){const plan=wildStartPlan(species),c={};for(const n of plan.nodes)c[n.partId]=(c[n.partId]||0)+1;s=withLegacyParts(computeFactors(plan,c),c);startFactors.set(species,s)}
  const out={...f};for(const k of MULT)out[k]=(f[k]??1)/(s[k]||1);
  out.huntBonus=f.huntBonus-s.huntBonus;out.repel=Math.max(0,f.repel-s.repel);out.courtship=f.courtship===s.courtship?null:f.courtship;out.coverHide=f.coverHide===s.coverHide?null:f.coverHide;
  for(const k of ['quiet','venom','paddle','wideField'])out[k]=!!f[k]&&!s[k];out.dig=!!f.dig;if(f.mouth===s.mouth&&f.mouth!=='kernel-beak')out.mouthFood={};
  // In contrast to inert founding anatomy, a mounted defensive carapace must have
  // a real baseline benefit even on a species born with one. Evolved relatives gain
  // the same part effect from normal relative-to-start factors, without double counting.
  if((c['thorn-carapace']||0)>0&&wildStartPlan(species).nodes.some(n=>n.partId==='thorn-carapace')){
    out.damageTaken*=WAVE2['thorn-carapace'].damageTaken;
    out.repel=Math.min(.45,out.repel+WAVE2['thorn-carapace'].repel);
  }
  return Object.freeze(out);
}
function computeFactors(plan,c){
  const dig=c['digging-forelimb']>0,claw=c.claw>0,venom=c['venom-gland']>0,eye=c['wide-field-eye']>0,torso=c['reinforced-torso']>0,paddle=c['paddle-tail']>0;
  const P=PART_ABILITY,W=WAVE1,root=plan.nodes.find(n=>!n.parent)?.partId,body=W.bodies[root]||{};
  const legs=plan.nodes.filter(n=>/^root\/limb\.\d+$/.test(n.id)),n=legs.length;
  let land=W.legSpeed[Math.max(4,Math.min(12,n))]??1,brace=1;for(const l of legs){const t=W.legType[l.partId];if(t){land+=t.land||0;brace*=t.brace||1}}
  land*=body.land||1;if(paddle)land*=P.paddle.land;
  const mouth=plan.nodes.find(n=>n.socket==='mouth')?.partId,M=W.mouths[mouth]||{};
  const eyeParts=plan.nodes.filter(n=>n.socket?.startsWith('eye')).map(n=>n.partId);
  let threat=(W.eyeCount[Math.max(1,Math.min(4,eyeParts.length))]??1)*(eye?P.eye.threatSense:1),forage=1,cue=1,courtship=null,eyeHunt=0,eyeMeta=1,wideField=eye;
  for(const id of new Set(eyeParts)){const e=W.eyes[id];if(!e)continue;threat*=e.threatSense||1;forage*=e.forage||1;cue*=e.cue||1;eyeHunt+=e.huntBonus||0;eyeMeta*=e.metabolism||1;if(e.courtship)courtship=e.courtship;if(e.wideField)wideField=true}
  const w2=wave2Mods(c);if(w2.courtship!=null)courtship=Math.min(courtship??1,w2.courtship);
  return Object.freeze({
    sprintSpeed:w2.sprint*(dig?P.dig.sprint:1)*(torso?P.torso.sprint:1)*(body.sprint||1)*((c['padded-leg']||0)>=W.quietPadded?W.quietSprint:1),
    damageTaken:(torso?P.torso.damageTaken:1)*(body.damageTaken||1)*w2.damageTaken,rearDamage:(body.rearDamage||1)*w2.rearDamage,
    metabolism:w2.metabolism*(venom?P.venom.metabolism:1)*(eye?P.eye.metabolism:1)*(torso?P.torso.metabolism:1)*(body.metabolism||1)*(1+Math.max(0,plan.nodes.reduce((t,x)=>t+(partDef(x.partId)?.upkeep||0),0)-W.founderUpkeep)*W.upkeepPerPart)*(M.metabolism||1)*eyeMeta,
    waterUse:w2.waterUse*(eye?P.eye.waterUse:1)*(body.waterUse||1),
    playerStrike:w2.strike*(claw?P.claw.strike:1),
    strikeWindup:claw?P.claw.windup:1,
    carryCapacity:w2.carry*(claw?P.claw.carry:1)*(body.carry||1),
    huntBonus:w2.huntBonus+(claw?P.claw.huntBonus:0)+(M.huntBonus||0)+eyeHunt,
    threatSense:threat*w2.threatSense,forage,cue,courtship,brace:brace*w2.brace,landSpeed:land*w2.land,legs:n,
    repel:w2.repel,visibility:w2.visibility,coverHide:w2.coverHide,swimSpeed:w2.swimSpeed,swimEnergy:w2.swimEnergy,
    quiet:(c['padded-leg']||0)>=W.quietPadded,mouth,mouthFood:M,
    wideField,dig,venom,paddle
  });
}
// Food energy from a mouth: applied with the lifestyle's food multiplier.
export function partFoodFactor(animal,{kind='',livePrey=false}={}){
  const M=partEffectFactors(animal)?.mouthFood;if(!M)return 1;
  if(livePrey)return M.prey||1;if(M.food?.[kind])return M.food[kind];
  return kind&&kind!=='carrion'&&M.plants?M.plants:1;
}
// Land speed from legs and body (and the paddle tail's land cost), applied by movementProfile().
export function landSpeedFactor(animal){return partEffectFactors(animal)?.landSpeed??1}
// Paddle tail swimming, applied by lifestyle.movementProfile().
export function paddleFactors(animal){return hasPart(animal,'paddle-tail')?PART_ABILITY.paddle:null}

export const ROOT_FOODS=Object.freeze(['marshroot','dunebulb']);
// Runtime state for digging and venom. Saved as controller key 'partAbilities'.
export class PartAbilityController{
  constructor(sim){this.sim=sim;this.dug={};this.digClock=0;this.poisoned=[];this.soilDisturbance=new Map()}
  disturbedSoilAt(x,y){return disturbanceAt(this.soilDisturbance,this.sim.world.idx(x,y),this.sim.day)}
  advanceSoilDay(){return pruneRecoveredSoil(this.soilDisturbance,this.sim.day)}

  // --- Digging ---
 rootMealAt(animal,x=animal?.x,y=animal?.y){
  if(!animal?.alive)return null;const w=this.sim.world;
  if(!w.isPlayable(x,y)||w.water[w.idx(x,y)])return null;
  const i=w.idx(x,y),view=x===animal.x&&y===animal.y?animal:{...animal,x,y};
  const meals=ROOT_FOODS.filter(kind=>(w.plants[kind]?.[i]||0)>.06).flatMap(kind=>this.sim.foraging.options(view,{index:i,kind})).filter(m=>m.tissue!=='kernel'&&m.handling.enabled);
  return meals.sort((a,b)=>b.needScore-a.needScore||a.kind.localeCompare(b.kind))[0]||null;
 }
 finiteCanDigAt(animal,x=animal?.x,y=animal?.y){
  if(!hasPart(animal,'digging-forelimb')||!partEffectFactors(animal)?.dig)return false;
  const i=this.sim.world.idx(x,y),last=this.dug[i];
  if(Number.isFinite(last)&&this.dayIndex()-last<PART_ABILITY.dig.regrowDays)return false;
  return !!this.rootMealAt(animal,x,y);
 }
 finiteDigAvailability(animal){
  if((animal?.diveDepth||0)>.03)return{enabled:false,reason:'Surface before digging.'};
  if(!animal?.alive)return{enabled:false,reason:'Nothing to dig with.'};
  if(animal.airborne||animal.perched)return{enabled:false,reason:'Land before digging.'};
  if(!ROOT_FOODS.some(kind=>plantPreference(animal,kind)>0))return{enabled:false,reason:'This mouth cannot eat the roots or bulbs here.'};
  if(!hasPart(animal,'digging-forelimb'))return{enabled:false,reason:'You have no digging forelimbs.'};
  if((animal.digUntilTick||0)>this.sim.tickCount)return{enabled:false,quiet:true,reason:'Still digging.'};
  if(!this.canDigAt(animal))return{enabled:false,reason:'No accessible root or bulb meal remains here, or this ground is recovering.'};
  return{enabled:true,reason:'Harvest existing root or bulb tissue.'};
 }
 finiteDig(animal){
  const status=this.digAvailability(animal);if(!status.enabled)return{ok:false,type:'dig',quiet:status.quiet,message:status.reason};
  const meal=this.rootMealAt(animal);if(!meal)return{ok:false,type:'dig',message:'That root food is no longer available.'};
  const before=this.sim.world.plants[meal.kind][meal.i],fed=this.sim.foraging.consume(animal,meal);
  if(!fed.ok)return{...fed,type:'dig'};
  const removed=before-this.sim.world.plants[meal.kind][meal.i];if(!(removed>0))throw Error('Digging meal credited without a finite producer debit.');
  animal.hidden=false;this.soilDisturbance??=new Map();recordSoilDig(this.soilDisturbance,meal.i,this.sim.day,animal.id);this.sim.regionalEcology?.noteSoilDig(animal);
  this.dug[meal.i]=this.dayIndex();animal.digUntilTick=this.sim.tickCount+PART_ABILITY.dig.cooldownTicks;animal.anim=(animal.anim+2)%8;
  if(animal.player)this.sim.lastPlayerAction={type:'dig',actorId:animal.id,tick:this.sim.tickCount,kind:meal.kind,amount:removed,energyGain:fed.energyGain};
  const mound=this.sim.discovery?.siteAt(animal,'root-mound',1.6);if(mound)this.sim.discovery.useMound(mound);
  return{...fed,type:'dig',amount:removed,message:'Dug '+meal.kind+' Â· '+fed.message};
 }
  canDigAt(animal,x=animal?.x,y=animal?.y){
    if(diggingRule(this.sim)===DIGGING_RULES.finite)return this.finiteCanDigAt(animal,x,y);
    // Digging is an action supplied by actual limbs, including starting wild bodies.
    if(!hasPart(animal,'digging-forelimb')||!partEffectFactors(animal)?.dig)return false;const w=this.sim.world,i=w.idx(x,y);
    if(w.water[i])return false;if(this.sim.discovery?.mound?.(animal,{restock:false}))return true;const last=this.dug[i];return !(Number.isFinite(last)&&this.dayIndex()-last<PART_ABILITY.dig.regrowDays);
  }
  dayIndex(){
    if(this.digClock!==1){
      // Older saves counted the already absolute day twice at year boundaries.
      const yearDays=CFG.seasonDays*4;
      for(const [cell,stamp] of Object.entries(this.dug))if(Number.isFinite(stamp)&&stamp>=1)
        this.dug[cell]=stamp-Math.floor((stamp-1)/(2*yearDays))*yearDays;
      this.digClock=1;
    }
    return this.sim.day;
  }
  digAvailability(animal){
    if(diggingRule(this.sim)===DIGGING_RULES.finite)return this.finiteDigAvailability(animal);
    if(!animal?.alive||!SPECIES[animal.species])return{enabled:false,reason:'Nothing to dig with.'};
    if(!hasPart(animal,'digging-forelimb'))return{enabled:false,reason:'You have no digging forelimbs.'};
    if(plantPreference(animal,'marshroot')<=0)return{enabled:false,reason:'This mouth cannot eat the roots produced by digging.'};
    if((animal.digUntilTick||0)>this.sim.tickCount)return{enabled:false,quiet:true,reason:'Still digging.'};
    if(this.sim.world.water[this.sim.world.idx(animal.x,animal.y)])return{enabled:false,reason:'You cannot dig in water.'};
    if(!this.canDigAt(animal))return{enabled:false,reason:'Roots here are dug out · try other ground.'};
    return{enabled:true,reason:'Use the mounted digging forelimbs.'};
  }
  dig(animal){
    if(diggingRule(this.sim)===DIGGING_RULES.finite)return this.finiteDig(animal);
    const P=PART_ABILITY.dig,s=SPECIES[animal?.species],status=this.digAvailability(animal);if(!status.enabled)return{ok:false,type:'dig',quiet:status.quiet,message:status.reason};const w=this.sim.world,i=w.idx(animal.x,animal.y);
    if(animal.hidden)animal.hidden=false;
    // Roots are richer in moist, fertile ground.
    const mound=this.sim.discovery?.mound?.(animal),richness=.6+.4*Math.min(1,(w.moisture[i]||0)*.6+(w.fertility[i]||0)*.6),energy=P.rootEnergy*richness*(mound?3:1);if(mound)this.sim.discovery.useMound(mound);
    animal.energy=Math.min(s.maxEnergy,animal.energy+energy);animal.hydration=Math.min(s.maxHydration,animal.hydration+P.rootWater);
    this.soilDisturbance??=new Map();
    recordSoilDig(this.soilDisturbance,i,this.sim.day,animal.id);
    this.sim.regionalEcology?.noteSoilDig(animal);
    if(!mound)this.dug[i]=this.dayIndex();animal.digUntilTick=this.sim.tickCount+P.cooldownTicks;animal.anim=(animal.anim+2)%8;
    if(animal.player)this.sim.lastPlayerAction={type:'dig',tick:this.sim.tickCount,energyGain:energy};
    return{ok:true,type:'dig',energyGain:energy,message:`Dug up roots · +${Math.round(energy)} energy.`};
  }
  // Autonomous root foraging: real digging limbs can compete with a distant plant meal.
  // A nearby meal remains preferable; no roots are available without a valid, renewed
  // land cell. Low-energy diggers on fertile land can save a costly food journey.
  // Origin/species alone never grants this choice; no RNG or new root stock is added.
  digDecision(animal,{food=null}={}){
    const energy=animal.energy/(SPECIES[animal.species]?.maxEnergy||1);
    const recovering=animal.health<65&&energy<.78&&!animal.player&&!animal.lineage;
    if(!(energy<PART_ABILITY.dig.aiHunger||recovering)||!this.digAvailability(animal).enabled)return null;
    if(food&&diggingRule(this.sim)===DIGGING_RULES.finite){
      const meal=this.rootMealAt(animal);
      // Use mounted limbs for an already selected local root meal; other nearby food keeps priority.
      if(meal&&food.kind===meal.kind&&this.sim.world.idx(food.x,food.y)===meal.i)return{x:animal.x,y:animal.y,kind:'roots'};
    }
    if(food){
      const distance=Math.hypot(animal.x-food.x,animal.y-food.y);
      const fertility=this.sim.world.fertility[this.sim.world.idx(animal.x,animal.y)];
      if(distance<=2.75||fertility<.42)return null;
    }
    return{x:animal.x,y:animal.y,kind:'roots'};
  }
  resolveDig(animal){
    const r=this.dig(animal);if(!r.quiet&&(!r.ok||animal.energy/SPECIES[animal.species].maxEnergy>.8)){animal.target=null;animal.intent='explore'}return true;
  }
  coverNeeded(animal,base){let need=base;if(hasPart(animal,'digging-forelimb'))need=Math.min(need,PART_ABILITY.dig.coverHide);const moss=partEffectFactors(animal)?.coverHide;if(moss!=null)need=Math.min(need,moss);return need}

  // --- Venom ---
  venomDoses(animal){
    if(!hasPart(animal,'venom-gland'))return 0;const day=this.dayIndex();
    if(!animal.venom||animal.venom.day!==day)animal.venom={doses:PART_ABILITY.venom.doses,day};return animal.venom.doses;
  }
  // Called when a bite from `attacker` lands on `target` and the target survives.
  // Poison a target for the standard venom duration (venom glands and venomous Stalkers).
  poison(target,byId){if(!target?.alive)return false;target.poison={untilTick:this.sim.tickCount+PART_ABILITY.venom.ticks,byId};if(!this.poisoned.includes(target.id))this.poisoned.push(target.id);return true}
  envenom(attacker,target){
    if(!target?.alive||this.venomDoses(attacker)<=0)return false;const V=PART_ABILITY.venom;
    attacker.venom.doses--;this.poison(target,attacker.id);
    // A poisoned hunter breaks off its attack on the biter.
    if(canHunt(target)){target.playerAversion={targetId:attacker.id,untilTick:this.sim.tickCount+Math.round(CFG.simHz*V.breakOff)};target.target=null}
    return true;
  }
  slowFactor(animal){return animal?.poison&&animal.poison.untilTick>this.sim.tickCount?PART_ABILITY.venom.slow:1}
  // Every simulation tick: poison damage, and clean-up when it wears off.
  tick(){
    if(!this.poisoned.length)return;const V=PART_ABILITY.venom,now=this.sim.tickCount,keep=[];
    for(const id of this.poisoned){
      const a=this.sim.animals.find(x=>x.id===id);if(!a?.alive||!a.poison)continue;
      if(a.poison.untilTick<=now){delete a.poison;continue}
      a.health-=V.damagePerTick;if(a.health<=0){this.sim.kill(a,'venom');continue}keep.push(id);
    }
    this.poisoned=keep;
  }
}
