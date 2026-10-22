// Summarises tools/trace-species-life.mjs output in 30-day windows per species.
// Usage: node tools/analyze-species-life.mjs <trace.ndjson> [species,...]
import fs from 'node:fs';const f=process.argv[2];const rows=fs.readFileSync(f,'utf8').trim().split('\n').map(JSON.parse);
const life=rows.filter(r=>r.type==='life'),deaths=rows.filter(r=>r.type==='death'),start=rows[0];
const wanted=process.argv[3]?process.argv[3].split(','):[...new Set(life.map(r=>r.species))];
for(const sp of wanted){
 const L=life.filter(r=>r.species===sp);if(!L.length)continue;
 const f0=start.founders.filter(x=>x.species===sp);console.log('\n=====',sp,'founders',f0.length,'sexes',JSON.stringify(f0.reduce((m,x)=>(m[x.sex]=(m[x.sex]||0)+1,m),{})),'ages',f0.map(x=>x.age).join(','));
 const bins={};for(const r of L){const b=Math.floor((r.day-1)/30)*30;(bins[b]??=[]).push(r)}
 for(const [b,rs] of Object.entries(bins)){const m=rs.filter(r=>r.mature),avg=(a,k)=>a.length?(a.reduce((n,r)=>n+(typeof k==='function'?k(r):r[k]),0)/a.length):NaN;
  const intents={};for(const r of rs)for(const [k,n] of Object.entries(r.intents))intents[k]=(intents[k]||0)+n;const tot=Object.values(intents).reduce((a,b)=>a+b,0)||1;
  const top=Object.entries(intents).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,n])=>k+':'+(n/tot*100).toFixed(0)+'%').join(' ');
  console.log('d'+(+b+1)+'-'+(+b+30),'n/day',(rs.length/30).toFixed(1),'energy',avg(rs,'energy').toFixed(2),'rising%',(rs.filter(r=>r.energyDelta>0).length/rs.length*100).toFixed(0),'hydr',avg(rs,'hydration').toFixed(2),'inWater%',(rs.filter(r=>r.inWater).length/rs.length*100).toFixed(0),
   '| mature',m.length?(m.length/rs.length*100).toFixed(0)+'%':'0','allowed%',m.length?(m.filter(r=>r.breeding?.allowed).length/m.length*100).toFixed(0):'-','resource',m.length?avg(m,r=>r.breeding?.resource||0).toFixed(2):'-','crowd',m.length?avg(m,r=>r.breeding?.crowd||0).toFixed(2):'-','mateAvail%',m.length?(m.filter(r=>r.mates>0).length/m.length*100).toFixed(0):'-','mateDist',m.length?avg(m.filter(r=>r.nearestMate!=null),'nearestMate').toFixed(1):'-','preg',rs.filter(r=>r.pregnant).length,
   sp==='bankjaw'?'prey '+avg(rs,'preyInRadius').toFixed(1):'food '+avg(rs,'freshwaterFoodNear').toFixed(1),'| '+top)}
 const ds=deaths.filter(d=>d.species===sp);console.log('deaths',ds.map(d=>'d'+d.day+':'+d.cause+':age'+d.age+':e'+d.energy+':'+d.sex).join(' '));
}
