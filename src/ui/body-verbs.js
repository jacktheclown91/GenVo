// What a body can do, as verbs (creator direction 2026-10-23: anatomy changes what you
// can do, not only numbers). Read from the same capability authorities the game uses
// when the action is attempted; nothing is inferred from part names here.
import {actionCapabilities} from '../lineage/action-capabilities.js';

// Actions every creature has are left out; the rest are named in play order.
export const VERB_LABELS=Object.freeze({attack:'Attack',pounce:'Pounce',display:'Threat display',jump:'Jump',dive:'Swim and dive',
 burrow:'Burrow',roost:'Climb and perch',glide:'Glide',flight:'Fly',torpor:'Winter torpor',carry:'Carry food',hide:'Hide in cover',alarm:'Warn family'});

// Verbs of `body`, each marked new, kept or lost against `before` (when given).
export function bodyVerbs(sim,body,before=null){
 const now=actionCapabilities(sim,body),then=before?actionCapabilities(sim,before):now,out=[];
 for(const [key,label] of Object.entries(VERB_LABELS)){
  if(now[key])out.push({key,label,change:then[key]?'kept':'new'});
  else if(then[key])out.push({key,label,change:'lost'});
 }
 return out;
}
