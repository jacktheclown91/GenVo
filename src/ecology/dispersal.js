import {touchSeedBank} from './seed-bank-epoch.js';
import {initializeBotanicalReproduction,advanceBotanicalReproduction,advanceBotanicalReproductionSteps,contactBotanicalFlower,dropBotanicalPollen} from './botanical-reproduction.js';
import {mouthOf} from './functional-diet.js';
import {plantHandling,plantHandlingAffordable,plantHandlingEnergyCost,plantHandlingCostAffordable} from './plant-handling.js';
import {coldFloraTemperatureFactor} from './cold-flora.js';
import {initializeFloraInheritance,adultFloraGenome,makeClonalPropagule,registerFloraGenome,addSeedCohorts,scaleSeedCohorts,chooseSeedCohort,commitSeedEstablishment,reconcileSeedCell} from './flora-inheritance.js';
import {exportPlantReserve,producerBoundary} from './plant-resources.js';
import {FLORA_TISSUES,founderFloraGenome,floraMealChannels,validFloraGenome} from './flora-genotype.js';
import {PLANTS} from '../sim/config.js';
import {seedViabilityEnabled,settleSeedCell} from './seed-viability.js';
import {recordPageSeedDeposit} from './page-seed-transfers.js';
import {WIND_SEED_POLICIES,planetaryWindSeedOffset} from '../world/weather-fronts.js';

const cropYieldCaches=new WeakMap();
// Mouth-specific meal channels are immutable recipes for a given plant kind.
// Cache only the static recipe selection, never actual edible stock, seed
// reserves, genotype, affordability, energy or harvested material.
const cropChannelCaches=new WeakMap();
// Read-only diagnostics; does not initialize or invalidate meal caches.
export function cropYieldCacheStats(controller){const groups=cropYieldCaches.get(controller);let entries=0;for(const cells of groups?.values()||[])entries+=cells.size;return{groups:groups?.size||0,entries,perGroupLimit:8192}}
// Shared by forecasts and actual receipts: identical arithmetic, no duplicate resource authority.
function mealTissues(kind,v,amount,tissue){
 const removed=Math.min(Math.max(0,amount),v.total),scale=v.total>0?removed/v.total:0,seed=v.seed*scale,coat=v.coat*scale,flesh=v.flesh*scale;
 return {removed,coat,edible:tissue==='kernel'?(kind==='thistlepod'?seed+flesh:seed):flesh,viableSeeds:tissue==='kernel'?0:seed,destroyedSeeds:tissue==='kernel'?seed:0,discarded:tissue==='kernel'&&kind!=='thistlepod'?flesh+coat:coat};
}
const LOCAL_DIRS=Object.freeze([[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]]);

// Plant reproduction/dispersal lives inside the existing vegetation phase.
// It is deterministic and uses its own seed-bank state, so it does not perturb the main RNG stream.
export class PlantDispersalController{
  // Restore may defer generated flora that a saved controller replaces.
  // The restore boundary still calls upgrade on the loaded state.
  constructor(sim,{initialize=true}={}){
    this.sim=sim;this.active={};this.kindCodes={};this.stats={ingested:0,deposited:0,germinated:0,destroyed:0,lost:0};this.nextProducerId=1;this.nextDepositId=1;this.windSeedPolicy=sim.world.generator==='planetary/1'?WIND_SEED_POLICIES.planetary:WIND_SEED_POLICIES.legacy;this.events=[];this.bankGenomes={};this.producerOrigins={};this.seedReserve={};this.coatReserve={};this.litter=new Float32Array(sim.world.len);
    for(const [kind,p] of Object.entries(PLANTS)){this.kindCodes[kind]=hashKind(kind);if(p.dispersal){this.active[kind]=new Set();this.bankGenomes[kind]=new Map();this.producerOrigins[kind]=new Map()}}if(initialize)this.upgrade();
  }
  seedBank(kind){return this.sim.world.seedBank?.[kind]||null}
  upgrade(){if(this.windSeedPolicy!==undefined&&!Object.values(WIND_SEED_POLICIES).includes(this.windSeedPolicy))throw Error('Unknown seed wind policy.');if(this.windSeedPolicy===WIND_SEED_POLICIES.planetary&&this.sim.world.generator!=='planetary/1')throw Error('Planetary seed wind policy requires planetary terrain.');this.nextProducerId||=1;this.nextDepositId||=1;this.stats||={ingested:0,deposited:0,germinated:0};this.sim.world.onCropConsumed=(kind,i,before,after)=>{this.noteGrowth(kind,i,before,after);producerBoundary(this.sim,kind,i,before-after,'out','consumed-or-collected')};
    this.events||=[];this.bankGenomes||={};this.producerOrigins||={};this.seedReserve||={};this.coatReserve||={};this.litter||=new Float32Array(this.sim.world.len);this.stats.destroyed||=0;this.stats.lost||=0;
    for(const [kind,p] of Object.entries(PLANTS)){if(!p.dispersal)continue;this.active[kind]||=new Set();this.kindCodes[kind]??=hashKind(kind);this.bankGenomes[kind]||=new Map();this.producerOrigins[kind]||=new Map();const t=FLORA_TISSUES[kind];if(t&&!this.seedReserve[kind]){this.seedReserve[kind]=Float32Array.from(this.sim.world.plants[kind],v=>v*t.seed);this.coatReserve[kind]=Float32Array.from(this.sim.world.plants[kind],v=>v*t.coat)}
      for(let i=0;i<this.sim.world.len;i++)if(this.seedBank(kind)[i]>0){this.active[kind]?.add(i);if(!this.bankGenomes[kind].has(i))this.bankGenomes[kind].set(i,{genomeId:founderFloraGenome(kind).id,route:'legacy-bank',originCell:i});}}
    for(const a of this.sim.animals)for(const [kind,c] of Object.entries(a.seedCargo||{})){if(!c.genome)c.genome=founderFloraGenome(kind);if(!validFloraGenome(c.genome,kind))throw Error('Invalid saved propagule genome.')}
    initializeFloraInheritance(this);
    for(const [kind,map] of Object.entries(this.bankGenomes))for(const v of map.values()){if(v.genome&&!validFloraGenome(v.genome,kind))throw Error('Invalid seed-bank genome.');v.genomeId||=v.genome?.id||founderFloraGenome(kind).id;delete v.genome;if(!this.floraState.genomes.has(v.genomeId))throw Error('Unknown seed-bank genotype.');}
    for(const kind of Object.keys(FLORA_TISSUES))for(const arr of [this.seedReserve[kind],this.coatReserve[kind]])if(!(arr instanceof Float32Array)||arr.length!==this.sim.world.len)throw Error('Invalid crop tissue state.');
    initializeBotanicalReproduction(this);
  }
  genomeAt(kind,i){return adultFloraGenome(this,kind,i)}
  isEstablished(kind,i){return !!this.producerOrigins[kind]?.has(i)&&this.sim.world.plants[kind][i]>0}
  noteGrowth(kind,i,before,after){exportPlantReserve(this.sim,kind,i,before,after);if(!FLORA_TISSUES[kind])return;const g=this.genomeAt(kind,i),seed=this.seedReserve[kind],coat=this.coatReserve[kind];if(after>=before){seed[i]+=(after-before)*g.traits.seedAllocation;coat[i]+=(after-before)*g.traits.coatAllocation}else{const scale=before>0?after/before:0;seed[i]*=scale;coat[i]*=scale}}
  tissueView(kind,i){const total=Math.max(0,this.sim.world.plants[kind]?.[i]||0),seed=Math.min(total,this.seedReserve[kind]?.[i]||0),coat=Math.min(total-seed,this.coatReserve[kind]?.[i]||0);return{total,seed,coat,flesh:Math.max(0,total-seed-coat),genome:this.genomeAt(kind,i)}}
  cropYield(a,kind,i){
    const total=Math.max(0,this.sim.world.plants[kind]?.[i]||0);
    // An empty standing crop has no edible tissue, regardless of mouth or reserves.
    // Re-read stock on every call so depletion/regrowth never uses a stale result.
    if(total===0)return 0;
    const seed=Math.min(total,this.seedReserve[kind]?.[i]||0),coat=Math.min(total-seed,this.coatReserve[kind]?.[i]||0),genome=this.genomeAt(kind,i),bite=Math.min(total,this.sim.foraging.profile(kind).bite),group=kind+':'+mouthOf(a);
    // Cache immutable meal calculations and mouth-specific coat costs, never an individual's affordability.
    // Exact tissue/genotype comparisons invalidate immediately after real harvest.
    // Phase 3K performance: one sub-map per kind and mouth keyed by cell number (no per-call string key); results
    // are unchanged, since a missing recipe is recomputed exactly.
    let caches=cropYieldCaches.get(this);if(!caches){caches=new Map();cropYieldCaches.set(this,caches)}let cache=caches.get(group);if(!cache){cache=new Map();caches.set(group,cache)}let recipe=cache.get(i);
    if(!recipe||recipe.total!==total||recipe.seed!==seed||recipe.coat!==coat||recipe.genome!==genome||recipe.bite!==bite){
      let byMouth=cropChannelCaches.get(this);if(!byMouth){byMouth=new Map();cropChannelCaches.set(this,byMouth)}
      let channels=byMouth.get(group);if(!channels){channels=floraMealChannels(a,kind);byMouth.set(group,channels)}
      const v={total,seed,coat,flesh:Math.max(0,total-seed-coat),genome},options=channels.map(c=>{
        const receipt=mealTissues(kind,v,v.total,c.tissue),biteReceipt=mealTissues(kind,v,bite,c.tissue),energyCost=plantHandlingEnergyCost(a,receipt.coat);
        return{coat:biteReceipt.coat,handlingCost:plantHandlingEnergyCost(a,biteReceipt.coat),yield:Math.max(0,receipt.edible*c.eff-energyCost/(v.genome.traits.nutrition*3.6))};
      });
      recipe={total:v.total,seed:v.seed,coat:v.coat,genome:v.genome,bite,options};cache.set(i,recipe);
      if(cache.size>8192)cache.delete(cache.keys().next().value);
    }
    let best=0;for(const o of recipe.options)if(plantHandlingCostAffordable(a,o.handlingCost))best=Math.max(best,o.yield);return best;
  }
  receiptFromTissues(kind,i,v,amount,tissue){
    return {kind,i,tissue,...mealTissues(kind,v,amount,tissue),genome:v.genome,producerId:this.producerOrigins[kind]?.get(i)?.producerId||kind+':'+i+':founder',originCell:i};
  }
  previewMeal(a,kind,i,amount,tissue='crop'){
    if(!floraMealChannels(a,kind).some(c=>c.tissue===tissue))return null;
    return this.receiptFromTissues(kind,i,this.tissueView(kind,i),amount,tissue);
  }
  harvestMeal(a,kind,i,amount,tissue='crop'){
    const receipt=this.previewMeal(a,kind,i,amount,tissue);if(!receipt||receipt.removed<=0||receipt.edible<=0)return null;const handling=plantHandling(a,receipt);if(!handling.enabled)return null;if(handling.energyCost>0)a.energy=Math.max(0,a.energy-handling.energyCost);contactBotanicalFlower(this,a,kind,i);receipt.processingCost=handling.energyCost;receipt.specializedHandling=handling.specialized;const w=this.sim.world;exportPlantReserve(this.sim,kind,i,w.plants[kind][i],w.plants[kind][i]-receipt.removed);w.plants[kind][i]=Math.max(0,w.plants[kind][i]-receipt.removed);this.seedReserve[kind][i]=Math.max(0,this.seedReserve[kind][i]-(receipt.viableSeeds+receipt.destroyedSeeds));this.coatReserve[kind][i]=Math.max(0,this.coatReserve[kind][i]-receipt.coat);
    producerBoundary(this.sim,kind,i,receipt.edible+receipt.viableSeeds,'out','meal-and-carried-seeds');this.litter[i]+=receipt.discarded;this.stats.destroyed+=receipt.destroyedSeeds;receipt.actorId=a.id;receipt.tick=this.sim.tickCount;receipt.parentGenomeId=receipt.genome.id;if(receipt.viableSeeds>0){const offspring=makeClonalPropagule(this,kind,i,receipt.viableSeeds);receipt.genome=offspring.genome;receipt.mutation=offspring.mutation;receipt.coatMutation=offspring.coatMutation;receipt.mutationAxis=offspring.mutationAxis;}a.lastPlantMeal=receipt;this.onFeed(a,kind,receipt.removed,receipt);return receipt;
  }
  onFeed(animal,kind,amount,receipt=null){
    const d=PLANTS[kind]?.dispersal;if(!animal?.alive||!d?.animal||!(amount>(FLORA_TISSUES[kind]?0:.015)))return;
    // Adopted crop seeds require a real funded harvest receipt. Numeric callbacks
    // cannot manufacture a genotype-bearing seed load.
    if(FLORA_TISSUES[kind]&&(!receipt||receipt!==animal.lastPlantMeal||receipt.seedTransferComplete))return;if(receipt)receipt.seedTransferComplete=true;
    const load=receipt?receipt.viableSeeds:amount*(d.seedLoad??.8);if(!(load>0))return;
    animal.seedCargo??={};let cargo=animal.seedCargo[kind];const days=this.transitDays(animal,kind,d);
    if(!cargo)cargo=animal.seedCargo[kind]={load:0,days,genome:structuredClone(receipt?.genome||founderFloraGenome(kind)),originCell:receipt?.originCell??this.sim.world.idx(animal.x,animal.y),producerId:receipt?.producerId||null};
    const added=Math.min(load,Math.max(0,1.6-cargo.load));cargo.cohorts||=new Map(cargo.load>0?[[cargo.genome.id,{amount:cargo.load,genome:cargo.genome,originCell:cargo.originCell,producerId:cargo.producerId}]]:[]);const genome=receipt?.genome||founderFloraGenome(kind);registerFloraGenome(this,genome);const record=cargo.cohorts.get(genome.id);if(record){record.amount+=added;if(record.producerId!==receipt?.producerId){record.mixedSources=true;record.producerId=null;}if(record.parentGenomeId!==receipt?.parentGenomeId)record.parentGenomeId=null;if(record.mutation!==(receipt?.mutation??0))record.mutation=null;if(record.coatMutation!==(receipt?.coatMutation??0))record.coatMutation=null;if(record.mutationAxis!==(receipt?.mutationAxis??null))record.mutationAxis=null;}else if(added>0)cargo.cohorts.set(genome.id,{amount:added,genome,originCell:receipt?.originCell??cargo.originCell,producerId:receipt?.producerId??cargo.producerId,parentGenomeId:receipt?.parentGenomeId,mutation:receipt?.mutation||0,coatMutation:receipt?.coatMutation||0,mutationAxis:receipt?.mutationAxis||null});cargo.load+=added;cargo.sourceCells||=[cargo.originCell];if(receipt&&receipt.originCell!==cargo.originCell){cargo.mixedSources=true;if(!cargo.sourceCells.includes(receipt.originCell)&&cargo.sourceCells.length<4)cargo.sourceCells.push(receipt.originCell)}cargo.days=Math.min(cargo.days,days);this.stats.ingested+=added;this.stats.lost+=load-added;producerBoundary(this.sim,kind,receipt?.i??this.sim.world.idx(animal.x,animal.y),load-added,'in','cargo-overflow');this.litter[receipt?.i??this.sim.world.idx(animal.x,animal.y)]+=load-added;
  }
  transitDays(animal,kind,d){const [lo,hi]=d.transitDays||[1,2],span=Math.max(1,hi-lo+1);return lo+(mix32(animal.id*65537+this.sim.day*131+(this.kindCodes[kind]??hashKind(kind)))%span)}
  deposit(kind,x,y,amount,{dung=false,payload=null,actorId=null,route=null}={}){
    const bank=this.seedBank(kind),d=PLANTS[kind]?.dispersal;if(!bank||!d||!(amount>.0001))return 0;if(payload?.genome&&!validFloraGenome(payload.genome,kind))throw Error('Invalid propagule genotype.');
    const w=this.sim.world,i=w.idx(x,y);if(w.water[i])return 0;const added=Math.min(.65,amount,Math.max(0,2.5-bank[i]));if(added<=0)return 0;const depositId=this.nextDepositId++;addSeedCohorts(this,kind,i,added,payload,route||(actorId===null?'local-release':'gut-passage'),depositId);bank[i]+=added;recordPageSeedDeposit(this,{kind,i,added,payload,depositId,actorId});if(actorId!==null)producerBoundary(this.sim,kind,i,added,'in','gut-seeds');this.bankGenomes[kind].set(i,{genomeId:payload?.genome?.id||founderFloraGenome(kind).id,originCell:payload?.originCell??i,sourceCells:payload?.sourceCells||[payload?.originCell??i],mixedSources:!!payload?.mixedSources,producerId:payload?.producerId||null,route:route||(actorId?'gut-passage':'local-release'),depositedDay:this.sim.day});this.events.push({id:depositId,kind,i,amount:added,tick:this.sim.tickCount,actorId,mode:payload?.mode||'clonal',genomeId:payload?.genome?.id||founderFloraGenome(kind)?.id});if(this.events.length>32)this.events.shift();this.active[kind].add(i);this.stats.deposited+=added;
    if(dung)w.fertility[i]=Math.min(1,w.fertility[i]+Math.min(.006,added*.012));return added;
  }
  onDeath(animal){dropBotanicalPollen(this,animal);if(!animal?.seedCargo)return;for(const [kind,c] of Object.entries(animal.seedCargo)){if(c?.load>0){const added=this.deposit(kind,animal.x,animal.y,c.load*.72,{dung:true,payload:c,actorId:animal.id});this.stats.lost+=c.load-added;producerBoundary(this.sim,kind,this.sim.world.idx(animal.x,animal.y),c.load-added,'in','death-cargo-litter');this.litter[this.sim.world.idx(animal.x,animal.y)]+=c.load-added}}animal.seedCargo={}}
  advanceAnimalCargo(){
    for(const a of this.sim.animals){if(!a.alive||!a.seedCargo)continue;for(const [kind,c] of Object.entries(a.seedCargo)){c.days-=1;if(c.days<=0){const added=this.deposit(kind,a.x,a.y,c.load,{dung:true,payload:c,actorId:a.id});this.stats.lost+=c.load-added;producerBoundary(this.sim,kind,this.sim.world.idx(a.x,a.y),c.load-added,'in','rejected-cargo-litter');this.litter[this.sim.world.idx(a.x,a.y)]+=c.load-added;if(added>0){const t=this.sim.discovery.addTrace(a,'seed',a.x,a.y,kind);t.depositId=this.events.at(-1)?.id;t.genomeId=c.genome?.id;t.genomeIds=[...(c.cohorts?.keys()||[c.genome?.id])];t.amount=added;t.originCell=c.originCell;t.producerId=c.producerId;}if(added>0&&a.player&&this.lastSeedNoticeTick!==this.sim.tickCount){this.lastSeedNoticeTick=this.sim.tickCount;this.sim.discovery.notice('Seeds from your meal were left here. Click the marks to remember this patch.','safe');}delete a.seedCargo[kind]}}}
  }
  advanceBotanicalReproduction(){advanceBotanicalReproduction(this)}
  *advanceBotanicalReproductionSteps(){yield* advanceBotanicalReproductionSteps(this)}
  releaseLocal(kind,i,biomass){
    const p=PLANTS[kind],d=p?.dispersal;if(!d||!(d.localRelease>0)||biomass<(d.mature??p.carry*.45))return;
    // Sparse deterministic pulses keep local spread gradual; animal gut passage is the long-range pathway.
    const code=this.kindCodes[kind]??hashKind(kind);if(((i+this.sim.day*13+code)%12)!==0)return;
    const w=this.sim.world,x=i%w.n,y=(i/w.n)|0,h=mix32(i*1103515245+this.sim.day*2654435761+code);
    // Wind dispersal is adopted only by newly initialized planetary worlds.
    // Saved controllers without this policy retain exact historical directions.
    // Unassisted propagules are wind-borne; animal-carried lineages use wind
    // in one quarter of ordinary local releases, keeping both routes available.
    const wind=this.windSeedPolicy===WIND_SEED_POLICIES.planetary&&(!d.animal||(h&3)===0);
    const [dx,dy]=wind?planetaryWindSeedOffset(w,this.sim.day,i,h/4294967296):LOCAL_DIRS[h%LOCAL_DIRS.length],nx=x+dx,ny=y+dy;
    if(nx<1||ny<1||nx>=w.n-1||ny>=w.n-1||w.water[w.idx(nx,ny)])return;
    const excess=Math.max(0,biomass-(d.mature??0)),requested=d.localRelease*(.35+Math.min(1,excess)),reserve=FLORA_TISSUES[kind]?this.seedReserve[kind][i]:biomass,quantity=Math.min(requested,reserve,.65,Math.max(0,2.5-this.seedBank(kind)[w.idx(nx,ny)]));if(quantity<=.0001)return;const offspring=makeClonalPropagule(this,kind,i,quantity),added=this.deposit(kind,nx,ny,quantity,{payload:offspring});if(added>0){exportPlantReserve(this.sim,kind,i,w.plants[kind][i],w.plants[kind][i]-added);w.plants[kind][i]=Math.max(0,w.plants[kind][i]-added);if(FLORA_TISSUES[kind])this.seedReserve[kind][i]=Math.max(0,this.seedReserve[kind][i]-added)}
  }
  germinate(kind,i,moisture,fertility,temp){
    const p=PLANTS[kind],d=p?.dispersal,bank=this.seedBank(kind);if(!d||!bank||this.isEstablished(kind,i)||this.sim.world.plants[kind][i]>.002||bank[i]<.012)return 0;
    const selected=chooseSeedCohort(this,kind,i);if(!selected)return 0;const waterFit=Math.max(0,1-Math.abs(moisture-selected.genome.traits.waterNeed)*1.75),tempFit=coldFloraTemperatureFactor(kind,temp),fit=waterFit*tempFit*(.42+.58*fertility);
    if(fit<.20)return 0;
    const x=i%this.sim.world.n,y=Math.floor(i/this.sim.world.n);
    const disturbance=d.soilDisturbanceResponse?this.sim.partAbilities?.disturbedSoilAt(x,y)||0:0;
    const establishmentRate=1+(d.soilDisturbanceResponse||0)*disturbance;
    const available=Math.min(selected.record.amount,(d.germination??.15)*fit*establishmentRate);if(!(available>0))return 0;
    const inherited={...selected.record,genomeId:selected.id};commitSeedEstablishment(this,kind,i,selected,available);this.producerOrigins[kind].set(i,{...structuredClone(inherited),parentProducerId:inherited.producerId,producerId:kind+':'+i+':'+this.nextProducerId++,establishedDay:this.sim.day,establishedTick:this.sim.tickCount});bank[i]=Math.max(0,bank[i]-available);if(bank[i]<.002){if(bank[i]<=0)this.active[kind]?.delete(i);if(bank[i]<=0)this.bankGenomes[kind].delete(i)}this.stats.germinated+=available;
    // Prepared ground also helps the seeds that actually arrive establish as biomass,
    // including when the seed bank is smaller than the daily germination cap.
    // This never bypasses the seed-bank or habitat gates above.
    const established=Math.min(available,p.carry,(d.establish??.04)*(.65+fit*.8+Math.min(.8,available*2))*establishmentRate);this.litter[i]+=available-established;this.sim.world.plantResources.totals.seedLitter+=available-established;return established;
  }
  advanceDay(){
    this.advanceAnimalCargo();
    const viable=seedViabilityEnabled(this.sim);for(const [kind,set] of Object.entries(this.active)){const bank=this.seedBank(kind),decay=PLANTS[kind]?.dispersal?.bankDecay??.98;for(const i of set){const before=bank[i],next=before*decay;scaleSeedCohorts(this,kind,i,next);bank[i]=next;if(viable){const dead=settleSeedCell(this,kind,i);if(dead>0)bank[i]=this.floraState.seeds[kind].get(i)?.size?Math.max(0,next-dead):0}if(bank[i]<=0){set.delete(i);this.bankGenomes[kind].delete(i);touchSeedBank(this);this.floraState.seeds[kind].delete(i)}const lost=before-bank[i];this.litter[i]+=lost;this.sim.world.plantResources.totals.seedLitter+=lost;}}
  }
}
function hashKind(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function mix32(x){x|=0;x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;x=Math.imul(x,0x846ca68b);x^=x>>>16;return x>>>0}
