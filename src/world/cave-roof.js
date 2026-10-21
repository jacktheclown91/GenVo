// Dimensionless structural model, not engineering units. Actual roof thickness,
// unsupported distance, material origin and wetness determine failure. This
// derived query owns no rock, debris, water or biological stock.
export const CAVE_ROOF=Object.freeze({policy:'span-supported-cave-roof/1',minimum:.012});
const spans=new WeakMap();
function spanField(w){
 const s=w.subsurface;let cache=spans.get(w);if(cache?.revision===s.revision&&cache.passages===s.passages)return cache.distance;
 const distance=new Map(),queue=[];
 const adjacent=i=>{const x=i%w.n,y=i/w.n|0;return[x>0?i-1:-1,x<w.n-1?i+1:-1,y>0?i-w.n:-1,y<w.n-1?i+w.n:-1]};
 const open=i=>i>=0&&s.passages.has(i)&&!s.passages.get(i).closed;
 for(const [i,p] of s.passages)if(!p.closed&&adjacent(i).some(j=>!open(j))){distance.set(i,1);queue.push(i)}
 for(let k=0;k<queue.length;k++){const i=queue[k];for(const j of adjacent(i))if(open(j)&&!distance.has(j)){distance.set(j,distance.get(i)+1);queue.push(j)}}
 spans.set(w,{revision:s.revision,passages:s.passages,distance});return distance;
}
export function caveRoofSupport(w,p){
 if(!p||p.closed||p.entry)return null;
 const thickness=w.terrain.elevation[p.i]-p.floor/20-p.void;
 if(w.subsurface.roofPolicy!==CAVE_ROOF.policy)return{thickness,span:1,utilization:0,unstable:w.terrain.elevation[p.i]*20-p.floor<1.04,legacy:true};
 const span=2*(spanField(w).get(p.i)||1)-1;
 const wet=Math.max(0,Math.min(1,w.moisture?.[p.i]||0));
 const strength=(p.origin?2.5:1)*(1-.35*wet);
 const capacity=4*strength*(Math.max(0,thickness)/CAVE_ROOF.minimum)**2;
 const utilization=capacity>0?span*span/capacity:Infinity;
 return{thickness,span,strength,utilization,unstable:thickness<CAVE_ROOF.minimum||utilization>1,legacy:false};
}
