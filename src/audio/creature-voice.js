import {acousticDimensions} from './movement-contact.js';
import {PARTS} from '../lineage/part-registry.js';
import {planPartCounts} from '../lineage/part-abilities.js';
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
// Authored acoustic interpretations, not anatomical effects or a vocal authority.
export function creatureVoiceProfile(animal){
  if(!animal?.alive)return null;
  const counts=planPartCounts(animal),actions=new Set();let mass=0,vocalMass=0;
  for(const [id,n] of Object.entries(counts)){
    const part=PARTS[id];if(!part||n<=0)continue;mass+=part.mass*n;
    if(!part.actionCapabilities.includes('call'))continue;
    vocalMass+=part.mass*n;for(const action of part.actionCapabilities)actions.add(action);
  }
  if(!actions.has('call'))return null;
  const dimensions=acousticDimensions(animal);
  const rough=actions.has('tear')||actions.has('swallow'),bright=actions.has('peck')||actions.has('nibble');
  const sample=rough?'stalker':bright?'hopper':actions.has('filter')||actions.has('suck')?'digger':'genvo-call';
  const rate=clamp(1.08/Math.pow(Math.max(.12,vocalMass)/.3,.16)*dimensions.pitch,.65,1.4);
  const [cutoff,center,q,boost]=rough?(actions.has('crush')?[2100,360,.8,1.8]:actions.has('swallow')?[2000,320,.7,1.7]:[3100,550,.65,1.4]):
    bright?(actions.has('crush')?[4800,1500,.7,1.2]:[6500,1900,.6,1.1]):sample==='digger'?[1400,260,.85,1.5]:[3600,700,.65,1.1];
  return{sample,rate,rough,bright,mass,vocalMass,
    cutoffHz:clamp(cutoff*dimensions.pitch,700,9000),resonanceHz:clamp(center*dimensions.pitch,150,3000),resonanceQ:q,resonanceDb:boost};
}
// Only sampled calls enter this small graph. Other effects/music keep their path.
export function voiceSamplePath(ctx,destination,profile){
  if(!profile)return{input:destination,dispose(){}};
  const lowpass=ctx.createBiquadFilter(),resonance=ctx.createBiquadFilter();
  lowpass.type='lowpass';lowpass.frequency.value=profile.cutoffHz;lowpass.Q.value=.5;
  resonance.type='peaking';resonance.frequency.value=profile.resonanceHz;resonance.Q.value=profile.resonanceQ;
  if(resonance.gain)resonance.gain.value=profile.resonanceDb;
  lowpass.connect(resonance);resonance.connect(destination);
  return{input:lowpass,dispose(){lowpass.disconnect?.();resonance.disconnect?.()}};
}
