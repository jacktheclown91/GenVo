import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {faunaVisualPose} from '../src/render/fauna.js';
import {stalkerProfileFor,stalkerProfileIdForTemperament} from '../src/organisms/stalker-profile.js';

assert.equal(stalkerProfileIdForTemperament(.92),'wary');
assert.equal(stalkerProfileIdForTemperament(1),'ambusher');
assert.equal(stalkerProfileIdForTemperament(1.08),'rusher');

const animals=[.92,1,1.08].map((temperament,i)=>({id:30+i,genes:{temperament}}));
const profiles=animals.map(stalkerProfileFor);
assert.deepEqual(profiles.map(p=>p.id),['wary','ambusher','rusher']);
assert.ok(profiles[2].visual.ridge>profiles[0].visual.ridge,'rusher carries the strongest dorsal blade silhouette');
assert.ok(profiles[1].visual.tailLength>profiles[2].visual.tailLength,'flanker carries a longer tail than rusher');
assert.ok(profiles[0].visual.legSpread>profiles[2].visual.legSpread,'wary hunter uses a broader stance');

const base={dir:2,frame:2,moving:false,action:'scan',bodyScale:1,limbScale:1,sensoryScale:1,life:{},behavior:{}};
const poses=animals.map((animal,i)=>faunaVisualPose('needlejaw',{...base,id:animal.id,stalkerProfile:profiles[i]}));
assert.deepEqual(poses.map(p=>p.profileId),['wary','ambusher','rusher']);
assert.ok(poses[2].jawReach>poses[0].jawReach,'rusher profile reads with the longer jaw axis');
assert.ok(poses[1].tailReach>poses[2].tailReach,'flanker profile reads with the longer tail axis');
assert.ok(poses[0].legSpread>=poses[2].legSpread,'wary profile reads with the wider leg stance');

const sim=new Simulation('GENVO8-STALKER-IMPACT',{player:true});
const player=sim.player(),hunter=sim.animals.find(a=>a.alive&&a.species==='needlejaw');
assert.ok(player&&hunter);
hunter.x=player.x+.7;hunter.y=player.y;hunter.health=100;sim.endOpeningGrace('test');
const oldChance=sim.rng.chance;sim.rng.chance=()=>true;
const result=sim.playerStrike(hunter);
assert.equal(result.ok,true,'forced strike lands');
assert.equal(sim.lastPlayerCombatImpact?.targetId,hunter.id,'successful strike records presentation impact on the real target');
assert.ok(['hit','stagger'].includes(sim.lastPlayerCombatImpact?.kind),'impact distinguishes ordinary hit or adaptation stagger');
assert.ok(sim.lastPlayerCombatImpact.damage>0,'impact carries real resolved damage rather than a cosmetic guess');
sim.rng.chance=oldChance;

console.log('Stalker profile silhouette + combat impact readability: PASS');
