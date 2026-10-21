// One physical rock ray shared by visual perception, memory and resource targeting.
function openUndergroundCell(world,x,y){
 if(!world||x<0||y<0||x>=world.n||y>=world.n)return false;
 const passage=world.subsurface?.passages?.get(y*world.n+x);
 return !!passage&&!passage.closed;
}
export function undergroundLineOfSight(world,fromX,fromY,toX,toY){
 const ax=Math.floor(fromX),ay=Math.floor(fromY),bx=Math.floor(toX),by=Math.floor(toY);
 if(!openUndergroundCell(world,ax,ay)||!openUndergroundCell(world,bx,by))return false;
 const dx=Math.abs(bx-ax),dy=Math.abs(by-ay);
 let x=ax,y=ay,err=dx-dy;
 const sx=ax<bx?1:-1,sy=ay<by?1:-1;
 for(let steps=0;steps<dx+dy+1;steps++){
  if(x===bx&&y===by)return true;
  const twice=2*err;
  const moveX=twice>-dy,moveY=twice<dx;
  const nx=x+(moveX?sx:0),ny=y+(moveY?sy:0);
  // Diagonal gaps between two solid walls are not optical doorways.
  if(moveX&&moveY&&(!openUndergroundCell(world,nx,y)||!openUndergroundCell(world,x,ny)))return false;
  if(!openUndergroundCell(world,nx,ny))return false;
  const prior=world.subsurface.passages.get(y*world.n+x),next=world.subsurface.passages.get(ny*world.n+nx);
  if(Number.isFinite(prior.floor)&&Number.isFinite(next.floor)&&Math.abs(prior.floor-next.floor)>.6)return false;
  if(moveX)err-=dy;if(moveY)err+=dx;
  x=nx;y=ny;
 }
 return false;
}
