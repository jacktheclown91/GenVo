"""Prepare retained anatomical masters through GenVo's native source/indexed codec.
Climber: existing canonical two-bone atlas layout, new paint registration only.
Hooks and proto-wings: preserve their original root, socket and frame contracts.
"""
from pathlib import Path
from PIL import Image
import base64,hashlib,json
R=Path(__file__).resolve().parents[1];A=R/'assets/art';D=A/'production-review/climbing-wing-v1';catalog=json.loads((A/'catalog.json').read_text())
def cut(im):
 im=im.convert('RGBA');mask=im.getchannel('A').point(lambda a:255 if a>=128 else 0);im.putalpha(mask);box=mask.getbbox();assert box;return im.crop(box)
def mapped(im,source,claws):
 skin=source['regions'][0]['colors'];protected=source['regions'][1]['colors'];pixels=[]
 for r,g,b,a in im.get_flattened_data():
  palette=protected if claws and r-b>25 and r-g>5 else skin
  color=min(palette,key=lambda c:sum((x-y)**2 for x,y in zip(c,(r,g,b)))) if a else skin[0];pixels.append((*color,a))
 im.putdata(pixels);return im
for part in ['climber-leg','hook-pad','proto-wing']:
 entry=next(p for p in catalog['parts'] if p['partId']==part);p=A/entry['path'];current=p.read_bytes();assert hashlib.sha256(current).hexdigest()==entry['checksumSha256'];raw=(D/f'{part}-baseline.json').read_bytes();source=json.loads(raw);installed=json.loads(current);assert installed['version'] in [source['version'],source['version']+1],'Refusing to overwrite a newer artwork revision'
 master=D/f'{part}-master.png';im=Image.open(master).convert('RGBA');fill=tuple(source['regions'][0]['colors'][0])+(0,);base=Image.new('RGBA',(32,32),fill)
 if part=='climber-leg':
  for row in range(2):
   strip=mapped(cut(im.crop((0,row*im.height//2,im.width,(row+1)*im.height//2))).resize((32,14),Image.Resampling.NEAREST),source,True);base.paste(strip,(0,row*16+1))
  source['rig']={'kind':'two-bone','upper':{'rect':[0,0,32,16],'start':[4,8],'end':[27,8]},'lower':{'rect':[0,16,32,16],'start':[4,24],'end':[27,24]},'jointSurface':{'rect':[24,3,8,11],'anchor':[28,8]},'hipSurface':{'rect':[0,1,10,14],'anchor':[4,8]}}
  quiet=Image.new('RGBA',(32,32),fill)
  for row in range(2):
   strip=base.crop((0,row*16,32,(row+1)*16)).transform((32,16),Image.Transform.AFFINE,(1,0,0,0,1.12,-.96),resample=Image.Resampling.NEAREST,fillcolor=fill);quiet.paste(strip,(0,row*16))
  for f in source['frames']:f['rgbaBase64']=base64.b64encode((base if f['index']==0 else quiet).tobytes()).decode()
 else:
  size=(24,18) if part=='hook-pad' else (14,24);patch=mapped(cut(im).resize(size,Image.Resampling.NEAREST),source,part=='hook-pad');base.paste(patch,((32-size[0])//2 if part=='hook-pad' else 4,(32-size[1])//2))
  quiet=base.transform((32,32),Image.Transform.AFFINE,(1,0,0,0,1.10,-1.6),resample=Image.Resampling.NEAREST,fillcolor=fill)
  for f in source['frames']:
   art=(base if f['index']==0 else quiet).rotate((2-f['facing'])*45,resample=Image.Resampling.NEAREST,center=(16,16),fillcolor=fill);f['rgbaBase64']=base64.b64encode(art.tobytes()).decode()
 source['version']+=1;source['authorship']='Built-in imagegen native anatomical component candidate; mechanical crop/nearest/alpha-cutoff and original indexed material mapping. Root, display scale, palette roles, frame keys and timing retained. New climber two-bone paint registration follows the existing canonical limb renderer; no joint/gait/biological authority changed. Creator approval pending.'
 source['climbingWingArt']={'revision':'native-climbing-wing/1','previousSourceSha256':hashlib.sha256(raw).hexdigest(),'masterSha256':hashlib.sha256(master.read_bytes()).hexdigest(),'scope':'New component paint. Exact original root/display/palette/frame contracts. Climber previously had no rig; now uses the established native two-bone atlas without moving any assembly joint.'}
 raw=json.dumps(source,separators=(',',':')).encode();p.write_bytes(raw);entry['checksumSha256']=hashlib.sha256(raw).hexdigest();entry['status']='native-climbing-wing-review';base.save(A/entry['png']);base.save(D/f'{part}-native.png');quiet.save(D/f'{part}-lifted-native.png');print('Prepared',part)
(A/'catalog.json').write_bytes((json.dumps(catalog,indent=2)+'\n').encode())
