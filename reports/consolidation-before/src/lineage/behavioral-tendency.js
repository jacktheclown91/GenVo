import {groundDiet,canHunt,preyPreference} from '../ecology/functional-diet.js';
import {CFG,PLANTS} from '../sim/config.js';
import {SPECIES} from '../organisms/species.js';
import {familyForageRangeEffect} from './effects.js';

const TENDENCIES={
  forager:{id:'forager',label:'Independent foragers',short:'Independent',summary:'Adults range farther, search wider, and spend more time feeding away from the family core.'},
  colony:{id:'colony',label:'Colony cohesion',short:'Colony',summary:'Adults stay closer to shelters and one another, regrouping around established family homes.'}
};

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// Tracks family-scale behavior that emerges from sustained player guidance plus
// what the living family actually does. This is intentionally not a species flag.
// It is a reversible cultural/ecological tendency that can later feed true speciation.
export class BehavioralTendencyController{
  constructor(sim){
    this.sim=sim;
    this.scores={forager:0,colony:0};
    this.lastDirectiveTick=new Map();
    this.lastSnapshot=null;
    this.notice=null;
    this.lastSignature='';
    this.observedDays=0;
  }
  definitions(){return TENDENCIES}
  noteDirective(kind,weight=1){
    if(!this.sim.playerEnabled)return false;
    const map={forage:['forager',.72],scout:['forager',.58],follow:['colony',.46],home:['colony',.54],gather:['colony',.66],nest:['colony',.82]};
    const hit=map[kind];if(!hit)return false;
    const minGap=Math.max(1,Math.round(CFG.dayTicks*.6)),last=this.lastDirectiveTick.get(kind)??-Infinity;
    if(this.sim.tickCount-last<minGap)return false;
    this.lastDirectiveTick.set(kind,this.sim.tickCount);
    this.scores[hit[0]]+=hit[1]*Math.max(.25,weight||1);
    this.evaluate();return true;
  }
  adults(){return this.sim.animals.filter(a=>a.alive&&a.lineage&&a.species==='genvo'&&!this.sim.family?.isDependent?.(a)&&a.age>=SPECIES.genvo.maturity)}
  nearestFamilyShelterDistance(a){
    const shelters=(this.sim.shelter?.shelters||[]).filter(s=>(s.integrity??0)>0);if(!shelters.length)return Infinity;
    let best=Infinity;for(const s of shelters)best=Math.min(best,Math.hypot(a.x-s.x,a.y-s.y));return best;
  }
  advanceDay(){
    if(!this.sim.playerEnabled)return this.snapshot();
    const adults=this.adults();if(adults.length<2)return this.snapshot();
    this.observedDays++;
    this.scores.forager*=.992;this.scores.colony*=.992;
    const cx=adults.reduce((n,a)=>n+a.x,0)/adults.length,cy=adults.reduce((n,a)=>n+a.y,0)/adults.length;
    const distances=adults.map(a=>Math.hypot(a.x-cx,a.y-cy)),spread=distances.reduce((n,d)=>n+d,0)/Math.max(1,distances.length);
    let far=0,near=0,feedLike=0,homeLike=0;
    for(const a of adults){
      const sd=this.nearestFamilyShelterDistance(a),fd=Math.hypot(a.x-cx,a.y-cy);
      if(sd>7.5||fd>7)far++;if(sd<=5.25||fd<=3.8)near++;
      if(['feed','family-forage','family-relief-forage','family-scout','family-area-forage','family-area-scout','tendency-forage','tendency-roam'].includes(a.intent))feedLike++;
      if(['family-follow','family-home','family-hold','family-area-gather','family-area-nest','return-home','shelter','tendency-home','tendency-gather'].includes(a.intent))homeLike++;
    }
    const farFraction=far/adults.length,nearFraction=near/adults.length,feedFraction=feedLike/adults.length,homeFraction=homeLike/adults.length;
    this.scores.forager+=farFraction*.28+feedFraction*.24+clamp(spread/11,0,1)*.14;
    this.scores.colony+=nearFraction*.27+homeFraction*.25;
    const shelters=(this.sim.shelter?.shelters||[]).filter(s=>(s.integrity??0)>0);
    if(shelters.length)this.scores.colony+=Math.min(.16,shelters.length*.055);
    // v1.30: the family tendency is also the sum of real creature habits.
    const habits=this.sim.habits?.familyAverages?.(adults);
    if(habits?.count){this.scores.forager+=habits.range*.22;this.scores.colony+=habits.home*.22}
    const mode=this.sim.familyDirectives?.mode;
    if(mode==='forage'||mode==='scout')this.scores.forager+=.10;
    if(mode==='follow'||mode==='home')this.scores.colony+=.10;
    return this.evaluate();
  }
  evaluate(){
    const f=Math.max(0,this.scores.forager),c=Math.max(0,this.scores.colony),dominant=f>=c?'forager':'colony',high=Math.max(f,c),low=Math.min(f,c),gap=high-low;
    let stage=0;if(high>=2&&gap>=.35)stage=1;if(high>=5&&gap>=.9)stage=2;if(high>=9&&gap>=1.6)stage=3;
    const mixed=gap<.25||high<1.25,selected=mixed?null:dominant,total=f+c||1,share=selected?this.scores[selected]/total:.5;
    const snap={dominant:selected,stage,stageLabel:stage>=3?'deepening':stage>=2?'established':stage>=1?'forming':'unformed',scores:{forager:f,colony:c},shares:{forager:f/total,colony:c/total},confidence:selected?share:.5,observedDays:this.observedDays,definition:selected?TENDENCIES[selected]:null};
    const signature=`${selected||'mixed'}:${stage}`;
    if(signature!==this.lastSignature&&stage>=1&&selected){
      const def=TENDENCIES[selected],verb=stage>=2?'established':'forming';
      this.notice={tick:this.sim.tickCount,kind:selected,stage,message:`Lineage behavior ${verb}: ${def.label}.`};
    }
    this.lastSignature=signature;this.lastSnapshot=snap;return snap;
  }
  snapshot(){return this.lastSnapshot||this.evaluate()}
  consumeNotice(){const n=this.notice;this.notice=null;return n}
  established(id){const s=this.snapshot();return s.stage>=2&&s.dominant===id}
  forageRangeMultiplier(){const s=this.snapshot();if(s.dominant!=='forager')return 1;return s.stage>=3?1.45:s.stage>=2?1.30:s.stage>=1?1.12:1}
  cohesionMultiplier(){const s=this.snapshot();if(s.dominant!=='colony')return 1;return s.stage>=3?.76:s.stage>=2?.84:s.stage>=1?.93:1}
  autonomousDecision(animal){
    if(!animal?.alive||this.sim.isManualPlayer?.(animal)||!animal.lineage||animal.species!=='genvo'||this.sim.family?.isDependent?.(animal))return null;
    if(this.sim.familyDirectives?.mode!=='auto')return null;
    const snap=this.snapshot(),form=this.sim.divergence?.formFor?.(animal)||null;
    const inherited=form&&form.strength>=.34?form.kind:null,own=this.sim.habits?.rangeStyle?.(animal)||null,dominant=(snap.stage>=2&&snap.dominant)?snap.dominant:(own||inherited);
    if(!dominant)return null;
    const spec=SPECIES.genvo,energy=animal.energy/spec.maxEnergy,water=animal.hydration/spec.maxHydration;
    if(animal.health<55||energy<.52||water<.52)return null;
    if(dominant==='forager'){
      const inheritedRange=this.sim.divergence?.forageRangeMultiplier?.(animal)||1,protoRange=this.sim.protoSpeciation?.forageRangeMultiplier?.(animal)||1;
      if(energy<.88){const food=this.foodTarget(animal,14*familyForageRangeEffect(this.sim,animal));if(food)return{intent:'tendency-forage',target:food}}
      const target=this.roamTarget(animal,{rangeMultiplier:inheritedRange*protoRange});if(target&&Math.hypot(animal.x-target.x,animal.y-target.y)>2)return{intent:'tendency-roam',target};
    }
    if(dominant==='colony'){
      const network=this.sim.generationProgress?.populationAnchor?.(animal,'colony')||null;
      const shelter=network?.shelterId?(this.sim.shelter?.activeShelters?.()||[]).find(s=>s.id===network.shelterId)||null:this.sim.shelter?.nearest?.(animal,{radius:Infinity,familyOnly:true})||null;
      const p=this.sim.player?.(),anchor=network?{x:network.x,y:network.y,populationCenter:true}:shelter?{x:shelter.x,y:shelter.y}:p?{x:p.x,y:p.y}:null;if(!anchor)return null;
      const angle=(animal.id%8)*(Math.PI/4),radius=(2.2+(animal.id%3)*.38)*this.cohesionMultiplier(),target={x:anchor.x+Math.cos(angle)*radius,y:anchor.y+Math.sin(angle)*radius,tendency:true,populationCenter:!!anchor.populationCenter};
      const d=Math.hypot(animal.x-target.x,animal.y-target.y);if(d>4.6*this.cohesionMultiplier())return{intent:'tendency-home',target};
      if(d>2.1&&((animal.id+this.sim.day)%3===0))return{intent:'tendency-gather',target};
    }
    return null;
  }
  foodTarget(animal,radius=15){
    const s=SPECIES[animal.species],w=this.sim.world,r=Math.max(6,Math.min(24,radius)),step=2,start=((animal.id*3)%2);let best=null,bestScore=.06;
    const minX=Math.max(2,Math.floor(animal.x-r)),maxX=Math.min(CFG.worldSize-3,Math.ceil(animal.x+r)),minY=Math.max(2,Math.floor(animal.y-r)),maxY=Math.min(CFG.worldSize-3,Math.ceil(animal.y+r));
    for(let y=minY+start;y<=maxY;y+=step)for(let x=minX+((animal.id+y)%2);x<=maxX;x+=step){
      const px=x+.5,py=y+.5,d=Math.hypot(px-animal.x,py-animal.y);if(d>r||w.water[w.idx(px,py)]||!this.sim.canReach(animal,px,py))continue;
      const risk=this.sim.stalkerTerritory?.forageAdjustment?.(animal,px,py)||0;
      for(const [kind,eff] of Object.entries(groundDiet(animal))){
        if(!PLANTS[kind]||eff<=0)continue;const amount=w.plants[kind]?.[w.idx(px,py)]||0,tie=((x*31+y*17+animal.id*13)%19)*.0002,score=amount*eff*PLANTS[kind].nutrition*.085+risk-d*.006+Math.min(.045,d*.004)+tie;
        if(score>bestScore){bestScore=score;best={x:px,y:py,kind,score,tendency:true}}
      }
    }
    return best;
  }
  roamTarget(animal,{rangeMultiplier=1}={}){
    const network=this.sim.generationProgress?.populationAnchor?.(animal,'forager')||null;
    const shelter=this.sim.shelter?.nearest?.(animal,{radius:Infinity,familyOnly:true})||null,p=this.sim.player?.(),anchor=network?{x:network.x,y:network.y}:shelter?{x:shelter.x,y:shelter.y}:p?{x:p.x,y:p.y}:{x:animal.x,y:animal.y};
    const angle=((animal.id*5+this.sim.day*3)%16)*(Math.PI/8),radius=(8.5+(animal.id%5)*1.15*this.forageRangeMultiplier())*rangeMultiplier;
    const x=clamp(anchor.x+Math.cos(angle)*radius,2,CFG.worldSize-3),y=clamp(anchor.y+Math.sin(angle)*radius,2,CFG.worldSize-3);
    if(this.sim.world.water[this.sim.world.idx(x,y)]&&!this.sim.canSwim(animal))return null;
    return{x,y,tendency:true};
  }
}

export function behavioralTendencyMeta(id){return TENDENCIES[id]||null}
