import {CFG} from '../sim/config.js';
import {SPECIES} from '../organisms/species.js';
import {canHunt} from './functional-diet.js';

// ActivityBudgetController shapes autonomous cadence without freezing the ecosystem.
// Player/founder-family behavior and active threats always stay on the full simulation cadence.
// Ambient wandering receives deterministic micro-pauses so wildlife does not read as one
// synchronized conveyor belt, while far-off autonomous decisions are evaluated less often.
export class ActivityBudgetController{
  constructor(sim){this.sim=sim}

  distanceToPlayer(a){const p=this.sim.player?.();return p&&a?Math.hypot(a.x-p.x,a.y-p.y):0}

  isUrgent(a){
    if(!a?.alive||a.player||a.lineage)return true;
    const s=SPECIES[a.species];if(!s)return true;
    if(a.playerHunt||a.playerThreat?.untilTick>this.sim.tickCount||a.familyRally?.untilTick>this.sim.tickCount)return true;
    if(a.hydration/s.maxHydration<.48||a.energy/s.maxEnergy<.52||a.health<74||a.infected)return true;
    if(['hunt','stalk-player','hunt-windup','charge-player','escape','group-alarm','mob','drink','feed','mate','shelter'].includes(a.intent))return true;
    return false;
  }


  movementStride(a){
    const p=this.sim.player?.();if(!p||!this.sim.playerEnabled||!a?.alive||a.player||a.lineage)return 1;
    const urgent=this.isUrgent(a),d=this.distanceToPlayer(a);
    // Keep the visible/extended gameplay zone fully continuous. Background wildlife advances
    // in compensated coarse steps so it still covers the same average distance without every
    // off-screen animal executing movement and contact work on every ecology beat.
    if(d>=CFG.farDecisionDistance)return urgent?Math.min(2,CFG.farMovementStride):CFG.farMovementStride;
    if(d>=CFG.backgroundDecisionDistance)return urgent?1:CFG.backgroundMovementStride;
    return 1;
  }

  movementBudget(a){
    const stride=this.movementStride(a);if(stride<=1)return{advance:true,scale:1,stride:1};
    const step=Math.floor(this.sim.tickCount/Math.max(1,CFG.lifeStride)),advance=((step+a.id*5)%stride)===0;
    return{advance,scale:advance?stride:0,stride};
  }

  ambientMoveAllowed(a){
    if(!a?.alive||a.player||a.lineage||this.isUrgent(a))return true;
    if(!['explore','core-patrol','return-den'].includes(a.intent))return true;
    const step=Math.floor(this.sim.tickCount/Math.max(1,CFG.lifeStride));
    // Species-specific, ID-offset windows keep idle wildlife from starting/stopping together.
    const hunter=canHunt(a),period=hunter?11:9,rest=hunter?3:2;
    return ((step+a.id*3+(hunter?2:0))%period)>=rest;
  }
}
