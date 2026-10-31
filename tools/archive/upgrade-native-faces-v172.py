#!/usr/bin/env python3
"""GenVo v1.72 development review: hand-composed 32x32 eye/mouth variants.

Updates existing editable source parts only, preserving gameplay body-part IDs, pivots,
part definitions, and all original human reference files. Idle index 1 means blink
for eyes or an open/active mouth for feeding anatomy. Not a biology rule.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import base64, hashlib, json, math
ROOT=Path(__file__).resolve().parents[1]
PARTS=ROOT/'assets/art/parts'
MANIFEST=ROOT/'assets/art/catalog.json'
COL={
 'ink':(23,42,44),'shadow':(52,85,78),'body':(105,154,129),
 'light':(164,199,165),'glint':(221,229,195),
 'ivory':(244,238,216),'teeth':(237,220,179),'iris':(49,182,209),
 'iris2':(117,227,239),'pupil':(24,44,60),'tissue':(223,120,89),
 'gold':(233,185,102),'violet':(182,164,221),'aqua':(78,191,130),
 'deep':(32,77,84),'white':(196,227,235), 'black':(0,0,0),
}
SKIN=['ink','shadow','body','light','glint']
EYES=['simple-eye','wide-field-eye','hunter-eye','tracker-eye','stalk-eye','compound-eye','glow-eye','display-eye']
MOUTHS=['grazing-mouth','tearing-jaw','crushing-jaw','kernel-beak','reed-sieve-mouth','filter-mouth','sucker-mouth','gape-mouth']
def canvas():return Image.new('RGBA',(32,32),(0,0,0,0))
def prim(im):
 d=ImageDraw.Draw(im)
 def poly(pts,c):d.polygon(pts,fill=(*COL[c],255))
 def ell(box,c):d.ellipse(box,fill=(*COL[c],255))
 def rect(box,c):d.rectangle(box,fill=(*COL[c],255))
 def line(pts,c,w=1):d.line(pts,fill=(*COL[c],255),width=w,joint='curve')
 return poly,ell,rect,line

def eye_art(part,closed):
 im=canvas();P,E,R,L=prim(im)
 # Outer anatomy varies across lineages. Inner aperture is deliberately small
 # enough to read at 1x while maintaining a 1-2 pixel material outline.
 if part=='stalk-eye':
  P([(13,27),(12,22),(14,17),(12,14),(14,12),(19,13),(17,18),(16,22),(18,26)],'ink')
  L([(14,25),(14,21),(16,17)],'body',2);L([(15,24),(15,21)],'light',1)
  E((7,5,26,22),'ink');E((8,6,25,21),'shadow');E((9,7,24,20),'body')
  R((10,8,21,9),'glint');E((10,9,23,19),'ivory')
  if closed:L([(10,14),(13,15),(19,15),(23,13)],'shadow',3);L([(11,12),(18,12)],'light')
  else:E((15,11,21,18),'iris');E((17,12,20,17),'pupil');R((17,11,18,12),'white')
  R((13,25,16,26),'tissue')
 elif part=='compound-eye':
  P([(10,6),(21,7),(27,11),(26,19),(22,24),(11,23),(5,17),(6,11)],'ink')
  P([(10,8),(21,9),(24,12),(24,19),(20,22),(11,21),(7,16),(8,12)],'shadow')
  P([(11,9),(20,10),(23,13),(22,19),(19,21),(11,20),(9,16),(10,12)],'aqua')
  for x,y in [(12,12),(16,11),(20,13),(12,16),(16,16),(20,18)]:
   E((x,y,x+2,y+2),'deep');R((x,y,x+1,y),'iris2')
  if closed:
   P([(9,12),(20,11),(23,13),(22,18),(17,21),(11,18)],'shadow')
   L([(11,15),(16,16),(21,15)],'glint')
  else:L([(10,10),(15,9),(20,10)],'light',2)
 elif part=='glow-eye':
  E((6,7,26,25),'deep');E((8,7,25,23),'iris');E((10,9,24,21),'iris2')
  E((12,10,23,20),'white')
  if closed:R((11,14,23,17),'deep');L([(12,15),(21,15)],'iris2',2)
  else:E((16,12,21,19),'pupil');R((17,12,18,13),'ivory')
  R((10,9,14,10),'glint');R((9,19,11,21),'iris2')
 elif part=='display-eye':
  P([(7,11),(11,5),(21,7),(27,13),(24,22),(18,25),(10,21)],'ink')
  P([(9,11),(12,7),(21,9),(25,14),(22,21),(17,22),(11,20)],'body')
  R((7,10,11,12),'tissue');R((21,9,25,12),'gold')
  E((11,10,24,21),'ivory')
  if closed:L([(11,15),(17,16),(23,15)],'shadow',3)
  else:E((16,12,22,19),'violet');E((18,13,21,17),'pupil');R((18,12,19,13),'white')
  L([(10,9),(14,7)],'glint',2)
 else:
  broad=part=='wide-field-eye';hunter=part=='hunter-eye';tracker=part=='tracker-eye'
  if broad: outline=[(5,14),(9,8),(19,7),(26,11),(28,16),(23,23),(11,24),(6,20)]
  elif hunter:outline=[(7,10),(13,6),(24,8),(27,14),(25,21),(17,24),(8,20)]
  elif tracker:outline=[(6,13),(10,8),(19,6),(26,11),(27,18),(21,23),(12,24),(7,20)]
  else:outline=[(9,11),(14,8),(22,9),(26,13),(25,20),(19,23),(11,20),(7,16)]
  P(outline,'ink')
  E((9 if broad else 10,9,25,22),'shadow');E((11,10,24,21),'light')
  E((12,11,23,20),'ivory')
  if closed:
   P([(11,14),(16,15),(23,13),(23,17),(16,18),(11,17)],'shadow')
   L([(11,13),(16,14),(23,13)],'glint')
  else:
   E((16,12,22,19),'tissue' if hunter else 'gold' if tracker else 'iris')
   E((18,13,21,18),'pupil');R((18,12,19,13),'white')
  L([(10,12),(13,9),(20,9)],'glint',2)
  if hunter:
   P([(8,10),(17,8),(25,11),(24,13),(18,11),(10,13)],'ink')
   R((8,12,11,13),'tissue')
  elif tracker:
   R((9,10,11,12),'gold');L([(8,17),(10,21),(14,23)],'shadow',2)
  elif broad:R((7,15,9,17),'iris2');R((24,14,26,17),'iris2')
 return im

def mouth_art(part,active):
 im=canvas();P,E,R,L=prim(im)
 if part=='grazing-mouth':
  P([(7,12),(11,9),(21,9),(26,14),(24,21),(19,24),(11,23),(6,18)],'ink')
  P([(9,12),(12,10),(21,11),(24,15),(22,20),(18,22),(11,21),(8,17)],'body')
  L([(10,11),(17,10),(21,12)],'light',2)
  if active:E((10,16,23,22),'pupil');R((12,17,21,19),'tissue');L([(11,16),(22,16)],'ivory')
  else:L([(10,18),(15,19),(22,17)],'shadow',2);R((12,15,14,15),'glint')
 elif part=='tearing-jaw':
  P([(5,11),(10,7),(21,8),(26,13),(27,21),(22,25),(12,23),(6,19)],'ink')
  P([(7,12),(11,9),(20,10),(24,14),(24,21),(20,23),(12,21),(8,17)],'body')
  L([(9,12),(13,10),(20,11)],'glint',2)
  if active:
   P([(10,15),(24,16),(27,23),(18,25),(9,21)],'pupil');R((12,22,23,23),'tissue')
   for x in (12,16,20,24):P([(x,15),(x+3,15),(x+2,19)],'ivory')
  else:
   L([(10,17),(25,18)],'shadow',3)
   for x in (12,16,20,24):P([(x,17),(x+2,18),(x,20)],'ivory')
  P([(6,18),(9,19),(12,23),(10,22)],'shadow')
 elif part=='crushing-jaw':
  P([(6,9),(12,6),(23,7),(27,11),(28,22),(23,26),(10,25),(5,19)],'ink')
  P([(8,11),(13,8),(22,9),(25,12),(25,21),(22,23),(10,22),(7,18)],'shadow')
  R((10,10,22,14),'body');R((11,10,19,11),'light');R((10,20,24,22),'body')
  if active:
   R((10,15,24,20),'pupil');R((12,15,23,16),'ivory');R((13,19,23,20),'ivory')
  else:
   L([(10,17),(24,17)],'ink',3)
   for x in (11,15,19,23):R((x,16,x+2,18),'ivory')
  R((7,15,9,19),'glint')
 elif part=='kernel-beak':
  E((5,8,19,24),'ink');E((7,9,19,22),'body');L([(9,11),(15,10)],'glint',2)
  P([(17,8),(29,14),(25,20),(18,19),(16,16)],'ink')
  P([(18,10),(27,14),(24,17),(18,16)],'gold');R((23,13,25,14),'ivory')
  P([(17,18),(23,18 if active else 17),(27,19 if active else 17),(22,22 if active else 19),(18,21)],'teeth')
  R((20,14,21,14),'pupil');L([(8,18),(13,21)],'shadow',2)
 elif part=='reed-sieve-mouth':
  E((6,8,22,24),'ink');E((8,10,21,22),'body');L([(10,11),(17,10)],'light',2)
  P([(15,14),(27,12),(29,17),(26,23),(16,23)],'deep')
  for x in (18,21,24,27):L([(x,14),(x+(2 if active else 0),21)],'ivory',1)
  if active:L([(17,18),(27,19)],'iris2',2)
  R((10,18,15,20),'shadow')
 elif part=='filter-mouth':
  E((5,6,26,25),'ink');E((7,8,24,23),'shadow');E((9,9,23,22),'body')
  E((11,10,23,22),'deep');E((13,11,22,21),'pupil')
  if active:
   E((12,11,24,23),'iris');E((14,12,22,21),'deep')
  for y in (13,16,19):L([(10,y),(15,y-1)],'iris2',2)
  L([(11,10),(16,9),(21,10)],'light')
 elif part=='sucker-mouth':
  E((4,9,27,24),'ink');E((6,10,26,23),'shadow');E((9,10,25,22),'body')
  E((11 if active else 13,12 if active else 14,24,22),'deep')
  E((14 if active else 16,14 if active else 16,22,21),'tissue')
  E((17,16,21,19),'pupil');L([(8,11),(15,9),(22,11)],'glint',2)
  R((8,18,10,20),'light')
 elif part=='gape-mouth':
  P([(7,9),(14,6),(23,8),(28,14),(27,22),(21,26),(10,23),(5,17)],'ink')
  P([(9,10),(15,8),(23,11),(26,15),(24,22),(20,24),(10,21),(7,16)],'body')
  if active:
   E((11,12,25,24),'pupil');E((15,16,22,23),'tissue')
   for x in (12,16,20,23):P([(x,12),(x+2,13),(x+1,16)],'ivory')
  else:
   L([(10,16),(16,17),(25,16)],'shadow',3)
   for x in (12,17,22):R((x,15,x+1,17),'ivory')
  L([(10,11),(15,9),(22,11)],'glint',2)
 else:raise ValueError(part)
 return im

def facing_variant(im,facing):
 # Anatomical orientation, not a different species. Native pixel nearest-neighbor.
 # Right-facing source aligns with world facing 2. Diagonal views may rotate 45,
 # staying at exactly 32x32. Left-facing views are mirrored rather than painted anew.
 return im.rotate((2-facing)*45,resample=Image.Resampling.NEAREST,center=(16,16)) if facing!=2 else im

def render(part,facing,index):
 return facing_variant(eye_art(part,bool(index)) if part in EYES else mouth_art(part,bool(index)),facing)

manifest=json.loads(MANIFEST.read_text()); lookup={x['partId']:x for x in manifest['parts']}
contacts=[]
for part in EYES+MOUTHS:
 spec_path=PARTS/(part+'.json');spec=json.loads(spec_path.read_text())
 assert len(spec['frames'])==16 and spec['width']==spec['height']==32, part
 frames=[]; colors=set()
 for frame in spec['frames']:
  im=render(part,frame['facing'],frame['index']);colors.update(pixel[:3] for pixel in im.getdata())
  frames.append({**frame,'rgbaBase64':base64.b64encode(im.tobytes()).decode('ascii')})
  if frame['facing']==2 and frame['index']==0:
   im.save(PARTS/(part+'.png'))
   contacts.append((part,im,render(part,2,1)))
 spec['frames']=frames
 used=[COL[k] for k in SKIN]
 assert set(used).issubset(colors) or part in EYES or part in MOUTHS
 extras=sorted(colors-set(used))
 spec['regions']=[{'id':'skin','protected':False,'colors':[list(c) for c in used]},
     {'id':'protected-detail','protected':True,'colors':[list(c) for c in extras]}]
 spec['artReview']='v1.72.0 anatomy-specific eye/mouth revision; idle frame 1 is blink/active articulation; creator approval pending'
 spec['authorship']='AI-assisted pixel composition of creator-directed anatomy; source image pixels editable; original human references preserved'
 body=json.dumps(spec,separators=(',',':'));temp=spec_path.with_suffix('.json.tmp');temp.write_text(body);temp.replace(spec_path)
 lookup[part]['checksumSha256']=hashlib.sha256(body.encode()).hexdigest()
 lookup[part]['status']='development-review-v172'
from PIL import ImageFont
sheet=Image.new('RGB',(8*164,2*154),'#1c3434');d=ImageDraw.Draw(sheet)
for i,(part,rest,act) in enumerate(contacts):
 x=i%8*164;y=i//8*154
 for j,im in enumerate((rest,act)):
  tile=Image.new('RGBA',(32,32),'#344e4a');tile.alpha_composite(im)
  sheet.paste(tile.resize((74,74),Image.Resampling.NEAREST).convert('RGB'),(x+6+j*78,y+9))
 d.text((x+6,y+90),part.replace('-',' '),fill='#e8ecd4')
 d.text((x+7,y+109),'rest       expression',fill='#b3c8bd')
review=ROOT/'references/generated-native-parts/face-expression-review-v172.png';review.parent.mkdir(parents=True,exist_ok=True);sheet.save(review)
MANIFEST.write_text(json.dumps(manifest,indent=2)+'\n')
print(f'UPGRADED {len(contacts)} eye/mouth parts, 256 frames, saved {review}')
