// Read-only audit of real shipped canopy support, never altered test scenery.
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {decodeSnapshotGraph} from '../src/persistence/scenario-codec.js';
import {CANOPY} from '../src/ecology/canopy-site.js';
const output=process.argv[2];if(!output||fs.existsSync(output))throw Error('Supply a fresh audit output');
const catalog=JSON.parse(fs.readFileSync('assets/scenarios/catalog.json')),rows=[];
for(const entry of catalog.scenarios.filter(e=>['established-valley-d30','mature-valley-d100'].includes(e.id))){
 const bytes=fs.readFileSync(entry.file),sha256=createHash('sha256').update(bytes).digest('hex');if(sha256!==entry.sha256)throw Error('Checkpoint differs from catalog');
 const bundle=JSON.parse(gunzipSync(bytes)),snapshot=decodeSnapshotGraph(bundle.graph),stand=snapshot.world.plants[CANOPY.tree];
 let maximum=0,supportedBiomassCells=0;for(const value of stand){maximum=Math.max(maximum,value);if(value>=CANOPY.minimumTree)supportedBiomassCells++;}
 rows.push({id:entry.id,path:entry.file,sha256,day:entry.day,maximum,supportedBiomassCells});
}
const receipt={scope:'Read-only decoded original catalog checkpoints; no restore, ecology advance, organisms or world edits. Biomass threshold alone is necessary, not sufficient: load and other controller checks still apply.',tree:CANOPY.tree,minimumTree:CANOPY.minimumTree,rows};
fs.writeFileSync(output,JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));
