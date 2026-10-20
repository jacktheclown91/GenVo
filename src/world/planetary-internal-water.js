// Daily conservative water transport among already wet cells of a single
// planetary region. Geography determines bed height. A separate, owned
// Float64 inventory supplies the mutable free-surface water column.
//
// Paired regional seams have their own later same-day transfer authority.
// This module changes neither coastal land masks nor the external ocean
// reservoir, and never invents rainfall water.
export const PLANETARY_INTERNAL_WATER=Object.freeze({
 schema:1,headResponse:.04,maxDonorFraction:.08,minWet:.01,maxVolume:2
});
const sum=field=>{let total=0;for(const amount of field)total+=amount;return total;};

export function advanceInternalPlanetaryWater(w,salt){
 const e=w.environment;
 if(e?.schema!==4&&e?.schema!==5)return null;
 if(!(e.volume instanceof Float64Array)||!(salt instanceof Float64Array)||
   salt.length!==w.len||e.volume.length!==w.len)
  throw Error('Invalid internal planetary water authority.');
 const start=sum(e.volume),n=w.n,bed=w.terrain?.elevation;
 if(!(bed instanceof Float32Array)||bed.length!==w.len)
  throw Error('Missing planetary drainage elevation.');
 const volume=new Float64Array(e.volume);
 let moved=0,saltMoved=0,edges=0;
 const pair=(i,j)=>{
  if(!w.water[i]||!w.water[j])return;
  // The original-day gradient determines direction. Already staged water
  // constrains the physical amount available at corners and intersections.
  const gradient=(bed[i]+e.volume[i])-(bed[j]+e.volume[j]);
  if(!Number.isFinite(gradient)||Math.abs(gradient)<1e-12)return;
  const from=gradient>0?i:j,to=gradient>0?j:i;
  const available=volume[from],receiving=volume[to];
  const flow=Math.min(Math.abs(gradient)*PLANETARY_INTERNAL_WATER.headResponse,
   e.volume[from]*PLANETARY_INTERNAL_WATER.maxDonorFraction,
   Math.max(0,available-PLANETARY_INTERNAL_WATER.minWet),
   Math.max(0,PLANETARY_INTERNAL_WATER.maxVolume-receiving));
  if(flow<=1e-12)return;
  const concentration=Math.min(2,Math.max(0,salt[from]/available));
  const transferSalt=Math.min(flow*concentration,Math.max(0,salt[from]),
   Math.max(0,(receiving+flow)*2-salt[to]));
  if(!Number.isFinite(transferSalt)||transferSalt<0)
   throw Error('Invalid internal planetary dissolved-salt transfer.');
  volume[from]-=flow;volume[to]+=flow;
  salt[from]-=transferSalt;salt[to]+=transferSalt;
  moved+=flow;saltMoved+=transferSalt;edges++;
 };
 // One row-major pass gives stable, deterministic processing for save/replay.
 // Only orthogonal neighbors count; diagonal water cannot cross a land barrier.
 for(let i=0;i<w.len;i++){
  if(i%n<n-1)pair(i,i+1);
  if(i+n<w.len)pair(i,i+n);
 }
 const after=sum(volume),closure=-(after-start);
 if(!Number.isFinite(after)||Math.abs(closure)>1e-6)
  throw Error('Internal planetary water-volume conservation failed.');
 for(let i=0;i<w.len;i++)if(w.water[i]&&
  (!Number.isFinite(volume[i])||volume[i]<=0||volume[i]>2+1e-12||
   !Number.isFinite(salt[i])||salt[i]<-1e-12||salt[i]>volume[i]*2+1e-10))
  throw Error('Internal planetary water or dissolved salt exceeded capacity.');
 // All validation is complete. No partial publication of a bad volume field.
 e.volume.set(volume);
 e.totals.internalWaterMoved=(e.totals.internalWaterMoved||0)+moved;
 e.totals.internalSaltMoved=(e.totals.internalSaltMoved||0)+saltMoved;
 return{waterBefore:start,waterAfter:after,waterInput:0,waterOutput:0,
  waterClosure:closure,internalWaterMoved:moved,internalSaltMoved:saltMoved,
  internalWetEdges:edges};
}
