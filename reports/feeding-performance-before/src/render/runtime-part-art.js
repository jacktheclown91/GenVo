// GenVo native pixel-art bridge. Art-only; the biological part registry remains authoritative.
// The authoring catalog is verified and converted by the single indexed-art codec.
import {prepareIndexedPartRenderer} from './indexed-part-renderer.js';

let installed=new Map();
let latestLoad=0;
const states={status:'not loaded',installed:0,revision:0,errors:[]};
export function artForPart(id){return installed.get(id)||null}
export function nativeArtStatus(){return {...states,errors:[...states.errors]}}
export async function loadNativePartCatalog(url=new URL('../../assets/art/catalog.json',import.meta.url)){
 // Build the new catalog offscreen. Parallel requests must not corrupt counts or overwrite
 // a newer version, nor clear live artwork during a reload.
 const ticket=++latestLoad,staged=new Map(),errors=[];
 states.status='loading';
 try{
  const response=await fetch(url,{cache:'no-cache'});if(!response.ok)throw Error('art manifest '+response.status);
  const catalog=await response.json();if(catalog.schema!=='genvo.part-art-catalog/1'||!Array.isArray(catalog.parts))throw Error('unrecognized art manifest');
  const seen=new Set();let cursor=0;
  const worker=async()=>{while(cursor<catalog.parts.length){
   const index=cursor++,entry=catalog.parts[index];
   if(ticket!==latestLoad)return;
   try{
    if(seen.has(entry.partId))throw Error('duplicate art ID');seen.add(entry.partId);
    const pathname=new URL(entry.indexed,url);const res=await fetch(pathname);if(!res.ok)throw Error('compiled art '+res.status);
    const asset=await res.json();if(ticket!==latestLoad)return;if(asset.partId!==entry.partId||asset.checksum!==entry.compiledChecksum||asset.width!==32||asset.height!==32||!Array.isArray(asset.frames)||asset.frames.length<8||!asset.frames.every(f=>Array.isArray(f.indices)&&f.indices.length===1024&&Array.isArray(f.alpha)&&f.alpha.length===1024))throw Error('part ID, checksum, or pixel data invalid');
    staged.set(asset.partId,prepareIndexedPartRenderer(asset));
   }catch(error){errors[index]=entry.partId+': '+error.message}
  }};
  // Bound simultaneous requests while avoiding one network round trip per part.
  await Promise.all(Array.from({length:Math.min(8,catalog.parts.length)},()=>worker()));
  if(ticket===latestLoad){installed=staged;states.installed=staged.size;states.errors=errors.filter(Boolean);states.status=states.errors.length?'partial':'ready';states.revision++}
 }catch(error){
  if(ticket===latestLoad){states.status=installed.size?'partial':'fallback';states.errors=[error.message];states.installed=installed.size}
 }
 return nativeArtStatus();
}
