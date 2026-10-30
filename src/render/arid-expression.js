import {ARID_PHYSIOLOGY,aridExpressionOf} from '../ecology/arid-physiology.js';
import {pixel,snap} from './pixel-art.js';

// Presentation authority is the real arid-physiology readout. Most wildlife
// has neither anatomical radiator nor wax plates; skip expensive heat/part
// sampling for those individuals. The exact rule gate protects recorded saves.
const SPECIAL=new Set(['heat-frill','wax-plates']);
export function aridVisualReading(sim,animal){
 if(sim?.aridPhysiologyRules!==ARID_PHYSIOLOGY.policy||!animal?.alive)return null;
 const relevant=animal.torpor&&animal.torporKind==='aestivation'||
   animal.bodyPlan?.nodes?.some(n=>SPECIAL.has(n.partId));
 if(!relevant)return null;
 const reading=aridExpressionOf(sim,animal);
 return reading?.policy===ARID_PHYSIOLOGY.policy?reading:null;
}

// Reuse the native torpor/rest pose. Dehydration dormancy is a settled,
// tucked body, not an invented sleep action or another clock.
export function applyAestivationPosture(behavior,life,arid){
 if(!arid?.aestivating||!life?.dormant||!behavior)return false;
 behavior.bodyDrop=(behavior.bodyDrop||0)+.26;
 behavior.headDrop=(behavior.headDrop||0)+.22;
 behavior.compress=(behavior.compress||0)+.12;
 behavior.feelerPin=Math.max(behavior.feelerPin||0,.92);
 behavior.feelerForward=Math.min(behavior.feelerForward??1,.48);
 behavior.guardPlanted=true;
 return true;
}

// Native authored parts draw at actual anatomical mounts. Add a few indexed-
// scale accent pixels *only after* an authored radiator or wax plate was drawn.
// Procedural fallback parts color their own pixels (no double overlay).
export function drawNativeAridAccent(c,partId,k,mount){
 if(!mount||!k?.arid)return false;
 const s=k.s,x=mount.x,y=mount.y,fx=k.fx,fy=k.fy,p=k.perp;
 if(partId==='heat-frill'&&k.arid.frillFlushed){
  for(const i of [-1,0,1]){
   const dx=x-fx*2.4+p.x*i*1.7,dy=y-fy*2.4+p.y*i*1.7-1;
   pixel(c,snap(dx),snap(dy),1,1,s,i===0?'#ffe0ac':'#dc8262');
  }
  return true;
 }
 if(partId==='wax-plates'&&k.arid.waxSealed){
  for(const i of [-1,0,1]){
   const dx=x-fx*i*1.35,dy=y-fy*i*1.35;
   pixel(c,snap(dx),snap(dy),1,1,s,i===0?'#fff0c7':'#d4c99d');
  }
  return true;
 }
 return false;
}
