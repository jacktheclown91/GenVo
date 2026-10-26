// Single read-only static ES-module dependency map shared by audit and public export.
// Includes literal dynamic imports. Nonliteral runtime imports require explicit review.
import fs from 'node:fs';
import path from 'node:path';

const importPattern=/\b(?:import|export)\s+(?:[^;'"']*?\bfrom\s*)?['"]([^'"]+)['"]|\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
export function sourceGraph(root,{entry='src/main.js'}={}){
 const exists=rel=>fs.existsSync(path.join(root,rel));
 function files(dir){return fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(`${dir}/${e.name}`):e.isFile()&&e.name.endsWith('.js')?[`${dir}/${e.name}`]:[]).sort()}
 const all=files('src'),graph=new Map(),missing=[];
 for(const source of all){
  const deps=[];const code=fs.readFileSync(path.join(root,source),'utf8');
  for(const match of code.matchAll(importPattern)){
   const spec=match[1]??match[2];if(!spec.startsWith('.'))continue;
   const resolved=path.posix.normalize(path.posix.join(path.posix.dirname(source),spec));
   if(!exists(resolved))missing.push(`${source} -> ${spec}`);
   else deps.push(resolved);
  }
  graph.set(source,deps);
 }
 const reachable=new Set(),todo=[entry];
 while(todo.length){const next=todo.pop();if(reachable.has(next))continue;reachable.add(next);todo.push(...(graph.get(next)||[]))}
 return{all,reachable,missing,graph};
}
