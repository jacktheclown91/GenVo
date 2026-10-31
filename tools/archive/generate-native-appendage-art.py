#!/usr/bin/env python3
"""One-way first review candidate authoring. Preserve original artist references and prior edits.
Native sheet geometry only: no biology, mutation, species templates, gait, or sockets authored here.
"""
from PIL import Image, ImageDraw
from pathlib import Path
import json, hashlib, base64, math
R=Path(__file__).resolve().parents[1]; D=R/'assets/art/parts'
catpath=R/'assets/art/catalog.json'; catalog=json.loads(catpath.read_text()); installed={e['partId'] for e in catalog['parts']}
TAIL=['paddle-tail','balance-tail','club-tail','spined-tail','whip-tail','prehensile-tail','fat-tail','flag-tail','luminous-tail']
BACK=['silt-fin','signal-crest','shell-back','thorn-carapace','sail-fin','spine-ridge','display-frill','moss-back']
assert not installed.intersection(TAIL+BACK),'Refusing to replace reviewed body art'
P={'O':'#172a2c','D':'#34554e','B':'#699a81','L':'#a4c7a5','H':'#dde5c3',
   'V':'#234e63','W':'#67c7d0','U':'#e3c77d','F':'#d0e5cc','R':'#c18865','I':'#f7e8ba','G':'#a5cf64'}
SKIN=['O','D','B','L','H']; IMAGE_EMPTY=tuple(bytes.fromhex(P['O'][1:]))+(0,)
def color(code):return P.get(code,code)
def drawTail(part,phase):
 im=Image.new('RGBA',(32,32),IMAGE_EMPTY);d=ImageDraw.Draw(im)
 # Pivot (16,16) joins the posterior mantle. Length grows away from torso to the left.
 y=16+(phase and (1 if part not in ('fat-tail','club-tail') else 0) or 0)
 d.line([(17,16),(12,16),(8,y)],fill=color('O'),width=5)
 d.line([(17,16),(12,16),(8,y)],fill=color('D'),width=3)
 d.line([(16,15),(11,14),(8,y-1)],fill=color('B'),width=1)
 if part=='paddle-tail':
  d.polygon([(9,y-2),(5,y-6),(2,y-4),(3,y),(2,y+5),(6,y+6),(10,y+2)],fill=color('O'))
  d.polygon([(8,y-2),(5,y-5),(3,y-3),(5,y),(3,y+4),(6,y+5),(9,y+1)],fill=color('V'))
  d.line([(7,y-3),(5,y+4)],fill=color('W'),width=2);d.line([(5,y),(3,y)],fill=color('F'))
 elif part=='balance-tail':
  d.line([(9,y),(4,y+2),(2,y+1)],fill=color('O'),width=3)
  d.line([(9,y-1),(4,y+1)],fill=color('L'),width=1)
 elif part=='club-tail':
  d.ellipse((0,y-4,9,y+4),fill=color('O'))
  d.ellipse((2,y-3,8,y+2),fill=color('D'))
  d.polygon([(2,y-2),(5,y-3),(7,y-2),(6,y)],fill=color('B'))
  for xx,yy in [(1,y-2),(3,y+3),(7,y+2)]:d.point((xx,yy),fill=color('H'))
 elif part=='spined-tail':
  d.ellipse((1,y-3,9,y+3),fill=color('O'));d.ellipse((3,y-2,8,y+2),fill=color('B'))
  for x,dy in [(3,-1),(6,1),(9,-1)]:
   d.polygon([(x,y),(x-2,y-5 if dy<0 else y+5),(x+1,y+dy)],fill=color('O'))
   d.line([(x,y),(x-1,y-4 if dy<0 else y+4)],fill=color('I'))
 elif part=='whip-tail':
  d.line([(8,y),(5,y-3),(3,y-2),(1,y-5)],fill=color('O'),width=3)
  d.line([(8,y-1),(5,y-4),(3,y-3),(1,y-5)],fill=color('L'))
  d.point((1,y-5),fill=color('I'))
 elif part=='prehensile-tail':
  d.line([(8,y),(4,y-1),(2,y+2),(4,y+5),(7,y+4)],fill=color('O'),width=4)
  d.line([(8,y-1),(4,y-2),(3,y+2),(4,y+4),(7,y+3)],fill=color('B'),width=2)
  d.point((7,y+3),fill=color('H'))
 elif part=='fat-tail':
  d.ellipse((2,y-6,13,y+6),fill=color('O'))
  d.ellipse((3,y-5,12,y+4),fill=color('D'))
  d.ellipse((4,y-4,11,y+2),fill=color('B'))
  d.arc((3,y-5,12,y+4),185,310,fill=color('L'),width=2)
 elif part=='flag-tail':
  d.line([(8,y),(6,y-5),(4,y-7)],fill=color('O'),width=3)
  d.polygon([(6,y-7),(3,y-11),(0,y-9),(1,y-4),(5,y-3)],fill=color('O'))
  d.polygon([(5,y-7),(3,y-10),(1,y-8),(3,y-5),(5,y-4)],fill=color('U'))
  d.line([(2,y-7),(4,y-6)],fill=color('I'))
 elif part=='luminous-tail':
  d.line([(8,y),(6,y-2),(4,y-4)],fill=color('D'),width=3)
  d.ellipse((0,y-8,8,y),fill=color('O'));d.ellipse((1,y-7,7,y-1),fill=color('W'))
  d.ellipse((2,y-6,6,y-2),fill=color('F'))
  d.point((4,y-5),fill=color('I'))
  for x,z in [(1,y+1),(8,y-7)]:d.point((x,z),fill=color('W'))
 return im

def drawBack(part,phase):
 im=Image.new('RGBA',(32,32),IMAGE_EMPTY);d=ImageDraw.Draw(im)
 # Upright dorsal silhouettes: pivot sits on mantle, tall upper shapes must remain readable.
 cy=19+phase
 d.ellipse((11,cy-3,21,cy+4),fill=color('O'))
 d.ellipse((12,cy-2,20,cy+2),fill=color('D'))
 if part=='silt-fin':
  d.polygon([(11,cy),(10,cy-5),(14,cy-12),(21,cy-14),(21,cy-5),(20,cy)],fill=color('O'))
  d.polygon([(12,cy-2),(12,cy-6),(15,cy-11),(20,cy-12),(19,cy-5)],fill=color('V'))
  for x,y in [(14,cy-7),(17,cy-9),(19,cy-10)]:d.line([(15,cy-1),(x,y)],fill=color('W'))
 elif part=='signal-crest':
  for x,top in [(12,9),(16,5),(20,9)]:
   d.line([(x,cy+1),(x,top)],fill=color('O'),width=3)
   d.line([(x-1,cy-1),(x-1,top+2)],fill=color('B'))
   d.ellipse((x-2,top-2,x+2,top+2),fill=color('U'))
   d.point((x-1,top-1),fill=color('I'))
 elif part=='shell-back':
  d.ellipse((6,cy-11,26,cy+3),fill=color('O'))
  d.ellipse((8,cy-10,24,cy+1),fill=color('D'))
  d.polygon([(16,cy-10),(22,cy-7),(23,cy-2),(16,cy)],fill=color('B'))
  d.line([(16,cy-9),(16,cy)],fill=color('O'))
  d.line([(9,cy-3),(16,cy-5),(23,cy-3)],fill=color('L'))
  d.line([(11,cy-8),(14,cy-8)],fill=color('H'))
 elif part=='thorn-carapace':
  d.ellipse((8,cy-8,25,cy+3),fill=color('O'))
  d.ellipse((10,cy-7,23,cy+1),fill=color('D'))
  for x,top in [(10,cy-7),(15,cy-13),(21,cy-8)]:
   d.polygon([(x-3,cy-3),(x,top-2),(x+3,cy-3)],fill=color('O'))
   d.polygon([(x-1,cy-5),(x,top),(x+1,cy-4)],fill=color('I'))
  d.line([(12,cy),(21,cy)],fill=color('B'))
 elif part=='sail-fin':
  d.polygon([(9,cy+1),(11,cy-5),(17,cy-16),(23,cy-9),(23,cy+1)],fill=color('O'))
  d.polygon([(11,cy-1),(13,cy-6),(17,cy-13),(21,cy-9),(21,cy)],fill=color('R'))
  for x,y in [(12,cy-4),(17,cy-12),(20,cy-8)]:d.line([(16,cy+1),(x,y)],fill=color('I'))
 elif part=='spine-ridge':
  for x,hh in [(9,6),(14,11),(19,14),(24,7)]:
   d.polygon([(x-3,cy-1),(x,cy-hh),(x+3,cy-1)],fill=color('O'))
   d.line([(x,cy-hh+2),(x,cy-2)],fill=color('B'),width=2)
   d.point((x,cy-hh+1),fill=color('I'))
 elif part=='display-frill':
  d.polygon([(7,cy),(5,cy-10),(11,cy-14),(16,cy-10),(21,cy-14),(27,cy-9),(25,cy)],fill=color('O'))
  d.polygon([(9,cy-1),(7,cy-9),(11,cy-11),(16,cy-7),(21,cy-11),(25,cy-8),(23,cy-1)],fill=color('R'))
  for x,y in [(7,cy-8),(12,cy-10),(21,cy-10),(25,cy-7)]:d.line([(16,cy),(x,y)],fill=color('U'))
  d.line([(10,cy-2),(21,cy-2)],fill=color('I'))
 elif part=='moss-back':
  d.ellipse((7,cy-9,26,cy+2),fill=color('O'))
  d.ellipse((8,cy-9,24,cy),fill=color('D'))
  for x,y,r in [(9,cy-7,4),(15,cy-12,5),(22,cy-8,4)]:
   d.ellipse((x-r,y-r//2,x+r,y+r),fill=color('B'))
   d.arc((x-r,y-r//2,x+r,y+r),185,315,fill=color('G'),width=2)
  d.point((11,cy-9),fill=color('H'))
 return im

sheet=[];protected=set()
for part in TAIL+BACK:
 frames=[];colors=set()
 for facing in range(8):
  for index in range(2):
   im=drawTail(part,index) if part in TAIL else drawBack(part,index)
   # Artwork for facing 2 is rightward; each facing rotates the native sheet relative to it.
   im=im.rotate((2-facing)*45,resample=Image.Resampling.NEAREST,center=(16,16)) if facing!=2 else im
   colors.update(px[:3] for px in im.getdata())
   frames.append({'state':'idle','facing':facing,'index':index,'durationMs':350 if index==0 else 250,'rgbaBase64':base64.b64encode(im.tobytes()).decode()})
   if facing==2 and index==0:
    im.save(D/f'{part}.png');sheet.append((part,im))
 sk={tuple(bytes.fromhex(P[n][1:])) for n in SKIN}
 other=sorted(colors-sk)
 spec={'schema':'genvo.part-art-source/1','partId':part,'version':1,'width':32,'height':32,'displayScale':1,'rootAnchorPx':[16,16],
    'regions':[{'id':'skin','protected':False,'colors':[list(bytes.fromhex(P[n][1:])) for n in SKIN]},
               {'id':'protected-detail','protected':True,'colors':[list(v) for v in other]}],
    'frames':frames,'authorship':'AI-assisted hand-composed 32x32 review candidate from creator modular anatomical pixel-art direction; not an approved human authored final asset'}
 encoded=json.dumps(spec,separators=(',',':'))
 (D/f'{part}.json').write_text(encoded)
 catalog['parts'].append({'partId':part,'path':f'./parts/{part}.json','png':f'./parts/{part}.png','checksumSha256':hashlib.sha256(encoded.encode()).hexdigest(),'status':'development-review'})
catpath.write_text(json.dumps(catalog,indent=2)+'\n')
W,H=184,180;cols=5
out=Image.new('RGB',(cols*W,math.ceil(len(sheet)/cols)*H),'#263b36');d=ImageDraw.Draw(out)
for i,(part,im) in enumerate(sheet):
 x=(i%cols)*W;y=(i//cols)*H; tile=Image.new('RGBA',(32,32),'#45584d');tile.alpha_composite(im)
 out.paste(tile.resize((160,160),Image.Resampling.NEAREST).convert('RGB'),(x+12,y+4));d.text((x+8,y+166),part.replace('-',' '),fill='#f4edda')
p=R/'references/generated-native-parts/appendages-wave-v168.png';p.parent.mkdir(exist_ok=True,parents=True);out.save(p)
print('Added',len(sheet),'indexed-native candidate tail/dorsal sources')
