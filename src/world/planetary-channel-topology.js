// Versioned temporary-channel ownership for schema-6 planetary worlds.
// Existing wet geography cannot become land through this rule. Only cells
// funded by physical overland runoff and tagged at their creation may recede.
// Their remaining water is returned to the SAME finite overland inventory,
// never exported or regenerated.
export const PLANETARY_CHANNEL_TOPOLOGY=Object.freeze({
 policy:'funded-temporary-channels/1',
 schema:1,
 maxRecededPerDay:8,
 maxRecedingVolume:.025,
 minWetAgeDays:1
});

export function validateChannelTopologyPolicy(world,environment){
 const p=environment?.channelTopologyPolicy;
 if(p===undefined)return;
 if(p!==PLANETARY_CHANNEL_TOPOLOGY.policy||world?.generator!=='planetary/1'||
   environment.schema!==6||
   !(environment.floodOrigin instanceof Uint8Array)||
   environment.floodOrigin.length!==world.len)
  throw Error('Invalid planetary channel-topology policy.');
 for(let i=0;i<world.len;i++){
  const flag=environment.floodOrigin[i];
  if(flag!==0&&flag!==1)throw Error('Invalid saved temporary-water ownership.');
  if(flag===1&&(!world.water[i]||environment.boundary[i]||
      !(environment.depth[i]>0)||!(environment.volume[i]>0)))
   throw Error('Unfunded temporary-water ownership.');
 }
 for(const name of ['recededWater','recededCells','floodedCells']){
  const value=environment.totals?.[name];
  if(value!==undefined&&(!Number.isFinite(value)||value<0))
   throw Error('Invalid planetary channel-topology totals.');
 }
 for(const row of [...(environment.daily||[]),...(environment.lastDay?[environment.lastDay]:[])]){
  const value=row.recededWater;
  if(value!==undefined&&(!Number.isFinite(value)||value<0))
   throw Error('Invalid planetary channel recession receipt.');
 }
}

// Only prior-day runoffs are eligible. A cell flooded this morning must not
// be removed in the same phase merely because its initial volume is shallow.
// The fixed source geography carries floodOrigin=0 so coastline/old lake cells
// are never silently removed by this rule.
export function planChannelRecession(world,day){
 const e=world.environment,policy=PLANETARY_CHANNEL_TOPOLOGY;
 if(e?.channelTopologyPolicy!==policy.policy)return[];
 if(!Number.isSafeInteger(day)||day<1)throw Error('Invalid channel recession day.');
 validateChannelTopologyPolicy(world,e);
 const changes=[],n=world.n;
 for(let i=n;i<world.len-n&&changes.length<policy.maxRecededPerDay;i++){
  if(e.floodOrigin[i]!==1||!world.water[i])continue;
  const x=i%n;
  if(x===0||x===n-1)continue;
  const volume=e.volume[i],salt=e.salt[i];
  if(!(volume>0&&volume<=policy.maxRecedingVolume)||
    salt!==0||e.boundary[i]!==0||e.overland[i]!==0)continue;
  // Recession is a dry-down of an owned shallow pocket. No other body's
  // water, plant resources, terrain mass, or coastline is modified here.
  changes.push({i,water:0,destination:'overland'});
 }
 return changes;
}
