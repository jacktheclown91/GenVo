import {makePlan,validatePlan} from '../lineage/body-plan.js';
import {PARTS} from '../lineage/part-registry.js';
import {SPECIES} from './species.js';
import {WILD_START} from './wild-bodies.js';
import {FOUNDER_PLACEMENTS} from '../lineage/body-inheritance.js';

// Regional founding templates (creator direction 2026-10-21). Each entry is an
// authored INITIAL anatomical configuration for a small founding group, not a
// species, a guaranteed niche or an evolutionary result. Feeding, hunting,
// swimming, digging and climbing all follow the mounted parts through the
// shared authorities. `carrier` names the legacy life-history record (maturity,
// lifespan, litter, gestation, social mode) the founders use; it is not a diet
// or ability grant. Habitat ranges only decide where a template MAY be offered;
// regional-founding.js still requires real occupiable cells and renewable food.
//
// Founding anatomy stays within a bounded developmental depth and never uses
// relic, powered-flight, gliding-membrane or lactation parts: those capabilities
// must arise through inheritance in the world, not through introduction.
// /2 adds salinity-aware water habitats and marine templates; /1 receipts stay valid.
export const FOUNDING_TEMPLATES_VERSION='founding-templates/2';
export const FOUNDING_TEMPLATE_VERSIONS=Object.freeze(['founding-templates/1','founding-templates/2']);
export const FOUNDING_MAX_DEPTH=3;
export const FOUNDING_EXCLUDED_TAGS=Object.freeze(['exclusive','powered-flight','milk','membrane']);

const legs=(part,slots)=>slots.map(i=>({partId:part,parent:'root',socket:`limb.${i}`}));
const eyes=part=>[{partId:part,parent:'root',socket:'eye.left'},{partId:part,parent:'root',socket:'eye.right'}];
const at=(partId,socket)=>({partId,parent:'root',socket});
const torso=partId=>({partId,parent:null,socket:null});
const FOUR=[1,3,5,7];

// Habitat descriptors are tolerance claims over the World's own physical
// fields (temperature and moisture, 0..1) and medium (land, shore within
// three cells of water, or water). Food is never read from these ranges.
const T={cold:[0,.34],cool:[0,.42],temperate:[.28,.5],warm:[.4,1],hot:[.48,1],any:[0,1]};
const M={dry:[0,.42],mid:[.3,.62],wet:[.5,1],humid:[.42,1],any:[0,1]};

export const FOUNDING_TEMPLATES=Object.freeze([
 // The original valley bodies remain available wherever their habitat exists.
 {id:'hopper',label:'Hopper',carrier:'mosskip',placements:WILD_START.mosskip,group:[6,12],habitat:{medium:'land',temp:T.temperate,moisture:M.mid}},
 {id:'digger',label:'Digger',carrier:'rootling',placements:WILD_START.rootling,group:[4,8],habitat:{medium:'land',temp:T.temperate,moisture:M.wet}},
 {id:'podshell',label:'Podshell',carrier:'podshell',placements:WILD_START.podshell,group:[4,8],habitat:{medium:'land',temp:T.temperate,moisture:M.mid}},
 {id:'rillsifter',label:'Rillsifter',carrier:'rillsifter',placements:WILD_START.rillsifter,group:[4,9],habitat:{medium:'water',temp:T.any,moisture:M.any}},
 {id:'mirelick',label:'Mirelick',carrier:'mirelick',placements:WILD_START.mirelick,group:[3,6],habitat:{medium:'land',temp:T.temperate,moisture:M.wet}},
 {id:'stalker',label:'Stalker',carrier:'needlejaw',placements:WILD_START.needlejaw,group:[2,4],predator:true,habitat:{medium:'land',temp:T.temperate,moisture:M.any}},
 {id:'bankjaw',label:'Bankjaw',carrier:'bankjaw',placements:WILD_START.bankjaw,group:[2,3],predator:true,habitat:{medium:'shore',temp:T.temperate,moisture:M.wet}},
 {id:'wild-genvo',label:'Wild GenVo',carrier:'genvo',placements:FOUNDER_PLACEMENTS,group:[4,8],habitat:{medium:'land',temp:T.temperate,moisture:M.mid}},

 // Grazers and browsers.
 {id:'meadow-grazer',label:'Meadow grazer',carrier:'mosskip',group:[6,12],habitat:{medium:'land',temp:T.temperate,moisture:M.mid},
  placements:[torso('soft-torso'),...legs('walking-leg',FOUR),at('grazing-mouth','mouth'),...eyes('wide-field-eye'),at('balance-tail','tail'),at('signal-crest','dorsal')],
  variants:[{socket:'tail',parts:['flag-tail'],chance:.2}]},
 {id:'frost-hopper',label:'Frost hopper',carrier:'mosskip',group:[5,10],habitat:{medium:'land',temp:T.cold,moisture:M.any},
  placements:[torso('light-torso'),...legs('walking-leg',FOUR),at('grazing-mouth','mouth'),...eyes('wide-field-eye'),at('fat-tail','tail'),at('filament-tuft','dorsal')]},
 {id:'fur-grazer',label:'Fur grazer',carrier:'rootling',group:[4,8],habitat:{medium:'land',temp:T.cold,moisture:M.any},
  placements:[torso('stout-torso'),...legs('sturdy-leg',FOUR),at('grazing-mouth','mouth'),...eyes('simple-eye'),at('fur-mantle','dorsal'),at('fat-pad','flank.left'),at('fat-tail','tail')]},
 {id:'lichen-crawler',label:'Lichen crawler',carrier:'rootling',group:[4,8],habitat:{medium:'land',temp:T.cold,moisture:M.any},
  placements:[torso('stout-torso'),...legs('walking-leg',[1,2,3,5,6,7]),at('nibbler-mouth','mouth'),...eyes('eyespot'),at('moss-back','dorsal'),at('fat-tail','tail')]},
 {id:'dune-skipper',label:'Dune skipper',carrier:'mosskip',group:[5,10],habitat:{medium:'land',temp:T.warm,moisture:M.dry},
  placements:[torso('light-torso'),...legs('arid-pad',FOUR),at('nibbler-mouth','mouth'),...eyes('wide-field-eye'),at('flag-tail','tail'),at('wax-plates','flank.left'),at('wax-plates','flank.right')]},
 {id:'sage-browser',label:'Sage browser',carrier:'podshell',group:[4,8],habitat:{medium:'land',temp:T.warm,moisture:M.dry},
  placements:[torso('soft-torso'),...legs('padded-leg',FOUR),at('beak-mouth','mouth'),...eyes('tracker-eye'),at('heat-frill','dorsal'),at('balance-tail','tail')]},
 {id:'thicket-nibbler',label:'Thicket nibbler',carrier:'rootling',group:[4,8],habitat:{medium:'land',temp:T.temperate,moisture:M.mid},
  placements:[torso('small-torso'),...legs('walking-leg',FOUR),at('nibbler-mouth','mouth'),...eyes('tracker-eye'),at('prehensile-tail','tail')]},
 {id:'canopy-climber',label:'Canopy climber',carrier:'mosskip',group:[4,8],habitat:{medium:'land',temp:T.temperate,moisture:M.mid},
  placements:[torso('light-torso'),...legs('climber-leg',[1,7]),...legs('walking-leg',[3,5]),at('nibbler-mouth','mouth'),...eyes('simple-eye'),at('prehensile-tail','tail')]},
 {id:'seedcracker',label:'Seedcracker',carrier:'podshell',group:[4,8],habitat:{medium:'land',temp:T.temperate,moisture:M.dry},
  placements:[torso('reinforced-torso'),...legs('sturdy-leg',FOUR),at('kernel-beak','mouth'),...eyes('wide-field-eye'),at('armor-plate','dorsal'),at('club-tail','tail')]},
 {id:'spined-grazer',label:'Spined grazer',carrier:'podshell',group:[4,8],habitat:{medium:'land',temp:T.temperate,moisture:M.any},
  placements:[torso('soft-torso'),...legs('walking-leg',FOUR),at('grazing-mouth','mouth'),...eyes('wide-field-eye'),at('spine-cluster','flank.left'),at('spine-cluster','flank.right'),at('spined-tail','tail')]},
 {id:'burrow-vole',label:'Burrow vole',carrier:'rootling',group:[4,8],habitat:{medium:'land',temp:T.cool,moisture:M.dry},
  placements:[torso('small-torso'),...legs('digging-forelimb',[1,7]),...legs('walking-leg',[3,5]),at('grazing-mouth','mouth'),...eyes('eyespot'),at('filament-tuft','dorsal'),at('fat-tail','tail')]},
 {id:'bog-grazer',label:'Bog grazer',carrier:'mosskip',group:[5,10],habitat:{medium:'land',temp:T.temperate,moisture:M.wet},
  placements:[torso('small-torso'),...legs('padded-leg',FOUR),at('grazing-mouth','mouth'),...eyes('eyespot'),at('storage-sac','flank.left'),at('fat-tail','tail')]},
 {id:'marsh-wader',label:'Marsh wader',carrier:'rootling',group:[4,8],habitat:{medium:'shore',temp:T.temperate,moisture:M.wet},
  placements:[torso('soft-torso'),...legs('webbed-leg',FOUR),at('nibbler-mouth','mouth'),...eyes('stalk-eye'),at('balance-tail','tail')]},
 {id:'highland-genvo',label:'Highland GenVo',carrier:'genvo',group:[4,8],habitat:{medium:'land',temp:T.cool,moisture:M.any},
  placements:[...FOUNDER_PLACEMENTS,at('filament-tuft','dorsal')]},

 // Warm humid lowlands, reachable since the continental projection.
 {id:'jungle-browser',label:'Jungle browser',carrier:'mosskip',group:[5,10],habitat:{medium:'land',temp:T.hot,moisture:M.humid},
  placements:[torso('soft-torso'),...legs('climber-leg',[1,7]),...legs('walking-leg',[3,5]),at('nibbler-mouth','mouth'),...eyes('wide-field-eye'),at('prehensile-tail','tail')]},
 {id:'mire-wallower',label:'Mire wallower',carrier:'rootling',group:[4,8],habitat:{medium:'land',temp:T.hot,moisture:M.humid},
  placements:[torso('stout-torso'),...legs('padded-leg',FOUR),at('grazing-mouth','mouth'),...eyes('simple-eye'),at('heat-frill','dorsal'),at('fat-tail','tail')]},
 {id:'fruit-pecker',label:'Fruit pecker',carrier:'podshell',group:[4,8],habitat:{medium:'land',temp:T.hot,moisture:M.humid},
  placements:[torso('light-torso'),...legs('walking-leg',FOUR),at('beak-mouth','mouth'),...eyes('display-eye'),at('display-frill','dorsal'),at('balance-tail','tail')]},
 {id:'humid-forager',label:'Humid forager',carrier:'genvo',group:[4,8],habitat:{medium:'land',temp:T.hot,moisture:M.humid},
  placements:[...FOUNDER_PLACEMENTS,at('heat-frill','dorsal')]},
 {id:'leaf-rotter',label:'Leaf rotter',carrier:'mirelick',group:[3,6],habitat:{medium:'land',temp:T.hot,moisture:M.humid},
  placements:[torso('small-torso'),...legs('padded-leg',FOUR),at('sucker-mouth','mouth'),...eyes('tracker-eye'),at('fat-tail','tail')]},

 // Freshwater.
 {id:'pond-sifter',label:'Pond sifter',carrier:'rillsifter',group:[4,9],habitat:{medium:'water',temp:T.any,moisture:M.any},
  placements:[torso('small-torso'),...legs('webbed-leg',FOUR),at('filter-mouth','mouth'),...eyes('simple-eye'),at('paddle-tail','tail'),at('gill-slits','flank.left')]},
 {id:'reed-grazer',label:'Reed grazer',carrier:'rillsifter',group:[4,8],habitat:{medium:'water',temp:T.temperate,moisture:M.any},
  placements:[torso('soft-torso'),...legs('webbed-leg',FOUR),at('nibbler-mouth','mouth'),...eyes('wide-field-eye'),at('paddle-tail','tail'),at('silt-fin','dorsal'),at('gill-slits','flank.left')]},
 {id:'shoal-sifter',label:'Shoal sifter',carrier:'rillsifter',group:[5,9],habitat:{medium:'water',temp:T.warm,moisture:M.any},
  placements:[torso('light-torso'),...legs('webbed-leg',FOUR),at('reed-sieve-mouth','mouth'),...eyes('compound-eye'),at('paddle-tail','tail'),at('gill-slits','flank.left'),at('gill-slits','flank.right')]},

 // Open sea (marine-food-web/1): gills with a salt gland keep these bodies
 // watered in seawater; their mouths reach the marine biomass web.
 {id:'plankton-sifter',label:'Plankton sifter',carrier:'rillsifter',group:[5,10],habitat:{medium:'water',salinity:'marine',temp:T.any,moisture:M.any},
  placements:[torso('light-torso'),...legs('webbed-leg',FOUR),at('filter-mouth','mouth'),...eyes('simple-eye'),at('paddle-tail','tail'),at('gill-slits','flank.left'),at('salt-gland','flank.right')]},
 {id:'krill-sieve',label:'Krill sieve',carrier:'rillsifter',group:[5,10],habitat:{medium:'water',salinity:'marine',temp:T.any,moisture:M.any},
  placements:[torso('soft-torso'),...legs('webbed-leg',FOUR),at('reed-sieve-mouth','mouth'),...eyes('compound-eye'),at('paddle-tail','tail'),at('silt-fin','dorsal'),at('gill-slits','flank.left'),at('salt-gland','flank.right')]},
 {id:'kelp-browser',label:'Kelp browser',carrier:'rillsifter',group:[4,8],habitat:{medium:'water',salinity:'marine',temp:T.any,moisture:M.any},
  placements:[torso('stout-torso'),...legs('webbed-leg',FOUR),at('grazing-mouth','mouth'),...eyes('wide-field-eye'),at('paddle-tail','tail'),at('gill-slits','flank.left'),at('salt-gland','flank.right')]},
 {id:'tide-scavenger',label:'Tide scavenger',carrier:'rillsifter',group:[3,6],habitat:{medium:'water',salinity:'marine',temp:T.any,moisture:M.any},
  placements:[torso('small-torso'),...legs('webbed-leg',FOUR),at('sucker-mouth','mouth'),...eyes('tracker-eye'),at('paddle-tail','tail'),at('gill-slits','flank.left')/*small torso: one flank each side*/,at('salt-gland','flank.right')]},
 {id:'shell-cruncher',label:'Shell cruncher',carrier:'bankjaw',group:[2,4],predator:true,habitat:{medium:'water',salinity:'marine',temp:T.any,moisture:M.any},
  placements:[torso('reinforced-torso'),...legs('webbed-leg',FOUR),at('crushing-jaw','mouth'),...eyes('tracker-eye'),at('paddle-tail','tail'),at('armor-plate','dorsal'),at('gill-slits','flank.left'),at('salt-gland','flank.right')]},
 {id:'sea-gaper',label:'Sea gaper',carrier:'bankjaw',group:[2,3],predator:true,habitat:{medium:'water',salinity:'marine',temp:T.any,moisture:M.any},
  placements:[torso('sleek-torso'),...legs('webbed-leg',FOUR),at('gape-mouth','mouth'),...eyes('hunter-eye'),at('paddle-tail','tail'),at('gill-slits','flank.left'),at('salt-gland','flank.right')]},

 // Scavengers.
 {id:'carrion-strider',label:'Carrion strider',carrier:'mirelick',group:[3,6],habitat:{medium:'land',temp:T.warm,moisture:M.dry},
  placements:[torso('sleek-torso'),...legs('runner-leg',FOUR),at('sucker-mouth','mouth'),...eyes('tracker-eye'),at('whip-tail','tail')]},
 {id:'rot-forager',label:'Rot forager',carrier:'mirelick',group:[3,6],habitat:{medium:'land',temp:T.temperate,moisture:M.mid},
  placements:[torso('soft-torso'),...legs('walking-leg',FOUR),at('sucker-mouth','mouth'),...eyes('eyespot'),at('scent-gland','flank.left'),at('fat-tail','tail')]},

 // Predators: carriers with hunter life history; the jaw grants hunting.
 {id:'frost-stalker',label:'Frost stalker',carrier:'needlejaw',group:[2,4],predator:true,habitat:{medium:'land',temp:T.cold,moisture:M.any},
  placements:[torso('sleek-torso'),...legs('padded-leg',FOUR),at('tearing-jaw','mouth'),...eyes('hunter-eye'),at('fur-mantle','dorsal'),at('fat-tail','tail')]},
 {id:'dune-ambusher',label:'Dune ambusher',carrier:'needlejaw',group:[2,3],predator:true,habitat:{medium:'land',temp:T.warm,moisture:M.dry},
  placements:[torso('soft-torso'),...legs('arid-pad',FOUR),at('tearing-jaw','mouth'),...eyes('hunter-eye'),at('wax-plates','flank.left'),at('balance-tail','tail')]},
 {id:'pack-runner',label:'Pack runner',carrier:'needlejaw',group:[2,4],predator:true,habitat:{medium:'land',temp:T.temperate,moisture:M.mid},
  placements:[torso('sleek-torso'),...legs('runner-leg',FOUR),at('tearing-jaw','mouth'),...eyes('hunter-eye'),at('flag-tail','tail'),at('signal-crest','dorsal')]},
 {id:'shell-crusher',label:'Shell crusher',carrier:'needlejaw',group:[2,3],predator:true,habitat:{medium:'land',temp:T.temperate,moisture:M.any},
  placements:[torso('reinforced-torso'),...legs('sturdy-leg',FOUR),at('crushing-jaw','mouth'),...eyes('tracker-eye'),at('club-tail','tail'),at('armor-plate','dorsal')]},
 {id:'canopy-stalker',label:'Canopy stalker',carrier:'needlejaw',group:[2,3],predator:true,habitat:{medium:'land',temp:T.hot,moisture:M.humid},
  placements:[torso('sleek-torso'),...legs('climber-leg',[1,7]),...legs('walking-leg',[3,5]),at('tearing-jaw','mouth'),...eyes('hunter-eye'),at('prehensile-tail','tail')]},
 {id:'swamp-gaper',label:'Swamp gaper',carrier:'bankjaw',group:[2,3],predator:true,habitat:{medium:'shore',temp:T.hot,moisture:M.humid},
  placements:[torso('stout-torso'),...legs('webbed-leg',FOUR),at('gape-mouth','mouth'),...eyes('stalk-eye'),at('paddle-tail','tail'),at('heat-frill','dorsal')]},
 {id:'marsh-gaper',label:'Marsh gaper',carrier:'bankjaw',group:[2,3],predator:true,habitat:{medium:'shore',temp:T.temperate,moisture:M.wet},
  placements:[torso('stout-torso'),...legs('webbed-leg',FOUR),at('gape-mouth','mouth'),...eyes('stalk-eye'),at('paddle-tail','tail')]}
].map(t=>Object.freeze({...t,group:Object.freeze([...t.group]),placements:Object.freeze(t.placements.map(p=>Object.freeze({...p}))),variants:Object.freeze((t.variants||[]).map(v=>Object.freeze({...v,parts:Object.freeze([...v.parts])})))})));

const depthCache=new Map();
export function developmentalDepth(partId){
 if(depthCache.has(partId))return depthCache.get(partId);
 const pre=PARTS[partId]?.developmentalPrerequisites||[];
 const d=pre.length?1+Math.max(...pre.map(developmentalDepth)):0;depthCache.set(partId,d);return d;
}
const plans=new Map();
// Validates the whole catalog once; any invalid template fails visibly rather
// than being silently skipped at founding time.
export function foundingTemplatePlan(template,placements=template.placements){
 const key=template.id+'|'+placements.map(p=>p.partId+'@'+p.socket).join(',');
 if(plans.has(key))return plans.get(key);
 if(!SPECIES[template.carrier])throw Error('Founding template '+template.id+' has no life-history carrier.');
 for(const p of placements){
  const def=PARTS[p.partId];if(!def)throw Error('Founding template '+template.id+' uses unknown part '+p.partId);
  if(def.tags.some(t=>FOUNDING_EXCLUDED_TAGS.includes(t)))throw Error('Founding template '+template.id+' introduces '+p.partId+', which must evolve in the world.');
  if(developmentalDepth(p.partId)>FOUNDING_MAX_DEPTH)throw Error('Founding template '+template.id+' exceeds founding developmental depth with '+p.partId);
 }
 const plan=makePlan(placements),check=validatePlan(plan);
 if(!check.ok)throw Error('Founding template '+template.id+' is not a valid body: '+check.errors.join('; '));
 if(!plan.nodes.some(n=>n.socket==='mouth'))throw Error('Founding template '+template.id+' cannot feed.');
 plans.set(key,plan);return plan;
}
export function foundingTemplate(id){return FOUNDING_TEMPLATES.find(t=>t.id===id)||null}
for(const t of FOUNDING_TEMPLATES){foundingTemplatePlan(t);for(const v of t.variants)for(const part of v.parts)foundingTemplatePlan(t,t.placements.map(p=>p.parent==='root'&&p.socket===v.socket?{...p,partId:part}:p))}
