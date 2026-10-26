// Painted tissue only: never alter the inherited rig, contacts or physical body.
export function gestationFullness(sim,animal){
  if(!animal?.alive||animal.pregnant?.mode!=='live')return 0;
  const progress=sim?.family?.pregnancyProgress?.(animal)?.progress;
  if(!Number.isFinite(progress))return 0;
  return Math.round(Math.max(0,Math.min(1,progress))*8)/8;
}

export function gestationSurfaceSize(width,height,fullness=0){
  const amount=Number.isFinite(fullness)?Math.max(0,Math.min(1,fullness)):0;
  return{width:width*(1+.14*amount),height:height*(1+.10*amount)};
}
