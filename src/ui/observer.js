import {canHunt} from '../ecology/functional-diet.js';
import {CFG} from '../sim/config.js';
import {SPECIES} from '../organisms/species.js';

// v1.29 Observer Play: 1x / 2x / 4x time, tied to AUTO.
// Speeding up hands the selected creature to its own AI. Taking manual control, or any
// danger to the creature or its family, drops back to 1x and reports what happened while
// time ran faster. Speed is a runtime presentation choice: it is not saved, and the
// simulation still advances through the same control steps and ecology ticks.
export const OBSERVER_SPEEDS=Object.freeze([1,2,4]);

export class ObserverController{
  constructor(getSim){this.getSim=getSim;this.speed=1;this.capture=null;this.lastDangerCheckTick=-1;this._threat={hunter:null}}
  get sim(){return this.getSim()}
  reset(){this.speed=1;this.capture=null}

  // Raising the speed turns on AUTO. Returns a result for feedback.
  setSpeed(next,reason='manual'){
    const sim=this.sim,speed=OBSERVER_SPEEDS.includes(next)?next:1;if(!sim)return{ok:false,speed:this.speed};
    if(speed>1&&!sim.player())return{ok:false,speed:this.speed,message:'There is no living creature to follow.'};
    if(speed>1&&this.speed===1){
      const danger=this.dangerReason(true);
      if(danger)return{ok:false,speed:1,message:`Not now · ${danger}.`};
      if(!sim.playerAutonomy)sim.setPlayerAutonomy(true);
      this.capture=this.snapshot();
    }
    const was=this.speed;this.speed=speed;
    if(speed===1&&was>1){const summary=this.summary(reason);this.capture=null;return{ok:true,speed,summary,reason}}
    return{ok:true,speed,message:speed>1?`${speed}x · the selected creature acts on its own · move or act to take over`:''};
  }
  cycle(step=1){const i=OBSERVER_SPEEDS.indexOf(this.speed),n=Math.max(0,Math.min(OBSERVER_SPEEDS.length-1,i+(step<0?-1:1)));return this.setSpeed(OBSERVER_SPEEDS[n])}
  cycleWrap(){const i=OBSERVER_SPEEDS.indexOf(this.speed);return this.setSpeed(OBSERVER_SPEEDS[(i+1)%OBSERVER_SPEEDS.length])}

  // Any manual input returns to 1x.
  onManualInput(){return this.speed>1?this.setSpeed(1,'manual'):null}

  // Called a few times per real second. Drops to 1x when something needs the player.
  observe(){
    if(this.speed===1)return null;const sim=this.sim;
    if(!sim?.playerAutonomy)return this.setSpeed(1,'manual');
    const danger=this.dangerReason(false);
    return danger?this.setSpeed(1,danger):null;
  }

  dangerReason(fresh=false){
    const sim=this.sim,p=sim?.player();if(!p)return'the family line needs you';
    const startTick=fresh?sim.tickCount:(this.capture?.tick??sim.tickCount);
    if(sim.lastPlayerDamage&&sim.lastPlayerDamage.tick>startTick&&!fresh)return'your creature was hurt';
    const status=sim.predator?.playerStatus?.(p);
    if(status&&(status.phase==='windup'||status.phase==='charge'||status.distance<7))return'a Stalker is hunting your creature';
    if(this.capture&&!fresh){
      const deaths=this.lineageCounts().dead;if(deaths>this.capture.dead)return'a family member died';
      if(p.id!==this.capture.playerId)return'control moved to another family member';
    }
    // A hunter closing on a relative near the selected creature.
    this._threat.hunter=null;const r=10,r2=r*r;
    sim.forEachNearby(p,r,b=>{if(!b.alive||!canHunt(b))return;const t=b.target;if(t&&t.alive&&t.lineage&&t.species==='genvo'&&(b.intent==='hunt'||b.intent==='stalk-player'||b.intent==='charge-player')){const dx=b.x-p.x,dy=b.y-p.y;if(dx*dx+dy*dy<=r2){this._threat.hunter=b;return false}}});
    if(this._threat.hunter){this._threat.hunter=null;return'a Stalker is hunting your family'}
    if(sim.isOpeningProtected?.(p)===false&&p.health<35)return'your creature is badly hurt';
    return null;
  }

  lineageCounts(){
    const sim=this.sim;let total=0,dead=0;for(const r of sim.lineage?.records?.values?.()||[]){total++;if(!r.alive)dead++}
    return{total,dead};
  }
  snapshot(){
    const sim=this.sim,counts=this.lineageCounts(),p=sim.player(),deadIds=new Set();
    for(const [id,r] of sim.lineage?.records||[])if(!r.alive)deadIds.add(id);
    return{tick:sim.tickCount,day:sim.day,year:sim.year,total:counts.total,dead:counts.dead,deadIds,highestGeneration:sim.lineage?.highestGeneration||1,shelters:sim.shelter?.activeShelters?.().length||0,playerId:p?.id??null,energy:p?.energy??0};
  }

  // Plain-language report of what changed while time ran faster.
  summary(reason='manual'){
    const sim=this.sim,c=this.capture;if(!sim||!c)return null;
    const days=Math.max(0,(sim.year-c.year)*CFG.seasonDays*4+(sim.day-c.day)),counts=this.lineageCounts();
    const births=Math.max(0,counts.total-c.total),causes={};
    for(const [id,r] of sim.lineage?.records||[])if(!r.alive&&!c.deadIds.has(id))causes[r.cause||'unknown']=(causes[r.cause||'unknown']||0)+1;
    const deaths=Object.values(causes).reduce((a,b)=>a+b,0),parts=[];
    parts.push(days===1?'1 day passed':`${days} days passed`);
    if(births)parts.push(`${births} born`);
    if(deaths)parts.push(`${deaths} died (${Object.entries(causes).map(([k,v])=>`${v} ${CAUSE_LABEL[k]||k}`).join(', ')})`);
    const gen=sim.lineage?.highestGeneration||1;if(gen>c.highestGeneration)parts.push(`reached Generation ${gen}`);
    const shelters=sim.shelter?.activeShelters?.().length||0;if(shelters>c.shelters)parts.push(`${shelters-c.shelters} new shelter${shelters-c.shelters===1?'':'s'}`);
    if(!births&&!deaths&&parts.length===1)parts.push('the family held steady');
    const why=reason==='manual'?'Back to 1x':`Slowed to 1x · ${reason}`;
    return{days,births,deaths,causes,text:`${why} · ${parts.join(' · ')}`,danger:reason!=='manual'};
  }
}

const CAUSE_LABEL={predation:'to predators',starvation:'of hunger',dehydration:'of thirst',disease:'of illness',age:'of old age',health:'of poor health',exposure:'of exposure'};
