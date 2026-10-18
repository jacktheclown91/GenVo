import {PARTS} from '../lineage/part-registry.js';
import {founderPlan} from '../lineage/body-inheritance.js';
// Renderer-only whole-body carriage while moving, read from the mounted anatomy itself:
// which leg types carry the body and how much registered part mass it carries. Species
// labels, speed, energy and simulation state are not read or changed. Part mass here is the
// registry's informational mass (also reported by resolvePhenotype); it has no physical effect.
const TAU=Math.PI*2;
const cache=new Map();
let founderMass=null;
const planMass=plan=>plan.nodes.reduce((s,n)=>s+(PARTS[n.partId]?.mass||0),0);
const clamp01=v=>Math.max(0,Math.min(1,v));

// PROVISIONAL visual build weight. This is the single input locomotion expression takes from
// "how much body" a creature carries. Today it reads the part registry's informational mass
// (reported by resolvePhenotype, applied to no physics). It is NOT the tissue volume/density
// model, whose coefficients await creator approval. When physical mass is adopted, replace
// this function's body with that authority and keep the 0..1 'relative' contract.
export function visualBuildWeight(animal){
 const plan=animal?.bodyPlan;if(!plan?.nodes)return{relative:0,source:'none'};
 founderMass??=planMass(founderPlan());
 return{relative:clamp01((planMass(plan)/founderMass-1)/.8),source:'registry-informational-mass (provisional)'};
}

export function locomotionStyle(animal){
 const plan=animal?.bodyPlan;if(!plan?.id)return null;
 let hit=cache.get(plan.id);if(hit)return hit;
 const legs=plan.nodes.filter(n=>/^root\/limb\.\d+$/.test(n.id)).map(n=>n.partId),share=id=>legs.length?legs.filter(x=>x===id).length/legs.length:0;
 const runner=share('runner-leg'),spring=share('spring-leg'),webbed=share('webbed-leg'),sturdy=share('sturdy-leg');
 const heavy=clamp01(visualBuildWeight(animal).relative+sturdy*.35);
 hit=Object.freeze({runner,spring,webbed,sturdy,heavy,
  bob:Math.max(.25,1+heavy*1.6-runner*.6),          // vertical travel per footfall
  thud:heavy,                                       // weight settles hard onto each stance
  twist:heavy*1.6+webbed*2,                        // head/tail swing to opposite sides (waddle)
  roll:heavy*.9+webbed*.7,                          // dorsal tissue rolls past the outline
  lean:runner*.55-heavy*.15,                        // forward carriage
  hop:spring*3.6});                                 // two-beat bound off spring tendons
 cache.set(plan.id,hit);if(cache.size>512)cache.delete(cache.keys().next().value);
 return hit;
}

// Offsets for one gait phase (0..8), relative to the renderer's existing walk bob (baseBob,
// sprite pixels, positive = lower). A plain walking body gets exactly that bob back.
// Weight transfer is articulation, not displacement: twist swings head end and tail end to
// opposite sides and roll carries dorsal tissue past the outline; the torso centre and the
// planted feet do not slide sideways.
export function locomotionOffsets(style,{phase=0,moving=false,action='move',baseBob=0,propulsion=1}={}){
 const still={rise:0,sway:0,lean:0,twist:0,roll:0};
 if(!moving)return still;
 if(!style)return{...still,rise:action==='swim'?0:-baseBob};
 const p=((Number(phase)%8)+8)%8,a=p/8*TAU;
 if(action==='swim'){
  // Strokes follow actual propulsion (movementProfile swim speed relative to the 0.66 base):
  // a stronger swimmer surges further on each beat and undulates more through the stroke.
  const power=Math.max(0,Math.min(1,(Number(propulsion)-1)/.45)),stroke=Math.max(0,Math.sin(a*2));
  return{rise:.4*stroke,sway:0,lean:(.3+.9*power)*stroke,twist:Math.sin(a)*(.5+1.3*power),roll:0};
 }
 const scale=Math.max(.3,1+style.heavy*.55-style.runner*.55);
 const thud=-style.thud*(.45+.9*Math.pow(Math.max(0,Math.cos(2*a)),4));  // rides low; weight drops onto each stance
 const bound=style.hop*(Math.pow(Math.abs(Math.sin(a)),2.2)-.2);          // airborne twice per cycle
 // Load shifts a quarter cycle after the bob, so on any heading it cannot cancel the bob.
 const shift=Math.cos(a-7*Math.PI/8),flee=action==='flee'?1.25:1; // measured quadrature with the BODY_BOB-based rise
 return{rise:(-baseBob*scale*(1-style.spring)+thud+bound)*flee,sway:0,lean:style.lean*flee,twist:shift*style.twist,roll:shift*style.roll};
}
