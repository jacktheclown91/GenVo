import {canHunt,preyPreference} from '../ecology/functional-diet.js';
import {STRATUM_SENSES} from '../ecology/stratum-senses.js';
import {VISIBILITY} from '../ecology/atmospheric-visibility.js';
import {detects} from '../ecology/threat-perception.js';
import {ADAPTATIONS} from '../lineage/evolution.js';

export const AUDIO_SCENES=Object.freeze({
  CALM:'calm',
  SHELTER:'shelter',
  DANGER:'danger',
  HIDDEN:'hidden',
  ENDED:'ended'
});

export function nearestHunter(sim,animal,radius=10){
  if(!sim||!animal)return null;
  let best=null,bestD=radius;
  for(const other of sim.animals||[]){
    if(!other?.alive||other===animal||other.id===animal.id||!canHunt(other)||preyPreference(other,animal)<=0)continue;
    if(sim.world?.sameLand&&!sim.world.sameLand(animal.x,animal.y,other.x,other.y))continue;
    const d=Math.hypot(other.x-animal.x,other.y-animal.y);
    if((sim.visibilityRules===VISIBILITY.policy||sim.stratumSenseRules===STRATUM_SENSES.policy)&&!detects(sim,animal,other,d,radius))continue;
    if(d<bestD){best=other;bestD=d}
  }
  return best?{animal:best,distance:bestD}:null;
}


export function activeStrategyBranch(animal){
  const ids=[...(animal?.adaptations||[])].reverse();
  for(const id of ids){
    const branch=ADAPTATIONS[id]?.branch;
    if(branch==='stealth'||branch==='offense'||branch==='social'||branch==='utility')return branch;
  }
  return null;
}

export function localWetness(sim,animal=sim?.player?.()){
  if(!sim?.world||!animal)return 0;
  const i=sim.world.idx(animal.x,animal.y),moist=sim.world.moisture?.[i]||0,seep=sim.world.seepage?.[i]||0;
  return Math.max(0,Math.min(1,moist*.72+seep*.48));
}

export function localWaterEdge(sim,animal=sim?.player?.()){
  if(!sim?.world||!animal)return 0;
  const i=sim.world.idx(animal.x,animal.y),seep=sim.world.seepage?.[i]||0,dist=sim.world.waterDistance?.[i];
  const near=Number.isFinite(dist)&&dist<65535?Math.max(0,1-dist/5):0;
  return Math.max(0,Math.min(1,Math.max(seep,near)));
}

export function stalkerDangerBand(scene){
  if(scene?.huntPhase==='charge')return 3;
  if(scene?.huntPhase==='windup')return 2;
  if(scene?.huntPhase==='stalk')return 1;
  const d=scene?.danger||0;if(!scene?.threatId||d<.08)return 0;if(d<.34)return 1;if(d<.66)return 2;return 3;
}

export function musicSceneFor(sim){
  const p=sim?.player?.();
  if(!p)return{scene:AUDIO_SCENES.ENDED,danger:0,shelter:false,hidden:false,generation:sim?.lineage?.highestGeneration||1,seasonIndex:sim?.seasonIndex||0,wetness:0,waterEdge:0,branch:null};
  const encounter=sim.predator?.playerStatus?.(p)||null,nearest=nearestHunter(sim,p,10),encounterAnimal=encounter?sim.animals?.find?.(a=>a.id===encounter.hunterId&&a.alive):null;
  const threat=encounterAnimal?{animal:encounterAnimal,distance:encounter.distance}:nearest,protectedStart=!!sim.isOpeningProtected?.(p),hidden=!!p.hidden;
  const shelter=sim.shelter?.nearest?.(p,{radius:2.25,familyOnly:true})||null;
  let rawDanger=protectedStart||!threat?0:Math.max(0,Math.min(1,(9-threat.distance)/7));
  const phaseFloor=encounter?.phase==='charge'?1:encounter?.phase==='windup'?.72:encounter?.phase==='stalk'?.34:encounter?.phase==='recover'?.18:0;
  rawDanger=Math.max(rawDanger,phaseFloor);
  const concealed=!!(hidden&&threat&&sim.camouflageConceals?.(p,threat.animal,threat.distance));
  const danger=concealed?rawDanger*.38:rawDanger;
  const scene=danger>.16?AUDIO_SCENES.DANGER:hidden?AUDIO_SCENES.HIDDEN:shelter?AUDIO_SCENES.SHELTER:AUDIO_SCENES.CALM;
  return{scene,danger,shelter:!!shelter,hidden,generation:p.generation||1,seasonIndex:sim.seasonIndex||0,threatDistance:threat?.distance??Infinity,threatId:threat?.animal?.id??null,threatX:threat?.animal?.x??null,threatY:threat?.animal?.y??null,huntPhase:encounter?.phase||null,concealed,wetness:localWetness(sim,p),waterEdge:localWaterEdge(sim,p),branch:activeStrategyBranch(p)};
}

export function cueForResult(result){
  if(!result)return null;
  const type=result.type||result.action||'';
  if(type==='drink')return result.ok?'drink':'deny';
  if(type==='eat')return result.ok?foodCueFor(result.kind):'deny';
  if(type==='fight')return result.ok?(result.killed?'kill':'fight'):'miss';
  if(type==='hunt')return result.ok?'fight':'miss';
  if(type==='ice-break')return'splash';
  if(type==='ice-escape')return'land';
  if(type==='dive'||type==='surface')return result.ok?'splash':'deny';
  if(type==='burrow'||type==='burrow-dug')return result.ok?'build':'deny';
  if(type==='burrow-enter'||type==='burrow-exit')return'land';
  if(type==='climb')return result.ok?'confirm':'deny';
  if(type==='climb-top'||type==='climb-ground')return'land';
  if(type==='climb-fall')return'damage';
  if(type==='jump')return result.ok?'jump':'deny';
  if(type==='jump-land'||type==='glide-land')return result.water?'splash':result.damage>0?'damage':'land';
  if(type==='attack-start')return null;
  if(type==='attack')return'miss';
  if(type==='brace')return'deny';
  if(type==='hide')return result.ok?(result.hidden===false?'emerge':'hide'):'deny';
  if(type==='alarm')return result.ok?'alarm':'deny';
  if(type==='rally')return result.ok?'rally':'deny';
  if(type==='carry')return result.ok?(result.stored?'store':'carry'):'deny';
  if(type==='build')return result.ok?'build':'deny';
  if(type==='repair'||type==='reinforce')return result.ok?'repair':'deny';
  if(type==='cache')return result.ok?'store':'deny';
  return result.ok?'confirm':'deny';
}


export function foodCueFor(kind){
  const cues={sunmoss:'eat-moss',bramble:'eat-berries',marshroot:'eat-reeds',rotcap:'eat-mushroom',thistlepod:'eat-seed',carrion:'eat-carrion'};
  return cues[kind]||'eat';
}

export const GENVO_THEME=Object.freeze([0,3,7,5,10,7,3,0]);

export function themeStageForGeneration(generation=1){
  const g=Math.max(1,Number(generation)||1);
  return g>=8?3:g>=5?2:g>=3?1:0;
}

function sceneTheme(scene){
  if(scene===AUDIO_SCENES.SHELTER)return[0,4,7,5,9,7,4,0];
  if(scene===AUDIO_SCENES.HIDDEN)return[0,null,7,5,null,7,3,0];
  if(scene===AUDIO_SCENES.DANGER)return[0,3,0,5,7,5,3,0];
  if(scene===AUDIO_SCENES.ENDED)return[0,null,null,null,7,null,3,0];
  return[...GENVO_THEME];
}

function branchAnswer(base,branch){
  const opening=base.slice(0,4);
  const tails={
    stealth:[10,null,3,0],
    offense:[7,5,3,0],
    social:[10,12,7,3],
    utility:[12,10,7,5]
  };
  return opening.concat(tails[branch]||base.slice(4));
}

function thinPhrase(steps,mask){return steps.map((v,i)=>mask.includes(i)?v:null)}

export function musicPattern(scene,{generation=1,seasonIndex=0,branch=null,phraseIndex=0}={}){
  // v1.56.0: seasons move the theme through A, D, E and a low D. All four keep the motif inside A
  // natural minor, the key of the authored music beds, so the live theme never clashes with them
  // (the old summer root, B flat, sat a semitone against the A beds).
  const seasonalRoots=[110,146.83,82.41,73.42];
  const root=seasonalRoots[((seasonIndex%4)+4)%4];
  const stage=themeStageForGeneration(generation),phrase=((phraseIndex%4)+4)%4;
  const base=sceneTheme(scene);
  let steps=[...base];
  if(phrase===0){
    // The signature statement: all lineages share this contour.
    steps=stage===0?thinPhrase(base,[0,2,4,7]):stage===1?thinPhrase(base,[0,2,3,4,6,7]):base;
  }else if(phrase===1){
    // A' adds a small answer as the run develops, without abandoning the theme.
    const answer=[...base];
    if(answer[4]!==null)answer[4]+=stage>=2?2:0;
    if(answer[5]!==null)answer[5]+=stage>=3?2:0;
    steps=stage===0?thinPhrase(answer,[0,2,7]):stage===1?thinPhrase(answer,[0,2,4,6,7]):answer;
  }else if(phrase===2){
    // B is where the newest evolutionary strategy colors the inherited melody.
    const answer=branchAnswer(base,branch);
    steps=stage===0?thinPhrase(answer,[0,2,7]):stage===1?thinPhrase(answer,[0,2,3,4,7]):answer;
  }else{
    // Return/cadence. Generation 8+ can finally answer above the original range.
    steps=[...base];
    if(stage>=2&&steps[4]!==null)steps[4]+=2;
    if(stage>=3&&steps[6]!==null)steps[6]+=12;
    if(stage===0)steps=thinPhrase(steps,[0,2,7]);
    else if(stage===1)steps=thinPhrase(steps,[0,2,4,6,7]);
  }
  const octave=Math.min(12,Math.floor(Math.max(0,generation-1)/3)*2);
  return{root,steps,octave,branch,stage,phraseIndex:phrase,theme:GENVO_THEME};
}

export function handoffTheme({reason='handoff',established=false,branch=null}={}){
  if(reason==='death')return[0,3,7,5,3,0,-2,-5];
  const base=branchAnswer(GENVO_THEME,branch);
  if(established)return[base[0],base[1],base[2],base[3],base[4]+2,base[5]+5,base[6]+12,base[7]+24];
  return[base[0],base[1],base[2],base[3],base[4],base[5],base[6]+5,base[7]+12];
}

export function semitone(root,offset){return root*Math.pow(2,offset/12)}
