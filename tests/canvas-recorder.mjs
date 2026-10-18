import assert from 'node:assert/strict';
import {CanvasRecorder} from '../src/render/canvas-recorder.js';

// Phase 3L: the creature pass records page-context operations and replays them in order. A fake context logs
// every call and property write so the replayed sequence can be compared with drawing directly.
function fakeContext(){const log=[];const state={globalAlpha:1,fillStyle:'#000',lineWidth:1};const stack=[];
  const ctx={canvas:{width:640,height:480},log,
    save(){stack.push({...state});log.push(['save'])},restore(){Object.assign(state,stack.pop()||{});log.push(['restore'])},
    translate(...a){log.push(['translate',...a])},fillRect(...a){log.push(['fillRect',...a])},drawImage(...a){log.push(['drawImage',...a])},
    beginPath(){log.push(['beginPath'])},arc(...a){log.push(['arc',...a])},stroke(){log.push(['stroke'])},setLineDash(a){log.push(['setLineDash',[...a]])},
    getTransform(){log.push(['getTransform']);return{a:1}},createLinearGradient(...a){return{gradient:a}},measureText(t){log.push(['measureText',t]);return{width:t.length}}};
  return new Proxy(ctx,{get:(t,p)=>p in state?state[p]:t[p],set:(t,p,v)=>{state[p]=v;log.push(['=',p,v]);return true}})}
// The same drawing routine, run directly and through the recorder.
function draw(c){c.save();c.globalAlpha*=.5;c.fillStyle='#abc';c.translate(10,20);c.fillRect(0,0,4,4);c.drawImage('img',-2,-2);c.setLineDash([2,1]);c.beginPath();c.arc(1,2,3,0,6);c.stroke();c.restore();c.globalAlpha=c.globalAlpha*.25;c.fillRect(1,1,1,1)}
const direct=fakeContext();draw(direct);
const real=fakeContext(),rec=new CanvasRecorder(),proxy=rec.begin(real);draw(proxy);
assert.equal(real.log.length,0,'nothing reaches the page context while recording');
rec.flush();assert.deepEqual(real.log,direct.log,'replay issues exactly the same sequence as drawing directly');
// Reads come from the shadow state, through save/restore, without flushing.
{const r=fakeContext(),k=new CanvasRecorder(),c=k.begin(r);c.globalAlpha=.4;c.save();c.globalAlpha=.1;assert.equal(c.globalAlpha,.1);c.restore();assert.equal(c.globalAlpha,.4,'restore brings back the saved state');assert.equal(k.stats.flushes,0);assert.equal(r.log.length,0)}
// Any other read replays the pending work first, so its answer is exact.
{const r=fakeContext(),k=new CanvasRecorder(),c=k.begin(r);c.translate(5,5);c.getTransform();assert.deepEqual(r.log.map(x=>x[0]),['translate','getTransform'],'a transform read flushes pending work first');assert.equal(k.stats.flushes,1)}
// Gradient creation neither draws nor depends on drawing state: passed through without flushing.
{const r=fakeContext(),k=new CanvasRecorder(),c=k.begin(r);c.fillRect(0,0,1,1);const g=c.createLinearGradient(0,0,1,1);assert.deepEqual(g.gradient,[0,0,1,1]);assert.equal(k.stats.flushes,0);assert.equal(r.log.length,0)}
// Hooks run around each flush (the sprite staging composes outlines before the replay).
{const r=fakeContext(),k=new CanvasRecorder(),c=k.begin(r),order=[];k.onFlush=()=>order.push('before:'+r.log.length);k.afterFlush=()=>order.push('after:'+r.log.length);c.fillRect(0,0,1,1);k.flush();assert.deepEqual(order,['before:0','after:1'])}
// Line-dash arrays are copied at record time (later mutation of the caller's array cannot change the replay).
{const r=fakeContext(),k=new CanvasRecorder(),c=k.begin(r),dash=[4,2];c.setLineDash(dash);dash[0]=99;k.flush();assert.deepEqual(r.log[0],['setLineDash',[4,2]])}
console.log('canvas recorder: ordered replay, shadow state, exact reads, pass-through, hooks: PASS');
