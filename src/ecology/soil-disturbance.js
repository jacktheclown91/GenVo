// Local physical habitat memory, separate from food and nutrient inventories.
// Provisional rates: one completed dig contributes 0.2; disturbance fades over
// 60 simulation days from full strength without further work. No RNG is used.
export const SOIL_DISTURBANCE=Object.freeze({perDig:.2,recoveryDays:60});
export function disturbanceAt(records,cell,day){
 const record=records?.get(cell);if(!record)return 0;
 return Math.max(0,record.strength-Math.max(0,day-record.day)/SOIL_DISTURBANCE.recoveryDays);
}
export function recordSoilDig(records,cell,day,actorId){
 const strength=Math.min(1,disturbanceAt(records,cell,day)+SOIL_DISTURBANCE.perDig);
 records.set(cell,{strength,day,lastActorId:actorId});return strength;
}

// Retire recovered work once per ecological day, rather than permanently saving
// patches that have returned to undisturbed ground. Read-only queries between
// day boundaries still return zero after recovery; pruning changes no outcomes.
export function pruneRecoveredSoil(records,day){
 if(!(records instanceof Map))return 0;
 let removed=0;
 for(const [cell] of records)if(disturbanceAt(records,cell,day)<=0){records.delete(cell);removed++}
 return removed;
}
