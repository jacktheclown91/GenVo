import assert from 'node:assert/strict';
import fs from 'node:fs';import {createHash} from 'node:crypto';
import {precipitationArt as art} from '../assets/art/environment/precipitation.js';
import {precipitationParticles} from '../src/render/precipitation-art.js';
import {drawAtmosphere} from '../src/render/atmosphere.js';
import {VISIBILITY} from '../src/ecology/atmospheric-visibility.js';
assert.equal(createHash('sha256').update(fs.readFileSync(new URL('../assets/art/production-review/precipitation-v1/master.png',import.meta.url))).digest('hex'),art.sourceSha256);
for(const [kind,group] of Object.entries(art.groups)){assert.deepEqual([group.width,group.height],kind==='rain'?[6,16]:[7,7]);assert.equal(group.frames.length,4);for(const f of group.frames){assert.equal(f.length,group.width*group.height);assert.ok(f.every(v=>Number.isInteger(v)&&v>=0&&v<12));assert.ok(f.some(v=>v%4));for(let i=0;i<f.length;i++){const x=i%group.width,y=Math.floor(i/group.width);if(x===0||x===group.width-1||y===0||y===group.height-1)assert.equal(f[i],0)}}assert.ok(new Set(group.frames.map(f=>JSON.stringify(f))).size>=3)}
for(const lowDetail of [false,true])for(const intensity of [0,.009,.01,.25,.5,1])for(const snow of [false,true]){
 const renderer=Object.freeze({w:1000,h:750,renderNow:10000,lowDetail}),sample=Object.freeze({snow:intensity,liquid:intensity,wind:Object.freeze({east:-.7,south:.4})});const before=JSON.stringify([renderer,sample]),p=precipitationParticles(renderer,sample,snow);assert.equal(p.length,intensity<.01?0:Math.round((snow?110:100)*intensity*(lowDetail?.35:1)));assert.deepEqual(p,precipitationParticles(renderer,sample,snow));assert.equal(JSON.stringify([renderer,sample]),before);for(const v of p){assert.ok(Object.values(v).every(Number.isFinite));assert.ok(v.alpha>0&&v.alpha<1);assert.ok(v.x>=-45&&v.x<=renderer.w+45);assert.ok(v.y>=-30&&v.y<=renderer.h+30);assert.ok(v.frame>=0&&v.frame<4)}}
for(const east of [-1,0,1]){const s={liquid:1,snow:1,wind:{east,south:0}},r={w:1000,h:750,renderNow:0};const a=precipitationParticles(r,s,false)[10],b=precipitationParticles({...r,renderNow:1000},s,false)[10];assert.equal(Math.sign(b.x-a.x),Math.sign(east));assert.ok(Math.sign(a.angle)===-Math.sign(east))}
const fail=new Proxy({},{get(){throw Error('Suppressed atmosphere attempted to draw')}});
for(const player of [null,{underground:true},{diveDepth:.04}])assert.equal(drawAtmosphere({ctx:fail,sim:{visibilityRules:VISIBILITY.policy,player:()=>player}}),true);
assert.equal(drawAtmosphere({ctx:fail,sim:{visibilityRules:undefined}}),false);
console.log('Native precipitation PASS: master hash, eight bounded indexed sprites, deterministic count/detail, full wind heading, read-only layout and legacy/stratum exclusions.');
