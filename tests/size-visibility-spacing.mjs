// body-size/2 visibility and spacing (morphology S7 follow-up). A body is seen in
// proportion to its apparent size (current linear scale, 0.5-3x of the sighting
// range) through the one atmospheric sight authority, so predators find giants
// from farther and small bodies stay hidden longer; social spacing keeps a
// size-scaled separation and step. Worlds without body-size/2 are unchanged.
import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {GIANT_SIZE} from '../src/organisms/body-size.js';
import {atmosphericSight,targetVisibility} from '../src/ecology/atmospheric-visibility.js';

const sized=(a,s)=>{a.bodySize={schema:1,alleles:[Math.log(s),Math.log(s)]};return a};
const opts={player:true,dayClock:true,metabolism:true};
const giant=new Simulation('SIZE-SIGHT',{...opts,bodySize:GIANT_SIZE.policy}),old=new Simulation('SIZE-SIGHT',{...opts,bodySize:true});

// 1. Apparent size scales the sighting range; places and old worlds are unchanged.
{
 const [obs,target]=giant.animals.filter(a=>!a.player).slice(0,2);target.age=SPECIES[target.species].maturity+1;
 const place={x:obs.x+6,y:obs.y};assert.equal(targetVisibility(giant,place),1,'places are not bodies');
 Object.assign(target,{x:obs.x+12,y:obs.y});const range=s=>{sized(target,s);return atmosphericSight(giant,obs,target,10).effectiveRange};
 const r1=range(1),r2=range(2),rh=range(.5),r4=range(4);
 assert.ok(Math.abs(r2/r1-2)<1e-12&&Math.abs(rh/r1-.5)<1e-12,'sighting range follows apparent size');assert.ok(Math.abs(r4/r1-3)<1e-12,'capped at 3x');
 // At a distance between the two ranges the larger body is seen and the reference body is not.
 Object.assign(target,{x:obs.x+(r1+r2)/2,y:obs.y});sized(target,1);assert.equal(atmosphericSight(giant,obs,target,10).detected,false);sized(target,2);assert.equal(atmosphericSight(giant,obs,target,10).detected,true,'a 2x body is seen where a reference body is not');
 Object.assign(target,{x:obs.x+(rh+r1)/2,y:obs.y});sized(target,.5);assert.equal(atmosphericSight(giant,obs,target,10).detected,false,'a half-size body hides where a reference body would be seen');
 // A juvenile is seen by its current (grown) size, never below half the range.
 sized(target,1);target.age=0;assert.ok(targetVisibility(giant,target)>=.5&&targetVisibility(giant,target)<1,'young bodies are smaller targets');
 const [o2,t2]=old.animals.filter(a=>!a.player).slice(0,2);sized(t2,2);assert.equal(targetVisibility(old,t2),1,'body-size/1 worlds are unchanged');
}
// 2. Predators find giant prey from farther through the same authority (preyHiddenFrom under visibility rules).
{
 const sim=new Simulation('SIZE-SIGHT-PREY',{...opts,bodySize:GIANT_SIZE.policy}),[pred,prey]=sim.animals.filter(a=>!a.player).slice(0,2);
 prey.age=SPECIES[prey.species].maturity+1;const R=26*(pred.genes?.senses||1),reach=s=>{sized(prey,s);return atmosphericSight(sim,pred,prey,R).effectiveRange};Object.assign(prey,{x:pred.x+20,y:pred.y});
 const r1=reach(1);Object.assign(prey,{x:pred.x+r1*1.5,y:pred.y});sized(prey,1);assert.equal(atmosphericSight(sim,pred,prey,R).detected,false,'reference prey beyond its range');
 sized(prey,3);assert.equal(atmosphericSight(sim,pred,prey,R).detected,true,'a 3x prey is visible far beyond the reference range');
}
// 3. Social spacing: the separation and the step away grow with the pair's size; old worlds are unchanged.
{
 for(const [sim,expectGrow] of [[giant,true],[old,false]]){
  const group=sim.animals.filter(a=>!a.player&&sim.social.profile(a)?.separation&&sim.social.profile(a).mode!=='solitary');
  const species=group[0]?.species;assert.ok(species,'a social species exists');const [a,b]=group.filter(x=>x.species===species).slice(0,2);
  for(const x of [a,b])Object.assign(x,{age:SPECIES[species].maturity+1});
  const sep=sim.social.profile(a).separation,d=sep*1.5;Object.assign(b,{x:a.x+d,y:a.y});
  const target=s=>{sized(a,s);sized(b,s);sim.social.states.set(a.id,{size:2,nearestDistance:d,nearestId:b.id,members:[a.id,b.id]});return sim.social.spacingTarget(a)};
  assert.equal(target(1),null,'reference bodies further apart than their separation stay put');
  const big=target(3);
  if(expectGrow){assert.ok(big,'giants keep a wider berth');const step=Math.hypot(big.x-a.x,big.y-a.y);assert.ok(Math.abs(step-1.8*3)<1e-9,`step grows with size: ${step}`)}
  else assert.equal(big,null,'body-size/1 spacing ignores size');
  sim.social.states.delete(a.id);
 }
}
console.log('Size visibility and spacing PASS: sighting range x apparent size (0.5-3x) for bodies only, giants seen and found from farther, small and young bodies hide better, social separation and step grow with size, body-size/1 unchanged');
