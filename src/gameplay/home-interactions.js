// Ground command composition. Territory owns learned residence and planning;
// ShelterController owns every construction gate, debit and physical structure.
const statusAt=(actor,target,check)=>check.ok
  ?Math.hypot(actor.x-target.x,actor.y-target.y)<=.35
    ?{enabled:true,reason:'Build at this selected site using local plant material and energy.'}
    :{enabled:false,state:'approachable',reason:'Move to the selected site to build.'}
  :{enabled:false,state:'unavailable',reason:check.reason};
export function homeInteractions(sim,target){
  if(!['ground','snow'].includes(target?.kind)||target.ambient||target.cave!==undefined)return[];
  const actor=sim.player(),access=sim.territory.homeSiteAvailability(actor,target);
  if(!access.enabled)return[];
  const at={...target,kind:'ground',x:access.x,y:access.y,i:access.i,homeSeed:access.homeSeed,homeRegion:access.homeRegion};
  const warning=sim.isOpeningProtected(actor)?' Building ends your protected opening.':'';
  const out=[{id:'mark-home-site',label:'Mark Home Site',target:at,
    enabled:true,reason:'Plan to live here. Marking does not grant territory, materials or shelter.'}];
  const build=sim.shelter.canBuildAt(actor,at),state=sim.territory.states.get(actor.id);
  const nearlyReady=state?.established&&state.home&&
    Math.hypot(at.x-state.home.x,at.y-state.home.y)<=sim.territory.coreRadius(actor)&&
    /material|energy/i.test(build.reason||'');
  if(build.ok||nearlyReady){const status=statusAt(actor,at,build);
    out.push({id:'build-shelter',label:'Build Shelter',target:at,...status,reason:status.reason+warning});}
  if(sim.shelter.activeShelters().length&&sim.expansion?.snapshot?.().nestUnlocked){
    const nest=sim.shelter.canEstablishNestAt(at);
    if(nest.ok)out.push({id:'establish-home-nest',label:'Establish Nest',target:at,
      ...statusAt(actor,at,nest),reason:'Establish a satellite family nest, not an egg clutch. Workers pay actual materials.'+warning});
  }
  return out;
}
export function executeHomeInteraction(sim,actor,target,id){
  if(id==='mark-home-site'){
    const result=sim.territory.markHomeSite(actor,target);
    return{...result,type:'home-site',message:result.message||result.reason};
  }
  // Satellite projects use their own expansion checks, never family-build gates.
  const access=sim.territory.homeSiteAvailability(actor,target);
  if(!access.enabled||Math.hypot(actor.x-target.x,actor.y-target.y)>.35)
    return{ok:false,type:'shelter',message:access.reason||'Move closer to the selected site.'};
  if(id==='establish-home-nest'){
    const result=sim.shelter.beginNestProject(target,'player-ground');
    return{...result,type:'shelter',message:result.ok?'Satellite nest project started. Family workers must build it.':result.reason};
  }
  const check=sim.shelter.canBuildAt(actor,target,{requirePresence:true});
  if(!check.ok)return{ok:false,type:'shelter',message:check.reason};
  const result=sim.shelter.constructAt(actor,target);
  if(result.ok)sim.endOpeningGrace?.('first shelter built');
  return{...result,type:'shelter',message:result.ok?'Family shelter built at the selected site.':result.reason};
}

export function homeInteractionStatus(sim,target,id){
  const actor=sim.player();
  if(sim.paused)return{enabled:false,state:'unavailable',reason:'Resume the world first.'};
  const access=sim.territory.homeSiteAvailability(actor,target);
  if(!access.enabled)return{enabled:false,state:'unavailable',reason:access.reason,reasonCode:access.reasonCode};
  if(id==='mark-home-site')return{enabled:true,reason:access.reason};
  const check=id==='establish-home-nest'?sim.shelter.canEstablishNestAt(target):sim.shelter.canBuildAt(actor,target);
  return statusAt(actor,target,check);
}
