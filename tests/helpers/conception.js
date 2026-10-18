// Founding reproductive genotypes make conception a genuine chance (rarely exactly 1). A fixture that
// needs a pregnancy gives a staged, accepted pair a few real attempts, resetting only the staged
// recovery timer between attempts. Compatibility, mate choice and conception rules are unchanged.
export function conceive(sim,a,b,{attempts=8}={}){
  const female=a.sex==='F'?a:b,court=sim.reproduction?.courtTargetId;
  for(let k=0;k<attempts;k++){
    if(sim.tryMate(a,b)&&female.pregnant)return true;
    if(female.pregnant)return true;
    a.reproCooldown=b.reproCooldown=0;a.target=b.target=null;if(court!=null)sim.reproduction.courtTargetId=court;
  }
  return !!female.pregnant;
}
