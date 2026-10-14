import {canHunt,preyPreference} from './functional-diet.js';
import {CFG} from '../sim/config.js';
import {SPECIES} from '../organisms/species.js';

const clamp=(min,max,v)=>Math.max(min,Math.min(max,v));

// RecoveryController models low-density ecology without ever creating animals.
// Sparse populations get stronger mate-seeking and reproductive drive because
// competition is low, while predators switch away from rare prey when common
// alternatives exist. In critically small populations sibling avoidance can
// relax only when no unrelated mate is available; direct parent/child mating
// remains forbidden and offspring inherit an inbreeding load.
export class RecoveryController{
  constructor(sim){this.sim=sim}
  population(species){return this.sim._decisionPopulation?.[species]??this.sim.population()[species]??0}
  founder(species){return Math.max(1,CFG.initial[species]??1)}
  ratio(species){return this.population(species)/this.founder(species)}
  settings(species){return SPECIES[species]?.recovery||{}}
  driveBoost(species){
    const r=this.ratio(species),max=this.settings(species).driveBoost??1.55;
    if(r>=1)return 1;
    return 1+(max-1)*clamp(0,1,1-r);
  }
  sparse(species){return this.ratio(species)<(this.settings(species).sparseRatio??1.25)}
  critical(species){return this.ratio(species)<(this.settings(species).criticalRatio??.42)}
  mateRadius(species,{far=false}={}){
    const r=this.ratio(species),cfg=this.settings(species);
    if(r<(cfg.criticalRatio??.42))return far?(cfg.criticalMateRadius??84):(cfg.criticalNearRadius??34);
    if(r<(cfg.sparseRatio??1.25))return far?(cfg.sparseMateRadius??50):(cfg.sparseNearRadius??20);
    return far?20:12;
  }
  grandparents(animal){
    if(Array.isArray(animal?.grandparentIds))return animal.grandparentIds;
    // Recover legacy ancestry where actors or lineage history still retain it.
    // Newborns carry at most four IDs; their queries need no history traversal.
    if(this._ancestryTick!==this.sim.tickCount||this._ancestryActors!==this.sim.animals||this._ancestryCount!==this.sim.animals.length){
      this._ancestryIndex=new Map(this.sim.animals.map(a=>[a.id,a]));
      this._ancestryTick=this.sim.tickCount;this._ancestryActors=this.sim.animals;this._ancestryCount=this.sim.animals.length;
    }
    return [...new Set((animal?.parentIds||[]).flatMap(id=>(this._ancestryIndex.get(id)||this.sim.lineage?.records.get(id))?.parentIds||[]))];
  }
  kinship(a,b){
    if(!a||!b)return'none';
    const ap=a.parentIds||[],bp=b.parentIds||[];
    if(a.id===b.id||ap.includes(b.id)||bp.includes(a.id))return'direct';
    if(ap.some(id=>bp.includes(id)))return'sibling';
    const ag=this.grandparents(a),bg=this.grandparents(b);
    if(ag.includes(b.id)||bg.includes(a.id))return'direct';
    if(ap.some(id=>bg.includes(id))||bp.some(id=>ag.includes(id))||ag.some(id=>bg.includes(id)))return'close';
    return'none';
  }
  mayRelaxSibling(a){return !a.player&&this.critical(a.species)}
  inbreedingLoad(parents){
    if(!parents?.[0]||!parents?.[1])return 0;
    const kin=this.kinship(parents[0],parents[1]);
    return kin==='sibling'?.18:0;
  }
  // Rare prey remain possible in a true starvation emergency, but a predator
  // with adequate reserves will search/scavenge rather than keep suppressing a
  // prey family below its low-density refuge threshold.
  // v1.61.0: the alternative must be within reach (localCounts from the hunter's own search), not
  // only common somewhere else in the world, or a hunter on an island starves beside its only prey.
  preyIsRefuged(predator,preySpecies,global,localCounts=null){
    const cfg=this.settings(preySpecies),threshold=cfg.rarePreyRatio??.68;
    if(this.ratioFrom(global,preySpecies)>=threshold)return false;
    const ps=SPECIES[predator.species],energy=predator.energy/ps.maxEnergy;
    if(energy<(ps.reproduction?.emergencyHuntEnergy??.30))return false;
    const alternatives=Object.keys(ps.diets||{}).filter(sp=>SPECIES[sp]&&sp!==preySpecies&&(ps.diets[sp]||0)>0);
    const reachableAlternative=alternatives.some(sp=>this.ratioFrom(global,sp)>=(this.settings(sp).commonPreyRatio??.85)&&(!localCounts||(localCounts[sp]||0)>0));
    // With reserves, search or scavenge even when the rare cohort is the only
    // local prey. Otherwise an isolated recovering population has no refuge.
    // Below the emergency threshold above, every edible species remains available.
    return reachableAlternative||energy>=.55;
  }
  ratioFrom(global,species){return (global?.[species]??0)/this.founder(species)}
}
