// Bounded day-one weather-only observation, no ecology history or forcing.
import {Simulation} from '../src/sim/simulation.js';
import {createThermalWeather} from '../src/ecology/thermal-weather.js';
import {lightningProposal} from '../src/ecology/thunderstorms.js';
for(let k=0,found=0;k<1000&&found<4;k++){const seed='STORM-ART-'+k;if(createThermalWeather(seed).anomaly<.1)continue;const s=new Simulation(seed,{player:false,bootstrap:false,worldGenerator:'planetary/1',regionalFrontier:true});s.phaseClimate();for(let tick=16;tick<=128;tick+=16){const e=lightningProposal(s,tick);if(!e||e.intensity<.15||s.world.water[e.i])continue;const full=new Simulation(seed,{player:true,worldGenerator:'planetary/1',regionalFrontier:true});const crowded=full.animals.filter(a=>a.alive&&Math.hypot(a.x-(e.i%full.world.n+.5),a.y-((e.i/full.world.n|0)+.5))<3).length;console.log(JSON.stringify({seed,crowded,climate:s.climate,event:e,x:e.i%s.world.n+.5,y:(e.i/s.world.n|0)+.5}));found++;break}}
