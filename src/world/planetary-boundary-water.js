// Versioned open-water boundary exchange for planetary regions. Geography
// declares exposed water edges; it does not own a second local water stock.
// Each replacement transfers equal volumes into and out of a wet boundary
// cell. Imported water carries the geography-declared reservoir salinity;
// exported water carries the cell's measured salinity. Both fluxes are
// recorded explicitly, never implemented by resetting a concentration.
//
// Historical planetary saves without the policy retain their original
// salt-only boundary flux law.
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
   if(mask[i]!==1||!(x===0||x===n-1||y===0||y===n-1)||!environment.boundary[i])
    throw Error('Invalid paired boundary ownership mask.');
  }
 }
 const totals=environment.totals;
 for(const key of ['boundaryWaterInput','boundaryWaterOutput',
  'boundarySaltInput','boundarySaltOutput'])
  if(!Number.isFinite(totals?.[key])||totals[key]<0)
   throw Error('Invalid planetary boundary-water totals.');
}

export function boundaryWaterExchange(environment,i,salt,volume){
 if(![PLANETARY_BOUNDARY_WATER.policy,PLANETARY_BOUNDARY_WATER.pairedPolicy].includes(environment?.boundaryWaterPolicy))
  return null;
 if(environment.boundaryWaterPolicy===PLANETARY_BOUNDARY_WATER.pairedPolicy&&environment.blockedBoundaries?.[i])return null;
 const boundary=environment.boundary[i];
 if(!boundary)return null;
 if(!Number.isSafeInteger(i)||i<0||i>=environment.boundary.length||
   ![1,2,3].includes(boundary)||!Number.isFinite(salt)||salt<0||
   !Number.isFinite(volume)||volume<=0||volume>2||
   salt>volume*2+1e-10)
  throw Error('Invalid planetary boundary-water stock.');
 const reservoirSalinity=boundary===2?1:boundary===3?.5:0;
 const water=volume*PLANETARY_BOUNDARY_WATER.dailyFraction;
 const saltOutput=Math.min(salt,salt*water/volume);
 const saltInput=water*reservoirSalinity;
 return{saltAfter:salt-saltOutput+saltInput,
  saltInput,saltOutput,waterInput:water,waterOutput:water};
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
