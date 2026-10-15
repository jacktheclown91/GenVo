import assert from 'node:assert/strict';
import {overheadFlora} from '../assets/art/environment/overhead-flora.js';
import {floraArtState,drawAuthoredFlora} from '../src/render/authored-flora.js';
import {floraVisualAnchor,floraAnchor,drawFloraSeedling} from '../src/render/flora.js';
let canvases=0;const prior=globalThis.document;
globalThis.document={createElement(){canvases++;const canvas={getContext:()=>({fillStyle:'#000000',createImageData:()=>({data:new Uint8ClampedArray(4096)}),putImageData(image){canvas.rgba=image.data.slice()},getImageData(){throw Error('Plant paint cannot read GPU pixels')}})};return canvas}};
try{
 const palette={body:'#547444',shade:'#314c30',deep:'#172c22',light:'#81a45e'},calls=[];
 const ctx={save(){},restore(){},translate(x,y){calls.push(['at',x,y])},rotate(a){calls.push(['turn',a])},drawImage(...args){calls.push(['paint',...args])}};
 const species=['tuft','shrub','reed','pod','fungus'];let count=0;
 for(const shape of species)for(const season of ['SPRING','SUMMER','AUTUMN','WINTER'])for(const amount of [.08,.4,.85]){
  const before=calls.length;assert.equal(drawAuthoredFlora(ctx,{shape,u:2,amount,season,...palette}),true);assert.ok(calls.length>before);count++;
 }
 for(const shape of species){const before=calls.length;assert.equal(drawAuthoredFlora(ctx,{shape,u:2,amount:0,...palette}),false);assert.equal(calls.length,before)}
 assert.equal(floraArtState({shape:'shrub',amount:.4}).frame,0);assert.equal(floraArtState({shape:'shrub',amount:.8}).frame,1);assert.equal(floraArtState({shape:'shrub',amount:.4,season:'AUTUMN'}).frame,1);
 for(const [coat,index] of [[.1,0],[.25,1],[.5,2]])assert.equal(floraArtState({shape:'pod',amount:.5,coatAllocation:coat}).frame,index);
 assert.equal(floraArtState({shape:'shrub',amount:.5,seedAllocation:.3}).gold,true);
 for(const [shape,art] of Object.entries(overheadFlora))for(const frame of art.frames){assert.equal(frame.length,1024);assert.ok(frame.every(p=>Number.isInteger(p)&&p>=0&&p<=12),shape);assert.ok(frame.some(p=>p>0))}
 const bare=overheadFlora.shrub.frames[0],fruiting=overheadFlora.shrub.frames[1];assert.ok(!bare.some(p=>p>=6&&p<=8));
 for(let i=0;i<1024;i++)if(fruiting[i]<6||fruiting[i]>8)assert.equal(fruiting[i],bare[i],'Fruit state cannot replace its registered canopy');
 for(const frame of overheadFlora.seedling.frames)assert.ok(frame.every(p=>p<=5),'Seedlings cannot display invented mature fruit or pods');
 const before=canvases;drawAuthoredFlora(ctx,{shape:'pod',u:2,amount:.5,...palette});const prepared=canvases;for(let i=0;i<50;i++)drawAuthoredFlora(ctx,{shape:'pod',u:2,amount:.5,...palette});assert.equal(canvases,prepared,'Repeated plant projection reuses native paint');assert.ok(prepared>=before);
 const east=floraVisualAnchor('reed',4,7,(x,y)=>x===5&&y===7),j=floraAnchor('reed',4,7);assert.equal(east.x,10+j.jx);assert.equal(east.y,8+j.jy);
 const bankOps=[],fallback={save(){},restore(){},translate(){},fillRect(...a){bankOps.push(a)}};
 drawFloraSeedling(fallback,{p:{color:'#486b38'},amount:0,bank:0,px:0,py:0,u:2,x:4,y:7,kind:'bramble'});assert.equal(bankOps.length,0);
 drawFloraSeedling(fallback,{p:{color:'#486b38'},amount:0,bank:.2,px:0,py:0,u:2,x:4,y:7,kind:'bramble'});assert.equal(bankOps.length,3,'A seed bank displays marks, not a mature plant');
 console.log(`${count} biomass/season plant cases, inherited coats/seed colors, registered foliage, shared shore anchor, honest seedlings and readback-free cached paint PASS`);
}finally{globalThis.document=prior}
