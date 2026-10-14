import {visualHabitatAt} from './habitat.js';

const FIELD_CACHE=new WeakMap();

// Renderer-only world-scale composition. It organizes open glades, loose habitat
// corridors and landmark-rich pockets without changing canonical ecology state.
export function visualCompositionAt(world,wx,wy,habitatField=null){
  let cache=null,key=null;if(habitatField&&typeof habitatField==='object'){cache=FIELD_CACHE.get(habitatField);if(!cache){cache=new Map();FIELD_CACHE.set(habitatField,cache)}key=Math.round(wx*4)*65536+Math.round(wy*4);const hit=cache.get(key);if(hit)return hit}
  const h=visualHabitatAt(world,wx,wy,habitatField),seed=world.seedHash>>>0;
  const broad=noise(seed^0x6d2b79f5,wx,wy,31),fold=noise(seed^0x1b873593,wx,wy,15),openNoise=noise(seed^0x85ebca6b,wx,wy,25),thicketNoise=noise(seed^0xc2b2ae35,wx,wy,19),accent=noise(seed^0x27d4eb2f,wx,wy,11);
  const mid=broad*.62+fold*.38,corridor=1-smoothstep(.06,.24,Math.abs(mid-.5));
  const glade=smoothstep(.61,.84,openNoise)*(1-Math.max(0,h.moisture-.78)*.55);
  const thicket=smoothstep(.57,.83,thicketNoise)*(.55+h.fertility*.45)*(1-glade*.48);
  const wetPocket=smoothstep(.59,.78,h.moisture)*(.68+accent*.32);
  const dryPocket=(1-smoothstep(.18,.36,h.moisture))*(.68+(1-accent)*.32);
  const richPocket=smoothstep(.67,.84,h.fertility)*(.70+noise(seed^0x165667b1,wx,wy,13)*.30);
  const openness=clamp01(glade*.78+corridor*.42-thicket*.24);
  const landmark=clamp01(thicket*.63+Math.max(wetPocket,dryPocket,richPocket)*.28+(accent-.5)*.12-openness*.34);
  const out={openness,corridor,thicket,wetPocket,dryPocket,richPocket,landmark,moisture:h.moisture,fertility:h.fertility};if(cache)cache.set(key,out);return out;
}

export function compositionKind(c){
  if(c.openness>.66)return c.corridor>.62?'corridor':'glade';
  if(c.wetPocket>.72)return 'wet-pocket';
  if(c.dryPocket>.72)return 'dry-pocket';
  if(c.richPocket>.74)return 'rich-pocket';
  if(c.thicket>.66)return 'thicket';
  return 'mixed';
}

function noise(seed,x,y,cell){const gx=Math.floor(x/cell),gy=Math.floor(y/cell),fx=(x-gx*cell)/cell,fy=(y-gy*cell)/cell,sx=smooth(fx),sy=smooth(fy),a=hash(seed,gx,gy),b=hash(seed,gx+1,gy),c=hash(seed,gx,gy+1),d=hash(seed,gx+1,gy+1);return lerp(lerp(a,b,sx),lerp(c,d,sx),sy)}
function hash(seed,x,y){let n=(seed^Math.imul(x+374761393,668265263)^Math.imul(y+1274126177,2246822519))>>>0;n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295}
function smooth(v){return v*v*(3-2*v)}
function smoothstep(a,b,v){const t=clamp01((v-a)/(b-a));return t*t*(3-2*t)}
function lerp(a,b,t){return a+(b-a)*t}
function clamp01(v){return Math.max(0,Math.min(1,v))}
