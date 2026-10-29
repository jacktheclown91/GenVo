import {biomeAt} from '../world/biomes.js';
import {surfaceIceCovered,liquidVolume} from '../world/surface-ice.js';
import {salinityAt} from '../world/environment.js';
import {passageAt} from '../world/subsurface.js';
import {CAVES} from '../world/cave-policy.js';
import {flightWindAt} from '../lineage/flight-wind.js';
const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));

// Moist soil/seepage is not an exposed water source. Observe only owned local
// liquid cells; never realize neighbouring regions or initialize controllers.
export function audibleLiquid(sim,a=sim?.player?.(),radius=5){
 const w=sim?.world;if(!a||!w?.water||!Number.isFinite(w.n)||a.underground)return{level:0,pan:0,saline:0};
 const cx=Math.floor(a.x),cy=Math.floor(a.y),r=Math.min(5,Math.max(0,radius));let best=null;
 for(let dy=-5;dy<=5;dy++)for(let dx=-5;dx<=5;dx++){
  const x=cx+dx,y=cy+dy;if(x<0||y<0||x>=w.n||y>=w.n)continue;const i=y*w.n+x,e=w.environment;
  if(!w.water[i]||surfaceIceCovered(e,i))continue;
  const total=e?.volume?.[i]??e?.depth?.[i]??1;if(liquidVolume(e,i,total)<=.01)continue;
  const distance=Math.hypot(x+.5-a.x,y+.5-a.y);if(distance>r||best&&distance>=best.distance)continue;
  best={distance,pan:Math.max(-.85,Math.min(.85,(x+.5-a.x)/5)),saline:e?.salt&&e?.depth?clamp(salinityAt(w,i)):0};
 }
 return best?{level:clamp(1-best.distance/5),pan:best.pan,saline:best.saline}:{level:0,pan:0,saline:0};
}

export function habitatSoundscape(sim,a=sim?.player?.()){
 const w=sim?.world;if(!a||!w)return{kind:'silent',water:0,waterPan:0};
 if(a.underground){const p=passageAt(w,a.x,a.y);return{kind:p?.origin===CAVES.policy?'cave':'burrow',water:0,waterPan:0};}
 const water=audibleLiquid(sim,a),wind=flightWindAt(w,a.x,a.y);
 if(a.diveDepth>.03)return{kind:'submerged',water:water.level,waterPan:water.pan};
 let biome=null;const i=w.idx(a.x,a.y);
 if(sim.climate&&w.fertility&&w.moisture&&w.terrain?.elevation&&Number.isSafeInteger(w.len))biome=biomeAt(w,i,sim.climate);
 return{kind:biome?.code||'unclassified',water:water.level,waterPan:water.pan,saline:water.saline,wind:wind?clamp(wind.strength/1.3):null,moisture:clamp(biome?.moisture??w.moisture?.[i]),temperature:biome?.temperature??w.temperature?.[i]??.55,elevation:clamp(biome?.elevation??w.terrain?.elevation?.[i]),canopy:clamp((w.plants?.woodspire?.[i]||0)/.8)};
}

export function habitatMixTargets(scene={}){
 const h=scene.habitat||{},kind=h.kind||'unclassified',wet=clamp(scene.wetness),water=clamp(h.water??scene.waterEdge),rain=clamp(scene.rain);
 const inside=kind==='cave'||kind==='burrow',submerged=kind==='submerged',outside=!(inside||submerged||kind==='silent');
 const wind=h.wind==null?1:clamp(h.wind),openWater=kind==='ocean'||kind==='freshwater';
 const cold=kind==='tundra',high=kind==='alpine',arid=kind==='arid'||kind==='steppe',woods=kind==='woodland'||kind==='thicket';
 return{field:outside?(.26+.24*(1-wet))*(arid||high||cold?.38:1)*(woods?.65:1)*(1-water*.65)*(.35+.65*wind):0,wet:outside&&!openWater?.38*clamp((wet-.3)/.7)*(1-water*.25):0,
  'water-edge':outside?(.54+.08*clamp(h.saline))*water:submerged?.10*water:0,rain:outside?.48*Math.sqrt(rain):0,
  canopy:outside?clamp(h.canopy)*(woods?.42:.18)*(1-rain*.45)*wind:0,grit:outside&&arid?.35*(1-wet*.8)*(1-rain*.75)*wind:0,
  exposed:outside?(high?.42:cold?.28:arid?.15:kind==='ocean'?.18:0)*wind:0,enclosed:inside?(kind==='cave'?.35:.23):submerged?.18:0,
  waterRate:1.03-.17*clamp(h.saline),exposedHz:high?440:cold?260:kind==='ocean'?300:620,filterHz:submerged?360:inside?1400:18000,enclosedHz:kind==='burrow'?130:kind==='submerged'?95:240,waterPan:Math.max(-.85,Math.min(.85,h.waterPan||0))};
}
