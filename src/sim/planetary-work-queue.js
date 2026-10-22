// Browser admission only: canonical owners still execute every biological tick.
// Admit at most one task between rendered frames, including asynchronous storage.
export class PlanetaryWorkQueue{
 #jobs=new Map();#running=false;#scheduled=false;#epoch=0;
 constructor({schedule=job=>typeof requestIdleCallback==='function'?requestIdleCallback(job,{timeout:1000}):setTimeout(job,0),isCurrent=()=>true,onError=error=>console.warn('Planetary work:',error)}={}){
  this.schedule=schedule;this.isCurrent=isCurrent;this.onError=onError;
  this.stats={started:0,completed:0,failed:0,discarded:0};
 }
 get size(){return this.#jobs.size}
 get busy(){return this.#running||this.#scheduled}
 enqueue(key,target,run,{ready=()=>true}={}){
  // Repeated observations update an existing slot without moving it to the back.
  this.#jobs.set(key,{target,run,ready});
 }
 frame(){
  if(this.busy||!this.#jobs.size)return;
  const epoch=this.#epoch;this.#scheduled=true;
  this.schedule(async()=>{
   if(epoch!==this.#epoch)return;
   this.#scheduled=false;
   for(const [key,job] of this.#jobs){
    if(!this.isCurrent(job.target)){this.#jobs.delete(key);this.stats.discarded++;continue}
    if(!job.ready(job.target))continue;
    this.#jobs.delete(key);this.#running=true;this.stats.started++;
    try{await job.run(job.target);this.stats.completed++}
    catch(error){this.stats.failed++;this.onError(error)}
    finally{this.#running=false}
    break;
   }
   // The next rendered frame must explicitly admit the next operation.
  });
 }
 clear(){this.#epoch++;this.stats.discarded+=this.#jobs.size;this.#jobs.clear();this.#scheduled=false}
}
