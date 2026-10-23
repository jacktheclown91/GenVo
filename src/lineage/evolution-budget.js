import {SPECIES} from '../organisms/species.js';

// Evolution Expansion (GDD v1, section 7.2): the mutation budget for a reproductive handoff.
// Base 8 MP per evolutionary handoff, plus an explicitly capped earned bonus (+0 to +4) from
// adaptive opportunities the lineage actually lived through since the previous handoff. The
// numbers are the GDD's proposed tuning, to be revised after playtests.
//
// Phase A: this only keeps the activity ledger and values the budget. Nothing spends it, nothing
// is shown, and it never edits a living creature; the Phase C editor will spend it on a draft of
// the next-generation lineage target. Salvaged from the paused v1.34.0 "Shape and spring" pass,
// whose newborn nudge and uncapped spending were removed.
export const BUDGET=Object.freeze({
  baseMP:8,
  bonusCap:4,
  // Adaptive-opportunity points needed per +1 MP of bonus (proposed).
  pointsPerBonus:6,
  rewards:{youngRaised:3,stalkerSurvived:2,hunt:1,firstHome:3,pressureEndured:1,birth:1,taught:1,trial:3,discovery:1},
  labels:{trial:'completed a trial',discovery:'discovered a place',youngRaised:'a young one grew up',stalkerSurvived:'survived a Stalker',hunt:'a successful hunt',firstHome:'built the first home',pressureEndured:'endured hard conditions',birth:'a young one was born',taught:'a young one was shown a place'},
  // Daily caps keep trivial repetition from paying (GDD: never from repetitive grinding).
  dailyCaps:{stalkerSurvived:2,hunt:3,pressureEndured:1,birth:2,taught:1,discovery:3},
  pressureEndured:.45
});
const SURVIVED=new Set(['escaped','outrun','lost','evaded','driven-off','deterred','braced','countered']);

export class EvolutionBudgetController{
  constructor(sim){this.sim=sim;this.sinceHandoff=0;this.total=0;this.log=[];this.daily={day:-1,counts:{}};this.matured=[];this.firstHomeCredited=false}

  note(kind){
    const amount=BUDGET.rewards[kind];if(!this.sim.playerEnabled||!(amount>0))return 0;
    if(this.daily.day!==this.sim.day)this.daily={day:this.sim.day,counts:{}};
    const cap=BUDGET.dailyCaps[kind];if(cap!=null&&(this.daily.counts[kind]||0)>=cap)return 0;
    this.daily.counts[kind]=(this.daily.counts[kind]||0)+1;this.sinceHandoff+=amount;this.total+=amount;
    this.log.unshift({kind,amount,day:this.sim.day,year:this.sim.year});if(this.log.length>24)this.log.length=24;
    return amount;
  }
  // The capped earned bonus and the budget a handoff opened now would have.
  earnedBonus(){return Math.max(0,Math.min(BUDGET.bonusCap,Math.floor(this.sinceHandoff/BUDGET.pointsPerBonus)))}
  budget(){return BUDGET.baseMP+this.earnedBonus()}
  // A committed lineage design is the evolutionary handoff: it uses up the earned bonus.
  consume(){const spent={budget:this.budget(),bonus:this.earnedBonus()};this.sinceHandoff=0;return spent}

  // Event hooks from existing authorities.
  noteDanger(animal,outcome){if(animal&&(animal.player||this.sim.isManualPlayer?.(animal))&&SURVIVED.has(outcome))this.note('stalkerSurvived')}
  noteHunt(pred,killed){if(killed&&pred?.player)this.note('hunt')}
  noteBirth(child){if(child?.lineage)this.note('birth')}
  noteTaught(child){if(child?.lineage)this.note('taught')}
  advanceDay(){
    if(!this.sim.playerEnabled)return;const seen=new Set(this.matured);
    for(const a of this.sim.animals){const maturity=SPECIES[a.species]?.maturity;if(!a.alive||!a.lineage||!Number.isFinite(maturity)||(a.generation||1)<2||a.age<maturity||seen.has(a.id))continue;this.matured.push(a.id);this.note('youngRaised')}
    if(this.matured.length>200)this.matured=this.matured.slice(-200);
    if(!this.firstHomeCredited&&this.sim.shelter?.activeShelters?.().length){this.firstHomeCredited=true;this.note('firstHome')}
    const p=this.sim.player();const strongest=p?this.sim.pressure?.strongest?.(p):null;if(strongest&&(strongest.severity??strongest.score??0)>=BUDGET.pressureEndured)this.note('pressureEndured');
  }
}
