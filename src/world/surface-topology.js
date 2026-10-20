// One World-owned topology boundary. Runtime transitions are accounted; saved corruption is not repaired.
import {coordNoise} from '../core/rng.js';
import {coastlineX,validateEnvironment} from './environment.js';
import {deriveDrainage} from './topography.js';
export const WORLD_GENERATORS=Object.freeze({legacy:'freshwater/1',coast:'coastal/1',planet:'planetary/1'});
export function generatorForState(state){const generator=state.generator??(state.environment?WORLD_GENERATORS.coast:WORLD_GENERATORS.legacy);if(!Object.values(WORLD_GENERATORS).includes(generator))throw Error('Unknown saved world generator.');return generator}
export function generatedWaterAt(w,x,y,generator){if(generator===WORLD_GENERATORS.planet){if(!w.planet)throw Error('Planet descriptor required for regeneration.');return w.planet.sample(x+.5+(w.regionOrigin?.x||0),y+.5+(w.regionOrigin?.y||0)).water}if(!Object.values(WORLD_GENERATORS).includes(generator))throw Error('Unknown world generator.');const broad=(coordNoise(w.seedHash,x>>3,y>>3)+coordNoise(w.seedHash^0x915f,x>>4,y>>4))*.5,river=Math.abs(y/w.n-(.5+.18*Math.sin((x+w.seedHash%97)*.055)))<.025,wet=Math.min(1,.18+broad*.68+(river?.55:0));return river||wet>.88||(generator===WORLD_GENERATORS.coast&&x>=coastlineX(w,y))?1:0}
export function validateSurfaceMask(w,mask){if(!(mask instanceof Uint8Array)||mask.length!==w.len||mask.some(v=>v!==0&&v!==1))throw Error('Invalid saved surface water mask.');}
export function newTopologyState(){return{schema:1,revision:0,waterInput:0,waterOutput:0,saltInput:0,saltOutput:0,events:[]}}
export function validateTopologyState(s){if(s?.schema!==1||!Number.isSafeInteger(s.revision)||s.revision<0||['waterInput','waterOutput','saltInput','saltOutput'].some(k=>!Number.isFinite(s[k])||s[k]<0)||!Array.isArray(s.events)||s.events.length>64)throw Error('Invalid surface topology history.');for(const row of s.events)if(row.internalWater!==undefined&&(!Number.isFinite(row.internalWater)||row.internalWater<0)||!Number.isSafeInteger(row.revision)||row.revision<=0||row.revision>s.revision||typeof row.reason!=='string'||['waterInput','waterOutput','saltInput','saltOutput'].some(k=>!Number.isFinite(row[k])||row[k]<0))throw Error('Invalid surface topology receipt.');}
// Legacy direct mask edits + rebuild use explicit shallow freshwater import. New callers supply depth/salt.
// All imports/exports cross a declared external boundary. No food, organisms or resource reserves are initialized.
export function synchronizeSurfaceWater(w,previous,{reason='legacy-mask-edit',additions=null}={}){
 validateSurfaceMask(w,previous);validateSurfaceMask(w,w.water);const changed=[];for(let i=0;i<w.len;i++)if(previous[i]!==w.water[i])changed.push(i);if(!changed.length)return false;
 if(typeof reason!=='string'||!reason.trim())throw Error('Topology change requires a source/reason.');const old=w.environment;if(old)validateEnvironment({...w,water:previous},old);
 const state=w.topology||newTopologyState();validateTopologyState(state);const row={revision:state.revision+1,reason,changedCells:changed.length,waterInput:0,waterOutput:0,saltInput:0,saltOutput:0,internalWater:0};
 let next=old?{...old,depth:old.depth.slice(),...(old.schema>=3?{volume:old.volume.slice()}:{}),
  ...(old.schema>=6?{overland:old.overland.slice()}:{}),
  salt:old.salt.slice(),boundary:old.boundary.slice(),totals:{...old.totals}}:null;
 for(const i of changed){if(w.water[i]){
  const options=additions?.get(i)||{depth:.15,salinity:0};
  if(!(Number.isFinite(options.depth)&&options.depth>0&&options.depth<=2&&
       Number.isFinite(options.salinity)&&options.salinity>=0&&options.salinity<=2))
   throw Error('Invalid topology water import.');
  const internal=options.source==='overland';
  if(internal&&(!next||next.schema!==6||options.salinity!==0||
       !Number.isFinite(next.overland?.[i])||next.overland[i]+1e-12<options.depth))
   throw Error('Runoff inundation lacks owned physical water.');
  const volume=internal?options.depth:next?Math.fround(options.depth):options.depth;
  if(internal){next.overland[i]-=volume;row.internalWater+=volume;}
  else{row.waterInput+=volume;row.saltInput+=volume*options.salinity;}
  if(next){next.depth[i]=Math.fround(volume);if(next.schema>=3)next.volume[i]=volume;
   next.salt[i]=volume*options.salinity;next.boundary[i]=0;}
 }else if(next){
  if(next.schema>=6&&next.overland[i]!==0)throw Error('Inundation export requires empty overland stock.');
  row.waterOutput+=next.schema>=3?next.volume[i]:next.depth[i];
  row.saltOutput+=next.salt[i];next.depth[i]=0;
  if(next.schema>=3)next.volume[i]=0;
  next.salt[i]=0;next.boundary[i]=0;
 }}
 if(next){next.totals.saltInput+=row.saltInput;next.totals.saltOutput+=row.saltOutput;validateEnvironment(w,next);}
 const totals={...state,revision:row.revision,events:[...state.events,row].slice(-64)};for(const k of ['waterInput','waterOutput','saltInput','saltOutput'])totals[k]+=row[k];validateTopologyState(totals);
 if(next)w.environment=next;w.topology=totals;w._topologyMask=w.water.slice();deriveDrainage(w);return row;
}
// No saved mask is a documented migration, not permission to repair inconsistent supplied masks.
export function restoreSurfaceTopology(w,state){
 w.generator=generatorForState(state);delete w.environment;w.topology=state.topology?structuredClone(state.topology):newTopologyState();validateTopologyState(w.topology);
 let target;if(state.surfaceWater){if(state.surfaceWater.schema!==1)throw Error('Invalid saved surface water topology.');validateSurfaceMask(w,state.surfaceWater.mask);target=state.surfaceWater.mask.slice();}else{target=new Uint8Array(w.len);for(let y=0;y<w.n;y++)for(let x=0;x<w.n;x++)target[y*w.n+x]=generatedWaterAt(w,x,y,w.generator);}
 if(state.environment){const env=structuredClone(state.environment);if(state.surfaceWater){w.water.set(target);validateEnvironment(w,env);w.environment=env;}else{
  // Validate the old physical payload against its own depth-implied topology before migration.
  if(!(env.depth instanceof Float32Array)||env.depth.length!==w.len)throw Error('Invalid environment field depth.');const source=Uint8Array.from(env.depth,v=>v>0?1:0);validateEnvironment({...w,water:source},env);w.environment=env;w.water.set(target);synchronizeSurfaceWater(w,source,{reason:'missing-mask-generator-migration'});
 }}else w.water.set(target);
 w._topologyMask=w.water.slice();return w;
}
