// Read-only before-source replay for regression attribution; resolution stays canonical.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=process.cwd();
export async function load(url,context,next){
 if(url.startsWith('file:')){const p=fileURLToPath(url),rel=path.relative(root,p);if(!rel.startsWith('../..')){const old=path.join(root,'reports/overhead-before',rel);if(fs.existsSync(old)&&old.endsWith('.js'))return{format:'module',source:fs.readFileSync(old,'utf8'),shortCircuit:true}}}
 return next(url,context);
}
