import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {runValidationProcess} from '../tools/validation-process.mjs';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'genvo-process-test-')),fixture=path.resolve('tests/helpers/validation-process-child.mjs');
try{
 const logPath=path.join(dir,'normal.log'),normal=await runValidationProcess({args:[fixture,'normal'],cwd:process.cwd(),timeoutMs:5000,logPath});
 assert.equal(normal.code,0);assert.equal(normal.timedOut,false);assert.match(fs.readFileSync(logPath,'utf8'),/normal output/);
 const failed=await runValidationProcess({args:[fixture,'error'],cwd:process.cwd(),timeoutMs:5000});assert.equal(failed.code,7);assert.match(failed.stderr,/fixture failure/);
 let output='';const timed=await runValidationProcess({args:[fixture,'tree'],cwd:process.cwd(),timeoutMs:2000,onStdout:data=>output+=data});
 assert.equal(timed.timedOut,true);assert.equal(timed.cleanupError,null);const pids=[...output.matchAll(/(?:PARENT|MEMBER) (\d+)/g)].map(m=>Number(m[1]));assert.equal(pids.length,2,'both owned processes started');
 for(const pid of pids){let alive=true;for(let n=0;n<20;n++){try{process.kill(pid,0)}catch(error){if(error.code==='ESRCH'){alive=false;break}throw error}await delay(50)}assert.equal(alive,false,'timeout left an owned child alive: '+pid)}
 console.log('Normal/failing output retained and timed-out owned parent/grandchild both terminated PASS');
}finally{assert.equal(path.dirname(path.resolve(dir)),path.resolve(os.tmpdir()),'cleanup remains inside the temporary directory');fs.rmSync(dir,{recursive:true,force:true})}
