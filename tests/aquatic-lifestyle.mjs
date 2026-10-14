import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {movementProfile,canSwim} from '../src/lineage/lifestyle.js';
import {ADAPTATIONS} from '../src/lineage/evolution.js';
import {CFG} from '../src/sim/config.js';
// v1.31 retired the handoff draft by default. These checks cover the legacy draft path that
// still resolves choices pending in older saves, so they enable it explicitly.
CFG.evolution.handoffDraft=true;

function bankStep(world){
  const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
  for(let y=3;y<world.n-3;y++)for(let x=3;x<world.n-3;x++){
    if(world.water[world.idx(x,y)])continue;
    for(const [dx,dy] of dirs){if(world.water[world.idx(x+dx,y+dy)])return{x:x+.5,y:y+.5,dx,dy,waterX:x+dx+.5,waterY:y+dy+.5}}
  }
  throw new Error('No dry bank beside water');
}

const sim=new Simulation('GENVO8-AQUATIC-LIFESTYLE',{player:true}),p=sim.player(),bank=bankStep(sim.world);
p.x=bank.x;p.y=bank.y;p.energy=110;p.hydration=100;p.adaptations=[];
for(let i=0;i<28;i++){if(i%4===0)sim.tickCount++;sim.playerControlStep({right:bank.dx>0,left:bank.dx<0,down:bank.dy>0,up:bank.dy<0},32)}
assert.equal(sim.world.water[sim.world.idx(p.x,p.y)],0,'ordinary GenVo8 still stops at open water');
assert.ok((sim.pressure.states.get(p.id)?.exposure?.wetness||0)>0,'trying to cross water records lived wetness pressure (v1.32 shared vocabulary)');

p.x=bank.x;p.y=bank.y;p.energy=110;p.adaptations=['water-sacs','webbed-limbs'];
assert.equal(canSwim(p),true);
const wet=movementProfile(p,sim.world,{fromX:bank.x,fromY:bank.y,toX:bank.waterX,toY:bank.waterY,sprint:false});
assert.equal(wet.allowed,true);assert.equal(wet.swimming,true);assert.ok(wet.speed<1&&wet.energy>1,'swimming trades speed and energy for access');
for(let i=0;i<28&&!sim.world.water[sim.world.idx(p.x,p.y)];i++){sim.tickCount++;sim.playerControlStep({right:bank.dx>0,left:bank.dx<0,down:bank.dy>0,up:bank.dy<0},32)}
assert.equal(sim.world.water[sim.world.idx(p.x,p.y)],1,'Webbed Limbs allows the active creature to enter open water');

const territory=sim.territory.ensure(p),before=territory.cells.size;sim.territory.visit(p,territory);assert.equal(territory.cells.size,before,'open-water transit does not count as settled home-range familiarity');

const adult=sim.spawnAnimal('genvo',bank.x,bank.y,[p,p]);adult.player=false;adult.lineage=true;adult.age=40;adult.energy=110;adult.hydration=100;adult.adaptations=['water-sacs','webbed-limbs'];adult.intent='family-follow';adult.target={x:bank.waterX,y:bank.waterY};
for(let i=0;i<40&&!sim.world.water[sim.world.idx(adult.x,adult.y)];i++){sim.tickCount++;adult.intent='family-follow';adult.target={x:bank.waterX,y:bank.waterY};sim.phaseMovement()}
assert.equal(sim.world.water[sim.world.idx(adult.x,adult.y)],1,'autonomous evolved relatives can traverse water too');

const from=sim.player();from.adaptations=['water-sacs'];const state=sim.pressure.ensure(from);state.exposure.wetness=8;state.peak.wetness=1;
const heir=sim.spawnAnimal('genvo',bank.x,bank.y,[from,adult]);heir.adaptations=['water-sacs'];heir.generation=(from.generation||1)+1;
const offer=sim.evolution.onHandoff(from,heir,{reason:'manual'});assert.ok(offer.offers.some(o=>o.id==='webbed-limbs'),'sustained water pressure can offer swimming after Water Sacs');
assert.equal(ADAPTATIONS['webbed-limbs'].tier,2);
console.log('aquatic lifestyle checks: PASS');
