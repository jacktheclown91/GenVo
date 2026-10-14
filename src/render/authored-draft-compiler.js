import {compileSourceRgbaPart} from './indexed-part-art.js';
import {PARTS} from '../lineage/part-registry.js';
// Explicit catalog identity is supplied by the author; pixels grant no biology.
export async function compileAuthoredDraft(draft,{partId,state='idle',facing=0,version=1}={}){
 if(!PARTS[partId])throw Error('Choose a registered biological part');
 if(draft?.schema!=='genvo8.lab.authored-draft/2'||draft.width!==32||draft.height!==32||!Array.isArray(draft.framePixels)||draft.framePixels.length<1||draft.framePixels.length>64||draft.frames!==draft.framePixels.length)throw Error('Invalid authored animation draft');
 const durations=draft.frameDurations||draft.framePixels.map(()=>draft.frameDurationMs??125);
 if(durations.length!==draft.frames||!durations.every(n=>Number.isInteger(n)&&n>=1&&n<=655350))throw Error('Invalid authored timing');
 if(draft.frameJointAngles!==undefined&&(!Array.isArray(draft.frameJointAngles)||draft.frameJointAngles.length!==draft.frames))throw Error('Invalid authored joint frames');
 const hex=color=>{if(!/^#[0-9a-f]{6}$/i.test(color))throw Error('Invalid pigment tone');return [1,3,5].map(i=>parseInt(color.slice(i,i+2),16))};
 const selected=(draft.paletteRegions||[]).map(t=>hex(t.source)),keys=new Set(selected.map(c=>c.join(','))),other=new Map();
 for(const rgba of draft.framePixels){if(!Array.isArray(rgba)||rgba.length!==4096||!rgba.every(n=>Number.isInteger(n)&&n>=0&&n<=255))throw Error('Invalid authored pixels');for(let i=0;i<rgba.length;i+=4){const rgb=rgba.slice(i,i+3),key=rgb.join(',');if(!keys.has(key))other.set(key,rgb)}}
 const regions=[{id:'pigment',colors:selected},{id:'protected',protected:true,colors:[...other.values()]}].filter(r=>r.colors.length);
 return compileSourceRgbaPart({partId,version,width:32,height:32,rootAnchorPx:draft.rootAnchorPx||[16,16],regions,displayScale:draft.displayScale,rootJoint:draft.rootJoint,frames:draft.framePixels.map((rgba,index)=>({rgba,state,facing,index,durationMs:durations[index],jointDegrees:draft.frameJointAngles?.[index]}))});
}
