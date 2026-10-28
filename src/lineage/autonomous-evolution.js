import {AUTONOMOUS_POPULATIONS} from '../ecology/autonomous-founding.js';

// Prospective recognition policy. Founding records, reproduction, ancestry and
// the existing evolutionary tree retain their separate canonical ownership.
// /4 resolves recorded related populations in other regions; /3 records the
// aligned pressure observations both rely on; /2 carries regional history.
export const AUTONOMOUS_EVOLUTION=Object.freeze({policy:'autonomous-evolution/4',observed:'autonomous-evolution/3',regional:'autonomous-evolution/2',legacy:'autonomous-evolution/1'});
const supportedPolicy=policy=>policy===AUTONOMOUS_EVOLUTION.policy||policy===AUTONOMOUS_EVOLUTION.observed||policy===AUTONOMOUS_EVOLUTION.regional||policy===AUTONOMOUS_EVOLUTION.legacy;
export const autonomousEvolutionEnabled=sim=>supportedPolicy(sim?.autonomousEvolutionRules);
export const regionalEvolutionPolicy=policy=>policy===AUTONOMOUS_EVOLUTION.policy||policy===AUTONOMOUS_EVOLUTION.observed||policy===AUTONOMOUS_EVOLUTION.regional;
export const regionalEvolutionEnabled=sim=>regionalEvolutionPolicy(sim?.autonomousEvolutionRules);
export const regionalReferenceEvolutionEnabled=sim=>sim?.autonomousEvolutionRules===AUTONOMOUS_EVOLUTION.policy||sim?.autonomousEvolutionRules===AUTONOMOUS_EVOLUTION.observed;
export const crossRegionalReferenceEnabled=sim=>sim?.autonomousEvolutionRules===AUTONOMOUS_EVOLUTION.policy;
export function autonomousEvolutionPolicy(value){
  if(!value)return undefined;
  const policy=value===true?AUTONOMOUS_EVOLUTION.policy:value;
  if(!supportedPolicy(policy))throw Error('Unknown autonomous evolution policy.');
  return policy;
}
export function validateAutonomousEvolutionPolicy(sim){
  const policy=sim.autonomousEvolutionRules;
  if(policy!==undefined&&!supportedPolicy(policy))throw Error('Unknown autonomous evolution policy.');
  if(policy!==undefined&&sim.autonomousPopulationRules!==AUTONOMOUS_POPULATIONS.policy)
    throw Error('Autonomous evolution requires its recorded regional population policy.');
  for(const session of sim.planetaryTravel?.sessions||[])
    if(session.snapshot.core.autonomousEvolutionRules!==policy)
      throw Error('Inconsistent regional autonomous evolution policy.');
}
