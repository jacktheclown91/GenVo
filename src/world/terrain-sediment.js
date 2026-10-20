export {solidTerrainTotal} from './subsurface.js';
// With modeled cavities, physical solid volume is elevation minus void geometry.
// Excavation redistributes that material; runoff still conserves its own height deltas.
// Flow-funded terrain erosion and deposition. The mutable Float32
// World.terrain.elevation owns surface height; opted-in subsurface geometry
// excludes excavated void from the solid material bounded by that surface.
// No extra sediment inventory or fabricated height is introduced.
// Historical worlds lacking this explicit policy retain immutable elevations.
export const TERRAIN_SEDIMENT=Object.freeze({
 policy:'conserved-runoff-sediment/1',
 minimumSlope:.00001,
 fractionPerWater:.004,
 dailyCellCap:.0015,
 minimumHeight:.001,
 maximumHeight:.999
});
export function validateTerrainSedimentPolicy(w,e){
 if(e?.terrainSedimentPolicy===undefined)return;
 if(e.terrainSedimentPolicy!==TERRAIN_SEDIMENT.policy||
    w?.generator!=='planetary/1'||e.schema!==6||
    !(w.terrain?.elevation instanceof Float32Array)||w.terrain.elevation.length!==w.len)
  throw Error('Invalid planetary terrain-sediment policy.');
 for(const k of ['sedimentMoved','seamSedimentInput','seamSedimentOutput']){
  const v=e.totals?.[k];
  if(v!==undefined&&(!Number.isFinite(v)||v<0))
   throw Error('Invalid planetary terrain-sediment totals.');
 }
 for(const row of [...(e.daily||[]),...(e.lastDay?[e.lastDay]:[])])
  for(const k of ['sedimentMoved','seamSedimentInput','seamSedimentOutput']){
   const v=row[k];
   if(v!==undefined&&(!Number.isFinite(v)||v<0))
    throw Error('Invalid planetary terrain-sediment receipt.');
  }
}

// Given an already staged, real downhill runoff edge, move a small amount
// of physical elevation from one land cell to another. Water cells remain
// unchanged: altering the wet topography requires a coupled depth/topology
// authority and is deliberately excluded here. Existing river mineral
// transport already handles land-to-water nutrient delivery.
export function stageTerrainSediment(from,to,i,j,waterMoved,changes){
 if(from?.env?.terrainSedimentPolicy!==TERRAIN_SEDIMENT.policy||
    to?.env?.terrainSedimentPolicy!==TERRAIN_SEDIMENT.policy||
    from.water[i]||to.water[j]||!(waterMoved>0))return 0;
 const a=from.terrain?.elevation,b=to.terrain?.elevation;
 if(!(a instanceof Float32Array)||!(b instanceof Float32Array)||
   !Number.isSafeInteger(i)||i<0||i>=a.length||
   !Number.isSafeInteger(j)||j<0||j>=b.length||
   !Number.isFinite(waterMoved))
  throw Error('Invalid physical terrain sediment source.');
 const source=changes.get(from.key),target=changes.get(to.key);
 if(!source||!target)throw Error('Missing sediment terrain owner.');
 const hA=a[i]+(source.get(i)||0),hB=b[j]+(target.get(j)||0);
 if(!Number.isFinite(hA)||!Number.isFinite(hB)||hA<0||hA>1||hB<0||hB>1)
  throw Error('Invalid staged terrain elevation.');
 const slope=hA-hB;
 if(slope<=TERRAIN_SEDIMENT.minimumSlope)return 0;
 const amount=Math.min(TERRAIN_SEDIMENT.dailyCellCap,
   waterMoved*TERRAIN_SEDIMENT.fractionPerWater,
   slope*.25,
   Math.max(0,hA-TERRAIN_SEDIMENT.minimumHeight),
   Math.max(0,TERRAIN_SEDIMENT.maximumHeight-hB));
 if(!(amount>1e-10))return 0;
 source.set(i,(source.get(i)||0)-amount);
 target.set(j,(target.get(j)||0)+amount);
 return amount;
}

export function validateSedimentDeltas(regions,changes){
 let closure=0;
 for(const r of regions){
  const elevation=r.terrain?.elevation;
  for(const [i,delta] of changes.get(r.key)||[]){
   const final=elevation?.[i]+delta;
   if(!Number.isFinite(delta)||!Number.isFinite(final)||final<0||final>1)
    throw Error('Invalid eroded or deposited terrain stock.');
   closure+=delta;
  }
 }
 if(Math.abs(closure)>1e-8)
  throw Error('Cross-region terrain sediment not conserved.');
}
