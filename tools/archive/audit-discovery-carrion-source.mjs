// Diagnose the live discovery carrion source without editing runtime or trial state.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {Simulation} from '../../src/sim/simulation.js';
const out=process.argv[2],legacy=process.argv.includes('--legacy');assert.ok(out&&!fs.existsSync(out));
const sim=new Simulation('DISCOVERY-RESOURCE-AUDIT',{player:false,bootstrap:false});if(legacy)sim.carcassRules='calendar-carcass/1';
assert.equal(sim.animals.length,0);const sum=a=>Array.from(a).reduce((x,y)=>x+y,0);
const before={carrion:sum(sim.world.carrion),animals:sim.animals.length,deaths:sim.stats.deaths};
const result=sim.discovery.spawnCarcass({x:64,y:64});assert.equal(result,legacy);
const after={carrion:sum(sim.world.carrion),animals:sim.animals.length,deaths:sim.stats.deaths};
if(legacy)assert.ok(after.carrion>before.carrion);else assert.equal(after.carrion,before.carrion);assert.equal(after.animals,0);assert.equal(after.deaths,0);
const source='src/gameplay/discovery.js';
const report={scope:'Versioned discovery spawnCarcass call in a normally generated world with bootstrap disabled and zero animals. Controlled location; no simulation ticks or original trial state modified. Historical --legacy mode demonstrates the retained unfunded event; current mode refuses to create food; does not establish every possible source/sink or full-world balance.',status:legacy?'historical-unfunded-discovery-carrion-confirmed':'current-finite-discovery-no-food-created',rule:sim.carcassRules,before,after,addedCarrion:after.carrion-before.carrion,site:sim.discovery.sites.find(s=>s.kind==='carcass'),source,sourceSha256:createHash('sha256').update(fs.readFileSync(source)).digest('hex'),relatedScope:'Still-pool energy currently calls harvestFreshwater in Simulation.drink, so its label alone is not evidence of an unfunded reward. Grove/carcass nutrition multipliers and calendar nest-material renewal require separate accounting review.'};
fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
