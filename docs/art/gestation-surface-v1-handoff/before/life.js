import {SPECIES} from '../organisms/species.js';
import {COLD_BEHAVIOR} from '../ecology/cold-wildlife.js';

const BREATH=[0,0,1,1,1,0,0,-1];
const STEP=[-1,0,1,2,1,0,-1,-2];

export function visualLifeState(sim,a,{frame=0,moving=false,action='idle',development=null,social=null,timeSeconds=null}={}){
  const spec=SPECIES[a.species];
  const energy=spec?.maxEnergy?clamp01(a.energy/spec.maxEnergy):1;
  const hydration=spec?.maxHydration?clamp01(a.hydration/spec.maxHydration):1;
  const health=clamp01((a.health??100)/100);
  const tick=sim?.tickCount??0;
  const blinkPeriod=29+((a.id*7)%17); // 3.6–5.6 simulated seconds at the canonical 8 Hz.
  const blinkTick=(tick+a.id*11)%blinkPeriod;
  const injury=sim?.injury?.enabled?.(a)?a.injuryCare:null,exhausted=energy<.23, thirsty=hydration<.26, hurt=health<.5,injured=!!injury?.active,sick=!!a.infected,recovering=!!(a.player&&!a.infected&&sim?.illness?.convalescent?.(a));
  const strained=exhausted||thirsty||hurt||injured||sick;
  const dependent=development?.stage==='newborn'||development?.stage==='juvenile';
  const calmAction=['idle','social','guard','listen','scan','rest'].includes(action);
  const dormant=!!(a.alive&&a.torpor&&!moving&&action==='rest'&&!a.airborne&&!a.perched&&!a.underground&&!a.climb&&!a.burrowWork&&!a.caveTransit&&!a.bracing&&!a.attackAction&&!a.courtshipPerformance);
  // This is a visual cadence, not another respiration or metabolism authority.
  const timed=Number.isFinite(timeSeconds),metabolic=Math.max(.72,Math.min(1.28,a.genes?.metabolism||1)),period=(3.1+(a.id%11)*.13)/(metabolic*(strained?1.35:1)*(dormant?COLD_BEHAVIOR.energyRate:1)),t=timed?Math.max(0,timeSeconds)+a.id*.731:0,phase=timed?(t/period)%1:0;
  const segment=phase<.4?phase/.4:(1-phase)/.6,ease=segment*segment*(3-2*segment);
  const blinkPhase=timed?(t%(blinkPeriod/8)):0;
  const blink=dormant||(timed?blinkPhase<.15:blinkTick===0||(!moving&&calmAction&&blinkTick===1));
  const breath=(dormant?.28:1)*(timed?ease:strained?BREATH[(frame+2)&7]:BREATH[frame&7]);
  const restPeriod=7+(a.id%5)*.6,restTime=(t+a.id*.137)%restPeriod,settle=!dormant&&timed&&!moving&&calmAction&&!strained&&restTime<.85?Math.sin(Math.PI*restTime/.85)**2:0,settleIndex=dormant?0:Math.floor((t+a.id*.137)/restPeriod)+a.id;
  const lean=action==='flee'?2:action==='stalk'||action==='hunt'?1:action==='court'?-1:0;
  const gaze=action==='eat'||action==='drink'?1:action==='flee'||social?.alarm?2:0;
  const legWave=STEP[frame&7];
  return {growth:development?.growth??1,energy,hydration,health,exhausted,thirsty,hurt,injured,injuryLevel:injured?injury.level:'none',sick,recovering,strained,dependent,dormant,blink,breath,settle,settleIndex,lean,gaze,legWave};
}

export function playerMoodLabel(sim,a){
  if(!a)return'';
  const spec=SPECIES[a.species];if(!spec)return'';
  const water=a.hydration/spec.maxHydration,energy=a.energy/spec.maxEnergy,health=(a.health??100)/100;
  if(a.infected)return'Unwell';
  const injury=sim?.injury?.enabled?.(a)?a.injuryCare:null;if(injury?.active)return injury.level==='severe'?'Badly wounded':'Wounded';
  if(health<.45)return'Hurt';
  if(water<.28)return'Thirsty';
  if(energy<.28)return'Hungry';
  if(a.intent==='escape'||a.intent==='group-alarm')return'Alarmed';
  if(a.intent==='wary')return'Wary';
  if(a.intent==='mate')return'Courting';
  if(a.intent==='guard')return'Protective';
  if(a.intent==='social'||a.intent==='group'||a.intent==='follow')return'With family';
  if(sim?.family?.livingChildren?.(a)?.length)return'Parent';
  return'Alert';
}

function clamp01(v){return Math.max(0,Math.min(1,Number.isFinite(v)?v:0))}
