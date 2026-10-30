const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{
  const root=process.cwd(),out=path.resolve(process.argv[2]);
  if(fs.existsSync(out))throw Error('Use a fresh evidence directory');
  fs.mkdirSync(out,{recursive:true});
  const server=http.createServer((req,res)=>{
    const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);
    if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end()}
    fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end()}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':'text/html');res.end(data)});
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  let browser;
  try{
    browser=await chromium.launch();const page=await browser.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+server.address().port+'/tools/creature-lab/index.html');
    const png=await page.evaluate(async()=>{
      const {drawPart}=await import('/src/render/part-sprites.js');
      const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=320;
      const c=canvas.getContext('2d');c.fillStyle='#14251d';c.fillRect(0,0,1280,320);
      // Explicit procedural fallback: omit drawImage so indexed artwork is not
      // mistaken for proof of this fallback-only correction.
      const fallback={fillRect:c.fillRect.bind(c),get fillStyle(){return c.fillStyle},set fillStyle(v){c.fillStyle=v}};
      for(let row=0;row<2;row++)for(let dir=0;dir<8;dir++){
        const a=(dir-2)*Math.PI/4,fx=Math.cos(a),fy=Math.sin(a),x=dir*160+80,y=row*160+85;
        c.fillStyle='#ddd3b8';c.font='12px sans-serif';c.fillText(['grasper','digging-forelimb'][row]+' '+['N','NE','E','SE','S','SW','W','NW'][dir],dir*160+5,row*160+18);
        c.strokeStyle='#71926b';c.beginPath();c.moveTo(x,y);c.lineTo(x+fx*40,y+fy*40);c.stroke();
        for(const side of [-1,1]){
          c.save();c.translate(x-fy*side*23,y+fx*side*23);
          drawPart(fallback,['grasper','digging-forelimb'][row],{s:10,fx,fy,perp:{x:-fy,y:fx},foot:{x:0,y:0},leg:{side},p:{light:'#d8e8b9',shade:'#739760'}});
          c.restore();
        }
      }
      return canvas.toDataURL();
    });
    if(errors.length)throw Error(errors.join('\n'));
    fs.writeFileSync(path.join(out,'forelimb-directions.png'),Buffer.from(png.split(',')[1],'base64'));
    fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify({status:'PASS',errors,scope:'Actual browser procedural drawPart fallback; two sides, eight headings. Isolated tissue study, not whole-creature Lab or field acceptance.',creatorAcceptance:false},null,2));
  }finally{await browser?.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
