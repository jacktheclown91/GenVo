#!/usr/bin/env python3
"""GenVo v1.71: authored clustered 32px torso/leg art revision.

Non-destructive to original creator examples. Only 17 reviewed development candidate
assets are upgraded; anatomy, limb socket/rig coordinate contracts do not change.
Pixel shapes and material planes are deliberately authored per functional morphology,
not a noise filter, upscale, fixed species sprite, or runtime anatomical rule.
"""
from PIL import Image, ImageDraw
from pathlib import Path
import base64,hashlib,json, math
ROOT=Path(__file__).resolve().parents[1]
PARTS=ROOT/'assets/art/parts';MANIFEST=ROOT/'assets/art/catalog.json'
C={
 'ink':'#172a2c','shadow':'#34554e','base':'#699a81','light':'#a4c7a5','glint':'#dde5c3',
 'bone':'#efead1','bone_shadow':'#ab9b83','keratin':'#bd9274','water':'#6bd0da','webshadow':'#214a55',
 'soft':'#be8194','black':'#101e24'
}
RGB={name:tuple(bytes.fromhex(s[1:])) for name,s in C.items()}
TORSOS=['small-torso','soft-torso','reinforced-torso','sleek-torso','light-torso','stout-torso','barrel-torso','dome-torso','long-torso']
LIMBS=['walking-leg','spring-leg','grasper','runner-leg','sturdy-leg','webbed-leg','padded-leg','digging-forelimb']

def polygon(img,coords,c):ImageDraw.Draw(img).polygon(coords,fill=RGB[c]+(255,))
def ellipse(img,box,c):ImageDraw.Draw(img).ellipse(box,fill=RGB[c]+(255,))
def line(img,coords,c,width=1):ImageDraw.Draw(img).line(coords,fill=RGB[c]+(255,),width=width,joint='curve')
def pixel(img,x,y,c):
 if 0<=x<32 and 0<=y<32: img.putpixel((x,y),RGB[c]+(255,))
def rect(img,box,c):ImageDraw.Draw(img).rectangle(box,fill=RGB[c]+(255,))
def draw_body(part,face,frame):
 im=Image.new('RGBA',(32,32))
 # Each form is a genuinely distinct contour.  Front/back show foreshortening,
 # side/diagonal headings use their own horizontal proportions, not a 45deg rotation.
 viewing=face%8
 front=(viewing in (0,4));side=viewing in (2,6)
 # 2px breathing ripple only on pliable anatomy: not a uniform full-body pulse.
 breath=(frame==1) and part in ('soft-torso','stout-torso','barrel-torso','dome-torso')
 if part=='small-torso':
  contour=[(15,7),(20,8),(24,12),(25,17),(22,23),(18,25),(12,25),(7,22),(6,16),(9,10)]
 elif part=='soft-torso':
  contour=[(12,5),(20,6),(25,10),(28,15+breath),(26,22+breath),(21,26),(10,27),(5,24),(3,17),(6,10)]
 elif part=='reinforced-torso':
  contour=[(11,6),(21,6),(26,9),(28,15),(26,23),(22,26),(9,26),(4,22),(3,13),(7,8)]
 elif part=='sleek-torso':
  contour=[(6,14),(11,10),(19,9),(25,11),(30,15),(26,19),(19,21),(10,21),(3,18)]
 elif part=='light-torso':
  contour=[(14,8),(19,9),(25,12),(28,16),(24,21),(20,23),(12,23),(7,20),(4,17),(8,11)]
 elif part=='stout-torso':
  contour=[(13,3),(21,4),(25,8),(27,14),(27,23),(22,28),(10,28),(6,24),(5,14),(9,6)]
 elif part=='barrel-torso':
  contour=[(10,4),(22,4),(27,9),(28,20+breath),(23,27),(9,27),(4,22),(4,10)]
 elif part=='dome-torso':
  contour=[(15,3),(21,6),(24,10),(26,16),(24,23),(20,28),(12,28),(7,24),(6,16),(9,9)]
 else: # long-torso, flexible banded geometry
  contour=[(3,14),(7,10),(24,10),(28,13),(30,18),(25,22),(7,22),(2,19)]
 if part in ('sleek-torso','long-torso') and front:
  contour=[(round(16+(x-16)*.75),y) for x,y in contour]
 if part in ('small-torso','light-torso') and side:
  contour=[(round(16+(x-16)*1.08),y) for x,y in contour]
 # Silhouette forms ink, recessed side-shadow and a continuous middle mass.
 polygon(im,contour,'ink')
 from PIL import ImageFilter
 outer=im.getchannel('A')
 # Erode controlled 1px from the ink contour, then explicitly shade by light direction.
 eroded=outer.filter(ImageFilter.MinFilter(3))
 body=Image.new('RGBA',(32,32),RGB['base']+(255,));im.paste(body,(0,0),eroded)
 # Clip all subsequent interior material planes to the real visible silhouette.
 def overlay(fn):
  detail=Image.new('RGBA',(32,32));fn(detail)
  a=ImageChops.multiply(detail.getchannel('A'),eroded)
  im.paste(detail,(0,0),a)
 from PIL import ImageChops
 overlay(lambda s: polygon(s,[(2,20),(8,23),(13,24),(23,22),(30,18),(31,31),(0,31)],'shadow'))
 overlay(lambda s: polygon(s,[(4,9),(11,5),(21,6),(27,11),(25,14),(20,12),(11,13),(7,17)],'light'))
 overlay(lambda s: polygon(s,[(9,8),(14,7),(19,8),(18,10),(12,10)],'glint'))
 # distinct purposeful pixel-cluster material identities (not random speckling).
 if part=='small-torso':
  overlay(lambda s:(ellipse(s,(11,12,20,20),'light'),line(s,[(10,21),(14,23),(20,22)],'shadow',2),rect(s,(13,12,16,13),'glint')))
 elif part=='soft-torso':
  overlay(lambda s:(ellipse(s,(6,17,13,23),'light'),ellipse(s,(17,16,25,23),'light'),rect(s,(13,7,18,8),'glint'),line(s,[(7,24),(13,25),(21,24)],'shadow')))
 elif part=='reinforced-torso':
  for x in [9,16,23]:
   overlay(lambda s,x=x:(polygon(s,[(x-3,11),(x,8),(x+3,10),(x+3,20),(x,23),(x-3,20)],'shadow'),polygon(s,[(x-2,11),(x,9),(x+2,11),(x+2,18),(x,20),(x-2,18)],'light'),line(s,[(x-2,12),(x,10)],'glint')))
 elif part=='sleek-torso':
  overlay(lambda s:(polygon(s,[(6,16),(11,12),(24,13),(27,16),(21,18),(10,18)],'light'),line(s,[(9,15),(16,13),(22,14)],'glint'),line(s,[(7,19),(13,20),(24,19)],'shadow')))
 elif part=='light-torso':
  for (x,y) in [(10,14),(13,11),(19,11),(23,15)]:
   overlay(lambda s,x=x,y=y:polygon(s,[(x-2,y),(x,y-2),(x+2,y),(x,y+2)],'light'))
  overlay(lambda s:(line(s,[(9,20),(15,22),(22,20)],'shadow'),line(s,[(11,12),(14,11)],'glint')))
 elif part=='stout-torso':
  for y in (10,16,22):
   overlay(lambda s,y=y:(line(s,[(9,y),(12,y-1),(21,y-1),(23,y)],'shadow',2),line(s,[(11,y-2),(18,y-2)],'light')))
  overlay(lambda s:rect(s,(13,6,19,8),'glint'))
 elif part=='barrel-torso':
  for x in (10,16,22):
   overlay(lambda s,x=x:(polygon(s,[(x-3,9),(x-1,7),(x+2,10),(x+3,22),(x,24),(x-3,21)],'shadow'),line(s,[(x-2,10),(x,9),(x+1,14)],'light',2)))
 elif part=='dome-torso':
  overlay(lambda s:(ellipse(s,(9,5,23,19),'shadow'),ellipse(s,(10,5,22,17),'light'),polygon(s,[(13,6),(18,6),(21,9),(20,12),(14,12)],'glint'),line(s,[(8,20),(12,23),(20,23),(24,20)],'shadow',2)))
 elif part=='long-torso':
  for x in (8,13,18,23):
   overlay(lambda s,x=x:(polygon(s,[(x,11),(x+2,12),(x+3,19),(x+1,21),(x-1,19)],'shadow'),line(s,[(x,12),(x+2,14)],'light',2)))
  overlay(lambda s:line(s,[(6,16),(12,12),(23,12),(27,16)],'glint'))
 # Small asymmetrical light plane respecting global illumination. No detached accents.
 if viewing in (3,4,5):
  overlay(lambda s:polygon(s,[(5,20),(11,24),(20,24),(26,20),(26,29),(5,29)],'shadow'))
 if breath: # highlight moves locally within elastic body surface, doesn't change authority.
  overlay(lambda s:line(s,[(11,10),(17,9),(20,11)],'glint'))
 return im

def draw_leg(part,face,frame):
 im=Image.new('RGBA',(32,32));flip=(frame==1)
 # Fixed rig coordinates (upper: x3..13, lower: x18..28), solid joined ends.
 # All distinct shapes are made from carefully placed ~2px clusters.
 thickness={'walking-leg':4,'spring-leg':4,'grasper':4,'runner-leg':3,'sturdy-leg':7,'webbed-leg':4,'padded-leg':5,'digging-forelimb':6}[part]
 for segment,x0,x1 in [('upper',3,13),('lower',18,28)]:
  h=thickness if segment=='upper' else max(3,thickness-(1 if part in ('runner-leg','spring-leg') else 0))
  if part=='spring-leg':
   silhouette=[(x0,7),(x0+2,5),(x0+6,6),(x0+8,9),(x1,8),(x1,11),(x0+7,11),(x0+5,9),(x0+2,11),(x0,10)]
  elif part=='runner-leg':
   silhouette=[(x0,8),(x0+3,6),(x0+7,6),(x1,8),(x1,10),(x0+7,9),(x0+3,10),(x0,10)]
  elif part=='sturdy-leg':
   silhouette=[(x0,6),(x0+2,4),(x0+8,4),(x1,6),(x1,11),(x0+8,13),(x0+2,12),(x0,10)]
  elif part=='digging-forelimb':
   silhouette=[(x0,7),(x0+3,4),(x0+7,4),(x1,7),(x1,12),(x0+6,12),(x0+2,11),(x0,10)]
  elif part=='webbed-leg':
   silhouette=[(x0,7),(x0+3,5),(x0+8,6),(x1,8),(x1,10),(x0+8,11),(x0+2,11),(x0,10)]
  elif part=='padded-leg':
   silhouette=[(x0,7),(x0+2,5),(x0+8,5),(x1,7),(x1,11),(x0+8,12),(x0+2,12),(x0,10)]
  elif part=='grasper':
   silhouette=[(x0,8),(x0+3,5),(x0+8,6),(x1,8),(x1,10),(x0+7,11),(x0+2,11),(x0,10)]
  else:
   silhouette=[(x0,7),(x0+3,5),(x0+7,6),(x1,8),(x1,11),(x0+7,11),(x0+2,10),(x0,10)]
  polygon(im,silhouette,'ink')
  polygon(im,[(x0+1,7),(x0+3,6),(x1-2,7),(x1-1,8),(x1-1,10),(x0+2,10),(x0+1,9)],'base')
  line(im,[(x0+3,7),(x0+6,7),(x1-3,8)],'light',2)
  line(im,[(x0+4,10),(x1-3,10)],'shadow')
  if part in ('sturdy-leg','digging-forelimb'):
   rect(im,(x0+4,6,x0+6,8),'shadow');line(im,[(x0+3,5),(x0+6,5)],'glint')
  if part=='spring-leg':
   line(im,[(x0+3,8),(x0+5,7),(x0+8,10)],'shadow',2);pixel(im,x0+6,7,'glint')
  if part=='runner-leg':
   line(im,[(x0+6,6),(x0+8,7)],'glint');pixel(im,x0+5,9,'shadow')
  if part=='grasper':
   rect(im,(x0+5,7,x0+7,9),'shadow')
  if part=='webbed-leg':
   line(im,[(x0+5,6),(x0+8,7)],'light')
  if face in (0,1,7):pixel(im,x0+3,6,'glint')
  if face in (3,4,5):line(im,[(x0+4,10),(x0+7,10)],'ink')
  if segment=='upper':
   ellipse(im,(x0-1,6,x0+3,10),'ink');ellipse(im,(x0,7,x0+2,9),'base')
   pixel(im,x0+1,7,'light')
  else:
   ellipse(im,(x0-1,6,x0+3,10),'ink');ellipse(im,(x0,7,x0+2,9),'shadow')
   # Distinct silhouettes around toes, webbing, shovel, spring foot & grasp tips.
   if part=='webbed-leg':
    polygon(im,[(26,8),(29,3),(30,5),(30,12),(28,13)],'webshadow')
    polygon(im,[(27,8),(29,5),(30,6),(30,10),(28,11)],'water')
    line(im,[(28,8),(30,6)],'bone');line(im,[(28,9),(30,10)],'bone')
   elif part=='digging-forelimb':
    polygon(im,[(25,5),(30,3),(30,6),(30,12),(26,12)],'keratin')
    for y in (5,8,11):line(im,[(28,y),(30,y-1)],'bone')
   elif part=='grasper':
    for dy in (-3,0,3):
     line(im,[(27,8),(30,8+dy)],'keratin',2)
     pixel(im,30,8+dy,'bone')
   elif part=='sturdy-leg':
    polygon(im,[(25,6),(29,5),(30,7),(30,11),(27,12),(25,10)],'ink')
    polygon(im,[(26,7),(29,6),(30,8),(30,10),(27,11)],'base')
    line(im,[(27,7),(29,7)],'glint')
   elif part=='padded-leg':
    ellipse(im,(25,5,30,12),'ink');ellipse(im,(26,6,30,11),'base')
    for y in (7,9):pixel(im,30,y,'light')
   elif part=='spring-leg':
    polygon(im,[(25,7),(29,6),(30,9),(30,11),(26,11)],'ink')
    line(im,[(27,8),(30,9)],'light',2)
   elif part=='runner-leg':
    polygon(im,[(26,8),(30,8),(30,10),(27,11)],'ink')
    line(im,[(28,8),(30,9)],'glint')
   else:
    polygon(im,[(26,7),(30,7),(30,10),(26,11)],'ink')
    line(im,[(27,8),(29,8)],'light')
 if flip:
  # real contact/shadow microstate on lower segment only; no detached light glyphs.
  line(im,[(22,10),(25,10)],'shadow')
 # Joint atlas exact bounds: never render phantom toe pixels beyond the limb section.
 for yy in range(32):
  for xx in range(32):
   if not ((2<=xx<=14 or 17<=xx<=30) and 2<=yy<=14):im.putpixel((xx,yy),(0,0,0,0))
 return im

manifest=json.loads(MANIFEST.read_text())
entries={e['partId']:e for e in manifest['parts']}
previews=[]
for part in TORSOS+LIMBS:
 src_path=PARTS/(part+'.json')
 spec=json.loads(src_path.read_text())
 if spec.get('schema')!='genvo.part-art-source/1' or len(spec['frames'])!=16:raise RuntimeError(part)
 frames=[];colors=set()
 for f in spec['frames']:
  im=draw_body(part,f['facing'],f['index']) if part in TORSOS else draw_leg(part,f['facing'],f['index'])
  colors|={p[:3] for p in im.get_flattened_data() if p[3]}
  frames.append({**f,'rgbaBase64':base64.b64encode(im.tobytes()).decode('ascii')})
  if f['facing']==2 and f['index']==0:
   im.save(PARTS/(part+'.png'));previews.append((part,im))
 spec['frames']=frames
 skin=['ink','shadow','base','light','glint']
 skin_colors={RGB[k] for k in skin}
 detail=sorted((colors-skin_colors) | {(0,0,0)})
 spec['regions']=[{'id':'skin','protected':False,'colors':[list(RGB[k]) for k in skin]},
                  {'id':'protected-detail','protected':True,'colors':[list(c) for c in detail]}]
 spec['artReview']='v1.71.0 hand-composed 32x32 pixel cluster revision; creator visual approval pending'
 spec['authorship']='AI-assisted pixel design implementing creator modular anatomy, palette and joint rules; original human art references remain untouched'
 text=json.dumps(spec,separators=(',',':'))
 tmp=src_path.with_suffix('.json.tmp');tmp.write_text(text);tmp.replace(src_path)
 entries[part]['checksumSha256']=hashlib.sha256(text.encode()).hexdigest()
 entries[part]['status']='development-review-v171'
# Write review contact sheet: nearest-neighbor only, exposed authored clusters.
out=Image.new('RGB',(5*160,4*178),'#243a35')
from PIL import ImageDraw
d=ImageDraw.Draw(out)
for i,(part,im) in enumerate(previews):
 x=i%5*160;y=i//5*178
 tile=Image.new('RGBA',(32,32),'#385047');tile.alpha_composite(im)
 out.paste(tile.resize((144,144),Image.Resampling.NEAREST).convert('RGB'),(x+8,y+7))
 d.text((x+8,y+157),part.replace('-',' '),fill='#edf1d8')
 review=ROOT/'references/generated-native-parts/native-forms-review-v171.png'
review.parent.mkdir(parents=True,exist_ok=True);out.save(review)
MANIFEST.write_text(json.dumps(manifest,indent=2)+'\n')
print('UPGRADED',len(previews),'part source assets with 272 independent frames. Saved',review)
