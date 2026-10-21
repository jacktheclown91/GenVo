export const CAVE_AIR=Object.freeze({policy:'finite-cave-oxygen/1',ambient:.21,breathable:.12,mixing:.8,consumption:.00035});
export function emptyCaveAir(){return{policy:CAVE_AIR.policy,cells:new Map(),introduced:0,consumed:0,exported:0}}
// Gas volume follows actual excavated space. Initial atmosphere is explicitly
// a world initial condition; subsequently only actual entrances admit oxygen.
export function syncCaveAir(w,{initial=false}={}){
 const a=w.subsurface?.air;if(!a)return;
 for(const [i,c] of a.cells){const p=w.subsurface.passages.get(i);if(!p||p.closed){a.exported+=c.oxygen;a.cells.delete(i)}}
 for(const [i,p] of w.subsurface.passages)if(!p.closed){
  let c=a.cells.get(i);if(!c){c={volume:p.void,oxygen:0};a.cells.set(i,c)}
  c.volume=p.void;const maximum=c.volume*CAVE_AIR.ambient;
  if(c.oxygen>maximum){a.exported+=c.oxygen-maximum;c.oxygen=maximum}
  if(initial){a.introduced+=maximum-c.oxygen;c.oxygen=maximum}
 }
}
export function caveAirAt(w,i){
 const c=w.subsurface?.air?.cells.get(i),p=w.subsurface?.passages.get(i);
 if(!c||!p||p.closed||w.water[i])return{fraction:0,breathable:false};
 const fraction=c.volume>0?c.oxygen/c.volume:0;return{fraction,breathable:fraction>=CAVE_AIR.breathable};
}
export function advanceCaveAir(w,dt,occupants=[]){
 const a=w.subsurface?.air;if(!a)return null;
 if(!(dt>0&&dt<=.25))throw Error('Invalid cave air step.');
 const needs=[...occupants],ids=new Set();
 for(const r of needs){if(!Number.isSafeInteger(r.id)||ids.has(r.id)||!Number.isSafeInteger(r.i)||r.i<0||r.i>=w.len||!Number.isFinite(r.demand)||r.demand<0)throw Error('Invalid cave respiration demand.');ids.add(r.id)}
 syncCaveAir(w);const delta=new Map();
 const add=(i,v)=>delta.set(i,(delta.get(i)||0)+v);
 // Simultaneous bounded exchange: at most 20% per edge at maximum dt.
 // Four outgoing edges therefore cannot overdraw a cell or oversaturate it.
 for(const [i,c] of a.cells){if(w.water[i])continue;const p=w.subsurface.passages.get(i),x=i%w.n,y=i/w.n|0;
  for(const j of [x<w.n-1?i+1:-1,y<w.n-1?i+w.n:-1]){const q=a.cells.get(j);if(!q||w.water[j]||Math.abs(p.floor-w.subsurface.passages.get(j).floor)>.6)continue;
   const flux=(c.oxygen/c.volume-q.oxygen/q.volume)*Math.min(c.volume,q.volume)*CAVE_AIR.mixing*dt;add(i,-flux);add(j,flux);
  }
 }
 for(const [i,d] of delta)a.cells.get(i).oxygen+=d;
 for(const [i,c] of a.cells)if(!w.water[i]&&w.subsurface.passages.get(i).entry){const input=(c.volume*CAVE_AIR.ambient-c.oxygen)*Math.min(1,dt);c.oxygen+=input;a.introduced+=input}
 const groups=new Map();
 for(const {id,i,demand} of needs){if(!groups.has(i))groups.set(i,[]);groups.get(i).push({id,demand})}
 const supplied=new Map();
 for(const [i,rows] of groups){rows.sort((x,y)=>x.id-y.id);const c=a.cells.get(i),air=caveAirAt(w,i),total=rows.reduce((sum,r)=>sum+r.demand,0),take=air.fraction>0?Math.min(c.oxygen,total):0;
  if(take){c.oxygen-=take;a.consumed+=take}
  const adequacy=total>0?Math.min(1,take/total,air.fraction/CAVE_AIR.breathable):0;for(const {id} of rows)supplied.set(id,adequacy);
 }
 return supplied;
}
export function validateCaveAir(w){
 const a=w.subsurface?.air;if(a===undefined)return;
 if(a?.policy!==CAVE_AIR.policy||!(a.cells instanceof Map)||!['introduced','consumed','exported'].every(k=>Number.isFinite(a[k])&&a[k]>=0))throw Error('Invalid saved cave air policy or ledger.');
 let oxygen=0,count=0;
 for(const [i,p] of w.subsurface.passages)if(!p.closed){const c=a.cells.get(i);count++;if(!c||c.volume!==p.void||!Number.isFinite(c.oxygen)||c.oxygen<0||c.oxygen>c.volume*CAVE_AIR.ambient+1e-12)throw Error('Invalid saved cave air capacity.');oxygen+=c.oxygen}
 if(count!==a.cells.size||Math.abs(oxygen-(a.introduced-a.consumed-a.exported))>1e-9)throw Error('Invalid saved cave oxygen receipt.');
}
