// Usage: node tools/probe-first-month.mjs <30s|v1f|v1fw>[+e][-h][-u] [days=40] [seed=GENVO8-TEST-A]
// +e adds escape landing, +t tissue energy (+G applies the physical growth and repair cost), -B the reference-body metabolism (fasting-1);
// +r perennial regrowth (-R without the root reserve, -S without seed rain); -h, -u and -s switch off the hungry-search, urgent-water and herd-allowance
// corrections.
// First-month mortality under one rule set, for comparing the 30-second clock with old physiology
// (30s) against real needs (v1f, v1fw = plus winter water). Every death with cause, species, day,
// reserves, health, age, the intent at death and the animal's most frequent recent intents; for
// predation the hunter and its own reserves; for drowning the water depth and swimming ability.
// Also the daily census per species and births. Measurement only.
const R=new URL('../src/',import.meta.url).href;
const {Simulation}=await import(R+'sim/simulation.js');const {CFG}=await import(R+'sim/config.js');const {SPECIES}=await import(R+'organisms/species.js');const {canSwim}=await import(R+'lineage/lifestyle.js');
const arg=process.argv[2]||'v1fw',rules=arg.match(/^[a-z0-9]+/)[0],days=Number(process.argv[3]||40),seed=process.argv[4]||'GENVO8-TEST-A';
const s=new Simulation(seed,{player:true,dayClock:true,metabolism:rules.startsWith('v1')&&(arg.includes('-B')?'fasting-1':true),foodProperties:rules.startsWith('v1f'),winterWater:rules.endsWith('w'),escapeLanding:arg.includes('+e'),tissueEnergy:arg.includes('+t'),perennialRegrowth:arg.includes('+r'),worldGenerator:'planetary/1'});s.setPlayerAutonomy(true);s.correctionExperiment={hungrySearch:!arg.includes('-h'),urgentWater:!arg.includes('-u'),socialAllowance:!arg.includes('-s'),tissueGrowth:arg.includes('+G'),rootReserve:!arg.includes('-R'),seedRain:!arg.includes('-S')};
const recent=new Map(),deaths=[],kill=s.kill.bind(s),r2=v=>Math.round(v*100)/100;
const res=a=>{const sp=SPECIES[a.species];return{e:r2(a.energy/sp.maxEnergy),w:r2(a.hydration/sp.maxHydration)}};
s.kill=(a,c)=>{if(a?.alive){const w=s.world,i=w.idx(a.x,a.y),sp=SPECIES[a.species],d={day:s.day,cause:c,species:a.species,player:!!a.player,...res(a),health:Math.round(a.health),young:a.age<sp.maturity,intent:a.intent,recent:Object.entries(recent.get(a.id)||{}).sort((x,y)=>y[1]-x[1]).slice(0,4).map(([k,v])=>k+':'+v).join(' ')};
 if(c==='predation'){const h=s.animals.filter(b=>b.alive&&b!==a&&Math.hypot(b.x-a.x,b.y-a.y)<3&&(b.target===a||b.target?.id===a.id||b.intent==='hunt')).sort((x,y)=>Math.hypot(x.x-a.x,x.y-a.y)-Math.hypot(y.x-a.x,y.y-a.y))[0];d.hunter=h?{species:h.species,player:!!h.player,...res(h)}:null}
 if(c==='dehydration'){d.waterDist=w.waterDistance[i];d.drinkableHere=w.isDrinkable(a.x,a.y);d.targetKind=a.target?.kind||(a.target?.search?'search':a.target?.snow?'snow':a.target?.drinkable?'spot':a.target?'other':'none');d.targetDist=a.target?+Math.hypot(a.target.x-a.x,a.target.y-a.y).toFixed(1):null}
 if(c==='drowning'){d.inWater=!!w.water[i];d.swimmer=canSwim(a);d.waterDist=w.waterDistance[i]}
 deaths.push(d)}return kill(a,c)};
const census=()=>{const c={};for(const a of s.animals)if(a.alive)c[a.species]=(c[a.species]||0)+1;return c};
const seen=new Set(s.animals.map(a=>a.id));let births=0;const daily=[];
for(let d=1;d<=days;d++){for(let t=0;t<CFG.dayTicks;t++){s.update(null);if(t%CFG.lifeStride===0)for(const a of s.animals)if(a.alive){const r=recent.get(a.id)||{};r[a.intent]=(r[a.intent]||0)+1;recent.set(a.id,r)}}
 for(const a of s.animals)if(!seen.has(a.id)){seen.add(a.id);births++}
 const al=s.animals.filter(a=>a.alive&&!a.player),mean=k=>r2(al.reduce((t,a)=>t+res(a)[k],0)/Math.max(1,al.length));
 daily.push({day:s.day,season:s.climate?.season,temp:r2(s.climate?.temp??0),alive:al.length,meanEnergy:mean('e'),meanWater:mean('w'),births,census:census()})}
const tally=(f)=>{const o={};for(const d of deaths){const k=f(d);o[k]=(o[k]||0)+1}return Object.fromEntries(Object.entries(o).sort((a,b)=>b[1]-a[1]))};
console.log(JSON.stringify({rules:arg,seed,days,byCause:tally(d=>d.cause),byCauseSpecies:tally(d=>d.cause+' '+d.species),byCauseIntent:tally(d=>d.cause+' @'+d.intent),
 predationHunters:tally(d=>d.cause==='predation'?(d.hunter?(d.hunter.player?'player ':'')+d.hunter.species:'unknown'):'-'),
 preyReservesAtPredation:deaths.filter(d=>d.cause==='predation').map(d=>`${d.species} e${d.e} w${d.w} h${d.health}${d.young?' young':''} @${d.intent}`),
 drowning:deaths.filter(d=>d.cause==='drowning').map(d=>`${d.day} ${d.species} swimmer:${d.swimmer} inWater:${d.inWater} e${d.e} w${d.w} @${d.intent} | ${d.recent}`),
 dehydration:deaths.filter(d=>d.cause==='dehydration').map(d=>`${d.day} ${d.species}${d.young?' young':''} e${d.e} @${d.intent} target:${d.targetKind}@${d.targetDist} waterDist:${d.waterDist} drinkableHere:${d.drinkableHere} | ${d.recent}`),
 starvation:deaths.filter(d=>d.cause==='starvation').map(d=>`${d.day} ${d.species}${d.young?' young':''} w${d.w} @${d.intent} | ${d.recent}`),
 daily},null,1));
