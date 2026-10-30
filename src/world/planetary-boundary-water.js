// Versioned open-water boundary exchange for planetary regions. Geography
// declares exposed water edges; it does not own a second local water stock.
// Each replacement transfers equal volumes into and out of a wet boundary
// cell. Imported water carries the geography-declared reservoir salinity;
// exported water carries the cell's measured salinity. Both fluxes are
// recorded explicitly, never implemented by resetting a concentration.
//
// Policy /2 marks owned neighboring region sides, including shared corners.
// Historical /1 saves preserve the original all-external replacement;
// historical missing-policy saves preserve their salt-only flux law.
import {liquidVolume} from './surface-ice.js';
export const PLANETARY_BOUNDARY_WATER=Object.freeze({
 schema:2,policy:'geography-reservoir-water/1',pairedPolicy:'geography-reservoir-water/2',dailyFraction:.08
});

export function validateBoundaryWaterPolicy(world,environment){
 const policy=environment?.boundaryWaterPolicy;
 if(policy===undefined)return;
 if(![PLANETARY_BOUNDARY_WATER.policy,PLANETARY_BOUNDARY_WATER.pairedPolicy].includes(policy)||environment.schema<6||
   world.generator!=='planetary/1')
  throw Error('Invalid planetary boundary-water policy.');
 if(policy===PLANETARY_BOUNDARY_WATER.pairedPolicy){
  const mask=environment.blockedBoundaries,n=world.n;
  if(!(mask instanceof Uint8Array)||mask.length!==world.len||
    !(environment.boundary instanceof Uint8Array)||environment.boundary.length!==world.len||
    !Number.isSafeInteger(n)||n*n!==world.len)
   throw Error('Invalid paired boundary ownership mask.');
  for(let i=0;i<world.len;i++)if(mask[i]){
   const x=i%n,y=Math.floor(i/n);
   const allowed=(x===0?1:0)|(x===n-1?2:0)|(y===0?4:0)|(y===n-1?8:0);
   if(mask[i]>15||(mask[i]&~allowed)!==0||!environment.boundary[i])
    throw Error('Invalid paired boundary ownership mask.');
  }
  // Region sides owned by a resident neighbouring region (west 1, east 2,
  // north 4, south 8), land and water alike.
  if(environment.pairedSides!==undefined&&(!Number.isSafeInteger(environment.pairedSides)||environment.pairedSides<0||environment.pairedSides>15))
   throw Error('Invalid paired region sides.');
 }
 const totals=environment.totals;
 for(const key of ['boundaryWaterInput','boundaryWaterOutput',
  'boundarySaltInput','boundarySaltOutput'])
  if(!Number.isFinite(totals?.[key])||totals[key]<0)
   throw Error('Invalid planetary boundary-water totals.');
}

export function boundaryWaterExchange(environment,i,salt,volume,world=null){
 if(![PLANETARY_BOUNDARY_WATER.policy,PLANETARY_BOUNDARY_WATER.pairedPolicy].includes(environment?.boundaryWaterPolicy))
  return null;
 const boundary=environment.boundary[i];
 if(!boundary)return null;
 if(!Number.isSafeInteger(i)||i<0||i>=environment.boundary.length||
   ![1,2,3].includes(boundary)||!Number.isFinite(salt)||salt<0||
   !Number.isFinite(volume)||volume<=0||volume>2||
   salt>volume*2+1e-10)
  throw Error('Invalid planetary boundary-water stock.');
 const open=boundaryOpenness(environment,i,world);if(!open)return null;
 const {fraction,reservoirSalinity}=open;
 const liquid=liquidVolume(environment,i,volume);if(!(liquid>0)||salt>liquid*2+1e-10)throw Error('Invalid boundary liquid-water stock.');
 const water=liquid*PLANETARY_BOUNDARY_WATER.dailyFraction*fraction;
 const saltOutput=Math.min(salt,salt*water/liquid);
 const saltInput=water*reservoirSalinity;
 return{saltAfter:salt-saltOutput+saltInput,
  saltInput,saltOutput,waterInput:water,waterOutput:water};
}
// How open a wet border cell is to external water beyond the region (the share
// of its outside sides not owned by a paired neighbouring region) and the
// salinity of that outside water. Null when it has no open external side.
export function boundaryOpenness(environment,i,world=null){
 const boundary=environment.boundary[i];if(!boundary)return null;
 let reservoirSalinity=boundary===2?1:boundary===3?.5:0,fraction=1;
 const blocked=environment.boundaryWaterPolicy===PLANETARY_BOUNDARY_WATER.pairedPolicy
  ?environment.blockedBoundaries?.[i]||0:0;
 if(blocked){
  const n=Math.sqrt(environment.boundary.length),x=i%n,y=Math.floor(i/n);
  const directions=[
   ...(x===0?[[1,-1,0]]:[]),...(x===n-1?[[2,1,0]]:[]),
   ...(y===0?[[4,0,-1]]:[]),...(y===n-1?[[8,0,1]]:[])
  ];
  if(!Number.isSafeInteger(n)||!directions.length||(blocked&~directions.reduce((m,v)=>m|v[0],0)))
   throw Error('Invalid paired boundary ownership mask.');
  if(directions.every(([bit])=>blocked&bit))return null;
  if(typeof world?.planet?.sample!=='function')
   throw Error('Partly paired coastal corner requires planetary geography.');
  const origin=world.regionOrigin||{x:0,y:0},outside=[];
  for(const [bit,dx,dy] of directions){
   const sample=world.planet.sample(origin.x+x+dx+.5,origin.y+y+dy+.5);
   if(sample.water)outside.push({bit,salinity:sample.ocean?1:0});
  }
  if(!outside.length)return null;
  const open=outside.filter(side=>!(blocked&side.bit));
  if(!open.length)return null;
  fraction=open.length/outside.length;
  reservoirSalinity=open.reduce((sum,side)=>sum+side.salinity,0)/open.length;
 }
 return{fraction,reservoirSalinity};
}

export function validateBoundaryWaterReceipt(environment,row){
 if(![PLANETARY_BOUNDARY_WATER.policy,PLANETARY_BOUNDARY_WATER.pairedPolicy].includes(environment.boundaryWaterPolicy))
  return;
 for(const key of ['boundaryWaterInput','boundaryWaterOutput',
  'boundarySaltInput','boundarySaltOutput'])
  if(!Number.isFinite(row[key])||row[key]<0)
   throw Error('Invalid planetary boundary-water receipt.');
 if(Math.abs(row.boundaryWaterInput-row.boundaryWaterOutput)>1e-9||
   row.boundarySaltInput>row.boundaryInput+1e-8||
   row.boundarySaltOutput>row.boundaryOutput+1e-8||
   row.boundaryWaterInput>row.waterInput+1e-8||
   row.boundaryWaterOutput>row.waterOutput+1e-8)
  throw Error('Unbalanced planetary boundary-water receipt.');
}
