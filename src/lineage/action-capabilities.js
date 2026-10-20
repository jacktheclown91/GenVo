// Biological possession, independent of current stamina, position, health or pause.
// Compose the same authorities used by execution; presentation never counts parts.
import {winged} from './flight.js';
import {hasGlidingSurfaces} from './gliding.js';
import {hasJumpingAnatomy} from './jumping.js';
import {swimsByBody} from './aquatic.js';
import {roostAnatomy} from '../ecology/canopy-site.js';
import {winterFatAnatomy} from '../ecology/cold-wildlife.js';
import {physicalAttackProfile} from './physical-attack.js';

export function actionCapabilities(sim,animal=sim.player()){
 const a=animal,flight=winged(a),glide=hasGlidingSurfaces(a);
 return{
  interact:true,eat:true,drink:true,rest:true,brace:true,
  attack:!!physicalAttackProfile(a).mode,
  pounce:!!a&&sim.playerCombat.pounceReach(a)>0,
  dive:swimsByBody(a),jump:hasJumpingAnatomy(a),glide,flight,
  roost:roostAnatomy(a),
  torpor:winterFatAnatomy(a),
  'planet-travel':!!sim.planetaryRegions,'family-travel':!!sim.planetaryRegions
 };
}
// Exit actions remain reachable even when anatomy changes while in that state.
export function activeAction(a,type){
 return type==='flight'?!!a?.airborne&&!a?.aerialMode:
  type==='glide'?a?.aerialMode==='glide':type==='dive'?(a?.diveDepth||0)>.03||a?.diveTarget>0:
  type==='roost'?!!a?.perched:type==='torpor'?!!a?.torpor:false;
}
