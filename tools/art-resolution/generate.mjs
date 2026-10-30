import fs from 'node:fs/promises';
import path from 'node:path';
import {gzipSync} from 'node:zlib';
import {compileIndexedPart} from '../../src/render/indexed-part-art.js';
import {authorStudyPart,STUDY_PARTS} from './art-recipes.mjs';
const folder='assets/art/experiments/resolution-v1';
await fs.mkdir(folder,{recursive:true});
const catalog={schema:'genvo.art-resolution-study/1',status:'experimental-creator-review',
  author:'Original code-authored pixel studies, AI-assisted; no external expressive assets.',
  coordinateSpace:'32 art units; display scale and all rig anchors preserve the existing physical footprint.',parts:[]};
for(const resolution of [64,128])for(const id of STUDY_PARTS){
  const source=JSON.parse(await fs.readFile('assets/art/parts/'+id+'.indexed.json','utf8'));
  const asset=await compileIndexedPart(authorStudyPart(source,resolution));
  const file=id+'-'+resolution+'.indexed.json.gz',bytes=gzipSync(JSON.stringify(asset),{level:9});
  await fs.writeFile(path.join(folder,file),bytes);
  catalog.parts.push({partId:id,resolution,path:'./'+file,checksum:asset.checksum,bytes:bytes.length,
    decodedRgbaBytes:asset.frames.length*resolution*resolution*4,sourceChecksum:source.checksum});
}
await fs.writeFile(path.join(folder,'catalog.json'),JSON.stringify(catalog,null,2)+'\n');
console.log('Authored '+catalog.parts.length+' native part studies; '+catalog.parts.reduce((n,p)=>n+p.bytes,0)+' compressed bytes.');
