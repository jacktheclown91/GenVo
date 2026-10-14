import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG,PLANTS} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';

function establish(sim,p,x=48,y=48){
  p.x=x;p.y=y;p.age=SPECIES.genvo.maturity+10;p.energy=SPECIES.genvo.maxEnergy*.9;p.hydration=SPECIES.genvo.maxHydration*.9;p.health=100;
  const state=sim.territory.ensure(p);state.cells.clear();
  const cx=Math.floor(x/8),cy=Math.floor(y/8),cell={key:`${cx},${cy}`,cx,cy,x:(cx+.5)*8,y:(cy+.5)*8,visits:10,lastTick:sim.tickCount};
  state.cells.set(cell.key,cell);sim.territory.recompute(p,state);state.established=true;state.home={x,y};state.radius=8;state.totalFamiliarity=10;
  return state;
}
function forceScarcity(sim,homeX=48,homeY=48,refugeX=72,refugeY=48){
  const w=sim.world;
  for(let yy=40;yy<=56;yy++)for(let xx=40;xx<=56;xx++){
    const i=w.idx(xx,yy);w.water[i]=0;w.moisture[i]=.12;w.temperature[i]=.12;for(const k of Object.keys(PLANTS))w.plants[k][i]=k==='rotcap'?0:.015;
  }
  for(let yy=44;yy<=52;yy++)for(let xx=68;xx<=76;xx++){
    const i=w.idx(xx,yy);w.water[i]=0;w.moisture[i]=.68;w.temperature[i]=.55;w.fertility[i]=.85;w.plants.sunmoss[i]=.82;w.plants.bramble[i]=.72;w.plants.marshroot[i]=.62;w.plants.thistlepod[i]=.55;w.plants.rotcap[i]=.22;
  }
  // This positive fixture explicitly promises reachable habitat. Its edited
  // water field must include a dry corridor and rebuild connectivity indexes.
  for(let yy=46;yy<=50;yy++)for(let xx=48;xx<=72;xx++)w.water[w.idx(xx,yy)]=0;
  w.buildLandRegions();w.buildHydrology();
  return{x:refugeX,y:refugeY};
}

{
  const sim=new Simulation('GENVO8-MIGRATE-RECOMMEND',{player:true}),p=sim.player();establish(sim,p);forceScarcity(sim);sim.rebuildSpatial();
  const rec=sim.migration.recommend(p);
  assert.equal(rec.shouldMigrate,true,'poor learned home with stronger reachable habitat recommends migration');
  assert.ok(rec.target.quality>rec.homeQuality.score+.10,'recommended refuge is materially better than home');
  assert.ok(rec.distance>=10,'migration recommendation is not trivial local wandering');
}

{
  const sim=new Simulation('GENVO8-MIGRATE-PLAYER',{player:true}),p=sim.player();establish(sim,p);forceScarcity(sim);sim.rebuildSpatial();
  const state=sim.migration.ensure(p);state.recommendation=sim.migration.recommend(p);
  const result=sim.migration.togglePlayer(p);assert.equal(result.ok,true);assert.equal(state.status,'outbound','player can explicitly commit a recommended route');
  assert.ok(sim.migration.targetFor(p)?.migration,'active route produces a migration movement target');
  const cancel=sim.migration.togglePlayer(p);assert.equal(cancel.action,'cancel');assert.equal(state.status,'settled','player can cancel a committed route');
}

{
  const sim=new Simulation('GENVO8-MIGRATE-AUTO',{player:true}),founder=sim.player();establish(sim,founder);forceScarcity(sim);sim.rebuildSpatial();
  const migrant=sim.spawnAnimal('genvo',48.5,48.5);migrant.lineage=true;migrant.age=SPECIES.genvo.maturity+5;migrant.energy=SPECIES.genvo.maxEnergy*.9;migrant.hydration=SPECIES.genvo.maxHydration*.9;establish(sim,migrant,48.5,48.5);sim.rebuildSpatial();
  sim.migration.observe();assert.equal(sim.migration.state(migrant).status,'outbound','autonomous mature founder-line animal can leave degraded habitat');
}

{
  const sim=new Simulation('GENVO8-MIGRATE-ARRIVE',{player:true}),p=sim.player();establish(sim,p);forceScarcity(sim);sim.rebuildSpatial();
  const st=sim.migration.ensure(p),rec=sim.migration.recommend(p);sim.migration.begin(p,rec.target,'test');p.x=rec.target.x;p.y=rec.target.y;sim.day++;sim.migration.observe();
  assert.equal(st.status,'refuge','arrival turns an outbound route into a temporary refuge');
  assert.ok(st.seasonalRefuges[sim.season],'visited refuge is remembered for the current season');
}

{
  const sim=new Simulation('GENVO8-MIGRATE-RETURN',{player:true}),p=sim.player();establish(sim,p);forceScarcity(sim);sim.rebuildSpatial();
  const st=sim.migration.ensure(p),rec=sim.migration.recommend(p);sim.migration.begin(p,rec.target,'test');p.x=rec.target.x;p.y=rec.target.y;sim.day++;sim.migration.observe();assert.equal(st.status,'refuge');
  for(let yy=43;yy<=53;yy++)for(let xx=43;xx<=53;xx++){const i=sim.world.idx(xx,yy);sim.world.moisture[i]=.7;sim.world.temperature[i]=.55;sim.world.plants.bramble[i]=.8;sim.world.plants.sunmoss[i]=.8;sim.world.plants.marshroot[i]=.65;sim.world.plants.thistlepod[i]=.6}
  sim.seasonIndex=(sim.seasonIndex+1)%4;sim.day++;sim.migration.observe();
  assert.equal(st.status,'returning','season change plus recovered home quality starts return migration');
  assert.ok(Math.hypot(st.target.x-48,st.target.y-48)<1,'return route targets learned home');
}

{
  const sim=new Simulation('GENVO8-MIGRATE-SHELTER',{player:true}),p=sim.player();establish(sim,p);forceScarcity(sim);sim.rebuildSpatial();
  const sh={id:1,ownerId:p.id,x:48,y:48,integrity:100,foodStore:28,capacity:28,constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount};sim.shelter.shelters.push(sh);
  const withShelter=sim.migration.habitatQuality(p,48,48,{home:true});sh.integrity=0;sh.foodStore=0;const withoutShelter=sim.migration.habitatQuality(p,48,48,{home:true});
  assert.ok(withShelter.score>withoutShelter.score,'maintained shelter and cache measurably increase home resilience');
}

{
  const sim=new Simulation('GENVO8-MIGRATE-PLAYER-OFF',{player:false});for(let i=0;i<CFG.dayTicks*16;i++)sim.update(null);
  for(const id of sim.migration.states.keys())assert.ok(sim.animals.some(a=>a.id===id&&a.alive&&!a.player&&!a.lineage),'player-off migration belongs only to actual living wildlife');
}

console.log('seasonal migration + habitat pressure checks: PASS');
