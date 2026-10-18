import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {PARTS} from '../src/lineage/part-registry.js';
import {artMount,PART_SPRITES,drawPartAlone} from '../src/render/part-sprites.js';
import {compileSourceRgbaPart,recolorIndexedFrame} from '../src/render/indexed-part-art.js';
import {thermalCoverFactor} from '../src/lineage/terrain-cover-physiology.js';
import {makePlan} from '../src/lineage/body-plan.js';
import {founderPlan} from '../src/lineage/body-inheritance.js';

const ids=['filament-tuft','fur-mantle','feather-mantle'];
const catalog=JSON.parse(fs.readFileSync(new URL('../assets/art/catalog.json',import.meta.url),'utf8'));
assert.equal(catalog.parts.length,Object.keys(PARTS).length,'no missing, duplicated or invented biological assets');
const masks=new Map(),opaque=new Map();
for(const id of ids){
 const entry=catalog.parts.find(p=>p.partId===id);
 assert.equal(entry?.status,'e5-native-coat-open-body-review');
 const content=fs.readFileSync(new URL('../assets/art/'+entry.path.slice(2),import.meta.url));
 assert.equal(crypto.createHash('sha256').update(content).digest('hex'),entry.checksumSha256);
 const source=JSON.parse(content),native=JSON.parse(fs.readFileSync(new URL('../assets/art/'+entry.indexed.slice(2),import.meta.url)));
 assert.equal(source.version,3);
 assert.equal(source.frames.length,16);
 assert.equal(source.regions.length,2);
 const built=await compileSourceRgbaPart({...source,frames:source.frames.map(f=>({...f,rgba:Buffer.from(f.rgbaBase64,'base64')}))});
 assert.equal(native.checksum,built.checksum,'full RGBA compiled without quantization or color loss');
 assert.equal(native.checksum,entry.compiledChecksum);
 const pixels=[];
 for(let f=0;f<8;f++){
   const first=source.frames.find(x=>x.facing===f&&x.index===0);
   const second=source.frames.find(x=>x.facing===f&&x.index===1);
   assert.ok(first&&second,id+' incomplete facing');
   const a=Buffer.from(first.rgbaBase64,'base64'),b=Buffer.from(second.rgbaBase64,'base64');
   assert.deepEqual(Buffer.from(recolorIndexedFrame(native,`idle:${f}:0`)),a);
   assert.deepEqual(Buffer.from(recolorIndexedFrame(native,`idle:${f}:1`)),b);
   assert.notDeepEqual(a,b,'real frame variation '+id+' facing '+f);
   pixels.push(a);
 }
 // Dorsal coverings must retain a transparent central aperture so a body
 // remains visible. Dense fur/feathers are not an opaque generic white blob.
 if(id!=='filament-tuft'){
   const sourceCenter=(16*32+16)*4+3;
   assert.equal(pixels[2][sourceCenter],0,`${id} preserves the native body's center`);
 }
 const facing=pixels[2],mask=new Set(),styles=new Set();
 for(let i=0;i<1024;i++)if(facing[i*4+3]){
   mask.add(i);
   styles.add([facing[i*4],facing[i*4+1],facing[i*4+2]].join(','));
 }
 assert.ok(mask.size>40,id+' contains meaningful painted pixels at native scale');
 assert.ok(styles.size>=5,id+' has meaningful region/tone differentiation');
 masks.set(id,mask);opaque.set(id,mask.size);
 const k={s:3,fx:1,fy:0,perp:{x:0,y:1},bx:0,by:0,bodyW:7,bodyH:6,
   p:{body:'#7799aa',shade:'#344e60',light:'#d6e4eb'}};
 const mounted=artMount(id,k);
 assert.ok(mounted&&mounted.scale>.31,id+' increases coat extent only through a valid dorsal mount');
 let rects=0,colors=new Set(),fill='#fff';
 const c={set fillStyle(v){fill=v},get fillStyle(){return fill},fillRect(){rects++;colors.add(fill)}};
 drawPartAlone(c,id,{type:'dorsal',s:4,p:k.p});
 assert.ok(rects>=8&&colors.size>=2,id+' has nonempty rich procedural fallback');
}
const filament=masks.get('filament-tuft'),fur=masks.get('fur-mantle'),feather=masks.get('feather-mantle');
assert.ok(fur.size>filament.size*1.4,'dense fur must read as materially fuller than primitive filaments');
assert.ok(feather.size>filament.size*1.15,'plumage must have separate visible vanes');
const overlap=(a,b)=>{let n=0;for(const px of a)if(b.has(px))n++;return n/(a.size+b.size-n)};
assert.ok(overlap(fur,feather)<.78,'fur and feathers have meaningfully different native outer silhouettes');
assert.ok(overlap(filament,fur)<.65,'filament precursor is not an early finished fur mantle');
assert.ok(overlap(filament,feather)<.65,'filament precursor is not a finished feather mantle');
const founder=founderPlan();
const fitted=id=>{const p=makePlan([...founder.nodes.filter(n=>n.parent!=='root'||n.socket!=='dorsal')
  .map(n=>({partId:n.partId,parent:n.parent,socket:n.socket})),{partId:id,parent:'root',socket:'dorsal'}]);
 return{bodyPlan:p};
};
assert.equal(thermalCoverFactor(fitted('fur-mantle'),.1,.55),.48,'art never changes biological fur energy');
assert.equal(thermalCoverFactor(fitted('feather-mantle'),.1,.55),.55,'art never changes biological feather energy');
assert.equal(thermalCoverFactor(fitted('filament-tuft'),.1,.55),.78,'art never changes biological filament energy');
assert.ok(!PARTS['proto-wing'].actionCapabilities.includes('fly'),'silhouette upgrades never grant flight');
console.log('E5 differentiated native source and mounted art: '+JSON.stringify(Object.fromEntries(opaque))+' pixels, source RGBA exact, unchanged biological thermal costs PASS');
