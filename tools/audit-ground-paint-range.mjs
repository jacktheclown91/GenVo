import fs from 'node:fs';
import {createHash} from 'node:crypto';
const source=fs.readFileSync(new URL('../src/render/renderer.js',import.meta.url),'utf8'),hash=Function('return ('+source.match(/^function hash2\([^\n]+/m)[0]+')')();
const candidate=(x,y,salt=0)=>{let n=(Math.imul(x,374761393)+Math.imul(y,668265263)+Math.imul(salt,1442695041))>>>0;n=Math.imul(n^(n>>>13),1274126177)>>>0;return((n^(n>>>16))>>>0)/4294967295};
function sample(fn){const xs=new Set(),ys=new Set();let min=1,max=0,light=0,count=0;for(let y=0;y<32;y++)for(let x=0;x<32;x++)for(let k=0;k<14;k++){const value=fn(x*31+k,y*17-k,1451);min=Math.min(min,value);max=Math.max(max,value);if(value>.55)light++;xs.add(Math.floor(fn(x+k*3,y,1453)*32));ys.add(Math.floor(fn(y+k*5,x,1459)*32));count++}return{count,min,max,lightGrain:light,xPositions:[...xs].sort((a,b)=>a-b),yPositions:[...ys].sort((a,b)=>a-b)}}
const report={scope:'Read-only ground-paint model audit. Proposed unsigned mixing is not installed runtime or native visual acceptance.',sourceSha256:createHash('sha256').update(source).digest('hex'),baseline:sample(hash),proposed:sample(candidate)};
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2));console.log(JSON.stringify(report));
