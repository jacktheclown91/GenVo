import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {PLANTS} from '../src/sim/config.js';
import {setForm,setProto,formReading,protoReading,migrateLegacyReadings} from '../src/lineage/readings.js';

const sim=new Simulation('POPULATION-CENTER-ECOLOGY',{player:true}),p=sim.player(),mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id),size=sim.territory.cellSize;
assert.ok(mate);

// Find a dry 3x3 territory block and isolate ambient wildlife so the test can
// control the ecology around the future population center.
let base=null;
for(let cy=2;cy<13&&!base;cy++)for(let cx=2;cx<13&&!base;cx++){
  let dry=true;for(let oy=-1;oy<=1&&dry;oy++)for(let ox=-1;ox<=1;ox++){const x=(cx+ox+.5)*size,y=(cy+oy+.5)*size;if(sim.world.water[sim.world.idx(x,y)])dry=false}
  if(dry)base={cx,cy};
}
assert.ok(base,'dry population-center block found');
const centerPoint={x:(base.cx+.5)*size,y:(base.cy+.5)*size};
for(const a of sim.animals)if(!a.lineage&&a.id!==mate.id){a.x=120;a.y=120}
p.x=centerPoint.x-8;p.y=centerPoint.y;p.age=SPECIES.genvo.maturity+5;

const relatives=[];
for(let i=0;i<6;i++){
  const a=sim.spawnAnimal('genvo',centerPoint.x+(i%3)-1,centerPoint.y+Math.floor(i/3),[p,mate]);a.age=SPECIES.genvo.maturity+3;a.energy=SPECIES.genvo.maxEnergy*.9;a.hydration=SPECIES.genvo.maxHydration*.9;a.health=100;setForm(a,{kind:'forager',strength:.7,sourceGeneration:3,bornDay:sim.day});sim.lineage.registerBirth(a,[p,mate]);const rec=sim.lineage.records.get(a.id);rec.divergence=formReading(a);relatives.push(a);
}
const center=sim.generationProgress.addPopulationCenter({kind:'range-band',form:'forager',x:centerPoint.x,y:centerPoint.y,label:'Ranging Band',generation:3,animalId:relatives[0].id});

function setBlockFood(high=true){
  for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){
    const cx=base.cx+ox,cy=base.cy+oy;
    for(let y=cy*size;y<(cy+1)*size;y++)for(let x=cx*size;x<(cx+1)*size;x++){
      const i=sim.world.idx(x,y);if(sim.world.water[i])continue;
      for(const kind of Object.keys(PLANTS))sim.world.plants[kind][i]=high?Math.max(.4,(PLANTS[kind].carry||1)*.78):.005;
    }
  }
}
setBlockFood(true);sim.rebuildSpatial();sim.sustainability.invalidate();
const healthy=sim.populationEcology.centerState(center,{force:true});
assert.ok(['viable','strong'].includes(healthy.status.id),`rich isolated center is viable (${healthy.status.id})`);
assert.ok(healthy.capacity>=3,'rich ground supports multiple adults');
sim.populationEcology.advanceDay();

// Collapse most forage, preserve one relief cell, and add overlapping grazers.
setBlockFood(false);
const relief={cx:base.cx-1,cy:base.cy,x:(base.cx-.5)*size,y:(base.cy+.5)*size};
for(let y=relief.cy*size;y<(relief.cy+1)*size;y++)for(let x=relief.cx*size;x<(relief.cx+1)*size;x++){
  const i=sim.world.idx(x,y);if(sim.world.water[i])continue;sim.world.plants.bramble[i]=PLANTS.bramble.carry;sim.world.plants.sunmoss[i]=PLANTS.sunmoss.carry;
}
for(let i=0;i<7;i++){const species=i%2?'rootling':'mosskip',a=sim.spawnAnimal(species,centerPoint.x+(i%3)*.4,centerPoint.y+(i%2)*.4);a.age=SPECIES[species].maturity+2;a.energy=80;a.hydration=80}
sim.rebuildSpatial();sim.sustainability.invalidate();
const pressured=sim.populationEcology.centerState(center,{force:true});
assert.ok(pressured.score<healthy.score-.15,'real depletion and competitors materially lower center viability');
assert.ok(['critical','contested'].includes(pressured.status.id),`pressured center becomes visibly stressed (${pressured.status.id})`);
assert.ok(pressured.capacity<healthy.capacity,'local carrying capacity falls under ecological pressure');
assert.ok(pressured.competitors>=5,'competing feeders are included in center pressure');
assert.match(pressured.dominantPressure,/food scarcity|competitor pressure/);
assert.equal(sim.populationEcology.settlementCheck(centerPoint,{kind:'range-band'}).ok,false,'the same pressured ground is rejected for a new durable center');

const assigned=relatives.filter(a=>sim.generationProgress.populationAssignment(a,'forager'));
assert.ok(assigned.length>=2,'the established ranging band has a real autonomous cohort');
const redirected=assigned.map(a=>sim.generationProgress.populationAnchor(a,'forager')).find(a=>a?.populationRelief);
assert.ok(redirected,'pressure redirects part of the autonomous cohort toward better nearby ground');
assert.ok(Math.hypot(redirected.x-relief.x,redirected.y-relief.y)<size*1.6,'relief routing uses the stronger neighboring cell');

sim.populationEcology.advanceDay();
const notice=sim.populationEcology.consumeNotice();assert.ok(notice&&/carrying capacity/i.test(notice.message),'worsening center ecology produces a concise player-facing warning');

console.log('population center ecology / carrying capacity checks: PASS');
