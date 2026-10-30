import {starterPlan,attachPart} from '../creature-lab/assembly-model.js';
import {makePlan} from '../../src/lineage/body-plan.js';
export function studyCreatures(){
  const base=(root,leg='walking-leg')=>{
    const p=starterPlan(root);
    return makePlan(p.nodes.map(n=>n.socket?.startsWith('limb.')?{...n,partId:leg}:n));
  };
  const animal=(id,name,plan)=>({id,name,bodyPlan:plan,species:'genvo',alive:true,age:30,dir:2,
    genes:{body:1,motion:1,senses:1,temperament:1},adaptations:[],genVersion:0});
  return[
    animal(71001,'Small ground forager',base('small-torso')),
    animal(71002,'Fur-mantled runner',attachPart(attachPart(base('soft-torso','runner-leg'),'root','dorsal','fur-mantle'),'root','tail','balance-tail')),
    animal(71003,'Shelled sturdy walker',attachPart(base('dome-torso','sturdy-leg'),'root','dorsal','shell-back')),
    animal(71004,'Feathered compound-eye forager',attachPart(attachPart(attachPart(attachPart(base('soft-torso'),'root','dorsal','feather-mantle'),'root','eye.left','compound-eye'),'root','eye.right','compound-eye'),'root','mouth','beak-mouth'))
  ];
}
