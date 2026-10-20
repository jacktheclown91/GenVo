import {deriveDrainage} from './topography.js';
import {CAVES} from './cave-policy.js';
export const SUBSURFACE=Object.freeze({policy:'excavated-subsurface/1',voidHeight:.04,minimumRoof:.012,minimumColumn:.07,maxLoad:2.6});
export function emptySubsurface(){return{schema:1,passages:new Map(),excavated:0,collapsed:0,roundoff:0,revision:0}}
export function passageAt(w,x,y){return w.subsurface?.passages?.get(w.idx(x,y))||null}
export function excavationSite(w,i){
 const x=i%w.n,y=i/w.n|0,h=w.terrain?.elevation?.[i];
 if(!Number.isSafeInteger(i)||i<0||i>=w.len||!w.isPlayable(x+.5,y+.5)||w.water[i]||!Number.isFinite(h)||h<SUBSURFACE.minimumColumn)return null;
 for(const j of [x<w.n-1?i+1:-1,y<w.n-1?i+w.n:-1,x>0?i-1:-1,y>0?i-w.n:-1])if(j>=0&&!w.water[j]&&w.isPlayable(j%w.n+.5,(j/w.n|0)+.5)&&w.terrain.elevation[j]+SUBSURFACE.voidHeight<.99)return{i,spoil:j,floor:h*20-1.2};
 return null;
}
// Surface elevation bounds the original solid column. Excavated void is negative
// space, not another material reserve. Spoil raises another real surface cell.
export function solidTerrainTotal(w){let sum=0;for(const h of w.terrain.elevation)sum+=h;for(const p of w.subsurface?.passages?.values()||[])sum-=p.void;for(const p of w.subsurface?.caveErosion?.values()||[])sum-=p.void;return sum}
export function excavatePassage(w,i,{entry=false,origin=undefined,receiver=undefined}={}){
 const prior=w.subsurface?.passages.get(i);if(prior&&!prior.closed&&(!entry||prior.entry))return prior;
 const site=excavationSite(w,i);if(!site||!w.subsurface)return null;
 const partial=w.subsurface.caveErosion?.get(i);
 const floor=prior&&!prior.closed?prior.floor:partial?.floor??site.floor,priorVoid=prior&&!prior.closed?prior.void:partial?.void??0;
 const wanted=Math.max(0,(entry?w.terrain.elevation[i]-floor/20:SUBSURFACE.voidHeight)-priorVoid);
 if(priorVoid+wanted>.12-1e-6)return null; // Leave a Float32 margin at the shallow-volume limit.
 const sink=receiver??site.spoil,heights=w.terrain.elevation;if(!Number.isSafeInteger(sink)||sink<0||sink>=w.len||w.water[sink]||!w.isPlayable(sink%w.n+.5,(sink/w.n|0)+.5)||sink===i)return null;
 const before=heights[sink];if(before+wanted>=.99)return null;heights[sink]=before+wanted;const volume=heights[sink]-before;
 const source=origin??prior?.origin;const passage={i,floor,void:priorVoid+volume,entry:!!entry,closed:false,...(source?{origin:source}:{})};w.subsurface.passages.set(i,passage);w.subsurface.caveErosion?.delete(i);w.subsurface.excavated+=volume;w.subsurface.revision++;
 deriveDrainage(w);w.buildHydrology();return passage;
}
export function refreshPassages(w){
 const s=w.subsurface;if(!s)return;
 let changed=false;for(const p of s.passages.values())if(!p.entry&&!p.closed&&w.terrain.elevation[p.i]*20-p.floor<.8+SUBSURFACE.minimumRoof*20){
  const before=w.terrain.elevation[p.i];w.terrain.elevation[p.i]=Math.max(0,before-p.void);
  s.roundoff+=w.terrain.elevation[p.i]-before+p.void;s.collapsed+=p.void;p.void=0;p.closed=true;s.revision++;changed=true;
 }
 for(const [i,p] of s.caveErosion||[])if(w.terrain.elevation[i]*20-p.floor<.8+SUBSURFACE.minimumRoof*20){
  const before=w.terrain.elevation[i];w.terrain.elevation[i]=Math.max(0,before-p.void);
  s.roundoff+=w.terrain.elevation[i]-before+p.void;s.collapsed+=p.void;s.caveErosion.delete(i);s.revision++;changed=true;
 }
 if(changed){deriveDrainage(w);w.buildHydrology()}
}
export function validateSubsurface(w,required=false){
 const s=w.subsurface;if(s===undefined){if(required)throw Error('Missing saved subsurface geometry.');return}
 if(s?.schema!==1||!(s.passages instanceof Map)||!['excavated','collapsed','roundoff','revision'].every(k=>Number.isFinite(s[k]))||s.excavated<0||s.collapsed<0||!Number.isSafeInteger(s.revision)||s.revision<0)throw Error('Invalid saved subsurface geometry.');
 let volume=0;for(const [i,p] of s.passages){const natural=p?.origin===CAVES.policy;if(p?.origin!==undefined&&!natural||i!==p?.i||!Number.isSafeInteger(i)||i<0||i>=w.len||typeof p.entry!=='boolean'||typeof p.closed!=='boolean'||!Number.isFinite(p.floor)||p.floor<-.01||p.floor>20||!Number.isFinite(p.void)||p.void<0||p.void>(p.entry||natural?.12:.05)||p.closed&&p.void!==0||!p.closed&&p.void<(p.entry&&!natural?.059:.039))throw Error('Invalid saved underground passage.');volume+=p.void}
 for(const p of s.caveErosion?.values()||[])volume+=p.void;
 if(Math.abs(s.excavated-s.collapsed-volume)>1e-6||Math.abs(s.roundoff)>Math.max(1,s.passages.size)*1e-6)throw Error('Invalid saved excavation material receipt.');
}
