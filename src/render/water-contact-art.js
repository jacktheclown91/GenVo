// Original native-32 surface-contact art. Only a verified exposed surface may
// call this painter; these contours assert displacement, never a hydration gain.
import {pixel} from './pixel-art.js';
const DIRS=[[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]];
export function drawWaterContact(ctx,{scale=1,bodyWidth=5,phase=0,moving=false,dir=0}={}){
 const f=((Math.floor(phase)%8)+8)%8,v=DIRS[dir&7],pulse=f<4?f:7-f;
 contour(ctx,0,5,Math.max(4,bodyWidth)+2+pulse*.25,1.5+pulse*.125,scale,'rgba(164,225,226,.48)',f);
 if(moving)contour(ctx,-v[0]*4,5-v[1]*2,Math.max(4,bodyWidth)+4+pulse*.5,2.5,scale,'rgba(199,238,233,.28)',f+3);
}
function contour(c,cx,cy,rx,ry,s,color,phase){
 // Disconnected upper/lower crests leave the body contact open. Half-unit
 // steps are native art pixels, snapped by the shared creature pixel helper.
 for(let side=-1;side<=1;side+=2)for(let k=0;k<=12;k++){
  if((k+phase+(side>0?2:0))%7===0)continue;
  const x=-rx+2*rx*k/12,y=side*ry*Math.sqrt(Math.max(0,1-(x/rx)**2));
  pixel(c,cx+x,cy+y,.5,.5,s,color);
 }
}
