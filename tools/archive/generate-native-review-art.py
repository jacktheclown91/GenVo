from PIL import Image,ImageDraw
from pathlib import Path
import json,base64,math,hashlib,sys
if '--regenerate-development-candidates' not in sys.argv: raise SystemExit('This overwrites authored candidates. Pass --regenerate-development-candidates explicitly, after backing up edits.')
root=Path(__file__).resolve().parents[1]; dest=root/'assets/art/parts'; dest.mkdir(parents=True,exist_ok=True)
C={'o':'#172a2c','d':'#34554e','b':'#699a81','l':'#a4c7a5','h':'#dde5c3','white':'#f4eed8','ivory':'#d8d9bf','silver':'#c4e3eb','ink':'#182c3c','azure':'#31b6d1','cyan':'#75e3ef','gold':'#e9b966','rose':'#bc667d','red':'#df7859','jade':'#4ebf82','purple':'#b6a4dd','deep':'#204d54'}
SKIN=[C[k] for k in ['o','d','b','l','h']]
W=32

def draw_part(part,frame,facing):
 img=Image.new('RGBA',(32,32),(0,0,0,0));d=ImageDraw.Draw(img)
 def box(b,c):d.rectangle(b,fill=C.get(c,c))
 def ell(b,c):d.ellipse(b,fill=C.get(c,c))
 def line(points,c,w=1):d.line(points,fill=C.get(c,c),width=w,joint='curve')
 # locally front = right, keep native pixel clusters, protected eye and teeth detail.
 blink=frame%2==1
 if part in ['simple-eye','hunter-eye','tracker-eye','glow-eye','compound-eye','stalk-eye','wide-field-eye']:
  if part=='stalk-eye':
   line([(13,23),(14,20),(15,18),(16,15)],'o',3);line([(14,22),(15,20),(16,17)],'jade',1)
   ell([9,6,23,19],'o');ell([10,7,22,18],'d');ell([10,8,21,17],'azure');ell([11,8,20,14],'cyan');ell([12,9,18,13],'silver')
   if not blink:
    ell([16,11,20,15],'ink');box([17,11,17,11],'white')
   else:line([(11,13),(21,13)],'d',2)
   box([14,24,15,25],'red') # red attachment cue from human reference, not biological skin
  elif part=='compound-eye':
   ell([9,8,23,22],'o');ell([10,9,22,21],'d');ell([11,10,21,20],'jade')
   for x,y in [(13,12),(17,12),(20,14),(13,16),(17,17),(20,18)]:ell([x,y,x+2,y+2], 'cyan' if (x+y)%3 else 'deep')
   line([(11,13),(14,10),(18,10)],'l');box([12,11,13,11],'h')
   if blink:line([(12,12),(22,19)],'o',2)
  elif part=='glow-eye':
   ell([8,9,23,22],'deep');ell([9,9,22,21],'cyan');ell([11,11,20,19],'silver');ell([13,12,19,18],'white')
   if not blink:ell([16,14,19,17],'ink');box([17,14,17,14],'white')
   else:line([(11,15),(21,15)],'deep',2)
  else:
   wide=part=='wide-field-eye'; hunter=part=='hunter-eye';tracker=part=='tracker-eye'
   ell([8 if wide else 10,9,24 if wide else 22,22],'o');ell([9 if wide else 11,10,23 if wide else 21,20],'d')
   ell([10 if wide else 12,10,22 if wide else 20,19],'white')
   if not blink:
    col='red' if hunter else 'gold' if tracker else 'azure'
    ell([16 if wide else 16,12,22 if wide else 21,18],col)
    ell([18,13,21,17],'ink');box([18,13,19,14],'white')
   else:line([(11,15),(21,15)],'d',2)
   if hunter:line([(10,11),(20,10),(24,12)],'o',2);box([11,11,14,11],'red')
   if tracker:box([11,11,12,12],'gold')
   if wide:box([10,11,10,12],'cyan');box([22,11,22,12],'cyan')
 elif part in ['grazing-mouth','tearing-jaw','crushing-jaw','kernel-beak','reed-sieve-mouth','filter-mouth','nibbler-mouth']:
  if part=='grazing-mouth':
   ell([7,11,24,21],'o');ell([8,12,23,19],'d');ell([9,12,22,16],'b');line([(10,18),(20,18)],'ink',2)
   if blink:line([(11,17),(20,17)],'h',1)
   box([12,12,15,13],'l')
  elif part=='tearing-jaw':
   ell([6,9,23,22],'o');ell([8,10,23,19],'d');ell([9,11,23,15],'b');
   line([(10,17),(25,18)],'ink',3)
   for x in [12,16,20,24]:box([x,17,x+1,19 if not blink else 18],'white')
   line([(11,19),(24,21)],'red',1);box([9,11,13,12],'l')
  elif part=='crushing-jaw':
   ell([6,10,25,22],'o');ell([7,11,25,20],'d');box([9,12,22,16],'b');box([10,12,17,13],'l');
   box([9,18,24,20],'o');box([11,18,21,18],'ivory');
   for x in [12,16,20]:box([x,17,x+2,19],'white')
   if blink:box([9,19,24,20],'d')
  elif part=='kernel-beak':
   ell([6,9,19,22],'o');ell([7,10,18,20],'d');ell([9,11,18,18],'b')
   d.polygon([(18,10),(27,14),(22,19),(17,18)],fill=C['o']);d.polygon([(19,11),(26,14),(22,16),(19,16)],fill=C['gold']);line([(18,17),(23,18),(26,16)],'o',1)
   box([10,11,15,12],'l');box([22,13,23,13],'ink')
   if blink:box([22,17,25,18],'ivory')
  elif part=='reed-sieve-mouth':
   ell([6,10,23,22],'o');ell([7,11,22,20],'d');ell([9,11,21,16],'b')
   for x in range(11,25,3):line([(x,16),(x+1,23)],'ivory',2)
   line([(10,17),(25,17)],'deep',1);box([10,11,14,12],'l')
   if blink:line([(11,19),(24,20)],'cyan',1)
  elif part=='filter-mouth':
   ell([7,8,25,25],'o');ell([8,9,24,24],'d');ell([10,10,22,21],'b')
   ell([12,12,22,22],'deep');ell([13,13,21,21],'ink')
   for t in range(3):line([(11,14+t*3),(14,13+t*3)],'cyan',1)
   if blink:box([19,15,20,18],'ivory')
  else:
   ell([10,12,24,21],'o');ell([11,13,23,19],'d');box([14,13,23,15],'b');box([14,17,22,17],'ivory')
   if blink:box([19,17,20,18],'white')
 # rotate anatomy expression by facing, maintaining indexed pixels without blending
 # right-facing 2, north 0. Avoid wobbly resampling; rotate in quarter-turns for 4 cardinals,
 # diagonals use NEAREST 45deg and native-pixel cleanups (not full 32px upscaling).
 angle=(2-facing)*45
 if angle:img=img.rotate(angle,resample=Image.Resampling.NEAREST,center=(16,16),expand=False)
 return img

parts=['simple-eye','stalk-eye','compound-eye','hunter-eye','tracker-eye','glow-eye','wide-field-eye','grazing-mouth','tearing-jaw','crushing-jaw','kernel-beak','reed-sieve-mouth','filter-mouth','nibbler-mouth']
manifest=[]; previews=[]
for part in parts:
 frames=[]; rgbused=set()
 for face in range(8):
  for frame in range(2):
   im=draw_part(part,frame,face)
   for p in im.getdata():rgbused.add(tuple(p[:3]))
   frames.append({'facing':face,'state':'idle','index':frame,'durationMs':part.endswith('eye') and (850 if frame==0 else 125) or (375 if frame==0 else 160),'rgbaBase64':base64.b64encode(im.tobytes()).decode()})
   if face==2 and frame==0:
    im.save(dest/f'{part}.png');previews.append((part,im))
 fixed=sorted(set(rgbused)-set(tuple(bytes.fromhex(k[1:])) for k in SKIN))
 # source compiles via explicit semantic skin ramp and protected unchanged detailing colors
 spec={'schema':'genvo.part-art-source/1','partId':part,'version':1,'width':32,'height':32,'displayScale':.50 if part!='stalk-eye' else .62,'rootAnchorPx':[16,16], 'regions':[{'id':'skin','protected':False,'colors':[[int(s[i:i+2],16) for i in (1,3,5)] for s in SKIN]},{'id':'protected-detail','protected':True,'colors':[list(c) for c in fixed]}],'frames':frames,'authorship':'AI-assisted manually specified pixel clusters informed by creator art bible; not creator-authored original files'}
 text=json.dumps(spec,separators=(',',':'))
 (dest/f'{part}.json').write_text(text)
 manifest.append({'partId':part,'path':f'./parts/{part}.json','png':f'./parts/{part}.png','checksumSha256':hashlib.sha256(text.encode()).hexdigest(),'status':'development-review'})
(root/'assets/art/catalog.json').write_text(json.dumps({'schema':'genvo.part-art-catalog/1','parts':manifest},indent=2)+'\n')
from PIL import ImageFont
out=Image.new('RGB',(840,math.ceil(len(previews)/7)*156),'#20312d');d=ImageDraw.Draw(out)
for i,(name,im) in enumerate(previews):
 x=(i%7)*120;y=(i//7)*156; tile=Image.new('RGBA',(32,32),'#394a43');tile.alpha_composite(im)
 out.paste(tile.resize((112,112),Image.Resampling.NEAREST).convert('RGB'),(x+4,y+4));d.text((x+4,y+124),name.replace('-',' '),fill='#e0e5d3')
(root/'references/generated-native-parts').mkdir(parents=True,exist_ok=True);out.save(root/'references/generated-native-parts/contact-sheet.png')
print('Generated',len(manifest),'native 32px authored-source packs, 8 facings * 2 frames each')
