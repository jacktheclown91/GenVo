import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {PLANTS} from '../src/sim/config.js';

const main=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../styles.css',import.meta.url),'utf8');
const hud=fs.readFileSync(new URL('../src/ui/inspector.js',import.meta.url),'utf8');

assert.doesNotMatch(main,/e\.code==='Space'\|\|e\.code==='KeyP'/,'Space must not toggle gameplay pause');
assert.match(main,/e\.code==='KeyP'/,'P remains the explicit pause control');
assert.match(main,/WORLD_ACTION_CODES/,'paused world actions are explicitly gated');
assert.match(main,/addEventListener\('blur',clearMovementKeys\)/,'focus loss clears held movement state');
assert.match(html,/id="pauseNotice"/,'manual pause has a visible full-screen notice');
assert.match(css,/\.pause-notice\{/,'pause notice is styled as an explicit state');
assert.match(hud,/Build the first family/,'normal HUD explains the immediate lineage goal');
assert.match(hud,/Survive → pair → raise G2 → hand off/,'normal HUD explains the lineage loop');
assert.match(hud,/H take over a grown descendant/,'HUD explains forward handoff once an heir is ready');

const sim=new Simulation('GENVO8-PLAYTEST-CLARITY',{player:true}),p=sim.player(),spec=SPECIES[p.species],w=sim.world;
const i=w.idx(p.x,p.y),kind='bramble',eff=spec.diets[kind];
assert.ok(eff>0,'controlled GenVo8 can eat test food');
w.plants[kind][i]=Math.max(.8,w.plants[kind][i]||0);
const target={kind,x:p.x,y:p.y,i,eff,nutrition:PLANTS[kind].nutrition*3.6,amount:w.plants[kind][i]};
p.energy=spec.maxEnergy;p.hydration=spec.maxHydration;
const before=w.plants[kind][i],full=sim.foraging.consume(p,target);
assert.equal(full.ok,false,'eating while completely full is rejected instead of consuming food');
assert.equal(w.plants[kind][i],before,'rejected full-state eating does not remove biomass');
assert.match(full.message,/full and hydrated/i);

p.energy=spec.maxEnergy-.2;p.hydration=spec.maxHydration;
const tiny=sim.foraging.consume(p,target);
assert.equal(tiny.ok,true);
assert.doesNotMatch(tiny.message,/\+0 (energy|water)/,'real tiny gains never display as +0');
assert.match(tiny.message,/\+<1 energy|topped up/,'tiny gain has readable nonzero feedback');

console.log('playtest clarity + pause safety checks: PASS');
