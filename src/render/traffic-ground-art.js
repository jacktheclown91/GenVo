// Presentation of canonical scalar travel history. No trail state, route decisions or RNG.
const noise=(x,y,s=0)=>{let n=(Math.imul(x+374761393,668265263)^Math.imul(y+1274126177,2246822519)^s)>>>0;n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295};
// Weak ownership and a hard local bound: evicted regional worlds are not pinned by artwork.
const designs=new WeakMap();
function design(world,x,y){let cache=designs.get(world);if(!cache){cache=new Map();designs.set(world,cache)}const key=y*world.n+x;if(cache.has(key))return cache.get(key);const scuffs=[];
 for(let k=0;k<3;k++){const q=noise(x*7+k,y*11-k,613),xx=1+Math.floor(noise(x+k*13,y,617)*24),yy=1+Math.floor(noise(y+k*17,x,619)*25),ww=2+Math.floor(q*5);scuffs.push([xx,yy,ww,1]);if(q>.55)scuffs.push([xx+1,yy+1,ww-1,1])}
 const center=[13+Math.floor(noise(x,y,631)*6),13+Math.floor(noise(y,x,637)*6)],ends=[[0,8+Math.floor(noise(x,y,641)*16)],[31,8+Math.floor(noise(x+1,y,641)*16)],[8+Math.floor(noise(y,x,643)*16),0],[8+Math.floor(noise(y+1,x,643)*16),31]],arms=ends.map(([ex,ey])=>{const pixels=[],dx=ex-center[0],dy=ey-center[1],steps=Math.max(Math.abs(dx),Math.abs(dy)),offset=Math.floor(noise(x,y,647)*5);for(let k=0;k<=steps;k++){if((k+offset)%7!==4)pixels.push([Math.round(center[0]+dx*k/steps),Math.round(center[1]+dy*k/steps),1,1])}return pixels});
 const out={scuffs,arms};if(cache.size>=1024)cache.delete(cache.keys().next().value);cache.set(key,out);return out;
}
export function drawTrafficGround(c,{world,traffic,x,y,px,py,u=1}){
 const at=(xx,yy)=>xx<0||yy<0||xx>=world.n||yy>=world.n?0:Math.max(0,traffic?.[world.idx(xx,yy)]||0),v=at(x,y);if(!(v>.12))return false;
 const n=at(x,y-1),s=at(x,y+1),w=at(x-1,y),e=at(x+1,y),ew=w+e,ns=n+s,total=ew+ns,contrast=total>0?Math.abs(ew-ns)/total:0,strength=Math.min(1,(v-.12)*1.8),a=.05+.19*strength;
 c.save();try{
  // Ubiquitous traffic indicates an area of wear, not a lane through every cell.
  // Scatter detached, uneven scuffs across the full cell instead of a repeated central cross.
  const shape=design(world,x,y);c.fillStyle=`rgba(113,84,51,${a*.85})`;for(const [xx,yy,ww,hh]of shape.scuffs)c.fillRect(px+xx*u/2,py+yy*u/2,ww*u/2,hh*u/2);
  // Only a clear neighboring axis supports a directional trace. Shared-edge anchors
  // agree from either tile, while broken pixel runs prevent hard tile-wide bars.
  if(contrast>.28){const horizontal=ew>ns,offset=horizontal?0:2,neighbors=horizontal?[w,e]:[n,s];c.fillStyle=`rgba(113,84,51,${a*1.15})`;for(let q=0;q<2;q++){if(neighbors[q]<=.12)continue;for(const [xx,yy,ww,hh]of shape.arms[offset+q])c.fillRect(px+xx*u/2,py+yy*u/2,ww*u/2,hh*u/2)}}
 }finally{c.restore()}return true;
}
