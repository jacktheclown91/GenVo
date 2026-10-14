// Visual-only expression solver. Caller supplies authoritative signals and actual rig.
const compiledParts=new WeakSet();
export const SIGNALS=Object.freeze(['fear','curiosity','aggression','pain','fatigue','comfort','courtship','alertness']);
const clamp=(a,b,v)=>Math.max(a,Math.min(b,v));

export function validateExpressionParts(parts){
 if(!Array.isArray(parts))throw Error('Invalid parts');const seen=new Set();
 for(const part of parts){if(typeof part.id!=='string'||!part.id||seen.has(part.id)||!part.channels||typeof part.channels!=='object'||Array.isArray(part.channels))throw Error('Invalid part identity/channels');seen.add(part.id);
  for(const joint of Object.values(part.channels)){if(!joint||![joint.min,joint.max,joint.neutral,joint.maxSpeed].every(Number.isFinite)||joint.min>joint.neutral||joint.neutral>joint.max||joint.maxSpeed<0||(joint.actionValue!==undefined&&!Number.isFinite(joint.actionValue)))throw Error('Invalid joint limits');}
  if(part.responses!==undefined&&!Array.isArray(part.responses))throw Error('Invalid responses');
  for(const r of part.responses||[]){if(!r||!Object.hasOwn(part.channels,r.channel))throw Error('Unavailable response channel');if(!SIGNALS.includes(r.signal)||![r.target,r.gain,r.priority,r.attackSeconds,r.releaseSeconds].every(Number.isFinite)||r.gain<0||r.attackSeconds<0||r.releaseSeconds<0||!Array.isArray(r.actions)||!r.actions.every(a=>typeof a==='string'&&a))throw Error('Invalid response');}
 }
}
export function compileExpressionRig(parts,version){if(!Number.isInteger(version)||version<1)throw Error('Invalid rig version');validateExpressionParts(parts);const frozen=structuredClone(parts);function freeze(v){if(v&&typeof v==='object'){for(const x of Object.values(v))freeze(x);Object.freeze(v)}return v}const rig=freeze({version,parts:frozen});compiledParts.add(rig.parts);return rig;}

export function coordinateExpression({tick,dt,signals={},parts,action,previous={}}){
 if(!compiledParts.has(parts))validateExpressionParts(parts);if(typeof action!=='string'||!action)throw Error('Invalid action');for(const name of Object.keys(signals))if(!SIGNALS.includes(name))throw Error('Unknown signal');
 if(!Number.isInteger(tick)||tick<0||!Number.isFinite(dt)||dt<0)throw Error('Invalid simulation time');
 const levels={};for(const name of SIGNALS){const evidence=signals[name];if(evidence&&(!Number.isFinite(evidence.intensity)||evidence.intensity<0||evidence.intensity>1||typeof evidence.source!=='string'||!evidence.source||!Number.isInteger(evidence.tick)||evidence.tick>tick||evidence.tick<0))throw Error('Invalid signal evidence');levels[name]=evidence?.tick===tick?evidence.intensity:0;}
 const pose={},state={},seen=new Set();
 for(const part of parts){if(seen.has(part.id))throw Error('Duplicate part');seen.add(part.id);pose[part.id]={};state[part.id]={};
  for(const [channel,joint] of Object.entries(part.channels||{})){
   const {min,max,neutral,maxSpeed}=joint;if(![min,max,neutral,maxSpeed].every(Number.isFinite)||min>neutral||neutral>max||maxSpeed<0)throw Error('Invalid joint limits');
   let target=neutral;const responses=(part.responses||[]).filter(r=>r.channel===channel);
   let priority=-Infinity,weight=0,total=0;
   for(const r of responses){if(!SIGNALS.includes(r.signal)||![r.target,r.gain,r.priority,r.attackSeconds,r.releaseSeconds].every(Number.isFinite)||r.gain<0||r.attackSeconds<0||r.releaseSeconds<0||!Array.isArray(r.actions))throw Error('Invalid response');if(part.disabled||joint.locked||!r.actions.includes(action))continue;const w=levels[r.signal]*r.gain;if(w<=0)continue;if(r.priority>priority){priority=r.priority;weight=0;total=0}if(r.priority===priority){total+=clamp(min,max,r.target)*w;weight+=w;}}
   if(weight>0)target=neutral+(total/weight-neutral)*Math.min(1,weight);
   const old=previous[part.id]?.[channel]??neutral;if(!Number.isFinite(old))throw Error('Invalid previous pose');
   const active=responses.filter(r=>!part.disabled&&!joint.locked&&r.priority===priority&&r.actions.includes(action)&&levels[r.signal]*r.gain>0),seconds=active.length?Math.max(...active.map(r=>r.attackSeconds)):Math.max(0,...responses.map(r=>r.releaseSeconds));
   const blend=seconds>0?1-Math.exp(-dt/seconds):1,delta=clamp(-maxSpeed*dt,maxSpeed*dt,(target-clamp(min,max,old))*blend);
   const value=joint.locked?clamp(min,max,joint.actionValue??neutral):clamp(min,max,old+delta);pose[part.id][channel]=value;state[part.id][channel]=value;
  }
 }
 return {pose,state};
}
