// Body carriage from the existing renderer's planted-foot load envelope.
// These offsets are artwork units, not physical forces, mass or movement rules.
export function supportPosture({weight=0,side=0,fore=0,limbs=0,sturdy=0,bodyScale=1}={}){
  if(limbs<2||!(weight>1e-6))return{side:0,fore:0,sink:0};
  const scale=Math.max(.65,Math.min(1.6,bodyScale)),build=Math.max(0,Math.min(1,sturdy));
  const amplitude=(.38+.28*build)*scale;
  const sharing=Math.max(0,Math.min(1,weight/(limbs*.5)));
  return{
    side:Math.max(-1,Math.min(1,side/weight))*amplitude,
    fore:Math.max(-1,Math.min(1,fore/weight))*amplitude*.42,
    sink:(1-sharing)*(.12+.26*build)*scale
  };
}
