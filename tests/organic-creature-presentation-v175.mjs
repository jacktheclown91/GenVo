import assert from 'node:assert/strict';
import fs from 'node:fs';
import {organicFootfall,genvoVisualPose} from '../src/render/genvo.js';
import {creaturePalette} from '../src/render/creature-palette.js';
import {inheritedSkinRamp,drawGenvoSprite} from '../src/render/genvo-draw.js';
import {behaviorVisualState} from '../src/render/behavior.js';
import {makePlan} from '../src/lineage/body-plan.js';
import {phenotypeFor} from '../src/organisms/species.js';
const plan=makePlan([{partId:'soft-torso',parent:null,socket:null},...['limb.1','limb.3','limb.5','limb.7'].map(socket=>({partId:'walking-leg',parent:'root',socket})),...['eye.left','eye.right'].map(socket=>({partId:'simple-eye',parent:'root',socket})),{partId:'grazing-mouth',parent:'root',socket:'mouth'}]);
// A five-beat support interval and a single continuous swing, including wraparound.
for(let p=4;p<9;p+=.125){const s=organicFootfall(p%8);assert.equal(s.lift,0);assert.equal(s.planted,true)}
for(const seam of [1,4,8]){const a=organicFootfall(seam-1e-6),b=organicFootfall(seam+1e-6);assert.ok(Math.abs(a.stride-b.stride)<1e-5);assert.ok(Math.abs(a.lift-b.lift)<1e-5)}
const pose=phase=>genvoVisualPose({dir:2,frame:phase,moving:true,legSlots:[{slot:2,reach:1,gait:{stride:1,lift:1}}]});
const a=pose(6).legs[0],b=pose(6.2).legs[0];assert.ok(Number.isFinite(a.knee.x+b.foot.y));
// Names cannot pick a different composite appearance or body-language treatment.
function painting(species){const animal={id:42,species,dir:3,bodyPlan:plan,genes:{body:1,motion:1,senses:1,climate:1.1,metabolism:1.05},adaptations:[],anatomy:{}};const ph=phenotypeFor(animal),calls=[];const ctx=new Proxy({},{get:(_,k)=>(...args)=>calls.push([k,...args]),set:(_,k,v)=>{calls.push([k,v]);return true}});drawGenvoSprite(ctx,{animal,phenotype:ph,scale:2,frame:1.5,moving:true,palette:creaturePalette(ph),pose:{dir:3,action:'move',behavior:behaviorVisualState({bodyPlan:plan,species,id:42,action:'move',phase:1.5,moving:true})}});return calls}
assert.deepEqual(painting('unregistered-emergent-lineage'),painting('genvo'));
const palette=creaturePalette({hueShift:20,lightShift:2});assert.ok(Object.values(palette).every(c=>/^#[0-9a-f]{6}$/.test(c)));assert.ok(inheritedSkinRamp(palette));assert.notDeepEqual(palette,creaturePalette({hueShift:-20,lightShift:2}));
const source=fs.readFileSync(new URL('../src/render/renderer.js',import.meta.url),'utf8');assert.ok(!/WILD_SCALE|SPECIAL_KINDS|drawFaunaSprite|spec\.sprite/.test(source));
const behavior=fs.readFileSync(new URL('../src/render/behavior.js',import.meta.url),'utf8');assert.ok(!/species===/.test(behavior));
// Near/far joint sections stay distinct, tapered and fully connected. Low alpha
// coverage can never stand in for real contour quality or a screenshot verdict.
for(const id of ['walking-leg','spring-leg','grasper','runner-leg','sturdy-leg','webbed-leg','padded-leg','digging-forelimb']){
 const asset=JSON.parse(fs.readFileSync(new URL(`../assets/art/parts/${id}.json`,import.meta.url))),f=asset.frames.find(f=>f.facing===2&&f.index===0),pix=Buffer.from(f.rgbaBase64,'base64');
 for(const off of [0,16]){const h=x=>{let n=0;for(let y=off;y<off+16;y++)if(pix[(y*32+x)*4+3])n++;return n};assert.ok(h(10)>h(25),id+' must taper from muscle to tendon');for(let x=3;x<=28;x++)assert.ok(h(x)>0,id+' disconnected bone');}
}
console.log('Organic support/swing continuity, connected tapered limbs, inherited RGB pigments and ancestry-independent drawing PASS');
