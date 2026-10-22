#!/usr/bin/env python3
"""Additive 32x32 native art for advanced eyes (anatomical-vision/1): telescopic,
raptor, panoramic and sentinel eyes. Painted as explicit pixel shapes in the
established eye style (east-facing base, rotated per facing; frame 1 blinks).
Refuses to overwrite reviewed art and does not edit biological definitions.
"""
from PIL import Image,ImageDraw
from pathlib import Path
import base64,hashlib,json
R=Path(__file__).resolve().parents[1]; D=R/'assets/art/parts'; D.mkdir(exist_ok=True,parents=True)
CAT=R/'assets/art/catalog.json'; catalog=json.loads(CAT.read_text()); installed={p['partId'] for p in catalog['parts']}
PARTS=['telescopic-eye','raptor-eye','panoramic-eye','sentinel-eye']
assert not installed.intersection(PARTS),'Cannot overwrite existing reviewed artwork'
C={'O':'#172a2c','D':'#34554e','B':'#699a81','L':'#a4c7a5','H':'#dde5c3',
   'K':'#000000','N':'#101d20','G':'#d9a43a','Y':'#f0b832','W':'#fff3c8','T':'#2f6b6a','F':'#a8e6d8','P':'#c6f0e2','R':'#2b1a24'}
def col(k):return C[k]
def eye(part,blink):
 im=Image.new('RGBA',(32,32),tuple(bytes.fromhex(C['O'][1:]))+(0,));d=ImageDraw.Draw(im)
 if part=='telescopic-eye':
  # A deep tubular lens pushed forward from the socket, gold iris, heavy brow.
  d.ellipse((9,11,23,21),fill=col('O'));d.ellipse((10,12,22,20),fill=col('D'));d.rectangle((17,13,24,19),fill=col('B'))
  if blink:d.line([(10,16),(24,16)],fill=col('L'),width=2)
  else:
   d.ellipse((17,13,24,19),fill=col('G'));d.ellipse((19,14,23,18),fill=col('K'));d.point((19,14),fill=col('W'))
  d.line([(10,11),(21,10),(24,12)],fill=col('R'),width=2)
 elif part=='raptor-eye':
  # A large forward gold eye under a sharp brow ridge.
  d.ellipse((7,9,25,23),fill=col('O'));d.ellipse((8,10,24,22),fill=col('B'))
  if blink:d.line([(8,16),(24,16)],fill=col('H'),width=3)
  else:
   d.ellipse((11,11,23,21),fill=col('Y'));d.ellipse((15,13,21,19),fill=col('K'));d.point((14,13),fill=col('W'));d.point((15,12),fill=col('W'))
  d.line([(7,10),(17,7),(26,10)],fill=col('R'),width=2)
 elif part=='panoramic-eye':
  # A broad faceted band wrapping the side of the head.
  d.ellipse((5,11,27,21),fill=col('O'));d.ellipse((6,12,26,20),fill=col('T'))
  if blink:d.line([(6,16),(26,16)],fill=col('L'),width=2)
  else:
   for x in range(8,26,3):
    for y in (14,17):d.rectangle((x,y,x+1,y+1),fill=col('F'))
   d.line([(7,19),(25,19)],fill=col('N'))
 elif part=='sentinel-eye':
  # A raised faceted dome on a short stalk.
  d.line([(12,17),(16,22)],fill=col('D'),width=3)
  d.ellipse((12,6,26,18),fill=col('O'));d.ellipse((13,7,25,17),fill=col('T'))
  if blink:d.line([(13,12),(25,12)],fill=col('L'),width=2)
  else:
   for x,y in [(15,9),(18,9),(21,9),(16,12),(19,12),(22,12),(18,15)]:d.rectangle((x,y,x+1,y+1),fill=col('F'))
   d.point((16,8),fill=col('P'));d.line([(14,16),(24,16)],fill=col('N'))
 return im
SKIN=['O','D','B','L','H']; skin={tuple(bytes.fromhex(C[k][1:])) for k in SKIN}
for name in PARTS:
 frames=[];found=set()
 for face in range(8):
  for frame in range(2):
   im=eye(name,frame)
   if face!=2:im=im.rotate((2-face)*45,resample=Image.Resampling.NEAREST,center=(16,16),fillcolor=tuple(bytes.fromhex(C['O'][1:]))+(0,))
   found.update(px[:3] for px in im.get_flattened_data() if px[3]);frames.append({'state':'idle','facing':face,'index':frame,'durationMs':850 if frame==0 else 125,'rgbaBase64':base64.b64encode(im.tobytes()).decode()})
   if face==2 and frame==0:im.save(D/f'{name}.png')
 extras=sorted(found-skin)
 spec={'schema':'genvo.part-art-source/1','partId':name,'version':1,'width':32,'height':32,'displayScale':.5,'rootAnchorPx':[16,16],
       'regions':[{'id':'skin','protected':False,'colors':[list(bytes.fromhex(C[k][1:])) for k in SKIN]},{'id':'protected-detail','protected':True,'colors':[list(c) for c in extras]}],
       'frames':frames,'authorship':'AI-assisted individually composed 32x32 anatomical pixel-art review candidate, following creator-directed modular pixel rules; not visually approved'}
 encoded=json.dumps(spec,separators=(',',':'));(D/f'{name}.json').write_text(encoded)
 catalog['parts'].append({'partId':name,'path':f'./parts/{name}.json','png':f'./parts/{name}.png','checksumSha256':hashlib.sha256(encoded.encode()).hexdigest(),'status':'development-review'})
CAT.write_text(json.dumps(catalog,indent=2)+'\n')
print(f'Added {len(PARTS)} advanced-vision anatomical candidate(s), {len(PARTS)*16} frames')
