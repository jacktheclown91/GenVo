// Usage: node tools/probe-basal-mass.mjs [species=mosskip]: 10 days on GENVO8-TEST-A under all v1 rules; the resting (basal) energy cost per
// animal-day as a share of the maximum reserve, against the real-needs design of 1/15, and mean body mass relative to the species
// reference mass. Measurement only.
const R=new URL('../src/',import.meta.url).href,sp=process.argv[2]||'mosskip';
const {Simulation}=await import(R+'sim/simulation.js');const {CFG}=await import(R+'sim/config.js');const {SPECIES}=await import(R+'organisms/species.js');const {basalResourceCosts,bodyMass}=await import(R+'organisms/body-mass.js');const {basalScale}=await import(R+'ecology/metabolism-policy.js');const {BIO_STEPS_PER_DAY}=await import(R+'sim/day-clock.js');
const s=new Simulation('GENVO8-TEST-A',{player:true,dayClock:true,metabolism:true,foodProperties:true,winterWater:true,escapeLanding:true,worldGenerator:'planetary/1'});s.setPlayerAutonomy(true);
const M=SPECIES[sp].maxEnergy;let n=0,basal=0,genes=0,massR=0,met=0;
const wrap=s.phaseMetabolism.bind(s);let phaseSpent=0,phaseN=0;s.phaseMetabolism=()=>{const b=new Map(s.animals.filter(a=>a.alive&&a.species===sp).map(a=>[a.id,a.energy]));wrap();for(const a of s.animals)if(b.has(a.id)&&a.alive){const d=b.get(a.id)-a.energy;phaseSpent+=d;phaseN++;const base=basalResourceCosts(a).energy*basalScale(s,a).energy;basal+=base;genes+=base/a.genes.metabolism;massR+=bodyMass(a)/SPECIES[sp].mass}};
for(let t=0;t<CFG.dayTicks*10;t++)s.update(null);
const perDay=v=>(v/phaseN*BIO_STEPS_PER_DAY/M).toFixed(3);
console.log(sp,'per animal-day share of max: basal x scale',perDay(basal),'/ genes.metabolism',perDay(genes),'actual metabolism phase',perDay(phaseSpent),'mean mass / species mass',(massR/phaseN).toFixed(2));
