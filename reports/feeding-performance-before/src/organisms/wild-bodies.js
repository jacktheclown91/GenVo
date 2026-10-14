import {makePlan} from '../lineage/body-plan.js';
import {PARTS} from '../lineage/part-registry.js';
import {partEffectFactors} from '../lineage/part-abilities.js';

// Living wildlife (creator direction 2026-10-09): predators and prey are built from the same
// Spore-like parts the player evolves, with different core bodies. Each species starts from its
// own body plan; newborns inherit and mutate it like GenVos, so branches appear in the world, and
// parts seen on any wild creature are known to the player. A species' starting body plays exactly
// like the pre-modular creature: effects are measured relative to that starting body
// (part-abilities normalises them), so only evolution changes how wildlife plays.

const L=i=>`limb.${i}`;
const legs=(part,slots)=>slots.map(i=>({partId:part,parent:'root',socket:L(i)}));
export const WILD_START=Object.freeze({
  // Stalker (predator): a sleek hunting body on four runner legs, a tearing jaw, forward hunter eyes, a whip tail and a spine ridge.
  needlejaw:[{partId:'sleek-torso',parent:null,socket:null},...legs('runner-leg',[1,3,5,7]),{partId:'tearing-jaw',parent:'root',socket:'mouth'},{partId:'hunter-eye',parent:'root',socket:'eye.left'},{partId:'hunter-eye',parent:'root',socket:'eye.right'},{partId:'whip-tail',parent:'root',socket:'tail'},{partId:'spine-ridge',parent:'root',socket:'dorsal'}],
  // Hopper (prey): a light body on spring legs, a grazing mouth, wide-field eyes and a balance tail.
  mosskip:[{partId:'light-torso',parent:null,socket:null},...legs('spring-leg',[3,5]),...legs('walking-leg',[1,7]),{partId:'grazing-mouth',parent:'root',socket:'mouth'},{partId:'wide-field-eye',parent:'root',socket:'eye.left'},{partId:'wide-field-eye',parent:'root',socket:'eye.right'},{partId:'balance-tail',parent:'root',socket:'tail'}],
  // Digger (prey): a stout body with digging forelimbs, a nibbler mouth, eyespots and a fat tail.
  // Water specialist; aquaticScore=1 by actual webbing/tail/gills. The sieve and fin are
  // inheritable parts, not species-only special cases.
  rillsifter:[{partId:'light-torso',parent:null,socket:null},...legs('webbed-leg',[1,3,5,7]),{partId:'reed-sieve-mouth',parent:'root',socket:'mouth'},{partId:'wide-field-eye',parent:'root',socket:'eye.left'},{partId:'wide-field-eye',parent:'root',socket:'eye.right'},{partId:'paddle-tail',parent:'root',socket:'tail'},{partId:'gill-slits',parent:'root',socket:'flank.left'},{partId:'silt-fin',parent:'root',socket:'dorsal'}],
  // Damp-soil scavenger: consumes actual finite carrion/rotcap, not an invented food pool.
  mirelick:[{partId:'stout-torso',parent:null,socket:null},...legs('padded-leg',[1,3,5,7]),{partId:'sucker-mouth',parent:'root',socket:'mouth'},{partId:'tracker-eye',parent:'root',socket:'eye.left'},{partId:'tracker-eye',parent:'root',socket:'eye.right'},{partId:'fat-tail',parent:'root',socket:'tail'},{partId:'moss-back',parent:'root',socket:'dorsal'}],
  // Land seed specialist; feet are slow and the dorsal shield is an inherited defense.
  podshell:[{partId:'dome-torso',parent:null,socket:null},...legs('sturdy-leg',[1,3,5,7]),{partId:'kernel-beak',parent:'root',socket:'mouth'},{partId:'wide-field-eye',parent:'root',socket:'eye.left'},{partId:'wide-field-eye',parent:'root',socket:'eye.right'},{partId:'club-tail',parent:'root',socket:'tail'},{partId:'thorn-carapace',parent:'root',socket:'dorsal'}],
  // An amphibious shoreline hunter: webbing and paddle tail let it pursue aquatic prey.
  bankjaw:[{partId:'sleek-torso',parent:null,socket:null},...legs('webbed-leg',[1,3,5,7]),{partId:'gape-mouth',parent:'root',socket:'mouth'},{partId:'hunter-eye',parent:'root',socket:'eye.left'},{partId:'hunter-eye',parent:'root',socket:'eye.right'},{partId:'paddle-tail',parent:'root',socket:'tail'},{partId:'spine-ridge',parent:'root',socket:'dorsal'}],
  rootling:[{partId:'stout-torso',parent:null,socket:null},...legs('digging-forelimb',[1,7]),...legs('walking-leg',[3,5]),{partId:'nibbler-mouth',parent:'root',socket:'mouth'},{partId:'eyespot',parent:'root',socket:'eye.left'},{partId:'eyespot',parent:'root',socket:'eye.right'},{partId:'fat-tail',parent:'root',socket:'tail'}]
});
// How big each species is drawn relative to a GenVo.
export const WILD_SCALE=Object.freeze({needlejaw:1.22,mosskip:.86,rootling:.96,rillsifter:.70,mirelick:.90,podshell:1.03,bankjaw:1.08});
export const isWildSpecies=species=>!!WILD_START[species];
const startPlans=new Map();
export function wildStartPlan(species){let p=startPlans.get(species);if(!p&&WILD_START[species]){p=makePlan(WILD_START[species]);startPlans.set(species,p)}return p||null}

const NEUTRAL=Object.freeze({chaseSpeed:1,stamina:1,sight:1,stealth:1,damage:1,toughness:1,impact:1,spines:0,huntBonus:0,metabolism:1,venom:false});
const SPINY=new Set(['barb','spine-cluster','spined-tail','spine-ridge','thorn-carapace','heel-spike','horn-crest']);
// Hunter and prey traits for a wild animal, from its (normalised) part effects. Neutral for GenVos
// and for any species' starting body.
export function wildTraits(animal){
  if(!animal?.bodyPlan||!isWildSpecies(animal.species))return NEUTRAL;
  const pf=partEffectFactors(animal);if(!pf)return NEUTRAL;
  const start=wildStartPlan(animal.species),spinyNow=animal.bodyPlan.nodes.filter(n=>SPINY.has(n.partId)).length,spinyStart=start.nodes.filter(n=>SPINY.has(n.partId)).length;
  return{chaseSpeed:pf.landSpeed,stamina:1/Math.max(.7,1+(pf.landSpeed-1)*1.2),sight:pf.threatSense,stealth:(pf.quiet?.8:1)/(pf.visibility||1),damage:pf.playerStrike,toughness:pf.damageTaken,impact:1/(pf.brace||1),spines:Math.max(0,spinyNow-spinyStart)*1.5+(animal.bodyPlan.nodes.some(n=>n.partId==='thorn-carapace')?1.6:0),huntBonus:0,metabolism:1,venom:false};
}

// Named branches: the most telling part the starting body did not have.
const BRANCH_PARTS=[['thorn-carapace','Thornback'],['kernel-beak','Seed-cracking'],['silt-fin','Finned'],['reed-sieve-mouth','Sifting'],['gliding-membrane','Gliding'],['shell-back','Shelled'],['armored-hide','Armored'],['luminous-tail','Glowing'],['glow-eye','Glow-eyed'],['echo-crest','Crested'],['venom-gland','Venom'],['tusk-jaw','Tusked'],['horn-crest','Horned'],['spine-cluster','Spined'],['spined-tail','Spined'],['barb','Barbed'],['armor-plate','Armored'],['dome-torso','Shelled'],['reinforced-torso','Armored'],['webbed-leg','Swimming'],['paddle-tail','Swimming'],['gill-slits','Swimming'],['digging-forelimb','Burrowing'],['spring-leg','Leaping'],['runner-leg','Sprinting'],['padded-leg','Silent'],['sturdy-leg','Heavy'],['long-torso','Long'],['barrel-torso','Barrel'],['stout-torso','Stout'],['sleek-torso','Sleek'],['crushing-jaw','Crushing'],['gape-mouth','Gaping'],['stalk-eye','Stalk-eyed'],['compound-eye','Compound-eyed'],['moss-back','Mossy'],['sail-fin','Sailed']];
const LABELS={needlejaw:'Stalker',mosskip:'Hopper',rootling:'Digger',rillsifter:'Rillsifter',mirelick:'Mirelick',podshell:'Podshell',bankjaw:'Bankjaw',genvo:'GenVo'};
export function wildBranch(animal){
  const label=LABELS[animal?.species]||'Creature';if(!animal?.bodyPlan||!isWildSpecies(animal.species))return{id:'common',label};
  // v1.61.0: a body that lives in water is named for it first.
  {const legs=animal.bodyPlan.nodes.filter(n=>n.parent==='root'&&n.socket?.startsWith('limb.'));if(legs.length>=2&&legs.every(n=>n.partId==='webbed-leg')&&animal.bodyPlan.nodes.some(n=>n.partId==='paddle-tail')&&animal.bodyPlan.nodes.some(n=>n.partId==='gill-slits'))return{id:`${animal.species}:aquatic`,label:animal.species==='rillsifter'?label:`Aquatic ${label}`}}
  const start=new Set(wildStartPlan(animal.species).nodes.map(n=>n.partId)),have=new Set(animal.bodyPlan.nodes.map(n=>n.partId));
  for(const [part,word] of BRANCH_PARTS)if(have.has(part)&&!start.has(part))return{id:`${animal.species}:${word.toLowerCase()}`,label:`${word} ${label}`};
  return{id:'common',label};
}

// Special creatures (creator direction 2026-10-09): rare individuals that carry relic parts no
// creature evolves. One of each kind lives at a time; when it dies (hunted or not) it leaves a
// relic, and the relic unlocks its parts in the editor. 'first' and 'every' are in days.
export const SPECIAL_KINDS=Object.freeze({
  'elder-stalker':{species:'needlejaw',label:'Elder Stalker',parts:['horn-crest','tusk-jaw'],first:20,every:25,health:100,palette:{body:'#c9a24a',shade:'#7a5a22',light:'#f6dc8a'},accent:'#f0c040',arrival:'An Elder Stalker roams the land. If it dies, it leaves a relic.'},
  'golden-hopper':{species:'mosskip',label:'Golden Hopper',parts:['gliding-membrane','luminous-tail'],first:28,every:30,palette:{body:'#e0b43c',shade:'#8a6420',light:'#fff0a8'},arrival:'A Golden Hopper is loose in the grass. Catch it, or find where it falls, for its relic.'},
  'crystal-digger':{species:'rootling',label:'Crystal Digger',parts:['shell-back','armored-hide'],first:36,every:30,health:100,palette:{body:'#7fb8c8',shade:'#3f6f80',light:'#d8f6ff'},arrival:'A Crystal Digger is burrowing somewhere. When it dies, it leaves a relic.'},
  'ghost-genvo':{species:'genvo',label:'Ghost GenVo',parts:['glow-eye','echo-crest'],first:44,every:35,palette:{body:'#d6e2ee',shade:'#8a9ab0',light:'#ffffff'},alpha:.62,fades:30,arrival:'A pale Ghost GenVo walks with a wild band. Before long it fades away, leaving a relic.'}
});
// The sockets a relic part takes on the root body (paired parts on both sides).
function relicSockets(id){const t=PARTS[id]?.compatibleSocketTypes?.[0];return t==='eye'?['eye.left','eye.right']:t==='flank'?['flank.left','flank.right']:t?[t]:[]}
// Special creatures carry their relic parts visibly on their bodies.
export function withRelicParts(plan,parts){
  const placements=plan.nodes.map(n=>({partId:n.partId,parent:n.parent,socket:n.socket}));
  for(const id of parts)for(const socket of relicSockets(id)){for(let i=placements.length-1;i>=0;i--)if(placements[i].parent==='root'&&placements[i].socket===socket)placements.splice(i,1);placements.push({partId:id,parent:'root',socket})}
  return makePlan(placements);
}
// A special creature's young do not inherit its relic parts: each goes back to the part the
// species (or the founder body) has on that socket, or is simply removed.
export function withoutRelicParts(plan,baseline){
  if(!plan.nodes.some(n=>PARTS[n.partId]?.tags.includes('exclusive')))return plan;
  const keep=plan.nodes.filter(n=>!PARTS[n.partId]?.tags.includes('exclusive')).map(n=>({partId:n.partId,parent:n.parent,socket:n.socket}));
  for(const n of plan.nodes)if(PARTS[n.partId]?.tags.includes('exclusive')&&n.parent==='root'){const b=baseline?.find(x=>x.parent==='root'&&x.socket===n.socket);if(b&&!keep.some(x=>x.parent==='root'&&x.socket===n.socket))keep.push({...b})}
  return makePlan(keep);
}
