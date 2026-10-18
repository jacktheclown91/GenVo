// Owns one suite process tree. Timeouts must not leave seed workers running.
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
async function terminateTree(child){
 if(process.platform==='win32')return new Promise(resolve=>{
  const killer=spawn(path.join(process.env.SystemRoot||'C:\\Windows','System32','taskkill.exe'),['/PID',String(child.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'});
  killer.once('error',error=>{child.kill();resolve(error.message)});killer.once('close',code=>{if(code!==0){child.kill();resolve('taskkill exited '+code)}else resolve(null)});
 });
 try{process.kill(-child.pid,'SIGKILL');return null}catch(error){if(error.code==='ESRCH')return null;child.kill();return error.message}
}
export function runValidationProcess({args,cwd,timeoutMs,logPath,env=process.env,onStdout=()=>{}}){
 return new Promise(resolve=>{
  const start=performance.now(),child=spawn(process.execPath,args,{cwd,env,stdio:['ignore','pipe','pipe'],windowsHide:true,detached:process.platform!=='win32'});
  let head='',tail='',timedOut=false,spawnError=null,cleanup=Promise.resolve(null);
  const log=data=>{if(logPath)fs.appendFileSync(logPath,data)};
  child.stdout.on('data',data=>{log(data);onStdout(String(data))});
  child.stderr.on('data',data=>{log(data);const text=String(data),remaining=8000-head.length;if(remaining>0){head+=text.slice(0,remaining);tail+=text.slice(remaining)}else tail+=text;if(tail.length>4000)tail=tail.slice(-4000)});
  child.once('error',error=>{spawnError=error.message;log(error.message)});
  const timer=setTimeout(()=>{timedOut=true;cleanup=terminateTree(child)},timeoutMs);
  child.once('close',async(code,signal)=>{clearTimeout(timer);const cleanupError=await cleanup;resolve({code,signal,timedOut,spawnError,cleanupError,stderr:head+tail,seconds:+((performance.now()-start)/1000).toFixed(1)})});
 });
}
