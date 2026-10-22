"""Prepare three imagegen external-tissue paintings for existing native maternal parts.
Native32 and all mounting/frame/palette contracts are retained. No biological event is drawn.
"""
from PIL import Image
from pathlib import Path
import base64,hashlib,json
R=Path(__file__).resolve().parents[1];A=R/'assets/art';D=A/'production-review/maternal-surfaces-v1';catalog=json.loads((A/'catalog.json').read_text());ids=['egg-chamber','live-womb','brood-pouch']
for part in ids:
 entry=next(p for p in catalog['parts'] if p['partId']==part);path=A/entry['path'];raw=path.read_bytes();assert hashlib.sha256(raw).hexdigest()==entry['checksumSha256'];source=json.loads(raw)
 assert 'maternalSurface' not in source,'Refusing to overwrite already installed maternal surface'
 master=D/f'{part}-master.png';im=Image.open(master).convert('RGBA');alpha=im.getchannel('A').point(lambda a:255 if a>=128 else 0);im.putalpha(alpha);box=alpha.getbbox();assert box
 # Match the existing local footprint, centered around the unchanged native anchor.
 sizes={'egg-chamber':(20,18),'live-womb':(20,17),'brood-pouch':(18,14)};w,h=sizes[part];im=im.crop(box).resize((w,h),Image.Resampling.NEAREST)
 skin=source['regions'][0]['colors'];light=lambda c:c[0]*.2126+c[1]*.7152+c[2]*.0722
 im.putdata([(*min(skin,key=lambda c:abs(light(c)-light(p[:3]))),255) if p[3] else (*skin[0],0) for p in im.get_flattened_data()])
 base=Image.new('RGBA',(32,32),tuple(skin[0])+(0,));base.paste(im,((32-w)//2,(32-h)//2))
 # Root-centered rest-frame compression preserves the existing two-frame idle contract;
 # it never depicts pregnancy, conception, laying, nursing or birth.
 quiet=base.transform((32,32),Image.Transform.AFFINE,(1,0,0,0,1.12,-1.92),resample=Image.Resampling.NEAREST,fillcolor=tuple(skin[0])+(0,))
 for f in source['frames']:
  art=(base if f['index']==0 else quiet).rotate((2-f['facing'])*45,resample=Image.Resampling.NEAREST,center=(16,16),fillcolor=tuple(skin[0])+(0,));f['rgbaBase64']=base64.b64encode(art.tobytes()).decode()
 source['version']+=1;source['authorship']='Built-in imagegen external maternal tissue candidate; alpha cutoff, crop, nearest native32 sampling, original indexed skin palette and root-centered rest-frame preparation. Not creator approved.'
 source['maternalSurface']={'revision':'external-maternal-tissue/1','previousSourceSha256':entry['checksumSha256'],'masterSha256':hashlib.sha256(master.read_bytes()).hexdigest(),'scope':'Opaque skin-covered capacity and empty pouch; no visible eggs, embryos or babies; exact original mount, rig, palette regions, frame keys and durations.'}
 encoded=json.dumps(source,separators=(',',':')).encode();path.write_bytes(encoded);entry['checksumSha256']=hashlib.sha256(encoded).hexdigest();entry['status']='external-maternal-tissue-review';base.save(A/entry['png']);base.save(D/f'{part}-native.png');print('Prepared',part)
(A/'catalog.json').write_bytes((json.dumps(catalog,indent=2)+'\n').encode())
