// Optimistic read guards for staged physical seam work. This stores boundary
// samples and small receipt headers, never a second resource inventory.
const properties=(object,names)=>names.map(name=>[name,object?.[name]]);
const own=object=>object?Object.entries(object):null;
const sameOwn=(object,rows)=>rows===null?!object:!!object&&Object.keys(object).length===rows.length&&rows.every(([key,value])=>Object.is(object[key],value));
const headerNames=['schema','day','iceDay','iceRevision','icePolicy','boundaryWaterPolicy'];
const fields=r=>[r.water,r.env.salt,r.env.volume,r.env.depth,r.env.ice,r.env.overland,r.env.boundary,r.env.blockedBoundaries,r.soil?.groundwater,r.minerals,r.terrain?.elevation];
export function captureSeamReadset(sim,region){
 const n=sim.world.n,indices=[];for(let i=0;i<n;i++){indices.push(i,(n-1)*n+i);if(i>0&&i<n-1)indices.push(i*n,i*n+n-1)}
 const arrays=fields(region),sample=arrays.map(array=>array?indices.map(i=>array[i]):null),world=region.session?region.session.snapshot.world:sim.world;
 return{region,world,snapshot:region.session?.snapshot,clock:region.session?properties(region.session.snapshot.core,['tickCount','day']):null,indices,arrays,sample,
  headers:properties(region.env,headerNames),soilHeader:properties(region.soil,['schema','day','seamGroundwaterPolicy']),subsurfaceRevision:region.subsurface?.revision,
  envRow:own(region.env.lastDay),envDaily:own(region.env.daily?.at(-1)),envTotals:own(region.env.totals),iceTotals:own(region.env.iceTotals),
  soilRow:own(region.soil?.lastDay),soilDaily:own(region.soil?.daily?.at(-1)),soilTotals:own(region.soil?.totals),remote:own(region.session?.environmentalLedger)};
}
export function seamReadsetUnchanged(sim,read){
 const r=read.region,w=r.session?r.session.snapshot.world:sim.world;
 if(w!==read.world||r.session&&r.session.snapshot!==read.snapshot||w.environment!==r.env||w.soilWater!==r.soil||w.terrain!==r.terrain||w.subsurface!==r.subsurface||r.subsurface?.revision!==read.subsurfaceRevision)return false;
 if((r.session?w.surfaceWater?.mask:w.water)!==r.water||w.plantResources?.minerals!==r.minerals)return false;
 if(read.clock&&!read.clock.every(([key,value])=>Object.is(r.session.snapshot.core[key],value)))return false;
 if(!read.headers.every(([key,value])=>Object.is(r.env[key],value))||!read.soilHeader.every(([key,value])=>Object.is(r.soil?.[key],value)))return false;
 const arrays=fields(r);for(let a=0;a<arrays.length;a++){if(arrays[a]!==read.arrays[a])return false;if(arrays[a]&&!read.indices.every((i,n)=>Object.is(arrays[a][i],read.sample[a][n])))return false;}
 return sameOwn(r.env.lastDay,read.envRow)&&sameOwn(r.env.daily?.at(-1),read.envDaily)&&sameOwn(r.env.totals,read.envTotals)&&sameOwn(r.env.iceTotals,read.iceTotals)&&sameOwn(r.soil?.lastDay,read.soilRow)&&sameOwn(r.soil?.daily?.at(-1),read.soilDaily)&&sameOwn(r.soil?.totals,read.soilTotals)&&sameOwn(r.session?.environmentalLedger,read.remote);
}
