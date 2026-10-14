import {attachHeadPlan,detachHeadPlan} from '../../src/lineage/head-plan.js';
import {PARTS,partDef} from '../../src/lineage/part-registry.js';
import {makePlan,validatePlan} from '../../src/lineage/body-plan.js';
export function starterPlan(rootId='small-torso'){
 const root=partDef(rootId);if(!root?.tags.includes('root'))throw Error('Choose a registered root body');
 const placements=[{partId:rootId,parent:null,socket:null}];
 const defaults={limb:'walking-leg',eye:'simple-eye',mouth:'grazing-mouth'};
 for(const socket of root.providedSockets)if(defaults[socket.type])placements.push({partId:defaults[socket.type],parent:'root',socket:socket.id});
 return checked(makePlan(placements));
}
export function checked(plan){const result=validatePlan(plan);if(!result.ok)throw Error(result.errors.join('; '));return plan;}
export function attachPart(plan,parentId,socketId,partId){
 if(parentId==='root'&&socketId==='head')return checked(attachHeadPlan(plan,partId));
 checked(plan);if(!PARTS[partId])throw Error('Unknown part');
 const parent=plan.nodes.find(n=>n.id===parentId),socket=partDef(parent?.partId)?.providedSockets.find(s=>s.id===socketId);
 if(!socket)throw Error('Parent does not provide that socket');
 const prefix=parentId+'/'+socketId;
 const retained=socket.max===1?plan.nodes.filter(n=>n.id!==prefix&&!n.id.startsWith(prefix+'/')):plan.nodes;
 return checked(makePlan([...retained.map(n=>({...n})),{partId,parent:parentId,socket:socketId}],{headMode:plan.headMode}));
}
export function removePart(plan,id){if(id==='root/head'){const result=detachHeadPlan(plan);if(!result.ok)throw Error(result.reason);return checked(result.plan)}if(id==='root')throw Error('A creature requires its root');return checked(makePlan(plan.nodes.filter(n=>n.id!==id&&!n.id.startsWith(id+'/')).map(n=>({...n})),{headMode:plan.headMode}));}
