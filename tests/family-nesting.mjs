import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';

const sim=new Simulation('FAMILY-NESTING-TEST',{player:true}),p=sim.player();
const mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id);
assert.ok(mate,'starter mate exists');

// Find a dry same-land site far enough from the first shelter to become a satellite home.
let site=null;
for(let r=8;r<=13&&!site;r+=.5)for(let k=0;k<32&&!site;k++){
  const a=k*Math.PI/16,x=p.x+Math.cos(a)*r,y=p.y+Math.sin(a)*r;
  if(x<4||y<4||x>124||y>124)continue;
  if(!sim.world.water[sim.world.idx(x,y)]&&sim.world.sameLand(p.x,p.y,x,y))site={x,y};
}
assert.ok(site,'dry same-land satellite site exists');

// Move predators away so this test measures family settlement rather than danger rejection.
for(const a of sim.animals)if(SPECIES[a.species]?.hunter){a.x=Math.min(123,site.x+30+(a.id%4));a.y=Math.min(123,site.y+26+(a.id%5))}

const adults=[];
for(let i=0;i<3;i++){
  const a=sim.spawnAnimal('genvo',p.x+1+i*.7,p.y+1,[p,mate]);
  a.age=SPECIES.genvo.maturity+4+i;a.energy=SPECIES.genvo.maxEnergy*.92;a.hydration=SPECIES.genvo.maxHydration*.92;a.health=100;
  sim.lineage.registerBirth(a,[p,mate]);adults.push(a);
}
const family=[p,...adults],size=sim.territory.cellSize,cx=Math.floor(site.x/size),cy=Math.floor(site.y/size);
const cells=[[0,0],[1,0],[-1,0],[0,1],[1,1],[-1,1],[0,-1],[1,-1]];
for(let i=0;i<cells.length;i++){
  const a=family[i%family.length],state=sim.territory.ensure(a),ccx=cx+cells[i][0],ccy=cy+cells[i][1],key=`${ccx},${ccy}`;
  state.cells.set(key,{key,cx:ccx,cy:ccy,x:(ccx+.5)*size,y:(ccy+.5)*size,visits:3.2,lastTick:sim.tickCount});
  state.home={x:site.x,y:site.y};state.radius=10;state.established=true;state.totalFamiliarity=8;
}

// First shelter already exists back at the founder's original home.
sim.shelter.shelters.length=0;
sim.shelter.shelters.push({id:1,ownerId:p.id,x:p.x,y:p.y,integrity:100,weatherSeal:1,foodStore:8,capacity:28,kind:'primary',constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount});

// Ensure the target has real construction biomass.
for(let yy=Math.floor(site.y)-3;yy<=Math.floor(site.y)+3;yy++)for(let xx=Math.floor(site.x)-3;xx<=Math.floor(site.x)+3;xx++){
  const i=sim.world.idx(xx,yy);if(sim.world.water[i])continue;
  sim.world.plants.sunmoss[i]=.88;sim.world.plants.bramble[i]=.72;sim.world.plants.thistlepod[i]=.48;
}
sim.rebuildSpatial();sim.sustainability.invalidate();
const reach=sim.expansion.snapshot();
assert.equal(reach.nestUnlocked,true,'4 adults across 8 familiar cells unlock a satellite nest');
assert.equal(reach.shelterCapacity,2,'first population-scale nest unlock raises shelter capacity to two');
assert.equal(reach.nestAvailable,true,'one satellite slot is available');

const beforeMaterial=sim.shelter.materialAvailable(site.x,site.y,2.6);
assert.equal(sim.familyDirectives.setAreaOrder('nest',site),true,sim.familyDirectives.lastAreaMessage);
assert.equal(sim.shelter.activeProjects().length,1,'Nest Here creates a real construction project');
let d=sim.familyDirectives.decision(adults[0]);assert.equal(d.intent,'family-area-nest','grown relatives move toward the marked nest project');

// Construction requires bodies at the site and consumes local biomass rather than spawning a free building.
p.x=site.x+.2;p.y=site.y+.1;for(let i=0;i<adults.length;i++){adults[i].x=site.x+(i-1)*.35;adults[i].y=site.y+.25}
sim.rebuildSpatial();
for(let i=0;i<40&&sim.shelter.activeProjects().length;i++)sim.shelter.phaseNestProjects();
assert.equal(sim.shelter.activeProjects().length,0,'family workers can finish the nest project');
assert.equal(sim.shelter.shelters.length,2,'finished project creates a second physical family shelter');
const satellite=sim.shelter.shelters.find(s=>s.kind==='satellite');assert.ok(satellite,'new home site is identified as a satellite nest');
assert.ok(sim.shelter.materialAvailable(site.x,site.y,2.6)<beforeMaterial,'satellite construction consumes real local plant material');
assert.equal(sim.familyDirectives.areaStatus().order,null,'completed nest clears the temporary local order');
assert.equal(sim.expansion.snapshot().nestAvailable,false,'current family cannot exceed its supported shelter capacity');
assert.equal(sim.familyDirectives.setAreaOrder('nest',{x:site.x+8,y:site.y}),false,'another nest cannot be queued beyond current capacity');

const headless=new Simulation('FAMILY-NESTING-HEADLESS',{player:false});
for(let i=0;i<200;i++)headless.update(null);
assert.equal(headless.shelter.shelters.length,0,'player-off ecology does not create hidden family nests');
assert.equal(headless.shelter.projects.length,0,'player-off ecology does not create hidden nest projects');
console.log('family satellite nesting checks: PASS');
