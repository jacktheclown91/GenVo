import {coordinateExpression} from './expression-coordinator.js';
import {CFG} from '../sim/config.js';
// Presentation mapping v1. Read existing state; never call ensure/query
// helpers that can initialize biology, perception, memories or simulation RNG.
export function physicalExpressionSignals(sim,animal){
 const signals={};if(!animal?.alive)return signals;const tick=sim.tickCount;
 if(!Number.isInteger(tick)||tick<0)throw Error('Invalid simulation tick');
 if(Number.isFinite(animal.exertion)&&Number.isFinite(CFG.exertion.max)&&CFG.exertion.max>0)signals.fatigue={intensity:Math.max(0,Math.min(1,1-animal.exertion/CFG.exertion.max)),source:'exertion-reserve:v1',tick};
 const injury=animal.injuryCare,levels={sore:.25,wounded:.55,severe:.85};
 if(animal.player&&injury?.active&&Number.isFinite(injury.remaining)&&injury.remaining>0&&Number.isInteger(injury.lastHitTick)&&injury.lastHitTick>=0&&injury.lastHitTick<=tick&&Object.hasOwn(levels,injury.level))signals.pain={intensity:levels[injury.level],source:'authoritative-injury-severity:v1',tick};
 return signals;
}

// The renderer owns previous pose and elapsed presentation time. No simulation writes.
export function coordinatePhysicalExpression(sim,animal,{rig,action,dt,previous={}}){
 if(!rig?.parts)throw Error('Expression rig required');
 return coordinateExpression({tick:sim.tickCount,dt,signals:physicalExpressionSignals(sim,animal),parts:rig.parts,action,previous});
}
