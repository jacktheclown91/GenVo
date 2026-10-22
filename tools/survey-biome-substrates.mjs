import fs from 'node:fs';
import {PlanetGeography} from '../src/world/planet-geography.js';
import {World} from '../src/world/world.js';
fs.mkdirSync('reports/biome-substrate-review',{recursive:true});
const seed='NATIVE-SUBSTRATE-20261022',p=new PlanetGeography(seed),d=p.descriptor,C=d.equatorialCircumferenceTiles,lists={dry:[],cold:[],rock:[]};let maxMacro=-Infinity;
for(let y=15;y<241;y++)for(let x=0;x<512;x++){
 const m=p.macroCell(x,y);if(m.ocean||Math.abs(m.latitude)>78*Math.PI/180)continue;maxMacro=Math.max(maxMacro,m.elevation);
 const scores={dry:-m.rain,cold:Math.abs(m.latitude)+m.elevation*.6,rock:m.elevation};
 for(const kind of Object.keys(lists)){const list=lists[kind];if(list.length<20||scores[kind]>list.at(-1).score){list.push({m,score:scores[kind]});list.sort((a,b)=>b.score-a.score);list.length=Math.min(20,list.length)}}
}
const best={},examined=[];
for(const kind of Object.keys(lists))for(const {m} of lists[kind]){
 const delta=((m.longitude-d.anchor.longitude+3*Math.PI)%(2*Math.PI))-Math.PI,x=delta*C*Math.cos(d.anchor.latitude)/(2*Math.PI),y=(d.anchor.latitude-m.latitude)*C/(2*Math.PI);
 let point;try{point=p.sample(x,y)}catch{continue}if(point.water)continue;
 const score=kind==='dry'?.34-point.moisture:kind==='cold'?.28-point.temperature:point.elevation;
 if(best[kind]&&best[kind].score>=score)continue;
 const origin={x:Math.floor((x-64)/128)*128,y:Math.floor((y-64)/128)*128};
 const w=new World(seed,{generator:'planetary/1',planetOrigin:origin});const cx=Math.round(x-origin.x),cy=Math.round(y-origin.y);let site=null;
 for(let yy=Math.max(6,cy-12);yy<Math.min(w.n-6,cy+12);yy++)for(let xx=Math.max(6,cx-12);xx<Math.min(w.n-6,cx+12);xx++){const i=w.idx(xx,yy);if(w.water[i])continue;const t=w.temperature[i],moisture=w.moisture[i],elevation=w.terrain.elevation[i],q=kind==='dry'?.34-moisture:kind==='cold'?.28-t:elevation;if(!site||q>site.score)site={kind,seed,origin,x:xx+.5,y:yy+.5,score:q,temperature:t,moisture,elevation}}
 examined.push({kind,origin,point:{temperature:point.temperature,moisture:point.moisture,elevation:point.elevation}});if(site&&(!best[kind]||site.score>best[kind].score))best[kind]=site;
}
fs.writeFileSync('reports/biome-substrate-review/generated-sites.json',JSON.stringify({seed,descriptor:d,maxMacro,best,examined},null,2));console.log(JSON.stringify({best,maxMacro,regionsExamined:examined.length}));
