// E14: coordinate authority for adjacent persistent 128x128 planetary regions.
// This is NOT a player teleport or a parallel world simulator. Every World owns
// one physical region's arrays; the Atlas only owns their identity and lifetime.
export const PLANET_REGION_SIZE=128;
export function planetRegionOrigin(value,{size=PLANET_REGION_SIZE}={}){
 if(!value||!Number.isSafeInteger(value.x)||!Number.isSafeInteger(value.y)||
    value.x%size!==0||value.y%size!==0||Math.abs(value.x)>1048576||
    Math.abs(value.y)>1048576)throw Error('Invalid aligned planetary region origin.');
 return Object.freeze({x:value.x||0,y:value.y||0});
}
export function regionKey({x,y}){return x+','+y}
export function neighboringRegion(region,direction){
 const r=planetRegionOrigin(region);
 const dx=direction==='east'?PLANET_REGION_SIZE:direction==='west'?-PLANET_REGION_SIZE:0;
 const dy=direction==='south'?PLANET_REGION_SIZE:direction==='north'?-PLANET_REGION_SIZE:0;
 if(!['north','south','east','west'].includes(direction))throw Error('Unknown planetary direction.');
 return planetRegionOrigin({x:r.x+dx,y:r.y+dy});
}
export function planetaryCell(world,localX,localY){
 if(!world?.planet||![localX,localY].every(Number.isFinite)||localX<0||localY<0||localX>=world.n||localY>=world.n)throw Error('Not a supported local planetary cell.');
 const r=planetRegionOrigin(world.regionOrigin);
 return{worldX:r.x+localX,worldY:r.y+localY,region:regionKey(r),localX,localY};
}
// Validate archived region sessions independently of the active world. Archives
// hold local fauna/controller snapshots, not a second live set of actors.
export function validatePlanetaryTravelState(state,activeKey=null){
 if(state===undefined)return;
 if(state?.schema!==1||!Number.isSafeInteger(state.nextId)||state.nextId<1||
   !Array.isArray(state.sessions)||state.sessions.length>25)throw Error('Invalid planetary travel archive.');
 const keys=new Set();
 for(const item of state.sessions){
  if(!item||typeof item.key!=='string'||!item.snapshot?.world?.regionOrigin||item.snapshot.world.generator!=='planetary/1')
   throw Error('Invalid planetary travel session.');
  const origin=planetRegionOrigin(item.snapshot.world.regionOrigin),key=regionKey(origin);
  if(item.key!==key||keys.has(key)||key===activeKey)throw Error('Duplicate or misplaced planetary travel session.');
  keys.add(key);
  if(item.snapshot.core?.planetaryTravel||item.snapshot.regionalWorlds)throw Error('Recursive planetary travel snapshot rejected.');
  if(item.snapshot.animals?.some(a=>a.player))throw Error('Traveler cannot remain inside archived population.');
 }
}
// World-local populations, including frozen regional sessions, must have one
// canonical owner per animal ID. An archived baby's ID must never be
// resurrected in the active family on save restoration.
export function validatePlanetAnimalOwnership(activeAnimals,travelState){
 if(!Array.isArray(activeAnimals))throw Error('Invalid active planetary creature collection.');
 const ids=new Set();
 function inspect(animals,label){
  if(!Array.isArray(animals))throw Error('Invalid '+label+' creature archive.');
  for(const animal of animals){
   if(!Number.isSafeInteger(animal?.id)||animal.id<1||ids.has(animal.id))
    throw Error('Duplicate or invalid planetary animal identity.');
   ids.add(animal.id);
  }
 }
 inspect(activeAnimals,'active');
 if(!travelState)return;
 validatePlanetaryTravelState(travelState);
 // Unloaded regions own the identities recorded in their committed headers.
 for(const entry of travelState.unloaded||[])for(const id of entry.life?.ids||[]){if(!Number.isSafeInteger(id)||id<1||ids.has(id))throw Error('Duplicate or invalid planetary animal identity.');ids.add(id)}
 for(const session of travelState.sessions){
  inspect(session.snapshot.animals,'regional');
  const holders=new Set(session.snapshot.animals.map(a=>a.id));
  const slots=session.snapshot.core?.regionalTravelerSlots;
  if(slots!==undefined){
   if(!Array.isArray(slots)||slots.length<2||slots.length>8)throw Error('Invalid cohort position archive.');
   const seen=new Set(),indexes=new Set();
   for(const slot of slots){
    if(!Number.isSafeInteger(slot?.id)||slot.id<1||holders.has(slot.id)||seen.has(slot.id)||
       !Number.isSafeInteger(slot.index)||slot.index<0||
       slot.index>session.snapshot.animals.length+slots.length-1||indexes.has(slot.index))
     throw Error('Duplicate or invalid cohort position archive.');
    seen.add(slot.id);indexes.add(slot.index);
   }
  }
  const slot=session.snapshot.core?.regionalTravelerSlot;
  if(slot!==undefined&&(!Number.isSafeInteger(slot)||slot<0||slot>session.snapshot.animals.length))
   throw Error('Invalid single traveler position archive.');
 }
}
export class PlanetRegionAtlas{
 constructor(current,createWorld){
  if(!current?.planet||typeof createWorld!=='function')throw Error('Region atlas requires a planetary World factory.');
  this.seed=current.seed;this.planetId=current.planet.descriptor.planetId;this.projection=current.planet.descriptor.projection;
  this.createWorld=createWorld;this.regions=new Map();
  this.install(current);
 }
 install(world){
  if(world.seed!==this.seed||world.planet?.descriptor?.planetId!==this.planetId||world.planet.descriptor.projection!==this.projection)
   throw Error('Cannot mix worlds from different planets.');
  const origin=planetRegionOrigin(world.regionOrigin),key=regionKey(origin);
  if(this.regions.has(key)&&this.regions.get(key)!==world)throw Error('Regional world already owns this physical territory.');
  if(!this.regions.has(key)&&this.regions.size>=17)throw Error('Too many simultaneously materialized planetary regions.');
  this.regions.set(key,world);return world;
 }
 get(origin,{create=false}={}){
  const r=planetRegionOrigin(origin),key=regionKey(r);
  if(this.regions.has(key))return this.regions.get(key);
  if(!create)return null;
  const world=this.createWorld(r);
  return this.install(world);
 }
 neighbor(from,direction,{create=false}={}){return this.get(neighboringRegion(from,direction),{create})}
 entries(){return [...this.regions].map(([key,world])=>({key,origin:world.regionOrigin,world}))}
}

// Departed travelers occupy remembered positions in the complete animal order.
// Removing earlier wildlife must shift those positions as well; births append
// after existing slots. Keep the exact mortality predicate used by Simulation.
export function compactRegionalTravelerPositions(sim){
 const cohort=sim.regionalTravelerSlots;
 const single=sim.regionalTravelerSlot;
 if(cohort===undefined&&single===undefined)return;
 const slots=cohort===undefined?[{index:single}]:[...cohort].sort((a,b)=>a.index-b.index);
 const shifts=new Map();
 for(let rank=0;rank<slots.length;rank++){
  const index=slots[rank].index,before=index-rank;
  if(!Number.isSafeInteger(index)||before<0||before>sim.animals.length)throw Error('Corrupt regional traveler position during mortality.');
  let removed=0;for(let i=0;i<before;i++)if(!sim.animals[i].alive&&!sim.animals[i].player)removed++;
  shifts.set(index,index-removed);
 }
 if(cohort!==undefined)sim.regionalTravelerSlots=cohort.map(s=>({...s,index:shifts.get(s.index)}));
 else sim.regionalTravelerSlot=shifts.get(single);
}
