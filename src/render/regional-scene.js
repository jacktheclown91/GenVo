import {BorderTerrain} from './border-terrain.js';
import {regionKey,PLANET_REGION_SIZE} from '../world/planet-regions.js';
// Only finished read-side terrain caches cross a regional ownership handoff.
// Actor, input, sensing and interaction caches always belong to the new owner.
const TERRAIN_KEYS=['habitatField','habitatFieldDay','terrainSeason','terrainRefreshAt','landformMaskCache','habitatMaskCache','landBaseTileCache','waterBaseTileCache','staticLandTileCache','terrainChunkCache','staticGroundTileCache','vegLayerCache','waterToneCache'];
export function captureRegionalTerrain(renderer){const state={};for(const key of TERRAIN_KEYS){const value=renderer[key];if(value!==undefined)state[key]=value instanceof Map?new Map(value):value}return state}
export function continueRegionalScene(renderer,previous,next,RendererClass){
 if(!renderer.sceneShown||renderer.scenePending||renderer.sim!==previous||renderer.motionSim!==previous||!previous?.world?.planet||!next?.world?.planet||previous.seed!==next.seed||JSON.stringify(previous.world.planet.descriptor)!==JSON.stringify(next.world.planet.descriptor))return false;
 const a=previous.world.regionOrigin,b=next.world.regionOrigin;
 if(Math.abs(a.x-b.x)+Math.abs(a.y-b.y)!==PLANET_REGION_SIZE||!next.player()?.alive)return false;
 const before=previous.player(),after=next.player(),samePosition=before&&a.x+before.x===b.x+after.x&&a.y+before.y===b.y+after.y;
 const camera=samePosition?{x:renderer.camera.x+a.x-b.x,y:renderer.camera.y+a.y-b.y}:{x:after.x,y:after.y};
 const border=renderer.borderTerrain||new BorderTerrain(RendererClass),incoming=border.sim===previous?border.views.get(regionKey(b)):null;
 const state=incoming?captureRegionalTerrain(incoming.renderer):null,outgoing=captureRegionalTerrain(renderer);
 // Build the independent departed presentation before changing the renderer.
 if(!border.rebase(previous,next,outgoing))return false;
 renderer.sim=next;renderer.resetWorldCaches();
 if(state)Object.assign(renderer,state);
 renderer.borderTerrain=border;renderer.motion.clear();renderer.motionSim=next;
 renderer.subsurfaceRevision=next.world.subsurface?.revision;
 renderer.playerVisual=null;renderer.visibleAnimals=[];renderer.regionalFauna=[];renderer.regionalScreenPos=new Map();renderer.screenPos=new Map();renderer.screenBounds=new Map();renderer.screenBoundsWorld=next.world;
 renderer.camera.x=camera.x;renderer.camera.y=camera.y;renderer.cameraReady=true;
 // Prepared chunks remain drawable while the ordinary bounded refresh path
 // reconciles the new owner's actual flora and day, just as during movement.
 renderer.habitatFieldDay=-1;renderer.pendingHabitatDay=null;renderer.pendingHabitatFrames=0;renderer.terrainRefreshAt=-Infinity;
 renderer.scenePending=false;renderer.preparingScene=false;renderer.sceneShown=true;
 renderer.resolveSceneReady?.();renderer.sceneReadyPromise=new Promise(resolve=>{renderer.resolveSceneReady=resolve});
 const stats=renderer.regionalSceneStats||={handoffs:0,promotedChunks:0};stats.handoffs++;stats.promotedChunks+=state?.terrainChunkCache?.size||0;
 stats.last={from:regionKey(a),to:regionKey(b),promotedChunks:state?.terrainChunkCache?.size||0,departingChunks:outgoing.terrainChunkCache?.size||0};
 return true;
}
