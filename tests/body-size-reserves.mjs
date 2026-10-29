// body-size/1 reserve accounting. Food and water are absolute outside bodies (world
// stocks, prey, carcasses, eggs, stores, milk, budgets); each body keeps reserves in
// its species' capacity units, so a body of linear scale s holds R = s^3 times the
// absolute amount per unit. Every intake and transfer site converts at the boundary,
// and per-action amounts (bites, sips, gulps, suckling) follow mouth area s^2.
// Each check below runs the real site for a reference body and a 2x body and
// proves conservation in absolute units. Bodies without the rule convert nothing.
import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {toReserve,toAbsolute,mouthScale,reserveScale} from '../src/organisms/body-size.js';
import {waterFromPrey,depositCarcassWater,waterFromCarrion} from '../src/ecology/tissue-water.js';
import {killMealLimit,meatEnergy} from '../src/ecology/tissue-energy.js';
import {birthFunding,conceptionFunding} from '../src/ecology/birth-investment.js';
import {bodyMassFraction} from '../src/organisms/body-mass.js';
import {advanceAgeDay,growthCostForDay} from '../src/ecology/juvenile-biology.js';
import {WINTER_WATER,resolveWinterWater} from '../src/ecology/winter-water.js';
import {initializeSoilWater} from '../src/ecology/soil-water.js';
import {eatEgg} from '../src/reproduction/egg-ecology.js';
import {canHunt} from '../src/ecology/functional-diet.js';
import {MAMMAL,transferMilk} from '../src/ecology/mammalian-care.js';
import {makePlan,validatePlan} from '../src/lineage/body-plan.js';
import {founderPlan} from '../src/lineage/body-inheritance.js';

const S=2,R=S**3,M=S**2;
const close=(x,y,label,tol=1e-9)=>assert.ok(Math.abs(x-y)<=tol*Math.max(1,Math.abs(x),Math.abs(y)),`${label}: ${x} vs ${y}`);
// World stocks are Float32; quantities read back from them carry single precision.
const near=(x,y,label)=>close(x,y,label,1e-6);
const sized=(a,s)=>{a.bodySize={schema:1,alleles:[Math.log(s),Math.log(s)]};return a};
const make=()=>{const sim=new Simulation('GENVO8-TEST-A',{player:true,dayClock:true,metabolism:true,foodProperties:true,tissueEnergy:true,tissueWater:true,winterWater:true,bodySize:true,worldGenerator:'planetary/1'});sim.world.soilWater||initializeSoilWater(sim.world);return sim};
const sim=make(),w=sim.world;
// Run a site for a reference and a 2x body from the same starting state.
function paired(a,run){const keep=structuredClone(a),out={};for(const s of [1,S]){Object.assign(a,structuredClone(keep));sized(a,s);out[s]=run(s)}Object.assign(a,structuredClone(keep));return out}

// 0. The conversions: identity without the rule, R and mouth area with it.
{
 const plain={species:'genvo'},big=sized({species:'genvo'},S);
 assert.equal(toReserve(plain,7.3),7.3);assert.equal(toAbsolute(plain,7.3),7.3);assert.equal(mouthScale(plain),1);
 close(reserveScale(big),R,'R');close(toReserve(big,8),1,'toReserve');close(toAbsolute(big,1),8,'toAbsolute');close(mouthScale(big),M,'mouth');
}
// 1. Drinking at a water tile (wildlife sip) and the player's drink: the absolute
// draught follows mouth area, so reserve gain is mouth/R = 1/s.
{
 const a=sim.player(),s=SPECIES[a.species];let spot=null;
 for(let y=4;y<w.n-4&&!spot;y++)for(let x=4;x<w.n-4&&!spot;x++)if(w.isDrinkable(x+.5,y+.5)&&sim.canOccupy(a,x+.5,y+.5))spot={x:x+.5,y:y+.5};
 assert.ok(spot,'a drinkable tile exists');
 const sip=paired(a,()=>{a.x=spot.x;a.y=spot.y;a.hydration=s.maxHydration*.05;a.intent='drink';a.target={x:spot.x,y:spot.y};const before=a.hydration;sim.resolveInteraction(a);return a.hydration-before});
 assert.ok(sip[1]>0);close(toAbsolute(sized({},S),sip[S]),sip[1]*M,'wildlife sip follows mouth area');
 const gulp=paired(a,()=>{a.x=spot.x;a.y=spot.y;a.hydration=s.maxHydration*.05;a.intent='idle';a.target=null;const before=a.hydration;assert.ok(sim.playerDrink().ok);return a.hydration-before});
 assert.ok(gulp[1]>0);close(gulp[S]*R,gulp[1]*M,'player gulp follows mouth area');
}
// 2. Player plant meal (foraging.consume): the bite follows mouth area; every absolute
// unit of energy and water is the tissue removed from the world times its value.
{
 const a=sim.player(),s=SPECIES[a.species];let meal=null;
 for(let k=0;k<4000&&!meal;k++){const i=(k*7919)%w.len,x=i%w.n+.5,y=Math.floor(i/w.n)+.5;if(!w.isPlayable(x,y)||w.water[i])continue;a.x=x;a.y=y;meal=sim.foraging.options(a).find(o=>o.kind!=='carrion'&&!o.tissue&&o.handling.enabled&&w.plants[o.kind]?.[o.i]>.2)}
 assert.ok(meal,'a reachable plant meal exists');const pos={x:a.x,y:a.y},arr=w.plants[meal.kind],original=arr[meal.i],stock=2,st=sim.foraging.state(a),keepState=structuredClone(st);
 const eat=paired(a,()=>{a.x=pos.x;a.y=pos.y;a.energy=s.maxEnergy*.1;a.hydration=s.maxHydration*.1;arr[meal.i]=stock;Object.assign(st,structuredClone(keepState));const e=a.energy,h=a.hydration;assert.ok(sim.foraging.consume(a,{...meal}).ok);return{tissue:stock-arr[meal.i],energy:a.energy-e,water:a.hydration-h}});
 arr[meal.i]=original;
 near(eat[S].tissue,eat[1].tissue*M,'plant bite follows mouth area');
 near(eat[S].energy*R/eat[S].tissue,eat[1].energy/eat[1].tissue,'same absolute energy per unit of plant tissue');
 close(eat[S].water*R,eat[1].water*M,'plant tissue water is absolute');
}
// 3. Tissue water: prey, carcass and scavenger move absolute water between bodies of different size.
{
 const pred=sim.animals.find(a=>a.alive&&!a.player),prey=sim.animals.find(a=>a.alive&&!a.player&&a!==pred);
 sized(pred,1);sized(prey,S);pred.hydration=0;prey.hydration=SPECIES[prey.species].maxHydration*.5;
 const before=prey.hydration,led=()=>({...sim.stats.tissueWater||{fromPrey:0,overflowLost:0}}),l0=led();
 const got=waterFromPrey(sim,pred,prey,1,4),l1=led();
 close((before-prey.hydration)*R,pred.hydration,'prey water lost (absolute) reaches the predator');close(got,pred.hydration,'returned gain is absolute');
 close(l1.fromPrey-(l0.fromPrey||0),(before-prey.hydration)*R,'ledger is absolute');
 // A large eater of a small prey gains only that prey's absolute water.
 sized(pred,S);pred.hydration=0;sized(prey,1);prey.hydration=SPECIES[prey.species].maxHydration*.5;const small=prey.hydration;
 waterFromPrey(sim,pred,prey,1,2);close(pred.hydration*R,small/2,'big eater gains small prey water divided by R');
 // Carcass and scavenger.
 const body=sim.animals.find(a=>a.alive&&!a.player&&a!==pred&&a!==prey);sized(body,S);body.hydration=10;const i=w.idx(body.x,body.y);
 w.carrionWater??=new Float32Array(w.len);const cell=w.carrionWater[i];depositCarcassWater(sim,body,i,1);near(w.carrionWater[i]-cell,10*R,'carcass keeps absolute body water');
 sized(pred,S);pred.hydration=0;const held=w.carrionWater[i];w.carrion[i]=Math.max(w.carrion[i],1);const tissue=w.carrion[i];
 waterFromCarrion(sim,pred,i,tissue/2,tissue);near(toAbsolute(pred,pred.hydration),held-w.carrionWater[i],'scavenger gains the absolute water it removes');
}
// 4. Kill meals: the gorge limit is absolute tissue; the reserve deficit converts to absolute.
{
 const pred=sim.animals.find(a=>a.alive&&!a.player),s=SPECIES[pred.species],per=meatEnergy(sim,pred);
 const lim=paired(pred,()=>{pred.energy=s.maxEnergy-1;return killMealLimit(sim,pred,per)});
 assert.ok(lim[1]>0&&lim[1]<Infinity);close(lim[S],lim[1]*R,'a 2x body needs R times the tissue to fill one reserve unit');
}
// 5. Birth funding: parents pay in their own reserve units; budgets are absolute;
// newborns receive budgets in their own reserve units.
{
 const [mother,father]=sim.animals.filter(a=>a.alive&&a.species==='genvo').slice(0,2),sp=SPECIES.genvo;
 sized(mother,S);sized(father,1);mother.energy=father.energy=sp.maxEnergy;mother.hydration=sp.maxHydration*.4;
 const conception=conceptionFunding({int:(lo)=>lo,range:()=>0,chance:()=>false},mother,father,sp,'live');
 const paidM=sp.maxEnergy-mother.energy,paidF=sp.maxEnergy-father.energy;assert.ok(paidM>0&&paidF>0);
 close(conception.reserveInvestment,paidM*R+paidF,'conception investment is absolute');
 const funding=birthFunding(mother,sp,conception);
 close(funding.budget,funding.payment*R+conception.reserveInvestment,'birth budget is absolute');close(funding.hydrationBudget,mother.hydration*R,'water budget is absolute');
 const before=mother.hydration,kids=sim.spawnFundedOffspring(mother,father,[mother,father],{count:2,x:mother.x,y:mother.y,energyBudget:funding.budget,hydrationBudget:funding.hydrationBudget});
 assert.ok(kids.length===2&&kids.every(k=>k.bodySize));
 for(const kid of kids){close(kid.energy,Math.min(sp.maxEnergy*.72*bodyMassFraction(kid),toReserve(kid,funding.budget/2)),'newborn energy is its absolute share in its own units');
  close(kid.hydration,Math.min(sp.maxHydration*.82,toReserve(kid,funding.hydrationBudget/2)),'newborn water is its absolute share in its own units')}
 assert.equal(mother.hydration,before,'the newborn authority itself does not debit; the birth path does');
 sim.animals=sim.animals.filter(a=>!kids.includes(a));
}
// 6. Funded growth: the day's added tissue is absolute and is paid in the body's own units.
{
 const kid=sim.animals.find(a=>a.alive&&!a.player),sp=SPECIES[kid.species];
 const grow=paired(kid,()=>{kid.age=1;kid.energy=sp.maxEnergy;kid.growthPaid=0;const cost=growthCostForDay(kid),e=kid.energy;advanceAgeDay(kid);return{cost,paid:e-kid.energy,ledger:kid.growthPaid}});
 close(grow[S].cost,grow[1].cost*R,'a 2x body adds R times the tissue');close(grow[S].paid,grow[1].paid,'paid in own reserve units: the same share of reserves');
 near(grow[S].ledger,grow[S].cost,'growth ledger is absolute');
}
// 7. Snow: water and melt energy are absolute; the mouthful follows mouth area.
{
 const a=sim.animals.find(x=>x.alive&&!x.player),s=SPECIES[a.species],j=w.idx(a.x,a.y),snow=w.soilWater.snowpack;
 const melt=paired(a,()=>{snow[j]=5;a.hydration=s.maxHydration*.1;a.energy=s.maxEnergy*.8;a.target={x:Math.floor(a.x)+.5,y:Math.floor(a.y)+.5,snow:true};a.intent='drink';a.x=a.target.x;a.y=a.target.y;const h=a.hydration,e=a.energy;assert.ok(resolveWinterWater(sim,a));return{taken:5-snow[j],water:a.hydration-h,energy:e-a.energy}});
 near(melt[S].taken,melt[1].taken*M,'snow mouthful follows mouth area');
 for(const k of [1,S])near(toAbsolute(sized({},k),melt[k].water),melt[k].taken*WINTER_WATER.hydrationPerSnow,'snow water conserved');
 close(melt[S].energy*R,melt[1].energy*M,'melt energy is absolute');
}
// 8. Egg predation: egg contents are absolute.
{
 const pred=sim.animals.find(a=>a.alive&&!a.player&&canHunt(a)),sp=SPECIES[pred.species];
 const meal=paired(pred,()=>{pred.energy=sp.maxEnergy*.1;pred.nextEggAttackTick=0;const egg={id:9e6,species:pred.species,motherId:-1,x:pred.x,y:pred.y,energy:10,hydration:5,nestId:null,incubationDays:9,condition:1};sim.eggs.push(egg);
  const e=pred.energy;const ok=eatEgg(sim,pred,egg);sim.eggs=sim.eggs.filter(x=>x!==egg);return ok===false?null:pred.energy-e});
 assert.ok(meal[1]!==null&&meal[S]!==null,'the egg was eaten');const benefit=10*.72+5*.08;
 close(meal[1],benefit-.4,'reference eater');close(meal[S],benefit/R-.4,'egg contents are absolute; the work of breaking cover is the eater pays its own effort');
}
// 9. Live birth, milk and provisioning between bodies of different size. A real
// conception and birth through the unchanged authorities (as in care-expression).
{
 const mother=sim.player(),father=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==mother.id),sp=SPECIES.genvo;
 const nodes=founderPlan().nodes.map(n=>({partId:!n.parent?'soft-torso':n.partId,parent:n.parent,socket:n.socket}));
 const plan=makePlan([...nodes,{partId:'fur-mantle',parent:'root',socket:'dorsal'},{partId:'live-womb',parent:'root',socket:'flank.left'},{partId:'endothermic-core',parent:'root',socket:'flank.right'},{partId:'mammary-gland',parent:'root',socket:'flank.right'}]);assert.ok(validatePlan(plan).ok);
 for(const a of [mother,father]){Object.assign(a,{bodyPlan:plan,age:40,reproCooldown:0,energy:sp.maxEnergy,hydration:sp.maxHydration,intent:'idle',pregnant:null})}
 sized(mother,1.5);sized(father,1.2);mother.sex='F';father.sex='M';father.x=mother.x+.4;father.y=mother.y;sim.rebuildSpatial();sim.reproduction.courtTargetId=father.id;
 assert.ok(sim.tryMate(mother,father),'the staged pair conceives');
 const h=mother.hydration,children=sim.giveBirth(mother);assert.ok(children.length);
 near(toAbsolute(mother,h-mother.hydration),children.reduce((t,c)=>t+toAbsolute(c,c.hydration),0),'the mother loses exactly the absolute water her young receive');
 const child=children[0];child.x=mother.x+.3;child.y=mother.y;child.intent='idle';child.energy=1;
 mother.energy=sp.maxEnergy;mother.hydration=sp.maxHydration;const pe=mother.energy,ph=mother.hydration,ce=child.energy,ch=child.hydration;
 const fed=transferMilk(mother,child,{maximum:2});assert.ok(fed.ok,fed.reason);
 close(fed.fed,2*mouthScale(child),'suckling follows the infant mouth');
 close(toAbsolute(mother,pe-mother.energy),fed.fed*MAMMAL.conversionEnergy,'mother pays absolute milk energy');
 close(toAbsolute(mother,ph-mother.hydration),fed.fed*MAMMAL.waterPerMilk,'mother pays absolute milk water');
 close(toAbsolute(child,child.energy-ce),fed.fed,'infant gains the absolute milk');close(toAbsolute(child,child.hydration-ch),fed.fed*MAMMAL.waterPerMilk,'infant gains the milk water');
 // Provisioning caps are absolute; giver and receiver each move the same absolute amount.
 child.energy=1;child.hydration=1;const prov=sim.family.tendProvision(mother,child);
 assert.ok(prov.fromParent>0&&prov.water>0);close(prov.fromParent,Math.min(5.2*1.34*mouthScale(child),toAbsolute(child,sp.maxEnergy*.74-1)-prov.fromShelter),'provision is the infant mouth or need, in absolute units');
 close(prov.water,3.2*1.28*mouthScale(child),'water provision follows the infant mouth');
 // The father (no milk) provisions from his own reserves: both bodies move the same absolute amount.
 assert.ok(child.parentIds.includes(father.id));Object.assign(father,{x:child.x+.2,y:child.y,energy:sp.maxEnergy,hydration:sp.maxHydration,intent:'idle'});child.careCooldownUntil=0;
 const fe=father.energy,fh=father.hydration,ke=child.energy,kh=child.hydration,tended=sim.family.tend(father,child);
 assert.ok(tended.ok&&tended.fed>0&&tended.shared>0,tended.message);
 close(toAbsolute(father,fe-father.energy-.55),toAbsolute(child,child.energy-ke),'provisioned food is conserved between bodies (beside the caregiver own .55 effort)');
 close(toAbsolute(father,fh-father.hydration),toAbsolute(child,child.hydration-kh),'shared water is conserved between bodies');
}
// 10. Bodies without the rule convert nothing (recorded worlds stay exact).
{
 const plain=new Simulation('GENVO8-TEST-A',{player:true,dayClock:true,metabolism:true,foodProperties:true,tissueWater:true,worldGenerator:'planetary/1'});
 assert.ok(plain.animals.every(a=>a.bodySize===undefined&&toReserve(a,3.7)===3.7&&toAbsolute(a,3.7)===3.7&&mouthScale(a)===1));
}
console.log(`Body size reserves PASS: sips, gulps, plant bites, tissue water, carcasses, kill limits, birth budgets, funded growth, snow, eggs and milk conserve absolute food and water between bodies of different size; bites follow mouth area; unsized bodies convert nothing`);
