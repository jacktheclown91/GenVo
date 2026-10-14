import path from 'node:path';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {Simulation} from '../src/sim/simulation.js';

const original=Simulation.prototype.tryMate;
const rebuildFixtures=process.argv.includes('--rebuild-fixtures');
const prepareFixtures=process.argv.includes('--prepare-fixtures');
const placements=[];
const rejections=[],results=[];
Simulation.prototype.tryMate=function(a,b){
  if(rebuildFixtures)this.rebuildSpatial();
  if(prepareFixtures&&a&&b&&!this.isManualPlayer(a)&&!this.isManualPlayer(b)){
    let placed=false;
    for(let y=3;y<this.world.n-3&&!placed;y+=4)for(let x=3;x<this.world.n-3&&!placed;x+=4){
      if(!this.canOccupy(a,x,y)||!this.canOccupy(b,x+.2,y))continue;
      a.x=x;a.y=y;b.x=x+.2;b.y=y;this.rebuildSpatial();
      if(this.carrying.breedingState(a).allowed&&this.carrying.breedingState(b).allowed){placed=true;placements.push({seed:this.seed,species:a.species,x,y})}
    }
    if(!placed)throw Error('no real habitat supports the test pair');
  }
  if(a&&b&&!this.isManualPlayer(a)&&!this.isManualPlayer(b)){
    const pressureA=this.carrying.breedingState(a),pressureB=this.carrying.breedingState(b);
    if(!pressureA.allowed||!pressureB.allowed){rejections.push({seed:this.seed,species:a.species,a:a.id,b:b.id,pressureA,pressureB});return false}
  }
  return original.call(this,a,b);
};
try{
  for(const file of ['reproduction.mjs','birth-reserves.mjs','maternal-birth-authority.mjs','gestation-inheritance.mjs','evolution-editor.mjs','mating-arrival-pressure.mjs']){
    try{await import(pathToFileURL(path.resolve('tests',file)).href);results.push({file,pass:true})}
    catch(error){results.push({file,pass:false,error:error.message});console.error(file,error.message)}
  }
}finally{Simulation.prototype.tryMate=original}
const output=process.argv.find(arg=>arg.startsWith('--output='))?.slice(9)||'reports/pass-x-mating-arrival-candidate-checks'+(prepareFixtures?'-prepared':rebuildFixtures?'-rebuilt':'')+'.json';
fs.writeFileSync(output,JSON.stringify({productionChanged:false,rebuildFixtures,prepareFixtures,placements,results,rejections},null,2));
console.log(JSON.stringify({results,rejectedFixtures:rejections.length,rebuildFixtures,prepareFixtures,productionChanged:false}));
if(results.some(r=>!r.pass))process.exitCode=1;
