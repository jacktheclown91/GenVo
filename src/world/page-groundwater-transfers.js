// World-owned groundwater remains in soilWater.groundwater. This ledger records REAL
// lateral transfers between LAND cells straddling page seams. Open water is an
// external fixed-head boundary and is accounted by the existing soil-water budget.
import {WORLD_PAGE_SIZE,pageCoordinates} from './pages.js';
export const PAGE_GROUNDWATER_SCHEMA=1;
function adjacent(n,i,j){return j===i+1&&Math.floor(i/n)===Math.floor(j/n)||j===i+n}
function edge(n,i,j){
 if(!Number.isSafeInteger(n)||n<1||!Number.isSafeInteger(n*n)||![i,j].every(k=>Number.isSafeInteger(k)&&k>=0&&k<n*n)||!adjacent(n,i,j))throw Error('Invalid groundwater page edge.');
 const a=pageCoordinates(i%n,Math.floor(i/n),WORLD_PAGE_SIZE),b=pageCoordinates(j%n,Math.floor(j/n),WORLD_PAGE_SIZE);
 return a.key===b.key?null:{from:a.key,to:b.key};
}
export function recordPageGroundwater(ledger,n,i,j,signedWater){
 if(!(ledger instanceof Map)||!Number.isFinite(signedWater))throw Error('Invalid groundwater page transfer.');
 const p=edge(n,i,j);if(!p||signedWater===0)return false;
 const key=p.from+'>'+p.to;
 let row=ledger.get(key);
 if(!row){row={...p,forwardWater:0,backwardWater:0};ledger.set(key,row);}
 if(signedWater>0)row.forwardWater+=signedWater;else row.backwardWater-=signedWater;
 return true;
}
export function finishPageGroundwater(ledger){
 if(!(ledger instanceof Map))throw Error('Invalid groundwater page ledger.');
 const compare=(a,b)=>a.from<b.from?-1:a.from>b.from?1:a.to<b.to?-1:a.to>b.to?1:0;
 return{schema:PAGE_GROUNDWATER_SCHEMA,flows:[...ledger.values()].map(f=>({...f,netWater:f.forwardWater-f.backwardWater})).sort(compare)};
}
export function validatePageGroundwater(w,receipt){
 if(!Number.isSafeInteger(w?.n)||w.n<1||receipt?.schema!==PAGE_GROUNDWATER_SCHEMA||!Array.isArray(receipt.flows))throw Error('Invalid groundwater page receipt.');
 const pages=Math.ceil(w.n/WORLD_PAGE_SIZE),max=2*pages*(pages-1);if(receipt.flows.length>max)throw Error('Excess groundwater page transfers.');
 let previous='';
 for(const f of receipt.flows){
  if(!f||typeof f.from!=='string'||typeof f.to!=='string')throw Error('Invalid groundwater page edge.');
  const a=f.from.split(',').map(Number),b=f.to.split(',').map(Number);
  if(a.length!==2||b.length!==2||![...a,...b].every(v=>Number.isSafeInteger(v)&&v>=0&&v<pages)||f.from!==a.join(',')||f.to!==b.join(',')||
   !((a[0]+1===b[0]&&a[1]===b[1])||(a[0]===b[0]&&a[1]+1===b[1])))throw Error('Invalid groundwater page edge.');
  const key=f.from+'>'+f.to;
  if(previous&&previous>=key)throw Error('Duplicate or unordered groundwater page edge.');
  previous=key;
  if(!Number.isFinite(f.forwardWater)||f.forwardWater<0||!Number.isFinite(f.backwardWater)||f.backwardWater<0||
   f.forwardWater+f.backwardWater<=0||!Number.isFinite(f.netWater)||
   Math.abs(f.netWater-(f.forwardWater-f.backwardWater))>1e-10*Math.max(1,f.forwardWater,f.backwardWater))throw Error('Invalid groundwater page quantity.');
 }
}
export function pageLandGroundwater(w,groundwater=w.soilWater?.groundwater){
 if(!Number.isSafeInteger(w?.n)||w.n<1||!(groundwater instanceof Float32Array)||groundwater.length!==w.n*w.n||!(w.water instanceof Uint8Array)||w.water.length!==groundwater.length)throw Error('Invalid land groundwater storage.');
 const pages=new Map();for(let i=0;i<groundwater.length;i++){
  if(w.water[i])continue;
  if(!Number.isFinite(groundwater[i])||groundwater[i]<0)throw Error('Invalid land groundwater stock.');
  const key=pageCoordinates(i%w.n,Math.floor(i/w.n),WORLD_PAGE_SIZE).key;
  pages.set(key,(pages.get(key)||0)+groundwater[i]);
 }return pages;
}
