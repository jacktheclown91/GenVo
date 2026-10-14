import {CFG} from '../sim/config.js';

// Short-term exertion for the directly controlled creature.
// This is breath, not food: sprinting, bracing and attacking spend it, walking and
// standing recover it quickly. Running dry only removes the sprint/brace option and
// slows attacks until breath returns; it never reduces walking speed or causes collapse.
export class ExertionController{
  constructor(sim){this.sim=sim}

  ensure(a){
    if(!a)return a;
    if(!Number.isFinite(a.exertion))a.exertion=CFG.exertion.max;
    if(typeof a.exertionWinded!=='boolean')a.exertionWinded=false;
    if(!Number.isFinite(a.exertionDelay))a.exertionDelay=0;
    return a;
  }
  ratio(a){if(!a)return 1;this.ensure(a);return Math.max(0,Math.min(1,a.exertion/CFG.exertion.max))}
  isWinded(a){return !!(a&&this.ensure(a).exertionWinded)}
  canSprint(a){if(!a)return false;this.ensure(a);return !a.exertionWinded&&a.exertion>0}
  canStartBrace(a){if(!a)return false;this.ensure(a);return !a.exertionWinded&&a.exertion>=CFG.exertion.braceStartMin}

  // Spend breath. Returns the amount actually spent so callers can scale a weak action.
  spend(a,amount){
    if(!a||!(amount>0))return 0;this.ensure(a);
    const spent=Math.min(a.exertion,amount);a.exertion-=spent;a.exertionDelay=CFG.exertion.recoverDelay;
    if(a.exertion<=.001){a.exertion=0;a.exertionWinded=true}
    return spent;
  }

  // One control step. `sprinting` and `bracing` are the already-resolved actions.
  step(a,dt,{moving=false,sprinting=false,bracing=false}={}){
    if(!a||!(dt>0))return;this.ensure(a);const E=CFG.exertion;
    if(sprinting)this.spend(a,E.sprintDrain*dt);
    else if(bracing)this.spend(a,E.braceDrain*dt);
    else if(a.exertionDelay>0)a.exertionDelay=Math.max(0,a.exertionDelay-dt);
    else if(a.exertion<E.max)a.exertion=Math.min(E.max,a.exertion+(moving?E.walkRecover:E.idleRecover)*dt);
    if(a.exertionWinded&&a.exertion>=E.windedRecoverTo)a.exertionWinded=false;
  }

  status(a){
    if(!a)return null;this.ensure(a);
    return{value:a.exertion,max:CFG.exertion.max,ratio:this.ratio(a),winded:a.exertionWinded};
  }
}
