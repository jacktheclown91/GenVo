import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG,PLANTS} from '../src/sim/config.js';

// v1.33.3 grazing scars: ground grazed hard enough regrows more slowly until the wear fades.
const S=CFG.grazingScar,sim=new Simulation('GENVO8-GRAZING-SCARS',{player:true}),w=sim.world,h=sim.history;sim.climate={temp:.58,rain:.4};

// Ordinary grazing leaves no scar; heavy, repeated grazing does, up to a limit.
{
  const i=w.idx(40,40);h.grazing[i]=.3;assert.equal(h.scarAt(i),0,'ordinary grazing does not scar');
  h.grazing[i]=S.start+S.span*.5;assert.ok(Math.abs(h.scarAt(i)-S.maxSlow*.5)<1e-6);
  h.grazing[i]=2.2;assert.equal(h.scarAt(i),S.maxSlow,'the scar has a limit');h.grazing[i]=0;
}

// Repeated feeding at one patch builds a scar.
const kind=Object.keys(PLANTS).find(k=>k!=='rotcap'&&!PLANTS[k].dispersal?.seedLimited);
let tile=null;for(let i=0;i<w.len&&!tile;i++)if(!w.water[i]&&w.fertility[i]>.4&&w.moisture[i]>.3&&w.moisture[i]<.8)tile={i,x:i%w.n,y:Math.floor(i/w.n)};
assert.ok(tile&&kind);
for(let k=0;k<6;k++)h.notePlantConsumption(kind,tile.x,tile.y,.12);
assert.ok(h.scarAt(tile.i)>0,'a feeding ground worked over and over is scarred');

// Scarred ground regrows more slowly than the same ground unscarred.
function regrowth(grazing){
  const before=.1;w.plants[kind][tile.i]=before;h.grazing[tile.i]=grazing;h.activate(tile.i);
  const scar=h.scarAt(tile.i);sim.phaseVegetation();return{gain:w.plants[kind][tile.i]-before,scar};
}
{
  const clean=regrowth(0),scarred=regrowth(1.4);
  assert.ok(clean.gain>0,'plants regrow on clean ground');
  assert.ok(scarred.gain<clean.gain,'scarred ground regrows more slowly');
  assert.ok(Math.abs(scarred.gain-clean.gain*(1-scarred.scar))<1e-6,'by exactly the scar share');
}

// Scars heal as grazing wear fades, and plants are never removed by a scar.
{
  h.grazing[tile.i]=1.4;h.activate(tile.i);let days=0;while(h.scarAt(tile.i)>0&&days<60){h.advanceDay();days++}
  assert.ok(days>5&&days<40,`a scar heals in ${days} days without further grazing`);
  w.plants[kind][tile.i]=PLANTS[kind].carry*.9;h.grazing[tile.i]=2.2;const v=w.plants[kind][tile.i];sim.phaseVegetation();
  assert.ok(w.plants[kind][tile.i]>=v*.99-.005,'a scar slows regrowth but does not strip existing plants');
}
console.log('grazing scars ok');
