// LOD interaction consistency check (Phase 3H Milestone E, diagnostic). Measures energy and water gained
// per animal-day by distance band from the player. Variants: lod (current), old (?lodInteraction=0), nolod
// (all strides forced to 1). Usage: node tools/lod-interaction-check.mjs <seed> [days] [1=player|0] [variant]
import {Simulation} from '../../src/sim/simulation.js';import {SPECIES} from '../../src/organisms/species.js';
const seed=process.argv[2]||'LOD-A',days=Number(process.argv[3]||60),usePlayer=process.argv[4]!=='0';
const sim=new Simulation(seed,{player:usePlayer});if(process.argv[5]==="old"){const m=await import("../../src/ecology/activity.js");m.ACTIVITY_REVIEW.continuousInteraction=false}if(process.argv[5]==="nolod"){sim.activity.movementStride=()=>1;sim.carrying.decisionStride=()=>1}sim.endOpeningGrace?.('x');if(usePlayer)sim.setPlayerAutonomy(true);
const band=a=>{const p=sim.player?.();if(!p||!usePlayer)return 'all';const d=Math.hypot(a.x-p.x,a.y-p.y);return d>=52?'far':d>=30?'bg':'near'};
const B={};const get=k=>B[k]??={animalTicks:0,feedTicks:0,feedCalls:0,gain:0,drinkCalls:0,water:0};
const ri=sim.resolveInteraction.bind(sim);sim.resolveInteraction=a=>{const b=get(band(a)),e=a.energy,h=a.hydration;const r=ri(a);if(a.energy>e){b.feedCalls++;b.gain+=a.energy-e}if(a.hydration>h){b.drinkCalls++;b.water+=a.hydration-h}return r};
const up=sim.update.bind(sim);let ticks=0;
for(let d=0;d<days;d++){const d0=sim.day;while(sim.day===d0){up(null);ticks++;if(ticks%4===0)for(const a of sim.animals)if(a.alive&&!a.player&&!a.lineage){const b=get(band(a));b.animalTicks+=4;if(/feed|graze|forage/.test(a.intent||''))b.feedTicks+=4}}}
const tpd=ticks/days;for(const [k,b] of Object.entries(B)){const ad=b.animalTicks/tpd;console.log(seed,usePlayer?'player':'headless',k.padEnd(5),'animalDays',Math.round(ad),'gain/animal-day',(b.gain/ad).toFixed(2),'meals/animal-day',(b.feedCalls/ad).toFixed(2),'water/animal-day',(b.water/ad).toFixed(2),'feedShare',(b.feedTicks/b.animalTicks).toFixed(3))}
const sp={};for(const a of sim.animals)if(a.alive&&!a.player&&!a.lineage){const s=SPECIES[a.species];(sp[a.species]??=[]).push([a.energy/s.maxEnergy,a.hydration/s.maxHydration])}
const med=v=>v.sort((x,y)=>x-y)[v.length>>1];console.log(seed,process.argv[5]||'lod','end',Object.entries(sp).map(([k,v])=>`${k}:${v.length} E${med(v.map(x=>x[0])).toFixed(2)} W${med(v.map(x=>x[1])).toFixed(2)}`).join(' '));
{let g=0,ad=0,w=0;for(const b of Object.values(B)){g+=b.gain;w+=b.water;ad+=b.animalTicks/tpd}console.log('WORLD',seed,process.argv[5],'gain/animal-day',(g/ad).toFixed(3),'water/animal-day',(w/ad).toFixed(3),'alive',sim.animals.filter(a=>a.alive).length,'playerAlive',!!sim.player?.())}
