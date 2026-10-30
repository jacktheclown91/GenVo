import {compileIndexedPart,recolorIndexedFrame} from '../../src/render/indexed-part-art.js';
import {prepareIndexedPartRenderer} from '../../src/render/indexed-part-renderer.js';
export async function loadStudy(series='candidate'){
  const url=new URL(series==='prototype'?'../../assets/art/experiments/resolution-v1/catalog.json':'../../assets/art/production-candidate-v1/catalog.json',import.meta.url);
  const response=await fetch(url);if(!response.ok)throw Error('Study catalog '+response.status);
  const assets=[];
  const catalog=await response.json(),variants=new Map([[64,new Map()],[128,new Map()]]);
  if(!['genvo.art-resolution-study/1','genvo.part-art-variants/1'].includes(catalog.schema))throw Error('Unknown study');
  // Loading is explicit and outside gameplay. Never decode on a drawing frame.
  for(const entry of catalog.parts){
    const res=await fetch(new URL(entry.path,url));if(!res.ok)throw Error('Study part '+res.status);
    const stream=res.body.pipeThrough(new DecompressionStream('gzip'));
    const asset=await new Response(stream).json();
    if(asset.checksum!==entry.checksum||asset.partId!==entry.partId||asset.width!==entry.resolution)throw Error('Study identity mismatch');
    const checked=await compileIndexedPart(asset);if(checked.checksum!==entry.checksum)throw Error('Study pixel checksum mismatch');
    variants.get(entry.resolution).set(entry.partId,prepareIndexedPartRenderer(checked));assets.push(checked);
  }
  return{catalog,variants,exportAtlases(){return assets.map(asset=>{
    const canvas=document.createElement('canvas');canvas.width=asset.width*8;canvas.height=asset.height*2;
    const ctx=canvas.getContext('2d');
    for(const frame of asset.frames){
      const image=ctx.createImageData(asset.width,asset.height);image.data.set(recolorIndexedFrame(asset,frame.key));
      ctx.putImageData(image,frame.facing*asset.width,frame.index*asset.height);
    }
    return{file:asset.partId+'-'+asset.width+'.png',data:canvas.toDataURL('image/png')};
  });}};
}
