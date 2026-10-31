#!/usr/bin/env python3
"""Additive 32x32 flank/spur candidate art. All anatomy is painted as explicit pixel
shapes. Does not edit pre-existing creature art or biological registry definitions.
"""
from PIL import Image,ImageDraw
from pathlib import Path
import base64,hashlib,json,math
R=Path(__file__).resolve().parents[1]; D=R/'assets/art/parts'; D.mkdir(exist_ok=True,parents=True)
CAT=R/'assets/art/catalog.json'; catalog=json.loads(CAT.read_text()); installed={p['partId'] for p in catalog['parts']}
FLANK=['armor-plate','venom-gland','storage-sac','gliding-membrane','gill-slits','spine-cluster','brood-pouch']
SPUR=['claw','barb','hook-spur','dew-claw','heel-spike','sensory-bristle']
assert not installed.intersection(FLANK+SPUR),'Cannot overwrite existing reviewed artwork'
C={ 'O':'#172a2c','D':'#34554e','B':'#699a81','L':'#a4c7a5','H':'#dde5c3',
 'V':'#234e63','W':'#67c7d0','U':'#e3c77d','R':'#c18865','I':'#f7e8ba','G':'#a5cf64',
 'N':'#a57685','T':'#f1b2a3'}

def col(k):return C[k]
def poly(d,pts,k):d.polygon(pts,fill=col(k))
def ln(d,pts,k,w=1):d.line(pts,fill=col(k),width=w,joint='curve')
def box(d,coords,k):d.rectangle(coords,fill=col(k))
def el(d,coords,k):d.ellipse(coords,fill=col(k))

def flank(part,phase):
 im=Image.new('RGBA',(32,32),tuple(bytes.fromhex(C['O'][1:]))+(0,));d=ImageDraw.Draw(im);dy=(1 if phase else 0)
 if part=='armor-plate':
  poly(d,[(10,13),(14,8),(22,9),(26,14),(24,21),(17,24),(10,20)],'O')
  poly(d,[(11,14),(15,10),(21,11),(24,15),(22,20),(17,22),(12,19)],'D')
  poly(d,[(15,12),(21,12),(23,16),(19,19),(13,18)],'B')
  ln(d,[(11,15),(14,11),(19,10)],'L');ln(d,[(17,12),(19,16),(18,20)],'O')
  ln(d,[(20,13),(22,15)],'H')
 elif part=='venom-gland':
  ln(d,[(12,18),(9,17),(7,14)],'O',3);ln(d,[(12,17),(9,16),(7,14)],'G')
  el(d,(11,9-dy,25,24-dy),'O');el(d,(13,10-dy,23,22-dy),'D')
  el(d,(14,11-dy,21,20-dy),'G');el(d,(15,12-dy,18,15-dy),'I')
  box(d,(21,17-dy,22,18-dy),'W');ln(d,[(10,20),(8,22),(7,23)],'V',2)
 elif part=='storage-sac':
  poly(d,[(10,12),(17,9-dy),(25,13),(26,21),(21,26),(13,24),(9,20)],'O')
  poly(d,[(11,14),(17,11-dy),(23,14),(24,21),(20,24),(14,22)],'D')
  poly(d,[(14,15),(19,13-dy),(22,16),(21,21),(16,22)],'B')
  ln(d,[(10,14),(16,13),(24,15)],'H',2);box(d,(16,12,18,15),'U')
  ln(d,[(13,20),(18,23),(21,22)],'L')
 elif part=='gliding-membrane':
  poly(d,[(7,18),(13,10-dy),(17,13),(25,8-dy),(25,24),(20,20),(15,24)],'O')
  poly(d,[(9,18),(13,12-dy),(17,15),(23,11-dy),(23,22),(20,18),(15,22)],'V')
  ln(d,[(8,18),(14,18),(23,10-dy)],'W');ln(d,[(14,18),(16,22)],'W')
  ln(d,[(13,12-dy),(14,18),(23,22)],'B');box(d,(21,12-dy,22,15-dy),'I')
 elif part=='gill-slits':
  poly(d,[(10,10),(21,9),(25,14),(24,23),(15,25),(9,19)],'O')
  poly(d,[(11,12),(21,11),(23,15),(22,22),(15,23),(11,19)],'B')
  for x,offset in [(13,0),(17,1),(21,0)]:
   ln(d,[(x,13+offset+dy),(x-1,17+offset+dy),(x,21+offset+dy)],'V',2)
   box(d,(x-1,13+offset+dy,x-1,15+offset+dy),'W')
  ln(d,[(11,12),(17,11),(21,12)],'H')
 elif part=='spine-cluster':
  poly(d,[(9,21),(11,14),(22,13),(26,19),(22,23),(12,24)],'O')
  poly(d,[(11,20),(13,16),(21,15),(24,20),(21,22),(13,22)],'D')
  for x,tip in [(12,7),(17,5-dy),(23,8)]:
   poly(d,[(x-3,17),(x,tip-2),(x+3,17)],'O')
   poly(d,[(x-1,16),(x,tip),(x+1,16)],'I')
  ln(d,[(12,21),(22,20)],'L')
 elif part=='brood-pouch':
  poly(d,[(10,11),(20,9),(25,14),(25,23),(19,26),(12,23),(9,17)],'O')
  poly(d,[(11,13),(20,11),(23,15),(23,22),(19,24),(13,21),(11,17)],'D')
  el(d,(13,15,21,23),'B');el(d,(15,17,19,20),'N')
  ln(d,[(12,13),(17,14+dy),(23,14)],'H',2)
  for x in [14,17,20]:box(d,(x,12,x,13),'U')
  box(d,(18,21,19,21),'L')
 return im

def spur(part,phase):
 im=Image.new('RGBA',(32,32),tuple(bytes.fromhex(C['O'][1:]))+(0,));d=ImageDraw.Draw(im);dy=(1 if phase else 0)
 # Spikes are mounted at the foot/spur joint. A robust lower socket collar remains at pivot.
 poly(d,[(10,16),(13,13),(20,14),(22,18),(18,21),(12,20)],'O')
 poly(d,[(12,16),(14,15),(20,16),(20,18),(17,19),(13,18)],'D')
 if part=='claw':
  poly(d,[(17,15),(24,10-dy),(29,9-dy),(27,13-dy),(24,16),(23,21),(19,24),(20,19)],'O')
  poly(d,[(19,16),(24,11-dy),(27,10-dy),(25,13-dy),(23,15),(22,20),(20,22)],'I')
  ln(d,[(21,19),(24,15),(27,11-dy)],'H')
 elif part=='barb':
  poly(d,[(16,15),(20,6-dy),(25,17)],'O');poly(d,[(18,15),(20,8-dy),(23,16)],'I')
  box(d,(19,13,20,17),'L')
 elif part=='hook-spur':
  poly(d,[(17,15),(21,9-dy),(27,7-dy),(29,12-dy),(27,16),(24,13),(23,17),(20,21)],'O')
  poly(d,[(19,15),(22,10-dy),(27,9-dy),(27,13-dy),(25,12),(22,17)],'I')
  ln(d,[(21,18),(23,13),(27,10-dy)],'H')
 elif part=='dew-claw':
  for x,extent in [(18,25),(21,27)]:
   poly(d,[(x-2,16),(x+1,15),(extent,12-dy),(extent-1,17),(x+1,20)],'O')
   ln(d,[(x,17),(extent-1,14-dy)],'I',2)
  box(d,(14,16,17,17),'B')
 elif part=='heel-spike':
  poly(d,[(15,15),(8,7-dy),(6,8-dy),(10,16),(9,20),(17,21)],'O')
  poly(d,[(14,16),(8,9-dy),(9,13),(12,17)],'I')
  poly(d,[(17,16),(24,12),(25,14),(21,19)],'O');ln(d,[(18,17),(24,14)],'L')
 elif part=='sensory-bristle':
  for x,top in [(12,7-dy),(17,5),(22,9-dy)]:
   ln(d,[(16,17),(x,top+1)],'O',2)
   ln(d,[(16,16),(x,top+1)],'L')
   el(d,(x-1,top-1,x+1,top+1),'W')
   d.point((x,top),fill=col('I'))
  box(d,(14,15,17,17),'B')
 return im

SKIN=['O','D','B','L','H']; skin={tuple(bytes.fromhex(C[k][1:])) for k in SKIN}; tiles=[]
for name in FLANK+SPUR:
 frames=[];found=set()
 for face in range(8):
  for frame in range(2):
   im=flank(name,frame) if name in FLANK else spur(name,frame)
   if face!=2:im=im.rotate((2-face)*45,resample=Image.Resampling.NEAREST,center=(16,16))
   found.update(px[:3] for px in im.getdata() if px[3]);frames.append({'state':'idle','facing':face,'index':frame,'durationMs':330 if frame==0 else 280,'rgbaBase64':base64.b64encode(im.tobytes()).decode()})
   if face==2 and frame==0:tiles.append((name,im));im.save(D/f'{name}.png')
 extras=sorted(found-skin) or [tuple(bytes.fromhex(C['W'][1:]))]
 spec={'schema':'genvo.part-art-source/1','partId':name,'version':1,'width':32,'height':32,'displayScale':1,'rootAnchorPx':[16,16],
       'regions':[{'id':'skin','protected':False,'colors':[list(bytes.fromhex(C[k][1:])) for k in SKIN]},
                  {'id':'protected-detail','protected':True,'colors':[list(c) for c in extras]}],
       'frames':frames,'authorship':'AI-assisted individually composed 32x32 anatomical pixel-art review candidate, following creator-directed modular pixel rules; not visually approved'}
 encoded=json.dumps(spec,separators=(',',':'));(D/f'{name}.json').write_text(encoded)
 catalog['parts'].append({'partId':name,'path':f'./parts/{name}.json','png':f'./parts/{name}.png',
  'checksumSha256':hashlib.sha256(encoded.encode()).hexdigest(),'status':'development-review'})
CAT.write_text(json.dumps(catalog,indent=2)+'\n')
cols=4;tw=196;th=194;sheet=Image.new('RGB',(cols*tw,math.ceil(len(tiles)/cols)*th),'#273c36');d=ImageDraw.Draw(sheet)
for i,(name,im) in enumerate(tiles):
 x=(i%cols)*tw;y=(i//cols)*th;tile=Image.new('RGBA',(32,32),'#4c6257');tile.alpha_composite(im)
 sheet.paste(tile.resize((160,160),Image.Resampling.NEAREST).convert('RGB'),(x+18,y+5));d.text((x+9,y+171),name.replace('-',' '),fill='#f5e9d0')
ref=R/'references/generated-native-parts/flank-spur-wave-v169.png';ref.parent.mkdir(exist_ok=True,parents=True);sheet.save(ref)
print(f'Added {len(tiles)} individual anatomical candidates, {len(tiles)*16} frames; reference {ref}')
