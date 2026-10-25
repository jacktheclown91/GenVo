import {drawNestArt,drawEggArt} from './clutch-art.js';
import {visibleRegionalFauna} from '../world/regional-fauna.js';
import {drawRegionalAnimal} from './regional-fauna.js';
import {drawWildfire} from './wildfire.js';
import {drawThunderstorms} from './thunderstorms.js';
import {drawSurfaceIce} from './surface-ice.js';
import {drawWaterSurfaceMarks} from './water-surface-art.js';
import {liquidContact} from '../lineage/ice-locomotion.js';
import {CanvasRecorder} from './canvas-recorder.js';
import {drawAtmosphere} from './atmosphere.js';
import {drawSensoryFog,prepareSensoryFog,clipToSensed} from './sensory-fog.js';
import {drawThermalWeather} from './thermal-weather.js';
import {drawWeatherReadout} from './weather-readout.js';
import {THERMAL_WEATHER} from '../ecology/thermal-weather.js';
import {VISIBILITY,visuallyObservable,creatureView} from '../ecology/atmospheric-visibility.js';
import {CAVES} from '../world/cave-policy.js';
import {clampCameraToWorld} from './camera-bounds.js';
import {BorderTerrain} from './border-terrain.js';
import {continueRegionalScene} from './regional-scene.js';
import {beginTintFrame} from './indexed-part-renderer.js';
import {attentionTarget,HeadAttentionPresentation} from './head-attention.js';
import {reactionExpression,applyReactionPose} from './reaction-expression.js';
import {gaitTravelFor} from './genvo.js';
import {assemblyFor} from './creature-assembler.js';
import {locomotionStyle,locomotionOffsets} from './locomotion-style.js';
import {movementProfile} from '../lineage/lifestyle.js';
import {drawSnowGround,beginSnowWindow} from './snow-ground-art.js';
import {botanicalPlantView} from '../ecology/botanical-reproduction.js';
import {FeedingPresentation,applyFeedingExpression} from './feeding-expression.js';
import {BirthSettlementPresentation,applyBirthSettlement} from './birth-settlement.js';
import {drawSubsurface} from './subsurface.js';
import {drawWorldTraces} from './world-traces.js';
import {glideGround} from '../lineage/gliding.js';
import {drawFlightWind} from './flight-wind.js';
import {drawRefugeReadout} from './refuge-readout.js';
import {drawCaveProgress} from './cave-progress-readout.js';
import {chooseOverlayPlacement} from '../ui/overlay-placement.js';
import {beginReadoutFrame,readoutScreenConstraints,reserveReadout} from './readout-layout.js';
import {EncounterPresentation,applyEncounterPose} from './encounter-expression.js';
import {EncounterReactionPresentation,applyEncounterReaction,reactionAttention,reactionShove,drawEncounterReactionMarks,applyDefenseReaction,defenseShove,drawDefenseMarks} from './encounter-reactions.js';
import {canHunt} from '../ecology/functional-diet.js';
import {PartExpressionTracker} from './part-expression.js';
// v1.41.0 32-pixel world: cached terrain tiles hold 32 art pixels per tile (painted on a 2x-scaled canvas).
const TILE_ART=2;
// World art pass (v1.50.0): room round each tile for plants that spread past its edges, in tile units.
const VEG_PAD=9;
// Terrain is cached in 4x4-tile chunks (one chunk is rebuilt every other frame when stale).
const TERRAIN_CHUNK=4;
import {partEffectFactors} from '../lineage/part-abilities.js';
import {CFG,PLANTS} from '../sim/config.js';
import {currentCourtshipMove} from '../reproduction/courtship-performance.js';
import {SPECIES,phenotypeFor} from '../organisms/species.js';
import {stalkerProfileFor} from '../organisms/stalker-profile.js';
import {developmentFor} from '../family/family.js';
import {nearestThreat,nearbyFood} from '../ui/readability.js';
import {buildVisualWaterMask,LANDFORM_RESOLUTION,maskWaterAt} from './landform.js';
import {buildVisualHabitatMask,visualHabitatAt,buildSmoothedHabitatField,HABITAT_ZONE} from './habitat.js';
import {visualCompositionAt} from './composition.js';
import {visualLifeState} from './life.js';
import {behaviorVisualState,visualActionFromIntent} from './behavior.js';
import {drawGenvoSprite,SPRITE_BATCH,beginSpriteBatch,endSpriteBatch,spriteBatchAfterFlush,spriteBatchBeforeFlush} from './genvo-draw.js';
import {creaturePalette} from './creature-palette.js';
import {drawSite} from './sites.js';
import {drawShelterArt,shelterLiquidRain} from './shelter-art.js';
import {drawRiparianDepth,drawHabitatClusterAccents} from './habitat-detail.js';
import {drawDisturbedSoil} from './soil-activity.js';
import {VisualMotionTracker} from './motion.js';
import {predictPlayerPose} from './player-prediction.js';
import {applyPlayerCombatPose,drawPlayerCombatFeedback,drawStalkerPursuitFeedback} from './combat-feedback.js';
import {drawActivityGround} from './activity-detail.js';
import {environmentContactFor,drawGroundContact,drawForegroundContact,displacementForTile} from './physicality.js';
import {collectHabitatScenes} from './scene.js';
import {drawHabitatSceneBackdrop,drawHabitatSceneForeground} from './scene-detail.js';
import {drawHabitatDepth,creatureShadowFor,drawCreatureDepthShadow,drawSceneDepthForeground} from './depth.js';
import {drawFloraPlant,drawFloraSeedling,floraSeedlingAnchor,floraTraceAnchor,drawFloraTrace,floraVisualAnchor} from './flora.js';
import {drawSceneLandmarkBackdrop,drawSceneLandmarkForeground} from './landmarks.js';
import {drawTerrainMotifBackdrop,drawTerrainMotifForeground} from './terrain-motifs.js';
import {drawTrafficGround} from './traffic-ground-art.js';
import {habitatIdentityAt,riverIdentityAt,drawSeasonalGround,terrainPaletteAt,terrainGrainAt} from './identity.js';
import {collectRegionalFocals,drawRegionalFocalBackdrop,drawRegionalFocalForeground} from './regional-focal.js';
import {collectHabitatTransitions,focalApproachFor,drawHabitatTransition,drawFocalApproach} from './wayfinding.js';
import {visualHierarchyAt,foregroundAlphaFor} from './hierarchy.js';

const CARDINAL=[[0,-1],[1,0],[0,1],[-1,0]];
const DIR8=[{x:0,y:-1},{x:1,y:-1},{x:1,y:0},{x:1,y:1},{x:0,y:1},{x:-1,y:1},{x:-1,y:0},{x:-1,y:-1}];
const GAIT=[0,1,2,1,0,-1,-2,-1];
const BODY_BOB=[0,-1,-1,0,0,1,1,0];
const SWAY=[-1,0,1,1,0,-1,-1,0];

const TERRAIN_POOL_MAX=4096;// spare terrain tile canvases kept for reuse (32x32, 4 KB each)
export const TERRAIN_POOL={enabled:true};// ?tilePool=0 allocates a new canvas per tile, as before
export class Renderer{
  constructor(canvas,sim,{terrainOnly=false}={}){this.partExpressions=new PartExpressionTracker();this.landformMaskCache=new Map();this.habitatField=null;this.habitatFieldDay=-1;this.pendingHabitatDay=null;this.pendingHabitatFrames=0;this.habitatMaskCache=new Map();this.landBaseTileCache=new Map();this.waterBaseTileCache=new Map();this.staticLandTileCache=new Map();this.terrainChunkCache=new Map();this.terrainRefreshQueue=[];this.terrainRefreshQueued=new Set();this.terrainRefreshFrame=0;this.macroHabitatSeed=null;this.macroHabitatSeason=-1;this.habitatScenesKey='';this.guideTarget=null;this.canvas=canvas;this.ctx=canvas.getContext('2d');this.ctx.imageSmoothingEnabled=false;this.sim=sim;this.motionSim=sim;this.motion=new VisualMotionTracker({simHz:CFG.simHz});this.renderNow=performance.now();this.lastRenderNow=this.renderNow;this.zoom=2;this.camera={x:64,y:64};this.playerPresentation={input:null,aheadSeconds:0};this.playerVisual=null;this.cameraReady=false;this.habitatScenes=[];this.regionalFocals=[];this.habitatTransitions=[];this.focalApproaches=new Map();if(terrainOnly){canvas.width=canvas.height=this.w=this.h=1;this.ctx.imageSmoothingEnabled=false}else{this.resize();addEventListener('resize',()=>this.resize())}}
  // v1.32.5: a new or loaded world replaces the title-screen world. Every cache keyed only by
  // tile position belongs to the old world: without this, tiles that were land there drew as
  // flat land with a stepped bank in the new world's water, and the reverse showed phantom water.
  // A terrain-only renderer for a neighbouring region's presentation World.
  prepareTerrainOnly(){this.habitatField=buildSmoothedHabitatField(this.sim.world);this.habitatFieldDay=this.sim.day;this.terrainSeason=this.sim.seasonIndex;this.sceneShown=true;this.motionSim=this.sim}
  continueRegionalScene(previous,next){return continueRegionalScene(this,previous,next,Renderer)}
  // underground: a passage was dug, collapsed or its air changed. Surface water and the per-world
  // regional focals cannot change that way (underground code only reads surface water), so their
  // caches survive; rebuilding them on every dig was a main cause of walking stalls (2026-10-23).
  resetWorldCaches({keepTerrain=false,underground=false}={}){this.visibleWorldPages=[];this.visiblePlantTargets=new Map();this.plantTargetWorld=this.sim.world;this.partExpressions.reset();this.feeding?.reset();this.headAttention?.reset();this.turnState?.clear();this.vegLayerCache?.clear?.();this.staticGroundTileCache?.clear?.();this.waterToneCache?.clear?.();this.habitatField=null;this.habitatFieldDay=-1;this.pendingHabitatDay=null;this.pendingHabitatFrames=0;if(!underground)this.macroHabitatSeed=null;this.habitatScenesKey='';if(!keepTerrain)this.terrainChunkCache.clear();this.sensoryFogCache=null;this.terrainRefreshQueue.length=0;this.terrainRefreshQueued.clear();this.terrainRefreshFrame=0;this.terrainChunkWork=null;if(!underground)this.landformMaskCache.clear();this.habitatMaskCache.clear();this.landBaseTileCache.clear();this.waterBaseTileCache.clear();this.staticLandTileCache.clear()}
  resize(){const dpr=1,w=innerWidth,h=innerHeight; // Pixel-art canvas renders at CSS-pixel resolution; DOM UI stays device-sharp and high-DPI screens avoid 2-4x canvas fill cost.
this.canvas.width=Math.floor(w*dpr);this.canvas.height=Math.floor(h*dpr);this.canvas.style.width=w+'px';this.canvas.style.height=h+'px';this.ctx.setTransform(dpr,0,0,dpr,0,0);this.w=w;this.h=h;this.ctx.imageSmoothingEnabled=false}
  setPlayerPresentation(input,aheadSeconds=0){this.playerPresentation={input:input?{...input}:null,aheadSeconds:Math.max(0,Number(aheadSeconds)||0)}}
  screenToWorld(clientX,clientY){const rect=this.canvas.getBoundingClientRect();if(!rect.width||!rect.height)return null;const sx=(clientX-rect.left)*(this.w/rect.width),sy=(clientY-rect.top)*(this.h/rect.height),tile=CFG.tileSize*this.zoom;return{x:this.camera.x+(sx-this.w/2)/tile,y:this.camera.y+(sy-this.h/2)/tile}}
  // Phase 3L: the start of every frame (world switch, habitat field, macro habitat, camera, view range), shared by
  // render() and prepareScene() so preparation sees exactly the state the first frame will draw. Moved verbatim.
  syncScene(renderDt){if(this.subsurfaceRevision!==this.sim.world.subsurface?.revision){this.subsurfaceRevision=this.sim.world.subsurface?.revision;this.resetWorldCaches({keepTerrain:this.motionSim===this.sim,underground:this.motionSim===this.sim})}if(this.motionSim!==this.sim){this.motion.clear();this.borderTerrain?.reset();this.motionSim=this.sim;this.cameraReady=false;this.resetWorldCaches()}if(this.habitatFieldDay!==this.sim.day){const initial=!this.habitatField;if(initial){this.terrainSeason=this.sim.seasonIndex;this.terrainRefreshAt=this.renderNow;this.habitatField=buildSmoothedHabitatField(this.sim.world);this.habitatMaskCache.clear();this.recycleTileCache(this.landBaseTileCache);this.recycleTileCache(this.staticLandTileCache);this.habitatScenesKey='';this.habitatFieldDay=this.sim.day;this.pendingHabitatDay=null;this.pendingHabitatFrames=0}else if(this.pendingHabitatDay!==this.sim.day){this.pendingHabitatDay=this.sim.day;this.pendingHabitatFrames=4}else if(this.pendingHabitatFrames>0)this.pendingHabitatFrames--;
      // v1.57.2: the whole visible terrain is repainted at most every 20 seconds or when the season turns,
      // not every in-game day (a day is a few seconds, so wide windows were repainting constantly). Plants
      // next to the active creature are drawn live every frame, so nearby food is always current.
      else if(this.sim.seasonIndex===this.terrainSeason&&this.renderNow-(this.terrainRefreshAt||0)<20000)this.pendingHabitatFrames=30;
      else{this.terrainSeason=this.sim.seasonIndex;this.terrainRefreshAt=this.renderNow;this.habitatField=buildSmoothedHabitatField(this.sim.world);this.habitatMaskCache.clear();this.recycleTileCache(this.landBaseTileCache);this.recycleTileCache(this.staticLandTileCache);this.habitatScenesKey='';this.habitatFieldDay=this.sim.day;this.pendingHabitatDay=null}}const macroSeed=this.sim.world?.seedHash;if(this.macroHabitatSeed!==macroSeed){this.regionalFocals=collectRegionalFocals(this.sim,this.habitatField);this.habitatTransitions=collectHabitatTransitions(this.sim.world,this.habitatField);this.focalApproaches=new Map(this.regionalFocals.map(f=>[`${f.regionX},${f.regionY}`,focalApproachFor(this.sim.world,f,this.habitatField)]));this.macroHabitatSeed=macroSeed;this.macroHabitatSeason=this.sim.seasonIndex;this.waterBaseTileCache.clear()}else if(this.macroHabitatSeason!==this.sim.seasonIndex){this.macroHabitatSeason=this.sim.seasonIndex;this.waterBaseTileCache.clear()}const p=this.sim.player();if(p){const predicted=predictPlayerPose(this.sim,this.playerPresentation.input,this.playerPresentation.aheadSeconds),eased=this.motion.sample(p,this.sim.tickCount,this.renderNow,{hz:this.sim.playerAutonomy?CFG.simHz:CFG.controlHz,response:'linear',snap:!!predicted?.moving}),vp=predicted?.moving?predicted:eased;this.playerVisual=vp;if(!this.cameraReady){this.camera.x=vp.x;this.camera.y=vp.y;this.cameraReady=true}else{const follow=1-Math.exp(-CFG.cameraFollowHz*renderDt);this.camera.x+=(vp.x-this.camera.x)*follow;this.camera.y+=(vp.y-this.camera.y)*follow;const maxLag=.055,dx=vp.x-this.camera.x,dy=vp.y-this.camera.y,d=Math.hypot(dx,dy);if(d>maxLag){this.camera.x=vp.x-dx/d*maxLag;this.camera.y=vp.y-dy/d*maxLag}}}else this.playerVisual=null;const tile=CFG.tileSize*this.zoom;clampCameraToWorld(this.camera,this.sim.world.n,this.w,this.h,tile,{open:!!this.sim.world.planet});const cols=Math.ceil(this.w/tile)+2,rows=Math.ceil(this.h/tile)+2,startX=Math.floor(this.camera.x-cols/2),startY=Math.floor(this.camera.y-rows/2);return{tile,cols,rows,startX,startY}}
  // Phase 3L start-up: prepare the first visible scene before it is shown. Building every visible terrain chunk in
  // the first frame blocked the page for 1.0-1.3 s. Each call builds missing visible chunks, nearest first, until
  // budgetMs is spent, through the same cache render() uses (buildTerrainChunk), and returns true once the next
  // render() will find every visible chunk prepared. The canvas shows the scene's own background meanwhile, never
  // a partial scene. The simulation keeps running; render() itself still builds anything missing, so callers that
  // never prepare (tests, tools) are unchanged.
  prepareScene(budgetMs=24){const t0=performance.now();this.renderNow=t0;const v=this.syncScene(0),size=TERRAIN_CHUNK;this.cameraReady=false;/* the first real frame snaps the camera exactly as it would without preparation */
    if(!this.preparingScene){this.preparingScene=true;this.ctx.fillStyle='#09140e';this.ctx.fillRect(0,0,this.w,this.h)}
    const minCx=Math.floor((v.startX-1)/size),maxCx=Math.floor((v.startX+v.cols+1)/size),minCy=Math.floor((v.startY-1)/size),maxCy=Math.floor((v.startY+v.rows+1)/size),cx0=this.camera.x/size,cy0=this.camera.y/size,todo=[];
    for(let cy=minCy;cy<=maxCy;cy++)for(let cx=minCx;cx<=maxCx;cx++){if(cx<0||cy<0||cx*size>=CFG.worldSize||cy*size>=CFG.worldSize)continue;const sig=this.terrainChunkSignature(cx,cy,size),e=this.terrainChunkCache.get(`${cx},${cy},${size}`);if(e?.sig!==sig)todo.push({cx,cy,sig,d:Math.hypot(cx+.5-cx0,cy+.5-cy0)})}
    todo.sort((p,q)=>p.d-q.d);for(const j of todo){if(performance.now()-t0>=budgetMs)return false;this.buildTerrainChunk(j.cx,j.cy,size,j.sig)}
    this.preparingScene=false;return true}
  // Start-up preparation driven by the game loop: a world install calls beginScenePreparation(); renderOrPrepare()
  // then prepares (bounded per frame) until the first scene is complete and renders normally from the next frame;
  // sceneReady() resolves once that first complete frame has been drawn.
  beginScenePreparation(){this.scenePending=true;this.preparingScene=false;this.sceneShown=false;this.sceneReadyPromise=new Promise(r=>{this.resolveSceneReady=r})}
  sceneReady(){return this.sceneReadyPromise||Promise.resolve()}
  renderOrPrepare(budgetMs=24){if(this.scenePending){if(this.prepareScene(budgetMs))this.scenePending=false;return}this.render();if(!this.sceneShown)this.sceneShown=true;if(this.resolveSceneReady){const resolve=this.resolveSceneReady;this.resolveSceneReady=null;resolve()}}
  render(){beginTintFrame();this.renderNow=performance.now();(this.encounters||=new EncounterPresentation()).beginFrame(this.sim,this.renderNow);const renderDt=Math.min(.05,Math.max(0,(this.renderNow-this.lastRenderNow)/1000));this.lastRenderNow=this.renderNow;const c=this.ctx,{tile,cols,rows,startX,startY}=this.syncScene(renderDt);c.fillStyle='#09140e';c.fillRect(0,0,this.w,this.h);
    prepareSensoryFog(this,{tile,cols,rows,startX,startY});
    this.drawTerrainChunks(tile,startX,startY,cols,rows);this.queueTerrainWarmRing(startX,startY,cols,rows);
    if(this.sim.world.planet)(this.borderTerrain||=new BorderTerrain(Renderer)).draw(this,tile,startX,startY,cols,rows);
    this.groundPassOnly=true;try{
    const focus=this.sim.player();for(let sy=0;sy<rows;sy++)for(let sx=0;sx<cols;sx++){const wx=startX+sx,wy=startY+sy;if(wx<0||wy<0||wx>=CFG.worldSize||wy>=CFG.worldSize)continue;const i=this.sim.world.pages?this.sim.world.pages.indexAt(wx,wy):this.sim.world.idx(wx,wy),px=Math.round((wx-this.camera.x)*tile+this.w/2),py=Math.round((wy-this.camera.y)*tile+this.h/2),nearFocus=!!focus&&Math.hypot((wx+.5)-focus.x,(wy+.5)-focus.y)<3.55;if(nearFocus)this.drawTile(px,py,tile,i,wx,wy);else this.drawTileDynamic(px,py,tile,i,wx,wy)}
    }finally{this.groundPassOnly=false}
    // Multi-tile habitat scenes summarize real ecology (water, biomass, use history) without creating game state.
    const sceneEpoch=Math.floor(this.sim.tickCount/Math.max(1,CFG.simHz)),sceneKey=`${startX},${startY},${cols},${rows},${sceneEpoch}`;if(sceneKey!==this.habitatScenesKey){this.habitatScenes=collectHabitatScenes(this.sim,this.habitatField,{startX,startY,cols,rows,block:8});this.habitatScenesKey=sceneKey}
    // Live layers are drawn only where the creature senses (view-modes.js);
    // the fog then shows plain terrain, dimmed, everywhere else.
    {const clipped=clipToSensed(this,tile,{vegetation:true});this.drawHabitatTransitions(tile,startX,startY,cols,rows);this.drawHabitatScenes(tile);this.drawRegionalFocalApproaches(tile);this.drawRegionalFocals(tile);if(clipped)this.ctx.restore()}
    // Snow is daily climate state. Composite over cached terrain, beneath
    // living flora; never freeze snow art into old seasonal chunk caches.
    this.drawSnowWindow(tile,startX,startY,cols,rows);
    {const clipped=clipToSensed(this,tile,{vegetation:true});this.drawTerrainChunks(tile,startX,startY,cols,rows,true);this.borderTerrain?.draw(this,tile,startX,startY,cols,rows,true);this.drawLiveVegetationWindow(tile);if(clipped)this.ctx.restore()}
    this.iceDrawCount=drawSurfaceIce(this,{tile,startX,startY,cols,rows});
    // Organic remains are an actual selectable resource, above floor and vegetation.
    {const carrionClip=clipToSensed(this,tile);for(let sy=0;sy<rows;sy++)for(let sx=0;sx<cols;sx++){const x=startX+sx,y=startY+sy;if(x<0||y<0||x>=this.sim.world.n||y>=this.sim.world.n)continue;const i=this.sim.world.idx(x,y);if(!this.sim.world.water[i]&&this.sim.world.carrion[i]>.08)this.drawCarrion(Math.round((x-this.camera.x)*tile+this.w/2),Math.round((y-this.camera.y)*tile+this.h/2),this.zoom,this.sim.world.carrion[i])}if(carrionClip)this.ctx.restore()}
    if(this.sim.cognition?.showOverlay)this.drawMemoryOverlay(tile);
    if(this.sim.territory?.showOverlay)this.drawTerritoryOverlay(tile);
    if(this.sim.migration?.showOverlay)this.drawMigrationOverlay(tile);
    if(this.guideTarget&&!this.sim.uiTutorialStage?.startsWith('step-'))this.drawGuide(tile);
    {const clipped=clipToSensed(this,tile);this.drawStalkerDens(tile);if(clipped)this.ctx.restore()}
    this.drawShelters(tile);
    this.drawFamilyGuidance(tile);
    // Phase G: places in the world, under the creatures.
    {const clipped=clipToSensed(this,tile);this.drawSites(tile,cols,rows);
    this.drawEggs(tile);drawWorldTraces(this,tile);if(clipped)this.ctx.restore()}
    drawSubsurface(this,tile);this.screenPos=new Map();this.screenBounds=new Map();this.screenBoundsWorld=this.sim.world;this.regionalScreenPos=new Map();
    const observer=this.sim.player(),playerView=observer&&this.sim.sensoryFogEnabled===true?creatureView(this.sim,observer):null;
     // Cull geographically first, then apply the same biological sight model
     // used by the fog and pointer targets. Do not recalculate anatomy for each
     // distant creature in a large living ecosystem.
     const visible=this.sim.animals.filter(a=>a.alive&&
       !!a.underground===!!observer?.underground&&
       Math.abs(a.x-this.camera.x)<cols/2+2&&Math.abs(a.y-this.camera.y)<rows/2+2&&
       visuallyObservable(this.sim,observer,a,8,playerView)).sort((a,b)=>a.y-b.y);this.visibleAnimals=visible;
    const regional=visibleRegionalFauna(this.sim,this.borderTerrain);this.regionalFauna=regional;
    const actors=regional.length?[...visible.map(actor=>({actor,y:actor.y})),...regional].sort((a,b)=>a.y-b.y):visible,draw=regional.length?(entry=>entry.owner?drawRegionalAnimal(this,entry,tile):this.drawAnimal(entry.actor,tile)):(actor=>this.drawAnimal(actor,tile));
    if(!this.lowDetail&&!this.sim.player()?.underground){this.drawForegroundHabitat(tile,startX,startY,cols,rows);this.drawHabitatSceneForeground(tile);this.drawRegionalFocalForeground(tile);this.drawSceneDepthForeground(tile)}
    // Phase 3L: creatures are prepared through a recording context and composed afterwards in the same order, so
    // freshly drawn sprites are staged together (genvo-draw.js SPRITE_BATCH). frameStats are timing only.
    {const t0=performance.now(),fs=this.frameStats||={};fs.creatures=actors.length;
     if(SPRITE_BATCH.enabled){const rec=this.creatureRecorder||=new CanvasRecorder();rec.onFlush=spriteBatchBeforeFlush;rec.afterFlush=spriteBatchAfterFlush;const real=this.ctx;this.ctx=rec.begin(real);beginSpriteBatch(()=>rec.flush());let t1=t0;
       try{for(const entry of actors)draw(entry)}finally{this.ctx=real;t1=performance.now();try{rec.flush()}finally{endSpriteBatch()}}fs.creaturePrep=t1-t0;fs.creatureCompose=performance.now()-t1;fs.recorderFlushes=rec.stats.flushes}
     else{for(const entry of actors)draw(entry);fs.creaturePrep=performance.now()-t0;fs.creatureCompose=0}}
    // Weather and interaction cues remain above creatures; ground decoration does not.
    if((!this.lowDetail||this.sim.visibilityRules===VISIBILITY.policy||this.sim.thermalRules===THERMAL_WEATHER.policy)&&!this.sim.player()?.underground)this.drawWeatherOverlay();
    drawSensoryFog(this,{tile,cols,rows,startX,startY});
    beginReadoutFrame(this);if(this.guideTarget&&this.sim.uiTutorialStage?.startsWith('step-'))this.drawGuide(tile);drawWeatherReadout(this);drawRefugeReadout(this);drawCaveProgress(this);
    this.drawPlayerAnchor(tile);if(!this.sim.player()?.underground){drawFlightWind(this.ctx,this.sim,this.screenPos?.get(this.sim.playerId),{renderer:this});this.drawRelativeMarks(tile);this.drawReadabilityCues(tile)}this.motion.prune(this.sim.tickCount);this.processTerrainRefreshQueue();}


  // v1.33.5: which relatives are carrying out your Family Command (solid gold pip) and which
  // are acting on their own (faint hollow ring). Only relatives on screen near you are marked.
  drawRelativeMarks(tile){
    const p=this.sim.player(),pos=this.screenPos;if(!p||!pos)return;const c=this.ctx,lift=Math.max(9,tile*.55);
    for(const a of this.visibleAnimals||[]){
      if(a===p||!a.alive||!a.lineage||a.species!=='genvo'||this.sim.family?.isDependent?.(a))continue;if(Math.hypot(a.x-p.x,a.y-p.y)>14)continue;
      const q=pos.get(a.id);if(!q)continue;const following=String(a.intent||'').startsWith('family-');c.save();c.translate(q.x,q.y-lift);
      if(following){c.fillStyle='rgba(236,206,112,.95)';c.strokeStyle='rgba(20,22,14,.8)';c.lineWidth=1;c.beginPath();c.moveTo(-3.5,-2);c.lineTo(3.5,-2);c.lineTo(0,2.5);c.closePath();c.fill();c.stroke()}
      else{c.strokeStyle='rgba(214,224,200,.55)';c.lineWidth=1;c.beginPath();c.arc(0,0,2.2,0,Math.PI*2);c.stroke()}
      c.restore();
    }
  }
  drawFamilyGuidance(tile){
    const status=this.sim.familyDirectives?.guidanceMarks?.();if(!status||(!status.order&&!status.avoid?.length))return;const c=this.ctx,pulse=.5+.5*Math.sin(this.renderNow/210),toScreen=(x,y)=>({x:Math.round((x-this.camera.x)*tile+this.w/2),y:Math.round((y-this.camera.y)*tile+this.h/2)});
    for(const zone of status.avoid||[]){const q=toScreen(zone.x,zone.y),r=zone.radius*tile;c.save();c.strokeStyle=`rgba(220,111,91,${(.32+pulse*.12).toFixed(3)})`;c.lineWidth=1.5;c.setLineDash([5,7]);c.beginPath();c.arc(q.x,q.y,r,0,Math.PI*2);c.stroke();c.setLineDash([]);c.translate(q.x,q.y);c.strokeStyle='rgba(240,143,123,.84)';c.lineWidth=2;c.beginPath();c.moveTo(-6,-6);c.lineTo(6,6);c.moveTo(6,-6);c.lineTo(-6,6);c.stroke();c.restore()}
    const order=status.order;if(!order)return;const q=toScreen(order.x,order.y),tone=order.type==='forage'?'rgba(170,213,117,.88)':order.type==='scout'?'rgba(110,205,221,.88)':'rgba(230,205,116,.88)';c.save();c.translate(q.x,q.y);c.strokeStyle=tone;c.lineWidth=2;c.setLineDash([4,4]);c.beginPath();c.arc(0,0,12+pulse*2,0,Math.PI*2);c.stroke();c.setLineDash([]);c.fillStyle='rgba(8,14,10,.58)';c.beginPath();for(let i=0;i<8;i++){const a=Math.PI/8+i*Math.PI/4,r=i%2?9:11,x=Math.cos(a)*r,y=Math.sin(a)*r;i?c.lineTo(x,y):c.moveTo(x,y)}c.closePath();c.fill();c.strokeStyle=tone;c.lineWidth=1.5;
    if(order.type==='gather'){for(const [x,y] of [[0,-3],[-4,3],[4,3]]){c.beginPath();c.arc(x,y,2,0,Math.PI*2);c.stroke()}}
    else if(order.type==='forage'){c.beginPath();c.moveTo(-5,4);c.quadraticCurveTo(-2,-6,6,-5);c.quadraticCurveTo(5,3,-5,4);c.stroke();c.beginPath();c.moveTo(-4,4);c.lineTo(4,-4);c.stroke()}
    else if(order.type==='scout'){c.beginPath();c.ellipse(0,0,6,3.8,0,0,Math.PI*2);c.stroke();c.beginPath();c.arc(0,0,1.7,0,Math.PI*2);c.stroke()}
    else if(order.type==='nest'){c.beginPath();c.moveTo(-6,2);c.lineTo(0,-5);c.lineTo(6,2);c.moveTo(-4,1);c.lineTo(-4,6);c.lineTo(4,6);c.lineTo(4,1);c.stroke()}
    c.restore();
  }

  drawWeatherOverlay(){
    const atmosphereDrawn=drawAtmosphere(this);
    drawThermalWeather(this);drawThunderstorms(this);drawWildfire(this);
    if(atmosphereDrawn)return;
    const climate=this.sim.climate;if(!climate)return;const c=this.ctx,rain=Math.max(0,Math.min(1,(climate.rain-.30)/.42)),cold=Math.max(0,Math.min(1,(.43-climate.temp)/.18));
    if(rain>.02){
      c.save();c.fillStyle=`rgba(14,28,38,${(.035+rain*.07).toFixed(3)})`;c.fillRect(0,0,this.w,this.h);
      c.strokeStyle=`rgba(168,202,215,${(.18+rain*.34).toFixed(3)})`;c.lineWidth=1;const count=Math.round(26+rain*72),t=Math.floor(this.renderNow/24);
      for(let i=0;i<count;i++){const x=((i*97+t*5)%(this.w+90))-45,y=((i*53+t*11)%(this.h+70))-35,len=5+Math.floor((i*17)%7)+rain*7;c.beginPath();c.moveTo(x,y);c.lineTo(x-3-rain*3,y+len);c.stroke()}
      c.restore();
    }
    if(cold>.04){c.save();c.fillStyle=`rgba(105,136,153,${(cold*.035).toFixed(3)})`;c.fillRect(0,0,this.w,this.h);c.restore()}
  }




  drawPlayerAnchor(tile){
    const p=this.sim.player();if(!p)return;const c=this.ctx,visual=this.playerVisual||this.motion.sample(p,this.sim.tickCount,this.renderNow,{hz:this.sim.playerAutonomy?CFG.simHz:CFG.controlHz,response:'linear'}),x=Math.round((visual.x-this.camera.x)*tile+this.w/2),y=Math.round((visual.y-this.camera.y)*tile+this.h/2),pulse=(Math.sin(this.renderNow/180)+1)*.5;
    c.save();
    // Dark backing keeps the same gold identity readable on land and water.
    const radius=Math.max(12,10*this.zoom)+pulse;
    c.beginPath();for(let quadrant=0;quadrant<4;quadrant++){const start=quadrant*Math.PI/2+Math.PI/8;c.moveTo(x+Math.cos(start)*radius,y+Math.sin(start)*radius);c.arc(x,y,radius,start,start+Math.PI/4)}
    c.strokeStyle='rgba(9,19,13,.92)';c.lineWidth=4.5;c.stroke();
    c.strokeStyle='rgba(255,224,139,.96)';c.lineWidth=2;c.stroke();
    const lift=Math.max(25,25*this.zoom);c.beginPath();c.moveTo(x-4,y-lift-6);c.lineTo(x+4,y-lift-6);c.lineTo(x,y-lift);c.closePath();c.fillStyle='#ffe08b';c.fill();c.strokeStyle='#19251b';c.lineWidth=1.5;c.stroke();
    c.restore();
  }

  drawReadabilityCues(tile){
    const p=this.sim.player();if(!p)return;const c=this.ctx,spec=SPECIES[p.species];
    const waterRatio=p.hydration/spec.maxHydration,energyRatio=p.energy/spec.maxEnergy;
    if(waterRatio<.72){const water=this.sim.world.nearestDrinkable(p.x,p.y,6*(partEffectFactors(p)?.cue??1));if(water)this.drawWorldCue(water.x,water.y,tile,'water','WATER')}
    if(energyRatio<.72){const food=nearbyFood(this.sim,p,6*(partEffectFactors(p)?.cue??1));if(food)this.drawWorldCue(food.x,food.y,tile,'food',food.label)}
    const threat=nearestThreat(this.sim,p,10*(partEffectFactors(p)?.threatSense??1));if(threat&&visuallyObservable(this.sim,p,threat.animal)){
      const x=Math.round((threat.animal.x-this.camera.x)*tile+this.w/2),y=Math.round((threat.animal.y-this.camera.y)*tile+this.h/2),safe=this.sim.isOpeningProtected?.(p);
      c.save();c.strokeStyle=safe?'rgba(236,191,109,.90)':'rgba(239,105,94,.98)';c.lineWidth=2;c.beginPath();c.moveTo(x,y-18);c.lineTo(x-6,y-10);c.lineTo(x+6,y-10);c.closePath();c.stroke();
      c.restore();
    }
  }
  drawWorldCue(x,y,tile,kind,label){
    if(!visuallyObservable(this.sim,this.sim.player(),{x,y}))return;
    const c=this.ctx,px=Math.round((x-this.camera.x)*tile+this.w/2),py=Math.round((y-this.camera.y)*tile+this.h/2),pulse=5+Math.sin(performance.now()/220)*1.5;
    c.save();c.strokeStyle=kind==='water'?'rgba(111,211,235,.92)':'rgba(176,222,116,.92)';c.lineWidth=2;c.beginPath();c.arc(px,py,pulse,0,Math.PI*2);c.stroke();
    c.restore();
  }

  drawGuide(tile){
    const p=this.sim.player(),t=this.guideTarget;if(!p||!t)return;const c=this.ctx;
    const px=v=>Math.round((v-this.camera.x)*tile+this.w/2),py=v=>Math.round((v-this.camera.y)*tile+this.h/2),ax=px(p.x),ay=py(p.y),tx=px(t.x),ty=py(t.y);
    c.save();c.strokeStyle='rgba(239,211,120,.72)';c.lineWidth=2;c.setLineDash([5,5]);c.beginPath();c.moveTo(ax,ay);c.lineTo(tx,ty);c.stroke();c.setLineDash([]);
    const pulse=8+Math.sin(performance.now()/180)*2;c.strokeStyle='rgba(245,225,150,.95)';c.beginPath();c.arc(tx,ty,pulse,0,Math.PI*2);c.stroke();
    c.fillStyle='rgba(245,225,150,.92)';c.fillRect(tx-2,ty-2,4,4);
    if(this.sim.uiTutorialStage?.startsWith('step-')){
      const water=t.label==='Water',ink=water?'#a7e7ed':'#f4dc85',r=Math.max(13,Math.round(tile*.6)),x=Math.round(tx),y=Math.round(ty);
      c.strokeStyle='#07120c';c.lineWidth=5;c.strokeRect(x-r,y-r,r*2,r*2);c.strokeStyle=ink;c.lineWidth=2;c.strokeRect(x-r,y-r,r*2,r*2);
      const text=t.label||'Target';c.font='bold 13px Verdana,sans-serif';const width=Math.ceil(c.measureText(text).width)+18,constraints=readoutScreenConstraints(this),placed=chooseOverlayPlacement({width,height:23,viewport:{left:0,top:0,right:this.w,bottom:this.h},preferred:{left:x-width/2,top:y-r-27},protectedRects:[...constraints.protectedRects,{left:x-r,top:y-r,right:x+r,bottom:y+r}],obstacles:constraints.obstacles}),left=placed.left,top=placed.top;reserveReadout(this,placed);
      c.fillStyle='#102017';c.fillRect(Math.round(left),Math.round(top),width,23);c.strokeStyle=ink;c.lineWidth=1;c.strokeRect(Math.round(left)+.5,Math.round(top)+.5,width-1,22);c.fillStyle=ink;c.textAlign='center';c.textBaseline='middle';c.fillText(text,Math.round(left+width/2),Math.round(top+12));
    }
    c.restore();
  }

  drawMigrationOverlay(tile){
    const active=this.sim.player();if(!active)return;const snap=this.sim.migration.snapshot(active),rec=snap?.recommendation;if(!rec)return;
    const target=snap.target||rec.target,home=rec.home,c=this.ctx;if(!target||!home)return;
    const px=v=>Math.round((v-this.camera.x)*tile+this.w/2),py=v=>Math.round((v-this.camera.y)*tile+this.h/2);
    const ax=px(active.x),ay=py(active.y),tx=px(target.x),ty=py(target.y),hx=px(home.x),hy=py(home.y);
    c.save();c.lineWidth=2;c.setLineDash([6,4]);c.strokeStyle='rgba(102,217,239,.80)';c.beginPath();c.moveTo(ax,ay);c.lineTo(tx,ty);c.stroke();c.setLineDash([]);
    c.strokeStyle='rgba(245,242,207,.92)';c.strokeRect(tx-7,ty-7,14,14);c.fillStyle='rgba(224,190,117,.9)';c.fillRect(hx-3,hy-3,6,6);
    c.fillStyle='rgba(102,217,239,.85)';c.fillRect(tx-2,ty-2,4,4);c.restore();
  }

  drawStalkerDens(tile){
    const sites=this.sim.stalkerTerritory?.activeSites?.()||[];if(!sites.length)return;
    const c=this.ctx,s=this.zoom;
    for(const den of sites){
      const px=Math.round((den.x-this.camera.x)*tile+this.w/2),py=Math.round((den.y-this.camera.y)*tile+this.h/2);
      if(px<-tile||py<-tile||px>this.w+tile||py>this.h+tile)continue;
      const abandoned=den.abandonedTick!=null,age=abandoned?(this.sim.tickCount-den.abandonedTick)/(CFG.dayTicks*6):0,alpha=abandoned?Math.max(.16,.62*(1-age)):1;
      const active=this.sim.player(),nearKnown=!!(!abandoned&&den.known&&active&&Math.hypot(active.x-den.x,active.y-den.y)<=den.radius+6);
      if(nearKnown){const r=den.radius*tile;c.save();c.strokeStyle='rgba(171,112,83,.48)';c.lineWidth=1.5;for(let k=0;k<4;k++){const a=k*Math.PI/2+.35,ex=px+Math.cos(a)*r,ey=py+Math.sin(a)*r,tx=-Math.sin(a)*5,ty=Math.cos(a)*5;c.beginPath();c.moveTo(ex-tx,ey-ty);c.lineTo(ex+tx,ey+ty);c.moveTo(ex-tx*.45-2,ey-ty*.45-2);c.lineTo(ex+tx*.45-2,ey+ty*.45-2);c.stroke()}c.restore()}
      c.save();c.translate(px,py);c.globalAlpha*=alpha;
      // A low ground scrape rather than a structure: dark packed soil, dragged vegetation,
      // scratch marks and (after successful feeding) a few pale remains.
      c.fillStyle='rgba(18,19,14,.34)';c.fillRect(-7*s,2*s,14*s,3*s);
      c.fillStyle='#4a3928';c.fillRect(-6*s,-1*s,12*s,4*s);c.fillStyle='#5c4730';c.fillRect(-4*s,-2*s,8*s,2*s);
      c.fillStyle='#30271d';c.fillRect(-5*s,0,3*s,s);c.fillRect(s,1*s,4*s,s);
      c.fillStyle='#8a7650';c.fillRect(-6*s,-4*s,s,4*s);c.fillRect(5*s,-3*s,s,3*s);c.fillRect(-2*s,-4*s,s,2*s);
      c.fillStyle='rgba(33,27,20,.82)';c.fillRect(-3*s,-1*s,s,4*s);c.fillRect(0,-2*s,s,4*s);c.fillRect(3*s,-1*s,s,3*s);
      if((den.feeds||0)>0){c.fillStyle='#c6b890';c.fillRect(4*s,-1*s,3*s,s);c.fillRect(5*s,-2*s,s,3*s);if(den.feeds>2)c.fillRect(-6*s,-1*s,2*s,s)}
      if(den.changed){c.fillStyle='rgba(111,83,52,.72)';c.fillRect(-7*s,-5*s,4*s,s);c.fillRect(3*s,-6*s,4*s,s);c.fillRect(-1*s,-6*s,s,4*s)}
      // Once the controlled lineage has actually read the scrape, tiny physical clues become
      // legible in the world instead of adding a HUD icon or exposing a genetics label.
      if(den.known){c.fillStyle='rgba(160,137,90,.80)';if(den.style==='rusher'){c.fillRect(-1*s,-7*s,s,5*s);c.fillRect(2*s,-6*s,s,4*s)}else if(den.style==='wary'){c.fillRect(-7*s,-5*s,2*s,s);c.fillRect(-3*s,-6*s,s,s);c.fillRect(1*s,-5*s,2*s,s)}else{c.fillRect(-8*s,-4*s,3*s,s);c.fillRect(5*s,-5*s,3*s,s)}}
      c.restore();
    }
  }

  drawEggs(tile){
    const c=this.ctx,s=Math.max(1,this.zoom*.75);
    // One physical nest per clutch; eggs use their existing positions above it.
    for(const nest of this.sim.nests||[]){
      const x=Math.round((nest.x-this.camera.x)*tile+this.w/2),y=Math.round((nest.y-this.camera.y)*tile+this.h/2)-(nest.layer==='canopy'?7*s:0);
      if(x<-tile||y<-tile||x>this.w+tile||y>this.h+tile)continue;
      c.save();c.translate(x,y);drawNestArt(c,nest,{scale:s});c.restore();
    }
    for(const egg of this.sim.eggs||[]){
      const x=Math.round((egg.x-this.camera.x)*tile+this.w/2),y=Math.round((egg.y-this.camera.y)*tile+this.h/2)-(this.sim.nests?.find(n=>n.id===egg.nestId)?.layer==='canopy'?7*s:0);
      if(x<-tile||y<-tile||x>this.w+tile||y>this.h+tile)continue;
      c.save();c.translate(x,y);drawEggArt(c,egg,{scale:s});c.restore();
    }
  }
  drawShelters(tile){
    const c=this.ctx,s=this.zoom;
    for(const project of this.sim.shelter?.activeProjects?.()||[]){
      const px=Math.round((project.x-this.camera.x)*tile+this.w/2),py=Math.round((project.y-this.camera.y)*tile+this.h/2);if(px<-tile||py<-tile||px>this.w+tile||py>this.h+tile)continue;
      const progress=Math.max(0,Math.min(1,(project.progress||0)/(project.required||1)));c.save();c.translate(px,py);c.fillStyle='rgba(26,22,15,.34)';c.fillRect(-8*s,4*s,16*s,2*s);c.strokeStyle='rgba(218,184,112,.74)';c.lineWidth=1.5;c.setLineDash([3,3]);c.beginPath();c.arc(0,0,10*s,0,Math.PI*2);c.stroke();c.setLineDash([]);c.strokeStyle='rgba(198,164,93,.92)';c.beginPath();c.moveTo(-6*s,3*s);c.lineTo(5*s,-4*s);c.moveTo(-4*s,-4*s);c.lineTo(6*s,3*s);c.stroke();c.strokeStyle='rgba(234,210,139,.92)';c.lineWidth=2;c.beginPath();c.arc(0,0,13*s,-Math.PI/2,-Math.PI/2+Math.PI*2*progress);c.stroke();c.restore();
    }
    for(const sh of this.sim.shelter?.shelters||[]){
      if(sh.integrity<=0)continue;
      const px=Math.round((sh.x-this.camera.x)*tile+this.w/2),py=Math.round((sh.y-this.camera.y)*tile+this.h/2);
      if(Math.abs(px)>this.w+tile||Math.abs(py)>this.h+tile)continue;
      c.save();
      c.translate(px,py);drawShelterArt(c,sh,{scale:s,seal:this.sim.shelter?.weatherSeal?.(sh)??.78,rain:shelterLiquidRain(this.sim,sh)});c.translate(-px,-py);
      if(this.sim.shelter.showOverlay){
        c.strokeStyle='rgba(224,190,117,.86)';c.lineWidth=2;c.setLineDash([4,3]);c.beginPath();c.arc(px,py,1.55*tile,0,Math.PI*2);c.stroke();c.setLineDash([]);
        const active=this.sim.player();const snap=active?this.sim.shelter.snapshot(active):null;
        if(snap?.exists&&snap.shelter.id===sh.id&&snap.intruder){const ix=Math.round((snap.intruder.x-this.camera.x)*tile+this.w/2),iy=Math.round((snap.intruder.y-this.camera.y)*tile+this.h/2);c.strokeStyle='rgba(240,116,104,.9)';c.strokeRect(ix-9,iy-9,18,18)}
      }
      c.restore();
    }
  }

  drawTerritoryOverlay(tile){
    const active=this.sim.player();if(!active)return;
    const snap=this.sim.territory.snapshot(active);if(!snap)return;
    const family=this.sim.expansion?.snapshot?.()||null,sustain=this.sim.sustainability?.snapshot?.()||null,sustainByKey=new Map((sustain?.cells||[]).map(cell=>[cell.key,cell])),c=this.ctx;
    c.save();
    if(family?.members>1){
      for(const cell of family.cells.slice(0,28)){
        const px=Math.round((cell.cx*this.sim.territory.cellSize-this.camera.x)*tile+this.w/2),py=Math.round((cell.cy*this.sim.territory.cellSize-this.camera.y)*tile+this.h/2),size=this.sim.territory.cellSize*tile;
        const alpha=Math.max(.025,Math.min(.105,cell.familiarity/32)),eco=sustainByKey.get(cell.key);
        if(eco?.score<.28)c.fillStyle=`rgba(190,101,78,${alpha+.025})`;else if(eco?.score<.48)c.fillStyle=`rgba(205,153,78,${alpha+.012})`;else if(eco?.score>.72)c.fillStyle=`rgba(154,190,111,${alpha})`;else c.fillStyle=`rgba(205,184,105,${alpha})`;
        c.fillRect(px,py,size,size);
      }
      if(family.scoutUnlocked){
        c.strokeStyle=family.scouting?'rgba(232,206,111,.58)':'rgba(205,184,105,.28)';c.lineWidth=1;c.setLineDash([2,4]);
        for(const cell of family.frontier.slice(0,10)){const px=Math.round((cell.cx*this.sim.territory.cellSize-this.camera.x)*tile+this.w/2),py=Math.round((cell.cy*this.sim.territory.cellSize-this.camera.y)*tile+this.h/2),size=this.sim.territory.cellSize*tile;c.strokeRect(px+2,py+2,Math.max(2,size-4),Math.max(2,size-4))}
        c.setLineDash([]);
      }
      for(const center of this.sim.generationProgress?.centers?.()||[]){
        const px=Math.round((center.x-this.camera.x)*tile+this.w/2),py=Math.round((center.y-this.camera.y)*tile+this.h/2),r=Math.max(6,Math.round(tile*.22)),eco=this.sim.populationEcology?.centerState?.(center)||null;
        const ecologyColor=eco?.status?.id==='critical'?'rgba(224,105,88,.94)':eco?.status?.id==='contested'?'rgba(224,169,82,.94)':eco?.status?.id==='strong'?'rgba(145,210,126,.94)':center.kind==='satellite-colony'?'rgba(219,188,111,.9)':'rgba(168,211,126,.9)';
        c.save();c.translate(px,py);c.lineWidth=2;c.strokeStyle=ecologyColor;c.setLineDash([3,3]);c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.stroke();c.setLineDash([]);if(eco){c.globalAlpha=.28;c.fillStyle=ecologyColor;c.beginPath();c.arc(0,0,Math.max(3,r-2),0,Math.PI*2);c.fill();c.globalAlpha=1}c.fillStyle='rgba(235,225,184,.9)';c.fillRect(-2,-2,4,4);c.restore();
      }
    }
    for(const cell of snap.cells.slice(0,12)){
      const px=Math.round((cell.cx*this.sim.territory.cellSize-this.camera.x)*tile+this.w/2),py=Math.round((cell.cy*this.sim.territory.cellSize-this.camera.y)*tile+this.h/2),size=this.sim.territory.cellSize*tile;
      const alpha=Math.max(.035,Math.min(.16,cell.familiarity/24));
      c.fillStyle=`rgba(126,190,160,${alpha})`;c.fillRect(px,py,size,size);
    }
    if(snap.home){
      const hx=Math.round((snap.home.x-this.camera.x)*tile+this.w/2),hy=Math.round((snap.home.y-this.camera.y)*tile+this.h/2);
      c.strokeStyle='rgba(126,210,181,.78)';c.lineWidth=2;c.setLineDash([5,4]);c.beginPath();c.arc(hx,hy,snap.home.radius*tile,0,Math.PI*2);c.stroke();
      c.strokeStyle='rgba(224,208,128,.74)';c.setLineDash([2,3]);c.beginPath();c.arc(hx,hy,snap.home.coreRadius*tile,0,Math.PI*2);c.stroke();c.setLineDash([]);
      c.fillStyle='rgba(224,232,211,.88)';c.fillRect(hx-2,hy-2,4,4);
    }
    if(snap.intruder){
      const ix=Math.round((snap.intruder.x-this.camera.x)*tile+this.w/2),iy=Math.round((snap.intruder.y-this.camera.y)*tile+this.h/2);
      c.strokeStyle='rgba(240,116,104,.9)';c.lineWidth=2;c.strokeRect(ix-7,iy-7,14,14);
    }
    c.restore();
  }
  drawMemoryOverlay(tile){
    const active=this.sim.player();if(!active)return;
    const snapshot=this.sim.cognition.snapshot(active),c=this.ctx;
    const mark=(memory,color,shape='box')=>{if(!memory)return;const px=Math.round((memory.x-this.camera.x)*tile+this.w/2),py=Math.round((memory.y-this.camera.y)*tile+this.h/2);c.save();c.strokeStyle=color;c.fillStyle=color;c.lineWidth=2;if(shape==='x'){c.beginPath();c.moveTo(px-5,py-5);c.lineTo(px+5,py+5);c.moveTo(px+5,py-5);c.lineTo(px-5,py+5);c.stroke()}else c.strokeRect(px-5,py-5,10,10);c.restore()};
    mark(snapshot.water,'#66d9ef');mark(snapshot.food,'#9dd56f');mark(snapshot.threat,'#ee6d68','x');
    const ax=Math.round((active.x-this.camera.x)*tile+this.w/2),ay=Math.round((active.y-this.camera.y)*tile+this.h/2);
    c.save();c.lineWidth=1;c.setLineDash([3,3]);for(const rel of snapshot.relations.slice(0,6)){const b=rel.animal,bx=Math.round((b.x-this.camera.x)*tile+this.w/2),by=Math.round((b.y-this.camera.y)*tile+this.h/2);c.strokeStyle=rel.relation==='mate'?'rgba(240,172,187,.7)':rel.relation==='sibling'?'rgba(173,202,255,.58)':'rgba(141,228,211,.6)';c.beginPath();c.moveTo(ax,ay);c.lineTo(bx,by);c.stroke()}c.setLineDash([]);c.restore();
  }
  drawSites(tile,cols,rows){
    const D=this.sim.discovery;if(!D?.sites?.length)return;const c=this.ctx,u=this.zoom;
    for(const site of D.sites){if(site.gone||Math.abs(site.x-this.camera.x)>cols/2+2||Math.abs(site.y-this.camera.y)>rows/2+2)continue;const px=Math.round((site.x-this.camera.x)*tile+this.w/2),py=Math.round((site.y-this.camera.y)*tile+this.h/2);drawSite(c,site,{px,py,u,found:D.isFound(site)})}
    // A lookout reveals every Stalker in sight for a while.
    if(D.revealUntil>this.sim.tickCount){c.save();c.strokeStyle='rgba(239,105,94,.95)';c.lineWidth=2;for(const h of this.sim.animals){if(!h.alive||!canHunt(h)||!visuallyObservable(this.sim,this.sim.player(),h,22))continue;const x=Math.round((h.x-this.camera.x)*tile+this.w/2),y=Math.round((h.y-this.camera.y)*tile+this.h/2);if(x<-20||y<-20||x>this.w+20||y>this.h+20)continue;c.beginPath();c.arc(x,y,9,0,Math.PI*2);c.stroke()}c.restore()}
  }
  drawSnowWindow(tile,startX,startY,cols,rows){
    const w=this.sim.world,depth=w.soilWater?.snowpack;
    beginSnowWindow(w,depth?Math.max(0,Math.min(w.n,startX+cols)-Math.max(0,startX))*Math.max(0,Math.min(w.n,startY+rows)-Math.max(0,startY)):0);
    if(!depth)return;const c=this.ctx;let drawn=0;
    for(let y=Math.max(0,startY);y<Math.min(w.n,startY+rows);y++)
      for(let x=Math.max(0,startX);x<Math.min(w.n,startX+cols);x++){
        const i=y*w.n+x;if(w.water[i]||depth[i]<.012)continue;
        const px=Math.round((x-this.camera.x)*tile+this.w/2),py=Math.round((y-this.camera.y)*tile+this.h/2);
        if(drawSnowGround(c,{world:w,x,y,px,py,tile,waterMask:this.visualWaterMask?.(x,y)}))drawn++;
      }
    return drawn;
  }
  drawTerrainChunks(tile,startX,startY,cols,rows,vegetation=false){
    this.visibleWorldPages=this.sim.world.pages?.window(startX,startY,cols,rows,{halo:1})||[];
    const size=TERRAIN_CHUNK,minCx=Math.floor((startX-1)/size),maxCx=Math.floor((startX+cols+1)/size),minCy=Math.floor((startY-1)/size),maxCy=Math.floor((startY+rows+1)/size),c=this.ctx;
    if(vegetation){const b=this.liveVegetationBounds(),left=(b.x0-this.camera.x)*tile+this.w/2,top=(b.y0-this.camera.y)*tile+this.h/2;c.save();if(b.active){c.beginPath();c.rect(0,0,this.w,this.h);c.rect(left,top,(b.x1-b.x0)*tile,(b.y1-b.y0)*tile);c.clip('evenodd')}}
    for(let cy=minCy;cy<=maxCy;cy++)for(let cx=minCx;cx<=maxCx;cx++){
      if(cx<0||cy<0||cx*size>=CFG.worldSize||cy*size>=CFG.worldSize)continue;
      const chunk=this.terrainChunk(cx,cy,size);const wx=cx*size,wy=cy*size,px=Math.round((wx-this.camera.x)*tile+this.w/2),py=Math.round((wy-this.camera.y)*tile+this.h/2);
      if(!chunk){if(!vegetation)this.drawPendingTerrainChunk(cx,cy,size,tile,px,py);continue}
      c.drawImage(vegetation?this.terrainChunkCache.get(`${cx},${cy},${size}`).vegetation:chunk,px,py,size*tile,size*tile)
    }
    if(vegetation)c.restore();
  }

  // A cold chunk should never compile its full native ground and plant art in
  // the middle of ordinary play. This brief fallback preserves land/water
  // readability until the bounded refresh queue installs the real chunk.
  // Prepared opening frames and direct (non-gameplay) render callers retain
  // the existing full-resolution construction path.
  drawPendingTerrainChunk(cx,cy,size,tile,px,py){
    const c=this.ctx,w=this.sim.world;
    // A cheap temporary indication of terrain type while its authored native
    // chunk is prepared. Variation prevents huge single-color rectangles on
    // camera movement; no biome assets are rewritten or approximated here.
    const land=['#536a4b','#52674a','#586d4e','#50664a'],water=['#416f76','#47757b','#436e79','#417179'];
    for(let ly=0;ly<size;ly++)for(let lx=0;lx<size;lx++){
      const x=cx*size+lx,y=cy*size+ly;
      if(x<0||y<0||x>=w.n||y>=w.n)continue;
      const wet=!!w.water[w.idx(x,y)],h=(hash2(x,y,103)*4294967295)>>>0,ix=px+lx*tile,iy=py+ly*tile;
      c.fillStyle=(wet?water:land)[h%4];c.fillRect(ix,iy,tile,tile);
      c.fillStyle=wet?'rgba(170,202,190,.11)':'rgba(182,194,144,.12)';
      const q=Math.max(1,Math.round(tile/16));
      c.fillRect(ix+((h>>>5)%11+2)*tile/16,iy+((h>>>9)%11+2)*tile/16,q*2,q);
      if((h&3)===0)c.fillRect(ix+((h>>>12)%9+3)*tile/16,iy+((h>>>16)%9+3)*tile/16,q,q);
    }
  }

  liveVegetationBounds(){const p=this.sim.player();return p?{active:true,x0:Math.max(0,Math.floor(p.x-4)),y0:Math.max(0,Math.floor(p.y-4)),x1:Math.min(this.sim.world.n,Math.ceil(p.x+4)),y1:Math.min(this.sim.world.n,Math.ceil(p.y+4))}:{active:false,x0:0,y0:0,x1:0,y1:0}}
  drawLiveVegetationWindow(tile){const b=this.liveVegetationBounds(),w=this.sim.world,c=this.ctx;for(let y=b.y0;y<b.y1;y++)for(let x=b.x0;x<b.x1;x++){const i=w.idx(x,y);if(w.water[i])continue;const px=Math.round((x-this.camera.x)*tile+this.w/2),py=Math.round((y-this.camera.y)*tile+this.h/2),h=visualHierarchyAt(w,x,y,{focusX:this.sim.player()?.x,focusY:this.sim.player()?.y,habitatField:this.habitatField}),v=this.vegetationLayer(i,x,y,h);if(v)c.drawImage(v,px-VEG_PAD*this.zoom,py-VEG_PAD*this.zoom,(16+2*VEG_PAD)*this.zoom,(16+2*VEG_PAD)*this.zoom);else this.drawVegetation(i,px,py,this.zoom,x,y,h)}}

  queueTerrainRefresh(cx,cy,size=TERRAIN_CHUNK,sig=null){
    if(cx<0||cy<0||cx*size>=CFG.worldSize||cy*size>=CFG.worldSize)return;const key=`${cx},${cy},${size}`;if(this.terrainRefreshQueued.has(key)||this.terrainChunkWork?.key===key)return;this.terrainRefreshQueued.add(key);this.terrainRefreshQueue.push({cx,cy,size,sig});
  }

  queueTerrainWarmRing(startX,startY,cols,rows){
    const size=TERRAIN_CHUNK,minCx=Math.floor((startX-1)/size)-1,maxCx=Math.floor((startX+cols+1)/size)+1,minCy=Math.floor((startY-1)/size)-1,maxCy=Math.floor((startY+rows+1)/size)+1;
    for(let cy=minCy;cy<=maxCy;cy++)for(let cx=minCx;cx<=maxCx;cx++){
      if(cx<0||cy<0||cx*size>=CFG.worldSize||cy*size>=CFG.worldSize)continue;const key=`${cx},${cy},${size}`,sig=this.terrainChunkSignature(cx,cy,size),entry=this.terrainChunkCache.get(key);if(!entry||entry.sig!==sig)this.queueTerrainRefresh(cx,cy,size,sig)
    }
  }


  // Live refresh performs a bounded number of ground/vegetation tile tasks per
  // frame. It never publishes a partial chunk; until complete, drawing retains
  // the old detailed chunk or uses the small land/water fallback. This avoids
  // the multi-hundred-ms atomic work observed in the native FPS overlay.
  processTerrainRefreshQueue(){
    const current=this.terrainChunkWork;
    if(current){
      if(this.terrainChunkSignature(current.cx,current.cy,current.size)!==current.sig){
        this.terrainChunkWork=null;
        this.queueTerrainRefresh(current.cx,current.cy,current.size);
      }else if(this.stepTerrainChunkWork(current,4,16))this.terrainChunkWork=null;
      return;
    }
    if(!this.terrainRefreshQueue.length)return;
    this.terrainRefreshFrame=(this.terrainRefreshFrame+1)%2;
    if(this.terrainRefreshFrame)return;
    const q=this.terrainRefreshQueue,cam=this.camera,last=cam?this.queueCamera||{x:cam.x,y:cam.y}:null;
    const ax=cam?cam.x+(cam.x-last.x)*30:0,ay=cam?cam.y+(cam.y-last.y)*30:0;
    if(cam)this.queueCamera={x:cam.x,y:cam.y};
    let bi=0,bd=Infinity;
    for(let k=0;cam&&k<q.length;k++){
      const j=q[k],d=Math.hypot((j.cx+.5)*j.size-ax,(j.cy+.5)*j.size-ay);
      if(d<bd){bd=d;bi=k}
    }
    const job=q.splice(bi,1)[0],key=`${job.cx},${job.cy},${job.size}`;
    this.terrainRefreshQueued.delete(key);
    const sig=this.terrainChunkSignature(job.cx,job.cy,job.size),entry=this.terrainChunkCache.get(key);
    if(entry?.sig===sig)return;
    const work=this.createTerrainChunkWork(job.cx,job.cy,job.size,sig);
    if(!work)return;
    this.terrainChunkWork=work;
    if(this.stepTerrainChunkWork(work,4,16))this.terrainChunkWork=null;
  }

  terrainChunk(cx,cy,size=TERRAIN_CHUNK){
    const key=`${cx},${cy},${size}`,sig=this.terrainChunkSignature(cx,cy,size),entry=this.terrainChunkCache.get(key);if(entry?.sig===sig)return entry.canvas;if(entry){this.queueTerrainRefresh(cx,cy,size,sig);return entry.canvas}if(typeof document==='undefined')return null;
    if(this.sceneShown){this.queueTerrainRefresh(cx,cy,size,sig);return null}
    return this.buildTerrainChunk(cx,cy,size,sig)
  }


  // The synchronous variant remains for pre-game scene preparation and
  // legacy authored tools. Live refresh uses the *same* tile operations below,
  // but spreads them over bounded requestAnimationFrame opportunities.
  buildTerrainChunk(cx,cy,size=TERRAIN_CHUNK,sig=this.terrainChunkSignature(cx,cy,size)){
    const work=this.createTerrainChunkWork(cx,cy,size,sig);
    if(!work)return null;
    while(!this.stepTerrainChunkWork(work,Infinity,Infinity)){}
    return work.chunk;
  }

  createTerrainChunkWork(cx,cy,size,sig){
    if(typeof document==='undefined')return null;
    const logical=size*16*TILE_ART,chunk=document.createElement('canvas'),vegetation=document.createElement('canvas');
    chunk.width=chunk.height=vegetation.width=vegetation.height=logical;
    const cc=chunk.getContext('2d'),vc=vegetation.getContext('2d');if(!cc||!vc)return null;
    cc.imageSmoothingEnabled=vc.imageSmoothingEnabled=false;
    cc.scale(TILE_ART,TILE_ART);vc.scale(TILE_ART,TILE_ART);
    return{cx,cy,size,sig,key:`${cx},${cy},${size}`,chunk,vegetation,cc,vc,phase:0,index:0};
  }

  stepTerrainChunkWork(work,budgetMs=4,maxOperations=16){
    const {cx,cy,size,cc,vc}=work,start=performance.now(),old=this.ctx,P=VEG_PAD;
    this.ctx=cc;
    let operations=0;
    try{
      while(operations<maxOperations && (operations===0||performance.now()-start<budgetMs)){
        if(work.phase===0){
          if(work.index>=size*size){work.phase=1;work.index=0;continue}
          const lx=work.index%size,ly=Math.floor(work.index/size);work.index++;
          const x=cx*size+lx,y=cy*size+ly;
          if(x>=0&&y>=0&&x<CFG.worldSize&&y<CFG.worldSize){
            const i=this.sim.world.idx(x,y),px=lx*16,py=ly*16,simWater=!!this.sim.world.water[i];
            const hash=hash2(x,y,11),identity=habitatIdentityAt(this.sim.world,x,y,this.habitatField),mask=this.visualWaterMask(x,y);
            if(!simWater){const land=this.staticLandTile(i,x,y,identity,false);if(land)cc.drawImage(land,px,py,16,16)}
            else{this.drawOrganicLandBase(px,py,1,x,y,this.sim.season,hash,identity);
              if(!mask.full&&!mask.empty){cc.fillStyle='rgba(74,79,53,.16)';cc.fillRect(px+2,py+11,12,2)}}
            if(!mask.empty){const water=this.waterBaseTile(x,y,mask,hash);if(water)cc.drawImage(water,px,py,16,16);
              if(!mask.full)this.drawOrganicBankAccents(px,py,1,x,y,mask)}
          }
        }else{
          const width=size+2;
          if(work.index>=width*width){
            this.terrainChunkCache.set(work.key,{sig:work.sig,canvas:work.chunk,vegetation:work.vegetation});
            return true;
          }
          const lx=(work.index%width)-1,ly=Math.floor(work.index/width)-1;work.index++;
          const x=cx*size+lx,y=cy*size+ly;
          if(x>=0&&y>=0&&x<CFG.worldSize&&y<CFG.worldSize){
            const i=this.sim.world.idx(x,y);
            if(!this.sim.world.water[i]){
              const v=this.vegetationLayer(i,x,y,visualHierarchyAt(this.sim.world,x,y,{habitatField:this.habitatField}));
              if(v)vc.drawImage(v,lx*16-P,ly*16-P,16+2*P,16+2*P);
            }
          }
        }
        operations++;
      }
      return false;
    }finally{this.ctx=old}
  }

  terrainChunkSignature(cx,cy,size=TERRAIN_CHUNK){return Math.imul((this.habitatFieldDay+1)^Math.imul(this.subsurfaceRevision||0,2654435761)^Math.imul(cx+257,73856093)^Math.imul(cy+263,19349663)^Math.imul(size,83492791),16777619)>>>0}

  drawTileDynamic(px,py,s,i,x,y){
    const w=this.sim.world,u=this.zoom,hash=hash2(x,y,11),mask=this.visualWaterMask(x,y),simWater=!!w.water[i];
    if(!simWater){this.drawEnvironmentalHistory(px,py,u,i,x,y);if(!this.groundPassOnly&&w.carrion[i]>.08)this.drawCarrion(px,py,u,w.carrion[i])}
    if(!mask.empty)this.drawOrganicWaterMotion(px,py,u,x,y,mask,hash)
  }

  drawTile(px,py,s,i,x,y){
    const c=this.ctx,w=this.sim.world,season=this.sim.season,simWater=!!w.water[i],hash=hash2(x,y,11),u=this.zoom;
    const mask=this.visualWaterMask(x,y),mixed=!mask.full&&!mask.empty,p=this.sim.player(),hierarchy=visualHierarchyAt(w,x,y,{focusX:p?.x,focusY:p?.y,habitatField:this.habitatField}),identity=habitatIdentityAt(w,x,y,this.habitatField);

    // Most land geometry only changes on the daily habitat refresh. Away from the
    // controlled creature's small clarity pocket, draw one cached 16x16 tile instead
    // of replaying dozens of canvas operations every animation frame. Near the player
    // we keep the live hierarchy path so local ground clutter still yields correctly.
    const useStaticLand=!simWater&&hierarchy.focus<.015;
    if(useStaticLand){
      const cached=this.staticLandTile(i,x,y,identity,!this.groundPassOnly);
      if(cached)c.drawImage(cached,px,py,16*u,16*u);else this.drawLandDetailLive(px,py,u,i,x,y,hierarchy,identity,hash);
      this.drawEnvironmentalHistory(px,py,u,i,x,y);
      if(!this.groundPassOnly&&w.carrion[i]>.08)this.drawCarrion(px,py,u,w.carrion[i]);
    }else{
      this.drawOrganicLandBase(px,py,u,x,y,season,hash,identity);
      if(!simWater)this.drawLandDetailLive(px,py,u,i,x,y,hierarchy,identity,hash,{baseAlready:true});
      else if(mixed){
        // Exposed visual bank inside a simulation-water cell: simple damp soil,
        // intentionally vegetation-free because canonical ecology still sees water.
        c.fillStyle='rgba(74,79,53,.16)';c.fillRect(px+2*u,py+11*u,12*u,2*u);
      }
    }

    this.drawOrganicWater(px,py,u,x,y,mask,simWater,hash);
    if(mixed)this.drawOrganicBankAccents(px,py,u,x,y,mask);
  }

  drawLandDetailLive(px,py,u,i,x,y,hierarchy,identity,hash,{baseAlready=false}={}){
    const c=this.ctx,w=this.sim.world,season=this.sim.season,f=w.fertility[i],m=w.moisture[i];
    if(!baseAlready)this.drawOrganicLandBase(px,py,u,x,y,season,hash,identity);
    const patch=hash2(x>>1,y>>1,53),micro=hash2(x,y,67);
    c.save();c.globalAlpha*=hierarchy.microAlpha;
    if(m>.54&&patch>.42){c.fillStyle='rgba(31,67,45,.22)';c.fillRect(px+(micro>.5?1:7)*u,py+(9+Math.floor(patch*3))*u,(5+Math.floor(micro*4))*u,2*u)}
    if(f<.38&&patch>.54){c.fillStyle='rgba(112,88,52,.25)';c.fillRect(px+(3+Math.floor(micro*8))*u,py+(2+Math.floor(hash2(x,y,71)*8))*u,(2+Math.floor(patch*3))*u,(1+Math.floor(micro*2))*u)}
    for(let k=0;k<2;k++){const h=hash2(x+k*17,y-k*13,79+k);if(h<.34){c.fillStyle=h<.17?'rgba(197,194,126,.16)':'rgba(24,53,36,.20)';c.fillRect(px+(2+Math.floor(hash2(x,y,83+k)*12))*u,py+(2+Math.floor(hash2(y,x,89+k)*12))*u,u,u)}}
    this.drawWorldComposition(px,py,u,x,y);c.restore();
    this.drawOrganicHabitat(px,py,u,x,y);
    c.save();c.globalAlpha*=hierarchy.accentAlpha;
    this.drawGroundComposition(px,py,u,i,x,y);
    drawSeasonalGround(c,{world:w,habitatField:this.habitatField,season,px,py,u,x,y,identity});
    this.drawHabitatRelief(px,py,u,i,x,y);
    drawHabitatClusterAccents(c,{world:w,habitatField:this.habitatField,px,py,u,i,x,y});c.restore();
    drawRiparianDepth(c,{world:w,isWater:(tx,ty)=>this.isWater(tx,ty),px,py,u,i,x,y,depth:this.visualWaterMask(x,y).depth});
    if(!this.groundPassOnly){const v=this.vegetationLayer(i,x,y,hierarchy);if(v)c.drawImage(v,px-VEG_PAD*u,py-VEG_PAD*u,(16+2*VEG_PAD)*u,(16+2*VEG_PAD)*u);else this.drawVegetation(i,px,py,u,x,y,hierarchy)}
    drawHabitatDepth(c,{world:w,habitatField:this.habitatField,isWater:(tx,ty)=>this.isWater(tx,ty),depth:this.visualWaterMask(x,y).depth,px,py,u,i,x,y,season});
    this.drawEnvironmentalHistory(px,py,u,i,x,y);
    if(!this.groundPassOnly&&w.carrion[i]>.08)this.drawCarrion(px,py,u,w.carrion[i]);
  }

  // Phase 3L: terrain tile canvases are recycled instead of reallocated. Every terrain refresh (season, or at most
  // every 20 s) cleared the tile caches and every stale tile got a new canvas: about 270 new canvases a second while
  // walking at day 120, each later finalized by the garbage collector (frame stalls). A recycled canvas is reset
  // (transparent, default state), exactly like a new one. TERRAIN_POOL_MAX bounds the spare canvases kept.
  takeTileCanvas(n){const pool=this.tileCanvasPool;let cv=null;while(pool?.length&&!cv){const c=pool.pop();if(c.width===n&&c.height===n)cv=c}
    if(cv){const g=cv.getContext('2d');if(typeof g.reset==='function')g.reset();else cv.width=n;return cv}cv=document.createElement('canvas');cv.width=n;cv.height=n;return cv}
  recycleTileCanvas(cv){if(!cv||typeof document==='undefined'||!TERRAIN_POOL.enabled)return;const pool=this.tileCanvasPool||=[];if(pool.length<TERRAIN_POOL_MAX)pool.push(cv)}
  recycleTileCache(cache){if(!cache)return;for(const v of cache.values())this.recycleTileCanvas(v?.canvas||v);cache.clear()}
  staticLandTile(i,x,y,identity,veg=true){
    const cache=veg?this.staticLandTileCache:(this.staticGroundTileCache||=new Map()),key=y*CFG.worldSize+x,sig=veg?this.plantVisualSignature(i):this.habitatFieldDay,entry=cache.get(key);if(entry?.sig===sig)return entry.canvas;
    if(typeof document==='undefined')return null;
    if(entry)this.recycleTileCanvas(entry.canvas);const tile=this.takeTileCanvas(16*TILE_ART);const tc=tile.getContext('2d');if(!tc)return null;
    tc.imageSmoothingEnabled=false;tc.scale(TILE_ART,TILE_ART);const old=this.ctx;this.ctx=tc;
    try{
      const hierarchy=visualHierarchyAt(this.sim.world,x,y,{habitatField:this.habitatField}),hash=hash2(x,y,11);
      // Dynamic history/carrion are intentionally omitted; drawTile layers them live.
      const w=this.sim.world,season=this.sim.season,f=w.fertility[i],m=w.moisture[i],patch=hash2(x>>1,y>>1,53),micro=hash2(x,y,67);
      this.drawOrganicLandBase(0,0,1,x,y,season,hash,identity);
      tc.save();tc.globalAlpha*=hierarchy.microAlpha;
      for(let k=0;k<2;k++){const h=hash2(x+k*17,y-k*13,79+k);if(h<.34){tc.fillStyle=h<.17?'rgba(197,194,126,.16)':'rgba(24,53,36,.20)';tc.fillRect(2+Math.floor(hash2(x,y,83+k)*12),2+Math.floor(hash2(y,x,89+k)*12),1,1)}}
      this.drawWorldComposition(0,0,1,x,y);tc.restore();
      this.drawOrganicHabitat(0,0,1,x,y);
      tc.save();tc.globalAlpha*=hierarchy.accentAlpha;
      this.drawGroundComposition(0,0,1,i,x,y);
      drawSeasonalGround(tc,{world:w,habitatField:this.habitatField,season,px:0,py:0,u:1,x,y,identity});
      this.drawHabitatRelief(0,0,1,i,x,y);
      drawHabitatClusterAccents(tc,{world:w,habitatField:this.habitatField,px:0,py:0,u:1,i,x,y});tc.restore();
      drawRiparianDepth(tc,{world:w,isWater:(tx,ty)=>this.isWater(tx,ty),px:0,py:0,u:1,i,x,y,depth:this.visualWaterMask(x,y).depth});
      if(veg){const v=this.vegetationLayer(i,x,y,hierarchy);if(v)tc.drawImage(v,-VEG_PAD,-VEG_PAD,16+2*VEG_PAD,16+2*VEG_PAD);else this.drawVegetation(i,0,0,1,x,y,hierarchy)}
      drawHabitatDepth(tc,{world:w,habitatField:this.habitatField,isWater:(tx,ty)=>this.isWater(tx,ty),depth:this.visualWaterMask(x,y).depth,px:0,py:0,u:1,i,x,y,season});
    }finally{this.ctx=old}
    cache.set(key,{sig,canvas:tile});return tile;
  }

  // World art pass (v1.50.0): plants get the creatures' treatment, a dark outline round each plant
  // silhouette, so shrubs, reeds, mushrooms and pods read as objects on the ground. Built once per
  // tile and plant state (cached), never per frame.
  vegetationLayer(i,x,y,hierarchy){
    if(typeof document==='undefined')return null;const ta=Math.round((hierarchy?.traceAlpha??1)*4)/4,key=y*CFG.worldSize+x,sig=(this.plantVisualSignature(i)^Math.imul(Math.round(ta*4)+1,2654435761)^Math.imul(CFG.seasons.indexOf(this.sim.season)+7,40503))>>>0;
    this.vegLayerCache||=new Map();const hit=this.vegLayerCache.get(key);if(hit?.sig===sig)return hit.canvas;
    const n=(16+2*VEG_PAD)*TILE_ART,mk=()=>{const cv=document.createElement('canvas');cv.width=n;cv.height=n;return cv};this.vegScratch||=mk();const lc=this.vegScratch.getContext('2d');if(!lc)return null;
    const old=this.ctx,draw=(ctx,only)=>{ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,n,n);ctx.imageSmoothingEnabled=false;ctx.scale(TILE_ART,TILE_ART);this.ctx=ctx;this.vegOnly=only;try{this.drawVegetation(i,VEG_PAD,VEG_PAD,1,x,y,{...(hierarchy||{}),traceAlpha:ta})}finally{this.ctx=old;this.vegOnly=null;ctx.setTransform(1,0,0,1,0,0)}};
    this.vegMinor||=mk();const mc=this.vegMinor.getContext('2d');draw(mc,'minor');draw(lc,'major');
    const out=hit?.canvas||mk(),oc=out.getContext('2d');oc.setTransform(1,0,0,1,0,0);oc.globalCompositeOperation='source-over';oc.clearRect(0,0,n,n);oc.imageSmoothingEnabled=false;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])oc.drawImage(this.vegScratch,dx,dy);oc.globalCompositeOperation='source-in';oc.fillStyle='rgba(16,28,18,.78)';oc.fillRect(0,0,n,n);oc.globalCompositeOperation='source-over';oc.drawImage(this.vegScratch,0,0);
    // Winter (v1.52.0): frost along the top edge of every plant (plant pixels with no plant above them).
    if(this.sim.season==='WINTER'){this.vegFrost||=mk();const fc=this.vegFrost.getContext('2d');fc.setTransform(1,0,0,1,0,0);fc.globalCompositeOperation='source-over';fc.clearRect(0,0,n,n);fc.drawImage(this.vegScratch,0,0);fc.globalCompositeOperation='destination-out';fc.drawImage(this.vegScratch,0,1);fc.globalCompositeOperation='source-in';fc.fillStyle='rgba(232,240,242,.72)';fc.fillRect(0,0,n,n);fc.globalCompositeOperation='source-over';oc.drawImage(this.vegFrost,0,0)}
    oc.globalCompositeOperation='destination-over';oc.drawImage(this.vegMinor,0,0);oc.globalCompositeOperation='source-over';
    this.vegLayerCache.set(key,{sig,canvas:out});return out;
  }

  plantVisualSignature(i){
    const w=this.sim.world,keys=['sunmoss','bramble','marshroot','rotcap','thistlepod'];let h=2166136261>>>0;for(let k=0;k<keys.length;k++){const reproductive=botanicalPlantView(this.sim.dispersal,keys[k],i),state=(reproductive?.receptive?1:0)+(reproductive?.pollen?2:0)+(reproductive?.developing?4:0);h=Math.imul(h^state,16777619)>>>0;const q=Math.max(0,Math.min(63,Math.floor((w.plants[keys[k]]?.[i]||0)*32)));h=Math.imul(h^(q+k*67),16777619)>>>0}const seedKeys=['bramble','marshroot','thistlepod'];for(let k=0;k<seedKeys.length;k++){const q=Math.max(0,Math.min(31,Math.floor((w.seedBank?.[seedKeys[k]]?.[i]||0)*16)));h=Math.imul(h^(q+k*41+113),16777619)>>>0}return h>>>0
  }

  visualWaterMask(x,y){
    const key=y*CFG.worldSize+x;let mask=this.landformMaskCache.get(key);
    if(!mask){mask=buildVisualWaterMask(this.sim.world,x,y);this.landformMaskCache.set(key,mask)}
    return mask;
  }

  visualHabitatMask(x,y){
    const key=y*CFG.worldSize+x;let mask=this.habitatMaskCache.get(key);
    if(!mask){mask=buildVisualHabitatMask(this.sim.world,x,y,undefined,this.habitatField);this.habitatMaskCache.set(key,mask)}
    return mask;
  }

  drawOrganicLandBase(px,py,u,x,y,season,hash,identity){
    const c=this.ctx,key=y*CFG.worldSize+x;let cached=this.landBaseTileCache?.get(key);
    // The sub-tile land contour is expensive but changes only when the daily habitat field changes.
    // Cache it at the canonical 16x16 logical-pixel resolution, then nearest-scale it with the rest
    // of the pixel-art scene. Dynamic vegetation, tracks, water motion and hierarchy remain live.
    if(!cached&&typeof document!=='undefined'){
      const tile=this.takeTileCanvas(16*TILE_ART);const tc=tile.getContext('2d');
      if(tc){tc.imageSmoothingEnabled=false;tc.scale(TILE_ART,TILE_ART);this.paintOrganicLandBase(tc,0,0,1,x,y,season,hash,identity);cached=tile;this.landBaseTileCache?.set(key,cached)}
    }
    if(cached){c.drawImage(cached,px,py,16*u,16*u);return}
    this.paintOrganicLandBase(c,px,py,u,x,y,season,hash,identity);
  }

  paintOrganicLandBase(c,px,py,u,x,y,season,hash,identity){
    // Base colour per 2x2 unit block (the original 8x8 colour grid); habitat edges come from the finer zone layer.
    const mask=this.visualHabitatMask(x,y),res=mask.res,block=Math.max(1,res/8),cells=res/block,step=16/cells;
    for(let cy=0;cy<cells;cy++)for(let cx=0;cx<cells;cx++){
      const sx=cx*block,sy=cy*block,idx=sy*res+sx,wx=x+(cx+.5)/cells,wy=y+(cy+.5)/cells,palette=terrainPaletteAt(this.sim.world,wx,wy,mask.moisture[idx],mask.fertility[idx]),color=terrainColor(mask.moisture[idx],mask.fertility[idx],season,terrainGrainAt(this.sim.world,wx,wy),palette);
      c.fillStyle=color;c.fillRect(px+cx*step*u,py+cy*step*u,step*u+.2,step*u+.2);
    }
    // v1.41.0: fine ground grain, one art pixel each, so open ground reads as 32-pixel texture.
    for(let k=0;k<14;k++){const g=hash2(x*31+k,y*17-k,1451),gx=Math.floor(hash2(x+k*3,y,1453)*32),gy=Math.floor(hash2(y+k*5,x,1459)*32);c.fillStyle=g>.55?'rgba(214,226,150,.10)':'rgba(14,34,20,.14)';c.fillRect(px+gx*u/2,py+gy*u/2,u/2,u/2)}
  }

  shoreLandColor(x,y,season,hash){
    const w=this.sim.world,i=w.idx(x,y);if(!w.water[i]){const v=visualHabitatAt(w,x+.5,y+.5,this.habitatField);return terrainColor(v.moisture,v.fertility,season,hash)}
    let m=0,f=0,n=0;for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){const nx=x+ox,ny=y+oy;if(nx<0||ny<0||nx>=CFG.worldSize||ny>=CFG.worldSize)continue;const ni=w.idx(nx,ny);if(w.water[ni])continue;const v=visualHabitatAt(w,nx+.5,ny+.5,this.habitatField);m+=v.moisture;f+=v.fertility;n++}
    if(!n)return terrainColor(.72,.42,season,hash);return terrainColor(m/n,f/n,season,hash);
  }

  drawOrganicHabitat(px,py,u,x,y){
    const c=this.ctx,mask=this.visualHabitatMask(x,y),res=mask.res,step=16/res;
    c.save();
    for(let sy=0;sy<res;sy++){
      let runZone=-1,runStart=0;
      for(let sx=0;sx<=res;sx++){
        const zone=sx<res?mask.zones[sy*res+sx]:-1;
        if(runZone<0){runZone=zone;runStart=sx;continue}
        if(zone!==runZone){
          if(runZone!==HABITAT_ZONE.MEADOW){
            c.fillStyle=runZone===HABITAT_ZONE.WET?'rgba(31,82,57,.11)':runZone===HABITAT_ZONE.DRY?'rgba(142,108,62,.11)':'rgba(98,129,62,.10)';
            c.fillRect(px+runStart*step*u,py+sy*step*u,(sx-runStart)*step*u,step*u);
          }
          runZone=zone;runStart=sx;
        }
      }
    }
    // Sparse one-pixel ecotone flecks make the contour readable without drawing a hard biome outline.
    for(let sy=0;sy<res;sy++)for(let sx=0;sx<res;sx++){
      const idx=sy*res+sx,z=mask.zones[idx],right=sx+1<res?mask.zones[idx+1]:z,down=sy+1<res?mask.zones[idx+res]:z;
      if(z===right&&z===down)continue;const h=hash2(x*res+sx,y*res+sy,1409);if(h<.52)continue;
      c.fillStyle=(z===HABITAT_ZONE.WET||right===HABITAT_ZONE.WET||down===HABITAT_ZONE.WET)?'rgba(112,151,95,.20)':(z===HABITAT_ZONE.DRY||right===HABITAT_ZONE.DRY||down===HABITAT_ZONE.DRY)?'rgba(176,143,86,.18)':'rgba(151,161,93,.15)';
      c.fillRect(px+(sx*step+(h>.78?step*.5:0))*u,py+(sy*step+(h>.66?step*.5:0))*u,Math.max(u,step*.5*u),u);
    }
    c.restore();
  }

  waterBaseTile(x,y,mask,hash){
    const key=y*CFG.worldSize+x;let cached=this.waterBaseTileCache?.get(key);if(cached)return cached;if(typeof document==='undefined')return null;
    const tile=document.createElement('canvas');tile.width=16*TILE_ART;tile.height=16*TILE_ART;const tc=tile.getContext('2d');if(!tc)return null;tc.imageSmoothingEnabled=false;tc.scale(TILE_ART,TILE_ART);const reach=riverIdentityAt(this.sim.world,x,y);this.paintOrganicWaterBase(tc,0,0,1,x,y,mask,hash,reach);this.waterBaseTileCache?.set(key,tile);return tile;
  }

  drawOrganicWater(px,py,u,x,y,mask,simWater,hash){
    if(mask.empty)return;const c=this.ctx,cached=this.waterBaseTile(x,y,mask,hash);if(cached)c.drawImage(cached,px,py,16*u,16*u);else this.paintOrganicWaterBase(c,px,py,u,x,y,mask,hash,riverIdentityAt(this.sim.world,x,y));this.drawOrganicWaterMotion(px,py,u,x,y,mask,hash)
  }

  drawOrganicWaterMotion(px,py,u,x,y,mask,hash){
    drawWaterSurfaceMarks(this.ctx,{world:this.sim.world,x,y,mask,px,py,u,seconds:this.sim.tickCount/CFG.simHz})
  }

  paintOrganicWaterBase(c,px,py,u,x,y,mask,hash,reach){
    const res=LANDFORM_RESOLUTION,step=16/res,shore=!mask.full,tones=waterTones(reach,this.sim.season),base=shore?tones.shore:tones.base,deep=tones.deep;
    // v1.41.0: colour each art pixel by how far into the water it lies, so the shallow band follows
    // the shore smoothly instead of switching colour tile by tile.
    const bandIndex=i=>{const d=mask.depth?mask.depth[i]:(mask.full?255:150);return d>=232?0:d>=176?1:d>=150?2:3};
    // v1.41.0: reach tones blend smoothly between tile centres, so neighbouring reaches no longer meet in squares.
    // The few reach tones this tile can blend (its 3x3 neighbourhood), looked up once; colour strings are reused.
    const season=this.sim.season,tones9=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)tones9.push(waterToneBase(riverIdentityAt(this.sim.world,Math.max(0,Math.min(CFG.worldSize-1,x+dx)),Math.max(0,Math.min(CFG.worldSize-1,y+dy))),season));
    const toneAt=(tx,ty)=>tones9[(ty-y+1)*3+(tx-x+1)],colorCache=new Map();
    // The blended reach tone changes slowly, so it is mixed once per 4x4 block of art pixels.
    const blockTone=new Array(64),toneOf=(sx,sy)=>{const bi=(sy>>2)*8+(sx>>2);let t=blockTone[bi];if(!t){const wx=x+((sx>>2)*4+2)/res-.5,wy=y+((sy>>2)*4+2)/res-.5,x0=Math.floor(wx),y0=Math.floor(wy),fx=wx-x0,fy=wy-y0,a=toneAt(x0,y0),b=toneAt(x0+1,y0),c2=toneAt(x0,y0+1),d=toneAt(x0+1,y0+1),mix=k=>a[k]*(1-fx)*(1-fy)+b[k]*fx*(1-fy)+c2[k]*(1-fx)*fy+d[k]*fx*fy;t=blockTone[bi]={h:mix('h'),s:mix('s'),l:mix('l')}}return t};
    const band=i=>{const sx=i%res,sy=(i/res)|0,t=toneOf(sx,sy),o=WATER_BANDS[bandIndex(i)],hh=Math.round(t.h+o[0]),ss=Math.max(18,Math.round(t.s+o[1])),ll=Math.max(14,Math.round(t.l+o[2])),key=hh*10000+ss*100+ll;let col=colorCache.get(key);if(!col){col=`hsl(${hh} ${ss}% ${ll}%)`;colorCache.set(key,col)}return col};
    for(let sy=0;sy<res;sy++){
      let run=-1,runColor=null;
      for(let sx=0;sx<=res;sx++){
        const on=sx<res&&maskWaterAt(mask,sx,sy,res),color=on?band(sy*res+sx):null;
        if(run>=0&&color!==runColor){const x0=run*step,w=(sx-run)*step;c.fillStyle=runColor;c.fillRect(px+x0*u,py+sy*step*u,w*u,step*u);run=-1}
        if(on&&run<0){run=sx;runColor=color}
      }
    }
    if(!mask.full){
      c.fillStyle='rgba(118,193,181,.19)';
      for(let sy=0;sy<res;sy++)for(let sx=0;sx<res;sx++)if(maskWaterAt(mask,sx,sy,res)){
        let edge=false;for(const [dx,dy] of CARDINAL){const nx=sx+dx,ny=sy+dy;if(nx>=0&&ny>=0&&nx<res&&ny<res&&!maskWaterAt(mask,nx,ny,res)){edge=true;break}}
        if(edge&&hash2(x*res+sx,y*res+sy,1319)>.30)c.fillRect(px+sx*step*u,py+sy*step*u,step*u,Math.max(u,step*.34*u));
      }
    }

  }

  drawOrganicBankAccents(px,py,u,x,y,mask){
    const c=this.ctx,res=LANDFORM_RESOLUTION,step=16/res;c.save();
    for(let sy=0;sy<res;sy++)for(let sx=0;sx<res;sx++)if(!maskWaterAt(mask,sx,sy,res)){
      let near=false;for(const [dx,dy] of CARDINAL){const nx=sx+dx,ny=sy+dy;if(nx<0||ny<0||nx>=res||ny>=res)continue;if(maskWaterAt(mask,nx,ny,res)){near=true;break}}
      if(!near)continue;const h=hash2(x*res+sx,y*res+sy,1327);if(h<.56)continue;
      c.fillStyle=h>.78?'rgba(176,160,101,.36)':'rgba(87,81,55,.35)';const ox=(sx*step+(h>.78?.5:0))*u,oy=(sy*step+(h>.66?1:0))*u;c.fillRect(px+ox,py+oy,Math.max(u,step*.5*u),u);
    }
    // Occasional damp crescent on high-seepage banks reads as an old side channel / flood scar,
    // but stays earth-toned so it is not mistaken for drinkable water.
    const wi=this.sim.world.idx(x,y),seep=this.sim.world.seepage?.[wi]||0,macro=smoothNoise2(x,y,6,1337);
    if(!this.sim.world.water[wi]&&seep>.42&&macro>.67){c.strokeStyle='rgba(55,83,65,.28)';c.lineWidth=Math.max(1,u);c.beginPath();c.arc(px+8*u,py+9*u,4*u,.15*Math.PI,.82*Math.PI);c.stroke()}
    c.restore();
  }

  drawWorldComposition(px,py,u,x,y){
    const c=this.ctx,comp=visualCompositionAt(this.sim.world,x+.5,y+.5,this.habitatField),h=hash2(x,y,1451);
    c.save();
    // Open glades/corridors are represented by shorter, broken ground cover rather than a hard overlay.
    if(comp.openness>.58){const a=Math.min(.15,(comp.openness-.58)*.30);c.fillStyle=`rgba(181,166,102,${a})`;const yy=(5+Math.floor(h*6))*u;c.fillRect(px+(2+Math.floor(h*5))*u,py+yy,(4+Math.floor(comp.openness*6))*u,u);if(comp.corridor>.68){c.fillStyle='rgba(112,98,61,.10)';for(let q=0;q<2;q++){const qh=hash2(x+q*5,y-q*3,1463+q),ox=(2+Math.floor(qh*9))*u,oy=(8+q*3+Math.floor(hash2(y+q,x,1471+q)*2))*u;c.fillRect(px+ox,py+oy,(3+Math.floor(qh*3))*u,u)}}}
    // Dense habitat used to receive a wide horizontal per-tile bar here. Across many
    // neighboring tiles that formed obvious dotted bands, so keep only irregular floor flecks.
    if(comp.thicket>.70&&comp.openness<.45){for(let q=0;q<2;q++){const qh=hash2(x+q*11,y-q*7,1493+q),ox=(2+Math.floor(qh*11))*u,oy=(3+Math.floor(hash2(y+q,x,1499+q)*9))*u;c.fillStyle=`rgba(25,55,35,${.045+qh*.035})`;c.fillRect(px+ox,py+oy,(1+(qh>.72?2:1))*u,u)}}
    c.restore();
  }

  drawGroundComposition(px,py,u,i,x,y){
    const c=this.ctx,w=this.sim.world,m=w.moisture[i],f=w.fertility[i],season=this.sim.season;
    const region=smoothNoise2(x,y,8,397),sub=smoothNoise2(x,y,4,401),local=hash2(x,y,409),detail=hash2(y,x,419);
    c.save();
    // Avoid whole-tile macro tint blocks: broad habitat color already comes from the
    // sub-tile organic contour. Ground composition only adds local breakup now.
    if(region>.68&&m>.38){c.fillStyle=m>.62?'rgba(28,72,48,.10)':'rgba(79,91,47,.08)';const ox=(1+Math.floor(local*4))*u,oy=(2+Math.floor(detail*5))*u;c.fillRect(px+ox,py+oy,(7+Math.floor(region*4))*u,(3+Math.floor(sub*3))*u)}
    else if(region<.20&&m<.58){c.fillStyle='rgba(118,91,59,.10)';const ox=(2+Math.floor(detail*6))*u,oy=(3+Math.floor(local*6))*u;c.fillRect(px+ox,py+oy,(5+Math.floor(sub*4))*u,(2+Math.floor(detail*3))*u)}
    if(m>.64&&sub>.30){c.fillStyle='rgba(36,83,58,.20)';const ox=(1+Math.floor(local*5))*u,oy=(3+Math.floor(detail*7))*u;c.fillRect(px+ox,py+oy,(7+Math.floor(sub*5))*u,(2+Math.floor(local*2))*u);if(local>.62){c.fillStyle='rgba(101,132,82,.22)';c.fillRect(px+(3+Math.floor(detail*8))*u,py+(10+Math.floor(local*3))*u,3*u,u)}}
    else if(m<.30&&sub>.44){c.fillStyle='rgba(126,101,66,.25)';for(let k=0;k<2;k++){const ox=(3+Math.floor(hash2(x+k,y-k,421)*10))*u,oy=(4+Math.floor(hash2(y+k,x-k,431)*8))*u;c.fillRect(px+ox,py+oy,(2+(k&1))*u,u)}if(detail>.70){c.strokeStyle='rgba(83,66,48,.24)';c.lineWidth=Math.max(1,u);c.beginPath();c.moveTo(px+5*u,py+11*u);c.lineTo(px+8*u,py+9*u);c.lineTo(px+10*u,py+12*u);c.stroke()}}
    if(f>.68&&sub>.50){const leaf=season==='AUTUMN'?'rgba(172,123,70,.25)':'rgba(143,121,72,.20)';c.fillStyle=leaf;for(let k=0;k<3;k++){const ox=(2+Math.floor(hash2(x+k*3,y-k*2,439)*12))*u,oy=(3+Math.floor(hash2(y+k*4,x-k,443)*10))*u;c.fillRect(px+ox,py+oy,(1+(k===0?1:0))*u,u)}}
    if(region<.24&&local>.38){c.fillStyle='rgba(164,145,99,.16)';c.fillRect(px+(3+Math.floor(detail*8))*u,py+(5+Math.floor(local*6))*u,(3+Math.floor(sub*3))*u,u)}
    if(this.adjacentLand(x,y)===false&&m>.48&&detail>.78){c.fillStyle='rgba(177,164,116,.20)';c.fillRect(px+(11+Math.floor(local*2))*u,py+(3+Math.floor(sub*3))*u,2*u,u)}
    c.restore();
  }

  drawHabitatRelief(px,py,u,i,x,y){
    const c=this.ctx,w=this.sim.world,m=w.moisture[i],f=w.fertility[i],macro=smoothNoise2(x,y,5,1201),detail=hash2(x,y,1207);
    c.save();
    // Wet ground gets sparse seepage pockets, not a shared bottom-edge lip that reveals the tile grid.
    if(m>.66){
      if(detail>.44){const qh=hash2(x+5,y-3,1231),ox=(2+Math.floor(qh*10))*u,oy=(4+Math.floor(hash2(y,x,1237)*8))*u;c.fillStyle='rgba(24,55,39,.15)';c.fillRect(px+ox,py+oy,(2+Math.floor(qh*3))*u,u);if(detail>.72){c.fillStyle='rgba(124,169,126,.15)';c.fillRect(px+ox+u,py+oy-u,(2+Math.floor(macro*2))*u,u)}}
    }
    // Dry/fertile macro patches use broken lips/feet, avoiding repeated full-width terrain bands.
    if(m<.31&&macro>.48){c.fillStyle='rgba(187,153,94,.14)';c.fillRect(px+(2+Math.floor(detail*2))*u,py+3*u,5*u,u);c.fillRect(px+(9+Math.floor(macro*2))*u,py+4*u,4*u,u);c.fillStyle='rgba(66,54,38,.17)';c.fillRect(px+(3+Math.floor(macro*2))*u,py+13*u,4*u,u);c.fillRect(px+(9+Math.floor(detail*2))*u,py+12*u,3*u,u)}
    else if(f>.74&&macro>.56&&detail>.40){c.fillStyle='rgba(130,159,82,.11)';const ox=(2+Math.floor(detail*9))*u,oy=(3+Math.floor(hash2(y,x,1247)*8))*u;c.fillRect(px+ox,py+oy,(2+Math.floor(macro*3))*u,u);if(detail>.76){c.fillStyle='rgba(25,49,31,.10)';c.fillRect(px+ox-u,py+oy+u,2*u,u)}}
    // v1.41.0: the riparian bank foot now follows the smooth shoreline (habitat-detail drawRiparianDepth);
    // straight tile-edge bands here read as stair steps against the 32-pixel shore.
    c.restore();
  }

  drawForegroundHabitat(tile,startX,startY,cols,rows){
    const c=this.ctx,w=this.sim.world,u=this.zoom,animals=this.visibleAnimals||[];
    // v1.57.0: visible animals are linked into a tile grid (reused typed arrays, nothing allocated per
    // frame), so each fringe tile checks only the creatures on the 3x3 tiles around it instead of all
    // of them. On large screens the old per-tile scan was the single biggest cost.
    const gx0=startX-2,gy0=startY-2,GW=cols+4,GH=rows+4,GN=GW*GH;if(!this.dispHead||this.dispHead.length<GN)this.dispHead=new Int32Array(GN*2);if(!this.dispNext||this.dispNext.length<animals.length)this.dispNext=new Int32Array(Math.max(128,animals.length*2));
    const head=this.dispHead,next=this.dispNext;head.fill(-1,0,GN);for(let k=0;k<animals.length;k++){const a=animals[k];if(!a.alive)continue;const tx=Math.floor(a.x)-gx0,ty=Math.floor(a.y)-gy0;if(tx<0||ty<0||tx>=GW||ty>=GH)continue;const ti=ty*GW+tx;next[k]=head[ti];head[ti]=k}
    const nearPush=(x,y)=>{let best=null,bestD=1.15;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const tx=x+dx-gx0,ty=y+dy-gy0;if(tx<0||ty<0||tx>=GW||ty>=GH)continue;for(let k=head[ty*GW+tx];k>=0;k=next[k]){const a=animals[k],ddx=(x+.5)-a.x,ddy=(y+.5)-a.y,d=Math.hypot(ddx,ddy);if(d>=bestD)continue;bestD=d;const len=Math.max(.001,d);best={animal:a,distance:d,x:ddx/len,y:ddy/len,strength:Math.max(0,1-d/1.15)}}}return best};
    // The foreground fringe now reacts to nearby bodies. Plant biomass stays canonical;
    // only the rendered stems/branches bend away from animals passing through them.
    for(let sy=0;sy<rows;sy++)for(let sx=0;sx<cols;sx++){
      const x=startX+sx,y=startY+sy;if(x<0||y<0||x>=CFG.worldSize||y>=CFG.worldSize)continue;const i=w.idx(x,y);if(w.water[i])continue;
      const marsh=w.plants.marshroot?.[i]||0,bramble=w.plants.bramble?.[i]||0,moss=w.plants.sunmoss?.[i]||0,comp=visualCompositionAt(w,x+.5,y+.5,this.habitatField),px=Math.round((x-this.camera.x)*tile+this.w/2),py=Math.round((y-this.camera.y)*tile+this.h/2),h=hash2(x,y,1213),push=nearPush(x,y),profile=visualHierarchyAt(w,x,y,{focusX:this.sim.player()?.x,focusY:this.sim.player()?.y,habitatField:this.habitatField}),playerContact=!!push?.animal?.player,lean=push?Math.round(push.x*(playerContact?4:3)*push.strength):0,flatten=push?Math.round(push.strength*(playerContact?3:2)):0,season=this.sim.season,fgAlpha=foregroundAlphaFor(profile,{playerContact});
      if(comp.openness<.66&&marsh>.48&&w.moisture[i]>.58&&h>.44){
        const reed=season==='WINTER'?['#b3a77b','#cabd91']:season==='AUTUMN'?['#7b8052','#a08f59']:['#688755','#91a566'];
        c.save();c.globalAlpha=.72*fgAlpha;for(let k=0;k<3;k++){const ox=(3+Math.floor(hash2(x+k,y-k,1217)*10)),ht=Math.max(2,2+Math.floor(hash2(y+k,x-k,1223)*3)-flatten),base=16,shift=lean+(k===1?Math.sign(lean||1):0);c.fillStyle=k===1?reed[1]:reed[0];c.fillRect(px+ox*u,py+(base-Math.ceil(ht*.55))*u,u,Math.ceil(ht*.55)*u);c.fillRect(px+(ox+shift)*u,py+(base-ht)*u,u,Math.max(u,Math.floor(ht*.55)*u))}c.restore();
      }else if(comp.openness<.55&&bramble>.52&&h>.67){
        const leaf=season==='WINTER'?['#4a4738','#655d43']:season==='AUTUMN'?['#4b4930','#71603d']:['#3c4d2d','#627c43'];
        c.save();c.globalAlpha=.68*fgAlpha;c.fillStyle=leaf[0];c.fillRect(px+(3+Math.floor(h*4))*u,py+(13+flatten)*u,8*u,Math.max(u,(3-flatten)*u));c.fillStyle=leaf[1];c.fillRect(px+(5+Math.floor(h*2)+lean)*u,py+(12+flatten)*u,5*u,Math.max(u,(2-flatten)*u));c.restore();
      }else if(comp.openness<.45&&moss>.66&&h>.72){
        c.save();c.globalAlpha=.62*fgAlpha;c.fillStyle=season==='WINTER'?'#617264':season==='AUTUMN'?'#7b8050':'#6f9250';for(let k=0;k<3;k++){const ox=(3+Math.floor(hash2(x+k*7,y,1229)*10))+Math.round(lean*.5);c.fillRect(px+ox*u,py+(14+flatten)*u,u,Math.max(u,(2-flatten)*u))}c.restore();
      }
    }
  }

  drawHabitatEdge(px,py,u,i,x,y){
    const c=this.ctx,w=this.sim.world,m=w.moisture[i],f=w.fertility[i],zone=habitatZone(m,f),neighbors=[[1,0,'e'],[0,1,'s']];
    c.save();
    for(const [dx,dy,side] of neighbors){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=CFG.worldSize||ny>=CFG.worldSize||this.isWater(nx,ny))continue;const ni=w.idx(nx,ny),other=habitatZone(w.moisture[ni],w.fertility[ni]);if(other===zone)continue;const h=hash2(x+dx*17,y+dy*19,907),broken=h>.34;
      const tone=(zone==='wet'||other==='wet')?'rgba(91,133,83,.34)':(zone==='dry'||other==='dry')?'rgba(150,119,74,.30)':'rgba(139,148,88,.24)';c.fillStyle=tone;
      if(side==='e'){const yy=(2+Math.floor(h*8))*u;c.fillRect(px+15*u,py+(broken?yy:2*u),u,(broken?5:12)*u);if(h>.68){c.fillStyle='rgba(191,176,112,.26)';c.fillRect(px+13*u,py+(10+Math.floor(h*3))*u,2*u,u)}}
      else{const xx=(2+Math.floor(h*8))*u;c.fillRect(px+(broken?xx:2*u),py+15*u,(broken?5:12)*u,u);if(h>.68){c.fillStyle='rgba(191,176,112,.26)';c.fillRect(px+(10+Math.floor(h*3))*u,py+13*u,u,2*u)}}
    }
    c.restore();
  }



  drawHabitatTransitions(tile,startX,startY,cols,rows){
    const c=this.ctx,u=this.zoom,minX=startX-2,minY=startY-2,maxX=startX+cols+2,maxY=startY+rows+2;for(const transition of this.habitatTransitions||[]){if(transition.x<minX||transition.y<minY||transition.x>maxX||transition.y>maxY)continue;const px=Math.round((transition.x+.5-this.camera.x)*tile+this.w/2),py=Math.round((transition.y+.5-this.camera.y)*tile+this.h/2);drawHabitatTransition(c,{transition,px,py,u,season:this.sim.season})}
  }

  drawRegionalFocalApproaches(tile){
    const c=this.ctx,u=this.zoom;for(const focal of this.regionalFocals||[]){const px=Math.round((focal.x+.5-this.camera.x)*tile+this.w/2),py=Math.round((focal.y+.5-this.camera.y)*tile+this.h/2);if(px<-4*tile||py<-4*tile||px>this.w+4*tile||py>this.h+4*tile)continue;const approach=this.focalApproaches?.get(`${focal.regionX},${focal.regionY}`);drawFocalApproach(c,{focal,approach,px,py,u,season:this.sim.season})}
  }

  drawRegionalFocals(tile){
    const c=this.ctx,u=this.zoom;for(const focal of this.regionalFocals||[]){const px=Math.round((focal.x+.5-this.camera.x)*tile+this.w/2),py=Math.round((focal.y+.5-this.camera.y)*tile+this.h/2);if(px<-3*tile||py<-3*tile||px>this.w+3*tile||py>this.h+3*tile)continue;this.drawOnHabitatLand(focal,tile,()=>{drawRegionalFocalBackdrop(c,{focal,px,py,u,season:this.sim.season})})}
  }

  drawRegionalFocalForeground(tile){
    const c=this.ctx,u=this.zoom;for(const focal of this.regionalFocals||[]){const px=Math.round((focal.x+.5-this.camera.x)*tile+this.w/2),py=Math.round((focal.y+.5-this.camera.y)*tile+this.h/2);if(px<-3*tile||py<-3*tile||px>this.w+3*tile||py>this.h+3*tile)continue;drawRegionalFocalForeground(c,{focal,px,py,u,season:this.sim.season})}
  }

  drawOnHabitatLand(anchor,tile,paint){const c=this.ctx,w=this.sim.world;c.save();try{c.beginPath();for(let y=anchor.y-4;y<=anchor.y+4;y++)for(let x=anchor.x-4;x<=anchor.x+4;x++){if(x<0||y<0||x>=w.n||y>=w.n||w.water[w.idx(x,y)])continue;c.rect(Math.round((x-this.camera.x)*tile+this.w/2),Math.round((y-this.camera.y)*tile+this.h/2),tile,tile)}c.clip();paint()}finally{c.restore()}}

  drawHabitatScenes(tile){
    const c=this.ctx,u=this.zoom;for(const scene of this.habitatScenes||[]){const px=Math.round((scene.x+.5-this.camera.x)*tile+this.w/2),py=Math.round((scene.y+.5-this.camera.y)*tile+this.h/2);if(px<-2*tile||py<-2*tile||px>this.w+2*tile||py>this.h+2*tile)continue;this.drawOnHabitatLand(scene,tile,()=>{drawTerrainMotifBackdrop(c,{sim:this.sim,scene,px,py,u});drawHabitatSceneBackdrop(c,{scene,px,py,u,season:this.sim.season});drawSceneLandmarkBackdrop(c,{scene,px,py,u,season:this.sim.season})})}
  }

  drawHabitatSceneForeground(tile){
    const c=this.ctx,u=this.zoom;for(const scene of this.habitatScenes||[]){const px=Math.round((scene.x+.5-this.camera.x)*tile+this.w/2),py=Math.round((scene.y+.5-this.camera.y)*tile+this.h/2);if(px<-2*tile||py<-2*tile||px>this.w+2*tile||py>this.h+2*tile)continue;drawHabitatSceneForeground(c,{scene,px,py,u,season:this.sim.season});drawSceneLandmarkForeground(c,{scene,px,py,u,season:this.sim.season});drawTerrainMotifForeground(c,{sim:this.sim,scene,px,py,u})}
  }

  drawSceneDepthForeground(tile){
    const c=this.ctx,u=this.zoom;for(const scene of this.habitatScenes||[]){const px=Math.round((scene.x+.5-this.camera.x)*tile+this.w/2),py=Math.round((scene.y+.5-this.camera.y)*tile+this.h/2);if(px<-2*tile||py<-2*tile||px>this.w+2*tile||py>this.h+2*tile)continue;drawSceneDepthForeground(c,{scene,px,py,u})}
  }

  drawEnvironmentalHistory(px,py,u,i,x,y){
    const c=this.ctx;
    // The excavation appears immediately and fades despite cached terrain.
    drawDisturbedSoil(c,{records:this.sim.partAbilities?.soilDisturbance,cell:i,day:this.sim.day,x,y,px,py,u});
    // Phase 3H performance: read only the four history values drawn here (cell() also derives scar and
    // biomass) and skip the save/restore pair when nothing on this tile is above its visible threshold.
    const hist=this.sim.history;if(!hist)return;
    const h={traffic:hist.traffic[i]||0,grazing:hist.grazing[i]||0,nutrient:hist.nutrientLegacy[i]||0,recovery:hist.recovery[i]||0};
    if(!(h.traffic>.12||h.grazing>.13||h.nutrient>.10||h.recovery>.035))return;const seed=hash2(x,y,311);
    c.save();
    // Existing local traffic supports worn ground, not an invented orthogonal route network.
    drawTrafficGround(c,{world:this.sim.world,traffic:hist.traffic,x,y,px,py,u});
    // Heavy feeding/harvest leaves bare soil and cut stubble until vegetation recovers.
    if(h.grazing>.13){const a=Math.min(.48,(h.grazing-.13)*.62);c.fillStyle=`rgba(116,86,49,${a})`;const ox=(2+Math.floor(hash2(x,y,317)*8))*u,oy=(4+Math.floor(hash2(y,x,319)*7))*u;c.fillRect(px+ox,py+oy,(4+Math.floor(seed*3))*u,(2+Math.floor(seed*2))*u);c.fillStyle=`rgba(202,177,103,${Math.min(.46,a+.06)})`;for(let k=0;k<2;k++){const sx=(3+Math.floor(hash2(x+k,y-k,331)*10))*u,sy=(7+Math.floor(hash2(y+k,x-k,337)*6))*u;c.fillRect(px+sx,py+sy,u,2*u)}}
    // Decomposition persists after the carcass itself is gone as dark, rich soil and fungal flecks.
    if(h.nutrient>.10){const a=Math.min(.38,.08+h.nutrient*.20);c.fillStyle=`rgba(42,54,34,${a})`;const ox=(3+Math.floor(hash2(x,y,347)*7))*u,oy=(5+Math.floor(hash2(y,x,349)*6))*u;c.fillRect(px+ox,py+oy,6*u,4*u);if(h.nutrient>.24){c.fillStyle=`rgba(205,190,142,${Math.min(.58,a+.16)})`;c.fillRect(px+(5+Math.floor(seed*5))*u,py+(5+Math.floor(hash2(x,y,353)*5))*u,u,u);c.fillRect(px+(9+Math.floor(hash2(y,x,359)*3))*u,py+(8+Math.floor(seed*3))*u,u,u)}}
    // Recently recovered ground pushes bright shoots through older grazing scars.
    if(h.recovery>.035){const a=Math.min(.78,.26+h.recovery*.48);c.fillStyle=`rgba(137,190,91,${a})`;for(let k=0;k<3;k++){const sx=(2+Math.floor(hash2(x+k*5,y-k*3,367)*12))*u,sy=(7+Math.floor(hash2(y+k*7,x-k,373)*6))*u;c.fillRect(px+sx,py+sy,u,2*u);if(k===0)c.fillRect(px+(sx+u),py+sy,u,u)}}
    c.restore();
  }

  isWater(x,y){const w=this.sim.world;if(x<0||y<0||x>=CFG.worldSize||y>=CFG.worldSize)return false;return !!w.water[w.idx(x,y)]}
  adjacentLand(x,y){for(const [dx,dy] of CARDINAL){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=CFG.worldSize||ny>=CFG.worldSize)continue;if(!this.isWater(nx,ny))return true}return false}
  drawWaterBank(px,py,u,x,y){
    const c=this.ctx,land=(dx,dy)=>!this.isWater(x+dx,y+dy)&&x+dx>=0&&y+dy>=0&&x+dx<CFG.worldSize&&y+dy<CFG.worldSize;
    const chunks=4,chunk=4;
    c.save();
    const side=(dx,dy,sideName)=>{if(!land(dx,dy))return;for(let q=0;q<chunks;q++){const h=hash2(x*5+q,y*7-q,sideName.length*37),depth=1+Math.floor(h*3),start=q*chunk;
      c.fillStyle=h>.48?'#397982':'#36717b';
      if(sideName==='n')c.fillRect(px+start*u,py,chunk*u,depth*u);
      else if(sideName==='s')c.fillRect(px+start*u,py+(16-depth)*u,chunk*u,depth*u);
      else if(sideName==='w')c.fillRect(px,py+start*u,depth*u,chunk*u);
      else c.fillRect(px+(16-depth)*u,py+start*u,depth*u,chunk*u);
      c.fillStyle='rgba(154,213,194,.34)';
      if((q+Math.floor(h*10))%2===0){if(sideName==='n')c.fillRect(px+(start+1)*u,py+depth*u,(chunk-1)*u,u);else if(sideName==='s')c.fillRect(px+(start+1)*u,py+(15-depth)*u,(chunk-1)*u,u);else if(sideName==='w')c.fillRect(px+depth*u,py+(start+1)*u,u,(chunk-1)*u);else c.fillRect(px+(15-depth)*u,py+(start+1)*u,u,(chunk-1)*u)}
    }};
    side(0,-1,'n');side(0,1,'s');side(-1,0,'w');side(1,0,'e');c.restore();
  }
  drawShore(px,py,u,x,y){
    const c=this.ctx,edge=(dx,dy)=>this.isWater(x+dx,y+dy),chunks=4,chunk=4;
    c.save();
    const side=(dx,dy,name)=>{if(!edge(dx,dy))return;for(let q=0;q<chunks;q++){const h=hash2(x*11+q,y*13-q,name.length*43),depth=1+Math.floor(h*2),start=q*chunk;c.fillStyle=h>.55?'rgba(132,112,68,.55)':'rgba(95,91,59,.50)';
      if(name==='n')c.fillRect(px+start*u,py,chunk*u,depth*u);else if(name==='s')c.fillRect(px+start*u,py+(16-depth)*u,chunk*u,depth*u);else if(name==='w')c.fillRect(px,py+start*u,depth*u,chunk*u);else c.fillRect(px+(16-depth)*u,py+start*u,depth*u,chunk*u);
      if(h>.72){c.fillStyle='rgba(174,160,98,.45)';const peb=1+Math.floor(hash2(x+q,y-q,97)*2);if(name==='n')c.fillRect(px+(start+peb)*u,py+(depth+1)*u,u,u);else if(name==='s')c.fillRect(px+(start+peb)*u,py+(14-depth)*u,u,u);else if(name==='w')c.fillRect(px+(depth+1)*u,py+(start+peb)*u,u,u);else c.fillRect(px+(14-depth)*u,py+(start+peb)*u,u,u)}
    }};
    side(0,-1,'n');side(0,1,'s');side(-1,0,'w');side(1,0,'e');
    // Orthogonal water neighbors cut a small stepped diagonal into the land tile, visually rounding grid corners.
    const cut=(corner)=>{const water='#34727c',shallow='rgba(105,174,161,.48)',bank='rgba(125,108,66,.58)';c.fillStyle=water;
      if(corner==='ne'){c.fillRect(px+13*u,py,3*u,3*u);c.fillRect(px+14*u,py+3*u,2*u,2*u);c.fillStyle=shallow;c.fillRect(px+12*u,py,1*u,3*u);c.fillRect(px+13*u,py+3*u,1*u,2*u);c.fillStyle=bank;c.fillRect(px+11*u,py,1*u,2*u)}
      else if(corner==='nw'){c.fillRect(px,py,3*u,3*u);c.fillRect(px,py+3*u,2*u,2*u);c.fillStyle=shallow;c.fillRect(px+3*u,py,1*u,3*u);c.fillRect(px+2*u,py+3*u,1*u,2*u);c.fillStyle=bank;c.fillRect(px+4*u,py,1*u,2*u)}
      else if(corner==='se'){c.fillRect(px+13*u,py+13*u,3*u,3*u);c.fillRect(px+14*u,py+11*u,2*u,2*u);c.fillStyle=shallow;c.fillRect(px+12*u,py+13*u,1*u,3*u);c.fillRect(px+13*u,py+11*u,1*u,2*u);c.fillStyle=bank;c.fillRect(px+11*u,py+14*u,1*u,2*u)}
      else{c.fillRect(px,py+13*u,3*u,3*u);c.fillRect(px,py+11*u,2*u,2*u);c.fillStyle=shallow;c.fillRect(px+3*u,py+13*u,1*u,3*u);c.fillRect(px+2*u,py+11*u,1*u,2*u);c.fillStyle=bank;c.fillRect(px+4*u,py+14*u,1*u,2*u)}};
    const n=edge(0,-1),so=edge(0,1),we=edge(-1,0),e=edge(1,0);if(n&&e)cut('ne');if(n&&we)cut('nw');if(so&&e)cut('se');if(so&&we)cut('sw');c.restore();
  }
  drawVegetation(i,px,py,u,x,y,hierarchy=null){
    if(this.vegOnly!=='minor')for(const kind of Object.keys(PLANTS))this.visiblePlantTargets?.delete(i+'|'+kind);
    const w=this.sim.world,entries=[],macro=smoothNoise2(x,y,11,601),patch=smoothNoise2(x,y,5.5,607),edgeNoise=hash2(x,y,613),comp=visualCompositionAt(w,x+.5,y+.5,this.habitatField),densityBias=(macro-.5)*.18+comp.thicket*.18-comp.openness*.23;
    for(const [kind,p] of Object.entries(PLANTS)){
      const amount=w.plants[kind]?.[i]||0,noise=hash2(x,y,kind.length*211),structural=kind!=='sunmoss';let threshold=renderThreshold(p.render)+(noise-.5)*.16-densityBias;
      if(structural){threshold+=(patch<.34?.10:patch>.72?-.06:0)+comp.openness*.11-comp.thicket*.08;if(edgeNoise<.10)threshold+=.06}
      if(amount<=threshold)continue;entries.push({kind,p,amount,score:amount-threshold+noise*.08});
    }
    this.drawSeedling(i,px,py,u,x,y);if(!entries.length)return;
    const ground=entries.find(e=>e.kind==='sunmoss');if(ground){const full=ground.amount>(.80+hash2(x,y,223)*.10-densityBias*.24);if(full)this.drawPlant(ground.p.render,ground.p.color,ground.amount*(.80+macro*.28),px,py,u,x,y,ground.kind);else if(ground.amount>.58&&hash2(x,y,221)>.64&&smoothNoise2(x,y,5,719)>.52){this.ctx.save();this.ctx.globalAlpha*=hierarchy?.traceAlpha??1;this.vegOnly!=='major'&&this.drawPlantTrace(ground.p.render,ground.p.color,px,py,u,x,y,ground.kind);this.ctx.restore()}}
    const structural=entries.filter(e=>e.kind!=='sunmoss').sort((a,b)=>b.score-a.score);if(structural[0]){const e=structural[0],full=e.score>.10||hash2(x,y,225)>.55;if(full)this.drawPlant(e.p.render,e.p.color,e.amount,px,py,u,x,y,e.kind);else{this.ctx.save();this.ctx.globalAlpha*=hierarchy?.traceAlpha??1;this.vegOnly!=='major'&&this.drawPlantTrace(e.p.render,e.p.color,px,py,u,x,y,e.kind);this.ctx.restore()}}if(structural[1]&&structural[1].score>.42&&(patch>.66||comp.thicket>.70)&&hash2(x,y,227)>.68)this.drawPlant(structural[1].p.render,structural[1].p.color,structural[1].amount,px,py,u,x,y,structural[1].kind);
    // Nearby coat-bearing food remains visible beneath dominant vegetation.
    // Use the existing finite crop and genotype; the small-plant silhouette stays sparse.
    const player=this.sim.player();if(player&&Math.hypot(x+.5-player.x,y+.5-player.y)<2.5)for(const [kind,p] of Object.entries(PLANTS)){const amount=w.plants[kind]?.[i]||0;if(amount>.025&&this.sim.dispersal.genomeAt(kind,i)?.traits.coatAllocation>0&&!this.visiblePlantTargets?.has(i+'|'+kind))this.drawPlant(p.render,p.color,amount,px,py,u,x,y,kind);}
    // Small decomposer clusters are visible where real organic substrate supports them.
    // Biomass and depletion remain canonical; this does not create a food stock.
    if(w.rotcap[i]>.025&&(w.carrion[i]>.02||(this.sim.dispersal.litter[i]||0)>.02)&&!this.visiblePlantTargets?.has(i+'|rotcap'))this.drawPlant(PLANTS.rotcap.render,PLANTS.rotcap.color,w.rotcap[i],px,py,u,x,y,'rotcap');
  }
  drawSeedling(i,px,py,u,x,y){
    if(this.vegOnly==='major')return;
    const w=this.sim.world;let best=null;
    for(const [kind,p] of Object.entries(PLANTS)){if(!p.dispersal?.seedLimited)continue;const amount=w.plants[kind]?.[i]||0,bank=w.seedBank?.[kind]?.[i]||0;if(amount<=.002&&bank<=.025)continue;if(amount>renderThreshold(p.render))continue;const score=amount*4+bank;if(!best||score>best.score)best={kind,p,amount,bank,score}}
    // World art pass (v1.51.0): seedlings show in patches rather than on every tile; one that is
    // nearly grown always shows.
    if(best&&best.amount<renderThreshold(best.p.render)*.9&&!(smoothNoise2(x,y,4.5,709)>.52&&hash2(x,y,711)>.25))return;
    if(best){drawFloraSeedling(this.ctx,{...best,px,py,u,x,y});if(best.amount>.002){this.visiblePlantTargets??=new Map();const {ox,base}=floraSeedlingAnchor(best.kind,x,y);this.visiblePlantTargets.set(i+'|'+best.kind,{i,food:best.kind,x:x+.5,y:y+.5,hitX:x+(ox+.5)/16,hitY:y+(base-3)/16})}}
  }
  drawPlantTrace(shape,color,px,py,u,x,y,kind){const i=this.sim.world.idx(x,y),{ox,oy}=floraTraceAnchor(kind,x,y);this.visiblePlantTargets??=new Map();this.visiblePlantTargets.set(i+'|'+kind,{i,food:kind,x:x+.5,y:y+.5,hitX:x+(ox+.5)/16,hitY:y+(oy-2)/16});drawFloraTrace(this.ctx,{shape,color,px,py,u,x,y,kind,amount:this.sim.world.plants[kind]?.[i]||0,season:this.sim.season,seedAllocation:this.sim.dispersal.genomeAt(kind,i)?.traits.seedAllocation??.2,coatAllocation:this.sim.dispersal.genomeAt(kind,i)?.traits.coatAllocation??.25})}
  drawPlant(shape,color,amount,px,py,u,x,y,kind){
    if(this.vegOnly==='minor')return;
    this.visiblePlantTargets??=new Map();this.plantTargetWorld=this.sim.world;const visualAnchor=floraVisualAnchor(shape,x,y,(tx,ty)=>this.isWater(tx,ty)),i=this.sim.world.idx(x,y);this.visiblePlantTargets.set(i+'|'+kind,{i,food:kind,x:x+.5,y:y+.5,hitX:x+visualAnchor.x/16,hitY:y+visualAnchor.y/16});
    drawFloraPlant(this.ctx,{shape,color,amount,px,py,u,x,y,kind,visualAnchor,seedAllocation:this.sim.dispersal.genomeAt(kind,i)?.traits.seedAllocation??.2,coatAllocation:this.sim.dispersal.genomeAt(kind,i)?.traits.coatAllocation??.25,reproduction:botanicalPlantView(this.sim.dispersal,kind,i),season:this.sim.season,isWater:(tx,ty)=>this.isWater(tx,ty)});
  }
  drawCarrion(px,py,u,amount){const c=this.ctx;c.save();c.translate(px,py);pixel(c,4,11,8,2,u,'rgba(48,29,26,.42)');pixel(c,5,8,6,3,u,'#8b554d');pixel(c,4,9,2,2,u,'#6f443f');if(amount>.7){pixel(c,10,7,1,4,u,'#d2c7a9');pixel(c,9,8,3,1,u,'#d2c7a9')}c.restore()}
  // The player's gait follows its actual drawn displacement whoever moves it
  // (keys, click-to-move or AUTO), on its own motion state so it never disturbs
  // the position easing. Leg anatomy still sets stride, lift and cadence.
  playerGaitVisual(a,gaitPerTile){const g=this.motion.sample({...a,id:'gait:'+a.id,x:this.playerVisual.x,y:this.playerVisual.y},this.sim.tickCount,this.renderNow,{hz:CFG.controlHz,response:'linear',snap:true,gaitPerTile});return{...this.playerVisual,gaitPhase:g.gaitPhase,recentlyMoving:g.recentlyMoving}}
  drawAnimal(a,tile){
    const c=this.ctx;
    const scale=this.zoom,ph=phenotypeFor(a),dev=developmentFor(a),social=this.sim.social?.visualState?.(a)||null,gaitPerTile=8*CFG.tileSize/gaitTravelFor(ph.limbScale*(.72+.28*(a.player?dev.growth:Math.round(dev.growth*32)/32)),assemblyFor(a)?.legSlots),visual=a.player&&this.playerVisual?this.playerGaitVisual(a,gaitPerTile):this.motion.sample(a,this.sim.tickCount,this.renderNow,{hz:(a.player||a.pursuitEngaged)?CFG.controlHz:CFG.simHz,response:'linear',gaitPerTile}),px=Math.round((visual.x-this.camera.x)*tile+this.w/2),py=Math.round((visual.y-this.camera.y)*tile+this.h/2);(this.screenPos||=new Map()).set(a.id,{x:px,y:py});let action=a.torpor?'rest':this.actionPose(a,!!visual.moving);
    const targetTravel=!!(a.target&&!['eat','drink','court'].includes(action)),moving=!!a.climb||!!visual.moving||(a.player?!!visual.recentlyMoving:!!visual.recentlyMoving&&targetTravel);if(a.player)this.lastPlayerDrawMoving=moving;
    let phase=moving?(visual.gaitPhase??visual.phase):(((this.encounters?.time||0)/.22)+a.id)%8;
    // Autonomous gait phases are ID-offset in presentation so unrelated wildlife does not
    // hit the same footfall on every shared ecology beat. Simulation animation stays canonical.
    if(moving&&!a.player)phase=(phase+(a.id*3.125)%8)%8;
    // Social groups share a broad rhythm while retaining fractional visual phase.
    if(moving&&social?.size>=3){
      phase=(phase+social.memberIndex*.75)%8;
    }
    const feeding=(this.feeding||=new FeedingPresentation()).sample(this.sim,a,this.encounters?.time||0,{moving,phase});if(feeding&&!social?.alarm)action=feeding.mode==='crush'?'crack':'eat';
    if(a.climb||a.caveTransit){action='climb';phase=a.anim}if(a.burrowWork){action='dig';phase=a.anim}
    const encounter=this.encounters?.sample(this.sim,a,phase)||{};
    // Brace receipts, stalled charges, carried wounds and retreats read from combat state.
    const reaction=(this.reactions||=new EncounterReactionPresentation()).sample(this.sim,a,this.encounters?.time||0),defense=this.reactions.sampleDefense(this.sim,a,this.encounters?.time||0),reactionAt=reactionAttention(reaction);if(reactionAt&&!encounter.attention&&!a.player)encounter.attention=reactionAt;
    // Each animal's own threat stage (watching, backing away) from staged perception.
    const fright=reaction||a.player?null:reactionExpression(this.sim,a,{moving,time:this.encounters?.time||0});if(fright?.attention&&!encounter.attention)encounter.attention=fright.attention;
    const frame=Math.floor(phase)&7,gait=cycle8(GAIT,phase),alert=!!social?.alarm;
    // v1.59.0: cached creatures animate in quarter frames while moving (32 poses a stride), so their
    // bodies move smoothly instead of jumping between eight whole poses; idle creatures use whole frames.
    const cachePhase=moving?Math.floor(phase*4)/4:Math.floor(phase);
    let drawDir=a.dir;
    const read=this.sim.lastPlayerAction;if(a.player&&!moving&&action==='forage'&&read?.type==='trace-study'&&read.actorId===a.id)drawDir=vectorDir(read.x-a.x,read.y-a.y,a.dir);
    if(!a.player&&moving&&Number.isFinite(visual.headingX)&&Number.isFinite(visual.headingY)&&(Math.abs(visual.headingX)+Math.abs(visual.headingY)>.01))drawDir=vectorDir(visual.headingX,visual.headingY,a.dir);
    const committedAim=a.playerHunt&&['windup','charge'].includes(a.playerHunt.phase)&&Number.isFinite(a.playerHunt.aimX)&&Number.isFinite(a.playerHunt.aimY)?a.playerHunt:null;
    // During a player-facing Stalker tell, the body and the ground telegraph share the same
    // committed lane. The actual simulation target is still owned by PredatorEncounterController.
    if(!a.player&&!moving&&encounter.attention)drawDir=vectorDir(encounter.attention.x-a.x,encounter.attention.y-a.y,a.dir);
    else if(committedAim)drawDir=vectorDir(committedAim.aimX-a.x,committedAim.aimY-a.y,a.dir);
    else if(feeding?.attention&&!moving&&!social?.alarm)drawDir=vectorDir(feeding.attention.x-a.x,feeding.attention.y-a.y,a.dir);
    // Idle animals visually acknowledge companions or a threat; actual movement direction remains simulation-owned.
    else if(!moving&&!a.player&&social?.size>=2){
      if(alert&&Number.isFinite(social.threatX))drawDir=vectorDir(social.threatX-a.x,social.threatY-a.y,a.dir);
      else if(dev.stage==='newborn'||dev.stage==='juvenile'){
        if(Number.isFinite(social.caregiverX))drawDir=vectorDir(social.caregiverX-a.x,social.caregiverY-a.y,a.dir);
        else drawDir=vectorDir(social.center.x-a.x,social.center.y-a.y,a.dir);
      }else drawDir=vectorDir(social.center.x-a.x,social.center.y-a.y,a.dir);
    }else if(a.target&&Number.isFinite(a.target.x)&&Number.isFinite(a.target.y)&&['eat','drink','court','hunt'].includes(action)){
      drawDir=vectorDir(a.target.x-a.x,a.target.y-a.y,a.dir);
    }
    // v1.59.0: turning eases through the in-between facings (one 45-degree step every 70 ms) instead
    // of snapping across several at once. Presentation only; the simulation's facing is unchanged.
    drawDir=this.easedDir(a.id,drawDir&7);
    const bob=(a.airborne||alert||['drink','eat','hunt'].includes(action))?0:(moving?cycle8(BODY_BOB,phase):0);
    // Whole-body carriage from mounted legs and build; a plain walker keeps exactly the shared bob.
    const carriage=(a.airborne||alert||['drink','eat','hunt'].includes(action))?null:locomotionOffsets(locomotionStyle(a),{phase,moving,action,baseBob:bob,propulsion:action==='swim'?(movementProfile(a,this.sim.world).speed||0)/.66:1});
    const visualGrowth=a.player?dev.growth:Math.round(dev.growth*32)/32;ph.bodyScale*=visualGrowth;ph.limbScale*=.72+.28*visualGrowth;ph.sensoryScale*=.78+.22*visualGrowth;if(dev.maturity<.55){ph.stripe=false;ph.spot=false}
    const inWater=liquidContact(this.sim.world,a);if(a.airborne)action=a.aerialMode==='jump'?'jump':a.aerialMode==='glide'?'glide':'fly';else if(a.jumpLanding&&this.sim.tickCount-a.jumpLanding.tick>=0&&this.sim.tickCount-a.jumpLanding.tick<3)action='land';else if(inWater&&(this.sim.canSwim?.(a)||a.iceImmersion)&&!['eat','drink','crack'].includes(action))action='swim';
    const life=visualLifeState(this.sim,a,{frame,moving,action,development:dev,social,timeSeconds:this.encounters?.time});life.growth=visualGrowth;if(a.torpor){life.breath*=.28;life.settle=Math.max(life.settle,.72)}if(!a.player){life.breath=Math.round(life.breath*8)/8;life.settle=Math.round(life.settle*8)/8;}
    const behavior=behaviorVisualState({bodyPlan:a.bodyPlan,id:a.id,action,phase,moving,life,social});
    // Body and joints yield above support; contact shadows/toes stay on the ground.
    if(carriage){behavior.bodyRise+=carriage.rise;behavior.bodySway=(behavior.bodySway||0)+carriage.sway;behavior.torsoTwist=carriage.twist;behavior.dorsalRoll=carriage.roll;behavior.bodyLean=(behavior.bodyLean||0)+carriage.lean}
    const birth=(this.birthSettlement||=new BirthSettlementPresentation()).sample(this.sim,a,this.encounters?.time||0,{moving,blocked:!!social?.alarm||!!reaction||!!defense||!!fright||!!encounter.move||!!encounter.impact||!!encounter.outcome||!['idle','rest','move','social','forage','eat','crack'].includes(action)});
    if(!social?.alarm)applyFeedingExpression(behavior,feeding);
    applyBirthSettlement(behavior,birth,{feeding:!!feeding});
    applyEncounterPose(behavior,encounter);applyEncounterReaction(behavior,reaction);applyDefenseReaction(behavior,defense);applyReactionPose(behavior,fright);
    const attackTarget=a.player&&a.attackAction?.targetId!==undefined?this.sim.animals.find(t=>t.id===a.attackAction.targetId&&t.alive):null;
    const looking=attentionTarget(a,{social,encounter,feeding,committedAim,attackTarget,action});
    behavior.headTurn=(this.headAttention||=new HeadAttentionPresentation()).sample(this.sim,a,looking,drawDir,this.encounters?.time||0);
    const combatStatus=a.player?this.sim.playerCombat?.status?.(a):null,winded=a.player?!!this.sim.exertion?.isWinded?.(a):false;if(combatStatus)applyPlayerCombatPose(behavior,combatStatus,winded,a);
    const impact=this.sim.lastPlayerCombatImpact?.targetId===a.id&&this.sim.tickCount-this.sim.lastPlayerCombatImpact.tick<=2?this.sim.lastPlayerCombatImpact:null;
    const pose={reactionStage:fright?.stage||null,growth:visualGrowth,encounter,social,alert,sharedAlert:!!social?.sharedAlarm,dependent:dev.stage==='newborn'||dev.stage==='juvenile',stage:dev.stage,dir:drawDir,action,life,behavior,hidden:!!a.hidden,carry:a.carryingFood||null,combatImpact:impact,partExpression:this.partExpressions.sample(this.sim,a,action)};
    const contact=environmentContactFor(this.sim.world,a,{action,phase,moving});
    this.drawPredatorChargeTell(a,tile,px,py);
    let recoilX=0,recoilY=0;if(impact&&impact.kind!=='miss'){const p=this.sim.player(),dx=a.x-(p?.x??a.x),dy=a.y-(p?.y??a.y),len=Math.hypot(dx,dy)||1,k=(3-Math.max(0,this.sim.tickCount-impact.tick))*.32;recoilX=dx/len*k;recoilY=dy/len*k}
    const shove=reactionShove(reaction,a);if(shove){recoilX+=shove.x;recoilY+=shove.y}const dShove=defenseShove(defense,a);if(dShove){recoilX+=dShove.x;recoilY+=dShove.y}
    c.save();c.translate(px+recoilX*scale,py+((life.hurt&&!moving?1:0)+recoilY)*scale);
    if(!a.underground&&!a.airborne&&!a.perched&&!(a.diveDepth>.03))drawGroundContact(c,{contact,scale,bodyScale:ph.bodyScale,dir:drawDir});
    if(!a.underground&&!a.airborne&&!a.perched)drawActivityGround(c,{bodyPlan:a.bodyPlan,id:a.id,frame:phase,moving,action,scale,dir:drawDir});
    const depthShadow=creatureShadowFor(this.sim.world,a,this.habitatField,{bodyScale:ph.bodyScale+(life.exhausted?.08:0),moving,dir:drawDir});drawCreatureDepthShadow(c,{shadow:depthShadow,scale,hurt:life.hurt});
    if(a.airborne||a.perched){c.save();c.globalAlpha*=.22;c.fillStyle='#23303d';c.beginPath();c.ellipse(0,2*scale,6*scale,3*scale,0,0,Math.PI*2);c.fill();c.restore();c.translate(0,(a.climb?-a.climb.height*7/3:a.aerialMode==='jump'?-Math.max(0,Math.min(16,(a.jump.altitude-glideGround(this.sim.world,a.x,a.y))*7)):a.aerialMode==='glide'?-Math.max(1,Math.min(14,(a.glideAltitude-glideGround(this.sim.world,a.x,a.y))*3)):a.airborne?-9:-7)*scale)}
    const palette=creaturePalette(ph);
    if(a.hidden)c.globalAlpha*=.58;
    if(a.caveTransit){const progress=Math.min(1,a.caveTransit.elapsed/CAVES.transitionSeconds),depth=a.caveTransit.entering?progress:1-progress;c.translate(0,depth*5*scale);c.globalAlpha*=1-depth*.55}
    if((a.diveDepth||0)>.03){c.globalAlpha*=.55;c.translate(0,Math.min(4,a.diveDepth*4)*scale)}
    // Record the actual translated sprite surface for DOM obstruction avoidance,
    // including aerial/climbing/depth offsets; UI does not reimplement those rules.
    if(a.player||a.id===this.overlayTargetId){const t=c.getTransform?.();if(t){const radius=Math.ceil(44*scale/2)+2,rx=radius*(Math.abs(t.a)+Math.abs(t.c)),ry=radius*(Math.abs(t.b)+Math.abs(t.d));this.screenBounds.set(a.id,{left:t.e-rx,top:t.f-ry,right:t.e+rx,bottom:t.f+ry,width:rx*2,height:ry*2});}}
    drawGenvoSprite(c,{animal:a,phenotype:ph,scale,frame:a.player?phase:cachePhase,moving,palette,pose,cacheKey:a.player||feeding||birth||action==='crack'||encounter.move||encounter.crestSpread>0||encounter.impact||encounter.outcome||reaction||defense?null:spriteKey(a,palette,drawDir,cachePhase,moving,pose,life)});
    if(a.pollenCargo?.mass>0){pixel(c,-3,-3,1,1,scale,'#dfba5b');pixel(c,2,-4,1,1,scale,'#e9d37d');pixel(c,4,-1,1,1,scale,'#cda64e')}
    this.drawLifeEffects(a,scale,frame,pose,palette);

    if(a.caveTransit&&!a.player){c.globalAlpha=1;c.fillStyle='#d4ddc6';c.font='bold 11px sans-serif';c.textAlign='center';c.fillText((a.caveTransit.entering?'Descending ':'Surfacing ')+Math.round(a.caveTransit.elapsed/CAVES.transitionSeconds*100)+'%',0,-12*scale)}
    if(a.climb&&!a.player){c.fillStyle='#e4d4a8';c.font='bold 11px sans-serif';c.textAlign='center';c.fillText('Climb '+a.climb.height.toFixed(1),0,-10*scale)}
    if((a.diveDepth||0)>.03){c.globalAlpha=1;c.strokeStyle='#8acbd2';c.lineWidth=Math.max(1,scale*.35);c.beginPath();c.ellipse(0,-3*scale,7*scale,3*scale,0,0,Math.PI*2);c.stroke();c.fillStyle='#c5f1eb';c.font='bold 11px sans-serif';c.textAlign='center';if(!a.player)c.fillText('↓ '+a.diveDepth.toFixed(2),0,-9*scale)}
    if(combatStatus)drawPlayerCombatFeedback(c,{animal:a,status:combatStatus,winded,scale,now:this.renderNow,dir:drawDir});else if(a.playerHunt)drawStalkerPursuitFeedback(c,{animal:a,scale,now:this.renderNow});
    drawEncounterReactionMarks(c,{reaction,animal:a,scale,dir:drawDir});drawDefenseMarks(c,{reaction:defense,animal:a,scale,dir:drawDir});
    if(!a.underground&&!a.airborne&&!a.perched&&!(a.diveDepth>.03))drawForegroundContact(c,{contact,scale,bodyScale:ph.bodyScale,isPlayer:!!a.player});
    this.drawMarkers(a,scale);
    // Two quiet 32-grid pixel sleep strokes readable from above; no side-view
    // body, new actor animation state or invented simulation energy.
    if(a.torpor){const alpha=.55+.20*Math.sin((this.renderNow||0)*.0016+a.id);c.save();c.globalAlpha*=alpha;for(const [x,y] of [[6,-12],[7,-12],[8,-12],[8,-11],[7,-10],[6,-9],[7,-9],[8,-9],[10,-15],[11,-15],[11,-14],[10,-13],[11,-13]])pixel(c,x,y,1,1,scale,'#d8e4e2');c.restore()}
    if(a.infected){pixel(c,-6,-7,1,2,scale,'rgba(219,121,177,.78)');pixel(c,5,-7,1,2,scale,'rgba(219,121,177,.62)')}c.restore();
  }
  easedDir(id,target){
    const m=this.turnState||(this.turnState=new Map()),now=this.renderNow,st=m.get(id);if(!st){m.set(id,{d:target,t:now});return target}
    if(st.d!==target&&now-st.t>=70){const diff=((target-st.d+12)%8)-4;st.d=(st.d+(diff>0?1:diff<0?-1:1)+8)%8;st.t=now}else if(st.d===target)st.t=Math.max(st.t,now-70);
    if(m.size>1200)for(const k of m.keys()){m.delete(k);if(m.size<=900)break}return st.d;
  }
  actionPose(a,moving=false){return visualActionFromIntent(this.sim,a,{moving})}
  drawPredatorChargeTell(a,tile,px,py){
    const h=a?.playerHunt;if(!h||!['windup','charge'].includes(h.phase)||!Number.isFinite(h.aimX)||!Number.isFinite(h.aimY))return;
    const c=this.ctx,tx=Math.round((h.aimX-this.camera.x)*tile+this.w/2),ty=Math.round((h.aimY-this.camera.y)*tile+this.h/2),dx=tx-px,dy=ty-py,len=Math.hypot(dx,dy);if(len<8)return;
    const profile=stalkerProfileFor(a),hot=h.phase==='charge',steps=Math.max(4,Math.min(9,Math.floor(len/26)));
    c.save();c.globalAlpha=hot?0.68:0.46;c.fillStyle=profile.visual?.accent||(hot?'#ef7469':'#d99a75');
    // Sparse ground dashes read as the predator's committed lane without becoming a HUD ray.
    for(let i=1;i<=steps;i++){const t=i/(steps+1),x=px+dx*t,y=py+dy*t,w=hot?6:4,hgt=hot?2:1;c.fillRect(Math.round(x-w/2),Math.round(y-hgt/2),w,hgt)}
    c.globalAlpha=hot?0.82:0.62;c.fillRect(tx-4,ty-1,9,2);c.fillRect(tx-1,ty-4,2,9);c.restore();
  }
  drawLifeEffects(a,s,frame,pose,p){
    const c=this.ctx,v=DIR8[pose.dir??a.dir]||DIR8[0],perp={x:-v.y,y:v.x},action=pose.action||'idle',life=pose.life||{};
    if((action==='eat'||action==='crack')&&frame%2===0){for(const sign of [-1,1])pixel(c,Math.round(v.x*7+perp.x*sign*2),Math.round(v.y*7+perp.y*sign*2+2),1,1,s,sign>0?'#99a75c':'#6f7c48')}
    if(life.sick&&!pose.dependent&&(frame===1||frame===5)){pixel(c,-5,-7,1,1,s,'rgba(203,129,169,.62)');pixel(c,5,-6,1,1,s,'rgba(203,129,169,.42)')}
    // A real, energy-funded performance, not merely standing near a mate. Its
    // intensity is inherited anatomy expressed through the existing court pose.
    if(action==='court'&&a.courtshipPerformance&&this.sim.tickCount<=a.courtshipPerformance.endsAt){
      const strength=a.courtshipPerformance.intensity||0,beat=Math.floor(pose.encounter?.displayPhase??frame)&7;
      const move=currentCourtshipMove(this.sim,a)||'approach';
      // Only the actual anatomy-enabled action produces its matching cue.
      for(const side of [-1,1]){
        const x=Math.round(perp.x*side*(6+strength*3)+v.x*(beat<4?1:-1));
        const y=Math.round(perp.y*side*(6+strength*3)-5-(beat%4));
        if(move==='dance')pixel(c,x,Math.round(4+Math.sin(beat*Math.PI/4)*2),2,1,s,'#d1a572');
        else if(move==='call'){c.save();c.strokeStyle='#bad7d4';c.lineWidth=1;c.beginPath();c.arc(v.x*7,v.y*7,5+beat/2,0,Math.PI);c.stroke();c.restore();}
        else if(move==='flare')pixel(c,x,y,1+Math.round(strength),2,s,side<0?'#e1ac70':'#ebd987');
        else if(move==='scent')pixel(c,x+side*(beat%3),y-(beat%4),1,1,s,'rgba(177,210,148,.55)');
        else if(move==='gesture')pixel(c,x,y+Math.round(Math.sin(beat*Math.PI/4)*2),1,2,s,'#c4bb95');
      }
    }
    if(pose.encounter?.outcome){const paired=pose.encounter.outcome==='paired';c.save();c.globalAlpha=pose.encounter.outcomeStrength*.6;c.strokeStyle=paired?'#d6c784':'#a8bab3';c.lineWidth=1;c.beginPath();c.arc(0,-10*s,3*s,paired?0:Math.PI*.15,paired?Math.PI*2:Math.PI*.85);c.stroke();c.restore()}
    if(life.hurt&&frame===6){pixel(c,-4,-8,1,1,s,'rgba(230,138,126,.82)');pixel(c,4,-7,1,1,s,'rgba(230,138,126,.58)')}
    if(pose.combatImpact&&pose.combatImpact.kind!=='miss'){const hot=pose.combatImpact.kind==='stagger'?'#ffd58a':'#f49b88';pixelLine(c,-7,-5,-4,-8,s,hot);pixelLine(c,6,-7,8,-4,s,hot);if(pose.combatImpact.kind==='stagger'){pixel(c,-9,-2,2,1,s,'#f1cf88');pixel(c,8,-1,2,1,s,'#f1cf88')}}
    if(life.thirsty&&!pose.dependent&&frame===4)pixel(c,5,-7,1,2,s,'rgba(135,203,214,.62)');
  }
  drawMarkers(a,s){
    const c=this.ctx,selectedMate=this.sim.reproduction?.selectedMateId,court=this.sim.reproduction?.courtTargetId;
    const pregnancy=this.sim.family?.pregnancyProgress(a);if(pregnancy){const w=Math.max(2,Math.round(5*s*pregnancy.progress));c.fillStyle='#e5a8b1';c.fillRect(-w/2,7*s,w,1*s)}
    if(a.lineage&&a.species==='genvo'&&!a.player){const active=this.sim.player(),d=active?Math.hypot(a.x-active.x,a.y-active.y):Infinity;if(d<12){c.fillStyle='rgba(239,216,151,.56)';c.fillRect(-7*s,7*s,2*s,1*s);c.fillRect(5*s,7*s,2*s,1*s)}}
    if(a.parentIds?.length&&this.sim.tickCount-a.birthTick<CFG.dayTicks*2){c.strokeStyle='rgba(242,216,167,.72)';c.lineWidth=1;c.beginPath();c.arc(0,0,6*s,0,Math.PI*2);c.stroke()}
    if(a.id===selectedMate){c.fillStyle='#e6ca72';c.fillRect(-2*s,-10*s,4*s,2*s)}
    if(a.id===court){c.strokeStyle='#f29a72';c.lineWidth=2;c.beginPath();c.arc(0,0,8*s,0,Math.PI*2);c.stroke()}
    if(a.id===this.sim.lineage?.selectedHeirId){c.fillStyle='#8de4d3';c.fillRect(-3*s,-11*s,6*s,2*s)}
    const social=this.sim.social?.state?.(a);if(social?.alarm){c.fillStyle='#e7b36f';c.fillRect(-1*s,-12*s,2*s,2*s)}
    if(canHunt(a)){const p=this.sim.player(),d=p?Math.hypot(a.x-p.x,a.y-p.y):Infinity;if(d<11){const hot=!!a.playerHunt&&!this.sim.isOpeningProtected?.(p),profile=stalkerProfileFor(a);c.fillStyle=hot?'#ef7469':'rgba(214,110,99,.74)';if(profile.id==='rusher'){c.fillRect(-5*s,-13*s,3*s,1*s);c.fillRect(2*s,-13*s,3*s,1*s);c.fillRect(-1*s,-15*s,2*s,3*s)}else if(profile.id==='wary'){c.fillRect(-5*s,-13*s,2*s,1*s);c.fillRect(-1*s,-14*s,2*s,1*s);c.fillRect(3*s,-13*s,2*s,1*s)}else{const side=(a.id&1)?1:-1;c.fillRect((-5*side-1)*s,-13*s,4*s,1*s);c.fillRect((2*side-1)*s,-14*s,2*s,1*s)}if(hot)c.fillRect(-1*s,-16*s,2*s,1*s)}}
  }

}

function pixel(c,x,y,w,h,s,color){c.fillStyle=color;c.fillRect(Math.round(x*s),Math.round(y*s),Math.max(1,Math.round(w*s)),Math.max(1,Math.round(h*s)))}
function pixelLine(c,x0,y0,x1,y1,s,color){let x=Math.round(x0),y=Math.round(y0),tx=Math.round(x1),ty=Math.round(y1),dx=Math.abs(tx-x),dy=Math.abs(ty-y),sx=x<tx?1:-1,sy=y<ty?1:-1,err=dx-dy;for(let guard=0;guard<24;guard++){pixel(c,x,y,1,1,s,color);if(x===tx&&y===ty)break;const e2=2*err;if(e2>-dy){err-=dy;x+=sx}if(e2<dx){err+=dx;y+=sy}}}

function cycle8(values,phase){phase=((Number(phase)%8)+8)%8;const a=Math.floor(phase),b=(a+1)&7,t=phase-a;return values[a]+(values[b]-values[a])*t}

function vectorDir(dx,dy,fallback=0){if(Math.abs(dx)<.001&&Math.abs(dy)<.001)return fallback;const angle=Math.atan2(dy,dx);return(Math.round((angle+Math.PI/2)/(Math.PI/4))+8)%8}

function hash2(x,y,salt=0){let n=(x*374761393+y*668265263+salt*1442695041)>>>0;n=(n^(n>>13))*1274126177>>>0;return((n^(n>>16))>>>0)/4294967295}
// v1.57.0: what a creature's finished sprite depends on, so a pose seen before is one canvas copy.
// The active creature is never cached (its pose reacts continuously to input and combat).
function spriteKey(a,pal,dir,phase,moving,pose,life){return a.id+'|'+(a.bodyPlan?.id||'')+'|'+pal.body+'|'+dir+'|'+(Math.round(phase*4)&31)+'|'+(moving?1:0)+'|'+pose.action+'|'+pose.stage+'|'+(pose.alert?1:0)+(pose.dependent?1:0)+(pose.hidden?1:0)+(life?.hurt?1:0)+(life?.exhausted?1:0)+(life?.sick?1:0)+(life?.blink?1:0)+(pose.carry?1:0)+'|growth'+(pose.growth??1)+'|breath'+(life?.breath??0)+'|settle'+(life?.settle??0)+':'+((life?.settleIndex??0)%Math.max(1,a.bodyPlan?.nodes.filter(n=>n.socket?.startsWith('limb.')).length||8))+'|'+(a.genVersion||0)+(pose.reactionStage?'|r'+pose.reactionStage+(pose.behavior?.headTurn??0):'')}
function smoothNoise2(x,y,cell=8,salt=0){
  const gx=Math.floor(x/cell),gy=Math.floor(y/cell),fx=(x-gx*cell)/cell,fy=(y-gy*cell)/cell;
  const sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),a=hash2(gx,gy,salt),b=hash2(gx+1,gy,salt),c=hash2(gx,gy+1,salt),d=hash2(gx+1,gy+1,salt);
  const top=a+(b-a)*sx,bottom=c+(d-c)*sx;return top+(bottom-top)*sy;
}
function habitatZone(m,f){if(m>.62)return 'wet';if(m<.30)return 'dry';if(f>.72)return 'rich';return 'meadow'}
function terrainColor(m,f,season,hash,palette=null){
  let h=96,s=25,l=29;if(m>.68){h=130;s=29;l=27}else if(f>.64){h=102;s=30;l=30}else if(f<.34){h=75;s=20;l=29}
  if(season==='SUMMER'){h-=14;s-=1;l+=3}else if(season==='AUTUMN'){h-=18;s-=2;l+=1}else if(season==='WINTER'){h+=16;s-=15;l+=5}else if(season==='SPRING'){s+=3;l+=1}
  if(palette){h+=palette.hue||0;s+=palette.sat||0;l+=palette.light||0}
  l+=(hash-.5)*3;return `hsl(${h} ${Math.max(12,s)}% ${Math.max(20,l)}%)`
}
function waterToneBase(reach,season){let h=195,s=43,l=24;if(reach.kind==='pool'){h=198;s=48;l=20}else if(reach.kind==='narrows'){h=187;s=42;l=29}else if(reach.kind==='bend'){h=192;s=45;l=25}if(season==='WINTER'){h+=5;s-=8;l+=1}else if(season==='SUMMER'){h-=3;l-=1}else if(season==='AUTUMN'){s-=4}return{h,s,l}}
// Depth bands as offsets from the base tone: deep, base, shore, shallow.
const WATER_BANDS=[[2,3,-3],[0,0,0],[-3,-2,7],[-5,-4,11]];
function waterTones(reach,season){const {h,s,l}=waterToneBase(reach,season);const c=(dh,ds,dl)=>`hsl(${h+dh} ${Math.max(18,s+ds)}% ${Math.max(14,l+dl)}%)`;return{base:c(0,0,0),deep:c(2,3,-3),shore:c(-3,-2,7),shallow:c(-5,-4,11)}}

function renderThreshold(shape){if(shape==='tuft')return .34;if(shape==='shrub')return .22;if(shape==='reed')return .24;if(shape==='fungus')return .16;if(shape==='pod')return .18;return .15}
function tintHex(hex,hueShift=0,lightShift=0){
  const raw=hex.replace('#',''),n=parseInt(raw,16),r=(n>>16)&255,g=(n>>8)&255,b=n&255;
  const [h,s,l]=rgbToHsl(r/255,g/255,b/255);return `hsl(${(h+hueShift+360)%360} ${Math.max(18,Math.min(86,s))}% ${Math.max(28,Math.min(78,l+lightShift))}%)`;
}
function rgbToHsl(r,g,b){const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2;let h=0,s=0;if(d){s=d/(1-Math.abs(2*l-1));if(max===r)h=60*(((g-b)/d)%6);else if(max===g)h=60*((b-r)/d+2);else h=60*((r-g)/d+4)}if(h<0)h+=360;return[h,s*100,l*100]}
