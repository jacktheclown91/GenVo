import {PLANTS} from '../sim/config.js';
import {coordNoise} from '../core/rng.js';
import {deriveDrainage} from './topography.js';
import {initializeFreshwater} from '../ecology/freshwater-food.js';
import {initializePlantResources} from '../ecology/plant-resources.js';
import {initializeOrganicResources} from '../ecology/organic-resource-cycle.js';
import {initializeColdFlora} from '../ecology/cold-flora.js';
import {PLANETARY_BOUNDARY_WATER} from './planetary-boundary-water.js';
import {PLANETARY_SEAM_RUNOFF} from './planetary-seam-runoff.js';
import {PLANETARY_SEAM_GROUNDWATER} from './planetary-seam-groundwater.js';
// Initial geography is immutable input. These World arrays are the sole live state.
export function initializePlanetWorld(w){
 if(w.n!==128)throw Error('Planet preview currently supports the reviewed 128-tile extent only.');
 const origin=w.regionOrigin||{x:0,y:0},samples=w.planet.region(origin.x,origin.y,w.n,w.n),elevation=new Float32Array(w.len),temperatureOffset=new Float32Array(w.len),rainScale=new Float32Array(w.len),depth=new Float32Array(w.len),salt=new Float64Array(w.len),boundary=new Uint8Array(w.len);
 for(let i=0;i<w.len;i++){const s=samples[i],x=i%w.n,y=Math.floor(i/w.n);w.water[i]=s.water;w.moisture[i]=s.moisture;w.fertility[i]=s.fertility;w.temperature[i]=s.temperature;elevation[i]=s.elevation;temperatureOffset[i]=s.temperature-.54;rainScale[i]=s.rainScale;depth[i]=s.depth;salt[i]=depth[i]*s.salinity;
  for(const [kind,p] of Object.entries(PLANTS))w.plants[kind][i]=s.water?0:w.initialPlant(p.init,{wet:s.moisture,fine:coordNoise(w.seedHash^0x51ac,x+origin.x,y+origin.y),fertility:s.fertility,x,y,kind});
 }
 // The coarse planetary geography is the only external reservoir descriptor.
 // A code is assigned only where water crosses the actual 128-tile boundary:
 // 1 freshwater, 2 ocean, 3 both (corner). Inland lakes stay closed.
 // Exchange is finite-rate and fully accounted in advanceEnvironmentWater.
 const n=w.n,edges=[
  {cells:w.planet.region(origin.x-1,origin.y,1,n),index:k=>k*n},
  {cells:w.planet.region(origin.x+n,origin.y,1,n),index:k=>k*n+n-1},
  {cells:w.planet.region(origin.x,origin.y-1,n,1),index:k=>k},
  {cells:w.planet.region(origin.x,origin.y+n,n,1),index:k=>(n-1)*n+k}
 ];
 for(const {cells,index} of edges)for(let k=0;k<n;k++){
  const i=index(k),outside=cells[k];
  if(!w.water[i]||!outside.water)continue;
  const code=outside.ocean?2:1,current=boundary[i];
  if(current===0)boundary[i]=code;
  else if(current!==code)boundary[i]=3;
 }
 w.terrain={schema:1,elevation,travelEnabled:true};deriveDrainage(w);
 // V3 adds an independently conserved dynamic water inventory. The Float32
 // depth remains the immutable geographic baseline used by historical worlds.
 // Float64 volume preserves paired transfers without rounding away small flows.
 const volume=Float64Array.from(depth);
 // New planetary worlds use an explicit equal-volume external-water exchange.
 // Older schema-6 saves without the boundaryWaterPolicy retain salt-only flux.
 // V3: observed geography supplies fixed-composition OPEN boundary water.
 // No stock is silently reset: a bounded daily mass flux is audited.
 // /2 replaces external imports with actual paired transfers when another
 // synchronized, archived region owns the wet neighboring edge.
 w.environment={schema:6,boundaryWaterPolicy:PLANETARY_BOUNDARY_WATER.pairedPolicy,blockedBoundaries:new Uint8Array(w.len),seamRunoffPolicy:PLANETARY_SEAM_RUNOFF.policy,groundwaterSeamEligibility:PLANETARY_SEAM_GROUNDWATER.policy,temperatureOffset,rainScale,depth,volume,overland:new Float64Array(w.len),salt,boundary,day:0,totals:{
  saltInput:0,saltOutput:0,rainWater:0,displacedWater:0,boundaryInput:0,boundaryOutput:0,boundaryWaterInput:0,boundaryWaterOutput:0,boundarySaltInput:0,boundarySaltOutput:0,seamRunoffInput:0,seamRunoffOutput:0
 },daily:[]};
 w.buildLandRegions();w.buildHydrology();initializeColdFlora(w);initializeFreshwater(w);initializePlantResources(w);initializeOrganicResources(w);
}
