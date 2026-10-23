import {SPECIES} from '../organisms/species.js';
import {canHunt} from '../ecology/functional-diet.js';
import {creatureView,viewCanSee} from '../ecology/atmospheric-visibility.js';
import {surfaceIceCovered} from '../world/surface-ice.js';

// Early ecological drama (creator direction 2026-10-23). A read-only observer
// that samples the player's home range once per in-game day and turns real,
// measured change into short story beats: season turns with the local plant
// trend, shrinking or freezing water, ground freshly eaten bare, worn trails, herds arriving or
// leaving, hunters appearing, a fresh carcass and nearby fire. Creatures and
// carcasses are counted only when the player's creature actually sees them, so
// beats never reveal hidden threats. Consumes no RNG and changes no state.
export const WORLD_STORY=Object.freeze({radius:12,keep:24,kindCooldownDays:6,
 gapDays:day=>day<=60?1.5:day<=300?2.5:5,herd:4,stripFrom:.3,stripTo:.35,newScars:6,trail:.6,newTrails:8,watch:24,births:2,waterDrop:.2,seasonChange:.15});
const DIRS=['east','south-east','south','south-west','west','north-west','north','north-east'];
function direction(cx,cy,x,y){const a=Math.atan2(y-cy,x-cx),k=((Math.round(a/(Math.PI/4))%8)+8)%8;return DIRS[k]}
const label=s=>(SPECIES[s]?.label||s).toLowerCase();
const plural=(n,s)=>n===1?label(s):label(s).endsWith('s')?label(s):label(s)+'s';
export class WorldStory{
 constructor(){this.samples=[];this.lastBeatDay=-Infinity;this.lastKind={};this.lastDay=null;this.world=null}
 // The player's range: its established home, else where it stands now.
 center(sim,p){const home=sim.territory?.state?.(p)?.home;return home&&Number.isFinite(home.x)?{x:home.x,y:home.y,home:true}:{x:p.x,y:p.y,home:false}}
 sample(sim,p){
  const w=sim.world,c=this.center(sim,p),R=WORLD_STORY.radius,view=creatureView(sim,p,8),env=w.environment;
  const s={day:sim.day,season:sim.season,center:c,plants:0,water:0,waterCells:0,frozen:0,cellPlants:new Map(),trails:new Set(),seen:{},hunters:0,newborn:{},carcasses:[],fire:0,burning:new Set()};
  const x0=Math.max(0,Math.floor(c.x-R)),x1=Math.min(w.n-1,Math.ceil(c.x+R)),y0=Math.max(0,Math.floor(c.y-R)),y1=Math.min(w.n-1,Math.ceil(c.y+R));
  const kinds=Object.keys(w.plants).filter(k=>k!=='rotcap');
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){if(Math.hypot(x+.5-c.x,y+.5-c.y)>R)continue;const i=w.idx(x,y);
   if(w.water[i]){s.waterCells++;s.water+=env?.volume?.[i]??1;if(env&&surfaceIceCovered(env,i))s.frozen++;continue}
   let here=0;for(const k of kinds)here+=w.plants[k][i]||0;s.plants+=here;s.cellPlants.set(i,here);
   if((sim.history?.traffic?.[i]||0)>=WORLD_STORY.trail)s.trails.add(i);
   if(w.carrion?.[i]>.3&&viewCanSee(view,x+.5,y+.5))s.carcasses.push(i)}
  // Wildlife is counted only when the player's creature sees it, within the
  // wider ground it watches from home.
  for(const a of sim.animals){if(!a.alive||a.player||a.lineage||Math.hypot(a.x-c.x,a.y-c.y)>WORLD_STORY.watch||!viewCanSee(view,a.x,a.y))continue;s.seen[a.species]=(s.seen[a.species]||0)+1;if(canHunt(a))s.hunters++;if((a.age||0)<2)s.newborn[a.species]=(s.newborn[a.species]||0)+1}
  for(const i of sim.wildfire?.cells?.keys?.()||[]){const fx=i%w.n+.5,fy=(i/w.n|0)+.5;s.burning.add(i);if(Math.hypot(fx-c.x,fy-c.y)<=R+8){s.fire++;s.fireAt??={x:fx,y:fy}}}
  return s;
 }
 // Returns at most one beat for this day ({kind,text,tone}) or null.
 observe(sim){
  const p=sim.player?.();if(!p?.alive)return null;
  if(this.world!==sim){this.world=sim;this.samples=[];this.lastBeatDay=-Infinity;this.lastKind={};this.lastDay=null}
  if(this.lastDay===sim.day)return null;this.lastDay=sim.day;
  const now=this.sample(sim,p),prev=this.samples.at(-1),old=this.samples.at(-3)||this.samples[0];this.samples.push(now);if(this.samples.length>WORLD_STORY.keep)this.samples.shift();
  if(!prev||sim.day-this.lastBeatDay<WORLD_STORY.gapDays(sim.day))return null;
  const ready=kind=>!(sim.day-(this.lastKind[kind]??-Infinity)<WORLD_STORY.kindCooldownDays),near=now.center.home?'your home':'you',c=now.center;
  const beats=[];
  if(now.fire&&ready('fire'))beats.push({kind:'fire',tone:'warn',text:`Fire is burning ${direction(c.x,c.y,now.fireAt.x,now.fireAt.y)} of ${near}. Burning ground is dangerous; it will leave bare soil behind.`});
  if(now.season!==prev.season&&ready('season')){
   // First arrival of each season is always told; later ones only when the
   // land measurably changed since the previous season's turn.
   this.seasonsSeen??=new Set();const firstTime=!this.seasonsSeen.has(now.season);this.seasonsSeen.add(now.season);
   const lastTurn=[...this.samples].slice(0,-1).reverse().find((x,k,arr)=>arr[k+1]&&arr[k+1].season!==x.season)||this.samples[0],change=lastTurn?.plants>0?(now.plants-lastTurn.plants)/lastTurn.plants:0,pct=Math.round(Math.abs(change)*100);
   if(firstTime||Math.abs(change)>=WORLD_STORY.seasonChange){
    const trend=pct>=5?` Plants near ${near} are ${pct}% ${change<0?'below':'above'} where they stood ${now.day-lastTurn.day} days ago.`:'';
    const hint=firstTime?({AUTUMN:' Leaner months are coming: store food or learn richer ground.',WINTER:' Food grows slowly now; cold and hunger test every body.',SPRING:' Growth returns; young born now have the best start.',SUMMER:' Heat dries pools and plants; know where water lasts.'}[now.season]||''):'';
    beats.push({kind:'season',tone:change<=-WORLD_STORY.seasonChange?'warn':'safe',text:`${now.season[0]+now.season.slice(1).toLowerCase()} arrives.${trend}${hint}`})}}
  if(old&&old.water>0&&now.waterCells>0&&(old.water-now.water)/old.water>=WORLD_STORY.waterDrop&&ready('water'))beats.push({kind:'water',tone:'warn',text:`The water near ${near} is shrinking (${Math.round((old.water-now.water)/old.water*100)}% in a few days). Remember where else you found water.`});
  if(now.waterCells>=4&&now.frozen/now.waterCells>=.5&&(prev.frozen/Math.max(1,prev.waterCells))<.3&&ready('ice'))beats.push({kind:'ice',tone:'warn',text:`Ice is closing over the water near ${near}. Open water and safe footing will be harder to find.`});
  if(old){const n=sim.world.n,fresh=[];for(const [i,v] of now.cellPlants){const was=old.cellPlants.get(i);if(was>=WORLD_STORY.stripFrom&&v<=was*WORLD_STORY.stripTo&&!now.burning.has(i)&&!old.burning?.has(i))fresh.push(i)}
   if(fresh.length>=WORLD_STORY.newScars&&ready('scar')){const fx=fresh.reduce((t,i)=>t+i%n+.5,0)/fresh.length,fy=fresh.reduce((t,i)=>t+(i/n|0)+.5,0)/fresh.length;
    beats.push({kind:'scar',tone:'safe',text:`The ground ${direction(c.x,c.y,fx,fy)} of ${near} has been eaten bare (${fresh.length} patches in a few days). Stripped ground recovers slowly.`})}}
  if(old){const fresh=[...now.trails].filter(i=>!old.trails.has(i));if(fresh.length>=WORLD_STORY.newTrails&&ready('trail')){const n=sim.world.n,fx=fresh.reduce((t,i)=>t+i%n+.5,0)/fresh.length,fy=fresh.reduce((t,i)=>t+(i/n|0)+.5,0)/fresh.length;
   beats.push({kind:'trail',tone:'safe',text:`Paths are wearing into the ground ${direction(c.x,c.y,fx,fy)} of ${near}: animals keep using the same routes.`})}}
  if(old&&now.hunters>=2&&Math.max(old.hunters,prev.hunters)===0&&ready('hunters'))beats.push({kind:'hunters',tone:'warn',text:`Hunters are working ${now.center.home?'your home range':'this ground'}: ${now.hunters} seen nearby. Keep your young close.`});
  if(old)for(const [sp,n] of Object.entries(now.seen)){const before=Math.max(old.seen[sp]||0,prev.seen[sp]||0);if(n>=WORLD_STORY.herd&&n>=before*2+2&&ready('herd:'+sp)){beats.push({kind:'herd:'+sp,tone:'safe',text:`A group of ${n} ${plural(n,sp)} has moved into the ground near ${near}.`});break}}
  if(old)for(const [sp,n] of Object.entries(old.seen)){if(n>=WORLD_STORY.herd&&!(now.seen[sp])&&!(prev.seen[sp])&&ready('left:'+sp)){beats.push({kind:'left:'+sp,tone:'safe',text:`The ${plural(2,sp)} that grazed near ${near} have moved on.`});break}}
  for(const [sp,n] of Object.entries(now.newborn)){if(n>=WORLD_STORY.births&&!(prev.newborn[sp])&&ready('births')){beats.push({kind:'births',tone:'safe',text:`New life: ${n} young ${plural(n,sp)} were born near ${near}.`});break}}
  if(now.carcasses.length&&!prev.carcasses.length&&ready('carcass')){const n=sim.world.n,i=now.carcasses[0];beats.push({kind:'carcass',tone:'safe',text:`A carcass lies ${direction(c.x,c.y,i%n+.5,(i/n|0)+.5)} of ${near}: food for scavengers, and a sign that something hunts here.`})}
  const beat=beats[0];if(!beat)return null;
  this.lastBeatDay=sim.day;this.lastKind[beat.kind]=sim.day;return beat;
 }
}
