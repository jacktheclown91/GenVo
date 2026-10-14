#!/usr/bin/env python3
"""GenVo v1.73: genuinely detailed native 32x32 articulated limbs.

Each of the two joint segments receives its own ~27x14 row in the SAME 32x32
source frame, replacing the previous 11px horizontal scraps. The runtime uses
rig rectangles/anchors to position these sections on real hip/knee/foot bones.
Edits preserve the canonical biological part identifiers and creator references.
"""
from PIL import Image, ImageDraw
from pathlib import Path
import base64, hashlib, json, math

ROOT=Path(__file__).resolve().parents[1]
PARTS=ROOT/'assets/art/parts'
CAT=ROOT/'assets/art/catalog.json'
NAMES=['walking-leg','spring-leg','grasper','runner-leg','sturdy-leg','webbed-leg','padded-leg','digging-forelimb']
INK=(23,42,44); DARK=(52,85,78); BASE=(105,154,129); LIGHT=(164,199,165); HI=(221,229,195)
SKIN=[INK,DARK,BASE,LIGHT,HI]
BONE=(239,234,209); HARD=(171,155,131); KERATIN=(189,146,116); WEB=(107,208,218); DEEP=(33,74,85); ROSE=(190,129,148)
PROTECTED=[(0,0,0),BONE,HARD,KERATIN,WEB,DEEP,ROSE]
PALETTE=[tuple(x) for x in SKIN+PROTECTED]
BG=(0,0,0,0)
# Top/bottom radius at each longitudinal station, in art pixels. Clear differences
# in proportion are more important than uniform noise or cosmetic stripes.
PROFILES={
 'walking-leg':([3.0,4.8,5.0,4.1,3.4,3.1,2.8],[3,3.7,4,3.4,3.1,2.4,2.8]),
 'spring-leg':([2.8,4.4,4,2.7,3.6,2.5,2.8],[2.8,3.2,3.5,2.7,3.2,2.4,2.7]),
 'grasper':([3.0,3.8,4.6,4.1,3.5,3.2,2.4],[3.2,3.5,4.2,4.0,3.2,3.7,3.8]),
 'runner-leg':([2.8,3.9,4.1,3.1,2.6,2.3,2.0],[2.5,3.1,3.3,2.5,2.0,1.9,2.1]),
 'sturdy-leg':([5.0,6.0,5.7,5.6,5.3,4.8,4.9],[5.0,5.5,6.0,5.5,5.4,4.9,5.1]),
 'webbed-leg':([3.5,4.4,4.5,3.4,3.4,3.2,2.9],[3.3,3.5,3.9,3.2,2.8,2.8,3.8]),
 'padded-leg':([4.8,5.5,5.2,4.7,4.8,4.2,4.1],[4.4,5.1,5.0,4.8,4.1,4.3,5.0]),
 'digging-forelimb':([5.2,6.0,5.7,5.4,4.8,4.1,4.5],[4.5,5.3,5.6,5.5,4.9,4.6,5.0]),
}
STATIONS=[2,6,10,14,18,23,29]

def poly(im, points, rgb): ImageDraw.Draw(im).polygon(points,fill=rgb+(255,))
def line(im, points, rgb, width=1):ImageDraw.Draw(im).line(points,fill=rgb+(255,),width=width)
def rect(im, box, rgb):ImageDraw.Draw(im).rectangle(box,fill=rgb+(255,))
def dot(im, x,y,c):
 if 0<=x<32 and 0<=y<32: im.putpixel((int(x),int(y)),c+(255,))

def segment(part,face,frame,lower=False):
 """Produce one 32x16 editable joint section, never procedural runtime anatomy."""
 im=Image.new('RGBA',(32,16),BG)
 y0=8
 radii=PROFILES[part][1 if lower else 0]
 # Small local deformation only: distinct animation without changing rig endpoints.
 radii=[max(1.8,r+(.55 if frame and i in (2,3) else 0)) for i,r in enumerate(radii)]
 pts1=[(x,round(y0-r)) for x,r in zip(STATIONS,radii)]
 pts2=[(x,round(y0+r)) for x,r in zip(reversed(STATIONS),reversed(radii))]
 poly(im,pts1+pts2,INK)
 # Inset skin and three large, deliberately shaped surfaces. No random pixels.
 inset=[max(1.3,r-1.15) for r in radii]
 poly(im,[(x,round(y0-r)) for x,r in zip(STATIONS,inset)]+[(x,round(y0+r)) for x,r in zip(reversed(STATIONS),reversed(inset))],BASE)
 # Continuous underside shadow, tapered with distal section.
 poly(im,[(3,10),(8,12),(15,12),(23,11),(29,10),(29,13),(21,13),(12,14),(4,12)],DARK)
 # Upper light-plane follows the actual contour, not decorative pockmarks.
 poly(im,[(4,round(8-inset[0])),(9,round(8-inset[2])),(17,round(8-inset[4])),(25,round(8-inset[5])),(27,7),(21,8),(13,8),(6,8)],LIGHT)
 line(im,[(7,round(8-inset[1])+1),(12,round(8-inset[2])+1),(18,round(8-inset[4])+1)],HI)
 # Mask the existing silhouette for consistent materials and no floating pixels.
 silhouette=im.getchannel('A')
 overlay=Image.new('RGBA',(32,16),BG)
 d=ImageDraw.Draw(overlay)
 # Joint sockets and end caps are continuous with limb volume.
 d.ellipse((1,5,7,11),fill=INK+(255,))
 d.ellipse((2,6,6,10),fill=BASE+(255,))
 d.arc((1,5,7,11),195,290,fill=LIGHT+(255,),width=1)
 d.ellipse((24,6,30,11),fill=DARK+(255,))
 d.arc((24,6,30,11),215,315,fill=LIGHT+(255,),width=1)
 im.alpha_composite(overlay)
 # Densely structured materials and *functional* endings; paint under a clip mask
 # unless the piece intentionally extends the silhouette (fingers, spade, webbing).
 detail=Image.new('RGBA',(32,16),BG)
 dd=ImageDraw.Draw(detail)
 if part=='walking-leg':
  dd.polygon([(6,9),(10,6),(16,6),(20,7),(15,9),(9,10)],fill=LIGHT+(255,))
  dd.line([(9,10),(12,11),(17,10),(21,9)],fill=DARK+(255,),width=2)
  for x in (9,15,22): dd.line([(x,6),(x+1,8)],fill=HI+(255,))
  dd.line([(7,11),(10,12),(13,11)],fill=DARK+(255,))
 elif part=='spring-leg':
  # Tendon and zig-zag spring fascia, not a generic line limb.
  dd.polygon([(7,7),(12,5),(16,7),(20,5),(24,7),(20,9),(15,9),(11,9)],fill=DARK+(255,))
  dd.line([(8,6),(12,9),(16,6),(20,9),(24,6)],fill=HI+(255,),width=1)
  for x in (10,16,22): dd.line([(x,10),(x+1,11)],fill=LIGHT+(255,))
 elif part=='grasper':
  dd.polygon([(6,8),(11,5),(17,5),(23,7),(24,9),(18,8),(14,10),(8,11)],fill=LIGHT+(255,))
  dd.line([(11,7),(15,9),(19,8),(23,9)],fill=DARK+(255,),width=2)
  for x in (9,14,19): dd.line([(x,11),(x+2,12)],fill=HI+(255,))
 elif part=='runner-leg':
  dd.polygon([(7,7),(12,5),(20,6),(26,7),(20,8),(15,8)],fill=HI+(255,))
  dd.line([(8,10),(14,9),(20,10),(26,9)],fill=DARK+(255,))
  dd.line([(12,6),(15,7),(18,6)],fill=LIGHT+(255,))
 elif part=='sturdy-leg':
  for x in (8,15,22):
   dd.polygon([(x-3,7),(x-1,4),(x+3,5),(x+4,8),(x+1,11),(x-2,10)],fill=DARK+(255,))
   dd.polygon([(x-2,7),(x,5),(x+2,6),(x+3,8),(x,9)],fill=LIGHT+(255,))
   dd.line([(x-1,6),(x+1,6)],fill=HI+(255,))
  dd.line([(6,12),(13,13),(22,12)],fill=INK+(255,))
 elif part=='webbed-leg':
  dd.polygon([(6,7),(11,5),(19,6),(25,7),(19,9),(12,8)],fill=LIGHT+(255,))
  dd.line([(9,10),(14,11),(22,10)],fill=DEEP+(255,))
  for x in (11,17,23): dd.line([(x,6),(x+2,9)],fill=HI+(255,))
 elif part=='padded-leg':
  dd.ellipse((7,5,17,12),fill=LIGHT+(255,))
  dd.ellipse((17,5,27,12),fill=BASE+(255,))
  dd.arc((8,6,16,12),205,325,fill=HI+(255,),width=1)
  dd.arc((17,6,26,12),25,160,fill=DARK+(255,),width=2)
  dd.line([(11,11),(15,12),(19,11)],fill=DARK+(255,))
 elif part=='digging-forelimb':
  for x in (8,15,22):
   dd.polygon([(x-3,7),(x-1,4),(x+3,5),(x+4,9),(x+1,11),(x-2,10)],fill=DARK+(255,))
   dd.polygon([(x-2,6),(x,5),(x+2,6),(x+2,8),(x-1,8)],fill=LIGHT+(255,))
   dd.line([(x,5),(x+2,6)],fill=HI+(255,))
  dd.line([(8,12),(14,13),(20,12),(26,11)],fill=INK+(255,),width=2)
 # Paint textures clipped to the body to prevent isolated noise.
 clipped=Image.new('RGBA',(32,16),BG)
 clipped.paste(detail,(0,0),silhouette)
 im.alpha_composite(clipped)
 # Anatomical distal endings. Each has a readable identity, not a single pixel.
 if lower:
  if part=='walking-leg':
   poly(im,[(25,7),(29,6),(31,7),(31,10),(28,12),(24,11)],DARK)
   for y in (7,9,11):line(im,[(28,y),(31,y-1)],HI)
  elif part=='spring-leg':
   poly(im,[(25,7),(29,6),(31,7),(31,11),(29,12),(26,10)],INK)
   line(im,[(27,7),(30,8),(29,10)],LIGHT,2)
  elif part=='grasper':
   # Opposable digits branching from a shared palm.
   poly(im,[(24,6),(29,5),(30,8),(29,11),(25,11)],DARK)
   for dy in (-3,0,3):
    line(im,[(27,8),(30,8+dy)],KERATIN,2)
    dot(im,31,8+dy,BONE)
  elif part=='runner-leg':
   poly(im,[(25,8),(29,7),(31,8),(30,11),(26,11)],LIGHT)
   line(im,[(27,8),(31,9)],HI)
  elif part=='sturdy-leg':
   poly(im,[(25,5),(30,5),(31,8),(31,12),(27,12),(25,10)],INK)
   poly(im,[(26,6),(29,6),(30,8),(30,11),(27,11)],BASE)
   for x in (27,29):line(im,[(x,9),(x,11)],HI)
  elif part=='webbed-leg':
   poly(im,[(23,8),(27,3),(29,2),(31,5),(31,12),(29,14),(26,12)],DEEP)
   poly(im,[(24,8),(28,4),(30,5),(30,11),(28,12),(25,10)],WEB)
   for y in (5,8,11):line(im,[(25,8),(30,y)],BONE)
  elif part=='padded-leg':
   poly(im,[(25,5),(30,5),(31,7),(31,11),(29,13),(25,11)],INK)
   poly(im,[(26,6),(29,6),(30,8),(30,11),(28,12),(26,10)],BASE)
   for y in (7,10):line(im,[(28,y),(30,y+1)],LIGHT)
  elif part=='digging-forelimb':
   poly(im,[(24,5),(29,3),(31,5),(31,12),(27,13),(25,10)],KERATIN)
   poly(im,[(26,6),(29,5),(30,7),(29,11),(26,10)],HARD)
   for y in (5,8,11): line(im,[(29,y),(31,y-1)],BONE)
 # Independent facing-specific directional light source (not full-sheet rotation).
 if face in (3,4,5):
  line(im,[(8,12),(14,13),(19,12)],DARK)
 else:
  line(im,[(7,5),(11,5),(15,6)],HI)
 # Flex frame: restrained light moving over the real muscle, no blinking art dots.
 if frame:
  line(im,[(15,7),(18,7),(20,8)],LIGHT)
 return im

# Ensure catalog is a known native source before overwriting development candidate packs.
manifest=json.loads(CAT.read_text())
entries={e['partId']:e for e in manifest['parts']}
assert all(p in entries and (PARTS/(p+'.json')).exists() for p in NAMES)
old_counts={}
new_counts={}
reviews=[]
for part in NAMES:
 spec=json.loads((PARTS/(part+'.json')).read_text())
 old=Image.frombytes('RGBA',(32,32),base64.b64decode(spec['frames'][4]['rgbaBase64']))
 old_counts[part]=sum(1 for rgba in old.getdata() if rgba[3])
 frames=[]
 for facing in range(8):
  for index in range(2):
   top=segment(part,facing,index,False)
   bottom=segment(part,facing,index,True)
   im=Image.new('RGBA',(32,32),BG)
   im.paste(top,(0,0));im.paste(bottom,(0,16))
   if facing==2 and index==0:
    im.save(PARTS/(part+'.png'));reviews.append((part,im,old))
    new_counts[part]=sum(1 for rgba in im.getdata() if rgba[3])
   frames.append({'facing':facing,'state':'idle','index':index,'durationMs':350 if index==0 else 250,'rgbaBase64':base64.b64encode(im.tobytes()).decode('ascii')})
 spec['frames']=frames
 spec['rig']={'kind':'two-bone','upper':{'rect':[0,0,32,16],'start':[4,8],'end':[27,8]},'lower':{'rect':[0,16,32,16],'start':[4,24],'end':[27,24]}}
 spec['regions']=[{'id':'skin','protected':False,'colors':[list(c) for c in SKIN]},
                  {'id':'protected-detail','protected':True,'colors':[list(c) for c in PROTECTED]}]
 spec['authorship']='AI-assisted revised native pixel clusters based on creator modular anatomy and authored reference artwork. 32x32 two-bone detail atlas; source and live rig remain editable.'
 text=json.dumps(spec,separators=(',',':'))
 (PARTS/(part+'.json')).write_text(text)
 e=entries[part];e['checksumSha256']=hashlib.sha256(text.encode()).hexdigest();e['status']='development-review-v173-detailed-limbs'
CAT.write_text(json.dumps(manifest,indent=2)+'\n')
# Diagnostic side-by-side actual source pixels. No smoothing: every square is a real pixel.
from PIL import ImageFont
out=Image.new('RGB',(8*192,390),'#233c37');d=ImageDraw.Draw(out)
for i,(part,im,old) in enumerate(reviews):
 x=i*192
 for j,img in enumerate((old,im)):
  tile=Image.new('RGBA',(32,32),'#465c52');tile.alpha_composite(img)
  out.paste(tile.resize((176,176),Image.Resampling.NEAREST).convert('RGB'),(x+8,9+j*187))
 d.text((x+8,380),part.replace('-',' '),fill='#eff2db')
p=ROOT/'references/generated-native-parts/detailed-limbs-comparison-v173.png';p.parent.mkdir(exist_ok=True,parents=True);out.save(p)
print('Upgraded',len(NAMES),'editable limb assets; old/new visible pixel counts:')
for part in NAMES:print(part,old_counts[part],new_counts[part],round(new_counts[part]/old_counts[part],2))
print('Review:',p)
