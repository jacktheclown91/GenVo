// Canvas reads transparent pixels as (0,0,0,0), but GenVo native indexed art keeps
// hidden RGB as part of its exact editable RGBA source. Recover those values from
// the previous frame when authoring over the Canvas2D working image.
// Biology, palette semantics and part indices are not modified.
export function preserveInvisibleRgb(canvasPixels,previousPixels=null,fallbackRgb=[0,0,0]){
 if(!canvasPixels||canvasPixels.length!==4096)throw Error('Expected exact 32×32 RGBA canvas');
 if(previousPixels&&previousPixels.length!==4096)throw Error('Previous frame must be 32×32 RGBA');
 if(!Array.isArray(fallbackRgb)||fallbackRgb.length!==3||fallbackRgb.some(c=>!Number.isInteger(c)||c<0||c>255))throw Error('Invalid fallback RGB');
 const recovered=Array.from(canvasPixels);
 for(let i=0;i<4096;i+=4){
  if(recovered[i+3]!==0)continue;
  for(let j=0;j<3;j++)recovered[i+j]=previousPixels?previousPixels[i+j]:fallbackRgb[j];
 }
 return recovered;
}
