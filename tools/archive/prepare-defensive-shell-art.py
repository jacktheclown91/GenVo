"""Map retained imagegen scute paint through the original shell alpha masks and palette."""
from pathlib import Path
from PIL import Image
import json,base64,hashlib
R=Path(__file__).resolve().parents[1];A=R/'assets/art';D=A/'production-review/defensive-shell-v1';baseline=(D/'shell-back-baseline.json').read_bytes();source=json.loads(baseline);catalog=json.loads((A/'catalog.json').read_text());entry=next(p for p in catalog['parts'] if p['partId']=='shell-back');current=(A/entry['path']).read_bytes();assert hashlib.sha256(current).hexdigest()==entry['checksumSha256'];assert json.loads(current)['version'] in [source['version'],source['version']+1]
master=D/'shell-master.png';im=Image.open(master).convert('RGBA');alpha=im.getchannel('A').point(lambda a:255 if a>=128 else 0);im.putalpha(alpha);im=im.crop(alpha.getbbox()).resize((21,16),Image.Resampling.NEAREST);base=Image.new('RGBA',(32,32));base.paste(im,(6,8));skin=source['regions'][0]['colors'];protected=[tuple(c) for r in source['regions'] if r['protected'] for c in r['colors']]
for frame in source['frames']:
 art=base.rotate((2-frame['facing'])*45,resample=Image.Resampling.NEAREST,center=(16,16));shift=frame['index'];dx=round(__import__('math').cos((frame['facing']-2)*__import__('math').pi/4)*shift);dy=round(__import__('math').sin((frame['facing']-2)*__import__('math').pi/4)*shift);old=base64.b64decode(frame['rgbaBase64']);pixels=art.load();points=[(x,y,pixels[x,y][:3]) for y in range(32) for x in range(32) if pixels[x,y][3]];out=bytearray(old)
 for k in range(1024):
  i=k*4
  if not old[i+3] or tuple(old[i:i+3]) in protected:continue
  x=k%32-dx;y=k//32-dy
  rgb=pixels[x,y][:3] if 0<=x<32 and 0<=y<32 and pixels[x,y][3] else min(points,key=lambda p:(p[0]-x)**2+(p[1]-y)**2)[2]
  out[i:i+3]=bytes(min(skin,key=lambda c:sum((a-b)**2 for a,b in zip(c,rgb))))
 frame['rgbaBase64']=base64.b64encode(out).decode()
source['version']+=1;source['authorship']='Built-in imagegen overhead organic scute paint, mechanically sampled to original native shell masks and indexed skin palette. All alpha, root, metadata and protected-role definitions retained. Creator acceptance pending.';source['shellPaint']={'revision':'native-shell-scutes/1','masterSha256':hashlib.sha256(master.read_bytes()).hexdigest(),'previousSourceSha256':hashlib.sha256(baseline).hexdigest(),'scope':'Paint only. Original per-frame alpha, anatomy, mounts and timing retained.'};raw=json.dumps(source,separators=(',',':')).encode();(A/entry['path']).write_bytes(raw);entry['checksumSha256']=hashlib.sha256(raw).hexdigest();entry['status']='native-shell-scutes-review';f=next(f for f in source['frames'] if f['facing']==2 and f['index']==0);Image.frombytes('RGBA',(32,32),base64.b64decode(f['rgbaBase64'])).save(A/entry['png']);(A/'catalog.json').write_text(json.dumps(catalog,indent=2)+'\n',encoding='utf-8');print('Prepared 16 shell scute frames through unchanged original masks')
