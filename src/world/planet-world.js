import {PLANTS} from '../sim/config.js';
import {coordNoise} from '../core/rng.js';
import {deriveDrainage} from './topography.js';
import {initializeFreshwater} from '../ecology/freshwater-food.js';
import {initializePlantResources} from '../ecology/plant-resources.js';
import {initializeOrganicResources} from '../ecology/organic-resource-cycle.js';
import {initializeColdFlora} from '../ecology/cold-flora.js';
// Initial geography is immutable input. These World arrays are the sole live state.
export function initializePlanetWorld(w){
 if(w.n!==128)throw Error('Planet preview currently supports the reviewed 128-tile extent only.');
 const origin=w.regionOrigin||{x:0,y:0},samples=w.planet.region(origin.x,origin.y,w.n,w.n),elevation=new Float32Array(w.len),temperatureOffset=new Float32Array(w.len),rainScale=new Float32Array(w.len),depth=new Float32Array(w.len),salt=new Float64Array(w.len),boundary=new Uint8Array(w.len);
 for(let i=0;i<w.len;i++){const s=samples[i],x=i%w.n,y=Math.floor(i/w.n);w.water[i]=s.water;w.moisture[i]=s.moisture;w.fertility[i]=s.fertility;w.temperature[i]=s.temperature;elevation[i]=s.elevation;temperatureOffset[i]=s.temperature-.54;rainScale[i]=s.rainScale;depth[i]=s.depth;salt[i]=depth[i]*s.salinity;
  for(const [kind,p] of Object.entries(PLANTS))w.plants[kind][i]=s.water?0:w.initialPlant(p.init,{wet:s.moisture,fine:coordNoise(w.seedHash^0x51ac,x+origin.x,y+origin.y),fertility:s.fertility,x,y,kind});
 }
 w.terrain={schema:1,elevation,travelEnabled:true};deriveDrainage(w);
 // This bounded preview has no declared external reservoir flux. Dynamic cross-region
 // ocean/river transport is a later authority; do not fabricate replenishment here.
 w.environment={schema:1,temperatureOffset,rainScale,depth,salt,boundary,day:0,totals:{saltInput:0,saltOutput:0,rainWater:0,displacedWater:0},daily:[]};
 w.buildLandRegions();w.buildHydrology();initializeColdFlora(w);initializeFreshwater(w);initializePlantResources(w);initializeOrganicResources(w);
}
