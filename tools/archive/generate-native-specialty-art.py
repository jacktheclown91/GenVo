#!/usr/bin/env python3
"""GenVo 1.70: authored pixel-cluster anatomy candidates for the 17 remaining legacy
procedural-only parts. Only adds new catalog art; never alters PARTS or creator references.
Run exactly once per source tree, then tools/build-native-part-art.mjs.
"""
from PIL import Image, ImageDraw
from pathlib import Path
import base64,hashlib,json,math
R=Path(__file__).resolve().parents[1]
D=R/'assets/art/parts'; CAT=R/'assets/art/catalog.json'; catalog=json.loads(CAT.read_text())
MOUTHS=['beak-mouth','sucker-mouth','gape-mouth','tusk-jaw']
EYES=['display-eye','eyespot']
BACK=['horn-crest','echo-crest','water-hump','sensory-quills']
FLANK=['armored-hide','fat-pad','scent-gland','egg-chamber','live-womb']
SPUR=['grip-pad','kick-spur']
PARTS=MOUTHS+EYES+BACK+FLANK+SPUR
assert len(PARTS)==17 and len(set(PARTS))==17
installed={p['partId'] for p in catalog['parts']}
assert len(installed)==61 and not installed.intersection(PARTS),'Candidate already installed; refusing overwrite'
P={'O':'#172b30','D':'#375b59','M':'#609288','L':'#9dc3aa','H':'#d9e4c9',
   'I':'#f7eccf','U':'#d9b66e','R':'#ab6f67','N':'#855d81','V':'#35566e','W':'#80c4cf','G':'#b2d375', 'X':'#27333d'}
SKIN=['O','D','M','L','H'];RGB=lambda n:tuple(bytes.fromhex(P[n][1:]))
C=lambda n:P[n]

def render(name,phase):
 im=Image.new('RGBA',(32,32),RGB('O')+(0,)); d=ImageDraw.Draw(im)
 dy=1 if phase else 0
 def poly(q,c):d.polygon(q,fill=C(c))
 def line(q,c,w=1):d.line(q,fill=C(c),width=w,joint='curve')
 def oval(q,c):d.ellipse(q,fill=C(c))
 def rect(q,c):d.rectangle(q,fill=C(c))
 # Compact animal part anchored at (16,16): broad interior clusters, continuous dark outlines.
 if name=='beak-mouth':
  poly([(8,13),(14,10),(23,13),(28,16+dy),(22,20+dy),(16,20),(10,17)],'O')
  poly([(10,14),(15,12),(22,14),(26,16+dy),(21,18+dy),(16,18),(11,16)],'U')
  poly([(14,18),(23,18+dy),(20,21+dy),(13,20)],'D')
  line([(12,14),(19,13),(24,15)],'I',2);line([(19,17),(24,17+dy)],'O')
  rect((13,16,14,16),'L')
 elif name=='sucker-mouth':
  oval((8,9-dy,24,24-dy),'O');oval((10,11-dy,22,22-dy),'N')
  oval((12,13-dy,20,20-dy),'X');oval((14,15-dy,18,18-dy),'O')
  line([(10,12-dy),(14,10-dy),(20,11-dy)],'L',2)
  for x,y in [(11,18),(21,17),(15,22)]:rect((x,y-dy,x+1,y-dy),'R')
 elif name=='gape-mouth':
  poly([(7,14),(13,9-dy),(24,11-dy),(28,16),(24,23+dy),(13,24+dy),(7,19)],'O')
  poly([(10,15),(14,12-dy),(23,13-dy),(25,17),(22,22+dy),(14,22+dy),(10,19)],'R')
  poly([(13,16),(21,15),(22,19),(17,21),(12,19)],'X')
  for x in (14,18,22):poly([(x-1,12-dy),(x+1,12-dy),(x,16-dy)],'I')
  for x in (14,19):poly([(x-1,22+dy),(x+1,22+dy),(x,19+dy)],'I')
  line([(10,14),(14,12-dy),(22,13-dy)],'H')
 elif name=='tusk-jaw':
  poly([(8,14),(13,10),(23,11),(27,16),(23,21),(11,21),(7,18)],'O')
  poly([(10,14),(14,12),(23,13),(25,16),(22,19),(12,19)],'M')
  poly([(12,18),(23,18),(21,22),(13,21)],'D')
  for x in (12,23):
   poly([(x-2,17),(x,11-dy),(x+3,7-dy),(x+2,14-dy),(x+1,19)],'O')
   poly([(x,15),(x+1,10-dy),(x+2,9-dy),(x+1,16)],'I')
  line([(13,13),(18,12),(23,14)],'L')
 elif name=='display-eye':
  oval((7,7-dy,25,25-dy),'O');oval((9,9-dy,23,23-dy),'U')
  oval((11,11-dy,21,21-dy),'V');oval((13,12-dy,19,20-dy),'X')
  rect((14,12-dy,15,14-dy),'I');rect((17,19-dy,20,20-dy),'W')
  for x,y in [(9,9),(22,9),(7,17),(24,17),(14,23)]:rect((x,y-dy,x+1,y-dy),'R')
 elif name=='eyespot':
  oval((11,11-dy,22,22-dy),'O');oval((13,12-dy,20,20-dy),'L')
  oval((15,14-dy,19,19-dy),'X');rect((15,14-dy,16,15-dy),'I')
  line([(11,13-dy),(14,11-dy),(20,12-dy)],'H')
 elif name=='horn-crest':
  poly([(10,20),(12,15),(21,15),(24,20),(20,23),(12,23)],'O')
  poly([(12,20),(14,17),(20,17),(22,20),(19,21),(13,21)],'D')
  for coords in [[(11,18),(10,11-dy),(16,5-dy),(15,12),(16,18)],[(17,16),(21,8-dy),(27,5-dy),(25,13),(22,19)]]:
   poly(coords,'O')
  poly([(12,14),(12,11-dy),(15,7-dy),(14,13),(15,17)],'I')
  poly([(20,12),(22,9-dy),(26,7-dy),(24,12),(22,16)],'I')
  line([(14,19),(20,19)],'L')
 elif name=='echo-crest':
  poly([(8,22),(11,16),(22,16),(25,22),(20,24),(11,24)],'O')
  poly([(11,22),(13,18),(21,18),(23,21),(20,22)],'D')
  for x,tip in [(9,11-dy),(14,7-dy),(20,6-dy),(25,11-dy)]:
   line([(17,20),(x,tip)],'O',3);line([(17,19),(x,tip+1)],'V')
   oval((x-2,tip-2,x+2,tip+2),'O');oval((x-1,tip-1,x+1,tip+1),'W')
  line([(14,21),(20,21)],'L')
 elif name=='water-hump':
  poly([(6,21),(8,16),(10,10-dy),(17,8-dy),(23,12),(26,20),(23,24),(10,24)],'O')
  poly([(9,20),(11,14),(16,11-dy),(21,13),(23,20),(21,22),(11,22)],'D')
  poly([(11,17),(14,12-dy),(17,11-dy),(21,14),(22,19),(14,20)],'M')
  line([(11,16),(14,12-dy),(17,11-dy),(20,13)],'H',2)
  oval((19,17,22,20),'W');rect((20,17,20,17),'I')
  line([(10,22),(20,23)],'L')
 elif name=='sensory-quills':
  poly([(9,21),(11,17),(22,17),(24,22),(20,24),(12,24)],'O')
  poly([(11,20),(14,18),(21,19),(22,21),(19,22),(12,22)],'M')
  for x,top,tx in [(10,9-dy,6),(14,6-dy,13),(19,5-dy,21),(23,10-dy,27)]:
   poly([(x-2,20),(tx,top),(x+2,19)],'O')
   line([(x,17),(tx,top+1)],'I');rect((tx,top,tx,top),'W')
  line([(12,21),(21,21)],'L')
 elif name=='armored-hide':
  poly([(7,12),(13,8),(23,9),(27,15),(24,23),(14,25),(8,20)],'O')
  for q in [[(9,13),(14,10),(17,13),(15,18),(9,18)],[(17,12),(22,10),(25,15),(22,19),(16,18)],[(11,19),(16,19),(20,22),(15,23)]]:
   poly(q,'D');line(q[:3],'L')
  rect((12,12,14,12),'I');rect((21,13,23,13),'I')
 elif name=='fat-pad':
  oval((8,10-dy,25,25-dy),'O');oval((10,11-dy,23,23-dy),'D')
  oval((12,12-dy,22,20-dy),'M');line([(11,14-dy),(15,12-dy),(20,13-dy)],'H',2)
  poly([(10,22),(14,20),(21,22),(19,24),(13,24)],'L')
  rect((13,15-dy,14,16-dy),'U')
 elif name=='scent-gland':
  poly([(9,18),(12,11-dy),(20,10-dy),(24,16),(22,23),(15,25),(10,22)],'O')
  poly([(11,18),(14,13-dy),(19,12-dy),(22,17),(21,21),(16,23),(12,21)],'D')
  oval((14,14-dy,20,20-dy),'R');oval((16,15-dy,19,18-dy),'U')
  for x,y in [(10,8-dy),(18,6-dy),(26,11-dy)]:
   oval((x,y,x+2,y+2),'W');rect((x+1,y,x+1,y),'I')
  line([(12,21),(16,23),(21,20)],'L')
 elif name=='egg-chamber':
  poly([(7,16),(11,10),(21,9),(26,15),(25,22),(20,26),(11,24),(7,20)],'O')
  poly([(9,16),(12,12),(21,11),(24,15),(23,21),(19,24),(12,22),(9,19)],'D')
  for x,y in [(12,16),(18,14),(17,19)]:
   oval((x,y-dy,x+5,y+6-dy),'O');oval((x+1,y+1-dy,x+4,y+5-dy),'I')
   rect((x+2,y+2-dy,x+3,y+2-dy),'H')
  line([(10,15),(13,12),(20,11)],'L')
 elif name=='live-womb':
  poly([(7,14),(12,9-dy),(22,11-dy),(26,17),(23,25),(12,25),(7,20)],'O')
  poly([(10,14),(13,12-dy),(21,13-dy),(23,17),(21,22),(13,22),(10,19)],'D')
  oval((12,14-dy,21,22-dy),'N');oval((14,16-dy,20,21-dy),'R')
  poly([(15,16-dy),(18,16-dy),(21,19-dy),(18,21-dy),(16,19-dy)],'I')
  line([(11,13),(15,12-dy),(21,14)],'L',2)
 elif name=='grip-pad':
  poly([(8,17),(12,12),(21,12),(25,17),(23,23),(14,25),(9,21)],'O')
  poly([(10,17),(13,14),(20,14),(23,17),(21,22),(14,23),(11,20)],'D')
  for x,y in [(12,16),(17,15),(21,16)]:oval((x-1,y-1,x+1,y+2),'L')
  poly([(13,20),(17,18),(22,20),(21,23),(15,24)],'M')
  rect((15,20,17,21),'I')
 elif name=='kick-spur':
  poly([(10,18),(14,14),(21,15),(23,20),(19,23),(12,22)],'O')
  poly([(12,18),(15,16),(20,17),(20,20),(18,21),(13,20)],'D')
  poly([(18,17),(23,9-dy),(29,6-dy),(26,14-dy),(23,19),(21,22)],'O')
  poly([(21,16),(24,10-dy),(27,8-dy),(25,14-dy),(22,19)],'I')
  line([(21,18),(25,12-dy)],'H')
 else:raise ValueError(name)
 # Idle material tells: a slight scute highlight / pressure-pad compression.
 if phase and name=='armored-hide':rect((18,16,19,16),'I')
 if phase and name=='grip-pad':rect((16,20,18,20),'I')
 return im

TILE_W,TILE_H,COLS=185,197,4
sheet=Image.new('RGB',(COLS*TILE_W,math.ceil(len(PARTS)/COLS)*TILE_H),'#273e3d')
label=ImageDraw.Draw(sheet)
for i,name in enumerate(PARTS):
 frames=[];occ=set()
 for facing in range(8):
  for frame in range(2):
   im=render(name,frame)
   if facing!=2: im=im.rotate((2-facing)*45,resample=Image.Resampling.NEAREST,center=(16,16),fillcolor=RGB('O')+(0,))
   occ.update(px[:3] for px in im.getdata() if px[3])
   frames.append({'state':'idle','facing':facing,'index':frame,'durationMs':320 if frame==0 else 280,'rgbaBase64':base64.b64encode(im.tobytes()).decode()})
   if facing==2 and frame==0:
    im.save(D/(name+'.png'))
    x=(i%COLS)*TILE_W;y=(i//COLS)*TILE_H
    tile=Image.new('RGBA',(32,32),'#50635c');tile.alpha_composite(im)
    sheet.paste(tile.resize((160,160),Image.Resampling.NEAREST).convert('RGB'),(x+12,y+6))
    label.text((x+9,y+176),name.replace('-',' '),fill='#f5e9d0')
 skin=[list(RGB(v)) for v in SKIN]
 protected=sorted(occ-{RGB(v) for v in SKIN})
 assert protected and len(frames)==16, name
 spec={'schema':'genvo.part-art-source/1','partId':name,'version':1,'width':32,'height':32,'displayScale':1,'rootAnchorPx':[16,16],
       'regions':[{'id':'skin','protected':False,'colors':skin},{'id':'protected-detail','protected':True,'colors':[list(v) for v in protected]}],
       'frames':frames,'authorship':'AI-assisted 32x32 editable pixel clusters following creator GenVo modular art bible. Development candidate, not creator-approved.'}
 data=json.dumps(spec,separators=(',',':'));(D/(name+'.json')).write_text(data)
 catalog['parts'].append({'partId':name,'path':'./parts/'+name+'.json','png':'./parts/'+name+'.png',
   'checksumSha256':hashlib.sha256(data.encode()).hexdigest(),'status':'development-review'})
CAT.write_text(json.dumps(catalog,indent=2)+'\n')
ref=R/'references/generated-native-parts/specialty-wave-v170.png';ref.parent.mkdir(parents=True,exist_ok=True);sheet.save(ref)
print('Added',len(PARTS),'specialty assets;',len(PARTS)*16,'source frames;',ref)
