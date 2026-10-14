// Check every crossed cell, including both sides of a corner. A wet endpoint
// alone cannot establish a wet roaming trip through an irregular shoreline.
export function wetSegment(world,fromX,fromY,toX,toY){
  if(![fromX,fromY,toX,toY].every(Number.isFinite)||!world.isPlayable(fromX,fromY)||!world.isPlayable(toX,toY))return false;
  const wet=(x,y)=>world.isPlayable(x+.5,y+.5)&&!!world.water[world.idx(x,y)];
  let x=Math.floor(fromX),y=Math.floor(fromY);const endX=Math.floor(toX),endY=Math.floor(toY);
  if(!wet(x,y)||!wet(endX,endY))return false;
  const dx=toX-fromX,dy=toY-fromY,sx=Math.sign(dx),sy=Math.sign(dy);
  const stepX=dx?1/Math.abs(dx):Infinity,stepY=dy?1/Math.abs(dy):Infinity;
  let crossX=dx?((sx>0?x+1:x)-fromX)/dx:Infinity;
  let crossY=dy?((sy>0?y+1:y)-fromY)/dy:Infinity;
  while(x!==endX||y!==endY){
    if(crossX<crossY){x+=sx;crossX+=stepX;}
    else if(crossY<crossX){y+=sy;crossY+=stepY;}
    else{if(!wet(x+sx,y)||!wet(x,y+sy))return false;x+=sx;y+=sy;crossX+=stepX;crossY+=stepY;}
    if(!wet(x,y))return false;
  }
  return true;
}
