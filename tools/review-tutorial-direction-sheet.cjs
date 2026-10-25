const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{
 const root=process.cwd(),out=path.resolve(process.argv[2]||'reports/tutorial-direction-sheet');fs.mkdirSync(out,{recursive:true});
 const server=http.createServer((req,res)=>{if(req.url==='/fixture.html'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Tutorial arrow artwork fixture</title>');return}const name=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!name.startsWith(root+path.sep)){res.writeHead(403).end();return}fs.readFile(name,(err,data)=>{if(err){res.writeHead(404).end();return}res.setHeader('Content-Type',path.extname(name)==='.js'?'text/javascript':'text/html');res.end(data)})});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({headless:true});
 try{
 const page=await browser.newPage({viewport:{width:1280,height:420}});await page.goto('http://127.0.0.1:'+server.address().port+'/fixture.html');
 const result=await page.evaluate(async()=>{
  const {drawTutorialGuide}=await import('/src/render/tutorial-guide-art.js'),canvas=document.createElement('canvas');canvas.width=1280;canvas.height=400;canvas.id='directionSheet';Object.assign(canvas.style,{position:'fixed',left:0,top:0,zIndex:99999,width:'1280px',height:'400px'});document.body.append(canvas);
  const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#102017';c.fillRect(0,0,1280,400);c.font='bold 18px Verdana';c.fillStyle='#f2dfa1';c.fillText('Tutorial direction artwork - synthetic screen positions',16,26);c.font='12px Verdana';c.fillStyle='#c7d1b1';c.fillText('Real painter, 24 fixture cases. This sheet is not an observed gameplay scene.',16,48);
  const directions=['E','SE','S','SW','W','NW','N','NE'],rows=[];
  // Blank fixture document has no gameplay UI or simulation running.
  for(const [row,label] of ['Food','Water','Mate'].entries())for(let direction=0;direction<8;direction++){
   c.save();c.translate(direction*160,60+row*110);c.strokeStyle='#405238';c.strokeRect(.5,.5,159,109);c.fillStyle='#c7d1b1';c.font='12px Verdana';c.fillText(directions[direction],10,20);
   const angle=direction*Math.PI/4,world={},renderer={ctx:c,w:160,h:110,sim:{world,playerId:1},canvas:{getBoundingClientRect:()=>({left:0,top:0,width:160,height:110})},screenBoundsWorld:world,screenBounds:new Map(),readoutRects:[]};
   const mode=drawTutorialGuide(renderer,{tile:32,player:{x:80,y:32},target:{x:80+Math.cos(angle)*2000,y:32+Math.sin(angle)*2000},label});rows.push({label,expected:direction,actual:mode.direction});c.restore();
  }
  return{scope:'Isolated native painter fixture; no natural resource/action claim.',rows};
 });
 if(result.rows.some(r=>r.expected!==r.actual))throw Error('Directional fixture mismatch');await page.locator('#directionSheet').screenshot({path:path.join(out,'directions.png')});fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(result,null,2));console.log('Native tutorial direction sheet: 24 fixture cases.');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});
