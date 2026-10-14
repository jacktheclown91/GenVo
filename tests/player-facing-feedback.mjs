import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {creatureIdentity} from '../src/ui/creature-identity.js';
import {courtshipObservation} from '../src/ui/courtship-observation.js';
import {NotificationQueue} from '../src/ui/notification-center.js';
const s=new Simulation('PLAYER-FACING-FEEDBACK'),a=s.player(),b=s.animals.find(v=>v.id!==a.id&&v.alive),rng=s.rng.state,anatomy=JSON.stringify(a.bodyPlan);
const identity=creatureIdentity(s,a);assert.ok(identity.name&&identity.stage&&identity.traits.length);assert.ok(!identity.label.includes('Observed creature'));assert.deepEqual(creatureIdentity(s,a),identity);assert.equal(s.rng.state,rng);assert.equal(JSON.stringify(a.bodyPlan),anatomy);
a.x=10;a.y=10;b.x=11;b.y=10;b.dir=6;const base={distance:1,targetX:b.x,targetY:b.y,lastMate:a.lastMate,refusal:a.lastCourtshipRefusal,failure:a.lastCourtshipFailure};
// Hidden preference access is forbidden for observable feedback.
Object.defineProperty(b,'matePreferences',{get(){throw Error('Hidden preferences read')}});
assert.equal(courtshipObservation(s,a,b,base).kind,'facing');a.x=10.5;assert.equal(courtshipObservation(s,a,b,base).kind,'facing','actor movement must not be attributed to the partner');a.x=10;b.x=12;assert.equal(courtshipObservation(s,a,b,base).kind,'away');
a.lastCourtshipRefusal={otherId:b.id,reason:'hidden-score'};assert.deepEqual(courtshipObservation(s,a,b,base),{kind:'declined',text:'The pairing was declined.'});a.lastCourtshipRefusal=base.refusal;a.lastMate=b.id;assert.equal(courtshipObservation(s,a,b,base).kind,'accepted');
const queue=new NotificationQueue();queue.post('critical',{text:'Injured'});queue.post('progress',{text:'Discovered'});queue.post('action',{text:'Drank'});queue.post('action',{text:'Drank'});assert.equal(queue.take('critical').text,'Injured');assert.equal(queue.take('progress').text,'Discovered');assert.equal(queue.take('action').text,'Drank');assert.equal(queue.take('action'),undefined);
console.log('Read-only identities, observable courtship without hidden preference reads, independent notification channels PASS');

queue.post('action',{text:'Old outcome'});queue.post('action',{text:'Latest outcome'});assert.equal(queue.take('action').text,'Latest outcome');assert.equal(queue.take('action'),undefined);
