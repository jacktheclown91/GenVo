import {PLANTS} from '../sim/config.js';
import {FRESHWATER_FOOD} from '../ecology/freshwater-food.js';
// Same manual/need-aware choice rule as ForagingController.selected, without
// allocating or modifying the controller's selection and meal memory.
export function foodChoiceView(sim){
 const actor=sim.player(),options=sim.foraging.options(actor),state=sim.foraging.states.get(actor?.id);
 let selected=state?.manual?options.find(o=>o.kind===state.selectedKind):null;
 if(!selected)selected=options.reduce((best,o)=>!best||o.needScore>best.needScore?o:best,null);
 const label=selected?(PLANTS[selected.kind]?.label||FRESHWATER_FOOD[selected.kind]?.label||selected.kind):'';
 return{count:options.length,kind:selected?.kind||null,label,canCycle:!sim.paused&&options.length>1};
}
