import {AUTONOMOUS_POPULATIONS} from '../ecology/autonomous-founding.js';

// Prospective recognition policy. Founding records, reproduction, ancestry and
// the existing evolutionary tree retain their separate canonical ownership.
export const AUTONOMOUS_EVOLUTION=Object.freeze({policy:'autonomous-evolution/1'});
export const autonomousEvolutionEnabled=sim=>sim?.autonomousEvolutionRules===AUTONOMOUS_EVOLUTION.policy;
export function autonomousEvolutionPolicy(value){
  if(!value)return undefined;
  const policy=value===true?AUTONOMOUS_EVOLUTION.policy:value;
  if(policy!==AUTONOMOUS_EVOLUTION.policy)throw Error('Unknown autonomous evolution policy.');
  return policy;
}
export function validateAutonomousEvolutionPolicy(sim){
  const policy=sim.autonomousEvolutionRules;
  if(policy!==undefined&&policy!==AUTONOMOUS_EVOLUTION.policy)throw Error('Unknown autonomous evolution policy.');
  if(policy!==undefined&&sim.autonomousPopulationRules!==AUTONOMOUS_POPULATIONS.policy)
    throw Error('Autonomous evolution requires its recorded regional population policy.');
  for(const session of sim.planetaryTravel?.sessions||[])
    if(session.snapshot.core.autonomousEvolutionRules!==policy)
      throw Error('Inconsistent regional autonomous evolution policy.');
}
