// Persistent evolutionary-tree authority. Speciation decides whether a boundary is
// currently recognized; this controller preserves branch ancestry and history even
// when a young boundary later rejoins or a descendant taxon goes extinct.

export const ROOT_TAXON_ID='genvo8-root';

const statusRank={living:0,ancestral:1,rejoined:2,extinct:3};

export class EvolutionaryTreeController{
  constructor(sim){
    this.sim=sim;this.nodes=new Map();this.events=[];
    this.nodes.set(ROOT_TAXON_ID,{id:ROOT_TAXON_ID,label:'GenVo',parentId:null,parentLabel:null,depth:0,originPopulationKey:'home',originPopulationLabel:'Home Range',traitId:null,pressure:null,formedDay:1,formedGeneration:1,status:'living',endedDay:null,endedReason:null,recognitions:0,memberIds:new Set()});
  }
  root(){return this.nodes.get(ROOT_TAXON_ID)}
  node(id){return this.nodes.get(id)||null}
  currentBranchFor(animal){
    const raw=animal?.speciesBranch;if(!raw?.id)return null;const state=this.sim.speciation?.stateFor?.(raw.populationKey);return state?.recognized&&state.branch?.id===raw.id?raw:null;
  }
  taxonFor(animal){return this.currentBranchFor(animal)?.id||ROOT_TAXON_ID}
  taxonLabel(animal){return this.currentBranchFor(animal)?.label||'GenVo'}
  sameTaxon(a,b){return !!a&&!!b&&this.taxonFor(a)===this.taxonFor(b)}
  activeTaxon(){const animal=this.sim.player?.();if(!animal)return null;const id=this.taxonFor(animal),node=this.nodes.get(id)||this.root();return{id,label:node?.label||this.taxonLabel(animal),node,animal}}
  parentForPopulation(pop,cohort=[]){
    const counts=new Map();
    for(const animal of cohort||[]){const branch=this.currentBranchFor(animal);if(!branch?.id)continue;const row=counts.get(branch.id)||{id:branch.id,count:0,label:branch.label};row.count++;counts.set(branch.id,row)}
    const ranked=[...counts.values()].sort((a,b)=>b.count-a.count||a.id.localeCompare(b.id));
    if(ranked.length){const node=this.nodes.get(ranked[0].id);if(node)return node}
    return this.root();
  }
  referencePopulationFor(pop,cohort=[]){
    const parent=this.parentForPopulation(pop,cohort);const key=parent?.originPopulationKey||'home';return this.sim.populationMemory?.populationByKey?.(key)||this.sim.populationMemory?.populations?.().find(p=>p.key==='home')||null;
  }
  onRecognize(branch,evidence){
    const parent=this.parentForPopulation(evidence?.pop,evidence?.cohort),existing=this.nodes.get(branch.id);let node=existing;
    if(!node){node={id:branch.id,label:branch.label,parentId:parent.id,parentLabel:parent.label,nameOrigin:branch.nameOrigin||null,depth:(parent.depth||0)+1,originPopulationKey:branch.populationKey,originPopulationLabel:branch.populationLabel,traitId:branch.traitId,pressure:branch.pressure,formedDay:this.sim.day,formedGeneration:branch.recognizedGeneration||this.sim.lineage?.highestGeneration||1,status:'living',endedDay:null,endedReason:null,recognitions:1,memberIds:new Set()};this.nodes.set(node.id,node)}
    else{node.status='living';node.endedDay=null;node.endedReason=null;node.recognitions=(node.recognitions||0)+1}
    this.events.push({type:existing?'re-recognized':'formed',day:this.sim.day,generation:branch.recognizedGeneration||1,branchId:node.id,parentId:node.parentId,populationKey:branch.populationKey});
    return{...branch,label:node.label,nameOrigin:node.nameOrigin||null,parentId:node.parentId,parentLabel:node.parentLabel,treeDepth:node.depth};
  }
  onIdentityAssigned(animal,branch){
    if(!animal||!branch?.id)return;const node=this.nodes.get(branch.id);if(node)node.memberIds.add(animal.id);
    const history=Array.isArray(animal.speciesBranchHistory)?animal.speciesBranchHistory:[];if(!history.some(h=>h.id===branch.id))history.push({...branch,assignedDay:this.sim.day,assignedGeneration:animal.generation||1});animal.speciesBranchHistory=history;
    const rec=this.sim.lineage?.records?.get?.(animal.id);if(rec){rec.speciesBranch={...branch};rec.speciesBranchHistory=history.map(h=>({...h}))}
  }
  onBoundaryEnded(branch,reason,{extinct=false}={}){
    if(!branch?.id)return null;const node=this.nodes.get(branch.id);if(!node)return null;node.status=extinct?'extinct':'rejoined';node.endedDay=this.sim.day;node.endedReason=reason;this.events.push({type:node.status,day:this.sim.day,generation:this.sim.lineage?.highestGeneration||1,branchId:node.id,reason});return node;
  }
  historicalBranchIds(record){return new Set((record?.speciesBranchHistory||[]).map(h=>h.id).filter(Boolean))}
  livingCounts(){
    const rows=new Map([...this.nodes.keys()].map(id=>[id,{living:0,populations:new Map()}]));
    for(const a of this.sim.animals){if(!a.alive||!a.lineage||a.species!=='genvo')continue;const current=this.currentBranchFor(a),id=current?.id||ROOT_TAXON_ID,row=rows.get(id)||{living:0,populations:new Map()};row.living++;const affinity=this.sim.populationMemory?.affinityFor?.(a),key=affinity?.key||'home',label=affinity?.label||'Home Range';row.populations.set(key,label);rows.set(id,row)}
    return rows;
  }
  historicalCounts(){
    const counts=new Map([...this.nodes.keys()].map(id=>[id,0]));for(const rec of this.sim.lineage?.records?.values?.()||[]){for(const id of this.historicalBranchIds(rec))counts.set(id,(counts.get(id)||0)+1)}return counts;
  }
  snapshot(){
    const living=this.livingCounts(),historical=this.historicalCounts(),descendantLiving=[...living.entries()].some(([id,row])=>id!==ROOT_TAXON_ID&&row.living>0);
    const out=[];for(const node of this.nodes.values()){const row=living.get(node.id)||{living:0,populations:new Map()},history=historical.get(node.id)||0;let status=node.status;if(node.id===ROOT_TAXON_ID)status=row.living>0?'living':descendantLiving?'ancestral':'extinct';else if(node.status==='living'&&row.living===0)status='extinct';out.push({...node,memberIds:undefined,living:row.living,historicalMembers:history,populations:[...row.populations.entries()].map(([key,label])=>({key,label})),status})}
    return out.sort((a,b)=>a.depth-b.depth||statusRank[a.status]-statusRank[b.status]||a.formedDay-b.formedDay||a.label.localeCompare(b.label));
  }
  livingTaxa(){return this.snapshot().filter(n=>n.living>0)}
  leadershipSnapshot(animal=this.sim.player?.()){
    if(!animal)return null;const taxonId=this.taxonFor(animal),label=this.taxonLabel(animal),members=this.sim.animals.filter(a=>a.alive&&a.lineage&&a.species==='genvo'&&this.taxonFor(a)===taxonId),others=this.sim.animals.filter(a=>a.alive&&a.lineage&&a.species==='genvo'&&this.taxonFor(a)!==taxonId);
    const popRows=new Map(),add=(a,own)=>{const affinity=this.sim.populationMemory?.affinityFor?.(a),key=affinity?.key||'home',name=affinity?.label||'Home Range',row=popRows.get(key)||{key,label:name,own:0,other:0};row[own?'own':'other']++;popRows.set(key,row)};for(const a of members)add(a,true);for(const a of others)add(a,false);
    let closeContacts=0;for(const a of members)for(const b of others)if(Math.hypot(a.x-b.x,a.y-b.y)<=6)closeContacts++;const shared=[...popRows.values()].filter(r=>r.own&&r.other);
    return{taxonId,label,living:members.length,otherLiving:others.length,populations:[...popRows.values()].filter(r=>r.own),sharedPopulations:shared,closeContacts,multipleTaxa:this.livingTaxa().length>1};
  }
  nodePath(node){const path=[];let cur=node,seen=new Set();while(cur&&!seen.has(cur.id)){seen.add(cur.id);path.push(cur);cur=cur.parentId?this.nodes.get(cur.parentId):null}return path.reverse()}
  treeLines(){
    const snapshot=this.snapshot(),byId=new Map(snapshot.map(n=>[n.id,n])),children=new Map();for(const node of snapshot){if(!node.parentId)continue;const arr=children.get(node.parentId)||[];arr.push(node);children.set(node.parentId,arr)}for(const arr of children.values())arr.sort((a,b)=>a.formedDay-b.formedDay||a.label.localeCompare(b.label));
    const line=(node,depth)=>{const prefix=depth?'  '.repeat(Math.max(0,depth-1))+'└ ':'',state=node.status.toUpperCase(),pops=node.populations.length?` · ${node.populations.map(p=>p.label).join(', ')}`:'',history=node.id!==ROOT_TAXON_ID&&node.historicalMembers?` · historical ${node.historicalMembers}`:'';return`${prefix}${node.label} · ${state} · living ${node.living}${pops}${history}`};
    const out=[],walk=(node,depth=0)=>{out.push(line(node,depth));for(const child of children.get(node.id)||[])walk(child,depth+1)};const root=byId.get(ROOT_TAXON_ID);if(root)walk(root);for(const node of snapshot)if(!out.some(v=>v.includes(node.label)))out.push(line(node,node.depth||0));return out;
  }
  summaryLine(){const snap=this.snapshot(),living=snap.filter(n=>n.living>0).length,historical=snap.filter(n=>n.id!==ROOT_TAXON_ID).length,extinct=snap.filter(n=>n.status==='extinct'&&n.id!==ROOT_TAXON_ID).length,rejoined=snap.filter(n=>n.status==='rejoined').length;return`Evolutionary tree ${living} living taxa · ${historical} descendant branch${historical===1?'':'es'}${extinct?` · ${extinct} extinct`:''}${rejoined?` · ${rejoined} rejoined`:''}`}
}
