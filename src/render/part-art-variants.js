import {compileIndexedPart} from './indexed-part-art.js';
import {prepareIndexedPartRenderer} from './indexed-part-renderer.js';

// Opt-in presentation assets. Loading returns an independent map and never
// changes the installed native32 catalog, biological state or save preferences.
export async function loadPartArtVariant(url,{resolution=128,partIds=null,createCanvas,fetcher=globalThis.fetch}={}){
  if(![64,128].includes(resolution))throw Error('Detailed artwork requires 64 or 128 pixels');
  const manifestUrl=new URL(url,import.meta.url);
  const response=await fetcher(manifestUrl);
  if(!response.ok)throw Error('Detailed artwork catalog '+response.status);
  const catalog=await response.json();
  if(catalog.schema!=='genvo.part-art-variants/1'||!Array.isArray(catalog.parts))throw Error('Unknown detailed artwork catalog');
  const supplied=catalog.parts.filter(entry=>entry.resolution===resolution);
  if(!supplied.length)throw Error('Artwork resolution is not supplied');
  if(partIds!==null&&(!Array.isArray(partIds)||partIds.some(id=>typeof id!=='string'||!id)))throw Error('Invalid detailed part selection');
  const requested=partIds===null?null:new Set(partIds);
  const entries=supplied.filter(entry=>!requested||requested.has(entry.partId));
  const ids=new Set(),staged=new Map();let cursor=0;
  for(const entry of entries){if(ids.has(entry.partId))throw Error('Duplicate detailed part');ids.add(entry.partId);}
  const worker=async()=>{
    while(cursor<entries.length){
      const entry=entries[cursor++],res=await fetcher(new URL(entry.path,manifestUrl));
      if(!res.ok)throw Error('Detailed part '+entry.partId+' '+res.status);
      let asset;
      if(entry.path.endsWith('.gz')){
        if(typeof DecompressionStream!=='function')throw Error('Detailed artwork decoding unavailable; native32 remains available');
        asset=await new Response(res.body.pipeThrough(new DecompressionStream('gzip'))).json();
      }else asset=await res.json();
      if(asset.partId!==entry.partId||asset.width!==resolution||asset.height!==resolution)throw Error('Detailed part identity mismatch');
      // Verify actual pixels and rig metadata, not just a claimed checksum string.
      const checked=await compileIndexedPart(asset);
      if(checked.checksum!==entry.checksum||checked.checksum!==asset.checksum)throw Error('Detailed part checksum mismatch');
      staged.set(entry.partId,prepareIndexedPartRenderer(checked,{createCanvas}));
    }
  };
  await Promise.all(Array.from({length:Math.min(3,entries.length)},worker));
  return{resolution,parts:staged,catalog};
}
