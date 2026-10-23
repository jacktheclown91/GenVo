// Usage: node tools/probe-wild-intake.mjs: three wild herbivores under 30-second days, real needs and
// food properties; daily energy gained and lost and time per intent.
const R=new URL('../src/',import.meta.url).href;
const {Simulation}=await import(R+'sim/simulation.js');const {CFG}=await import(R+'sim/config.js');const {SPECIES}=await import(R+'organisms/species.js');const M=await import(R+'ecology/metabolism-policy.js');const {basalResourceCosts}=await import(R+'organisms/body-mass.js');
const s=new Simulation('GENVO8-TEST-A',{player:true,dayClock:true,metabolism:true,foodProperties:true,worldGenerator:'planetary/1'});s.setPlayerAutonomy(true);
const watch=['mosskip','podshell','mirelick'].map(sp=>s.animals.find(a=>a.alive&&a.species===sp));
for(const a of watch){const S=SPECIES[a.species];console.log(a.species,'maxE',S.maxEnergy,'basal/step',basalResourceCosts(a).energy.toFixed(4),'scale',M.basalScale(s,a).energy.toFixed(1),'mass',a.massPolicy)}
for(let d=0;d<8;d++){const st=watch.map(a=>({gain:0,loss:0,intents:{}}));
 for(let t=0;t<CFG.dayTicks;t++){const before=watch.map(a=>a.energy);s.update(null);watch.forEach((a,k)=>{if(!a.alive)return;const dE=a.energy-before[k];if(dE>0)st[k].gain+=dE;else st[k].loss-=dE;st[k].intents[a.intent]=(st[k].intents[a.intent]||0)+1})}
 console.log('day',s.day,watch.map((a,k)=>`${a.species}${a.alive?'':'(dead)'} E${(a.energy/SPECIES[a.species].maxEnergy).toFixed(2)} +${st[k].gain.toFixed(1)} -${st[k].loss.toFixed(1)} ${Object.entries(st[k].intents).sort((x,y)=>y[1]-x[1]).slice(0,3).map(([i,n])=>i+':'+n).join(',')}`).join(' | '))}
