// Soil-water moisture maps (roadmap stage W). No animals. Writes one PNG of land moisture panels (dark brown = dry,
// blue = wet, open water black) at the given days, for the old rule (SOILWATER=0) or the new one.
// Usage: node tools/soil-water-maps.mjs <seed> <out.png> <day,day,...>   env SOILWATER=0, DROUGHT=<start>:<length>
import fs from 'node:fs';import zlib from 'node:zlib';
import {SOIL_WATER} from '../src/ecology/soil-water.js';if(process.env.SOILWATER==='0')SOIL_WATER.enabled=false;
// WEATHERPATTERNS=0 restores the previous per-step rain (persistent weather off).
import {WEATHER_PATTERNS} from '../src/ecology/weather.js';if(process.env.WEATHERPATTERNS==='0')WEATHER_PATTERNS.enabled=false;
const {Simulation}=await import('../src/sim/simulation.js');
const [seed='SELECT-A',out='moisture.png',daysArg='1,33,41,49,57']=process.argv.slice(2),days=daysArg.split(',').map(Number);
const sim=new Simulation(seed,{player:false}),w=sim.world;sim.animals=[];sim.rebuildSpatial();
const [dStart,dLen]=(process.env.DROUGHT||'').split(':').map(Number);
if(dLen){const pc=sim.phaseClimate.bind(sim);sim.phaseClimate=()=>{pc();if(sim.day>=dStart&&sim.day<dStart+dLen)sim.climate={...sim.climate,rain:0}}}
const n=w.n,S=2,gap=4,W=days.length*(n*S+gap)-gap,H=n*S,img=Buffer.alloc(W*H*3,255);
const color=m=>{const t=Math.max(0,Math.min(1,m/.6));return[Math.round(110*(1-t)+40*t),Math.round(80*(1-t)+120*t),Math.round(45*(1-t)+220*t)]};
const paint=k=>{for(let y=0;y<n;y++)for(let x=0;x<n;x++){const i=y*n+x,c=w.water[i]?[0,0,0]:color(w.moisture[i]);for(let sy=0;sy<S;sy++)for(let sx=0;sx<S;sx++){const o=((y*S+sy)*W+k*(n*S+gap)+x*S+sx)*3;img[o]=c[0];img[o+1]=c[1];img[o+2]=c[2]}}};
for(let k=0;k<days.length;k++){while(sim.day<days[k]){const d0=sim.day;while(sim.day===d0)sim.update(null)}paint(k)}
const crc=b=>{let c,t=[];for(let n=0;n<256;n++){c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0}c=~0;for(const v of b)c=t[(c^v)&255]^(c>>>8);return(~c)>>>0};
const chunk=(type,data)=>{const l=Buffer.alloc(4);l.writeUInt32BE(data.length);const td=Buffer.concat([Buffer.from(type),data]),c=Buffer.alloc(4);c.writeUInt32BE(crc(td));return Buffer.concat([l,td,c])};
const raw=Buffer.alloc((W*3+1)*H);for(let y=0;y<H;y++){raw[y*(W*3+1)]=0;img.copy(raw,y*(W*3+1)+1,y*W*3,(y+1)*W*3)}
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(W,0);ihdr.writeUInt32BE(H,4);ihdr[8]=8;ihdr[9]=2;
fs.writeFileSync(out,Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]));
console.log(JSON.stringify({seed,soilWater:SOIL_WATER.enabled,weatherPatterns:WEATHER_PATTERNS.enabled,days,out}));
