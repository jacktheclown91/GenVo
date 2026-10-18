import {tissueInventory} from './tissue-structure.js';
import {serializePlan} from '../lineage/body-plan.js';
import {validateTissueLedger,transferTissue} from './tissue-ledger.js';
// Inactive compiler: explicit allocation increments, never automatic growth,
// part catalog weights, species mass or existing game-energy meter conversion.
export const TISSUE_CONSTRUCTION_SCHEMA='genvo.tissue-construction/1';
const object=v=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype;
const keys=(v,allowed)=>object(v)&&Object.keys(v).every(k=>allowed.includes(k));
const count=v=>typeof v==='string'&&/^(0|[1-9][0-9]*)$/.test(v);
const identity=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9:._/-]*$/.test(v);
const order=(a,b)=>a<b?-1:a>b?1:0;
const canonical=v=>Array.isArray(v)?v.map(canonical):object(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>order(a,b)).map(([k,w])=>[k,canonical(w)])):v;
// Length prefixes prevent tuple collisions when IDs themselves contain slashes
// or colons. Module identities are supplied by the caller, not generated from
// reindexable body sockets. Whole-world identity binding remains integration work.
export function tissueComponentOwner(organismId,moduleId,component){return `tissue:${organismId.length}:${organismId}:${moduleId.length}:${moduleId}:${component}`}
export function fundTissueConstruction(ledger,request){
 const fail=(reason,details={})=>({ok:false,reason,state:ledger,...details});
 if(!validateTissueLedger(ledger).ok)return fail('invalid-ledger');
 if(!keys(request,['schema','id','reason','organismId','bodyPlan','quantityPolicy','units','sources','modules'])||request.schema!==TISSUE_CONSTRUCTION_SCHEMA||!identity(request.organismId)||!identity(request.quantityPolicy)||!keys(request.sources,['materialOwner','energyOwner','heatOwner'])||!Array.isArray(request.modules))return fail('invalid-construction');
 if(!keys(request.units,['mass','energy'])||['mass','energy'].some(axis=>!keys(request.units[axis],['unit','numerator','denominator'])||['unit','numerator','denominator'].some(k=>request.units[axis][k]!==ledger.units[axis][k])))return fail('unit-contract-mismatch');
 for(const owner of [request.sources.materialOwner,request.sources.energyOwner,request.sources.heatOwner])if(!identity(owner)||!Object.hasOwn(ledger.owners,owner))return fail('unknown-funding-owner');
 let inventory,serializedBody;try{inventory=tissueInventory(request.bodyPlan);serializedBody=serializePlan(request.bodyPlan)}catch(error){return fail('invalid-body',{errors:[error.message]})}if(!inventory.ok)return fail('invalid-body',{errors:inventory.errors});
 const entries=new Map(inventory.entries.map(e=>[e.nodeId,e])),modules=new Map(),moduleIds=new Set();
 for(const module of request.modules){if(!keys(module,['nodeId','moduleId','components'])||!entries.has(module.nodeId)||modules.has(module.nodeId)||!identity(module.moduleId)||moduleIds.has(module.moduleId)||!object(module.components))return fail('invalid-module-binding');modules.set(module.nodeId,module);moduleIds.add(module.moduleId)}
 if(modules.size!==entries.size)return fail('missing-module-binding');
 const createOwners=[],transfers=[],bindings=[],descriptors=[],emptyModules=[];let materialIncrement=0n;
 for(const entry of [...entries.values()].sort((a,b)=>order(a.nodeId,b.nodeId))){const module=modules.get(entry.nodeId),components=module.components;if(Object.keys(components).length!==entry.components.length||entry.components.some(c=>!Object.hasOwn(components,c)))return fail('incomplete-compartment-recipe',{nodeId:entry.nodeId});let moduleMaterial=0n;const owners={},recipe={};
  for(const component of [...entry.components].sort()){const allocation=components[component];if(!keys(allocation,['createOwner','materials','energy'])||typeof allocation.createOwner!=='boolean'||!object(allocation.materials)||!count(allocation.energy))return fail('invalid-compartment-recipe',{nodeId:entry.nodeId,component});
   const owner=tissueComponentOwner(request.organismId,module.moduleId,component);owners[component]=owner;recipe[component]=canonical(allocation);const existing=Object.hasOwn(ledger.owners,owner)?ledger.owners[owner]:null;if(!allocation.createOwner&&!existing)return fail('unknown-compartment-owner',{owner});if(allocation.createOwner)createOwners.push(owner);else for(const value of Object.values(existing.materials))moduleMaterial+=BigInt(value);
   for(const [material,amount]of Object.entries(allocation.materials).sort(([a],[b])=>order(a,b))){if(!ledger.materials.includes(material)||!count(amount))return fail('invalid-material-allocation',{nodeId:entry.nodeId,component,material});const n=BigInt(amount);moduleMaterial+=n;materialIncrement+=n;if(n>0n)transfers.push({from:request.sources.materialOwner,to:owner,kind:'material',material,amount})}
   if(BigInt(allocation.energy)>0n)transfers.push({from:request.sources.energyOwner,to:request.sources.heatOwner,kind:'energy',amount:allocation.energy});
  }
  if(moduleMaterial===0n)emptyModules.push(entry.nodeId);bindings.push({nodeId:entry.nodeId,moduleId:module.moduleId,partId:entry.partId,implicit:entry.implicit,owners});descriptors.push({nodeId:entry.nodeId,moduleId:module.moduleId,partId:entry.partId,components:recipe});
 }
 if(!Object.hasOwn(ledger.applied,request.id)){if(emptyModules.length)return fail('empty-physical-module',{nodeId:emptyModules[0]});if(!materialIncrement)return fail('no-construction-material');}
 const context=JSON.stringify(canonical({schema:TISSUE_CONSTRUCTION_SCHEMA,organismId:request.organismId,quantityPolicy:request.quantityPolicy,body:JSON.parse(serializedBody),units:request.units,sources:request.sources,modules:descriptors}));
 const funded=transferTissue(ledger,{id:request.id,reason:request.reason,context,createOwners,transfers});if(!funded.ok)return funded;
 // These are custody bindings only. No biological object, phenotype, function,
 // inherited module record, growth clock or World authority is installed here.
 return{...funded,bindings};
}
