// Day/night is presentation-only and follows the world's authoritative clock.
// This test intentionally uses both the 30s clock and recorded legacy 6s clock.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DAY_CLOCK,dayTicksFor} from '../src/sim/day-clock.js';
import {DIURNAL,dayPhaseOf} from '../src/ecology/diurnal-temperature.js';
import {diurnalLightReading,drawDiurnalLight} from '../src/render/diurnal-light.js';

const sim=(fraction,{legacyClock=false,legacyLighting=false,player={}}={})=>{
 const policy={tickCount:0,diurnalRules:legacyLighting?undefined:DIURNAL.policy,
  ...(legacyClock?{}:{dayClockRules:DAY_CLOCK.policy})};
 policy.tickCount=Math.round(dayTicksFor(policy)*fraction);
 policy.player=()=>player;
 return policy;
};
const midnight=diurnalLightReading(sim(0));
const sunrise=diurnalLightReading(sim(.25));
const morning=diurnalLightReading(sim(.375));
const noon=diurnalLightReading(sim(.5));
const dusk=diurnalLightReading(sim(.75));
const evening=diurnalLightReading(sim(.875));
assert.equal(dayPhaseOf(sim(.5)).timeOfDay,.5);
assert.equal(midnight.night,true);
assert.equal(noon.night,false);
assert.equal(noon.alpha,0,'direct noon has no color wash');
assert.ok(midnight.alpha>.18&&midnight.alpha<=.24,'night stays softly illuminated');
assert.ok(morning.alpha<sunrise.alpha,'morning steadily clears the scene');
assert.ok(evening.alpha<dusk.alpha,'sunset dims into night');
assert.equal(sunrise.warmth,1);
assert.equal(dusk.warmth,1);
assert.equal(noon.warmth,0);
assert.equal(midnight.warmth,0);
assert.equal(diurnalLightReading(sim(0,{legacyLighting:true})),null,
 'worlds without the diurnal rule keep their exact old picture');
assert.equal(diurnalLightReading(sim(.5,{legacyClock:true})).alpha,0,
 'legacy day duration is read from the real day-clock authority');
assert.equal(diurnalLightReading(sim(0,{legacyClock:true})).night,true);
assert.ok(Object.isFrozen(midnight),'derived lighting state is immutable');

function capture(world){
 const calls=[],ctx={
  save(){calls.push('save')},restore(){calls.push('restore')},
  fillRect(...values){calls.push(['fillRect',...values])},
  set fillStyle(v){calls.push(['color',v])}
 };
 return {calls,renderer:{ctx,width:321,w:321,h:123,sim:world}};
}
const frame=capture(sim(0));
assert.equal(drawDiurnalLight(frame.renderer),true);
assert.deepEqual(frame.calls.map(x=>Array.isArray(x)?x[0]:x),
 ['save','color','fillRect','restore'],'one full-viewport fill, no gradients or per-tile work');
assert.deepEqual(frame.calls.find(x=>Array.isArray(x)&&x[0]==='fillRect'),['fillRect',0,0,321,123]);
for(const world of [
 sim(.5),sim(0,{legacyLighting:true}),sim(0,{player:{underground:true}}),
 sim(0,{player:{diveDepth:.5}}),sim(0,{player:null})
]){
 const output=capture(world);
 assert.equal(drawDiurnalLight(output.renderer),false,'no lighting where out of scope');
 assert.equal(output.calls.length,0,'no canvas work when hidden/legacy/noon');
}
const renderer=readFileSync(new URL('../src/render/renderer.js',import.meta.url),'utf8');
assert.match(renderer,/import \{drawDiurnalLight\} from '\.\/diurnal-light\.js'/);
const weather=renderer.indexOf('this.drawWeatherOverlay();'),
 light=renderer.indexOf('drawDiurnalLight(this);'),
 fog=renderer.indexOf('drawSensoryFog(this,{tile,cols,rows,startX,startY});'),
 readout=renderer.indexOf('drawWeatherReadout(this)');
assert.ok(weather>=0&&weather<light&&light<fog&&fog<readout,
 'weather and world art are tinted, perception fog and readable HUD remain above it');
console.log('day-night lighting presentation: PASS');
