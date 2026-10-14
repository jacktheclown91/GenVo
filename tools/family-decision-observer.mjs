// Passive accounting of decisions actually selected; no controller probes or RNG.
export function observeFamilyDecisions(sim){
 const records=new Map(),original=sim.phaseDecision;
 sim.phaseDecision=function(...args){const result=original.apply(this,args);for(const a of this.animals){if(!a.alive||!a.lineage)continue;let r=records.get(a.id);if(!r){r={id:a.id,parentIds:[...a.parentIds],decisions:0,intents:{},migrationStates:{},migrationPreemptions:{},minX:a.x,maxX:a.x,minY:a.y,maxY:a.y};records.set(a.id,r)}r.decisions++;r.intents[a.intent]=(r.intents[a.intent]||0)+1;r.minX=Math.min(r.minX,a.x);r.maxX=Math.max(r.maxX,a.x);r.minY=Math.min(r.minY,a.y);r.maxY=Math.max(r.maxY,a.y);const st=this.migration.states.get(a.id),status=st?.status||'unobserved';r.migrationStates[status]=(r.migrationStates[status]||0)+1;if(st?.target&&status!=='settled'&&!['migrate','migration-return'].includes(a.intent))r.migrationPreemptions[a.intent]=(r.migrationPreemptions[a.intent]||0)+1;}return result;};
 return{records,detach(){sim.phaseDecision=original}};
}
