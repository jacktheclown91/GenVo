import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG,PLANTS} from '../src/sim/config.js';
import {SPECIES,GENE_KEYS,canPreyOn} from '../src/organisms/species.js';

assert.equal(CFG.version,'1.65.0');
assert.equal(CFG.controlHz,64);
assert.equal(CFG.controlHz%CFG.simHz,0);
assert.equal(CFG.simHz,8);
assert.equal(CFG.phaseNames.length,8);
assert.equal(CFG.seasonDays,8);
assert.equal(GENE_KEYS.length,8);
assert.ok(Object.keys(PLANTS).length+Object.keys(SPECIES).length>8,'content must not be capped at eight organism families');
assert.ok(PLANTS.thistlepod,'ninth organism family exists');
assert.equal(canPreyOn('needlejaw','mosskip'),true);
assert.equal(canPreyOn('mosskip','needlejaw'),false);

const registrySim=new Simulation('GENVO8-REGISTRY',{player:false});
assert.ok(registrySim.world.drinkSpots.length>0,'reachable shoreline drink spots exist');
const shore=registrySim.world.drinkSpots[0];
assert.ok(registrySim.world.isDrinkable(shore.x,shore.y),'shoreline is drinkable');
assert.ok(registrySim.world.plants.thistlepod instanceof Float32Array);
assert.deepEqual(Object.keys(registrySim.population()).sort(),Object.keys(SPECIES).sort());

const directions=[
  {up:true},{up:true,right:true},{right:true},{down:true,right:true},
  {down:true},{down:true,left:true},{left:true},{up:true,left:true}
];
for(const [i,input] of directions.entries()){
  const sim=new Simulation('GENVO8-DIR-'+i,{player:true});
  const p=sim.player();
  let safe=null;
  outer: for(let y=3;y<CFG.worldSize-3;y++)for(let x=3;x<CFG.worldSize-3;x++){
    for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++)if(sim.world.water[sim.world.idx(x+ox,y+oy)])continue outer;
    safe={x,y};break outer;
  }
  assert.ok(safe,'dry test area exists');
  p.x=safe.x+.5;p.y=safe.y+.5;
  const x=p.x,y=p.y;
  sim.update(input);
  assert.ok(Math.hypot(p.x-x,p.y-y)>0,`direction ${i} should move`);
  assert.equal(p.anim,1);
}

const a=new Simulation('GENVO8-DETERMINISM',{player:false});
const b=new Simulation('GENVO8-DETERMINISM',{player:false});
for(let i=0;i<80;i++){a.update(null);b.update(null)}
assert.deepEqual(a.population(),b.population());
assert.equal(a.day,b.day);
for(const kind of Object.keys(PLANTS))assert.equal(a.world.plants[kind][100],b.world.plants[kind][100]);
console.log('core checks: PASS');
