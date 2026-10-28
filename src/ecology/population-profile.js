import {ENVIRONMENT_PRESSURES} from '../lineage/pressure.js';

// Borrowed, read-only profile construction for the existing pressure-memory
// authority. No population, environment, taxon or reproductive rule lives here.
const clamp01=value=>Math.max(0,Math.min(1,Number(value)||0));
export function pressureHistoryProfile(history){
  if(!history)return null;
  const axes=ENVIRONMENT_PRESSURES.map(def=>({id:def.id,label:def.label,
    mean:history.days?clamp01((history.exposure[def.id]||0)/history.days):0,
    recent:clamp01(history.recent[def.id]||0),peak:clamp01(history.peak[def.id]||0)}))
    .sort((a,b)=>b.mean-a.mean||a.id.localeCompare(b.id));
  return {...history,axes,dominant:axes[0]||null,secondary:axes[1]||null};
}

// Keep actual observations, never reconstruct a previous cumulative mean by
// subtracting today's pressure. Two completed days cover the normal regional
// barrier's one-day ordering difference. Missing/older observations stay unknown.
export function recordRegionalPressureObservation(history){
  const day=history.lastDay;
  if(!Number.isSafeInteger(day)||day<1||!Number.isSafeInteger(history.days)||history.days<1)
    throw Error('Invalid regional pressure observation day.');
  const previous=history.regionalObservations||[];
  if(previous.some(row=>row.day===day))return;
  const profile=pressureHistoryProfile(history),axes=profile.axes.map(axis=>({...axis}));
  const recorded={key:profile.key,days:profile.days,firstDay:profile.firstDay,lastDay:day,
    axes,dominant:axes[0]||null,secondary:axes[1]||null};
  history.regionalObservations=[...previous.slice(-1),{day,profile:recorded}];
}

export function regionalPressureObservation(history,day){
  if(!Number.isSafeInteger(day)||day<1)return null;
  const recorded=history?.regionalObservations?.find(row=>row.day===day);
  if(recorded)return structuredClone(recorded.profile);
  // The current cumulative record is itself an actual observation. Its absence
  // from an older optional buffer does not authorize inventing any past day.
  if(history?.lastDay!==day)return null;
  const profile=pressureHistoryProfile(history),axes=profile.axes.map(axis=>({...axis}));
  return {key:profile.key,days:profile.days,firstDay:profile.firstDay,lastDay:day,
    axes,dominant:axes[0]||null,secondary:axes[1]||null};
}

// Optional recorded observations are part of pressure memory, not an independent
// ecological authority. Reject corrupt evidence before a restored world can use it.
export function validateRegionalPressureObservations(history){
  const rows=history.regionalObservations;
  if(rows===undefined)return;
  const fail=()=>{throw Error('Invalid saved regional pressure observation.');};
  if(!Array.isArray(rows)||rows.length>2||
     ![history.days,history.firstDay,history.lastDay].every(value=>Number.isSafeInteger(value)&&value>=1)||
     history.lastDay<history.firstDay||history.days>history.lastDay-history.firstDay+1)fail();
  let previousDay=0,previousDays=0;
  for(const row of rows){
    const profile=row?.profile;
    if(!Number.isSafeInteger(row?.day)||row.day<=previousDay||row.day>history.lastDay||
       !profile||profile.key!==history.key||profile.lastDay!==row.day||
       profile.firstDay!==history.firstDay||!Number.isSafeInteger(profile.days)||
       profile.days<=previousDays||profile.days>history.days||profile.days>row.day-profile.firstDay+1||
       !Array.isArray(profile.axes)||profile.axes.length!==ENVIRONMENT_PRESSURES.length)fail();
    const seen=new Set();
    for(const axis of profile.axes){
      const definition=ENVIRONMENT_PRESSURES.find(item=>item.id===axis?.id);
      if(!definition||seen.has(axis.id)||axis.label!==definition.label||
         ['mean','recent','peak'].some(key=>!Number.isFinite(axis[key])||axis[key]<0||axis[key]>1))fail();
      seen.add(axis.id);
    }
    const sorted=[...profile.axes].sort((a,b)=>b.mean-a.mean||a.id.localeCompare(b.id));
    if(profile.axes.some((axis,index)=>axis!==sorted[index])||
       JSON.stringify(profile.dominant)!==JSON.stringify(profile.axes[0])||
       JSON.stringify(profile.secondary)!==JSON.stringify(profile.axes[1]))fail();
    if(row.day===history.lastDay){
      const actual=pressureHistoryProfile(history);
      if(profile.days!==history.days||JSON.stringify(profile.axes)!==JSON.stringify(actual.axes))fail();
    }
    previousDay=row.day;previousDays=profile.days;
  }
}
