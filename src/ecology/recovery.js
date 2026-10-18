// Historical RecoveryController name retained for save/controller compatibility.
// Local forage/crowding and actual condition own reproductive opportunity. Startup
// population targets must not steer reproductive drive, search, kinship or predation.
export class RecoveryController{
  constructor(sim){this.sim=sim}
  population(species){return this.sim._decisionPopulation?.[species]??this.sim.population()[species]??0}
  driveBoost(){return 1}
  sparse(){return false}
  critical(){return false}
  mateRadius(_species,{far=false}={}){return far?20:12}
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
  mayRelaxSibling(){return false}
  inbreedingLoad(parents){
    if(!parents?.[0]||!parents?.[1])return 0;
    return this.kinship(parents[0],parents[1])==='sibling'?.18:0;
  }
  // No global-count refuge. Encounter, energy and prey-risk authorities still act.
  preyIsRefuged(){return false}
}
