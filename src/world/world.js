import {PlanetGeography} from './planet-geography.js';
import {initializePlanetWorld} from './planet-world.js';
import {WorldPages} from './pages.js';
import {WORLD_GENERATORS,generatorForState,generatedWaterAt,newTopologyState,synchronizeSurfaceWater} from './surface-topology.js';
import {initializeEnvironment,coastlineX,potableWater,salineMargin} from './environment.js';
import {biomeAt,countBiomes} from './biomes.js';
import {initializeTopography} from './topography.js';
import {initializeOrganicResources} from '../ecology/organic-resource-cycle.js';
import {initializePlantResources} from '../ecology/plant-resources.js';
import {initializeColdFlora} from '../ecology/cold-flora.js';
import {coordNoise,hashString} from '../core/rng.js';
import {CFG,PLANTS} from '../sim/config.js';
import {initializeFreshwater} from '../ecology/freshwater-food.js';
export class World{
  constructor(seed,{generator=WORLD_GENERATORS.legacy}={}){this.seed=String(seed);this.seedHash=hashString(this.seed);this.n=CFG.worldSize;this.len=this.n*this.n;this.generator=generatorForState({generator});if(this.generator===WORLD_GENERATORS.planet)this.planet=new PlanetGeography(this.seed);this.topology=newTopologyState();
    this.moisture=new Float32Array(this.len);this.fertility=new Float32Array(this.len);this.temperature=new Float32Array(this.len);this.water=new Uint8Array(this.len);this.landRegion=new Uint16Array(this.len);this.seepage=new Float32Array(this.len);this.drinkable=new Uint8Array(this.len);this.waterDistance=new Uint16Array(this.len);this.drinkSpots=[];this.carrion=new Float32Array(this.len);
    this.plants={};this.seedBank={};for(const [kind,p] of Object.entries(PLANTS)){const field=new Float32Array(this.len);this.plants[kind]=field;this[kind]=field;if(p.dispersal)this.seedBank[kind]=new Float32Array(this.len)}this.generate();this._topologyMask=this.water.slice();this.pages=new WorldPages(this);}
  idx(x,y){x=Math.max(0,Math.min(this.n-1,x|0));y=Math.max(0,Math.min(this.n-1,y|0));return y*this.n+x}
  biomeClimate(climate){return this.environment&&climate?.frontDay===undefined?{...climate,frontDay:this.soilWater?.day??this.environment.day??0}:climate}
  biomeAt(x,y,climate){if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||x>=this.n||y>=this.n)throw Error('Biome query outside world.');return biomeAt(this,this.idx(x,y),this.biomeClimate(climate))}
  biomeCounts(climate){return countBiomes(this,this.biomeClimate(climate))}
  isPlayable(x,y){return x>1&&y>1&&x<this.n-2&&y<this.n-2}
  generate(){if(this.planet)return initializePlanetWorld(this);const n=this.n;for(let y=0;y<n;y++)for(let x=0;x<n;x++){const i=y*n+x;const broad=(coordNoise(this.seedHash,x>>3,y>>3)+coordNoise(this.seedHash^0x915f,x>>4,y>>4))*.5;const fine=coordNoise(this.seedHash^0x51ac,x,y);const river=Math.abs((y/n)-(.5+.18*Math.sin((x+this.seedHash%97)*.055)))<.025;const wet=Math.min(1,.18+broad*.68+(river?.55:0));this.moisture[i]=wet;this.water[i]=generatedWaterAt(this,x,y,this.generator);this.fertility[i]=Math.min(1,.22+.58*coordNoise(this.seedHash^0x8191,x>>2,y>>2)+.2*wet);this.temperature[i]=.62-.28*(y/n)+.08*(fine-.5);
      for(const [kind,p] of Object.entries(PLANTS))this.plants[kind][i]=this.water[i]?0:this.initialPlant(p.init,{wet,fine,fertility:this.fertility[i],x,y,kind});
    }
    this.buildLandRegions();this.buildHydrology();initializeTopography(this);this.terrain.travelEnabled=this.generator===WORLD_GENERATORS.coast;if(this.generator===WORLD_GENERATORS.coast){initializeEnvironment(this);for(let i=0;i<this.len;i++){this.temperature[i]=.54+this.environment.temperatureOffset[i];if(!this.water[i]){this.moisture[i]=Math.min(1,this.moisture[i]*this.environment.rainScale[i]);const x=i%n,y=(i/n)|0;for(const [kind,p] of Object.entries(PLANTS))this.plants[kind][i]=this.initialPlant(p.init,{wet:this.moisture[i],fine:coordNoise(this.seedHash^0x51ac,x,y),fertility:this.fertility[i],x,y,kind});}}}this.buildHydrology();initializeColdFlora(this);initializeFreshwater(this);initializePlantResources(this);initializeOrganicResources(this);
  }

  buildLandRegions(){
    const n=this.n,q=new Int32Array(this.len);this.landRegion.fill(0);let region=0;
    for(let start=0;start<this.len;start++){if(!this.isPlayable(start%n+.5,(start/n|0)+.5)||this.water[start]||this.landRegion[start])continue;region++;let head=0,tail=0;q[tail++]=start;this.landRegion[start]=region;while(head<tail){const i=q[head++],x=i%n,y=(i/n)|0;for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){if(!ox&&!oy)continue;const nx=x+ox,ny=y+oy;if(!this.isPlayable(nx+.5,ny+.5))continue;const ni=ny*n+nx;if(this.water[ni]||this.landRegion[ni])continue;this.landRegion[ni]=region;q[tail++]=ni}}}
    this.landRegionCount=region;
  }
  setSurfaceWater(changes,{reason}={}){
    if(typeof reason!=='string'||!reason.trim())throw Error('Topology change requires a source/reason.');
    if(!Array.isArray(changes))throw Error('Topology edits must be an array.');
    const before=this.water.slice(),imports=new Map(),seen=new Set();
    for(const c of changes){if(!Number.isSafeInteger(c.i)||c.i<0||c.i>=this.len||seen.has(c.i)||(c.water!==0&&c.water!==1))throw Error('Invalid topology edit.');seen.add(c.i);if(c.water){if(!Number.isFinite(c.depth)||c.depth<=0||c.depth>2||!Number.isFinite(c.salinity)||c.salinity<0||c.salinity>2)throw Error('Invalid topology water import.');imports.set(c.i,{depth:c.depth,salinity:c.salinity});}}
    try{for(const c of changes)this.water[c.i]=c.water;const receipt=synchronizeSurfaceWater(this,before,{reason,additions:imports});this.buildLandRegions();this.buildHydrology();return receipt;}catch(e){this.water.set(before);throw e;}
  }
  regionAt(x,y){return this.landRegion[this.idx(x,y)]||0}
  sameLand(x1,y1,x2,y2){const a=this.regionAt(x1,y1),b=this.regionAt(x2,y2);return a!==0&&a===b}
  buildHydrology(){
    if(this._topologyMask&&synchronizeSurfaceWater(this,this._topologyMask))this.buildLandRegions();
    this.drinkSpots.length=0;this.drinkable.fill(0);this.seepage.fill(0);
    for(let y=0;y<this.n;y++)for(let x=0;x<this.n;x++){
      const i=this.idx(x,y);if(this.water[i]){this.seepage[i]=1;continue}
      let near1=false,near2=false;
      for(let oy=-2;oy<=2;oy++)for(let ox=-2;ox<=2;ox++){
        if(!ox&&!oy)continue;const d=Math.max(Math.abs(ox),Math.abs(oy));
        const nx=x+ox,ny=y+oy;if(nx<0||ny<0||nx>=this.n||ny>=this.n)continue;
        if(potableWater(this,this.idx(nx,ny))){if(d<=1)near1=true;else near2=true}
      }
      this.seepage[i]=near1?.74:near2?.46:0;
      if(near1&&this.isPlayable(x+.5,y+.5)){this.drinkable[i]=1;this.drinkSpots.push({x:x+.5,y:y+.5})}
    }
    this.buildWaterDistance();
  }
  buildWaterDistance(){
    const FAR=65535,dist=this.waterDistance,n=this.n,q=new Int32Array(this.len);dist.fill(FAR);let head=0,tail=0;
    for(let i=0;i<this.len;i++)if(this.drinkable[i]&&!this.water[i]){dist[i]=0;q[tail++]=i}
    const dirs=[-1,0,1];
    while(head<tail){const i=q[head++],x=i%n,y=(i/n)|0,next=dist[i]+1;for(const oy of dirs)for(const ox of dirs){if(!ox&&!oy)continue;const nx=x+ox,ny=y+oy;if(!this.isPlayable(nx+.5,ny+.5))continue;const ni=ny*n+nx;if(this.water[ni]||dist[ni]<=next)continue;dist[ni]=next;q[tail++]=ni}}
  }
  isDrinkable(x,y){if(!this.isPlayable(x,y))return false;const i=this.idx(x,y);return potableWater(this,i)||(!this.water[i]&&(this.drinkable[i]===1||(this.moisture[i]>=.72&&!salineMargin(this,i))))}
  nextDrinkStep(x,y){
    const cx=Math.max(0,Math.min(this.n-1,Math.floor(x))),cy=Math.max(0,Math.min(this.n-1,Math.floor(y))),ci=this.idx(cx,cy);if(this.isDrinkable(x,y))return{x,y,score:1,drinkable:true};let bestI=ci,bestD=this.waterDistance[ci];
    for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){if(!ox&&!oy)continue;const nx=cx+ox,ny=cy+oy;if(nx<0||ny<0||nx>=this.n||ny>=this.n)continue;const ni=this.idx(nx,ny);if(this.water[ni]||!this.isPlayable(nx+.5,ny+.5))continue;const d=this.waterDistance[ni];if(d<bestD){bestD=d;bestI=ni}}
    if(bestD>=65535||bestI===ci)return null;const bx=bestI%this.n,by=(bestI/this.n)|0;return{x:bx+.5,y:by+.5,score:1-bestD/Math.max(1,this.n),drinkable:this.drinkable[bestI]===1};
  }
  nearestDrinkable(x,y,radius=18){let best=null,bestD=radius*radius;for(const spot of this.drinkSpots){const dx=spot.x-x,dy=spot.y-y,d=dx*dx+dy*dy;if(d<bestD){bestD=d;best=spot}}return best?{x:best.x,y:best.y,score:1-Math.sqrt(bestD)/Math.max(1,radius),drinkable:true}:null}
  initialPlant(type,{wet,fine,fertility,x,y,kind}){const noise=coordNoise(this.seedHash^hashKind(kind),x,y);switch(type){
    case 'ground':return clamp01(.28+.55*fertility+.25*wet+.16*(fine-.5));
    case 'shrub':return fertility>.43&&noise>.48?Math.max(0,.10+.16*noise+.08*fertility):0;
    case 'wetland':return wet>.52&&noise>.38?Math.max(0,(wet-.48)*1.18+.05*fine):0;
    case 'fungus':return Math.max(0,.02+.07*noise);
    case 'woodland':return wet>.39&&fertility>.38&&noise>.67?Math.min(.40,.09+.18*wet*fertility+.08*noise):0;
    case 'dry_seed':return wet<.62&&noise>.46?Math.max(0,.07+.18*(1-wet)*fertility+.08*noise):0;
    // Dry-niche founders are real standing tissue and share the existing finite
    // soil/water/energy pool. Absent stands can recolonize only from funded seeds.
    case 'dry_bulb':return wet<.38&&fertility>.24&&noise>.63?Math.max(0,.055+.15*(1-wet)*fertility+.04*noise):0;
    case 'dry_shrub':return wet<.53&&fertility>.22&&noise>.49?Math.max(0,.065+.17*(1-wet)*fertility+.06*noise):0;
    default:return Math.max(0,.03+.08*noise);
  }}
  plantAt(kind,x,y){return this.plants[kind]?.[this.idx(x,y)]||0}
  consume(kind,x,y,amount){const a=this.plants[kind];if(!a)return 0;const i=this.idx(x,y),got=Math.min(a[i],amount),before=a[i];a[i]-=got;this.onCropConsumed?.(kind,i,before,a[i]);return got}
}
function clamp01(v){return Math.max(0,Math.min(1,v))}
function hashKind(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
