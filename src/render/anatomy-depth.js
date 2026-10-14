// Overhead anatomical occlusion, presentation only. This does not change locomotion,
// collision, inherited sockets, or the anatomical capability system.
// Height belongs to an actual raised action, not a limb's position on screen.
export function limbScreenDepth(leg, bodyY=0){
  // Screen y cannot decide whether a limb is above the dorsal body.
  // Ordinary gait stays beneath it; actual raised attack limbs can cross over it.
  const lift=Math.max(0,Math.min(1,Number(leg?.liftAmount)||0));
  return leg?.aboveBody?1+lift:-1+lift*.5;
}
export function anatomicalLimbLayers(legs, bodyY=0){
  const back=[],front=[];
  for(const leg of legs){
    (limbScreenDepth(leg,bodyY)<0?back:front).push(leg);
  }
  // Stable overlap when neighboring appendages cross: action lift and then socket.
  const sort=(a,b)=>limbScreenDepth(a,bodyY)-limbScreenDepth(b,bodyY)||(a.slot??a.index??0)-(b.slot??b.index??0);
  back.sort(sort);front.sort(sort);
  return {back,front};
}
