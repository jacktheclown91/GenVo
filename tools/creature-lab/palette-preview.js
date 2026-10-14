import {indexSourceRgbaFrame,recolorIndexedFrame} from '../../src/render/indexed-part-art.js';
// Explicit RGB membership applies identically across frames; all other colors protected.
export function recolorDraftFrames(frames,sourceColors,targetColors){
 if(sourceColors.length===0&&targetColors.length===0)return frames.map(frame=>frame.slice());
 const selected=new Set(sourceColors.map(c=>c.join(','))),other=new Map();
 for(const frame of frames)for(let i=0;i<frame.length;i+=4){const rgb=frame.slice(i,i+3),key=rgb.join(',');if(!selected.has(key))other.set(key,rgb)}
 const regions=[{id:'pigment',colors:sourceColors},{id:'protected',protected:true,colors:[...other.values()]}].filter(r=>r.colors.length);
 let offset=0;const compiled=regions.map(r=>{const result={...r,offset};offset+=r.colors.length;return result});
 const asset={regions:compiled,frames:frames.map((rgba,index)=>({...indexSourceRgbaFrame({rgba},regions),key:String(index)}))};
 return frames.map((_,index)=>Array.from(recolorIndexedFrame(asset,String(index),{pigment:targetColors})));
}
