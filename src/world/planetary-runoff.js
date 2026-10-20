// Version-5 planetary surface-water authority. Soil runoff and rejected
// groundwater overflow become conserved overland water, routed along the
// actual steepest-downhill drainage graph. Water that cannot reach an existing
// channel remains in its dry-land basin; this pass does NOT create new lakes.
export const PLANETARY_RUNOFF=Object.freeze({schema:1,moveFraction:.65});
const sum=a=>{let n=0;for(const v of a)n+=v;return n;};
export function totalPlanetarySurfaceWater(w){
 const e=w.environment;
 return sum(e?.volume||[])+sum(e?.overland||[]);
}
export function routePlanetaryRunoff(w,runoff,day){
 const e=w.environment;
 if(e?.schema!==5)return null;
 if(!(runoff instanceof Float64Array)||runoff.length!==w.len||
   !(e.overland instanceof Float64Array)||e.overland.length!==w.len||
   !(e.volume instanceof Float64Array)||e.volume.length!==w.len||
   !(w.terrain?.downstream instanceof Int32Array)||
   !e.lastDay||e.lastDay.day!==day)
  throw Error('Invalid planetary soil runoff handoff.');
 const before=totalPlanetarySurfaceWater(w),overland=e.overland.slice(),
  volume=e.volume.slice(),downstream=w.terrain.downstream;
 let captured=0,delivered=0,moved=0,edges=0;
 for(let i=0;i<w.len;i++){
  const amount=runoff[i];
  if(!Number.isFinite(amount)||amount<0||w.water[i]&&amount)
   throw Error('Invalid planetary land runoff source.');
  if(amount){overland[i]+=amount;captured+=amount;}
 }
 // One bounded downhill hop per day from a frozen, post-rain source state.
 // Routing uses the existing terrain drainage graph, never a teleport to
 // the nearest lake or a fabricated region-boundary outflow.
 const original=overland.slice();
 for(let i=0;i<w.len;i++){
  if(w.water[i]||original[i]<=0)continue;
  const j=downstream[i];
  if(j<0)continue;
  if(j>=w.len||w.terrain.elevation[j]>=w.terrain.elevation[i])
   throw Error('Invalid downhill runoff route.');
  let amount=original[i]*PLANETARY_RUNOFF.moveFraction;
  if(w.water[j])amount=Math.min(amount,Math.max(0,2-volume[j]));
  if(amount<=0)continue;
  overland[i]-=amount;
  if(w.water[j]){volume[j]+=amount;delivered+=amount;}
  else overland[j]+=amount;
  moved+=amount;edges++;
 }
 for(let i=0;i<w.len;i++){
  if(!Number.isFinite(overland[i])||overland[i]<-1e-12||
    !Number.isFinite(volume[i])||volume[i]<0||volume[i]>2+1e-10||
    (w.water[i]&&overland[i]!==0)||( !w.water[i]&&volume[i]!==0))
   throw Error('Invalid planetary runoff surface inventory.');
 }
 const after=sum(overland)+sum(volume),closure=captured-(after-before);
 if(Math.abs(closure)>1e-6)
  throw Error('Planetary runoff water closure failed.');
 // Validate the combined rain + soil handoff BEFORE touching live stores.
 // A malformed receipt must never publish only one side of the transfer.
 const row=e.lastDay;
 const combinedInput=row.waterInput+captured;
 const combinedClosure=combinedInput-row.waterOutput-(after-row.waterBefore);
 if(!Number.isFinite(combinedClosure)||Math.abs(combinedClosure)>1e-6)
  throw Error('Invalid planetary combined rainfall/runoff closure.');
 e.overland.set(overland);e.volume.set(volume);
 e.totals.soilRunoffReceived=(e.totals.soilRunoffReceived||0)+captured;
 e.totals.runoffDelivered=(e.totals.runoffDelivered||0)+delivered;
 e.totals.overlandMoved=(e.totals.overlandMoved||0)+moved;
 row.waterInput=combinedInput;
 row.waterAfter=after;
 row.waterClosure=combinedClosure;
 row.soilRunoffReceived=captured;
 row.runoffDelivered=delivered;
 row.overlandMoved=moved;
 row.overlandEdges=edges;
 return{received:captured,delivered,moved,edges,stored:sum(overland),closure};
}
