import assert from 'node:assert/strict';
import {environmentContactFor,drawGroundContact} from '../src/render/physicality.js';
import {drawWaterContact} from '../src/render/water-contact-art.js';
import {SURFACE_ICE} from '../src/world/surface-ice.js';
const n=4,len=n*n,world={n,len,idx:(x,y)=>(y|0)*n+(x|0),isPlayable:(x,y)=>x>=0&&y>=0&&x<n&&y<n,water:new Uint8Array(len),moisture:new Float32Array(len),plants:{},environment:{icePolicy:SURFACE_ICE.policy,ice:new Float64Array(len),iceBroken:new Uint8Array(len)}};
const a={id:7,species:'genvo',alive:true,x:1.5,y:1.5,genes:{body:1}},i=world.idx(a.x,a.y);world.water[i]=1;
const calls=[],ctx={save(){},restore(){},fillRect(...r){assert.ok(r.every(Number.isFinite));assert.ok(r[2]>=1&&r[3]>=1);calls.push(r)},set fillStyle(v){}};
const snap=()=>JSON.stringify([a,world.water,world.moisture,world.environment]);
function paint(){calls.length=0;drawGroundContact(ctx,{contact:environmentContactFor(world,a,{action:'drink',phase:2,moving:true}),scale:2});return calls.length}
const before=snap();assert.ok(paint()>0,'exposed surface produces contact art');assert.equal(snap(),before);
world.environment.ice[i]=100;assert.equal(environmentContactFor(world,a).liquidSurface,false,'shared load-supporting ice suppresses liquid displacement');assert.equal(paint(),0);
world.environment.iceBroken[i]=1;assert.ok(paint()>0,'actual fractured surface exposes contact');
for(const flag of ['airborne','perched','underground']){a[flag]=true;assert.equal(paint(),0,flag);delete a[flag]}
a.diveDepth=.2;assert.equal(paint(),0,'submerged actor has no surface wake');delete a.diveDepth;
world.water[i]=0;world.water[i+1]=1;assert.equal(paint(),0,'adjacent water and drink intent do not assert mouth contact');
const frames=[];for(let dir=0;dir<8;dir++)for(let phase=0;phase<8;phase++){calls.length=0;drawWaterContact(ctx,{scale:2,dir,phase,moving:true});assert.ok(calls.length>0&&calls.length<=52);frames.push(JSON.stringify(calls))}assert.ok(new Set(frames).size>8,'direction and contact phase vary native contours');
console.log('Water contact art PASS: exposed/fractured liquid, supported ice, depth/traversal, no intent-only bank ring, finite eight-facing native geometry, read-only state. Synthetic contact fixtures are not gameplay acceptance.');
