// v1.40.0 32-pixel creature art (creator decision 2026-10-09: option B, a wider view with smaller,
// crisper creatures). Creature geometry is still measured in the classic 16-grid units, but it is
// drawn on a grid twice as fine: positions snap to half units and lines step in half units, so a
// 16-unit creature is a 32x32 piece of art. At the gameplay zoom of 2 one art pixel is one screen
// pixel. `weight` sets a line's thickness in units: 1 is the classic weight, 0.5 one fine pixel.
export const ART_DETAIL=2;
export const ART_PIXEL=1/ART_DETAIL;
export const snap=v=>Math.round(v*ART_DETAIL)/ART_DETAIL;
export function pixel(c,x,y,w,h,s,color){c.fillStyle=color;c.fillRect(Math.round(snap(x)*s),Math.round(snap(y)*s),Math.max(1,Math.round(w*s)),Math.max(1,Math.round(h*s)))}
export function pixelLine(c,x0,y0,x1,y1,s,color,weight=1){
  const D=ART_DETAIL;let x=Math.round(x0*D),y=Math.round(y0*D);const tx=Math.round(x1*D),ty=Math.round(y1*D),dx=Math.abs(tx-x),dy=Math.abs(ty-y),sx=x<tx?1:-1,sy=y<ty?1:-1;let err=dx-dy;
  for(let guard=0;guard<96;guard++){pixel(c,x/D,y/D,weight,weight,s,color);if(x===tx&&y===ty)break;const e2=2*err;if(e2>-dy){err-=dy;x+=sx}if(e2<dx){err+=dx;y+=sy}}
}
