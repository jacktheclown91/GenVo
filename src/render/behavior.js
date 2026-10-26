// Shared renderer-only action/body-language interpretation.
// This module never changes simulation intent, targets, movement, RNG, ecology, or saves.
import {CFG} from '../sim/config.js';
import {careVisualAction} from './care-expression.js';
const TAU=Math.PI*2;

export function behaviorVisualState({bodyPlan=null,id=0,action='idle',phase=0,moving=false,life={},social=null}={}){
  phase=wrap8(phase);
  const wave=Math.sin(phase/8*TAU),beat=(1+Math.sin((phase+.75)/8*TAU))/2;
  const state={
    action,phase,moving,wave,beat,
    bodyDrop:0,bodyRise:0,bodyLean:0,stanceSpread:0,compress:0,
    feelerForward:1,feelerSweep:0,feelerPin:0,headDrop:0,
    eyeWide:false,eyeNarrow:false,mouthPulse:0,
    limp:0,limpSide:(id&1)?1:-1,recoil:0,
    attention:'forward',groundEmphasis:0,relaxed:false
  };

  if(action==='flee'){
    Object.assign(state,{bodyLean:1.15,bodyDrop:.15,stanceSpread:.85,compress:.16,feelerForward:.56,feelerPin:.9,eyeWide:true,attention:'threat',groundEmphasis:.8});
  }else if(action==='stalk'||action==='hunt'){
    Object.assign(state,{bodyLean:.65,bodyDrop:.8,stanceSpread:.5,compress:.1,feelerForward:1.32,eyeNarrow:action==='stalk',mouthPulse:action==='hunt'?beat:0,attention:'target',groundEmphasis:.55});
  }else if(action==='jump'){
    Object.assign(state,{bodyLean:.5,stanceSpread:.35,forelegLift:.9,compress:.12,groundEmphasis:0});
  }else if(action==='land'){
    Object.assign(state,{bodyDrop:.85,stanceSpread:.75,compress:.22,groundEmphasis:1});
  }else if(action==='glide'){
    Object.assign(state,{glideSpread:1,flightSpread:1,bodyLean:.55,stanceSpread:.65,bodyDrop:.12,groundEmphasis:0});
  }else if(action==='fly'){
    Object.assign(state,{flightSpread:.8+.2*beat,bodyLean:.2,stanceSpread:.1,groundEmphasis:0});
  }else if(action==='swim'){
    Object.assign(state,{bodyDrop:.42,stanceSpread:1.18,compress:.18,feelerForward:.92,feelerPin:.18,eyeWide:false,attention:'forward',groundEmphasis:0});
  }else if(action==='seek-water'){
    Object.assign(state,{bodyLean:.3,bodyDrop:.55,headDrop:.85,feelerForward:1.36,feelerSweep:.35,attention:'ground'});
  }else if(action==='forage'){
    Object.assign(state,{bodyLean:.18,bodyDrop:.38,headDrop:.55,feelerForward:1.15,feelerSweep:1.0,attention:'ground'});
  }else if(action==='eat'){
    // Between actual bites (whose receipts drive feeding-expression.js) the head keeps a grazing
    // rhythm: dip, chew, lift a little to look about.
    Object.assign(state,{bodyDrop:.8+.2*beat,headDrop:.6+.65*beat,stanceSpread:.18,compress:.16,feelerForward:.78,feelerSweep:.15+.25*(1-beat),mouthPulse:beat,attention:'ground',groundEmphasis:.45});
  }else if(action==='crack'){
    Object.assign(state,{bodyDrop:.98,headDrop:1.1,stanceSpread:.42,compress:.2,feelerForward:.7,mouthPulse:Math.pow(beat,2)*1.4,eyeNarrow:true,attention:'ground',groundEmphasis:.6});
  }else if(action==='drink'){
    // Lapping: the head dips to the water on each beat.
    Object.assign(state,{bodyDrop:1.08+.12*beat,headDrop:.95+.45*beat,headReach:.2*beat,stanceSpread:.12,compress:.12,feelerForward:.72,mouthPulse:.65+.35*beat,attention:'ground',groundEmphasis:.55});
  }else if(action==='approach'){
    Object.assign(state,{bodyRise:.18,bodyLean:.12,stanceSpread:.18,feelerForward:1.24,feelerSweep:.25,eyeWide:beat>.78,attention:'mate'});
  }else if(action==='court'){
    // Between performed courtship moves the suitor keeps a display bob and sway.
    Object.assign(state,{bodyRise:.3+.35*beat,bodySway:.5*wave,stanceSpread:.35,compress:-.08,feelerForward:1.32,feelerSweep:.65,eyeWide:true,mouthPulse:.15,attention:'mate'});
  }else if(action==='nurse'){
    Object.assign(state,{bodyDrop:.52,stanceSpread:.7,compress:.06,bodyLean:-.12,headDrop:.4,feelerForward:.72,relaxed:true,attention:'offspring'});
  }else if(action==='suckle'){
    Object.assign(state,{bodyDrop:.36,headDrop:.7,headReach:.25+beat*.18,mouthPulse:.2+beat*.25,stanceSpread:.24,feelerForward:.7,relaxed:true,attention:'caregiver'});
  }else if(action==='lay-settle'){
    Object.assign(state,{bodyDrop:.5+beat*.22,stanceSpread:.8,compress:.16,headDrop:.24,bodyLean:-.3,feelerForward:.78,attention:'ground',groundEmphasis:.3});
  }else if(action==='hatch-settle'){
    Object.assign(state,{bodyDrop:.25,stanceSpread:.15+beat*.25,compress:.08,headDrop:.35,feelerForward:.75,eyeWide:beat>.7,relaxed:true,attention:'ambient'});
  }else if(action==='hide'){
    Object.assign(state,{bodyDrop:1.05,stanceSpread:.10,compress:.22,feelerForward:.52,feelerPin:1.15,eyeNarrow:true,attention:'ambient',groundEmphasis:.12});
  }else if(action==='guard'){
    Object.assign(state,{bodyRise:.48,bodyLean:.08,stanceSpread:1.05,compress:.05,feelerForward:1.18,feelerSweep:.2,eyeWide:true,attention:'threat',groundEmphasis:.75});
  }else if(action==='social'){
    Object.assign(state,{bodyDrop:.05,feelerForward:1.05,feelerSweep:.3,relaxed:true,attention:'companion'});
  }else if(action==='listen'){
    Object.assign(state,{bodyRise:.28,stanceSpread:.16,feelerForward:1.22,feelerSweep:.08,eyeWide:beat>.56,attention:'ambient',groundEmphasis:.16});
  }else if(action==='dig'){
    Object.assign(state,{bodyDrop:.72,headDrop:.92,stanceSpread:.38,compress:.12,feelerForward:.82,feelerSweep:.22,attention:'ground',groundEmphasis:.9});
  }else if(action==='scan'){
    Object.assign(state,{bodyRise:.26,bodyLean:.03,stanceSpread:.38,feelerForward:1.2,feelerSweep:.16,eyeWide:beat>.72,attention:'ambient',groundEmphasis:.3});
  }else if(action==='prowl'){
    Object.assign(state,{bodyDrop:.48,bodyLean:.34,stanceSpread:.46,compress:.06,feelerForward:1.18,eyeNarrow:true,attention:'ambient',groundEmphasis:.45});
  }else if(action==='rest'){
    Object.assign(state,{bodyDrop:.22,compress:.12,feelerForward:.72,feelerPin:.35,eyeNarrow:beat>.32,relaxed:true,attention:'ambient'});
  }else if(action==='move'){
    state.feelerForward=1.05;
  }else{
    Object.assign(state,{feelerSweep:.22,relaxed:true,attention:'ambient'});
  }

  if(life.dormant&&action==='rest'&&!moving){
    Object.assign(state,{dormant:true,phase:0,wave:0,beat:.5,bodyDrop:.45,headDrop:.35,compress:.12,feelerForward:.55,feelerPin:.65,eyeNarrow:true,guardPlanted:true});
  }

  if(social?.alarm&&!state.dormant){state.eyeWide=true;state.feelerForward=Math.max(state.feelerForward,1.15);state.stanceSpread=Math.max(state.stanceSpread,.55);state.attention='threat'}
  // Authoritative wound severity grades the favoured side: a sore creature barely
  // spares a leg, a badly wounded one carries it and hitches on every stride.
  const wound=life?.injured?({sore:.42,wounded:.7,severe:1}[life.injuryLevel]??.62):0;
  if(life?.hurt||life?.injured){state.limp=Math.max(life?.hurt?.8:0,wound);state.recoil=(life?.hurt||wound>=.7)&&(phase>5.15&&phase<6.55)?1:0;state.bodyDrop+=Math.max(life?.hurt?.5:0,wound*.42);if(wound>=1)state.headDrop+=.35;state.bodyLean-=.15;state.eyeNarrow=true;state.feelerForward*=.86;state.groundEmphasis=Math.max(state.groundEmphasis,.55)}
  if(life?.exhausted){state.bodyDrop+=.35;state.compress+=.12;state.feelerForward*=.82;state.eyeNarrow=true}
  if(life?.thirsty&&action!=='drink'){state.headDrop+=.18}
  if(life?.strained&&!moving){state.bodyDrop+=.1}

  // Morphology changes posture independently of ancestry or a species label.
  const parts=new Set(bodyPlan?.nodes?.map(n=>n.partId)||[]);
  if(parts.has('spring-leg')){state.stanceSpread*=.82;if(action==='flee')state.bodyRise+=.28}
  if(parts.has('digging-forelimb')&&(action==='dig'||action==='forage')){state.headDrop+=.32;state.groundEmphasis=Math.max(state.groundEmphasis,.85)}
  if(parts.has('webbed-leg')&&action==='swim'){state.bodyDrop+=.18+wave*.16;state.stanceSpread+=.18}
  if(parts.has('sucker-mouth')&&(action==='forage'||action==='eat'))state.headDrop+=.25+beat*.12;
  if(parts.has('hunter-eye')&&(action==='stalk'||action==='hunt')){state.feelerSweep=0;state.bodyDrop+=action==='stalk'?.25:0}

  return state;
}

export function visualActionFromIntent(sim,a,{moving=false}={}){
  if(!a)return'idle';
  // Successful manual receipts add a brief body response without owning gameplay.
  // Actor identity prevents a family handoff from transferring an old meal pose.
  const receipt=sim?.lastPlayerAction,age=(sim?.tickCount??0)-(receipt?.tick??-Infinity);
  if(a.player&&!moving&&!a.bracing&&!a.attackAction&&!a.courtshipPerformance&&['idle','player','rest','explore'].includes(a.intent)&&receipt?.actorId===a.id&&age>=0&&age<CFG.simHz*(.9+Math.min(.9,receipt.processingCost||0))&&['eat','drink','trace-study'].includes(receipt.type))return receipt.type==='trace-study'?'forage':receipt.type==='eat'&&receipt.tissue==='kernel'?'crack':receipt.type;
  const plantMeal=a.lastPlantMeal,mealAge=(sim?.tickCount??0)-(plantMeal?.tick??-Infinity);if(!moving&&!a.bracing&&!a.attackAction&&!a.courtshipPerformance&&plantMeal?.actorId===a.id&&plantMeal.tissue==='kernel'&&mealAge>=0&&mealAge<CFG.simHz*.9&&['idle','rest','feed','explore'].includes(a.intent))return'crack';
  const care=careVisualAction(sim,a,{moving});if(care)return care;
  const d=a.target&&Number.isFinite(a.target.x)&&Number.isFinite(a.target.y)?Math.hypot(a.target.x-a.x,a.target.y-a.y):999;
  if(a.intent==='escape'||a.intent==='group-alarm'||a.intent==='avoid-intruder'||a.intent==='shelter')return'flee';
  if(a.intent==='guardian-hold'||a.intent==='burrow-return'||a.intent==='aquatic-range'||a.intent==='wary')return'move';
  if(a.intent==='stranger-investigate')return moving?'approach':'listen';
  if(a.intent==='stranger-watch')return'listen';
  if(a.intent==='stranger-avoid')return'move';
  if(a.intent==='stranger-posture')return'guard';
  if(a.intent==='storm-shelter')return'move';
  if(a.intent==='storm-refuge')return'social';
  if(a.intent==='storm-resume')return'move';
  if(a.intent==='illness-distance'||a.intent==='illness-buffer'||a.intent==='illness-isolate'||a.intent==='illness-regroup'||a.intent==='illness-immune-support')return'move';
  if(a.intent==='illness-care'||a.intent==='illness-immune-care')return'social';
  if(a.intent==='hide'||a.intent==='hide-shift')return'hide';
  if(a.intent==='ward')return'guard';
  if(a.intent==='hunt')return d<2.25?'hunt':'stalk';
  if(a.intent==='stalk-player'||a.intent==='hunt-windup')return'stalk';
  if(a.intent==='charge-player')return'hunt';
  if(a.intent==='hunt-recover'||a.intent==='den-rest')return'idle';
  if(a.intent==='territory-yield'||a.intent==='territory-displaced'||a.intent==='territory-avoid')return'flee';
  if(a.intent==='territory-challenge')return'stalk';
  if(a.intent==='territory-claim')return'guard';
  if(a.intent==='return-den')return'move';
  if(a.intent==='core-patrol')return d<2.25?'hunt':'stalk';
  if(a.intent==='drink'||a.intent==='learn-water')return (sim?.world?.isDrinkable?.(a.x,a.y)||d<1.25)?'drink':'seek-water';
  if(a.intent==='feed'||a.intent==='shelter-feed'||a.intent==='stealth-forage'||a.intent==='learn-food')return d<1.35?'eat':'forage';
  if(a.intent==='provision-food')return'forage';
  if(a.intent==='provision-home')return'move';
  if(a.intent==='mate')return d<1.7?'court':'approach';
  if(a.intent==='guard')return'guard';
  if(a.intent==='mob')return d<1.55?'hunt':'guard';
  if(a.intent==='shoal-rest'||a.intent==='mire-rest')return'rest';
  if(a.intent==='shoal-signal')return'social';
  if(a.intent==='shoal-glide')return'swim';
  if(a.intent==='mire-sniff')return'forage';
  if(a.intent==='mire-prowl')return'prowl';
  if(a.intent==='herd-listen')return'listen';
  if(a.intent==='herd-browse')return'forage';
  if(a.intent==='herd-rest'||a.intent==='burrow-rest'||a.intent==='stalker-rest')return'rest';
  if(a.intent==='herd-hop'||a.intent==='root-roam'||a.intent==='band-wander')return'move';
  if(a.intent==='ground-probe')return'dig';
  if(a.intent==='scent-watch'||a.intent==='band-watch')return'scan';
  if(a.intent==='shadow-patrol')return'prowl';
  if(a.intent==='band-social')return'social';
  if(a.intent==='social'||a.intent==='group'||a.intent==='follow'||a.intent==='learn-shelter')return'social';
  if(a.intent==='family-scout')return'scan';
  if(a.intent==='family-scout-hold')return'listen';
  if(a.intent==='practice-return')return'move';
  if(a.intent==='player'||a.intent==='explore'||a.intent==='return-home'||a.intent==='group-space'||a.intent==='leave-core')return'move';
  return'idle';
}

function wrap8(v){return((Number(v)%8)+8)%8}
