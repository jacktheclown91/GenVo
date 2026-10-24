import {liquidContact} from '../lineage/ice-locomotion.js';
import {drawWaterContact} from './water-contact-art.js';

// Renderer-only creature/environment contact. This module reads canonical habitat
// state and derives visual resistance/contact without writing world state or RNG.
const DIR4=[[0,-1],[1,0],[0,1],[-1,0]];

export function environmentContactFor(world,animal,{action='idle',phase=0,moving=false}={}){
  const x=Math.floor(animal.x),y=Math.floor(animal.y),i=world.idx(x,y),inWater=!!world.water[i],moisture=world.moisture[i]||0;
  const moss=world.plants?.sunmoss?.[i]||0,berries=world.plants?.bramble?.[i]||0,reeds=world.plants?.marshroot?.[i]||0,pods=world.plants?.thistlepod?.[i]||0;
  const cover=Math.max(moss*.72,berries,reeds,pods*.76),soil=moisture>.64?'mud':moisture<.29?'dry':'meadow';
  let waterDir=null,waterScore=-1;
  for(const [dx,dy] of DIR4){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=world.n||ny>=world.n)continue;const ni=world.idx(nx,ny);if(world.water[ni]){const score=1-Math.hypot((x+.5+dx)-(animal.x||x+.5),(y+.5+dy)-(animal.y||y+.5))*.08;if(score>waterScore){waterScore=score;waterDir={x:dx,y:dy}}}}
  return{tileX:x,tileY:y,inWater,liquidSurface:inWater&&liquidContact(world,animal)&&!(animal.diveDepth>.03),moisture,cover:inWater?0:cover,moss,berries,reeds,pods,soil,atBank:!inWater&&(!!waterDir||!!world.drinkable?.[i]),waterDir,action,moving,phase:wrap8(phase)};
}

export function drawGroundContact(ctx,{contact,scale=1,bodyScale=1,dir=0}){
  if(!contact)return;const f=Math.floor(contact.phase)&7,footfall=f===0||f===4,s=Math.max(1,scale),w=Math.max(4,Math.round(5*bodyScale));ctx.save();
  if(contact.inWater){if(contact.liquidSurface)drawWaterContact(ctx,{scale:s,bodyWidth:w,phase:contact.phase,moving:contact.moving,dir});ctx.restore();return}
  if(contact.cover>.42){ctx.fillStyle=`rgba(31,52,34,${Math.min(.22,.07+contact.cover*.14)})`;ctx.fillRect(-w*s,4*s,w*2*s,2*s)}
  if(contact.soil==='mud'){
    ctx.fillStyle='rgba(54,49,34,.24)';ctx.fillRect(-Math.round(w*.9)*s,5*s,Math.round(w*1.8)*s,2*s);
    if(contact.moving&&footfall){ctx.fillStyle='rgba(101,82,52,.34)';const side=f===0?-1:1;ctx.fillRect(side*3*s,6*s,3*s,s);ctx.fillRect(-side*5*s,7*s,2*s,s)}
  }else if(contact.soil==='dry'&&contact.moving&&footfall){
    ctx.fillStyle='rgba(185,154,93,.26)';const side=f===0?-1:1;ctx.fillRect(side*5*s,5*s,2*s,s);ctx.fillRect(side*7*s,3*s,s,s);
  }

  ctx.restore();
}

export function displacementForTile(animals,x,y){
  let best=null,bestD=1.15;
  for(const a of animals||[]){if(!a?.alive)continue;const dx=(x+.5)-a.x,dy=(y+.5)-a.y,d=Math.hypot(dx,dy);if(d>=bestD)continue;bestD=d;const len=Math.max(.001,d);best={animal:a,distance:d,x:dx/len,y:dy/len,strength:Math.max(0,1-d/1.15)}}
  return best;
}

export function drawForegroundContact(ctx,{contact,scale=1,bodyScale=1,isPlayer=false}){
  if(!contact||contact.inWater||contact.cover<.48)return;const s=Math.max(1,scale),density=Math.min(isPlayer?2:4,1+Math.floor(contact.cover*4)),phase=contact.phase;ctx.save();
  for(let k=0;k<density;k++){const side=k%2?-1:1,baseX=side*((isPlayer?6:4)+(k>>1)*2),lean=side*(1+Math.round(contact.moving?2:1)),height=Math.max(2,(contact.reeds>.45?5+(k%2):3+(k%2))-(isPlayer?1:0));ctx.fillStyle=contact.reeds>.45?(k%2?'#819861':'#688452'):(k%2?'#708d4f':'#58733f');const y=6*s;ctx.fillRect((baseX+lean)*s,(6-height)*s,s,height*s);if(contact.moving&&((Math.floor(phase)+k)&3)===0)ctx.fillRect((baseX+lean+side)*s,(7-height)*s,s,2*s)}
  ctx.restore();
}

function dirVector(dir){const dirs=[{x:0,y:-1},{x:1,y:-1},{x:1,y:0},{x:1,y:1},{x:0,y:1},{x:-1,y:1},{x:-1,y:0},{x:-1,y:-1}];return dirs[dir&7]}
function wrap8(v){return((Number(v)%8)+8)%8}
