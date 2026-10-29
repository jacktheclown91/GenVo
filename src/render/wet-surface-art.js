import {atmosphereAt} from '../ecology/atmospheric-visibility.js';
import {surfaceIceCovered,liquidVolume} from '../world/surface-ice.js';
import {snowCover} from '../world/snowpack.js';
import {seasonalMarkAnchor} from './seasonal-ground-art.js';
import {pixel} from './pixel-art.js';
const clamp=v=>Math.max(0,Math.min(1,v));
const RINGS=Object.freeze([
  [[0,0]],
  [[-1,0],[1,0],[0,-.5],[0,.5]],
  [[-1.5,0],[1.5,0],[-.5,-1],[.5,-1],[-.5,1],[.5,1]],
  [[-2,0],[2,0],[-1,-1],[1,-1],[-1,1],[1,1],[0,-1.5],[0,1.5]]
]);
const FILM_DARK=[[-1,0],[-.5,0],[0,0],[.5,0],[1,.5],[-.5,1],[0,1],[.5,1]],FILM_LIGHT=[[-.5,-.5],[0,-.5],[.5,-.5]];
let stamps=null;
function surfaceStamps(){
  if(stamps||typeof document==='undefined')return stamps;
  const paint=layers=>{
    const canvas=document.createElement('canvas');
    canvas.width=9;
    canvas.height=7;
    const c=canvas.getContext('2d');
    for(const [points,color] of layers){
        c.fillStyle=color;
        for(const [x,y] of points)c.fillRect(4+x*2,3+y*2,1,1);
    }
    return canvas;
  };
  // Nine tiny, immutable native sprites shared by every cell, not a canvas per
  // tile or frame. The clipped shoreline path below keeps exact mask ownership.
  stamps={film:paint([[FILM_DARK,'rgba(39,49,39,.24)'],[FILM_LIGHT,'rgba(187,193,159,.22)']]),
    water:RINGS.map(points=>paint([[points,'rgba(180,216,206,.35)']])),
    land:RINGS.map(points=>paint([[points,'rgba(179,190,158,.25)']]))};return stamps;
}
function stamp(c,image,args,anchor){
  c.imageSmoothingEnabled=false;
  c.drawImage(image,args.px+(anchor.x-2)*args.u,args.py+(anchor.y-1.5)*args.u,4.5*args.u,3.5*args.u);
}

export function exposedSurfaceKind(world,i){
  if(world.water[i]){
    if(surfaceIceCovered(world.environment,i))return null;
    const stored=world.environment?.volume?.[i]??world.environment?.depth?.[i];
    if(stored!==undefined&&(!Number.isFinite(stored)||liquidVolume(world.environment,i,stored)<=1e-8))return null;
    return 'water';
  }
  return (world.environment?.overland?.[i]||0)>1e-5?'film':null;
}
function nativeDot(c,{px,py,u,mask,kind},x,y,color){
  if(x<0||y<0||x>=16||y>=16)return;
  const res=Math.round(Math.sqrt(mask.length)),wet=mask.full||(!mask.empty&&mask[Math.floor(y*res/16)*res+Math.floor(x*res/16)]===1);
  if((kind==='water')!==!!wet)return;
  pixel(c,px/u+x,py/u+y,.5,.5,u,color);
}

// A live ground layer. Actual inventories/precipitation are read here; this
// owns only deterministic native pixel marks and bounded presentation caches.
export class WetSurfaceArt{
  constructor({maxTiles=1024,maxImpacts=64}={}){
    this.maxTiles=maxTiles;
    this.maxImpacts=maxImpacts;
    this.world=null;
    this.entries=new Map();
    this.remaining=0;
  }
  begin(sim,{seconds=0,lowDetail=false}={}){
    if(this.world!==sim.world){this.world=sim.world;this.entries.clear()}
    const observer=sim.player?.();
    this.surfaceVisible=!observer?.underground&&!(observer?.diveDepth>.03);
    this.seconds=seconds;
    this.remaining=lowDetail?Math.min(24,this.maxImpacts):this.maxImpacts;
  }
  drawTile(c,sim,{i,x,y,mask,px,py,u}){
    if(this.surfaceVisible===false)return false;
    const world=sim.world,kind=exposedSurfaceKind(world,i);
    if(!kind||mask.empty&&kind==='water')return false;
    if(kind==='water'&&this.remaining<=0)return false;
    const exposure=kind==='film'?clamp((world.environment.overland[i]-1e-5)/.025)*(1-snowCover(world,i)):1;
    if(kind==='film'&&exposure<=.08)return false;
    let entry=this.entries.get(i);
    if(!entry){
      if(this.entries.size>=this.maxTiles)this.entries.delete(this.entries.keys().next().value);
      const anchor=seasonalMarkAnchor(world,x,y,0,7349);
      entry={anchor:{x:Math.max(3,Math.min(12.5,anchor.x)),y:Math.max(3,Math.min(12.5,anchor.y)),variant:anchor.variant},tick:-1};
      this.entries.set(i,entry);
    }
    const temp=sim.climate?.temp??world.temperature[i],rain=sim.climate?.rain??0;
    if(entry.tick!==sim.tickCount||entry.day!==sim.day||entry.temp!==temp||entry.rain!==rain){
      entry.weather=atmosphereAt(sim,x+.5,y+.5);
      entry.tick=sim.tickCount;
      entry.day=sim.day;
      entry.temp=temp;
      entry.rain=rain;
    }
    const sample=entry.weather,anchor=entry.anchor,args={px,py,u,mask,kind};let painted=false;
    if(kind==='water'&&sample.liquid<=.03||kind==='film'&&sample.temperature<=.4)return false;
    const native=typeof c.drawImage==='function'?surfaceStamps():null;
    c.save();try{
      if(kind==='film'){
        // Overland water remains a film, not a new pond or drinkable source. Cold
        // mixed-phase ground gets no liquid sheen; snow is also composited above.
        c.globalAlpha*=exposure;
        if(native&&mask.empty)stamp(c,native.film,args,anchor);
        else{
          for(const [dx,dy] of FILM_DARK)nativeDot(c,args,anchor.x+dx,anchor.y+dy,'rgba(39,49,39,.24)');
          for(const [dx,dy] of FILM_LIGHT)nativeDot(c,args,anchor.x+dx,anchor.y+dy,'rgba(187,193,159,.22)');
        }
        painted=true;
      }
      const rain=clamp(sample.liquid);
      if(rain<=.03||this.remaining<=0)return painted;
      const phase=((this.seconds/(1.25+anchor.variant*.11)+anchor.x*.137+anchor.y*.193)%1+1)%1,life=phase/(rain*.68);
      if(life>=1)return painted;
      const stage=Math.min(3,Math.floor(life*4));
      c.globalAlpha*=.65+.35*(1-life);
      const color=kind==='water'?'rgba(180,216,206,.35)':'rgba(179,190,158,.25)';
      if(native&&(kind==='water'?mask.full:mask.empty))stamp(c,native[kind==='water'?'water':'land'][stage],args,anchor);
      else for(const [dx,dy] of RINGS[stage])nativeDot(c,args,anchor.x+dx,anchor.y+dy,color);
      this.remaining--;
      return true;
    }finally{c.restore()}
  }
}

// Cached substrate detail: moist soil is earth toned, with no decorative water
// inventory or extra plants. This follows the existing terrain refresh policy.
export function drawDampSoil(c,{world,reading,px,py,u,x,y}){
  if(!reading)return false;
  const wet=clamp((reading.available-.72)/.28)*(1-reading.snow);
  if(wet<.12)return false;
  c.save();try{
    c.globalAlpha*=wet*(1-reading.cover*.45);
    for(let q=0;q<(wet>.6?2:1);q++){
      const a=seasonalMarkAnchor(world,x,y,q,7391),sx=Math.max(3,Math.min(11,a.x)),sy=Math.max(2,Math.min(12,a.y)),flip=a.variant%2?1:-1;
      pixel(c,px/u+sx,py/u+sy,3,.5,u,'rgba(34,49,35,.18)');
      pixel(c,px/u+sx+flip*.5,py/u+sy+.5,3.5,1,u,'rgba(34,49,35,.14)');
      pixel(c,px/u+sx+.5,py/u+sy+1.5,2,.5,u,'rgba(34,49,35,.12)');
      pixel(c,px/u+sx+1,py/u+sy,1,.5,u,'rgba(134,141,100,.14)');
    }
  }finally{c.restore()}return true;
}
