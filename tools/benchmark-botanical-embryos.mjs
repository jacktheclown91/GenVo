// Measures queue housekeeping only, not live botanical reproduction,
// mature population density, world-level CPU, frame pacing, or memory.
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
const COUNT=20000;
const originals=Array.from({length:COUNT},(_,i)=>({id:i,createdEpoch:i%7===0?3:1}));
const oldQueue=source=>{
 const queue=source.slice(),completed=[];
 for(const embryo of [...queue]){
  if(embryo.createdEpoch>=2)continue;
  completed.push(embryo.id);
  queue.splice(queue.indexOf(embryo),1);
 }
 return {queue,completed};
};
const compactQueue=source=>{
 const queue=source.slice(),completed=[],initial=queue.length;
 let retained=0;
 for(let read=0;read<initial;read++){
  const embryo=queue[read];
  if(embryo.createdEpoch>=2){queue[retained++]=embryo;continue;}
  completed.push(embryo.id);
 }
 for(let read=initial;read<queue.length;read++)queue[retained++]=queue[read];
 queue.length=retained;
 return{queue,completed};
};
const rows={before:[],after:[]};
let expected;
for(const label of ['before','after','after','before']){
 const fn=label==='before'?oldQueue:compactQueue;
 const t=performance.now(),result=fn(originals),ms=performance.now()-t;
 if(!expected)expected=result;
 assert.deepEqual(result,expected,'ordered pending embryos and every processed ID match exactly');
 rows[label].push(ms);
}
const round=n=>Math.round(n*100)/100;
const average=a=>round(a.reduce((x,y)=>x+y,0)/a.length);
console.log(JSON.stringify({
 scope:'20,000 synthetic embryo identities; queue removal only, not biological outcomes',
 initial:COUNT,completed:expected.completed.length,retained:expected.queue.length,
 ms:{old:average(rows.before),new:average(rows.after)},
 samples:{old:rows.before.map(round),new:rows.after.map(round)},
 exactOrderAndIdentity:true
},null,2));
