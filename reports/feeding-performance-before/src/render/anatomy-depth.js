// Screen-space anatomical occlusion, presentation only. This does not change locomotion,
// collision, inherited sockets, or the anatomical capability system.
// Hip position supplies the stable depth; knees/feet refine it without flickering the
// limb across the torso every time its planted foot advances.
export function limbScreenDepth(leg, bodyY=0){
  const hipY=Number(leg?.root?.y)||0;
  const kneeY=Number(leg?.knee?.y)||0;
  const footY=Number(leg?.foot?.y)||0;
  return hipY*.64+kneeY*.28+footY*.08-bodyY;
}
export function anatomicalLimbLayers(legs, bodyY=0){
  const back=[],front=[];
  for(const leg of legs){
    (limbScreenDepth(leg,bodyY)<0?back:front).push(leg);
  }
  // Stable overlap when neighboring appendages cross: screen depth and then socket.
  const sort=(a,b)=>limbScreenDepth(a,bodyY)-limbScreenDepth(b,bodyY)||(a.slot??a.index??0)-(b.slot??b.index??0);
  back.sort(sort);front.sort(sort);
  return {back,front};
}
