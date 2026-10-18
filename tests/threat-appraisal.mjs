import assert from 'node:assert/strict';
import {RESOURCE_FOUNDING} from '../src/ecology/resource-founding.js';RESOURCE_FOUNDING.enabled=false;
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {THREAT_APPRAISAL,appearsThreatening,CLOSE_ALARM} from '../src/ecology/threat-appraisal.js';

// Decision-coordination audit sections 2-3: flight follows perceptible threat behaviour, not mere presence.
assert.equal(THREAT_APPRAISAL.enabled,true);
const sim=new Simulation('THREAT-APPRAISAL',{player:false});
const adult=(sp,sex)=>sim.animals.find(a=>a.alive&&a.species===sp&&a.age>=SPECIES[sp].maturity&&(!sex||a.sex===sex));
const nj=adult('needlejaw','M'),nj2=adult('needlejaw','F'),moss=adult('mosskip');assert.ok(nj&&nj2&&moss);
const place=(b,a,dx,dir,intent,target=null)=>{Object.assign(b,{x:a.x+dx,y:a.y,dir,intent,target})};// dir 6 = facing left (toward a when dx>0), 2 = facing right
// Unit rule.
place(nj,moss,4,6,'explore');assert.equal(appearsThreatening(nj,moss,4),false,'an exploring Stalker 4 tiles away is not a threat');
place(nj,moss,4,6,'drink');assert.equal(appearsThreatening(nj,moss,4),false,'nor a drinking one');
place(nj,moss,4,6,'hunt',moss);assert.equal(appearsThreatening(nj,moss,4),true,'a hunting Stalker facing it is');
place(nj,moss,4,2,'hunt',moss);assert.equal(appearsThreatening(nj,moss,4),false,'a hunting Stalker facing away is not (yet)');
place(nj,moss,CLOSE_ALARM-.2,2,'explore');assert.equal(appearsThreatening(nj,moss,CLOSE_ALARM-.2),true,'anything predator-capable this close is');
place(nj,moss,1,6,'escape');assert.equal(appearsThreatening(nj,moss,1),false,'a visibly fleeing animal close by is not a threat');
place(nj,nj2,1,6,'mate',nj2);assert.equal(appearsThreatening(nj,nj2,1),false,'a conspecific courting it is not a threat, however close');
place(nj,nj2,4,6,'hunt',nj2);assert.equal(appearsThreatening(nj,nj2,4),true,'a conspecific actually hunting it is');
THREAT_APPRAISAL.enabled=false;place(nj,moss,4,2,'explore');assert.equal(appearsThreatening(nj,moss,4),true,'?threatAppraisal=0: presence alone');THREAT_APPRAISAL.enabled=true;
// Through the real decision step: an exploring Stalker no longer breaks a mosskip's water trip.
function decide(intent,dir){const s=new Simulation('THREAT-APPRAISAL-DECIDE',{player:false});const m=s.animals.find(a=>a.alive&&a.species==='mosskip'&&a.age>=SPECIES.mosskip.maturity),h=s.animals.find(a=>a.alive&&a.species==='needlejaw'&&a.age>=SPECIES.needlejaw.maturity);
  s.animals=[m,h];Object.assign(m,{energy:SPECIES.mosskip.maxEnergy*.9,hydration:SPECIES.mosskip.maxHydration*.9,health:100,intent:'explore',target:null});
  let spot=null;for(const [dx,dy,d] of [[3,0,6],[-3,0,2],[0,3,0],[0,-3,4]]){if(s.canOccupy(h,m.x+dx,m.y+dy)&&s.world.sameLand(m.x,m.y,m.x+dx,m.y+dy)){spot={x:m.x+dx,y:m.y+dy,toward:d};break}}assert.ok(spot);
  Object.assign(h,{x:spot.x,y:spot.y,dir:dir==='toward'?spot.toward:(spot.toward+4)%8,intent,target:intent==='hunt'?m:null,energy:SPECIES.needlejaw.maxEnergy*.9});m.dir=(spot.toward+4)%8;/* the mosskip faces the Stalker: since Phase 3K (threat-perception.js) a still predator behind it is only heard at close range */s.rebuildSpatial();
  const old=s.carrying.shouldRefreshDecision;s.carrying.shouldRefreshDecision=a=>a===m?true:false;const keep=h.intent;s.phaseDecision({});s.carrying.shouldRefreshDecision=old;h.intent=keep;return m.intent}
assert.notEqual(decide('explore','toward'),'escape','mosskip keeps its own business beside an exploring Stalker');
assert.equal(decide('hunt','toward'),'escape','mosskip flees a Stalker hunting it and facing it');
console.log('threat appraisal: behaviour, close alarm, courting conspecifics, decision integration: PASS');
