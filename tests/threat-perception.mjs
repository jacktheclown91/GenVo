import assert from 'node:assert/strict';
import {RESOURCE_FOUNDING} from '../src/ecology/resource-founding.js';RESOURCE_FOUNDING.enabled=false;
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {CLOSE_ALARM} from '../src/ecology/threat-appraisal.js';
import {THREAT_STAGES,detects,threatLevel,thresholds,STAGE,QUIET,HEARING} from '../src/ecology/threat-perception.js';

// Phase 3K Priority 3: detection, vigilance, alarm and flight are distinct stages, from senses and inherited
// boldness. Rules are tested, not population outcomes.
assert.equal(THREAT_STAGES.enabled,true);
const sim=new Simulation('THREAT-PERCEPTION',{player:false});
const adult=sp=>sim.animals.find(a=>a.alive&&a.species===sp&&a.age>=SPECIES[sp].maturity);
const nj=adult('needlejaw'),moss=adult('mosskip');assert.ok(nj&&moss);
const R=5;// a flight radius for the unit checks
const put=(b,a,dx,dir,intent,target=null)=>Object.assign(b,{x:a.x+dx,y:a.y,dir,intent,target});
// Detection: seen in the field of view; behind, heard only when moving, and a still predator only close by.
moss.dir=2;/* facing right */put(nj,moss,4,6,'explore');nj.movedTick=-1e9;
assert.equal(detects(sim,moss,nj,4,R),true,'a predator in view is detected across the radius');
moss.dir=6;/* facing away */assert.equal(detects(sim,moss,nj,4,R),false,'a still predator behind it, 4 tiles away, is not');
assert.equal(detects(sim,moss,nj,R*QUIET-.1,R),true,'but one right behind it is');
nj.movedTick=sim.tickCount;assert.equal(detects(sim,moss,nj,R*HEARING-.1,R),true,'a moving predator behind it is heard');
assert.equal(detects(sim,moss,nj,R*HEARING+.1,R),false,'within hearing range only');
moss.vigilance={id:nj.id,untilTick:sim.tickCount+10};assert.equal(detects(sim,moss,nj,4.5,R),true,'a predator it is watching is tracked across the radius');moss.vigilance=null;
// Assessment: what the predator is doing and how close it is.
const lvl=(dx,dir,intent,target=null)=>{put(nj,moss,dx,dir,intent,target);return threatLevel(moss,nj,Math.abs(dx),R)};
const T={vigilance:STAGE.vigilance,alarm:STAGE.alarm,flight:STAGE.flight};
assert.ok(lvl(4.5,6,'hunt',moss)>=T.alarm&&lvl(2,6,'hunt',moss)>=T.flight,'a Stalker hunting it is alarming at range and fled from when near');
assert.ok(lvl(4.5,6,'hunt',moss)<T.flight,'but at the edge of its senses it first raises alarm, not flight');
assert.ok(lvl(3,6,'hunt',{id:-1})>=T.vigilance&&lvl(3,2,'hunt',{id:-1})<T.flight,'a Stalker hunting something else draws vigilance or alarm, not flight');
assert.ok(lvl(4,6,'explore')<T.alarm&&lvl(4,6,'explore')>=T.vigilance,'an exploring Stalker in range draws vigilance only');
assert.ok(lvl(CLOSE_ALARM-.2,2,'explore')>=T.flight,'anything able to bite at contact range is fled from');
const fleeingAway=lvl(1,2,'escape'),fleeingAtMe=lvl(1,6,'escape');
assert.ok(fleeingAway>=T.alarm&&fleeingAway<T.flight,'a fleeing predator at contact range is not harmless: it raises alarm');
assert.ok(fleeingAtMe>=T.flight,'and one fleeing straight into it is fled from');
assert.ok(lvl(4,2,'escape')<T.vigilance,'a fleeing predator far off is ignored');
put(nj,moss,1,6,'mate',moss);nj.species='mosskip';assert.equal(threatLevel(moss,nj,1,R),0,'a courting conspecific is no threat');nj.species='needlejaw';
{const [x,y]=sim.animals.filter(a=>a.alive&&a.species==='needlejaw');put(y,x,.6,6,'mate',{id:-5});assert.ok(threatLevel(x,y,.6,R)<STAGE.alarm,'a rival suitor courting another, at contact range, is not fled from');}
// Response thresholds: bolder animals and needy ones accept more risk; nothing is unconditional.
const calm={...moss,genes:{...moss.genes,temperament:1},energy:SPECIES.mosskip.maxEnergy*.9,hydration:SPECIES.mosskip.maxHydration*.9};
const bold={...calm,genes:{...calm.genes,temperament:1.25}},thirsty={...calm,hydration:SPECIES.mosskip.maxHydration*.2};
assert.ok(thresholds(bold).flight>thresholds(calm).flight&&thresholds(thirsty).flight>thresholds(calm).flight,'boldness and need raise the flight threshold');
assert.ok(thresholds(thirsty).flight<1,'a hunting predator at contact range is always fled from, however thirsty');
// Through the real decision step: an alarming predator stops approach without ending the activity.
function decide({intent,dir,dx,target}){const s=new Simulation('THREAT-PERCEPTION-DECIDE',{player:false});const m=s.animals.find(a=>a.alive&&a.species==='mosskip'&&a.age>=SPECIES.mosskip.maturity),h=s.animals.find(a=>a.alive&&a.species==='needlejaw'&&a.age>=SPECIES.needlejaw.maturity);
  s.animals=[m,h];Object.assign(m,{energy:SPECIES.mosskip.maxEnergy*.9,hydration:SPECIES.mosskip.maxHydration*.9,health:100,intent:'explore',target:null,dir:2});m.genes={...m.genes,senses:1,temperament:1};/* flight radius 5 */
  for(let k=1;k<=dx+3;k++)assert.ok(s.canOccupy(h,m.x+k,m.y)&&s.world.sameLand(m.x,m.y,m.x+k,m.y),'open ground to the east');
  Object.assign(h,{x:m.x+dx,y:m.y,dir,intent,target:target==='me'?m:null,energy:SPECIES.needlejaw.maxEnergy*.9,movedTick:s.tickCount});s.rebuildSpatial();
  const old=s.carrying.shouldRefreshDecision;s.carrying.shouldRefreshDecision=a=>a===m;const keep=h.intent;
  s.phaseDecision({});s.carrying.shouldRefreshDecision=old;h.intent=keep;return{m,s}}
{const {m,s}=decide({intent:'hunt',dir:6,dx:2,target:'me'});assert.equal(m.intent,'escape','a Stalker hunting it from 2 tiles: flight');assert.ok(s.stats.threatStages.flight>=1)}
{const {m,s}=decide({intent:'hunt',dir:6,dx:4.4,target:'me'});assert.notEqual(m.intent,'escape','from 4.4 tiles: alarm, not flight');assert.equal(s.stats.threatStages.alarm,1);
  assert.ok(m.vigilance?.untilTick>s.tickCount,'and it keeps watching that Stalker');if(m.target)assert.ok(m.target.x<=m.x+.3||m.intent==='wary','an alarmed animal does not walk toward the predator')}
{const {m,s}=decide({intent:'explore',dir:6,dx:4,target:null});assert.notEqual(m.intent,'escape');assert.notEqual(m.intent,'wary');assert.equal(s.stats.threatStages.vigilance,1,'an exploring Stalker: vigilance only')}
// Switch off: the yes/no appraisal returns (a hunting, facing Stalker anywhere in range means flight).
THREAT_STAGES.enabled=false;{const {m}=decide({intent:'hunt',dir:6,dx:4.4,target:'me'});assert.equal(m.intent,'escape','?threatStages=0: hunting and facing means flight')}THREAT_STAGES.enabled=true;
console.log('threat perception: senses, vigilance, alarm, flight, fleeing-but-close, boldness and need: PASS');
