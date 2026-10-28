// Exact presentation method from published 629ad29a; do not regenerate from a candidate.
// Original method SHA-256: 3b60681ab4448a1d616d1612171d78a8429003e8802f7fb5ff6fd0f900aa4ddf
export default function(id,target){
    const m=this.turnState||(this.turnState=new Map()),now=this.renderNow,st=m.get(id);if(!st){m.set(id,{d:target,t:now});return target}
    if(st.d!==target&&now-st.t>=70){const diff=((target-st.d+12)%8)-4;st.d=(st.d+(diff>0?1:diff<0?-1:1)+8)%8;st.t=now}else if(st.d===target)st.t=Math.max(st.t,now-70);
    if(m.size>1200)for(const k of m.keys()){m.delete(k);if(m.size<=900)break}return st.d;
  }
