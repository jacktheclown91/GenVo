import assert from 'node:assert/strict';
import {RNG} from '../src/core/rng.js';

const rng=new RNG('GENVO8-LONG-RNG');
let reference=BigInt(rng.state);
const mask=0xffffffffn;
for(let draw=0;draw<6000000;draw++){
  reference=(reference+0x6d2b79f5n)&mask;
  let t=Number(reference);t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);
  const expected=((t^t>>>14)>>>0)/4294967296;
  const actual=rng.next();
  if(actual!==expected)assert.equal(actual,expected,`draw ${draw} must retain integer precision`);
  if(rng.state<0||rng.state>0xffffffff||!Number.isSafeInteger(rng.state))assert.fail('state escaped the uint32 domain');
}
const loaded=new RNG('ignored');loaded.state=rng.state>>>0;
for(let draw=0;draw<1000;draw++)assert.equal(loaded.next(),rng.next(),'saved RNG state continues the exact sequence');
console.log('six-million-draw RNG precision and reload sequence: PASS');
