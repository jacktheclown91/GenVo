// Shared, read-only geometry of an actually visited home range. Callers retain
// their own observation records and behavior; this neither owns territory nor
// moves or supplies an organism.
export const HOME_FAMILIARITY=2.5;
export function weightedHomeRange(cells,total=cells.reduce((n,v)=>n+v.weight,0)){
 if(!cells.length)return null;
 let x=0,y=0;for(const v of cells){x+=v.cell.x*v.weight;y+=v.cell.y*v.weight}x/=total;y/=total;
 let variance=0;for(const v of cells){const d=Math.hypot(v.cell.x-x,v.cell.y-y);variance+=d*d*v.weight}variance/=total;
 return{x,y,radius:Math.max(5,Math.min(18,5+Math.sqrt(variance)*.72)),total,established:total>=HOME_FAMILIARITY};
}
