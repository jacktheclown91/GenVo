// Social behavior must not disappear merely because an ecosystem has no player.
// The same real SocialController is used by the active world and detached regions.
import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';

function arrange(sim){
  for(const a of sim.animals){a.x=110;a.y=110}
  const herd=sim.animals.filter(a=>a.alive&&a.species==='mosskip').slice(0,3);
  const hunter=sim.animals.find(a=>a.alive&&a.species==='needlejaw');
  assert.equal(herd.length,3,'an ordinary founded world has three herd animals');
  assert.ok(hunter,'an ordinary founded world has a predator');
  [[50,50],[54,50],[55,51]].forEach(([x,y],i)=>{herd[i].x=x;herd[i].y=y});
  hunter.x=49;hunter.y=50;
  sim.rebuildSpatial();
  return{herd,hunter};
}
{
  const sim=new Simulation('SOCIAL-TEST',{player:false});
  const {herd,hunter}=arrange(sim);
  const rng=sim.rng.state;
  sim.social.observe(); // no special force flag
  const group=sim.social.snapshot(herd[1]);
  assert.ok(group&&group.size>=3,'real playerless wildlife form the same spatial herd');
  assert.equal(group.alarmSpecies,'needlejaw','remote herd senses the real nearby hunter');
  const response=sim.social.alarmResponse(herd[1]);
  assert.ok(response?.shared,'remote herd can act on a shared alarm');
  assert.equal(sim.rng.state,rng,'observation adds no random draws');
  hunter.x=110;hunter.y=110;sim.rebuildSpatial();sim.social.observe({force:true});
  assert.equal(sim.social.snapshot(herd[1])?.alarmSpecies,null,'alarm clears when danger moves away');
}
{
  const sim=new Simulation('SOCIAL-TEST',{player:true});
  const {herd}=arrange(sim);
  sim.player().x=105;sim.player().y=105;
  sim.rebuildSpatial();sim.social.observe();
  assert.ok(sim.social.snapshot(herd[1])?.size>=3,'far-away wildlife maintain actual groups without camera proximity');
}
console.log('worldwide wildlife and playerless social interactions PASS');
