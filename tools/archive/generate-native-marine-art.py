#!/usr/bin/env python3
"""Additive 32x32 native art for marine anatomy (salt gland). Painted as explicit
pixel shapes in the established flank style. Refuses to overwrite reviewed art and
does not edit biological registry definitions.
"""
from PIL import Image,ImageDraw
from pathlib import Path
import base64,hashlib,json
R=Path(__file__).resolve().parents[1]; D=R/'assets/art/parts'; D.mkdir(exist_ok=True,parents=True)
CAT=R/'assets/art/catalog.json'; catalog=json.loads(CAT.read_text()); installed={p['partId'] for p in catalog['parts']}
PARTS=['salt-gland']
assert not installed.intersection(PARTS),'Cannot overwrite existing reviewed artwork'
C={'O':'#172a2c','D':'#34554e','B':'#699a81','L':'#a4c7a5','H':'#dde5c3','V':'#234e63','W':'#67c7d0','I':'#f2f5ee','S':'#c9dde0'}
def col(k):return C[k]
def flank(part,phase):
 im=Image.new('RGBA',(32,32),tuple(bytes.fromhex(C['O'][1:]))+(0,));d=ImageDraw.Draw(im);dy=1 if phase else 0
 if part=='salt-gland':
  # A paired glandular swelling behind the gills; salt crystals bead at its duct.
  d.ellipse((10,10-dy,24,23-dy),fill=col('O'));d.ellipse((12,11-dy,22,21-dy),fill=col('D'))
  d.ellipse((14,12-dy,20,18-dy),fill=col('B'));d.line([(13,14-dy),(16,12-dy),(19,12-dy)],fill=col('L'))
  d.line([(21,17-dy),(24,19),(26,21)],fill=col('V'),width=2)
  for x,y in [(25,22),(27,20),(26,24)]:
   d.point((x,y),fill=col('I'));d.point((x+1,y),fill=col('S'))
  d.point((17,15-dy),fill=col('W'));d.point((18,16-dy),fill=col('W'))
 return im
SKIN=['O','D','B','L','H']; skin={tuple(bytes.fromhex(C[k][1:])) for k in SKIN}
for name in PARTS:
 frames=[];found=set()
 for face in range(8):
  for frame in range(2):
   im=flank(name,frame)
   if face!=2:im=im.rotate((2-face)*45,resample=Image.Resampling.NEAREST,center=(16,16),fillcolor=tuple(bytes.fromhex(C['O'][1:]))+(0,))
   found.update(px[:3] for px in im.get_flattened_data() if px[3]);frames.append({'state':'idle','facing':face,'index':frame,'durationMs':330 if frame==0 else 280,'rgbaBase64':base64.b64encode(im.tobytes()).decode()})
   if face==2 and frame==0:im.save(D/f'{name}.png')
 extras=sorted(found-skin) or [tuple(bytes.fromhex(C['W'][1:]))]
 spec={'schema':'genvo.part-art-source/1','partId':name,'version':1,'width':32,'height':32,'displayScale':1,'rootAnchorPx':[16,16],
       'regions':[{'id':'skin','protected':False,'colors':[list(bytes.fromhex(C[k][1:])) for k in SKIN]},{'id':'protected-detail','protected':True,'colors':[list(c) for c in extras]}],
       'frames':frames,'authorship':'AI-assisted individually composed 32x32 anatomical pixel-art review candidate, following creator-directed modular pixel rules; not visually approved'}
 encoded=json.dumps(spec,separators=(',',':'));(D/f'{name}.json').write_text(encoded)
 catalog['parts'].append({'partId':name,'path':f'./parts/{name}.json','png':f'./parts/{name}.png','checksumSha256':hashlib.sha256(encoded.encode()).hexdigest(),'status':'development-review'})
CAT.write_text(json.dumps(catalog,indent=2)+'\n')
print(f'Added {len(PARTS)} marine anatomical candidate(s), {len(PARTS)*16} frames')
