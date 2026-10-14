import assert from 'node:assert/strict';

// Read-only mechanical checks. This is not a causal ecology acceptance verdict.
export function checkEcologicalIntegrity(sim,initialPopulation){
  const living=sim.animals.filter(a=>a.alive),ids=new Set();
  assert.equal(living.length,initialPopulation+sim.stats.births-sim.stats.deaths,'population must reconcile with actual births and deaths');
  for(const a of living){
    assert.ok(!ids.has(a.id),'duplicate living actor identity');ids.add(a.id);
    for(const key of ['x','y','age','energy','hydration','health'])assert.ok(Number.isFinite(a[key]),`nonfinite actor ${a.id} ${key}`);
  }
  const resources={};
  for(const [kind,field] of Object.entries({...sim.world.plants,...sim.world.freshwaterFood,carrion:sim.world.carrion})){
    let total=0;
    for(const value of field){assert.ok(Number.isFinite(value)&&value>=0,`invalid finite resource stock: ${kind}`);total+=value}
    resources[kind]=total;
  }
  assert.equal(Object.values(sim.population()).reduce((n,v)=>n+v,0),living.length,'population census must include every living actor');
  return{day:sim.day,population:sim.population(),births:sim.stats.births,deaths:sim.stats.deaths,resources};
}
