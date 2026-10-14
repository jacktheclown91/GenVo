import {PARTS} from '../lineage/part-registry.js';
import {validatePlan} from '../lineage/body-plan.js';

// Structural proposal only: no densities or tissue volumes are inferred from art,
// declared mutation weights, labels, reserve meters or body genes.
export const TISSUE_SCHEMA='genvo.tissue-calibration/1';
const groups={
  core:['head-base','small-torso','soft-torso','reinforced-torso','sleek-torso','light-torso','stout-torso','barrel-torso','dome-torso','long-torso'],
  limb:['walking-leg','spring-leg','grasper','runner-leg','sturdy-leg','webbed-leg','padded-leg','digging-forelimb'],
  feeding:['grazing-mouth','tearing-jaw','crushing-jaw','beak-mouth','kernel-beak','filter-mouth','reed-sieve-mouth','nibbler-mouth','sucker-mouth','gape-mouth','tusk-jaw'],
  sensory:['simple-eye','wide-field-eye','hunter-eye','stalk-eye','compound-eye','tracker-eye','display-eye','eyespot','glow-eye','echo-crest','sensory-quills','sensory-bristle'],
  protective:['armor-plate','barb','claw','horn-crest','shell-back','armored-hide','spine-ridge','thorn-carapace','spine-cluster','hook-spur','dew-claw','heel-spike','kick-spur'],
  gland:['venom-gland','scent-gland'],
  organ:['storage-sac','sail-fin','water-hump','fat-pad','gill-slits','brood-pouch','egg-chamber','live-womb','moss-back'],
  appendage:['silt-fin','signal-crest','paddle-tail','gliding-membrane','luminous-tail','balance-tail','club-tail','spined-tail','whip-tail','prehensile-tail','fat-tail','flag-tail','display-frill','grip-pad']
};
// Named partitions are volume ownership slots, not claims about universal skeletons.
// Support can be filled with the reviewed material for each part (bone, cartilage,
// chitin, etc.). Empty partitions use volume zero in a reviewed calibration.
const partitions={core:['muscle','support','organ','covering'],limb:['muscle','support','covering'],feeding:['muscle','support','organ','covering'],sensory:['organ','support','covering'],protective:['support','covering'],gland:['organ','covering'],organ:['organ','covering'],appendage:['muscle','support','covering']};
const catalog={};for(const [group,ids] of Object.entries(groups))for(const id of ids){
  if(!PARTS[id]||catalog[id])throw Error('Invalid tissue catalog part '+id);
  catalog[id]=Object.freeze({partId:id,group,components:Object.freeze([...partitions[group]]),volumeBasis:'adult net tissue excluding mounted children and contents'});
}
if(Object.keys(catalog).length!==Object.keys(PARTS).length)throw Error('Tissue catalog must cover every registered part');
export const TISSUE_PARTS=Object.freeze(catalog);

export function tissueInventory(plan){
  const validation=validatePlan(plan);if(!validation.ok)return{ok:false,reason:'invalid-body',errors:validation.errors,entries:[]};
  const entries=plan.nodes.map(n=>({nodeId:n.id,partId:n.partId,components:TISSUE_PARTS[n.partId].components,implicit:false}));
  // Match the existing assembly's legacy implicit head without adding a graph node.
  const face=plan.nodes.some(n=>n.parent==='root'&&(n.socket==='mouth'||n.socket?.startsWith('eye')));
  if(face&&plan.headMode!=='torso'&&!plan.nodes.some(n=>n.parent==='root'&&n.socket==='head'))entries.push({nodeId:'@implicit-head',partId:'head-base',components:TISSUE_PARTS['head-base'].components,implicit:true});
  return{ok:true,entries,ownership:'Each mounted structure owns only its net tissue. Torso excludes head, mounted organs and resource contents. Mouth/eye tissue is excluded from its host head. Contents need a separate conserved-volume contract before inclusion.'};
}

// Evaluate an explicitly supplied draft. This never installs a gameplay calibration.
export function evaluateTissueStructure(plan,calibration,{growth=1}={}){
  const inventory=tissueInventory(plan);if(!inventory.ok)return inventory;
  const missing=[],errors=[],rows=[];
  if(!calibration||calibration.schema!==TISSUE_SCHEMA)return{ok:false,reason:'uncalibrated',missing:['explicit tissue calibration'],inventory};
  if(calibration.units?.volume!=='m3'||calibration.units?.density!=='kg/m3')errors.push('Calibration units must be m3 and kg/m3');
  if(!Number.isFinite(growth)||growth<=0)errors.push('Growth must be finite and positive');
  for(const entry of inventory.entries)for(const component of entry.components){
    const key=entry.partId+'.'+component,slot=calibration.parts?.[entry.partId]?.[component];
    if(!slot){missing.push(key);continue}
    const density=calibration.materials?.[slot.material]?.density;
    if(!Number.isFinite(slot.volume)||slot.volume<0){errors.push(key+' has invalid net volume');continue}
    if(!Number.isFinite(density)||density<=0){errors.push(key+' has invalid material density');continue}
    const volume=slot.volume*growth**3;if(!Number.isFinite(volume)||!Number.isFinite(volume*density)){errors.push(key+' exceeds finite physical range');continue}rows.push({...entry,component,material:slot.material,adultVolume:slot.volume,volume,mass:volume*density});
  }
  if(errors.length||missing.length)return{ok:false,reason:errors.length?'invalid-calibration':'uncalibrated',errors,missing,inventory};
  const volume=rows.reduce((v,r)=>v+r.volume,0),mass=rows.reduce((m,r)=>m+r.mass,0);
  if(!Number.isFinite(volume)||!Number.isFinite(mass))return{ok:false,reason:'invalid-calibration',errors:['Aggregate exceeds finite physical range'],inventory};
  return{ok:true,status:'draft-only',volume,mass,rows,units:{volume:'m3',mass:'kg'},excluded:['stored food and water','embryos and carried objects'],growth};
}
