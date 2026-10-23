import {SPECIES} from '../organisms/species.js';

// v1.30 Habits: what a creature repeatedly does becomes how it behaves on its own.
// Each lineage GenVo8 carries five small habit values (0..1). The directly controlled
// creature learns fastest from what the player does; autonomous creatures slowly
// reinforce what they already do; young copy their caregivers a little each day.
// Habits are read by the existing autonomous decisions (threat response, forage range,
// roaming, hunting) and aggregated by the family tendency controller. They are not
// inherited genetically: a habit only reaches the next generation by being seen.
export const HABIT_KEYS=Object.freeze(['range','home','caution','boldness','hunting']);
export const HABIT_LABELS=Object.freeze({range:'ranges far to feed',home:'stays near home',caution:'wary of Stalkers',boldness:'stands its ground',hunting:'hunts small prey'});
const OPPOSITE={range:'home',home:'range',caution:'boldness',boldness:'caution'};

export class HabitController{
  constructor(sim){this.sim=sim}

  applies(a){return !!(a?.alive&&a.lineage&&a.species==='genvo')}
  ensure(a){if(a&&!a.habits)a.habits={range:0,home:0,caution:0,boldness:0,hunting:0};return a?.habits||null}
  value(a,key){return a?.habits?.[key]||0}

  // Reinforce a habit. The manually controlled creature learns at full rate.
  reinforce(a,key,amount,{scale=null}={}){
    if(!this.applies(a)||!(amount>0))return 0;const h=this.ensure(a);
    const rate=scale??(this.sim.isManualPlayer?.(a)?1:.35),gain=amount*rate*(1-h[key]);
    h[key]=Math.min(1,h[key]+gain);const opp=OPPOSITE[key];if(opp)h[opp]=Math.max(0,h[opp]-gain*.45);
    return gain;
  }

  // Event hooks, called from the existing authorities.
  noteFeed(a){
    if(!this.applies(a))return;const d=this.homeDistance(a);if(!Number.isFinite(d))return;
    if(d>8)this.reinforce(a,'range',.04);else if(d<4)this.reinforce(a,'home',.03);
  }
  noteDanger(a,outcome){
    if(!this.applies(a))return;this.sim.evolutionBudget?.noteDanger?.(a,outcome);
    if(outcome==='escaped'||outcome==='outrun'||outcome==='lost'||outcome==='evaded')this.reinforce(a,'caution',.1);
    else if(outcome==='driven-off'||outcome==='deterred'||outcome==='braced'||outcome==='countered')this.reinforce(a,'boldness',.12);
    else if(outcome==='hit')this.reinforce(a,'caution',.04);
  }
  noteHide(a){this.reinforce(a,'caution',.05)}
  noteHunt(a){this.reinforce(a,'hunting',.06)}
  noteStand(a){this.reinforce(a,'boldness',.03)}
  noteFlee(a){this.reinforce(a,'caution',.012)}

  homeDistance(a){
    const shelter=this.sim.shelter?.nearest?.(a,{radius:Infinity,familyOnly:true});
    if(shelter)return Math.hypot(a.x-shelter.x,a.y-shelter.y);
    const home=this.sim.territory?.state?.(a)?.home;return home?Math.hypot(a.x-home.x,a.y-home.y):Infinity;
  }

  // Young copy whoever cares for them, a little each day while they stay close.
  imitate(child,caregiver,strength=.08){
    if(!this.applies(child)||!caregiver?.alive||!caregiver.habits)return false;const h=this.ensure(child);
    for(const k of HABIT_KEYS)h[k]+=(caregiver.habits[k]-h[k])*strength;
    return true;
  }

  advanceDay(){
    for(const a of this.sim.animals){
      if(!this.applies(a))continue;const h=this.ensure(a);
      for(const k of HABIT_KEYS)h[k]*=.985;
      if(this.sim.family?.isDependent?.(a)){const cg=this.sim.family.caregiver(a);if(cg&&Math.hypot(cg.x-a.x,cg.y-a.y)<=5)this.imitate(a,cg)}
      else{const d=this.homeDistance(a);if(d>9)this.reinforce(a,'range',.02);else if(d<4)this.reinforce(a,'home',.02)}
    }
  }

  // Readers for autonomous behavior.
  threatRadiusMultiplier(a){if(!a?.habits)return 1;return 1+a.habits.caution*.5-a.habits.boldness*.2}
  forageRangeMultiplier(a){if(!a?.habits)return 1;return 1+a.habits.range*.6-a.habits.home*.3}
  standsGround(a){const h=a?.habits;return !!(h&&h.boldness>.45&&h.boldness>h.caution+.1&&a.health>60&&a.age>=SPECIES.genvo.maturity&&!this.sim.family?.isDependent?.(a))}
  huntRadius(a){const h=a?.habits;return h&&h.hunting>.4?8+h.hunting*8:0}
  rangeStyle(a){const h=a?.habits;if(!h)return null;if(h.range>.4&&h.range>h.home+.1)return'forager';if(h.home>.4&&h.home>h.range+.1)return'colony';return null}

  // Short plain summary for creature cards.
  summary(a,{limit=2}={}){
    const h=a?.habits;if(!h)return'no settled habits yet';
    const top=HABIT_KEYS.map(k=>[k,h[k]]).filter(([,v])=>v>=.25).sort((x,y)=>y[1]-x[1]).slice(0,limit);
    if(!top.length)return this.sim.family?.isDependent?.(a)?'still copying its caregiver':'no settled habits yet';
    return top.map(([k,v])=>`${v>=.6?'strongly ':''}${HABIT_LABELS[k]}`).join(' · ');
  }

  // Family-wide averages for the tendency controller.
  familyAverages(adults){
    const out={range:0,home:0,caution:0,boldness:0,hunting:0,count:0};
    for(const a of adults){if(!a.habits)continue;out.count++;for(const k of HABIT_KEYS)out[k]+=a.habits[k]}
    if(out.count)for(const k of HABIT_KEYS)out[k]/=out.count;
    return out;
  }
}
