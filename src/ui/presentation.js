export const HUD_SEGMENTS=8;

export function clamp01(value){
  value=Number(value);
  if(!Number.isFinite(value))return 0;
  return Math.max(0,Math.min(1,value));
}

export function segmentedLevel(ratio,count=HUD_SEGMENTS){
  const safe=Math.max(1,Math.floor(count||HUD_SEGMENTS));
  const value=clamp01(ratio);
  return {value,filled:Math.max(0,Math.min(safe,Math.round(value*safe))),count:safe};
}

export function needTone(ratio){
  const value=clamp01(ratio);
  if(value<.22)return'critical';
  if(value<.38)return'low';
  return'stable';
}

export function vitalModel(kind,label,ratio,value){
  const level=segmentedLevel(ratio);
  return {kind,label,value,ratio:level.value,filled:level.filled,count:level.count,tone:needTone(level.value)};
}

export function compactFamilyLabel({pregnancyProgress=0,children=0}={}){
  if(pregnancyProgress>0)return`pregnancy ${Math.round(clamp01(pregnancyProgress)*100)}%`;
  if(children>0)return`${children} child${children===1?'':'ren'}`;
  return'';
}

export function contextTone(text=''){
  const t=String(text).toUpperCase();
  if(t.startsWith('DANGER')||t.startsWith('HEALTH LOW'))return'danger';
  if(t.startsWith('WATER LOW')||t.startsWith('ENERGY LOW'))return'need';
  if(/^(E|Space)\s*·/.test(String(text)))return'action';
  if(t.startsWith('WINDED'))return'need';
  return'info';
}
