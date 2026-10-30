// Underground feeding (underground-feeding/1, October 30): an animal the AI moves
// underground eats through the same wild feeding interaction, at the same life-stride
// cadence, as it does on the surface. Before this rule the underground step used the
// player's eat action on every tick: underground eaters took up to a bite per tick
// instead of one per life stride, and gained player forage memory and its diet-breadth
// bonus, which surface wildlife never has.
import {CFG} from '../sim/config.js';
export const UNDERGROUND_FEEDING=Object.freeze({policy:'wild-underground-feeding/1'});
export const undergroundFeedingEnabled=sim=>sim?.undergroundFeedingRules===UNDERGROUND_FEEDING.policy;
// The best reachable underground meal (forage options are stateless), eaten through
// the ordinary wild interaction.
export function feedUnderground(sim,a){
 if(sim.tickCount%CFG.lifeStride!==0)return;
 let meal=null;for(const m of sim.foraging.options(a))if(!meal||m.needScore>meal.needScore)meal=m;
 if(!meal)return;
 a.intent='feed';a.target={x:meal.x,y:meal.y,kind:meal.kind};
 sim.resolveInteraction(a);
}
export function restoreUndergroundFeedingRules(sim,core){
 if(core.undergroundFeedingRules===undefined)delete sim.undergroundFeedingRules;
 else if(core.undergroundFeedingRules!==UNDERGROUND_FEEDING.policy)throw Error('Unknown saved underground feeding rules.');
}
