import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const root=process.cwd(),out=path.resolve(process.argv[2]||'docs/mass-carriage-2026-10-29/controlled');
if(fs.existsSync(out))throw Error('Use a fresh output directory');
fs.mkdirSync(out,{recursive:true});
const plan=JSON.parse(fs.readFileSync('docs/mass-carriage-2026-10-29/native/authored-mouth.json')).design.plan;
const server=http.createServer((req,res)=>{
  const f=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
  if(!f.startsWith(root+path.sep))return res.writeHead(403).end();
  fs.readFile(f,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.gz':'application/gzip','.css':'text/css'})[path.extname(f)]||'application/octet-stream');res.end(b)});
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch();
try{
  const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port+'/tools/art-resolution/index.html');
  const result=await page.evaluate(async serialized=>{
    const {deserializePlan}=await import('/src/lineage/body-plan.js');
    const plan=deserializePlan(serialized);
    const {locomotionStyle,locomotionOffsets}=await import('/src/render/locomotion-style.js');
    const {bodyDimensionsOf,ANATOMICAL_MASS}=await import('/src/organisms/body-mass.js');
    const {SPECIES,phenotypeFor}=await import('/src/organisms/species.js');
    const {drawGenvoSprite}=await import('/src/render/genvo-draw.js');
    const {creaturePalette}=await import('/src/render/creature-palette.js');
    const {loadPartArtVariant}=await import('/src/render/part-art-variants.js');
    const {assemblyFor}=await import('/src/render/creature-assembler.js');
    const {genvoVisualPose}=await import('/src/render/genvo.js');
    const parts=Object.fromEntries((await loadPartArtVariant(new URL('/assets/art/production-candidate-v1/catalog.json',location.href),{resolution:128})).parts);
    const images=[],cases=[];
    for(const age of [0,SPECIES.genvo.maturity]){
      const cv=document.createElement('canvas');cv.width=1280;cv.height=520;const c=cv.getContext('2d');c.fillStyle='#14271c';c.fillRect(0,0,1280,520);c.imageSmoothingEnabled=false;
      for(const [col,size] of [.5,1,1.5,2].entries()){
        const animal={species:'genvo',bodyPlan:plan,age,massPolicy:ANATOMICAL_MASS,bodySize:{schema:1,alleles:[Math.log(size),Math.log(size)]}},saved=JSON.stringify(animal),ph=phenotypeFor(animal),d=bodyDimensionsOf(animal);
        ph.bodyScale*=d.growth;ph.limbScale*=.72+.28*d.growth;
        const old=locomotionStyle({...animal,massPolicy:undefined}),current=locomotionStyle(animal);
        const behavior=style=>{const o=locomotionOffsets(style,{phase:2,moving:true,baseBob:-1});return {bodyRise:o.rise,bodySway:o.sway,torsoTwist:o.twist,dorsalRoll:o.roll,bodyLean:o.lean}};
        const oldPose=genvoVisualPose({dir:2,frame:2,moving:true,behavior:behavior(old),legSlots:assemblyFor(animal).legSlots});
        const newPose=genvoVisualPose({dir:2,frame:2,moving:true,behavior:behavior(current),legSlots:assemblyFor(animal).legSlots});
        if(JSON.stringify(oldPose.legs.map(l=>l.foot))!==JSON.stringify(newPose.legs.map(l=>l.foot)))throw Error('Carriage moved candidate feet');
        for(const [row,style] of [old,current].entries()){
          c.fillStyle='#ded8b5';c.font='14px sans-serif';c.fillText((row?'current':'before')+' '+size+'x adult / '+d.stage,col*320+12,row*260+24);
          c.save();c.translate(col*320+160,row*260+135);drawGenvoSprite(c,{animal,phenotype:ph,palette:creaturePalette(ph),scale:4*size,frame:2,moving:true,authoredParts:parts,pose:{dir:2,action:'move',life:{growth:d.growth},behavior:behavior(style)}});c.restore();
        }
        cases.push({size,age,dimensions:d,before:old.heavy,current:current.heavy,feetExact:true});
        if(JSON.stringify(animal)!==saved)throw Error('Controlled specimen mutated');
      }
      images.push({name:age?'adult-carriage.png':'newborn-carriage.png',png:cv.toDataURL('image/png')});
    }
    return {images,cases};
  },plan);
  for(const im of result.images)fs.writeFileSync(path.join(out,im.name),Buffer.from(im.png.split(',')[1],'base64'));delete result.images;
  fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify({status:'PASS',...result,creatorAcceptance:false,scope:'Explicit controlled age/size draw-only specimens using the actual public-founder plan, canonical mass/growth and the game composer. Never entered Simulation; not natural giant/juvenile field evidence. 4x viewing zoom, fixed phase2; candidate feet exact.'},null,2));
  console.log('Controlled mass carriage PASS: actual head/body parts and physical mass/growth readers, native before/current adult/newborn poses, feet exact, no organism mutation.');
}finally{await browser.close();await new Promise(r=>server.close(r))}
