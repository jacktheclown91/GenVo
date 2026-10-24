// v1.58.0: every sound ships compressed: Ogg Opus first, AAC (.m4a) for browsers that cannot decode
// Opus. The 16-bit WAV masters live in assets/audio-source (toolkit only). Loops carry their exact
// length, so encoder padding at the end of a file never leaves a gap at the loop point.
const src=path=>{const base=new URL('../../assets/audio/'+path,import.meta.url).href;return{url:base+'.ogg',urls:[base+'.ogg',base+'.m4a'],master:'assets/audio-source/'+path+'.wav'}};
export const AUTHORED_AUDIO=Object.freeze({
  field:{...src('ambience/field-loop'),kind:'loop',seconds:12,bus:'ambience',gain:.68},
  rain:{...src('ambience/rain-loop'),kind:'loop',seconds:12,bus:'ambience'},
  wet:{...src('ambience/wet-loop'),kind:'loop',seconds:12,bus:'ambience',gain:.52},
  'water-edge':{...src('ambience/water-edge-loop'),kind:'loop',seconds:12,bus:'ambience',gain:.46},
  lineage:{...src('music/lineage-loop'),kind:'loop',seconds:12,bus:'music',gain:.46},
  theme:{...src('music/theme-loop'),kind:'loop',seconds:12,bus:'music',gain:.26},
  shelter:{...src('music/shelter-loop'),kind:'loop',seconds:12,bus:'music',gain:0},
  danger:{...src('music/danger-loop'),kind:'loop',seconds:6,bus:'music',gain:0},
  'branch-stealth':{...src('music/branch-stealth'),kind:'cue'},
  'branch-offense':{...src('music/branch-offense'),kind:'cue'},
  'branch-social':{...src('music/branch-social'),kind:'cue'},
  'branch-utility':{...src('music/branch-utility'),kind:'cue'},
  'genvo-call':{...src('fauna/genvo-call'),kind:'cue'},
  'genvo-hurt':{...src('fauna/genvo-hurt'),kind:'cue'},
  'genvo-alarm':{...src('fauna/genvo-alarm'),kind:'cue'},
  'genvo-rally':{...src('fauna/genvo-rally'),kind:'cue'},
  'genvo-court':{...src('fauna/genvo-court'),kind:'cue'},
  'genvo-birth':{...src('fauna/genvo-birth'),kind:'cue'},
  hopper:{...src('fauna/hopper-peep'),kind:'cue'},
  digger:{...src('fauna/digger-chuff'),kind:'cue'},
  stalker:{...src('fauna/stalker-rattle'),kind:'cue'},
  'stalker-stalk':{...src('fauna/stalker-stalk'),kind:'cue'},
  'stalker-charge':{...src('fauna/stalker-charge'),kind:'cue'},
  'stalker-lunge':{...src('fauna/stalker-lunge'),kind:'cue'},
  'food-moss':{...src('actions/food-moss'),kind:'cue'},
  'food-berries':{...src('actions/food-berries'),kind:'cue'},
  'food-reeds':{...src('actions/food-reeds'),kind:'cue'},
  'food-mushroom':{...src('actions/food-mushroom'),kind:'cue'},
  'food-seed':{...src('actions/food-seed'),kind:'cue'},
  'food-carrion':{...src('actions/food-carrion'),kind:'cue'},
  'shelter-build':{...src('actions/shelter-build'),kind:'cue'},
  'shelter-repair':{...src('actions/shelter-repair'),kind:'cue'},
  'shelter-store':{...src('actions/shelter-store'),kind:'cue'}
});

export const SPECIES_AUDIO=Object.freeze({
  genvo:'genvo-call',
  mosskip:'hopper',
  rootling:'digger',
  needlejaw:'stalker',
  rillsifter:'hopper',
  mirelick:'digger',
  podshell:'hopper',
  bankjaw:'stalker'
});

export const FOOD_AUDIO=Object.freeze({
  sunmoss:'food-moss',
  bramble:'food-berries',
  marshroot:'food-reeds',
  rotcap:'food-mushroom',
  thistlepod:'food-seed',
  carrion:'food-carrion'
});

export function authoredAudioIds(){return Object.keys(AUTHORED_AUDIO)}
