// Read-only aerial presentation. Real airborne/mode transitions own activation;
// this clock never grants flight, spends energy or changes altitude/navigation.
// Unwrapped visual cycle shared with wing audio; no biological clock is advanced.
export const aerialCycle=(id,time)=>time/.11+(id%17)*.47;
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function aerialPose({mode='fly',phase=0,age=1,fromDeployment=1,fromGlide=0}={}){
  const p=(((phase%8)+8)%8)/8;
  if(mode==='land'){
    const t=Math.max(0,Math.min(1,age/.26)),release=1-smooth(t);
    return{landing:true,phase,wingFrame:1,glideSpread:fromGlide*release,flightSpread:fromDeployment*release,wingSweep:-.12*release,
      aerialTuck:1-smooth(age/.18),bodyDrop:.9*Math.sin(Math.PI*t),bodyRise:0,bodyLean:0};
  }
  if(mode==='glide')return{landing:false,phase,wingFrame:0,glideSpread:1,flightSpread:1,wingSweep:-.055,aerialTuck:.86,bodyDrop:0,bodyRise:0,bodyLean:.38};
  // Fast broad power stroke, longer folded recovery; phase closes smoothly.
  const stroke=p<.42?p/.42:1-(p-.42)/.58,open=smooth(stroke),entry=smooth(age/.18);
  return{landing:false,phase,wingFrame:open>.5?0:1,glideSpread:0,flightSpread:(.22+.78*open)*entry,
    wingSweep:Math.sin(p*Math.PI*2)*.22*entry,aerialTuck:entry,
    bodyRise:.28*(1-open)*entry,bodyDrop:0,bodyLean:.22*entry};
}

export class AerialPresentation{
  constructor({maxStates=512}={}){this.states=new Map();this.world=null;this.maxStates=maxStates;}
  sample(sim,animal,time=0){
    if(this.world!==sim.world){this.states.clear();this.world=sim.world;}
    const id=animal.id,eligible=animal.alive!==false&&!animal.perched&&!animal.underground&&!animal.climb&&!animal.caveTransit&&!animal.burrowWork;
    const mode=eligible&&animal.airborne?(animal.aerialMode==='glide'?'glide':animal.aerialMode?null:'fly'):'ground';
    let state=this.states.get(id);
    if(!eligible||mode===null){this.states.delete(id);return null;}
    if(!state){
      if(this.states.size>=this.maxStates)this.states.delete(this.states.keys().next().value);
      state={mode,changed:time-1,seen:time,anatomy:animal.bodyPlan?.id};this.states.set(id,state);
    }
    if(state.anatomy!==animal.bodyPlan?.id||time<state.seen||time-state.seen>1){state.mode=mode;state.changed=time-1;state.last=null;state.anatomy=animal.bodyPlan?.id;}
    state.seen=time;this.states.delete(id);this.states.set(id,state);
    if(mode!==state.mode&&!(mode==='ground'&&state.mode==='land')){
      const landed=mode==='ground'&&['fly','glide'].includes(state.mode);
      state.mode=landed?'land':mode;state.changed=time;state.fromDeployment=state.last?.flightSpread??1;state.fromGlide=state.last?.glideSpread??0;
    }
    if(state.mode==='ground')return null;
    if(state.mode==='land'&&time-state.changed>=.26){state.mode='ground';state.last=null;return null;}
    const phase=aerialCycle(id,time)%8;
    state.last=aerialPose({mode:state.mode,phase,age:time-state.changed,fromDeployment:state.fromDeployment,fromGlide:state.fromGlide});return state.last;
  }
  prune(time){for(const [id,state] of this.states)if(time-state.seen>2.5)this.states.delete(id);}
}

export function applyAerialPose(behavior,aerial){
  if(!aerial)return;
  behavior.glideSpread=aerial.glideSpread;behavior.wingFrame=aerial.wingFrame;behavior.flightSpread=aerial.flightSpread;behavior.wingSweep=aerial.wingSweep;behavior.aerialTuck=aerial.aerialTuck;
  behavior.bodyDrop+=aerial.bodyDrop;behavior.bodyRise+=aerial.bodyRise;behavior.bodyLean+=aerial.bodyLean;
}
