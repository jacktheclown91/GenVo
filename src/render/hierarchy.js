import {visualCompositionAt} from './composition.js';

// Renderer-only visual-priority interpreter. It quiets low-value ground noise around
// the controlled animal and across very open habitat while preserving canonical
// resources, landmarks, history, water, and creature state.
export function visualHierarchyAt(world,x,y,{focusX=null,focusY=null,habitatField=null}={}){
  const c=visualCompositionAt(world,x+.5,y+.5,habitatField);
  const hasFocus=Number.isFinite(focusX)&&Number.isFinite(focusY);
  const d=hasFocus?Math.hypot((x+.5)-focusX,(y+.5)-focusY):999;
  const focus=hasFocus?1-smoothstep(.65,3.35,d):0;
  // Open ground should preserve negative space. Dense habitat can carry more texture,
  // but the immediate player pocket still loses low-information speckle.
  const microAlpha=clamp(.50+(1-c.openness)*.42-focus*.30,.25,.94);
  const accentAlpha=clamp(.68+(1-c.openness)*.27-focus*.20,.43,.98);
  const traceAlpha=clamp(.58+(1-c.openness)*.30-focus*.18,.38,.96);
  const foregroundClearance=clamp(focus*.92,0,.92);
  return{focus,distance:d,microAlpha,accentAlpha,traceAlpha,foregroundClearance,openness:c.openness,thicket:c.thicket};
}

export function foregroundAlphaFor(profile,{playerContact=false}={}){
  if(!profile)return 1;
  return clamp(1-profile.foregroundClearance*(playerContact?.52:.28),.45,1);
}

function smoothstep(a,b,v){const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t)}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
