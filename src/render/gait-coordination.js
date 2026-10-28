// Presentation-only phase coordination from the actual mounted limb arrangement.
// Physical movement, stride distance, action authority and inherited anatomy stay
// in their existing owners. Static/display poses keep the historical phase map.
const cache=new WeakMap();
const wrap=v=>((v%8)+8)%8;
export function coordinatedGaitOffsets(legs){
  if(!Array.isArray(legs)||!legs.length)return[];
  const hit=cache.get(legs);if(hit)return hit;
  const ordered=legs.map((leg,index)=>({index,slot:wrap(leg.slot/2)*2,
    side:Math.sin(leg.slot*Math.PI/8),front:Math.cos(leg.slot*Math.PI/8)}));
  const result=Array(legs.length).fill(0);
  const left=ordered.filter(l=>l.side>.01).sort((a,b)=>b.front-a.front||a.slot-b.slot);
  const right=ordered.filter(l=>l.side<-.01).sort((a,b)=>b.front-a.front||a.slot-b.slot);
  const bilateral=left.length===right.length&&left.length+right.length===legs.length;
  if(legs.length===2){
    const sorted=[...ordered].sort((a,b)=>a.slot-b.slot);result[sorted[0].index]=0;result[sorted[1].index]=4;
  }else if(bilateral&&legs.length===4){
    // Diagonal support pairs for a four-limb body.
    for(let i=0;i<2;i++){result[left[i].index]=i*4;result[right[i].index]=4-i*4;}
  }else if(bilateral){
    // A wave travels along each bank of legs. Eight/sixteen-limb bodies do not
    // inherit a quadruped's two synchronized diagonal groups.
    for(const [bank,offset] of [[left,0],[right,4]])for(let rank=0;rank<bank.length;rank++)result[bank[rank].index]=wrap(offset+rank*8/bank.length);
  }else{
    // Irregular/missing/axial limbs retain their own evenly spaced recovery turns.
    // Never mirror in a limb which the actual body plan does not contain.
    const sorted=[...ordered].sort((a,b)=>a.slot-b.slot);
    sorted.forEach((leg,rank)=>{result[leg.index]=rank*8/sorted.length;});
  }
  Object.freeze(result);cache.set(legs,result);return result;
}
