#!/usr/bin/env python3
"""Add the next additive 32x32 art wave. Never overwrite creator edits without explicit approval.
These sources are AI-assisted manual pixel-cluster illustrations, not procedural runtime species templates.
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import sys, json, base64, hashlib, math
root=Path(__file__).resolve().parents[1]
dest=root/'assets/art/parts'
manifest_path=root/'assets/art/catalog.json'
manifest=json.loads(manifest_path.read_text())
existing={entry['partId'] for entry in manifest['parts']}
TORSOS=['small-torso','soft-torso','reinforced-torso','sleek-torso','light-torso','stout-torso','barrel-torso','dome-torso','long-torso']
LIMBS=['walking-leg','spring-leg','grasper','runner-leg','sturdy-leg','webbed-leg','padded-leg','digging-forelimb']
assert all(id not in existing for id in TORSOS+LIMBS), 'Art source already exists: refuse accidental overwrite'
C={'o':'#172a2c','d':'#34554e','b':'#699a81','l':'#a4c7a5','h':'#dde5c3','ivory':'#efead1','amber':'#deb779','water':'#6bd0da','deep':'#214a55','rust':'#c1855d','rose':'#be8194','silver':'#c3dadd','ink':'#101e24'}
SKIN=[C[k] for k in ['o','d','b','l','h']]
def rgb(k):return C.get(k,k)
def pix(im,x,y,col):
 if 0<=x<32 and 0<=y<32:im.putpixel((int(x),int(y)),tuple(bytes.fromhex(rgb(col)[1:]))+(255,))
def generate_torso(part,face,frame):
 im=Image.new('RGBA',(32,32),(0,0,0,0));d=ImageDraw.Draw(im)
 shapes={'small-torso':(8,9,23,23),'soft-torso':(5,6,27,25),'reinforced-torso':(5,6,27,25),'sleek-torso':(3,10,29,22),'light-torso':(5,10,27,22),'stout-torso':(7,4,25,27),'barrel-torso':(5,5,27,26),'dome-torso':(7,4,25,26),'long-torso':(2,10,30,23)}
 x0,y0,x1,y1=shapes[part]; pulse=(frame%2==1)
 if pulse and part in ('soft-torso','stout-torso','dome-torso'):y0+=1;y1-=1
 d.ellipse([x0-1,y0-1,x1+1,y1+1],fill=rgb('o'))
 d.ellipse([x0,y0,x1,y1],fill=rgb('d'))
 d.ellipse([x0+1,y0+1,x1-1,y1-2],fill=rgb('b'))
 d.arc([x0+1,y0,x1-2,y1-1],180,315,fill=rgb('l'),width=2)
 d.ellipse([x0+4,y0+2,x1-4,y0+5],fill=rgb('l'))
 d.line([(x0+5,y0+4),(x0+10,y0+3)],fill=rgb('h'),width=1)
 d.arc([x0+2,y0+2,x1-2,y1-3],20,125,fill=rgb('d'),width=2)
 d.arc([x0+2,y0+2,x1-2,y1-3],40,95,fill=rgb('o'),width=1)
 if part=='small-torso':
  d.ellipse([12,11,20,18],outline=rgb('l'));pix(im,13,12,'h');pix(im,19,18,'d')
 elif part=='soft-torso':
  for x,y in [(9,12),(13,8),(21,11),(11,20),(22,19)]:d.rectangle([x,y,x+1,y+1],fill=rgb('l'))
  pix(im,13,9,'h')
 elif part=='reinforced-torso':
  for cx in (10,16,22):
   d.polygon([(cx-3,10),(cx,7),(cx+3,10),(cx+2,19),(cx,21),(cx-2,18)],fill=rgb('o'))
   d.polygon([(cx-2,10),(cx,8),(cx+2,10),(cx+1,18),(cx,19),(cx-1,18)],fill=rgb('b'))
   d.line([(cx-1,10),(cx,9),(cx+1,11)],fill=rgb('h'))
 elif part=='sleek-torso':
  d.polygon([(5,16),(11,12),(24,13),(28,16),(23,19),(12,19)],fill=rgb('l'))
  d.line([(8,15),(19,14),(24,15)],fill=rgb('h'),width=1)
  d.line([(9,20),(22,20)],fill=rgb('d'),width=1)
 elif part=='light-torso':
  for x,y in [(9,15),(12,12),(17,11),(21,15)]:pix(im,x,y,'h')
  d.line([(8,20),(24,20)],fill=rgb('d'))
 elif part=='stout-torso':
  for yy in (10,16,22):
   d.arc([10,yy-3,22,yy+3],185,350,fill=rgb('d'),width=2)
   pix(im,12,yy-1,'h')
 elif part=='barrel-torso':
  for cx in (11,17,23):
   d.ellipse([cx-4,10,cx+2,22],outline=rgb('d'),width=2)
   d.line([(cx-2,10),(cx-1,9)],fill=rgb('h'))
 elif part=='dome-torso':
  d.ellipse([11,6,21,18],fill=rgb('l'))
  d.ellipse([12,7,20,16],fill=rgb('h'))
  d.arc([9,7,24,24],10,170,fill=rgb('d'),width=2)
  for x in (10,21):pix(im,x,19,'d')
 elif part=='long-torso':
  for x in (8,13,18,23):
   d.line([(x,12),(x+1,18)],fill=rgb('d'),width=2)
   d.line([(x,12),(x+2,12)],fill=rgb('h'))
 # small biologically useful rear saddle and paired flank transition; no artificial registration dots
 d.line([(x0+4,y1-3),(x0+7,y1-2)],fill=rgb('d'))
 if face!=2:im=im.rotate((2-face)*45,resample=Image.Resampling.NEAREST,center=(16,16))
 return im

def generate_limb(part,face,frame):
 im=Image.new('RGBA',(32,32),(0,0,0,0));d=ImageDraw.Draw(im)
 # each editable sheet contains an upper bone at x=3..14 and lower bone at x=18..30.
 # geometry follows fixed rig metadata, rather than hardcoding individual species sprites.
 for idx,(xa,xb) in enumerate([(3,13),(18,28)]):
  yy=8;thick={'sturdy-leg':7,'digging-forelimb':6,'walking-leg':4,'spring-leg':4,'grasper':4,'runner-leg':3,'webbed-leg':4,'padded-leg':4}[part]
  if idx==1 and part in ('runner-leg','spring-leg'):thick=max(2,thick-1)
  if part=='spring-leg' and idx==1:
   d.polygon([(xa,7),(xa+4,6),(xa+6,10),(xb,9),(xb,12),(xa+5,11),(xa+3,9),(xa,11)],fill=rgb('o'))
   d.line([(xa+1,8),(xa+4,7),(xa+6,10),(xb-1,10)],fill=rgb('b'),width=2)
  else:
   d.rounded_rectangle([xa,yy-thick//2,xb,yy+(thick+1)//2],radius=min(3,thick//2),fill=rgb('o'))
   d.rounded_rectangle([xa+1,yy-thick//2+1,xb-1,yy+(thick+1)//2-1],radius=min(2,thick//2),fill=rgb('d'))
   d.line([(xa+2,yy-1),(xb-2,yy-1)],fill=rgb('b'),width=max(1,thick//3))
   d.line([(xa+2,yy-2),(min(xa+6,xb-2),yy-2)],fill=rgb('l'))
  pix(im,xa+2,yy-2,'h')
  if idx==0:
   d.ellipse([xa-1,yy-2,xa+3,yy+2],fill=rgb('o'))
   d.ellipse([xa,yy-1,xa+2,yy+1],fill=rgb('b'))
  else:
   d.ellipse([xa-2,yy-2,xa+2,yy+2],fill=rgb('d'))
   d.ellipse([xa-1,yy-1,xa+1,yy+1],fill=rgb('l'))
   if part=='webbed-leg':
    d.polygon([(xb-4,yy),(xb+1,yy-5),(xb+3,yy),(xb+1,yy+5)],fill=rgb('deep'))
    d.polygon([(xb-3,yy),(xb+1,yy-4),(xb+2,yy),(xb+1,yy+4)],fill=rgb('water'))
    for dy in (-3,0,3):d.line([(xb-2,yy),(xb+1,yy+dy)],fill=rgb('ivory'))
   elif part=='digging-forelimb':
    d.polygon([(xb-4,yy-3),(xb+2,yy-4),(xb+3,yy+3),(xb-3,yy+4)],fill=rgb('rust'))
    d.line([(xb+2,yy-4),(xb+3,yy+3)],fill=rgb('ivory'),width=2)
   elif part=='grasper':
    for dy in (-2,0,2):d.line([(xb,yy),(xb+3,yy+dy)],fill=rgb('ivory'))
   elif part=='runner-leg':
    d.polygon([(xb-1,yy-1),(xb+3,yy),(xb+2,yy+2),(xb-1,yy+1)],fill=rgb('l'))
   elif part=='sturdy-leg':
    d.rounded_rectangle([xb-2,yy-3,xb+3,yy+3],radius=2,fill=rgb('d'))
    d.line([(xb-1,yy-2),(xb+2,yy-2)],fill=rgb('l'))
   elif part=='padded-leg':
    d.ellipse([xb-2,yy-3,xb+3,yy+3],fill=rgb('o'))
    d.ellipse([xb-1,yy-2,xb+2,yy+2],fill=rgb('b'))
    for y in (-1,1):pix(im,xb+2,yy+y,'l')
   elif part=='spring-leg':
    d.polygon([(xb-2,yy-2),(xb+2,yy-1),(xb+3,yy+2),(xb-2,yy+1)],fill=rgb('b'))
    pix(im,xb+1,yy-1,'h')
   else:
    d.polygon([(xb-1,yy-1),(xb+3,yy-1),(xb+3,yy+2),(xb,yy+2)],fill=rgb('b'))
  if frame==1:pix(im,xa+5,yy+2,'l')
 # facing affects highlights not geometry: renderer uses physically articulated bone direction
 if face in (0,1,7):
  pix(im,8,5,'h');pix(im,23,5,'h')
 elif face in (3,4,5):
  pix(im,9,10,'d');pix(im,24,10,'d')
 return im

previews=[]
for part in TORSOS+LIMBS:
 frames=[]; colors=set()
 for facing in range(8):
  for index in range(2):
   im=generate_torso(part,facing,index) if part in TORSOS else generate_limb(part,facing,index)
   colors.update(p[:3] for p in im.getdata())
   frames.append({'facing':facing,'state':'idle','index':index,'durationMs':350 if index==0 else 250,'rgbaBase64':base64.b64encode(im.tobytes()).decode()})
   if facing==2 and index==0:im.save(dest/f'{part}.png');previews.append((part,im))
 skin={tuple(bytes.fromhex(v[1:])) for v in SKIN}
 protected=sorted(colors-skin)
 spec={'schema':'genvo.part-art-source/1','partId':part,'version':1,'width':32,'height':32,'displayScale':1,'rootAnchorPx':[16,16],
       'regions':[{'id':'skin','protected':False,'colors':[list(bytes.fromhex(v[1:])) for v in SKIN]},
                  {'id':'protected-detail','protected':True,'colors':[list(v) for v in protected]}],
       'frames':frames,'authorship':'AI-assisted manually authored pixel silhouettes and joint sheets based on creator 32x32 anatomy direction, not creator-drawn source files'}
 if part in LIMBS:
  spec['rig']={'kind':'two-bone','upper':{'rect':[2,2,13,13],'start':[3,8],'end':[13,8]},'lower':{'rect':[17,2,14,13],'start':[18,8],'end':[28,8]}}
 else:
  spec['rig']={'kind':'torso','bodyBoundsPx':[22,20]}
 text=json.dumps(spec,separators=(',',':'))
 (dest/f'{part}.json').write_text(text)
 manifest['parts'].append({'partId':part,'path':f'./parts/{part}.json','png':f'./parts/{part}.png','checksumSha256':hashlib.sha256(text.encode()).hexdigest(),'status':'development-review'})
manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
# Oversized contact sheet preserves actual unfiltered source pixels, assembled-facing captures are separate.
cols=5;tw=156;th=166
out=Image.new('RGB',(cols*tw,math.ceil(len(previews)/cols)*th),'#253a33');d=ImageDraw.Draw(out)
for idx,(part,im) in enumerate(previews):
 x=(idx%cols)*tw;y=(idx//cols)*th
 tile=Image.new('RGBA',(32,32),'#354b42');tile.alpha_composite(im)
 out.paste(tile.resize((144,144),Image.Resampling.NEAREST).convert('RGB'),(x+6,y+4))
 d.text((x+6,y+150),part.replace('-',' '),fill='#e6ead5')
(root/'references/generated-native-parts').mkdir(parents=True,exist_ok=True)
out.save(root/'references/generated-native-parts/torso-limb-wave-v167.png')
print('Created',len(previews),'32x32 native torso and rigged-limb source packs, preserving prior',len(existing))
