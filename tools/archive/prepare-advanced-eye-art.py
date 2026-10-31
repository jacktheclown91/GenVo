from pathlib import Path
from PIL import Image
import json,base64,hashlib
R=Path(__file__).resolve().parents[1];A=R/'assets/art';D=A/'production-review/advanced-eyes-v1';catalog=json.loads((A/'catalog.json').read_text())
for id,name,size,offset in [('telescopic-eye','telescopic',(18,18),(7,7)),('raptor-eye','raptor',(20,14),(6,9))]:
 baseline=(D/(id+'-baseline.json')).read_bytes();source=json.loads(baseline);entry=next(p for p in catalog['parts'] if p['partId']==id)
 master=D/(name+'-master.png');im=Image.open(master).convert('RGBA');skin=source['regions'][0]['colors'];fixed=source['regions'][1]['colors'];bases=[]
 for state in [0,1]:
  half=im.crop((state*im.width//2,0,(state+1)*im.width//2,im.height));alpha=half.getchannel('A').point(lambda a:255 if a>=128 else 0);half.putalpha(alpha);box=alpha.getbbox();assert box;half=half.crop(box).resize(size,Image.Resampling.NEAREST)
  pixels=[]
  for r,g,b,a in half.get_flattened_data():
   protected=(r-g>20 and r-b>30) or (r>225 and g>210 and b>170) or (max(r,g,b)<45 and max(r,g,b)-min(r,g,b)<12)
   palette=fixed if protected else skin;color=min(palette,key=lambda c:sum((v-q)**2 for v,q in zip(c,(r,g,b)))) if a else skin[0];pixels.append((*color,a))
  half.putdata(pixels);base=Image.new('RGBA',(32,32),tuple(skin[0])+(0,));base.paste(half,offset);bases.append(base);base.save(D/(name+('-open-native.png' if state==0 else '-blink-native.png')))
 for f in source['frames']:
  art=bases[f['index']].rotate((2-f['facing'])*45,resample=Image.Resampling.NEAREST,center=(16,16),fillcolor=tuple(skin[0])+(0,));assert art.getpixel((16,16))[3]==255,id+' root';f['rgbaBase64']=base64.b64encode(art.tobytes()).decode()
 source['version']+=1;source['authorship']='Built-in imagegen paired open/blink masters, mechanical native32 preparation and original indexed palette roles. Original sockets, display scale, frame timing and biological authorities retained. Creator acceptance pending.';source['nativeAdvancedEyeArt']={'revision':'native-advanced-eyes/1','masterSha256':hashlib.sha256(master.read_bytes()).hexdigest(),'previousSourceSha256':hashlib.sha256(baseline).hexdigest()};raw=json.dumps(source,separators=(',',':')).encode();(A/entry['path']).write_bytes(raw);entry['checksumSha256']=hashlib.sha256(raw).hexdigest();entry['status']='native-advanced-eye-review';bases[0].save(A/entry['png']);print(id,'native open/blink prepared')
(A/'catalog.json').write_bytes((json.dumps(catalog,indent=2)+'\n').encode())
