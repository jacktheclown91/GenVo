// In-memory candidate only. Canonical source stays fixed during the live suite.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const file=path.resolve('src/ecology/migration.js'),original=fs.readFileSync(file,'utf8');
const needle="if(!target||!this.sim.canOccupy(animal,target.x,target.y)||!this.sim.canReach(animal,target.x,target.y)){state.status='settled';state.target=null;state.reason='route inaccessible';return}";
if(original.split(needle).length!==2)throw Error('candidate requires exact source expression');
const replacement="if(!target||!this.sim.canOccupy(animal,target.x,target.y)||!this.sim.canReach(animal,target.x,target.y)||Math.hypot(animal.x-target.x,animal.y-target.y)>9*animal.genes.senses*forageRangeEffect(this.sim,animal)||!this.sim.carrying.breedingState(animal,{at:target}).allowed){state.status='settled';state.target=null;state.reason='destination requires reassessment';return}";
let candidate=original.replace(needle,replacement).replace(/from '([^']+)'/g,(_,p)=>`from '${new URL(p,pathToFileURL(file)).href}'`);
const url='data:text/javascript;base64,'+Buffer.from(candidate).toString('base64');
const {MigrationController}=await import(url);
const simURL=pathToFileURL(path.resolve('src/sim/simulation.js')).href;
const test=fs.readFileSync('tests/migration-stale-destination.mjs','utf8').replace("import {Simulation} from '../../src/sim/simulation.js';",`import {Simulation as BaseSimulation} from '${simURL}';\nimport {MigrationController} from '${url}';\nclass Simulation extends BaseSimulation{constructor(...args){super(...args);this.migration=new MigrationController(this)}}`);
await import('data:text/javascript;base64,'+Buffer.from(test).toString('base64'));
if(fs.readFileSync(file,'utf8')!==original)throw Error('production source changed');
const receipt={candidateOnly:true,productionChanged:false,sourceFileSha256:crypto.createHash('sha256').update(original).digest('hex'),test:'migration-stale-destination.mjs',passed:true};
fs.writeFileSync('reports/pass-w-revalidation-candidate.json',JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));
