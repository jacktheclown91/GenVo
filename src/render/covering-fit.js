// Native dorsal tissue follows the same inherited/growth deformation already
// applied to the torso. These are renderer dimensions, not a new size authority.
const coverings=new Set(['filament-tuft','fur-mantle','feather-mantle','shell-back']);
const positive=v=>Number.isFinite(v)&&v>0?v:1;
export function nativeCoveringFit(partId,k={}){
 if(!coverings.has(partId))return null;
 const body=positive(k.nativeBodyScale),x=body*positive(k.nativeBodyWidthScale),y=body*positive(k.nativeBodyHeightScale);
 return x===1&&y===1?null:{x,y};
}
