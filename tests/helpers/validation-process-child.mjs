import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const mode=process.argv[2];
if(mode==='normal'){console.log('normal output');process.exit(0)}
if(mode==='error'){console.error('Error: fixture failure');process.exit(7)}
if(mode==='tree'){
 console.log('PARENT '+process.pid);
 const child=spawn(process.execPath,[fileURLToPath(import.meta.url),'member'],{stdio:['ignore','pipe','inherit'],windowsHide:true});child.stdout.pipe(process.stdout);
}else if(mode==='member')console.log('MEMBER '+process.pid);
setInterval(()=>{},1000);
