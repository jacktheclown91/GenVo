import {pruneUnusedFloraGenomesSteps} from './flora-genome-lifetime.js';
import {drain} from '../sim/resumable.js';
import {plantLifecycleEnabled,canFlower} from './plant-lifecycle.js';
import {WIND_SEED_POLICIES,planetaryWindSeedOffset} from '../world/weather-fronts.js';
// Staged botanical reproduction, owned by the existing dispersal/vegetation phase.
// Stocks are converted from real crop flesh; no new biomass or animal RNG is created.
import {PLANTS} from '../sim/config.js';
import {FLORA_TISSUES,validFloraGenome} from './flora-genotype.js';
import {CLONAL_MUTATION,registerFloraGenome} from './flora-inheritance.js';
import {exportPlantReserve,PLANT_RESOURCE_UNITS} from './plant-resources.js';
import {resolveBotanicalFloraGenome,validBotanicalGenome,validBotanicalGamete,botanicalHash,botanicalGamete,botanicalStructure,recognizeBotanicalPollen,sexualFloraGenome,botanicalSeedViability,botanicalHomozygosity,freezeBotanical} from './botanical-genetics.js';
const embryoIndexes=new WeakMap();
const directions=[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]],key=(kind,i)=>kind+':'+i;
export function initializeBotanicalReproduction(d){
 d.botanical||={schema:1,epoch:0,serial:0,adultGenomes:new Map(),adultOrigins:new Map(),flowers:new Map(),pollen:new Map(),embryos:[],receipts:[],stats:{pollenProduced:0,ovulesInvested:0,delivered:0,recognized:0,rejected:0,fertilized:0,viable:0,nonviable:0,released:0,selfed:0,crossed:0}};
 const b=d.botanical;b.adultOrigins||=new Map();if(!(b.adultOrigins instanceof Map)||[...b.adultOrigins.values()].some(v=>typeof v!=='string'))throw Error('Invalid botanical producer identities.');if(b.schema!==1||!Number.isSafeInteger(b.serial)||b.serial<0||!Number.isSafeInteger(b.epoch)||b.epoch<0||!(b.adultGenomes instanceof Map)||!(b.flowers instanceof Map)||!(b.pollen instanceof Map)||!Array.isArray(b.embryos)||!Array.isArray(b.receipts)||b.receipts.length>128||!b.stats||Object.values(b.stats).some(v=>!Number.isFinite(v)||v<0))throw Error('Invalid botanical reproductive state.');
 for(const [k,genome] of b.adultGenomes){const [kind,cell]=k.split(':');if(!FLORA_TISSUES[kind]||!validCell(d,Number(cell))||!validBotanicalGenome(genome))throw Error('Invalid botanical recognition genotype.');}
 const flowers=[...b.flowers.values()],pollen=[...b.pollen.values(),...d.sim.animals.map(a=>a.pollenCargo).filter(Boolean)],stocks=[...flowers,...pollen,...b.embryos];
 // Validate the whole restored payload before registering any reproductive genotype.
 for(const r of stocks)if(!(r.mass>=0)||!Number.isFinite(r.mass)||!FLORA_TISSUES[r.kind]||!validCell(d,r.i)||!Number.isSafeInteger(r.createdEpoch)||r.createdEpoch<0||r.createdEpoch>b.epoch||typeof r.producerId!=='string'||!validFloraGenome(r.genome,r.kind)||!r.genome.botanical)throw Error('Invalid finite botanical reproductive stock.');
 for(const [k,r] of [...b.flowers,...b.pollen])if(k!==key(r.kind,r.i))throw Error('Botanical stock target mismatch.');
 for(const r of pollen)if(!validBotanicalGamete(r.gamete,r.genome)||!Number.isSafeInteger(r.serial)||r.serial<1||r.serial>b.serial||!botanicalStructure(r.genome.botanical,'anther'))throw Error('Invalid inherited pollen payload.');
 for(const r of flowers)if(!botanicalStructure(r.genome.botanical,'stigma')||!botanicalStructure(r.genome.botanical,'ovule'))throw Error('Invalid receptive structure.');
 for(const r of b.embryos)if(r.mode!=='sexual'||!Array.isArray(r.parentGenomeIds)||r.parentGenomeIds.length!==2||!Array.isArray(r.parentProducerIds)||r.parentProducerIds.length!==2||typeof r.selfing!=='boolean'||!Number.isFinite(r.homozygosity)||r.homozygosity<0||r.homozygosity>1)throw Error('Invalid botanical embryo provenance.');
 for(const genome of b.adultGenomes.values())freezeBotanical(genome);for(const r of stocks)registerFloraGenome(d,r.genome);
}
function note(d,event){const b=d.botanical;b.receipts.push({...event,epoch:b.epoch,day:d.sim.day,tick:d.sim.tickCount});if(b.receipts.length>128)b.receipts.shift()}
export function botanicalAdultGenome(d,kind,i){return registerFloraGenome(d,resolveBotanicalFloraGenome(d,kind,i))}
function mature(d,kind,i,ovuleMass=0){return !d.sim.world.water[i]&&d.sim.world.plants[kind][i]+ovuleMass+(d.botanical.pollen.get(key(kind,i))?.mass||0)+embryosAt(d,key(kind,i)).reduce((n,e)=>n+e.mass,0)+1e-7>=(PLANTS[kind].dispersal?.mature??Infinity)}
const floatBits=new DataView(new ArrayBuffer(4));
function nextFloat32(value){floatBits.setFloat32(0,value);floatBits.setUint32(0,floatBits.getUint32(0)+1);return floatBits.getFloat32(0)}
function invest(d,kind,i,requested){const s=d.sim,w=s.world,stock=w.plants[kind][i],energy=w.plantResources.energy[kind],limit=Math.min(requested,d.tissueView(kind,i).flesh,energy[i]/PLANT_RESOURCE_UNITS.energyPerBiomass);if(!(limit>0))return 0;let next=Math.fround(stock-limit);if(stock-next>limit)next=nextFloat32(next);const q=stock-next;if(!(q>0))return 0;energy[i]-=q*PLANT_RESOURCE_UNITS.energyPerBiomass;exportPlantReserve(s,kind,i,stock,next);w.plants[kind][i]=next;w.plantResources.totals.botanicalInvestment=(w.plantResources.totals.botanicalInvestment||0)+q;return q}

function decay(d,r,i=r.i){d.litter[i]+=r.mass;r.mass=0}
function validCell(d,i){return Number.isInteger(i)&&i>=0&&i<d.sim.world.len}
export function botanicalRecipientAvailability(d,kind,i){if(!FLORA_TISSUES[kind]||!validCell(d,i))return{enabled:false,reason:'No reproductive plant at this target.'};const flower=d.botanical.flowers.get(key(kind,i));if(!flower?.mass)return{enabled:false,reason:'No funded receptive ovules.'};const r=flower.genome.botanical;if(!botanicalStructure(r,'stigma')||!botanicalStructure(r,'ovule'))return{enabled:false,reason:'A receptive structure and ovules are required.'};if(!mature(d,kind,i,flower.mass))return{enabled:false,reason:'The recipient is not reproductively mature.'};return{enabled:true,flower}}
export function deliverBotanicalPollen(d,kind,i,packet,{route='animal-contact',actorId=null}={}){const status=botanicalRecipientAvailability(d,kind,i);if(!status.enabled||!(packet?.mass>0)||!Number.isFinite(packet.mass)||!Number.isSafeInteger(packet.createdEpoch)||!Number.isSafeInteger(packet.serial)||!validFloraGenome(packet.genome,packet.kind)||!botanicalStructure(packet.genome.botanical,'anther')||!validBotanicalGamete(packet.gamete,packet.genome)||packet.createdEpoch<0||packet.createdEpoch>d.botanical.epoch||packet.serial<1||packet.serial>d.botanical.serial||!validCell(d,packet.i)||typeof packet.producerId!=='string')return{delivered:false,stage:'delivery',reason:status.reason||'No pollen to deliver.'};const b=d.botanical,life=PLANTS[packet.kind].dispersal?.transitDays?.[1]||1;if(b.epoch-packet.createdEpoch>life)return{delivered:false,stage:'delivery',reason:'The carried pollen is no longer viable.'};const flower=status.flower,ovuleUnit=PLANTS[kind].dispersal.localRelease,pollenUnit=PLANTS[packet.kind].dispersal.localRelease,fertilizableMass=Math.min(flower.mass/ovuleUnit,packet.mass/pollenUnit)*ovuleUnit;b.stats.delivered++;note(d,{stage:'delivery',kind,i,donor:packet.producerId,recipient:flower.producerId,route,actorId});const recognition=recognizeBotanicalPollen(flower.genome,packet.gamete,{selfing:flower.producerId===packet.producerId});decay(d,packet,i);if(!recognition.accepted){b.stats.rejected++;note(d,{stage:'recognition',kind,i,accepted:false,reason:recognition.reason});return{delivered:true,...recognition}}b.stats.recognized++;const serial=++b.serial,maternalGamete=botanicalGamete(flower.genome,'ovule|'+serial+'|'+d.sim.world.seedHash,{mutate:(botanicalHash('ovule-mutation|'+serial+'|'+d.sim.world.seedHash)/4294967296)<CLONAL_MUTATION.rate}),child=registerFloraGenome(d,sexualFloraGenome(flower.genome,maternalGamete,packet.gamete));const selfing=flower.producerId===packet.producerId,embryo={kind,i,mass:fertilizableMass,genome:child,createdEpoch:b.epoch,producerId:flower.producerId,parentGenomeId:flower.genome.id,parentGenomeIds:[flower.genome.id,packet.genome.id],parentProducerIds:[flower.producerId,packet.producerId],selfing,homozygosity:botanicalHomozygosity(child),mode:'sexual'};b.embryos.push(embryo);const indexed=embryoIndexes.get(d);if(indexed&&indexed.epoch===b.epoch&&indexed.source===b.embryos){const k=key(kind,i);if(!indexed.index.has(k))indexed.index.set(k,[]);indexed.index.get(k).push(embryo)}flower.mass=Math.max(0,flower.mass-fertilizableMass);if(flower.mass<=0)b.flowers.delete(key(kind,i));b.stats.fertilized++;b.stats[selfing?'selfed':'crossed']++;note(d,{stage:'fertilization',kind,i,genomeId:child.id,parentGenomeIds:embryo.parentGenomeIds,selfing,homozygosity:embryo.homozygosity});return{delivered:true,accepted:true,stage:'fertilization',genomeId:child.id,selfing}}
export function contactBotanicalFlower(d,a,kind,i){if(!a?.alive||!FLORA_TISSUES[kind])return;const b=d.botanical,k=key(kind,i);let result;if(a.pollenCargo){result=deliverBotanicalPollen(d,kind,i,a.pollenCargo,{route:'animal-contact',actorId:a.id});if(result.delivered)delete a.pollenCargo}const pollen=b.pollen.get(k);if(!a.pollenCargo&&pollen?.mass>0&&mature(d,kind,i,b.flowers.get(k)?.mass||0)){a.pollenCargo=pollen;b.pollen.delete(k);note(d,{stage:'pickup',kind,i,actorId:a.id,donor:pollen.producerId,mass:pollen.mass});}if(result?.delivered||a.pollenCargo)a.lastBotanicalContact={tick:d.sim.tickCount,kind,i,carrying:!!a.pollenCargo,result:result?.stage,accepted:result?.accepted,reason:result?.reason||null};}
export function dropBotanicalPollen(d,a){if(a?.pollenCargo){decay(d,a.pollenCargo,d.sim.world.idx(a.x,a.y));delete a.pollenCargo}}
// Existing funded pollen can travel into the next land cell on the actual
// planetary wind. No additional pollen pool, weather RNG or fertilization
// authority is introduced. The recipient's inherited receptors decide whether
// the arriving pollen fertilizes an ovule or becomes local organic litter.
// Old worlds without an explicit wind policy keep their exact former sequence.
export function advanceWindPollination(d){return drain(advanceWindPollinationSteps(d))}
// Resumable form (day-boundary slicing): pauses only between pollen packets.
export function* advanceWindPollinationSteps(d){
 if(d.windSeedPolicy!==WIND_SEED_POLICIES.planetary)return 0;
 const b=d.botanical,w=d.sim.world,n=w.n,targets=new Map();
 // One index of already-funded receptive flowers. No new ovules are created.
 for(const flower of b.flowers.values()){
  if(!(flower.mass>0))continue;
  let list=targets.get(flower.i);
  if(!list){list=[];targets.set(flower.i,list)}
  list.push(flower.kind);
 }
 let delivered=0,visited=0;
 for(const [sourceKey,pollen] of b.pollen){
  if(++visited%64===0)yield;
  // Newly produced pollen must survive until the next botanical day.
  if(!(pollen.mass>0)||pollen.createdEpoch>=b.epoch)continue;
  const hash=botanicalHash(pollen.genome.id+'|wind-pollen|'+pollen.serial+'|'+b.epoch);
  const [dx,dy]=planetaryWindSeedOffset(w,d.sim.day,pollen.i,hash/4294967296);
  const x=pollen.i%n+dx,y=Math.floor(pollen.i/n)+dy;
  if(x<1||y<1||x>=n-1||y>=n-1)continue;
  const i=y*n+x;
  if(w.water[i])continue;
  const kinds=targets.get(i);
  if(!kinds?.length)continue;
  // Pick a physical recipient without a fixed species priority. Different
  // recognition genes can reject pollen; neither outcome is forced.
  const kind=kinds[hash%kinds.length];
  const result=deliverBotanicalPollen(d,kind,i,pollen,{route:'wind'});
  if(!result.delivered)continue;
  b.pollen.delete(sourceKey);
  delivered++;
 }
 return delivered;
}

export function advanceBotanicalReproduction(d){return drain(advanceBotanicalReproductionSteps(d))}
// Resumable form: pauses between embryo batches, stages and plant kinds only.
export function* advanceBotanicalReproductionSteps(d){const b=d.botanical,w=d.sim.world;b.epoch++;
 // Fertilization, developmental viability and dispersal are separate stages.
 // Advance only embryos that have reached their next real developmental day.
 // Compact the same array in place after ordered biological receipts. This
 // preserves positive and rare lineages without a daily array copy, indexOf
 // scans, or quadratic splice shifts for every released embryo.
 const embryos=b.embryos,initialEmbryos=embryos.length;
 let retained=0;
 for(let read=0;read<initialEmbryos;read++){
  if(read&&read%64===0)yield;
  const embryo=embryos[read];
  if(embryo.createdEpoch>=b.epoch){embryos[retained++]=embryo;continue;}const viability=botanicalSeedViability(embryo.genome),supported=w.plants[embryo.kind][embryo.i]>.002;b.stats[viability.viable&&supported?'viable':'nonviable']++;note(d,{stage:'seed-viability',kind:embryo.kind,i:embryo.i,genomeId:embryo.genome.id,viable:viability.viable&&supported,reason:!supported?'The supporting parent tissue is gone.':viability.reason});if(viability.viable&&supported){const destination=botanicalSeedDestination(d,embryo),added=destination?d.deposit(embryo.kind,destination.x,destination.y,embryo.mass,{payload:{...embryo,originCell:embryo.i},route:'sexual-release'}):0;b.stats.released+=added;d.floraState.stats.sexualProduced=(d.floraState.stats.sexualProduced||0)+1;d.litter[embryo.i]+=embryo.mass-added;note(d,{stage:'seed-release',kind:embryo.kind,i:embryo.i,genomeId:embryo.genome.id,mass:added,selfing:embryo.selfing});d.floraState.births.push({serial:++d.floraState.serial,kind:embryo.kind,amount:added,genomeId:embryo.genome.id,parentGenomeIds:embryo.parentGenomeIds,parentProducerIds:embryo.parentProducerIds,mode:'sexual',selfing:embryo.selfing,homozygosity:embryo.homozygosity,day:d.sim.day,tick:d.sim.tickCount});if(d.floraState.births.length>128)d.floraState.births.shift();}else decay(d,embryo); }
 // Any embryos created during this phase would have been outside the old
 // snapshot iteration. Keep them in original appended order for the next day.
 for(let read=initialEmbryos;read<embryos.length;read++)embryos[retained++]=embryos[read];
 embryos.length=retained;
 // Only a read-side acceleration structure; rebuilding it on demand does not
 // alter stocks, fertilization decisions, lineage IDs, or saved provenance.
 embryoIndexes.delete(d);
 for(const a of d.sim.animals){const r=a.pollenCargo;if(r&&(!a.alive||b.epoch-r.createdEpoch>(PLANTS[r.kind].dispersal.transitDays?.[1]||1)))dropBotanicalPollen(d,a)}
 for(const [k,flower] of b.flowers)if(w.plants[flower.kind][flower.i]<=.002){decay(d,flower);b.flowers.delete(k)}
 // Physical wind transport occurs before same-flower selfing on this day.
// Only pollen that was already available at the preceding day can move.
 yield;yield* advanceWindPollinationSteps(d);
 // Pollen within the same flower can contact its stigma after a prior phase.
 // Self-incompatibility remains a genetic recognition decision, not a success-rate penalty.
 let within=0;for(const [k,pollen] of b.pollen){if(++within%64===0)yield;if(pollen.createdEpoch<b.epoch){const result=deliverBotanicalPollen(d,pollen.kind,pollen.i,pollen,{route:'within-flower'});if(result.delivered){b.pollen.delete(k);continue}}if(b.epoch-pollen.createdEpoch>(PLANTS[pollen.kind].dispersal.transitDays?.[1]||1)||w.plants[pollen.kind][pollen.i]<=.002){decay(d,pollen);b.pollen.delete(k)}}
 // Read-side acceleration with identical decisions: a cell holding no flower,
 // pollen or embryo is mature exactly when it is land and its stock alone
 // reaches the threshold, so only those cells skip key/map construction.
 yield;const flowering=plantLifecycleEnabled(d.sim),occupied=new Map();for(const r of [...b.flowers.values(),...b.pollen.values(),...b.embryos]){if(!occupied.has(r.kind))occupied.set(r.kind,new Set());occupied.get(r.kind).add(r.i)}
 for(const kind of Object.keys(FLORA_TISSUES)){yield;const profile=PLANTS[kind],budget=profile.dispersal.localRelease,stocks=w.plants[kind],threshold=profile.dispersal?.mature??Infinity,held=occupied.get(kind);for(let i=0;i<w.len;i++){if(i&&(i&2047)===0)yield;if(!held?.has(i)&&(w.water[i]||!(stocks[i]+1e-7>=threshold)))continue;const k=key(kind,i);if(!mature(d,kind,i,b.flowers.get(k)?.mass||0))continue;if(flowering&&!canFlower(kind,d.genomeAt(kind,i)?.traits?.waterNeed??profile.waterNeed,w.moisture[i],w.environment?w.temperature[i]:d.sim.climate.temp))continue;const genome=botanicalAdultGenome(d,kind,i);const r=genome.botanical,producerId=d.producerOrigins[kind]?.get(i)?.producerId||kind+':'+i+':founder';if(!b.flowers.has(k)&&botanicalStructure(r,'stigma')&&botanicalStructure(r,'ovule')){const mass=invest(d,kind,i,budget);if(mass>0){b.flowers.set(k,{kind,i,mass,genome,createdEpoch:b.epoch,producerId});b.stats.ovulesInvested+=mass;note(d,{stage:'ovule-investment',kind,i,mass})}}if(!b.pollen.has(k)&&botanicalStructure(r,'anther')){const mass=invest(d,kind,i,budget);if(mass>0){const serial=++b.serial,gamete=botanicalGamete(genome,'pollen|'+serial+'|'+d.sim.world.seedHash,{mutate:(botanicalHash('pollen-mutation|'+serial+'|'+d.sim.world.seedHash)/4294967296)<CLONAL_MUTATION.rate});b.pollen.set(k,{kind,i,mass,genome,gamete,producerId,createdEpoch:b.epoch,serial});b.stats.pollenProduced+=mass;note(d,{stage:'pollen-production',kind,i,mass,serial,mutation:gamete.mutation})}}}}
 yield;b.genomeCollection=yield* pruneUnusedFloraGenomesSteps(d);
}
export function botanicalResourceMass(d){return[...d.botanical.flowers.values(),...d.botanical.pollen.values(),...d.botanical.embryos,...d.sim.animals.map(a=>a.pollenCargo).filter(Boolean)].reduce((sum,r)=>sum+r.mass,0)}
export function botanicalPlantView(d,kind,i){const k=key(kind,i),flower=d.botanical?.flowers.get(k),pollen=d.botanical?.pollen.get(k),embryos=embryosAt(d,k),genome=d.genomeAt(kind,i),r=genome?.botanical||d.botanical?.adultGenomes.get(k);return r?{reproductiveGenome:r,receptive:!!flower?.mass,pollen:!!pollen?.mass,developing:embryos.length>0,selfCompatible:r.selfCompatible.some(Boolean),mass:(flower?.mass||0)+(pollen?.mass||0)+embryos.reduce((n,e)=>n+e.mass,0)}:null}

function embryosAt(d,k){const b=d.botanical;if(!b)return[];let cached=embryoIndexes.get(d);if(!cached||cached.epoch!==b.epoch||cached.source!==b.embryos){const index=new Map();for(const e of b.embryos){const k=key(e.kind,e.i);if(!index.has(k))index.set(k,[]);index.get(k).push(e)}cached={epoch:b.epoch,source:b.embryos,index};embryoIndexes.set(d,cached)}return cached.index.get(k)||[]}

export function botanicalSeedDestination(d,embryo,epoch=d.botanical.epoch){const w=d.sim.world,x=embryo.i%w.n,y=(embryo.i/w.n)|0,hash=botanicalHash(embryo.genome.id+'|'+epoch),wind=d.windSeedPolicy===WIND_SEED_POLICIES.planetary&&(!PLANTS[embryo.kind]?.dispersal?.animal||(hash&3)===0),[dx,dy]=wind?planetaryWindSeedOffset(w,d.sim.day,embryo.i,hash/4294967296):directions[hash%directions.length],nx=x+dx,ny=y+dy;return nx>=1&&ny>=1&&nx<w.n-1&&ny<w.n-1&&!w.water[w.idx(nx,ny)]?{x:nx,y:ny,i:w.idx(nx,ny)}:null}
