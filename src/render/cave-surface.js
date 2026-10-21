import {exposedCaveWater} from '../world/cave-water.js';
import {CAVES} from '../world/cave-policy.js';
import {caveFracture} from '../world/natural-caves.js';

// Native 32px cave artwork generated exclusively from saved physical voids,
// rocks, moisture, elevation, collapsed roof and present vegetation. This is a
// visual interpretation of the shared passage map, NOT a second cave map.
const S=32;
const ROCK=[[32,38,36],[43,50,45],[49,56,49],[57,63,54]];
const SOIL=[[55,45,35],[65,53,39],[72,57,42],[82,67,49]];
const FLOOR=[[70,82,73],[79,91,80],[88,99,85],[95,105,89]];
const EARTH=[[80,65,47],[89,72,53],[99,80,58],[108,88,63]];
const WATER=[[37,77,88],[45,84,94],[52,92,99],[58,99,109]];
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
function hash(a,b,c=0){let n=(Math.imul(a+1,374761393)+Math.imul(b+3,668265263)+Math.imul(c+7,2246822519))|0;n=Math.imul(n^(n>>>13),1274126177);return(n^(n>>>16))>>>0}
export function openPassage(w,x,y){
 if(x<0||y<0||x>=w.n||y>=w.n)return false;
 const p=w.subsurface?.passages?.get(y*w.n+x);
 return p&&!p.closed?p:null;
}
export function caveNeighborOpen(w,p,dx,dy){
 const x=p.i%w.n,y=p.i/w.n|0,q=openPassage(w,x+dx,y+dy);
 return !!q&&Math.abs(q.floor-p.floor)<=.6;
}
export function caveTileData(w,p){
 if(!p||p.closed||p.i<0||p.i>=w.len)throw Error('Cave artwork requires a real open passage.');
 const x=p.i%w.n,y=p.i/w.n|0,natural=p.origin===CAVES.policy;
 const neighbors=[caveNeighborOpen(w,p,0,-1),caveNeighborOpen(w,p,1,0),caveNeighborOpen(w,p,0,1),caveNeighborOpen(w,p,-1,0)];
 const data=new Uint8ClampedArray(S*S*4),root=(w.plants?.woodspire?.[p.i]||0)+(w.plants?.bramble?.[p.i]||0)*.3;
 const liquid=exposedCaveWater(w,p.i),wet=!!w.water[p.i]||liquid>.001,damp=clamp(w.moisture?.[p.i]||0,0,1),height=clamp(w.terrain?.elevation?.[p.i]||0,0,1);
 const fracture=natural?caveFracture(w,p.i):.45;
 let floorPixels=0,wallPixels=0;
 for(let py=0;py<S;py++)for(let px=0;px<S;px++){
  const grit=hash(x*S+px,y*S+py,w.seedHash||0),wiggle=(hash(x*13+(px>>2),y*17+(py>>2),5)%5)-2;
  const thickness=natural?4:3,wallTop=!neighbors[0]&&py<thickness+wiggle,
    wallRight=!neighbors[1]&&px>=S-thickness-wiggle,
    wallBottom=!neighbors[2]&&py>=S-thickness-wiggle,
    wallLeft=!neighbors[3]&&px<thickness+wiggle;
  const wall=wallTop||wallRight||wallBottom||wallLeft;
  if(wall)wallPixels++;else floorPixels++;
  const palette=wall?(natural?ROCK:SOIL):wet&&(w.water[p.i]||(grit%100)<Math.min(100,liquid/p.void*150))?WATER:(natural?FLOOR:EARTH);
  const base=palette[grit%palette.length],brightness=wall?(wallTop?8:wallBottom?-10:0):Math.round((damp-.5)*-7+(fracture-.6)*9-height*3);
  const fine=(grit>>>6)%13===0?10:(grit>>>5)%11===0?-7:0;
  const sediment=!wall&&(grit&31)===1?8:0;
  // Roots are a silhouette only where surface plants physically exist.
  const rooted=wall&&root>.12&&((grit>>>10)&127)<Math.min(18,root*9)&&py<17;
  const color=rooted?[75,69,44]:base,idx=(py*S+px)*4;
  for(let k=0;k<3;k++)data[idx+k]=clamp(color[k]+brightness+fine+sediment,0,255);
  data[idx+3]=255;
 }
 return{pixels:data,width:S,height:S,neighbors,wallPixels,floorPixels,natural,wet,source:p.i};
}
export function caveArtwork(renderer,p){
 const world=renderer.sim.world,revision=world.subsurface?.revision||0;
 if(!renderer.caveArtworkCache||renderer.caveArtworkWorld!==world||renderer.caveArtworkRevision!==revision||renderer.caveArtworkWaterDay!==world.soilWater?.day){
  renderer.caveArtworkWorld=world;renderer.caveArtworkRevision=revision;renderer.caveArtworkWaterDay=world.soilWater?.day;renderer.caveArtworkCache=new Map();
 }
 const cache=renderer.caveArtworkCache;
 let art=cache.get(p.i);
 if(art)return art;
 if(typeof document==='undefined')return null;
 const geometry=caveTileData(world,p),canvas=document.createElement('canvas');
 canvas.width=canvas.height=S;
 const c=canvas.getContext('2d');if(!c)return null;
 const pixels=c.createImageData(S,S);pixels.data.set(geometry.pixels);c.putImageData(pixels,0,0);
 if(cache.size>=512)cache.clear();
 cache.set(p.i,canvas);
 return canvas;
}
