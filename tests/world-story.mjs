import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {WorldStory,WORLD_STORY} from '../src/gameplay/world-story.js';
import {creatureView,viewCanSee} from '../src/ecology/atmospheric-visibility.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';

// Early ecological drama (creator direction 2026-10-23): story beats are read
// from real local change, never invent events, never reveal unseen creatures
// and never alter the simulation.
const make=()=>{const s=new Simulation('PLANET-OBS-3',{player:true,worldGenerator:'planetary/1',regionalFrontier:true});s.setPlayerAutonomy(true);return s};
const observed=make(),control=make(),story=new WorldStory(),beats=[];
for(let d=0;d<32;d++){for(let t=0;t<CFG.dayTicks;t++){observed.update(null);control.update(null)}
 const b=story.observe(observed);if(b)beats.push({...b,day:observed.day});
 if(d%8===0){const p=observed.player(),s=story.sample(observed,p),view=creatureView(observed,p,8),R=WORLD_STORY.radius;
  const seen={};for(const a of observed.animals)if(a.alive&&!a.player&&!a.lineage&&Math.hypot(a.x-s.center.x,a.y-s.center.y)<=WORLD_STORY.watch&&viewCanSee(view,a.x,a.y))seen[a.species]=(seen[a.species]||0)+1;
  assert.deepEqual(s.seen,seen,'creatures are counted only when the player sees them')}}
const snap=s=>{const x=structuredClone(createSimulationSnapshot(s,{savedAt:'t',reason:'t'}));return x};
assert.deepEqual(snap(observed),snap(control),'observing the story changes no state and consumes no RNG');
assert.ok(beats.length>=3,'a natural world yields story beats in the first days: '+beats.length);
const kinds=new Set(beats.map(b=>b.kind.split(':')[0]));assert.ok(kinds.size>=3,'beats are varied: '+[...kinds]);
for(const b of beats)assert.ok(['fire','season','water','ice','scar','trail','hunters','herd','left','births','carcass'].includes(b.kind.split(':')[0])&&b.text.length>20);
for(let i=1;i<beats.length;i++)assert.ok(beats[i].day-beats[i-1].day>=WORLD_STORY.gapDays(beats[i].day),'beats are spaced');
const byKind={};for(const b of beats){if(byKind[b.kind]!==undefined)assert.ok(b.day-byKind[b.kind]>=WORLD_STORY.kindCooldownDays,'a kind does not repeat too soon');byKind[b.kind]=b.day}
console.log(`World story PASS: ${beats.length} beats in 32 days (${[...kinds].join(', ')}), seen-only creature counts, spacing and cooldowns, no state or RNG change.`);
