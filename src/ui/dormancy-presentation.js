import {torporStatus} from '../ecology/cold-wildlife.js';
import {aestivating,aestivationStatus,aridPhysiologyEnabled} from '../ecology/arid-physiology.js';

export function dormancyCaption(animal){
 if(!animal?.torpor)return null;
 return aestivating(animal)?'In drought dormancy':'In deep winter torpor';
}
// Mirror the existing toggle's choice, using its read-only availability owners.
// This is button presentation only; playerToggleTorpor still executes the action.
export function dormancyAction(sim,animal=sim.player()){
 const cold=torporStatus(sim,animal);
 if(!aridPhysiologyEnabled(sim))return{...cold,label:animal?.torpor?'Wake':'Torpor'};
 if(aestivating(animal))return{...aestivationStatus(sim,animal),label:'Wake'};
 if(cold.enabled)return{...cold,label:animal?.torpor?'Wake':'Winter torpor'};
 const dry=aestivationStatus(sim,animal);
 return dry.enabled?{...dry,label:'Drought dormancy'}:{...cold,label:'Dormancy',reason:cold.reason+' Drought dormancy: '+dry.reason};
}
