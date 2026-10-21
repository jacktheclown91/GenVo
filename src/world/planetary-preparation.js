// Bounded, never-stepped destination scaffolds. They become real local owners
// only through canonical travel; no fauna is spawned or ecology advanced here.
import {neighboringRegion,regionKey} from './planet-regions.js';
import {preparePlanetaryDestination,planetaryPreparationKey} from './planetary-travel.js';
export class PlanetaryPreparation{
 #entries=new Map();#queue=[];#scheduled=false;#closed=false;
 constructor({schedule=job=>typeof requestIdleCallback==='function'?requestIdleCallback(job,{timeout:800}):setTimeout(job,0),capacity=4}={}){
  if(!Number.isSafeInteger(capacity)||capacity<1||capacity>4)throw Error('Invalid nearby preparation working set.');
  this.schedule=schedule;this.capacity=capacity;this.stats={generated:0,consumed:0,discarded:0,failed:0};
 }
 get size(){return this.#entries.size}
 has(sim,origin){return this.#entries.get(planetaryPreparationKey(sim,origin))?.state==='ready'}
 request(sim,origin){
  if(this.#closed)return Promise.reject(Error('Planetary preparation is closed.'));
  const key=planetaryPreparationKey(sim,origin),found=this.#entries.get(key);if(found)return found.promise;
  while(this.#entries.size>=this.capacity){const oldest=this.#entries.keys().next().value,entry=this.#entries.get(oldest);this.#entries.delete(oldest);entry.cancelled=true;entry.sim=null;entry.resolve(false);this.stats.discarded++;}
  let resolve;const promise=new Promise(r=>{resolve=r}),entry={key,sim,origin,state:'queued',promise,resolve,cancelled:false};this.#entries.set(key,entry);this.#queue.push(entry);this.#admit();return promise;
 }
 #admit(){
  if(this.#scheduled||this.#closed||!this.#queue.length)return;this.#scheduled=true;
  this.schedule(()=>{this.#scheduled=false;const entry=this.#queue.shift();
   if(entry&&!entry.cancelled&&!this.#closed){try{entry.destination=preparePlanetaryDestination(entry.sim,entry.origin);entry.state='ready';entry.sim=null;this.stats.generated++;entry.resolve(true)}catch(error){entry.state='failed';entry.error=String(error?.message||error);entry.sim=null;this.stats.failed++;entry.resolve(false)}}
   this.#admit();
  });
 }
 take(sim,origin){
  const key=planetaryPreparationKey(sim,origin),entry=this.#entries.get(key);if(entry?.state!=='ready')return null;
  this.#entries.delete(key);this.stats.consumed++;return entry.destination;
 }
 observe(sim,{distance=24}={}){
  const p=sim?.player?.();if(this.#closed||!p?.alive||!sim.planetaryRegions||sim.world.generator!=='planetary/1')return;
  const visited=new Set((sim.planetaryTravel?.sessions||[]).map(s=>s.key));
  const candidates=[['west',p.x-1.5],['east',sim.world.n-1.5-p.x],['north',p.y-1.5],['south',sim.world.n-1.5-p.y]].filter(([,d])=>d>=0&&d<=distance).sort((a,b)=>a[1]-b[1]);
  for(const [direction] of candidates.slice(0,2)){try{const origin=neighboringRegion(sim.world.regionOrigin,direction);if(!visited.has(regionKey(origin))&&!sim.planetaryRegions.get(origin,{create:false}))this.request(sim,origin)}catch{/* Finite projection refusal remains owned by travel availability. */}}
 }
 clear(){for(const e of this.#entries.values()){e.cancelled=true;e.sim=null;e.resolve(false)}this.#entries.clear();this.#queue=[];}
 close(){this.clear();this.#closed=true}
}
