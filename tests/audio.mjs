import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {AUDIO_SCENES,GENVO_THEME,activeStrategyBranch,cueForResult,foodCueFor,handoffTheme,localWaterEdge,localWetness,musicPattern,musicSceneFor,semitone,stalkerDangerBand,themeStageForGeneration} from '../src/audio/model.js';
import {AudioDirector} from '../src/audio/audio.js';

assert.equal(cueForResult({ok:true,type:'drink'}),'drink');
assert.equal(cueForResult({ok:true,type:'eat',kind:'bramble'}),'eat-berries');
assert.equal(cueForResult({ok:true,type:'eat',kind:'carrion'}),'eat-carrion');
assert.equal(cueForResult({ok:false,type:'hunt'}),'miss');
assert.equal(cueForResult({ok:true,type:'hunt'}),'fight');
assert.equal(foodCueFor('thistlepod'),'eat-seed');
assert.equal(cueForResult({ok:true,type:'fight',killed:true}),'kill');
assert.equal(cueForResult({ok:false,type:'fight'}),'miss');
assert.equal(cueForResult({ok:true,type:'rally'}),'rally');
assert.equal(cueForResult({ok:true,action:'build'}),'build');

for(const scene of Object.values(AUDIO_SCENES)){
  const p=musicPattern(scene,{generation:5,seasonIndex:2});
  assert.equal(p.steps.length,8,`${scene} uses the eight-step musical grammar`);
  assert.ok(p.root>70&&p.root<180);
}
assert.ok(Math.abs(semitone(110,12)-220)<.001);
assert.equal(GENVO_THEME.length,8,'the lineage theme is an eight-note identity');
assert.deepEqual(GENVO_THEME.slice(0,4),[0,3,7,5]);
assert.equal(themeStageForGeneration(1),0);assert.equal(themeStageForGeneration(3),1);assert.equal(themeStageForGeneration(5),2);assert.equal(themeStageForGeneration(8),3);
const earlyB=musicPattern(AUDIO_SCENES.CALM,{generation:1,branch:'stealth',phraseIndex:2}).steps;
const lateB=musicPattern(AUDIO_SCENES.CALM,{generation:8,branch:'stealth',phraseIndex:2}).steps;
assert.ok(lateB.filter(v=>v!==null).length>earlyB.filter(v=>v!==null).length,'later generations reveal more of the inherited musical phrase');
for(const branch of ['stealth','offense','social','utility'])assert.deepEqual(musicPattern(AUDIO_SCENES.CALM,{generation:8,branch,phraseIndex:2}).steps.slice(0,4),GENVO_THEME.slice(0,4),`${branch} keeps the shared GenVo8 signature before its branch answer`);
assert.notDeepEqual(handoffTheme({branch:'stealth'}),handoffTheme({branch:'offense'}),'handoff cadence inherits the active branch variation');
assert.ok(Math.max(...handoffTheme({established:true,branch:'social'}))>Math.max(...handoffTheme({branch:'social'})),'generation-eight establishment opens the theme above the normal handoff range');
assert.ok(handoffTheme({reason:'death'}).at(-1)<0,'death handoff resolves the shared theme downward');
const stealthPattern=musicPattern(AUDIO_SCENES.CALM,{generation:8,branch:'stealth',phraseIndex:2}).steps;
const offensePattern=musicPattern(AUDIO_SCENES.CALM,{generation:8,branch:'offense',phraseIndex:2}).steps;
assert.notDeepEqual(stealthPattern,offensePattern,'evolutionary strategy colors the musical phrase without changing its eight positions');

const sim=new Simulation('GENVO8-AUDIO-TEST',{player:true});
const initial=musicSceneFor(sim);
assert.equal(initial.scene,AUDIO_SCENES.CALM,'opening protection keeps the score calm');
assert.equal(initial.danger,0);

const p=sim.player();
p.adaptations=['camouflage-mantle'];
assert.equal(activeStrategyBranch(p),'stealth');
assert.ok(localWetness(sim,p)>=0&&localWetness(sim,p)<=1);
assert.ok(localWaterEdge(sim,p)>=0&&localWaterEdge(sim,p)<=1);
const shore=sim.world.drinkSpots[0];const px=p.x,py=p.y;p.x=shore.x;p.y=shore.y;assert.ok(localWaterEdge(sim,p)>.7,'actual shoreline raises the water-edge ambience state');p.x=px;p.y=py;
sim.openingGraceEnded=true;
const hunter=sim.animals.find(a=>a.alive&&a.species==='needlejaw');
assert.ok(hunter,'test has a hunter');
const dryOffset=[[2.5,0],[-2.5,0],[0,2.5],[0,-2.5]].find(([x,y])=>sim.world.sameLand(p.x,p.y,p.x+x,p.y+y));assert.ok(dryOffset,'Threat fixture must be on the same actual landmass');hunter.x=p.x+dryOffset[0];hunter.y=p.y+dryOffset[1];
const danger=musicSceneFor(sim);
assert.equal(danger.scene,AUDIO_SCENES.DANGER);
assert.ok(danger.danger>.5);
assert.ok(stalkerDangerBand(danger)>=2,'close real Stalker reaches hunting escalation band');
hunter.playerHunt={targetId:p.id,phase:'windup',startedTick:sim.tickCount,untilTick:sim.tickCount+8};
const windupScene=musicSceneFor(sim);assert.equal(windupScene.huntPhase,'windup');assert.equal(stalkerDangerBand(windupScene),2,'audio warning band follows the real telegraphed windup');
hunter.playerHunt.phase='charge';const chargeScene=musicSceneFor(sim);assert.equal(chargeScene.huntPhase,'charge');assert.equal(stalkerDangerBand(chargeScene),3,'charge cue follows the committed predator phase');


const beforeRng=sim.rng.state;
const director=new AudioDirector(sim);
director.update(.25,{right:true});
assert.equal(sim.rng.state,beforeRng,'audio presentation never consumes simulation RNG');
assert.equal(director.ctx,null,'node/headless import does not require WebAudio');

console.log('audio checks: PASS');
