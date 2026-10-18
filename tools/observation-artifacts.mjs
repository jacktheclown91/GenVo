import fs from 'node:fs';
import path from 'node:path';
export function observationArtifacts(suite,seed){
 const root=path.resolve(process.env.GENVO_VALIDATION_ARTIFACTS||path.join('docs/test-runs/artifacts',new Date().toISOString().replace(/[:.]/g,'-')+'-'+process.pid));
 const dir=path.join(root,suite);fs.mkdirSync(dir,{recursive:true});
 const stem=seed.replace(/[^A-Za-z0-9_-]/g,'_'),progress=path.join(dir,stem+'.ndjson'),result=path.join(dir,stem+'.json');
 // A fresh runner owns a unique directory; refuse to silently overwrite earlier evidence.
 fs.writeFileSync(progress,'',{flag:'wx'});
 return{progress,result,onSample(row){fs.appendFileSync(progress,JSON.stringify(row)+'\n');console.log('OBSERVATION '+JSON.stringify({seed,day:row.day,seconds:row.seconds,heapUsed:row.memory.heapUsed,rss:row.memory.rss,seedCohorts:row.structures.seedCohorts,artifact:progress}))},finish(value){const pending=result+'.tmp-'+process.pid;fs.writeFileSync(pending,JSON.stringify(value,null,2));fs.renameSync(pending,result);return result}};
}
