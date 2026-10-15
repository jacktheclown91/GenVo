import {sha256Bytes} from './sha256-bytes.js';
import {PARTS} from '../lineage/part-registry.js';
const fail=message=>{throw Error(`Indexed part: ${message}`)};
const luminance=rgb=>rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
const byte=v=>Number.isInteger(v)&&v>=0&&v<=255;
// Decoders supply unpremultiplied native RGBA. Never infer, quantize or erase
// transparent RGB: source identity includes hidden pixels as well as alpha.
export function indexSourceRgbaFrame(frame,regions,width=32,height=32){
  if(width!==32||height!==32)fail('source frame requires native 32x32 pixels');
  const rgba=Array.from(frame.rgba||[]);
  if(rgba.length!==width*height*4||!rgba.every(byte))fail('invalid source RGBA');
  if(!Array.isArray(regions)||!regions.length)fail('missing source pigment regions');
  const lookup=new Map(),ids=new Set();let offset=0;
  for(const region of regions){
    if(typeof region.id!=='string'||!region.id||ids.has(region.id))fail('duplicate or invalid pigment region');ids.add(region.id);
    const colors=ramp(region.colors,{ordered:!region.protected});
    colors.forEach((rgb,tone)=>{const key=rgb.join(',');if(!lookup.has(key))lookup.set(key,[]);lookup.get(key).push({id:region.id,index:offset+tone});});offset+=colors.length;
  }
  const assignments=frame.regionIds===undefined?null:Array.from(frame.regionIds);
  if(assignments&&assignments.length!==width*height)fail('invalid pixel region assignments');
  const indices=[],alpha=[];
  for(let i=0;i<width*height;i++){
    const key=rgba.slice(i*4,i*4+3).join(',');let candidates=lookup.get(key)||[];
    if(assignments){if(!ids.has(assignments[i]))fail(`unknown pixel region at ${i}`);candidates=candidates.filter(c=>c.id===assignments[i]);}
    if(!candidates.length)fail(`unmapped source color at ${i}`);
    if(candidates.length!==1)fail(`ambiguous source pigment at ${i}; provide regionIds`);
    indices.push(candidates[0].index);alpha.push(rgba[i*4+3]);
  }
  return {state:frame.state,facing:frame.facing,index:frame.index,durationMs:frame.durationMs,jointDegrees:frame.jointDegrees,indices,alpha};
}
export async function compileSourceRgbaPart(spec){
  if(!Array.isArray(spec.frames))fail('missing source frames');
  return compileIndexedPart({...spec,frames:spec.frames.map(frame=>indexSourceRgbaFrame(frame,spec.regions,spec.width??32,spec.height??32))});
}
function ramp(colors,{ordered=true}={}){
  if(!Array.isArray(colors)||!colors.length)fail('empty pigment ramp');
  const seen=new Set();let last=-Infinity;
  return colors.map(rgb=>{if(!Array.isArray(rgb)||rgb.length!==3||!rgb.every(byte))fail('invalid RGB tone');const key=rgb.join(',');if(seen.has(key))fail('collapsed shade tones');seen.add(key);const light=luminance(rgb);if(ordered&&light<=last)fail('shade ramp must increase in luminance');last=light;return Object.freeze([...rgb]);});
}
// Compile away from the render loop. The asset owns no biological stats or RNG.
export async function compileIndexedPart(spec){
  if(!PARTS[spec.partId])fail('part ID is absent from the biological registry');
  const {width=32,height=32,version,rootAnchorPx,regions,frames}=spec;
  if(!Number.isInteger(version)||version<1)fail('invalid version');
  if(width!==32||height!==32)fail('this codec slice requires native 32x32 parts');
  if(!Array.isArray(rootAnchorPx)||rootAnchorPx.length!==2||!rootAnchorPx.every(Number.isFinite))fail('invalid native anchor');
  if(!Array.isArray(regions)||!regions.length||!Array.isArray(frames)||!frames.length)fail('missing regions or frames');
  const regionIds=new Set(),entries=[],compiledRegions=regions.map(region=>{
    if(typeof region.id!=='string'||!region.id||regionIds.has(region.id))fail('duplicate or invalid pigment region');regionIds.add(region.id);
    const colors=ramp(region.colors,{ordered:!region.protected}),offset=entries.length;entries.push(...colors);
    return Object.freeze({id:region.id,protected:!!region.protected,colors:Object.freeze(colors),offset});
  });
  if(spec.rootJoint!==undefined&&(!Number.isFinite(spec.rootJoint.minDegrees)||!Number.isFinite(spec.rootJoint.maxDegrees)||spec.rootJoint.minDegrees< -180||spec.rootJoint.maxDegrees>180||spec.rootJoint.minDegrees>0||spec.rootJoint.maxDegrees<0))fail('invalid root joint');
  if(spec.displayScale!==undefined&&(!Number.isFinite(spec.displayScale)||spec.displayScale<.0625||spec.displayScale>4))fail('invalid display scale');
  if(spec.expressionScale!==undefined&&!['fixed','pulse'].includes(spec.expressionScale))fail('invalid expression scale');
  // Artwork owns only presentation geometry: torso raster bounds or separate upper/lower limb
  // sections. Biology and limb pose continue to belong to the canonical assembly/animation.
  const rig=spec.rig;
  if(rig!==undefined){
    if(rig.kind==='torso'||rig.kind==='head'){
      if(!Array.isArray(rig.bodyBoundsPx)||rig.bodyBoundsPx.length!==2||!rig.bodyBoundsPx.every(v=>Number.isFinite(v)&&v>=8&&v<=32))fail('invalid torso native bounds');
    }else if(rig.kind==='two-bone'){
      for(const segment of ['upper','lower']){
        const item=rig[segment],rect=item?.rect,start=item?.start,end=item?.end;
        if(!Array.isArray(rect)||rect.length!==4||!rect.every(Number.isInteger)||rect.some(n=>n<0)||rect[2]<1||rect[3]<1||rect[0]+rect[2]>32||rect[1]+rect[3]>32)fail('invalid limb section rectangle');
        if(![start,end].every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&p[0]>=rect[0]&&p[0]<rect[0]+rect[2]&&p[1]>=rect[1]&&p[1]<rect[1]+rect[3]))fail('limb anchor outside section');
        if(Math.hypot(end[0]-start[0],end[1]-start[1])<2)fail('limb anchors overlap');
      }
      if(rig.jointSurface!==undefined){
        const {rect,anchor}=rig.jointSurface||{},host=rig.upper.rect;
        if(!Array.isArray(rect)||rect.length!==4||!rect.every(Number.isInteger)||rect[2]<1||rect[3]<1||rect[0]<host[0]||rect[1]<host[1]||rect[0]+rect[2]>host[0]+host[2]||rect[1]+rect[3]>host[1]+host[3])fail('joint surface must sample upper native section');
        if(!Array.isArray(anchor)||anchor.length!==2||!anchor.every(Number.isFinite)||anchor[0]<rect[0]||anchor[1]<rect[1]||anchor[0]>=rect[0]+rect[2]||anchor[1]>=rect[1]+rect[3])fail('joint surface anchor outside native section');
      }
      if(rig.hipSurface!==undefined){
        const {rect,anchor}=rig.hipSurface||{},host=rig.upper.rect;
        if(!Array.isArray(rect)||rect.length!==4||!rect.every(Number.isInteger)||rect[2]<1||rect[3]<1||rect[0]<host[0]||rect[1]<host[1]||rect[0]+rect[2]>host[0]+host[2]||rect[1]+rect[3]>host[1]+host[3])fail('hip surface must sample upper native section');
        if(!Array.isArray(anchor)||anchor.length!==2||!anchor.every(Number.isFinite)||anchor[0]!==rig.upper.start[0]||anchor[1]!==rig.upper.start[1]||anchor[0]<rect[0]||anchor[1]<rect[1]||anchor[0]>=rect[0]+rect[2]||anchor[1]>=rect[1]+rect[3])fail('hip surface anchor must match anatomical root');
      }
      const a=rig.upper.rect,b=rig.lower.rect;
      if(!(a[0]+a[2]<=b[0]||b[0]+b[2]<=a[0]||a[1]+a[3]<=b[1]||b[1]+b[3]<=a[1]))fail('limb atlas sections overlap');
    }else fail('unknown art rig kind');
  }
  const keys=new Set(),compiledFrames=frames.map(frame=>{
    if(!Number.isInteger(frame.facing)||frame.facing<0||frame.facing>7||!Number.isInteger(frame.index)||frame.index<0||typeof frame.state!=='string'||!frame.state||!(frame.durationMs>0&&Number.isFinite(frame.durationMs)))fail('invalid animation metadata');
    if(frame.jointDegrees!==undefined&&(!Number.isFinite(frame.jointDegrees)||frame.jointDegrees< -180||frame.jointDegrees>180))fail('invalid joint frame');
    const key=`${frame.state}:${frame.facing}:${frame.index}`;if(keys.has(key))fail('duplicate animation frame');keys.add(key);
    const indices=Array.from(frame.indices||[]),alpha=Array.from(frame.alpha||[]);if(indices.length!==width*height||alpha.length!==indices.length||!indices.every(v=>Number.isInteger(v)&&v>=0&&v<entries.length)||!alpha.every(byte))fail('invalid pixel indices or alpha');
    return Object.freeze({key,state:frame.state,facing:frame.facing,index:frame.index,durationMs:frame.durationMs,...(frame.jointDegrees===undefined?{}:{jointDegrees:frame.jointDegrees}),indices:Object.freeze(indices),alpha:Object.freeze(alpha)});
  });
  // Hash identity includes all source pixels and the metadata controlling frames/pivot.
  const canonical={partId:spec.partId,version,width,height,...(spec.displayScale===undefined?{}:{displayScale:spec.displayScale}),...(spec.expressionScale===undefined?{}:{expressionScale:spec.expressionScale}),...(spec.rootJoint===undefined?{}:{rootJoint:Object.freeze({...spec.rootJoint})}),...(rig===undefined?{}:{rig}),rootAnchorPx:[...rootAnchorPx],regions:compiledRegions,frames:compiledFrames};
  const bytes=new TextEncoder().encode(JSON.stringify(canonical));
  const digest=globalThis.crypto?.subtle?await globalThis.crypto.subtle.digest('SHA-256',bytes):sha256Bytes(bytes);
  const checksum=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  return Object.freeze({...canonical,rootAnchorPx:Object.freeze(canonical.rootAnchorPx),regions:Object.freeze(compiledRegions),frames:Object.freeze(compiledFrames),checksum});
}
export function recolorIndexedFrame(asset,key,palette={}){
  const frame=asset.frames.find(f=>f.key===key);if(!frame)fail('missing animation frame');
  for(const id of Object.keys(palette))if(!asset.regions.some(r=>r.id===id))fail('unknown pigment region');
  const tones=[];
  for(const region of asset.regions){const requested=palette[region.id];if(region.protected&&requested!==undefined)fail('protected colors cannot be substituted');const colors=requested===undefined?region.colors:ramp(requested);if(colors.length!==region.colors.length)fail('palette loses authored shade count');tones.push(...colors);}
  const rgba=new Uint8ClampedArray(frame.indices.length*4);for(let i=0;i<frame.indices.length;i++){const rgb=tones[frame.indices[i]],j=i*4;rgba[j]=rgb[0];rgba[j+1]=rgb[1];rgba[j+2]=rgb[2];rgba[j+3]=frame.alpha[i];}
  return rgba;
}
export function indexedPaletteKey(asset,key,palette={},materialPose=''){
  // Validate before returning a key; JSON field order must not change cache identity.
  recolorIndexedFrame(asset,key,palette);
  const ordered=asset.regions.map(r=>[r.id,palette[r.id]??r.colors]);return JSON.stringify([asset.partId,asset.version,asset.checksum,key,ordered,materialPose]);
}
