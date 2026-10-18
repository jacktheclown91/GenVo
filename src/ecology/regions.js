import {hasPart} from '../lineage/part-abilities.js';
import {createPageResidency,recordPageResident,removePageResident,reconcilePageResidency} from './page-residency.js';
import {WORLD_PAGE_SIZE} from '../world/pages.js';
import {observeEngineerSuccession,noteEngineerWork,engineerSuccessionEvents} from './engineer-succession.js';
import {noteEngineerConception,noteEngineerColonyBirth,observeEngineerColony,engineerColonyEvidence} from './engineer-colonies.js';
import {observeEngineerBreedingOpportunity} from './engineer-breeding-opportunities.js';
import {noteEngineerLifeConception,noteEngineerLifeBirth,noteEngineerLifeDeath,observeEngineerLifeHistory,engineerLifeHistoryEvidence} from './engineer-life-history.js';
import {observeEngineerWaterAccess,noteEngineerActualDrink,engineerWaterAccessEvidence} from './engineer-water-access.js';
import {noteEngineerBreedingHabitatConception,noteEngineerBreedingHabitatBirth,observeEngineerBreedingHabitat,engineerBreedingHabitatEvidence} from './engineer-breeding-habitat.js';
import {noteEngineerFamilySettlementBirth,noteEngineerFamilySettlementDeath,observeEngineerFamilySettlement,engineerFamilySettlementEvidence} from './engineer-family-settlement.js';

// Regional observation and persistence boundary. Inventories read canonical world
// fields; these records neither own duplicate stocks nor set population targets.
export class RegionalEcologyController{
  constructor(sim){this.sim=sim;this.chunkSize=16;this.records=new Map();this.membership=new Map();this.lastDay=-1;this.historyLimit=12;this.engineeringHistoryLimit=28;this.engineeringSampleDays=4;this.pageTransit=createPageResidency();}
  keyAt(x,y){const n=this.sim.world.n;return `${Math.floor(Math.max(0,Math.min(n-1,x))/this.chunkSize)}:${Math.floor(Math.max(0,Math.min(n-1,y))/this.chunkSize)}`;}
  bounds(key){const [cx,cy]=String(key).split(':').map(Number),n=this.sim.world.n;if(!Number.isInteger(cx)||!Number.isInteger(cy)||cx<0||cy<0||cx*this.chunkSize>=n||cy*this.chunkSize>=n)throw Error('Invalid ecological region');return{x0:cx*this.chunkSize,y0:cy*this.chunkSize,x1:Math.min(n,(cx+1)*this.chunkSize),y1:Math.min(n,(cy+1)*this.chunkSize)};}
  resetPageResidency(){this.pageTransit=createPageResidency();this.reconcilePages();}
  ensurePageTransit(){return this.pageTransit??(this.pageTransit=createPageResidency());}
  notePageBirth(animal){recordPageResident(this.ensurePageTransit(),this.sim.world,animal,{day:this.sim.day,tick:this.sim.tickCount});}
  notePageDeath(animal){removePageResident(this.pageTransit,animal.id);}
  notePageMove(animal,x,y){
    // Skip movement inside a page. A crossing is recorded after the organism itself moves.
    if(Math.floor(x/WORLD_PAGE_SIZE)===Math.floor(animal.x/WORLD_PAGE_SIZE)&&Math.floor(y/WORLD_PAGE_SIZE)===Math.floor(animal.y/WORLD_PAGE_SIZE))return false;
    return recordPageResident(this.ensurePageTransit(),this.sim.world,animal,{from:{x,y},day:this.sim.day,tick:this.sim.tickCount});
  }
  reconcilePages(){reconcilePageResidency(this.ensurePageTransit(),this.sim);}
  ensure(key){this.bounds(key);let r=this.records.get(key);if(!r){r={key,population:{},lineage:0,observedDay:null,observedTick:null,births:{},deaths:{},mortality:{},arrivals:{},departures:{},history:[]};this.records.set(key,r);}return r;}
  noteBirth(animal){this.notePageBirth(animal);const mother=this.sim.animals.find(a=>a.id===animal.parentIds?.[0]);noteEngineerLifeBirth(this,animal,mother,this.sim.day);noteEngineerBreedingHabitatBirth(this,animal,mother,this.sim.day);noteEngineerFamilySettlementBirth(this,animal,mother,this.sim.day);const r=this.ensure(this.keyAt(animal.x,animal.y));r.births[animal.species]=(r.births[animal.species]||0)+1;if(hasPart(animal,'digging-forelimb')){r.recentEngineerBirths??=[];r.recentEngineerBirths.push({id:animal.id,day:this.sim.day});if(r.recentEngineerBirths.length>16)r.recentEngineerBirths.shift();noteEngineerColonyBirth(r,animal,this.sim.day);}}
  noteMating(mother,father){if(!hasPart(mother,'digging-forelimb')&&!hasPart(father,'digging-forelimb'))return false;const key=this.keyAt(mother.x,mother.y);if(key!==this.keyAt(father.x,father.y))return false;noteEngineerLifeConception(this,mother,father,this.sim.day);noteEngineerBreedingHabitatConception(this,mother,father,this.sim.day);return noteEngineerConception(this.ensure(key),mother,father,this.sim.day);}
  noteMigrationArrival(animal,target){
    const r=this.ensure(this.keyAt(animal.x,animal.y));
    r.migrationArrivals??={};r.migrationArrivalHistory??=[];
    r.migrationArrivals[animal.species]=(r.migrationArrivals[animal.species]||0)+1;
    r.migrationArrivalHistory.push({id:animal.id,species:animal.species,day:this.sim.day,tick:this.sim.tickCount,x:animal.x,y:animal.y,target:{x:target.x,y:target.y}});
    if(r.migrationArrivalHistory.length>this.historyLimit)r.migrationArrivalHistory.splice(0,r.migrationArrivalHistory.length-this.historyLimit);
  }
  // Observe completed ecological work, never desired work or species labels.
  // A digger is defined by a successful anatomy-gated action in the canonical
  // PartAbilityController. This record owns no food or habitat inventories.
  noteSoilDig(animal){
    const r=this.ensure(this.keyAt(animal.x,animal.y));
    r.engineering??={digs:0,bySpecies:{},byGeneration:{},lastDigDay:null,history:[]};
    const e=r.engineering;e.digs++;
    e.bySpecies[animal.species]=(e.bySpecies[animal.species]||0)+1;
    e.byGeneration[animal.generation]=(e.byGeneration[animal.generation]||0)+1;
    e.lastDigDay=this.sim.day;
    noteEngineerWork(r,this.sim.day);
  }
  engineeringHabitat(key){
    const w=this.sim.world,b=this.bounds(key);let disturbedCells=0,soilStrength=0,thistlepodBiomass=0,thistlepodSeedBank=0;
    for(let y=b.y0;y<b.y1;y++)for(let x=b.x0;x<b.x1;x++){
      const i=w.idx(x,y),soil=this.sim.partAbilities?.disturbedSoilAt(x,y)||0;
      soilStrength+=soil;if(soil>0)disturbedCells++;
      thistlepodBiomass+=w.plants.thistlepod[i];thistlepodSeedBank+=w.seedBank.thistlepod[i];
    }
    return{disturbedCells,soilStrength,thistlepodBiomass,thistlepodSeedBank};
  }
  engineeringTrend(key){
    return(this.records.get(key)?.engineering?.history||[]).map(entry=>({...entry}));
  }
  engineerTransitions(key){return engineerSuccessionEvents(this.records.get(key));}
  engineerColonyEvidence(key){return engineerColonyEvidence(this.records.get(key));}
  noteDeath(animal,cause){this.notePageDeath(animal);noteEngineerLifeDeath(this,animal,cause,this.sim.day);noteEngineerFamilySettlementDeath(this,animal,this.sim.day);const r=this.ensure(this.keyAt(animal.x,animal.y));r.deaths[animal.species]=(r.deaths[animal.species]||0)+1;const key=`${animal.species}:${cause}`;r.mortality[key]=(r.mortality[key]||0)+1;}
  observe(){
    this.reconcilePages();
    if(this.lastDay===this.sim.day)return;this.lastDay=this.sim.day;
    for(const r of this.records.values()){r.population={};r.lineage=0;}
    const living=new Set(),engineers=new Map();
    for(const a of this.sim.animals){if(!a.alive)continue;living.add(a.id);const key=this.keyAt(a.x,a.y),r=this.ensure(key),previous=this.membership.get(a.id);
      r.population[a.species]=(r.population[a.species]||0)+1;if(a.lineage)r.lineage++;
      // A sampled boundary crossing is an observation, not a migration command.
      if(previous&&previous!==key){const origin=this.ensure(previous);origin.departures[a.species]=(origin.departures[a.species]||0)+1;r.arrivals[a.species]=(r.arrivals[a.species]||0)+1;}
      if(hasPart(a,'digging-forelimb')){if(!engineers.has(key))engineers.set(key,[]);engineers.get(key).push({id:a.id,species:a.species,generation:a.generation,from:previous||null});}
      this.membership.set(a.id,key);
    }
    for(const id of this.membership.keys())if(!living.has(id))this.membership.delete(id);
    for(const r of this.records.values()){
      r.observedDay=this.sim.day;r.observedTick=this.sim.tickCount;
      const births=new Set((r.recentEngineerBirths||[]).filter(e=>this.sim.day-e.day<=1).map(e=>e.id));
      if(r.recentEngineerBirths)r.recentEngineerBirths=r.recentEngineerBirths.filter(e=>this.sim.day-e.day<=1);
      const localEngineers=engineers.get(r.key)||[];
      observeEngineerSuccession(r,localEngineers,this.sim.day,births);
      observeEngineerColony(r,localEngineers,this.sim.day);
      observeEngineerBreedingOpportunity(r,this.sim,this.sim.day);
      // Life-history observations never influence animal decisions or fertility.
      r.history.push({day:this.sim.day,year:this.sim.year,tick:this.sim.tickCount,population:{...r.population},lineage:r.lineage});
      if(r.history.length>this.historyLimit)r.history.splice(0,r.history.length-this.historyLimit);
      const e=r.engineering;
      // Only recently worked regions are sampled. Bound retained samples, and
      // stop observing after the soil has had time to recover without new work.
      if(e&&this.sim.day%this.engineeringSampleDays===0&&this.sim.day-e.lastDigDay<=90){
        e.history??=[];
        e.history.push({day:this.sim.day,digs:e.digs,...this.engineeringHabitat(r.key)});
        if(e.history.length>this.engineeringHistoryLimit)e.history.splice(0,e.history.length-this.engineeringHistoryLimit);
      }
    }
    observeEngineerLifeHistory(this,this.sim.day);
    observeEngineerWaterAccess(this,this.sim.day);
    observeEngineerBreedingHabitat(this,this.sim.day);
    observeEngineerFamilySettlement(this,this.sim.day);
  }
  engineerLifeHistoryEvidence(){return engineerLifeHistoryEvidence(this);}
  noteEngineerDrink(animal,gained){return noteEngineerActualDrink(this,animal,gained);}
  engineerWaterAccessEvidence(){return engineerWaterAccessEvidence(this);}
  engineerBreedingHabitatEvidence(){return engineerBreedingHabitatEvidence(this);}
  engineerFamilySettlementEvidence(){return engineerFamilySettlementEvidence(this);}
  regionsInRadius(x,y,radius){
    if(!Number.isFinite(radius)||radius<0)throw Error('Invalid region radius');const n=this.sim.world.n,size=this.chunkSize,keys=[];
    for(let cy=Math.max(0,Math.floor((y-radius)/size));cy<=Math.min(Math.ceil(n/size)-1,Math.floor((y+radius)/size));cy++)for(let cx=Math.max(0,Math.floor((x-radius)/size));cx<=Math.min(Math.ceil(n/size)-1,Math.floor((x+radius)/size));cx++){
      const key=`${cx}:${cy}`,b=this.bounds(key),dx=Math.max(b.x0-x,0,x-b.x1),dy=Math.max(b.y0-y,0,y-b.y1);if(dx*dx+dy*dy<=radius*radius)keys.push(key);
    }return keys;
  }
  habitat(key){
    const world=this.sim.world,b=this.bounds(key),resources={},connectivity=new Set();let cells=0,waterCells=0,drinkableCells=0,temperature=0,moisture=0,fertility=0,disturbedSoilCells=0,soilDisturbance=0;
    const fields={...world.plants,...world.freshwaterFood,carrion:world.carrion};for(const kind of Object.keys(fields))resources[kind]=0;
    for(let y=b.y0;y<b.y1;y++)for(let x=b.x0;x<b.x1;x++){const i=world.idx(x,y),disturbance=this.sim.partAbilities?.disturbedSoilAt(x,y)||0;soilDisturbance+=disturbance;if(disturbance>0)disturbedSoilCells++;cells++;waterCells+=world.water[i]?1:0;drinkableCells+=world.drinkable[i]?1:0;temperature+=world.temperature[i];moisture+=world.moisture[i];fertility+=world.fertility[i];if(world.landRegion[i])connectivity.add(world.landRegion[i]);for(const [kind,field] of Object.entries(fields))resources[kind]+=field[i];}
    return{key,bounds:b,observedDay:this.sim.day,observedTick:this.sim.tickCount,cells,waterCells,drinkableCells,habitatModifiers:{disturbedSoilCells,soilDisturbance},climate:{temperature:temperature/cells,moisture:moisture/cells,fertility:fertility/cells},landConnectivityIds:[...connectivity].sort((a,b)=>a-b),resources,inventoryOnly:true};
  }
}
