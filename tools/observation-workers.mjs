import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
export async function runObservationWorkers(script,seeds,{workers=5}={}){
 assert.ok(Number.isSafeInteger(workers)&&workers>0,'worker count must be a positive integer');let next=0;
 const results=[];
 async function worker(){while(next<seeds.length){const seed=seeds[next++];await new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,[script,seed],{stdio:['ignore','pipe','pipe'],windowsHide:true});let tail='',partial='',receipt=null;
  child.stdout.on('data',data=>{partial+=data;let at;while((at=partial.indexOf('\n'))>=0){const line=partial.slice(0,at);partial=partial.slice(at+1);console.log(line);if(line.startsWith('SOAK '))receipt=JSON.parse(line.slice(5))}});
  child.stderr.on('data',data=>{tail=(tail+data).slice(-8000);process.stderr.write(data)});
  child.once('error',reject);child.once('close',code=>{if(code!==0||!receipt)return reject(new Error(seed+': observation worker failed ('+code+') '+tail));results.push(receipt);resolve()});
 })}}
 await Promise.all(Array.from({length:Math.min(workers,seeds.length)},worker));return results.sort((a,b)=>a.seed.localeCompare(b.seed));
}
