import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
const out=process.argv[2];if(!out)throw Error('output JSON path required');
const root=path.resolve('src');
function fingerprint(){const hash=crypto.createHash('sha256');function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else hash.update(p).update(fs.readFileSync(p))}}walk(root);return hash.digest('hex')}
const sourceFingerprint=fingerprint(),files=fs.readdirSync('tests').filter(n=>n.endsWith('.mjs')).sort(),results=[];
function persist(complete,currentTest=null){fs.writeFileSync(out,JSON.stringify(results,null,2));fs.writeFileSync(out+'.meta.json',JSON.stringify({sourceFingerprint,complete,currentTest,total:files.length,completed:results.length,passed:results.filter(r=>r.exit===0).length,failures:results.filter(r=>r.exit!==0).map(r=>r.name)},null,2))}
persist(false);
for(const name of files){
  if(fingerprint()!==sourceFingerprint)throw Error('source changed during suite; results remain incomplete');
  persist(false,name);console.log('running',name);
  const r=await new Promise(resolve=>{
    const child=spawn(process.execPath,['tests/'+name],{stdio:['ignore','pipe','pipe']});
    let stdout='',stderr='';child.stdout.setEncoding('utf8');child.stderr.setEncoding('utf8');
    child.stdout.on('data',chunk=>{stdout+=chunk;process.stdout.write(chunk)});
    child.stderr.on('data',chunk=>{stderr+=chunk;process.stderr.write(chunk)});
    child.on('error',error=>{stderr+=error.stack||String(error)});
    child.on('close',status=>resolve({status,stdout,stderr}));
  });
  results.push({name,exit:r.status,stdout:r.stdout,stderr:r.stderr});persist(false);console.log(name,r.status);
}
if(fingerprint()!==sourceFingerprint)throw Error('source changed during final test; results remain incomplete');
persist(true);process.exitCode=results.some(r=>r.exit!==0)?1:0;
