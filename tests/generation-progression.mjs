import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {setForm,setProto,formReading,protoReading,migrateLegacyReadings} from '../src/lineage/readings.js';

function heirWithForm(sim,kind){
  const founder=sim.player(),mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==founder.id);
  assert.ok(mate,'starter GenVo8 mate exists');
  const child=sim.spawnAnimal('genvo',founder.x+1,founder.y,[founder,mate]);child.age=SPECIES.genvo.maturity+2;child.energy=SPECIES.genvo.maxEnergy*.9;child.hydration=SPECIES.genvo.maxHydration*.9;child.health=100;
  sim.lineage.registerBirth(child,[founder,mate]);setForm(child,{kind,strength:.62,sourceGeneration:2,bornDay:sim.day});const rec=sim.lineage.records.get(child.id);rec.divergence=formReading(child);
  assert.equal(sim.lineage.handoffTo(child.id,{manual:true}),true,'G2 handoff succeeds');
  return{founder,child};
}

{
  const sim=new Simulation('GENVO8-G2-FORAGER');
  assert.deepEqual(sim.expansion.scoutThreshold(),{cells:6,adults:3,label:'Scout'},'Scout keeps the normal population threshold before a generation trial');
  const {child}=heirWithForm(sim,'forager'),trial=sim.generationProgress.status(child);
  assert.equal(trial?.kind,'forager','Forager G2 receives the rangebreak trial');
  // Stage F: the trial is two goals read from state, in any order, like the opening goals.
  assert.match(trial.title,/Rangebreak/i,'rangebreak gives G2 a new outward goal');
  assert.equal(trial.step,'0/2');assert.match(trial.body,/○ Feed beyond the old range · ○ Make ranging a habit/);
  sim.habits.ensure(child).range=.35;sim.generationProgress.update();
  assert.equal(sim.generationProgress.hasUnlock('trail-scout'),false,'a ranging habit alone does not finish the trial');
  assert.equal(sim.generationProgress.status(child).step,'1/2','the habit goal can be done first');
  child.x=trial.guideTarget.x;child.y=trial.guideTarget.y;
  sim.tickCount++;sim.lastPlayerAction={type:'eat',kind:'sunmoss',tick:sim.tickCount};sim.generationProgress.update();
  assert.equal(sim.generationProgress.hasUnlock('trail-scout'),true,'feeding beyond the old range with a ranging habit earns Trail Scout');
  assert.deepEqual(sim.expansion.scoutThreshold(),{cells:4,adults:2,label:'Trail Scout'},'Forager proof lowers Scout to an earlier family-scale threshold');
}

{
  const sim=new Simulation('GENVO8-G2-COLONY'),founder=sim.player();
  sim.shelter.shelters.push({id:991,ownerId:founder.id,x:founder.x,y:founder.y,integrity:100,weatherSeal:1,foodStore:5,capacity:28,constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount});
  assert.deepEqual(sim.expansion.nestThreshold(),{cells:8,adults:4,label:'Satellite nest'},'satellite nesting keeps the normal threshold before colony proof');
  const pair=heirWithForm(sim,'colony'),child=pair.child,trial=sim.generationProgress.status(child);
  assert.equal(trial?.kind,'colony','Colony G2 receives the kin gathering trial');
  assert.match(trial.body,/Family Command/i,'colony trial explicitly shifts play toward family leadership');
  pair.founder.x=trial.guideTarget.x+.5;pair.founder.y=trial.guideTarget.y;child.x=trial.guideTarget.x;child.y=trial.guideTarget.y;
  assert.equal(sim.familyDirectives.setAreaOrder('gather',{x:trial.guideTarget.x,y:trial.guideTarget.y},'test'),true,'grown founder can answer the G2 gather command');
  for(let i=0;i<(sim.generationProgress.active?.requiredTicks||40)+2;i++){sim.tickCount++;sim.generationProgress.update()}
  assert.equal(sim.generationProgress.active?.gathered,true,'sustained kin gathering completes the gathering goal');
  assert.equal(sim.generationProgress.hasUnlock('kin-network'),false,'Kin Network also needs a settled home habit');
  sim.habits.ensure(child).home=.32;sim.generationProgress.update();
  assert.equal(sim.generationProgress.hasUnlock('kin-network'),true,'kin gathering plus a home habit earns Kin Network');
  assert.deepEqual(sim.expansion.nestThreshold(),{cells:6,adults:3,label:'Kin Network'},'Colony proof lowers the future satellite-nest threshold');
}

console.log('generation progression checks: PASS');

function addFamiliarCells(sim,animals,count,origin={cx:5,cy:5}){
  const size=sim.territory.cellSize;
  for(let i=0;i<count;i++){
    const a=animals[i%animals.length],state=sim.territory.ensure(a),cx=origin.cx+(i%4),cy=origin.cy+Math.floor(i/4),key=`${cx},${cy}`;
    state.cells.set(key,{key,cx,cy,x:(cx+.5)*size,y:(cy+.5)*size,visits:3.2,lastTick:sim.tickCount});
  }
}

function g3Descendant(sim,g2,kind){
  const mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==g2.id)||sim.player();
  const child=sim.spawnAnimal('genvo',g2.x+1,g2.y,[g2,mate]);child.age=SPECIES.genvo.maturity+3;child.energy=SPECIES.genvo.maxEnergy*.92;child.hydration=SPECIES.genvo.maxHydration*.92;child.health=100;
  sim.lineage.registerBirth(child,[g2,mate]);setForm(child,{kind,strength:.72,sourceGeneration:3,bornDay:sim.day});const rec=sim.lineage.records.get(child.id);rec.divergence=formReading(child);
  assert.equal(child.generation,3,'staged descendant is G3');
  assert.equal(sim.lineage.handoffTo(child.id,{manual:true}),true,'G3 handoff succeeds');
  return child;
}

// G3 Forager turns Scout leadership into a persistent outer population center.
{
  const sim=new Simulation('GENVO8-G3-FORAGER'),pair=heirWithForm(sim,'forager'),g2=pair.child;
  sim.generationProgress.active=null;sim.generationProgress.unlocks.add('trail-scout');
  addFamiliarCells(sim,[pair.founder,g2],4);
  const g3=g3Descendant(sim,g2,'forager'),trial=sim.generationProgress.status(g3);
  assert.equal(trial?.generation,3);assert.equal(trial?.kind,'forager');assert.match(trial.title,/ranging band/i,'G3 Forager introduces a population-scale frontier job');
  assert.equal(sim.familyDirectives.setAreaOrder('scout',{x:trial.guideTarget.x,y:trial.guideTarget.y},'test'),true,sim.familyDirectives.lastAreaMessage);
  sim.generationProgress.update();assert.equal(sim.generationProgress.active?.stage,'hold','Scout order begins the ranging-band establishment phase');
  const relative=g2;relative.x=sim.generationProgress.active.target.x+.4;relative.y=sim.generationProgress.active.target.y;relative.age=SPECIES.genvo.maturity+4;
  for(let i=0;i<(sim.generationProgress.active?.requiredTicks||40)+2;i++){sim.tickCount++;sim.generationProgress.update()}
  assert.equal(sim.generationProgress.hasUnlock('range-network'),true,'sustained relative presence establishes the Range Network');
  const center=sim.generationProgress.centers('range-band')[0];assert.ok(center&&Number.isFinite(center.x),'G3 Forager records a persistent outer population center');
  const assigned=sim.expansion.adults().find(a=>sim.generationProgress.populationAnchor(a,'forager'));assert.ok(assigned,'at least one autonomous Forager relative is assigned to the new population center');
  const roam=sim.tendency.roamTarget(assigned);assert.ok(Math.hypot(roam.x-center.x,roam.y-center.y)<20,'Forager roaming now originates from the outer population center');
  assert.match(sim.generationProgress.centerSummary(),/RANGING 1/);
}

// G3 Colony must construct and occupy a real second shelter before it becomes a population center.
{
  const sim=new Simulation('GENVO8-G3-COLONY'),pair=heirWithForm(sim,'colony'),g2=pair.child,founder=pair.founder;
  sim.generationProgress.active=null;sim.generationProgress.unlocks.add('kin-network');
  const extra=sim.spawnAnimal('genvo',g2.x+1.5,g2.y+1,[g2,founder]);extra.age=SPECIES.genvo.maturity+5;extra.energy=SPECIES.genvo.maxEnergy*.95;extra.hydration=SPECIES.genvo.maxHydration*.95;extra.health=100;sim.lineage.registerBirth(extra,[g2,founder]);
  sim.shelter.shelters.length=0;sim.shelter.nextId=2;sim.shelter.shelters.push({id:1,ownerId:founder.id,x:founder.x,y:founder.y,integrity:100,weatherSeal:1,foodStore:7,capacity:28,kind:'primary',constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount});
  addFamiliarCells(sim,[founder,g2,extra],6,{cx:8,cy:8});
  const g3=g3Descendant(sim,g2,'colony');
  // Find learned outer ground that can physically support the new nest.
  let site=null;const size=sim.territory.cellSize,occupied=sim.expansion.occupiedCells();
  for(const cell of occupied){
    const x=cell.x,y=cell.y;if(Math.hypot(x-founder.x,y-founder.y)<8)continue;
    for(let yy=Math.floor(y)-3;yy<=Math.floor(y)+3;yy++)for(let xx=Math.floor(x)-3;xx<=Math.floor(x)+3;xx++){if(xx<1||yy<1||xx>=127||yy>=127)continue;const i=sim.world.idx(xx,yy);if(sim.world.water[i])continue;sim.world.plants.sunmoss[i]=.9;sim.world.plants.bramble[i]=.72;sim.world.plants.thistlepod[i]=.52}
    sim.sustainability.invalidate?.();const check=sim.shelter.canEstablishNestAt({x,y});if(check.ok){site={x,y};break}
  }
  assert.ok(site,'test creates a viable learned satellite site');
  const trial=sim.generationProgress.status(g3);assert.equal(trial?.generation,3);assert.equal(trial?.kind,'colony');
  assert.equal(sim.familyDirectives.setAreaOrder('nest',site,'test'),true,sim.familyDirectives.lastAreaMessage);sim.generationProgress.update();assert.equal(sim.generationProgress.active?.stage,'build');
  const workers=[founder,g2,extra];for(let i=0;i<workers.length;i++){workers[i].x=site.x+(i-1)*.3;workers[i].y=site.y+.2;workers[i].energy=SPECIES.genvo.maxEnergy*.95;workers[i].health=100}
  for(let i=0;i<80&&sim.shelter.activeProjects().length;i++){sim.tickCount++;sim.shelter.phaseNestProjects();sim.generationProgress.update()}
  assert.equal(sim.generationProgress.active?.stage,'occupy','finished satellite shelter moves G3 into population occupancy');
  const shelter=sim.shelter.activeShelters().find(s=>s.kind==='satellite');assert.ok(shelter);
  founder.x=shelter.x+.3;founder.y=shelter.y;g2.x=shelter.x-.3;g2.y=shelter.y;
  for(let i=0;i<(sim.generationProgress.active?.requiredTicks||40)+2;i++){sim.tickCount++;sim.generationProgress.update()}
  assert.equal(sim.generationProgress.hasUnlock('satellite-colony'),true,'occupied second shelter establishes the Satellite Colony');
  const center=sim.generationProgress.centers('satellite-colony')[0];assert.equal(center?.shelterId,shelter.id,'population center is tied to the physical satellite shelter');
  const assigned=sim.expansion.adults().find(a=>sim.generationProgress.populationAnchor(a,'colony'));assert.equal(sim.generationProgress.populationAnchor(assigned,'colony')?.shelterId,shelter.id,'autonomous Colony relatives can inherit the second home as their anchor');
  assert.match(sim.generationProgress.centerSummary(),/SATELLITE 1/);
}
