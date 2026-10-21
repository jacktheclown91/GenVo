// Exposed cavity liquid is a SUBSET of the World-owned groundwater stock.
// Never add this derived amount to water totals or create another aquifer.
export const CAVE_WATER=Object.freeze({policy:'groundwater-exposed-cavities/1',aquiferDepth:.12});
export function exposedCaveWater(w,i,groundwater=w.soilWater?.groundwater?.[i]){
 const p=w.subsurface?.passages.get(i);
 if(w.subsurface?.waterPolicy!==CAVE_WATER.policy||!p||p.closed||w.water[i]||!(groundwater>0))return 0;
 const table=w.terrain.elevation[i]-CAVE_WATER.aquiferDepth+groundwater*CAVE_WATER.aquiferDepth;
 return Math.min(groundwater,p.void,Math.max(0,table-p.floor/20));
}
export function caveFlooded(w,i){const p=w.subsurface?.passages.get(i);return !!w.water[i]||!!p&&!p.closed&&p.void>0&&exposedCaveWater(w,i)>=Math.min(.025,p.void*.75)}
// Replaces, rather than duplicates, the ordinary aquifer edge when a real
// connected cavity exposes water. Both debit and credit remain in groundwater.
export function caveGroundwaterFlow(w,i,j,gi,gj,lateral){
 if(w.subsurface?.waterPolicy!==CAVE_WATER.policy||w.water[i]||w.water[j])return null;
 const p=w.subsurface.passages.get(i),q=w.subsurface.passages.get(j);
 if(!p||!q||p.closed||q.closed||Math.abs(p.floor-q.floor)>.6)return null;
 const wi=exposedCaveWater(w,i,gi),wj=exposedCaveWater(w,j,gj);if(!wi&&!wj)return null;
 const hi=p.floor/20+wi,hj=q.floor/20+wj,from=hi>hj?i:j,to=hi>hj?j:i;
 const donor=from===i?wi:wj,room=1-(to===i?gi:gj);
 return{from,to,flow:Math.max(0,Math.min(Math.abs(hi-hj)*lateral*2,donor*.25,room*.25))};
}
export function validateCaveWater(w){if(w.subsurface?.waterPolicy!==undefined&&w.subsurface.waterPolicy!==CAVE_WATER.policy)throw Error('Unknown saved cave groundwater policy.');}
