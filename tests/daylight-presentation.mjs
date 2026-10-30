import assert from 'node:assert/strict';
import {daylightPresentation,drawDaylight} from '../src/render/daylight.js';
import {DIURNAL,dayPhaseOf} from '../src/ecology/diurnal-temperature.js';
import {DAY_CLOCK,dayTicksFor} from '../src/sim/day-clock.js';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
import {encodeSnapshotGraph} from '../src/persistence/scenario-codec.js';
const observer={},sim={diurnalRules:DIURNAL.policy,dayClockRules:DAY_CLOCK.policy,tickCount:0,player:()=>observer};
assert.equal(daylightPresentation({...sim,diurnalRules:undefined}),null);
assert.equal(daylightPresentation(sim).label,'Night');
assert.equal(daylightPresentation(sim).shade,.2);
sim.tickCount=dayTicksFor(sim)/2;
assert.equal(daylightPresentation(sim).label,'Day');assert.equal(daylightPresentation(sim).shade,0);
const data=[];let last=null;
for(let tick=0;tick<=240;tick++){
  sim.tickCount=tick;const view=daylightPresentation(sim),phase=dayPhaseOf(sim);
  assert.equal(view.timeOfDay,phase.timeOfDay);assert.equal(view.daylight,phase.daylight);
  assert.ok(view.shade>=0&&view.shade<=.2&&view.warmth>=0&&view.warmth<=.065);
  if(last){assert.ok(Math.abs(view.shade-last.shade)<.006);assert.ok(Math.abs(view.warmth-last.warmth)<.006)}
  data.push(view);last=view;
}
assert.equal(data[62].label,'Dawn');assert.equal(data[178].label,'Dusk');
const stack=[],ops=[],ctx={fillStyle:'old',globalAlpha:.8,save(){stack.push([this.fillStyle,this.globalAlpha])},restore(){[this.fillStyle,this.globalAlpha]=stack.pop()},fillRect(...rect){ops.push({rect,color:this.fillStyle})}};
const renderer={sim,ctx,w:1280,h:800};sim.tickCount=0;assert.equal(drawDaylight(renderer),true);assert.equal(ops.length,1);assert.equal(ctx.fillStyle,'old');assert.equal(ctx.globalAlpha,.8);
for(const player of [{underground:true},{diveDepth:.2}])assert.equal(drawDaylight({...renderer,sim:{...sim,player:()=>player}}),false);
const real=new Simulation('DAYLIGHT-READS',{player:true,dayClock:true,metabolism:true,diurnal:true});
const snap=()=>JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(real,{savedAt:'lighting'}))),before=snap();
daylightPresentation(real);drawDaylight({...renderer,sim:real});assert.equal(snap(),before);
console.log('Daylight presentation PASS: canonical clock, exact legacy neutrality, bounded/smooth day/night/twilight color, habitat exclusions, canvas restoration and full saved-state parity.');
