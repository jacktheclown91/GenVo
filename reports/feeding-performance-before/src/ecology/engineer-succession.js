// Passive regional residency study for creatures carrying FUNCTIONAL digging limbs.
// Sampled regional occupancy is not migration intent, local species extinction,
// sustained breeding, or proof that digging caused a vegetation change.
// All transitions come from real live IDs; no RNG, stocks, or target counts.
export const ENGINEER_SUCCESSION=Object.freeze({initialPresenceDays:2,emptyDays:5,returnDays:3,eventLimit:20});

export function observeEngineerSuccession(region, occupants, day, recentBirthIds=new Set()){
  const active=occupants.length;
  if(!region.engineerSuccession&&!active)return;
  const state=region.engineerSuccession??={lastSampleDay:null,everEstablished:false,presentSamples:0,emptySamples:0,vacancyOpen:false,vacantSince:null,pending:null,events:[],lastPresentDay:null};
  if(state.lastSampleDay===day)return;
  const consecutive=state.lastSampleDay===null||day===state.lastSampleDay+1;
  state.lastSampleDay=day;
  if(!consecutive){state.presentSamples=0;state.emptySamples=0;state.pending=null;}
  if(!active){
    state.presentSamples=0;state.pending=null;
    if(!state.everEstablished)return;
    state.emptySamples++;
    if(!state.vacancyOpen&&state.emptySamples>=ENGINEER_SUCCESSION.emptyDays){
      state.vacancyOpen=true;state.vacantSince=day-state.emptySamples+1;
      pushEvent(state,{type:'vacancy',day,firstEmptyDay:state.vacantSince,lastPresentDay:state.lastPresentDay});
    }
    return;
  }
  state.lastPresentDay=day;
  state.presentSamples++;
  if(state.presentSamples>=ENGINEER_SUCCESSION.initialPresenceDays)state.everEstablished=true;
  if(!state.vacancyOpen){state.emptySamples=0;return;}
  const previous=state.pending;
  let candidate=previous&&occupants.find(a=>a.id===previous.id);
  if(!candidate){
    // Prefer a directly observed border crossing. A birth observed within the
    // region is a distinct local replacement, not an immigrant.
    candidate=occupants.find(a=>a.from&&a.from!==region.key)||occupants.find(a=>recentBirthIds.has(a.id))||occupants[0];
    const source=recentBirthIds.has(candidate.id)?'birth':candidate.from&&candidate.from!==region.key?'observed-crossing':'unresolved';
    state.pending={id:candidate.id,species:candidate.species,generation:candidate.generation,source,from:source==='observed-crossing'?candidate.from:null,firstDay:day,days:1};
  }else state.pending.days++;
  if(state.pending.days>=ENGINEER_SUCCESSION.returnDays){
    const p=state.pending;
    pushEvent(state,{type:'reoccupation',day,firstObservedDay:p.firstDay,previousVacantSince:state.vacantSince,individualId:p.id,species:p.species,generation:p.generation,source:p.source,fromRegion:p.from,workSinceReturn:0});
    state.vacancyOpen=false;state.vacantSince=null;state.pending=null;state.emptySamples=0;
  }
}

function pushEvent(state,event){state.events.push(event);if(state.events.length>ENGINEER_SUCCESSION.eventLimit)state.events.splice(0,state.events.length-ENGINEER_SUCCESSION.eventLimit);}

export function noteEngineerWork(region,day){
  const events=region.engineerSuccession?.events;
  // Actual completed regional digging AFTER verified physical reoccupation.
  if(!events)return;
  const last=events.at(-1);
  // A subsequent confirmed vacancy closes the preceding reoccupation episode.
  // Digging years later must never be credited to an earlier return.
  if(last?.type==='reoccupation'&&day>=last.day)last.workSinceReturn++;
}

export function engineerSuccessionEvents(region){return(region?.engineerSuccession?.events||[]).map(e=>structuredClone(e));}
