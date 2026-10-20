// Test-only reconstruction of a real historical planetary environment.
// Merely changing schema:6 to schema:5/4 leaves newer policy opt-ins active
// on the wrong historical representation and produces invalid hybrid states.
// Remove the versioned policies, never modify live-world migration rules.
const FUTURE_POLICIES=[
 'boundaryWaterPolicy','blockedBoundaries','seamRunoffPolicy',
 'groundwaterSeamEligibility','springEligibility','mineralRunoffPolicy',
 'terrainSedimentPolicy','wetbedSedimentPolicy','channelTopologyPolicy',
 'coatMoisturePolicy','seasonalCoatPolicy','embryoClimatePolicy',
 'youngClimatePolicy','flightWindPolicy','floodOrigin'
];
export function simulateHistoricalPlanetaryEnvironment(world,schema){
 if(!world||world.generator!=='planetary/1'||![3,4,5].includes(schema)||
   world.environment?.schema!==6)
  throw Error('Only modern planetary environments may be converted into historical test fixtures.');
 const e=world.environment;
 e.schema=schema;
 for(const key of FUTURE_POLICIES)delete e[key];
 if(schema<5)delete e.overland;
 if(world.soilWater)delete world.soilWater.springPolicy;
 return e;
}
