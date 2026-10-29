// Detailed paint for the existing implicit feeler geometry, never a new organ.
// Native32 deliberately declines so its original painter remains byte-for-byte.
export function drawDetailedFeeler(ctx,{root,tip,scale=1,palette,resolution=32,side=1}={}){
 if(![64,128].includes(resolution))return false;
 const detail=resolution/16,cell=1/detail,dx=tip.x-root.x,dy=tip.y-root.y,length=Math.hypot(dx,dy);
 if(!(length>0)||![root.x,root.y,tip.x,tip.y,scale].every(Number.isFinite)||scale<=0)return false;
 const ux=dx/length,uy=dy/length,px=-uy,py=ux,steps=Math.max(2,Math.ceil(length*detail*1.5));
 const dot=(x,y,w,color)=>{ctx.fillStyle=color;ctx.fillRect(Math.round(Math.round(x*detail)/detail*scale),Math.round(Math.round(y*detail)/detail*scale),Math.max(1,Math.round(Math.max(cell,w)*scale)),Math.max(1,Math.round(Math.max(cell,w)*scale)))};
 // The curved sheath narrows toward the tip; the old action pose still owns
 // its root and endpoint, sweep, pinning and inherited sensory reach.
 for(let i=0;i<=steps;i++){
  const t=i/steps,bow=Math.sin(Math.PI*t)*.18*side,width=.34*(1-t)+.12,x=root.x+dx*t+px*bow,y=root.y+dy*t+py*bow;
  dot(x-width*.5,y-width*.5,width,palette.shade);
  dot(x-width*.2,y-width*.2,width*.65,palette.body);
  if(i%3!==1)dot(x-px*width*.2,y-py*width*.2,cell,palette.light);
  // Sparse cuticular joints interrupt the highlight without adding a claw,
  // pupil or an extra sensory capability at the end of the existing feeler.
  if(i>2&&i<steps-2&&i%6===0)dot(x-px*cell,y-py*cell,cell,palette.shade);
 }
 const radiusF=.34,radiusS=.22;
 for(let y=-Math.ceil(radiusS*detail);y<=Math.ceil(radiusS*detail);y++)for(let x=-Math.ceil(radiusF*detail);x<=Math.ceil(radiusF*detail);x++){
  const f=x/detail,s=y/detail,q=(f/radiusF)**2+(s/radiusS)**2;if(q>1)continue;
  dot(tip.x+ux*f+px*s-cell/2,tip.y+uy*f+py*s-cell/2,cell,q>.65?palette.shade:s<0?palette.light:palette.body);
 }
 return true;
}
