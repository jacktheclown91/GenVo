const R=new URL('../../src/',import.meta.url).href;
const {Simulation}=await import(R+'sim/simulation.js');const {CFG}=await import(R+'sim/config.js');
for(const sprint of [false,true]){
 const s=new Simulation('GENVO8-TEST-A',{player:true,worldGenerator:'planetary/1',regionalFrontier:true});s.setPlayerAutonomy(false);const p=s.player();
 let dir=0,dist=0,e0=p.energy,w0=p.hydration,steps=0;const dirs=[['right'],['down'],['left'],['up']];
 // One in-game day of walking: control steps at controlHz plus ecology ticks, as the browser does.
 const ratio=CFG.controlHz/CFG.simHz;
 for(let t=0;t<CFG.dayTicks;t++){for(let k=0;k<ratio;k++){const input={up:false,down:false,left:false,right:false,sprint,brace:false};input[dirs[dir%4][0]]=true;const x=p.x,y=p.y;s.playerControlStep(input,CFG.controlHz);dist+=Math.hypot(p.x-x,p.y-y);if(++steps%(CFG.controlHz*2)===0)dir++}
  s.update({up:false,down:false,left:false,right:false,sprint:false,brace:false})}
 console.log(sprint?'sprint':'walk','tiles',dist.toFixed(1),'energy spent',(e0-p.energy).toFixed(2),'water spent',(w0-p.hydration).toFixed(2),'per tile',((e0-p.energy)/Math.max(1,dist)).toFixed(4),'exertion',p.exertion?.toFixed?.(0))}
