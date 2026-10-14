import {groundDiet,preyPreference,canHunt} from '../ecology/functional-diet.js';
import {partFoodFactor} from './part-abilities.js';
import {CFG,PLANTS} from '../sim/config.js';
import {SPECIES} from '../organisms/species.js';
import {ROOT_TAXON_ID} from './evolution-tree.js';
import {hasAdaptation,syncAnatomy} from './evolution.js';
import {HABIT_KEYS} from '../cognition/habits.js';
import {protoReading} from './readings.js';

const clamp01=v=>Math.max(0,Math.min(1,Number(v)||0));
const DIET_FIELDS=['plantMeals','plantBiomass','carrionMeals','huntAttempts','huntKills'];

export const SPECIES_LIFESTYLES={
  aquatic:{
    id:'aquatic',label:'Aquatic',short:'AQUATIC',summary:'This taxon is becoming a water-crossing, wet-habitat lineage.',
    opportunity:'Rivers and wet margins become normal travel space instead of barriers.',
    tradeoff:'Its body is less efficient during long dry-land travel.'
  },
  nomadic:{
    id:'nomadic',label:'Nomadic',short:'NOMADIC',summary:'This taxon is becoming a wide-ranging lineage that does not depend on one center.',
    opportunity:'Adults travel and search farther, making distant resources and new ranges easier to exploit.',
    tradeoff:'Constant travel costs a little more energy.'
  },
  guardian:{
    id:'guardian',label:'Guardian',short:'GUARDIAN',summary:'This taxon is becoming a defensive lineage built around holding kin and shelter together.',
    opportunity:'Threats are noticed sooner and sheltered relatives resist attacks more effectively.',
    tradeoff:'The defensive build gives no extra advantage while roaming alone.'
  },
  burrower:{
    id:'burrower',label:'Burrower',short:'BURROWER',summary:'This taxon is becoming a den-focused lineage that invests heavily in protected homes.',
    opportunity:'Taxon nests use less material and give stronger thermal and physical protection.',
    tradeoff:'Compact denning bodies move slightly slower in the open.'
  },
  hunter:{
    id:'hunter',label:'Hunter',short:'HUNTER',summary:'This taxon is becoming an active hunting lineage that treats live prey as ordinary food.',
    opportunity:'Hungry adults actively pursue edible wildlife, and prey now recognize the branch as a real predator.',
    tradeoff:'Plant food is less efficient for a body increasingly committed to animal prey.'
  },
  grazer:{
    id:'grazer',label:'Grazer',short:'GRAZER',summary:'This taxon is becoming a plant-focused lineage built around sustained feeding grounds.',
    opportunity:'Adults begin grazing before deep hunger and extract more energy from plant food.',
    tradeoff:'Carrion and live prey provide less value as the digestive system specializes toward plants.'
  }
};

// Species-scale lifestyle authority. It consumes behavior and environment that already
// happened in the simulation. It does not choose a branch from a menu and consumes no RNG.
// v1.32 Stage F: a lifestyle is recognized from what the taxon's adults are, on average:
// their bodies (anatomy, including form and proto-trait axes), the adaptations those bodies
// express, the habits they have settled into, the pressure their population lived under and
// how settled they are. It keeps no score of its own; the daily travel, meal and hunt counts
// only drive the play loops of a lifestyle that already formed. Once formed it stays.
export class SpeciesLifestyleController{
  constructor(sim){this.sim=sim;this.states=new Map();this.daily=new Map();this.lastDay=0;this.notice=null}
  taxonId(animal){return this.sim.evolutionTree?.taxonFor?.(animal)||ROOT_TAXON_ID}
  node(taxonId){return this.sim.evolutionTree?.node?.(taxonId)||null}
  members(taxonId,{adultsOnly=false}={}){
    return this.sim.animals.filter(a=>a.alive&&a.lineage&&a.species==='genvo'&&this.taxonId(a)===taxonId&&(!adultsOnly||a.age>=SPECIES.genvo.maturity));
  }
  ensure(taxonId){
    let s=this.states.get(taxonId);
    if(!s){
      const node=this.node(taxonId);
      s={taxonId,label:node?.label||'GenVo',samples:0,streak:0,candidate:null,lifestyle:node?.lifestyle?{...node.lifestyle}:null,lastEvidence:null,history:[],loopDay:-1,loop:null};
      this.states.set(taxonId,s);
    }
    return s;
  }
  dailyRow(taxonId){
    let d=this.daily.get(taxonId);
    if(!d){
      d={distance:0,waterDistance:0,steps:0,waterSteps:0,plantMeals:0,plantBiomass:0,carrionMeals:0,huntAttempts:0,huntKills:0};
      this.daily.set(taxonId,d);
    }else{
      for(const key of ['distance','waterDistance','steps','waterSteps',...DIET_FIELDS])if(!Number.isFinite(d[key]))d[key]=0;
    }
    return d;
  }
  noteMovement(animal,{swimming=false,distance=0}={}){
    if(!animal?.alive||!animal.lineage||animal.species!=='genvo')return;
    const d=this.dailyRow(this.taxonId(animal)),n=Math.max(0,Number(distance)||0);
    d.distance+=n;d.steps++;if(swimming){d.waterDistance+=n;d.waterSteps++}
  }
  noteFeeding(animal,{kind='',amount=0}={}){
    if(!animal?.alive||!animal.lineage||animal.species!=='genvo')return;
    const d=this.dailyRow(this.taxonId(animal));
    if(PLANTS[kind]){d.plantMeals++;d.plantBiomass+=Math.max(0,Number(amount)||0)}
    else if(kind==='carrion')d.carrionMeals++;
  }
  noteHunt(animal,{prey=null,killed=false}={}){
    if(!animal?.alive||!animal.lineage||animal.species!=='genvo'||!prey||preyPreference(animal,prey)<=0)return;
    const d=this.dailyRow(this.taxonId(animal));d.huntAttempts++;if(killed)d.huntKills++;
  }
  originPopulation(taxonId){
    const node=this.node(taxonId),key=node?.originPopulationKey||'home';
    return this.sim.populationMemory?.populationByKey?.(key)||this.sim.populationMemory?.populationByKey?.('home')||null;
  }
  pressureFor(taxonId){
    const pop=this.originPopulation(taxonId),profile=pop?this.sim.populationMemory?.profile?.(pop.key):null;
    const axes=Object.fromEntries((profile?.axes||[]).map(a=>[a.id,a]));
    return{pop,profile,axes};
  }
  formShare(adults,kind){if(!adults.length)return 0;return adults.filter(a=>this.sim.divergence?.formFor?.(a)?.kind===kind).length/adults.length}
  adaptationShare(adults,ids){if(!adults.length)return 0;return adults.filter(a=>ids.some(id=>hasAdaptation(a,id))||ids.includes(protoReading(a)?.id)).length/adults.length}
  affinitySpread(members){
    if(!members.length)return{spread:0,dominantShare:1,populations:0};
    const by=new Map();let known=0;
    for(const a of members){const f=this.sim.populationMemory?.affinityFor?.(a);if(!f)continue;known++;by.set(f.key,(by.get(f.key)||0)+1)}
    if(!known)return{spread:0,dominantShare:1,populations:0};
    const max=Math.max(...by.values());
    return{spread:clamp01((by.size-1)/2),dominantShare:max/known,populations:by.size};
  }
  // Taxon averages over adults: body parts, habits and adaptation shares.
  bodyReading(adults){
    const n=adults.length,body={},habit={};
    for(const k of HABIT_KEYS)habit[k]=0;
    for(const a of adults){
      const an=syncAnatomy(a)||{};
      for(const [k,v] of Object.entries(a.anatomy||an))body[k]=(body[k]||0)+(Number(v)||0);
      for(const k of HABIT_KEYS)habit[k]+=a.habits?.[k]||0;
    }
    if(n){for(const k of Object.keys(body))body[k]/=n;for(const k of HABIT_KEYS)habit[k]/=n}
    return{body,habit};
  }
  evidenceFor(taxonId){
    const members=this.members(taxonId),adults=this.members(taxonId,{adultsOnly:true}),row=this.dailyRow(taxonId),p=this.pressureFor(taxonId),co=this.sim.speciesCoexistence?.snapshotForTaxon?.(taxonId)||null,profileDays=p.profile?.days||0;
    const wet=p.axes.wetness?.recent??p.axes.wetness?.mean??0,pred=p.axes.predation?.recent??p.axes.predation?.mean??0,cold=p.axes.cold?.recent??p.axes.cold?.mean??0;
    const webbed=this.adaptationShare(adults,['webbed-limbs']),defense=this.adaptationShare(adults,['hardened-mantle','mobbing-instinct','coordinated-defense','watch-crest']),forager=this.formShare(adults,'forager'),colony=this.formShare(adults,'colony'),affinity=this.affinitySpread(members),residentShare=Number.isFinite(co?.residentShare)?co.residentShare:affinity.dominantShare;
    const offense=this.adaptationShare(adults,['heavy-jaw','crushing-jaw','barbed-limbs']),efficientGut=this.adaptationShare(adults,['efficient-gut']);
    const {body,habit}=this.bodyReading(adults),b=k=>clamp01(body[k]||0);
    const waterEdge=p.pop?this.sim.populationMemory?.habitatAt?.(p.pop)?.waterEdge||0:0,shelters=this.sim.shelter?.activeShelters?.().filter(s=>!s.taxonId||s.taxonId===taxonId).length||0,shelterDensity=clamp01(shelters/Math.max(1,Math.ceil(adults.length/3)));
    const pct=v=>Math.round(clamp01(v)*100);
    const entries={
      aquatic:{score:clamp01(webbed*.34+b('waterBody')*.18+b('splayfoot')*.08+wet*.24+waterEdge*.16),gate:webbed>=.34&&Math.max(wet,waterEdge)>=.22,detail:`webbed adults ${pct(webbed)}% · water-holding body ${pct(b('waterBody'))}% · wet pressure ${pct(wet)}%`},
      nomadic:{score:clamp01(habit.range*.30+(1-residentShare)*.24+affinity.spread*.18+b('reach')*.14+forager*.14),gate:habit.range>=.30&&(residentShare<.74||affinity.populations>=2)&&forager>=.25,detail:`ranging habit ${pct(habit.range)}% · origin residence ${pct(residentShare)}% · forager form ${pct(forager)}%`},
      guardian:{score:clamp01(pred*.28+defense*.26+habit.boldness*.12+colony*.14+residentShare*.20),gate:pred>=.16&&defense>=.25&&residentShare>=.45,detail:`predator pressure ${pct(pred)}% · defensive adults ${pct(defense)}% · standing ground ${pct(habit.boldness)}%`},
      burrower:{score:clamp01(habit.home*.30+colony*.19+Math.max(cold,pred)*.25+shelterDensity*.26),gate:habit.home>=.34&&shelterDensity>=.24&&colony>=.25,detail:`home habit ${pct(habit.home)}% · den capacity ${pct(shelterDensity)}% · colony form ${pct(colony)}%`},
      hunter:{score:clamp01(habit.hunting*.42+offense*.36+b('jaw')*.22),gate:habit.hunting>=.40&&offense>=.25,detail:`hunting habit ${pct(habit.hunting)}% · hunting build ${pct(offense)}% · jaw ${pct(b('jaw'))}%`},
      grazer:{score:clamp01(efficientGut*.32+b('gut')*.16+forager*.18+(1-habit.hunting)*.18+habit.range*.16),gate:efficientGut>=.25&&forager>=.20&&habit.hunting<.20,detail:`efficient-gut adults ${pct(efficientGut)}% · forager form ${pct(forager)}% · hunting habit ${pct(habit.hunting)}%`}
    };
    const ranked=Object.entries(entries).map(([id,v])=>({id,...v,...SPECIES_LIFESTYLES[id]})).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
    return{taxonId,members:members.length,adults:adults.length,profileDays,row,wet,pred,cold,webbed,defense,offense,efficientGut,forager,colony,residentShare,affinity,body,habit,ranked,top:ranked[0]||null};
  }
  applyToMembers(taxonId,lifestyle){
    for(const a of this.members(taxonId)){
      a.ecoLifestyle=lifestyle?{...lifestyle}:null;
      const rec=this.sim.lineage?.records?.get?.(a.id);if(rec)rec.speciesLifestyle=a.ecoLifestyle?{...a.ecoLifestyle}:null;
    }
  }
  establish(state,evidence){
    const def=SPECIES_LIFESTYLES[state.candidate];if(!def)return null;
    const lifestyle={id:def.id,label:def.label,short:def.short,formedDay:this.sim.day,formedGeneration:this.sim.lineage?.highestGeneration||1,taxonId:state.taxonId,taxonLabel:state.label,evidence:evidence.top?.detail||'',score:evidence.top?.score||0};
    state.lifestyle=lifestyle;state.loopDay=-1;state.loop=null;
    const node=this.node(state.taxonId);if(node)node.lifestyle={...lifestyle};
    this.applyToMembers(state.taxonId,lifestyle);if(def.id==='burrower')this.markBurrowDens(state.taxonId);
    this.notice={message:`${state.label} developed a ${def.label.toLowerCase()} lifestyle · ${def.opportunity}`,tone:'success'};
    return lifestyle;
  }
  advanceDay(){
    if(this.lastDay===this.sim.day)return;this.lastDay=this.sim.day;
    if((this.sim.lineage?.highestGeneration||1)<4){this.daily.clear();return}
    for(const taxon of this.sim.evolutionTree?.livingTaxa?.()||[]){
      const state=this.ensure(taxon.id),e=this.evidenceFor(taxon.id);state.samples++;state.lastEvidence=e;
      state.history.push({day:this.sim.day,top:e.top?.id||null,score:e.top?.score||0});if(state.history.length>16)state.history.shift();
      if(state.lifestyle){this.applyToMembers(taxon.id,state.lifestyle);continue}
      this.applyToMembers(taxon.id,null);
      const top=e.top,qualifies=!!(top?.gate&&top.score>=.58&&e.adults>=2&&e.profileDays>=3);
      if(qualifies&&state.candidate===top.id)state.streak++;else if(qualifies){state.candidate=top.id;state.streak=1}else{state.candidate=top?.id||null;state.streak=0}
      if(state.streak>=3&&state.samples>=3)this.establish(state,e);
    }
    this.daily.clear();
  }
  lifestyleFor(animal){
    if(!animal?.alive||animal.species!=='genvo')return null;if(animal.ecoLifestyle?.id)return animal.ecoLifestyle;
    const id=this.taxonId(animal),state=this.states.get(id),node=this.node(id),lifestyle=state?.lifestyle||node?.lifestyle||null;if(!lifestyle)return null;
    animal.ecoLifestyle={...lifestyle};const rec=this.sim.lineage?.records?.get?.(animal.id);if(rec&&rec.speciesLifestyle?.id!==lifestyle.id)rec.speciesLifestyle={...animal.ecoLifestyle};return animal.ecoLifestyle;
  }
  stateForTaxon(taxonId){const s=this.ensure(taxonId);return{...s,lastEvidence:s.lastEvidence,definition:s.lifestyle?SPECIES_LIFESTYLES[s.lifestyle.id]:s.candidate?SPECIES_LIFESTYLES[s.candidate]:null}}
  movementMultiplier(animal,{swimming=false}={}){const id=this.lifestyleFor(animal)?.id;if(id==='aquatic')return swimming?1.25:.96;if(id==='nomadic')return swimming?1:1.08;if(id==='burrower')return swimming ? .94 : .97;if(id==='hunter')return swimming ? .98 : 1.025;if(id==='grazer')return swimming ? .96 : .985;return 1}
  movementEnergyMultiplier(animal,{swimming=false}={}){const id=this.lifestyleFor(animal)?.id;if(id==='aquatic')return swimming ? .82 : 1.03;if(id==='nomadic')return swimming?1:1.05;return 1}
  forageRangeMultiplier(animal){const id=this.lifestyleFor(animal)?.id;return id==='nomadic'?1.16:id==='grazer'?1.10:id==='hunter' ? .95:1}
  threatSenseMultiplier(animal){return this.lifestyleFor(animal)?.id==='guardian'?1.16:1}
  shelterProtectionMultiplier(animal){const id=this.lifestyleFor(animal)?.id;return id==='guardian' ? .90:id==='burrower' ? .86:1}
  shelterThermalMultiplier(animal){return this.lifestyleFor(animal)?.id==='burrower' ? .76:1}
  nestMaterialMultiplier(taxonId){return(this.states.get(taxonId)?.lifestyle?.id==='burrower'||this.node(taxonId)?.lifestyle?.id==='burrower') ? .78 : 1}
  feedingThreshold(animal){const id=this.lifestyleFor(animal)?.id;return id==='grazer' ? .80:id==='hunter' ? .76:.72}
  feedingMode(animal){const id=this.lifestyleFor(animal)?.id;return id==='hunter'?'hunter':id==='grazer'?'grazer':'omnivore'}
  preySearchRangeMultiplier(animal){return this.lifestyleFor(animal)?.id==='hunter'?1.22:1}
  huntSuccessMultiplier(animal){return this.lifestyleFor(animal)?.id==='hunter'?1.12:1}
  // Wave 1: the mouth's food factor applies with the lifestyle's.
  foodEnergyMultiplier(animal,opts={}){return this.lifestyleFoodMultiplier(animal,opts)*partFoodFactor(animal,opts)*(this.sim.discovery?.foodBonus?.(animal,opts.kind)??1)}
  lifestyleFoodMultiplier(animal,{kind='',livePrey=false}={}){
    const id=this.lifestyleFor(animal)?.id;if(!id)return 1;
    if(id==='hunter')return livePrey?1.18:kind==='carrion'?1.08:PLANTS[kind] ? .88:1;
    if(id==='grazer')return PLANTS[kind]?1.16:(livePrey ? .72:kind==='carrion' ? .76:1);
    return 1;
  }
  taxonShelters(taxonId){
    const multi=(this.sim.evolutionTree?.livingTaxa?.().length||0)>1;
    return(this.sim.shelter?.activeShelters?.()||[]).filter(sh=>{if(sh.taxonId)return sh.taxonId===taxonId;if(!multi)return taxonId===ROOT_TAXON_ID;return taxonId===ROOT_TAXON_ID});
  }
  markBurrowDens(taxonId){for(const sh of this.taxonShelters(taxonId))sh.denStyle='burrow'}
  nearestTaxonShelter(animal,radius=Infinity){const taxonId=this.taxonId(animal);let best=null,bestD=radius;for(const sh of this.taxonShelters(taxonId)){const d=Math.hypot(animal.x-sh.x,animal.y-sh.y);if(d<bestD){best=sh;bestD=d}}return best}
  wetMarginTarget(taxonId){const pop=this.originPopulation(taxonId);if(!pop)return null;const candidates=this.sim.speciesCoexistence?.candidateCells?.(taxonId,pop)||[];const wet=candidates.filter(c=>(c.preference?.waterEdge||0)>=.30||(c.preference?.moisture||0)>=.62);return wet[0]||candidates.find(c=>c.preference?.lifestyle==='wet margins')||null}
  guardianThreat(taxonId){
    const shelters=this.taxonShelters(taxonId),members=this.members(taxonId),dependents=members.filter(a=>this.sim.family?.isDependent?.(a));let best=null,bestD=Infinity,anchor=null;
    for(const sh of shelters){const threat=this.sim.findNearest?.(sh,b=>b.alive&&canHunt(b),6.5);if(threat){const d=Math.hypot(threat.x-sh.x,threat.y-sh.y);if(d<bestD){best=threat;bestD=d;anchor={x:sh.x,y:sh.y,label:'taxon shelter'}}}}
    for(const child of dependents){const threat=this.sim.findNearest?.(child,b=>b.alive&&canHunt(b),5.5);if(threat){const d=Math.hypot(threat.x-child.x,threat.y-child.y);if(d<bestD){best=threat;bestD=d;anchor={x:child.x,y:child.y,label:'young'}}}}
    return best?{threat:best,distance:bestD,anchor}:null;
  }
  hunterPreyTarget(animal){
    if(!animal?.alive)return null;
    const radius=16*(animal.genes?.senses||1)*this.preySearchRangeMultiplier(animal);
    return this.sim.bestPrey?.(animal,radius,{allowNonHunter:true})||null;
  }
  grazerFoodTarget(animal,{radius=10}={}){
    if(!animal?.alive)return null;
    const w=this.sim.world,s=SPECIES[animal.species],r=Math.max(4,Math.round(radius*(animal.genes?.senses||1))),step=2;
    let best=null,bestScore=-Infinity;
    const minX=Math.max(1,Math.floor(animal.x-r)),maxX=Math.min(CFG.worldSize-2,Math.ceil(animal.x+r)),minY=Math.max(1,Math.floor(animal.y-r)),maxY=Math.min(CFG.worldSize-2,Math.ceil(animal.y+r));
    for(let by=minY;by<=maxY;by+=step)for(let bx=minX;bx<=maxX;bx+=step)for(let oy=0;oy<2;oy++)for(let ox=0;ox<2;ox++){
      const x=bx+ox,y=by+oy;if(x>maxX||y>maxY)continue;const i=w.idx(x,y);if(w.water[i])continue;const dist=Math.hypot(x-animal.x,y-animal.y);if(dist>r)continue;
      const hist=this.sim.history?.cell?.(i)||null,wear=clamp01((hist?.grazing||0)/1.2),recovery=clamp01((hist?.recovery||0)/1.1);
      for(const [kind,eff] of Object.entries(groundDiet(animal))){
        if(!PLANTS[kind]||eff<=0)continue;const amount=w.plants[kind]?.[i]||0;if(amount<=.08)continue;
        const freshness=1-wear*.34+recovery*.10,score=amount*(PLANTS[kind].nutrition||1)*eff*this.foodEnergyMultiplier(animal,{kind})*freshness-dist*.08;
        if(score>bestScore){bestScore=score;best={x,y,kind,score,lifestyle:true,freshness,wear,recovery}}
      }
    }
    return best;
  }
  preyDensityAt(target,radius=8){let n=0;this.sim.forEachNearby?.(target,radius,a=>{if(a.alive&&!a.lineage&&canHunt(a)===false)n++});return n}
  plantDensityAt(target,radius=5){
    const w=this.sim.world;let value=0,samples=0;
    for(let oy=-radius;oy<=radius;oy+=2)for(let ox=-radius;ox<=radius;ox+=2){const x=Math.max(1,Math.min(CFG.worldSize-2,target.x+ox)),y=Math.max(1,Math.min(CFG.worldSize-2,target.y+oy)),i=w.idx(x,y);if(w.water[i])continue;samples++;for(const [kind,eff] of Object.entries(groundDiet(this.sim.player()||this.sim.animals.find(a=>a.lineage))))if(PLANTS[kind]&&eff>0)value+=(w.plants[kind]?.[i]||0)*eff*(PLANTS[kind].nutrition||1)}
    return samples?value/samples:0;
  }
  grazingGroundState(target,radius=4){
    if(!target)return{food:0,grazing:0,recovery:0,samples:0,worn:true,depleted:true};
    const w=this.sim.world;let food=0,grazing=0,recovery=0,samples=0;
    for(let oy=-radius;oy<=radius;oy+=2)for(let ox=-radius;ox<=radius;ox+=2){
      const x=Math.max(1,Math.min(CFG.worldSize-2,target.x+ox)),y=Math.max(1,Math.min(CFG.worldSize-2,target.y+oy)),i=w.idx(x,y);if(w.water[i])continue;samples++;
      for(const [kind,eff] of Object.entries(groundDiet(this.sim.player()||this.sim.animals.find(a=>a.lineage))))if(PLANTS[kind]&&eff>0)food+=(w.plants[kind]?.[i]||0)*eff*(PLANTS[kind].nutrition||1);
      const hist=this.sim.history?.cell?.(i);if(hist){grazing+=hist.grazing||0;recovery+=hist.recovery||0}
    }
    const meanFood=samples?food/samples:0,meanGrazing=samples?grazing/samples:0,meanRecovery=samples?recovery/samples:0;
    return{food:meanFood,grazing:meanGrazing,recovery:meanRecovery,samples,worn:meanGrazing>=.10||meanFood<4.8,depleted:meanGrazing>=.18||meanFood<3.6};
  }
  playStateForTaxon(taxonId,{force=false}={}){
    const state=this.ensure(taxonId),l=state.lifestyle;if(!l)return null;
    const row=this.dailyRow(taxonId),loopToken=l.id==='guardian'?`${this.sim.day}:${Math.floor(this.sim.tickCount/8)}`:(l.id==='hunter'||l.id==='grazer')?`${this.sim.day}:${row.huntAttempts}:${row.huntKills}:${row.plantMeals}`:this.sim.day;
    if(!force&&state.loopDay===loopToken&&state.loop)return state.loop;
    const members=this.members(taxonId),adults=this.members(taxonId,{adultsOnly:true}),pop=this.originPopulation(taxonId),affinities=new Set(members.map(a=>this.sim.populationMemory?.affinityFor?.(a)?.key).filter(Boolean));
    let loop={id:l.id,label:l.label,taxonId,taxonLabel:state.label,complete:false,title:'',body:'',target:null,status:''};
    if(l.id==='aquatic'){
      const centers=(this.sim.populationMemory?.populations?.()||[]).filter(p=>{if(p.primary&&taxonId!==ROOT_TAXON_ID)return false;if(p.taxonId&&p.taxonId!==taxonId)return false;const h=this.sim.populationMemory?.habitatAt?.(p);return(h?.waterEdge||0)>=.34||(h?.moisture||0)>=.68});
      const wetResidents=members.filter(a=>{const aff=this.sim.populationMemory?.affinityFor?.(a),p=aff?this.sim.populationMemory?.populationByKey?.(aff.key):null,h=p?this.sim.populationMemory?.habitatAt?.(p):null;return(h?.waterEdge||0)>=.34||(h?.moisture||0)>=.68}).length,target=centers[0]||this.wetMarginTarget(taxonId);
      loop.complete=!!centers.length&&wetResidents>=Math.max(1,Math.ceil(members.length*.35));loop.title=loop.complete?'Aquatic range established':'Open a wet-margin range';loop.body=loop.complete?`${wetResidents}/${members.length} ${state.label} now use wet-margin habitat · rivers are part of ordinary travel.`:`Lead or Scout ${state.label} toward wet ground, then establish a taxon settlement there. Aquatic bodies can cross water directly.`;loop.target=target?{x:target.x,y:target.y,label:'wet-margin habitat'}:null;loop.status=`wet residents ${wetResidents}/${members.length}`;
    }else if(l.id==='nomadic'){
      const away=adults.filter(a=>this.sim.migration?.isAway?.(a)).length,spread=affinities.size;const preferred=pop?this.sim.speciesCoexistence?.preferredSite?.(taxonId,pop):null;
      loop.complete=away>=Math.max(1,Math.ceil(adults.length*.4))&&spread>=2;loop.title=loop.complete?'Nomadic range is moving':'Move the Nomadic range';loop.body=loop.complete?`${away}/${adults.length} adults are ranging away from their old center across ${spread} known population areas.`:`Nomadic adults migrate on smaller habitat gains. Keep several adults ranging between population areas instead of pulling the whole taxon home.`;loop.target=preferred?{x:preferred.x,y:preferred.y,label:'next range'}:null;loop.status=`away ${away}/${adults.length} · ranges ${spread}`;
    }else if(l.id==='guardian'){
      const danger=this.guardianThreat(taxonId),shelters=this.taxonShelters(taxonId),holding=members.filter(a=>['guardian-hold','mob','guard'].includes(a.intent)).length;
      loop.complete=!danger;loop.title=danger?'Hold the defended range':'Guardian range secure';loop.body=danger?`${state.label} has a threat ${danger.distance.toFixed(1)} tiles from ${danger.anchor.label}. Healthy adults will hold the line instead of abandoning shelter and young.`:`No predator is currently pressing ${state.label}'s defended ground. Guardian adults remain biased toward kin and shelter.`;loop.target=danger?{x:danger.threat.x,y:danger.threat.y,label:'threat'}:(shelters[0]?{x:shelters[0].x,y:shelters[0].y,label:'defended shelter'}:null);loop.status=`defenders ${holding} · shelters ${shelters.length}`;
    }else if(l.id==='burrower'){
      this.markBurrowDens(taxonId);const dens=this.taxonShelters(taxonId).filter(s=>s.denStyle==='burrow'),inside=members.filter(a=>dens.some(s=>Math.hypot(a.x-s.x,a.y-s.y)<=1.8)).length;const target=dens[0]||this.sim.speciesCoexistence?.preferredSite?.(taxonId,pop);
      loop.complete=!!dens.length;loop.title=dens.length?'Burrow network active':'Establish a burrow den';loop.body=dens.length?`${inside}/${members.length} ${state.label} are currently using den cover · poor weather and fatigue pull adults back underground sooner.`:`Build or mark a taxon nest on firm ground. Burrower construction uses less material and becomes a deeper den.`;loop.target=target?{x:target.x,y:target.y,label:dens.length?'burrow den':'firm denning ground'}:null;loop.status=`dens ${dens.length} · inside ${inside}/${members.length}`;
    }else if(l.id==='hunter'){
      const hunter=adults.find(a=>a.player)||adults[0],prey=hunter?this.hunterPreyTarget(hunter):null,active=adults.filter(a=>a.intent==='hunt').length;
      loop.complete=row.huntKills>=1;loop.title=loop.complete?'Hunter feeding cycle complete':'Take live prey';loop.body=loop.complete?`${state.label} brought down live prey today. Hungry adults treat Hoppers and Diggers as normal food, and prey now flee or relay alarms when Hunters approach.`:`Find live prey and bring it down. Hunter adults pursue edible wildlife when hungry, and nearby prey now react to them as predators.`;loop.target=prey?{x:prey.x,y:prey.y,label:SPECIES[prey.species]?.label||'prey'}:null;loop.status=`hunts ${row.huntAttempts} · kills ${row.huntKills} · pursuing ${active}`;
    }else if(l.id==='grazer'){
      const grazer=adults.find(a=>a.player)||adults[0],ground=grazer?this.grazingGroundState(grazer):null,searchRadius=ground?.worn?14:12,food=grazer?this.grazerFoodTarget(grazer,{radius:searchRadius}):null,targetMeals=Math.max(2,Math.ceil(adults.length*.6)),forage=Math.round(clamp01((ground?.food||0)/8)*100);
      loop.complete=row.plantMeals>=targetMeals&&!ground?.depleted;
      if(ground?.depleted){loop.title='Move to fresh grazing';loop.body=`${state.label} has worked this ground down. Grazer adults now favor less-worn plant patches, so keep the branch moving toward fresh forage instead of stripping one site.`}
      else if(loop.complete){loop.title='Feeding ground holding';loop.body=`${state.label} has fed well without exhausting the current ground. Plant-rich patches remain useful until repeated grazing wears them down.`}
      else{loop.title='Work the feeding ground';loop.body=`Keep the branch feeding on plants. Grazer adults favor productive, less-worn patches and will range outward as a feeding ground is depleted.`}
      loop.target=food?{x:food.x,y:food.y,label:ground?.worn?'fresh forage':PLANTS[food.kind]?.label||'plant food'}:null;loop.status=`plant meals ${row.plantMeals}/${targetMeals} · forage ${forage}% · ground ${ground?.depleted?'depleted':ground?.worn?'worn':'steady'}`;
    }
    state.loopDay=loopToken;state.loop=loop;return loop;
  }
  threatDecision(animal,threat){
    if(!animal?.alive||this.sim.isManualPlayer?.(animal)||!threat||this.lifestyleFor(animal)?.id!=='guardian'||animal.age<SPECIES.genvo.maturity)return null;
    const spec=SPECIES.genvo;if(animal.health<55||animal.energy/spec.maxEnergy<.48)return null;
    const taxonId=this.taxonId(animal),danger=this.guardianThreat(taxonId);if(!danger||danger.threat.id!==threat.id)return null;
    const adults=this.members(taxonId,{adultsOnly:true}).filter(a=>a.health>=55&&Math.hypot(a.x-danger.anchor.x,a.y-danger.anchor.y)<=7);
    if(adults.length>=2&&Math.hypot(animal.x-threat.x,animal.y-threat.y)<=5.2)return{intent:'mob',target:threat};
    const dx=threat.x-danger.anchor.x,dy=threat.y-danger.anchor.y,len=Math.hypot(dx,dy)||1;return{intent:'guardian-hold',target:{x:danger.anchor.x+dx/len*1.8,y:danger.anchor.y+dy/len*1.8,guardian:true}};
  }
  autonomousDecision(animal){
    if(!animal?.alive||this.sim.isManualPlayer?.(animal)||!animal.lineage||animal.species!=='genvo'||animal.age<SPECIES.genvo.maturity)return null;
    const l=this.lifestyleFor(animal);if(!l)return null;const spec=SPECIES.genvo,e=animal.energy/spec.maxEnergy,h=animal.hydration/spec.maxHydration;
    if(l.id==='hunter'&&h>=.42&&e<this.feedingThreshold(animal)){const prey=this.hunterPreyTarget(animal);if(prey)return{intent:'hunt',target:prey,lifestyle:true}}
    if(l.id==='grazer'&&h>=.42){const ground=this.grazingGroundState(animal),needsFood=e<this.feedingThreshold(animal),rotate=ground.depleted&&e<.88;if(needsFood||rotate){const food=this.grazerFoodTarget(animal,{radius:rotate?14:10});if(food)return{intent:'feed',target:food,lifestyle:true,grazingShift:rotate}}}
    if(e<.58||h<.58)return null;
    const taxonId=this.taxonId(animal),loop=this.playStateForTaxon(taxonId);
    if(l.id==='aquatic'&&!loop?.complete&&loop?.target&&animal.id%2===0&&Math.hypot(animal.x-loop.target.x,animal.y-loop.target.y)>2.2)return{intent:'aquatic-range',target:{...loop.target,lifestyle:true}};
    if(l.id==='guardian'){
      const danger=this.guardianThreat(taxonId);if(!danger){const shelter=this.nearestTaxonShelter(animal,Infinity);if(shelter&&animal.id%3===0&&Math.hypot(animal.x-shelter.x,animal.y-shelter.y)>4.2)return{intent:'guardian-hold',target:{x:shelter.x,y:shelter.y,lifestyle:true}}}
    }
    if(l.id==='burrower'){
      const shelter=this.nearestTaxonShelter(animal,Infinity),weather=(this.sim.climate?.rain||0)>.52||(this.sim.climate?.temp||.55)<.38;if(shelter&&(weather||e<.70)&&Math.hypot(animal.x-shelter.x,animal.y-shelter.y)>1.6)return{intent:'burrow-return',target:{x:shelter.x,y:shelter.y,shelterId:shelter.id,lifestyle:true}};
    }
    return null;
  }
  habitatPreference(taxonId,target){
    const id=this.states.get(taxonId)?.lifestyle?.id||this.node(taxonId)?.lifestyle?.id;if(!id||!target)return null;
    const hab=this.sim.populationMemory?.habitatAt?.(target)||{moisture:.5,temperature:.58,waterEdge:0};
    if(id==='aquatic')return{score:clamp01(hab.waterEdge*.62+hab.moisture*.38),label:'wet margins'};
    if(id==='nomadic'){const cross=this.sim.speciesCoexistence?.competitionAt?.(target,{radius:7,taxonId})||{pressure:0};return{score:clamp01(.56+(1-cross.pressure)*.44),label:'open low-competition range'}}
    if(id==='guardian'){const predators=this.sim.populationEcology?.predatorCount?.(target.x,target.y,8)||0;return{score:clamp01(.68-predators*.12),label:'defensible family ground'}}
    if(id==='burrower')return{score:clamp01((1-hab.waterEdge)*.55+(1-Math.abs(hab.moisture-.42))*.45),label:'firm denning ground'};
    if(id==='hunter')return{score:clamp01(.30+this.preyDensityAt(target,8)*.12),label:'prey-rich hunting ground'};
    if(id==='grazer')return{score:clamp01(this.plantDensityAt(target,5)/6.5),label:'productive feeding ground'};
    return null;
  }
  goalFor(animal=this.sim.player?.()){
    if(!animal||!animal.alive||(this.sim.lineage?.highestGeneration||1)<4)return null;
    const taxonId=this.taxonId(animal),s=this.ensure(taxonId);
    if(s.lifestyle){const loop=this.playStateForTaxon(taxonId);if(!loop||loop.complete)return null;return{taxonId,label:s.label,title:loop.title,body:loop.body,lifestyle:s.lifestyle.id,score:1,target:loop.target,established:true,status:loop.status}}
    const e=s.lastEvidence||this.evidenceFor(taxonId),top=e.top;if(!top||!top.gate||top.score<.50)return null;const remain=Math.max(0,3-s.streak);
    return{taxonId,label:s.label,title:`${top.label} lifestyle forming`,body:`${top.detail} · keep living this way${remain?` for ${remain} more sustained day${remain===1?'':'s'}`:''}.`,lifestyle:top.id,score:top.score};
  }
  revealText(animal){const l=this.lifestyleFor(animal);if(!l)return'';const def=SPECIES_LIFESTYLES[l.id];return`${l.label} lifestyle · formed in ${l.taxonLabel||'this taxon'} on day ${l.formedDay} · ${def?.opportunity||''}`}
  chipText(animal){const l=this.lifestyleFor(animal);return l?`LIFE · ${l.short}`:''}
  lines(){
    const out=[];
    for(const t of this.sim.evolutionTree?.livingTaxa?.()||[]){
      const s=this.ensure(t.id),l=s.lifestyle,top=s.lastEvidence?.top;
      if(l){const loop=this.playStateForTaxon(t.id);out.push(`${s.label} · ${l.label.toUpperCase()} · ${SPECIES_LIFESTYLES[l.id]?.opportunity}${loop?.status?` · ${loop.status}`:''}`)}
      else if(top&&top.score>=.35)out.push(`${s.label} · ${top.label.toUpperCase()} forming ${Math.round(top.score*100)}% · sustained ${s.streak}/3`);
      else out.push(`${s.label} · lifestyle not yet established`);
    }
    return out;
  }
  summaryLine(){const states=[...(this.sim.evolutionTree?.livingTaxa?.()||[])].map(t=>this.ensure(t.id)),established=states.filter(s=>s.lifestyle).length,forming=states.filter(s=>!s.lifestyle&&(s.lastEvidence?.top?.score||0)>=.35).length;return`Species lifestyles ${established} established${forming?` · ${forming} forming`:''}`}
  consumeNotice(){const n=this.notice;this.notice=null;return n}
}
