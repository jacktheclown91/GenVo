// E14: coordinate authority for adjacent persistent 128x128 planetary regions.
// This is NOT a player teleport or a parallel world simulator. Every World owns
// one physical region's arrays; the Atlas only owns their identity and lifetime.
export const PLANET_REGION_SIZE=128;
export function planetRegionOrigin(value,{size=PLANET_REGION_SIZE}={}){
 if(!value||!Number.isSafeInteger(value.x)||!Number.isSafeInteger(value.y)||
    value.x%size!==0||value.y%size!==0||Math.abs(value.x)>100000||
    Math.abs(value.y)>100000)throw Error('Invalid aligned planetary region origin.');
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
   !Array.isArray(state.sessions)||state.sessions.length>16)throw Error('Invalid planetary travel archive.');
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
export class PlanetRegionAtlas{
 constructor(current,createWorld){
  if(!current?.planet||typeof createWorld!=='function')throw Error('Region atlas requires a planetary World factory.');
  this.seed=current.seed;this.planetId=current.planet.descriptor.planetId;
  this.createWorld=createWorld;this.regions=new Map();
  this.install(current);
 }
 install(world){
  if(world.seed!==this.seed||world.planet?.descriptor?.planetId!==this.planetId)
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
