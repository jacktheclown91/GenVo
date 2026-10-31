#!/usr/bin/env python3
"""Author modular organic anatomy in the canonical 32px source packs.
No species names, composite creature presets, randomness, or biological changes.
Previous candidate sources are retained for review before the first overwrite.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageChops, ImageFilter
import math,json,base64,hashlib,shutil
ROOT=Path(__file__).resolve().parents[1];DEST=ROOT/'assets/art/parts';CAT=ROOT/'assets/art/catalog.json'
BACK=ROOT/'reports/organic-creatures-before-v175/parts';BACK.mkdir(parents=True,exist_ok=True)
C={'ink':(23,42,44),'shadow':(52,85,78),'base':(105,154,129),'light':(164,199,165),'glint':(221,229,195),'bone':(225,219,183),'hard':(143,126,98),'iris':(49,182,209),'irislight':(117,227,239),'pupil':(16,29,32),'gold':(176,132,64),'rose':(157,83,76),'web':(72,145,146),'facet':(32,77,84)}
SKIN=['ink','shadow','base','light','glint']
def new():return Image.new('RGBA',(32,32))
def poly(im,pts,col):ImageDraw.Draw(im).polygon(pts,fill=C[col]+(255,))
def line(im,pts,col,width=1):ImageDraw.Draw(im).line(pts,fill=C[col]+(255,),width=width,joint='curve')
def ell(im,box,col):ImageDraw.Draw(im).ellipse(box,fill=C[col]+(255,))
def clipped(im,paint):
 layer=new();paint(layer);im.alpha_composite(Image.composite(layer,new(),ImageChops.multiply(layer.getchannel('A'),im.getchannel('A'))))
def facing(im,f):return im.rotate((2-f)*45,resample=Image.Resampling.NEAREST,center=(16,16)) if f!=2 else im
# Anatomical cross sections: muscle at the hip, tendon at the ankle, never rectangular slabs.
LIMBS={
 'walking-leg':([2.5,4.8,4.5,3.6,2.3,2.0,2.3],[2.4,3.2,3.4,2.6,1.8,1.5,2.0]),
 'spring-leg':([2.5,5.4,5.8,4.0,2.5,1.9,2.3],[2.3,3.0,3.4,2.4,1.7,1.4,2.1]),
 'grasper':([2.5,4.3,4.8,3.5,2.2,1.8,2.2],[2.4,3.2,3.4,2.5,1.7,2.3,2.6]),
 'runner-leg':([2.4,4.3,4.2,3.0,2.1,1.6,2.0],[2.1,2.6,2.9,2.2,1.5,1.2,1.6]),
 'sturdy-leg':([3.0,5.5,6.0,5.1,3.7,2.6,2.8],[2.7,4.3,4.4,3.8,2.5,2.0,2.8]),
 'webbed-leg':([2.6,4.6,4.7,3.6,2.4,1.8,2.3],[2.2,3.0,3.6,2.6,1.7,1.6,2.4]),
 'padded-leg':([3.0,5.1,5.4,4.3,3.0,2.3,2.6],[2.6,3.8,4.3,3.3,2.0,2.0,3.0]),
 'digging-forelimb':([3.0,5.7,6.0,5.0,3.5,2.5,2.8],[2.7,4.4,4.8,4.0,2.8,2.1,3.0])}
def limb(part,face,index):
 sheet=new()
 for lower in (False,True):
  im=new()
  off=16 if lower else 0;y0=24 if lower else 8;xs=[2,6,10,15,20,25,29]
  radii=[r+(2.1 if 1<=i<=4 else 0)+(.25 if part=='runner-leg' and i in (2,3) else 0) for i,r in enumerate(LIMBS[part][int(lower)])]
  centers=[y0+.4*math.sin(i*.6)+(index*.35 if 1<i<4 else 0) for i in range(7)]
  # Bowed, asymmetric muscle contours with smoothly tapered ends.
  pts=[(x,round(y-r)) for x,y,r in zip(xs,centers,radii)]+[(x,round(y+r*.82)) for x,y,r in reversed(list(zip(xs,centers,radii)))]
  poly(im,pts,'ink');mask=im.getchannel('A')
  # All shading is clipped to the anatomical contour: no straight stripe border.
  interior=mask.filter(ImageFilter.MinFilter(3))
  layer=Image.new('RGBA',(32,32),C['base']+(255,));im.paste(layer,(0,0),interior)
  clipped(im,lambda t:poly(t,[(2,y0+1),(10,y0+2),(18,y0+1),(29,y0),(31,y0+7),(0,y0+7)],'shadow'))
  clipped(im,lambda t:poly(t,[(3,y0-2),(8,y0-4),(13,y0-3),(19,y0-2),(25,y0-1),(22,y0),(13,y0),(7,y0+1)],'light'))
  clipped(im,lambda t:line(t,[(7,y0-2),(10,y0-3),(13,y0-2)],'glint'))
  # Creases follow the belly of the muscle rather than repetitive armor tiles.
  clipped(im,lambda t:line(t,[(11,y0+2),(15,y0+2),(19,y0+1)],'shadow'))
  ell(im,(1,y0-2,5,y0+2),'shadow');line(im,[(2,y0-1),(4,y0-1)],'light')
  ell(im,(26,y0-2,29,y0+1),'base');line(im,[(27,y0-2),(28,y0-1)],'light')
  if lower:
   if part=='webbed-leg':
    poly(im,[(27,y0-1),(30,y0-5),(31,y0-3),(31,y0+3),(29,y0+4),(27,y0+1)],'shadow')
    poly(im,[(28,y0),(30,y0-3),(30,y0+2),(29,y0+2)],'web');line(im,[(28,y0),(30,y0-1)],'light')
   elif part=='digging-forelimb':
    poly(im,[(27,y0-2),(30,y0-3),(31,y0-1),(30,y0+3),(27,y0+2)],'hard')
    for y in (-2,0,2):line(im,[(29,y0+y),(31,y0+y-1)],'bone')
   elif part=='grasper':
    for dy in (-2,2):line(im,[(28,y0),(30,y0+dy),(31,y0+dy-1)],'hard')
   elif part=='padded-leg':
    ell(im,(26,y0-2,31,y0+3),'shadow');ell(im,(27,y0-2,30,y0+1),'base');line(im,[(28,y0-1),(29,y0-1)],'light')
   else:
    poly(im,[(27,y0),(30,y0-1),(31,y0+1),(29,y0+2),(27,y0+1)],'shadow')
    line(im,[(28,y0),(30,y0)],'light')
  # Part-specific tissue planes: stretched tendon, folded calf, padded skin.
  if part=='spring-leg':
   clipped(im,lambda t:poly(t,[(8,y0-3),(13,y0-2),(17,y0),(23,y0-1),(19,y0+1),(12,y0+1)],'shadow'))
   clipped(im,lambda t:line(t,[(10,y0-2),(14,y0),(19,y0+1),(24,y0)],'light'))
  elif part=='runner-leg':
   clipped(im,lambda t:line(t,[(9,y0-2),(15,y0-1),(21,y0),(25,y0)],'glint'))
   clipped(im,lambda t:line(t,[(10,y0+2),(16,y0+1),(22,y0+1)],'shadow'))
  elif part=='sturdy-leg':
   clipped(im,lambda t:line(t,[(8,y0+2),(11,y0),(12,y0-3)],'shadow'))
   clipped(im,lambda t:line(t,[(16,y0+2),(18,y0),(18,y0-3)],'shadow'))
   clipped(im,lambda t:line(t,[(9,y0-3),(11,y0-4)],'glint'))
  elif part=='digging-forelimb':
   clipped(im,lambda t:poly(t,[(9,y0-3),(13,y0-4),(18,y0-1),(17,y0+2),(13,y0+1)],'shadow'))
   clipped(im,lambda t:line(t,[(10,y0-3),(13,y0-3),(16,y0-1)],'light'))
  elif part=='grasper':
   clipped(im,lambda t:line(t,[(11,y0+1),(14,y0-1),(19,y0),(22,y0+1)],'shadow'))
   clipped(im,lambda t:line(t,[(15,y0-2),(18,y0-1)],'glint'))
  elif part=='webbed-leg':
   clipped(im,lambda t:line(t,[(12,y0+2),(16,y0+1),(23,y0+1)],'web'))
  elif part=='padded-leg':
   clipped(im,lambda t:ell(t,(9,y0-2,15,y0+2),'light'))
   clipped(im,lambda t:line(t,[(12,y0+3),(17,y0+2),(21,y0)],'shadow'))
  else:
   clipped(im,lambda t:line(t,[(11,y0+2),(15,y0),(20,y0)],'shadow'))
  # Clip to the two independent 16px rows, preserving valid joint rectangles.
  for y in range(off,off+16):
   for x in range(32):
    if y<off+1 or y>off+14:im.putpixel((x,y),(0,0,0,0))
   sheet.alpha_composite(im)
 return sheet
TORSOS={
 'small-torso':(9.0,8.2,.20),'soft-torso':(11.2,9.5,.10),'reinforced-torso':(10.6,10.2,.30),
 'sleek-torso':(13.0,6.0,.40),'light-torso':(10.8,7.8,.34),'stout-torso':(10.0,11.4,.16),
 'barrel-torso':(11.8,10.5,.08),'dome-torso':(10.4,11.3,.28),'long-torso':(13.4,5.6,.22)}
def torso(part,face,index):
 im=new();length,width,taper=TORSOS[part];ang=(face-2)*math.pi/4;f=(math.cos(ang),math.sin(ang));p=(-f[1],f[0])
 points=[]
 for i in range(40):
  t=i*2*math.pi/40;along=length*math.cos(t);side=width*math.sin(t)*(1-taper*max(0,math.cos(t)))
  # subtle left/right belly asymmetry and an elastic breathing flank
  side*=1+(.035*math.sin(t*3))+(.018*index if part in ('soft-torso','stout-torso','barrel-torso') else 0)
  points.append((round(16+f[0]*along+p[0]*side),round(16+(f[1]*along+p[1]*side)*.86)))
 poly(im,points,'ink');alpha=im.getchannel('A');inside=alpha.filter(ImageFilter.MinFilter(3))
 for y in range(32):
  for x in range(32):
   if not inside.getpixel((x,y)):continue
   # broad uninterrupted tissue mass, rounded underside and a restrained upper light plane
   u=(x-16)/length;v=(y-15)/(width*.86)
   light=-.45*u-.72*v
   tone='shadow' if v>.36 or u*u+v*v>.83 else 'light' if light>.27 else 'base'
   im.putpixel((x,y),C[tone]+(255,))
 # A small curved glint, never a square plate over the whole body.
 clipped(im,lambda t:line(t,[(10,11),(12,9),(16,8),(18,9)],'glint'))
 if part in ('reinforced-torso','dome-torso'):
  clipped(im,lambda t:line(t,[(7,18),(10,21),(16,23),(22,21),(25,17)],'shadow'))
  if part=='reinforced-torso':clipped(im,lambda t:line(t,[(8,14),(12,16),(18,16),(23,13)],'base'))
 elif part=='long-torso':
  clipped(im,lambda t:line(t,[(7,18),(11,19),(18,19),(23,17)],'shadow'))
 elif part=='barrel-torso':clipped(im,lambda t:poly(t,[(8,19),(12,21),(20,20),(24,17),(22,22),(12,24)],'shadow'))
 # Local anatomical material planes follow the facing. No species markings.
 def at(u,v):return(round(16+f[0]*u+p[0]*v),round(16+(f[1]*u+p[1]*v)*.86))
 def curve(points,color):clipped(im,lambda t:line(t,[at(u,v) for u,v in points],color))
 if part=='soft-torso':
  curve([(-6,4),(-3,6),(1,6),(4,4)],'shadow');curve([(-5,3),(-2,4),(1,4)],'base')
  clipped(im,lambda t:poly(t,[at(-6,-2),at(-3,-5),at(1,-5),at(4,-2),at(0,0),at(-4,0)],'light'))
 elif part=='small-torso':
  curve([(-4,-2),(-2,-4),(1,-4),(3,-2)],'glint');curve([(-4,3),(-1,5),(3,3)],'shadow')
 elif part=='reinforced-torso':
  for u in (-4,2):curve([(u-2,-6),(u,-4),(u+1,0),(u,4),(u-2,6)],'shadow')
  curve([(-5,-5),(-2,-4),(0,-1)],'light');curve([(1,-5),(4,-3),(5,0)],'light')
 elif part=='sleek-torso':
  curve([(-9,0),(-5,-2),(0,-2),(6,-1),(10,0)],'light');curve([(-8,2),(-3,3),(3,2),(7,1)],'shadow')
  curve([(-2,-3),(2,-3),(5,-2)],'glint')
 elif part=='light-torso':
  curve([(-6,0),(-3,-3),(2,-3),(5,-1)],'light');curve([(-5,3),(-1,4),(3,3)],'shadow')
 elif part=='stout-torso':
  curve([(-5,4),(-2,7),(2,7),(5,4)],'shadow');curve([(-5,-1),(-3,-3),(1,-4),(4,-2)],'light')
  curve([(-5,6),(-2,8),(1,8)],'base')
 elif part=='barrel-torso':
  curve([(-6,-6),(-3,-3),(-2,0),(-3,4),(-6,6)],'shadow');curve([(2,-6),(4,-3),(5,0),(3,5)],'shadow')
 elif part=='dome-torso':
  curve([(-6,0),(-4,-5),(0,-7),(4,-5),(6,0)],'base');curve([(-5,2),(-3,5),(0,6),(4,3)],'shadow')
 elif part=='long-torso':
  for u in (-6,0,6):curve([(u-1,-3),(u,0),(u-1,3)],'shadow')
 return im
EYES=['simple-eye','wide-field-eye','hunter-eye','tracker-eye','stalk-eye','compound-eye','glow-eye','display-eye','eyespot']
def eye(part,face,index):
 im=new();is_stalk=part=='stalk-eye';cy=12 if is_stalk else 16
 if is_stalk:
  poly(im,[(14,27),(13,22),(14,17),(15,15),(18,15),(17,21),(17,26)],'shadow');line(im,[(15,25),(15,20),(16,17)],'light')
 wide=part=='wide-field-eye';narrow=part=='hunter-eye';rx=11 if wide else 9;ry=5 if narrow else 7
 poly(im,[(16-rx,cy),(10,cy-ry+1),(16,cy-ry),(23,cy-ry+2),(16+rx,cy),(23,cy+ry-2),(16,cy+ry),(10,cy+ry-1)],'shadow')
 ell(im,(16-rx+1,cy-ry+1,16+rx-1,cy+ry-1),'base')
 line(im,[(9,cy-2),(12,cy-5),(17,cy-5),(22,cy-3)],'light',2)
 if part=='eyespot':
  ell(im,(12,cy-3,21,cy+3),'shadow');ell(im,(14,cy-2,19,cy+2),'pupil');line(im,[(14,cy-2),(16,cy-2)],'gold' if not index else 'base')
 elif index and part=='compound-eye':
  ell(im,(11,cy-4,22,cy+4),'facet')
  for x,y in [(13,cy-2),(17,cy-2),(20,cy),(14,cy+2),(18,cy+2)]:ell(im,(x,y,x+1,y+1),'web')
  line(im,[(12,cy-3),(16,cy-4)],'light')
 elif index:
  line(im,[(10,cy),(14,cy+1),(19,cy+1),(23,cy-1)],'ink',2);line(im,[(12,cy-1),(17,cy-1),(20,cy-2)],'light')
 elif part=='compound-eye':
  ell(im,(11,cy-4,22,cy+4),'facet')
  for x,y in [(13,cy-2),(17,cy-2),(20,cy),(14,cy+2),(18,cy+2)]:ell(im,(x,y,x+1,y+1),'iris')
  line(im,[(12,cy-3),(16,cy-4)],'light')
 else:
  # Aperture nested in the skin: iris is the eye, sclera is a tiny crescent.
  ell(im,(12,cy-3,22,cy+3),'shadow');ell(im,(14,cy-3,21,cy+3),'gold' if part=='tracker-eye' else 'rose' if narrow else 'iris')
  ell(im,(17,cy-2,20,cy+2),'pupil');line(im,[(15,cy-2),(16,cy-2)],'irislight')
  im.putpixel((17,cy-2),C['bone']+(255,))
  if part=='glow-eye':line(im,[(13,cy),(14,cy-2),(17,cy-3)],'irislight')
  if part=='display-eye':line(im,[(10,cy-4),(12,cy-5)],'rose')
 if part=='tracker-eye':line(im,[(9,cy-2),(10,cy-4),(12,cy-4)],'gold')
 if part=='glow-eye':line(im,[(11,cy-3),(14,cy-4),(19,cy-3)],'irislight')
 if part=='display-eye':poly(im,[(8,cy-2),(10,cy-5),(12,cy-4),(10,cy-1)],'rose')
 line(im,[(10,cy+4),(14,cy+5),(19,cy+4)],'shadow')
 return facing(im,face)
TAILS=['balance-tail','club-tail','spined-tail','whip-tail','prehensile-tail','fat-tail','flag-tail','paddle-tail','luminous-tail']
def tail(part,face,index):
 im=new();fat=part in ('fat-tail','club-tail');fin=part in ('paddle-tail','flag-tail')
 pts=[(16,14),(12,13),(8,11 if fat else 14),(4,12 if fat else 13),(1,15+index),(4,19+index),(8,21 if fat else 18),(12,19),(16,18)]
 poly(im,pts,'ink');inside=im.getchannel('A').filter(ImageFilter.MinFilter(3));im.paste(Image.new('RGBA',(32,32),C['base']+(255,)),(0,0),inside)
 clipped(im,lambda t:poly(t,[(1,17),(8,18),(16,17),(16,22),(1,22)],'shadow'))
 clipped(im,lambda t:line(t,[(3,15),(7,13 if fat else 15),(12,15),(15,15)],'light',2))
 if fin:
  poly(im,[(9,15),(4,7),(1,9),(0,15),(2,23),(5,24),(9,18)],'shadow')
  poly(im,[(7,15),(3,10),(2,14),(3,21),(6,20)],'web');line(im,[(7,16),(2,15)],'light')
 if part=='spined-tail':
  for x in (5,9,13):poly(im,[(x,14),(x-1,11),(x+2,14)],'hard')
 if part in ('whip-tail','prehensile-tail'):
  # trim the bulky distal lobe down to a sinuous continuous taper
  im=new();line(im,[(16,16),(12,16),(8,15+index),(4,13+index),(2,10+index)],'shadow',3);line(im,[(15,15),(11,15),(7,14+index),(3,12+index)],'light')
 if part=='luminous-tail':clipped(im,lambda t:ell(t,(2,14,6,18),'iris'))
 return facing(im,face)
manifest=json.loads(CAT.read_text());entries={e['partId']:e for e in manifest['parts']};samples=[]
for part,fn in [(p,torso) for p in TORSOS]+[(p,limb) for p in LIMBS]+[(p,eye) for p in EYES]+[(p,tail) for p in TAILS]:
 path=DEST/(part+'.json');spec=json.loads(path.read_text());backup=BACK/path.name
 if not backup.exists():shutil.copy2(path,backup)
 for suffix in ('.png','.indexed.json'):
  before=DEST/(part+suffix);save=BACK/before.name
  if before.exists() and not save.exists():shutil.copy2(before,save)
 colors={(0,0,0)};frames=[]
 for frame in spec['frames']:
  im=fn(part,frame['facing'],frame['index']);colors.update(px[:3] for px in im.get_flattened_data())
  frames.append({**frame,'rgbaBase64':base64.b64encode(im.tobytes()).decode()})
  if frame['facing']==2 and frame['index']==0:im.save(DEST/(part+'.png'));samples.append((part,im.copy()))
 spec['frames']=frames
 if part in EYES:spec['displayScale']=.5 if part!='stalk-eye' else .62
 spec['regions']=[{'id':'skin','protected':False,'colors':[list(C[k]) for k in SKIN]}, {'id':'protected-detail','protected':True,'colors':[list(c) for c in sorted(colors-{C[k] for k in SKIN})]}]
 spec['artReview']='v1.75 organic modular anatomy; anatomy-driven candidate, creator approval pending'
 spec['authorship']='AI-assisted native pixel composition following creator anatomy and original reference direction; no authored whole-creature or species templates'
 data=json.dumps(spec,separators=(',',':'));path.write_text(data);entries[part]['checksumSha256']=hashlib.sha256(data.encode()).hexdigest();entries[part]['status']='development-review-v175-organic'
# Standardize the scale of eyes and feeding organs that had ballooned independently of the rig.
for part in ['gape-mouth','sucker-mouth','display-eye','eyespot']:
 path=DEST/(part+'.json');spec=json.loads(path.read_text());backup=BACK/path.name
 if not backup.exists():shutil.copy2(path,backup)
 spec['displayScale']=.5;data=json.dumps(spec,separators=(',',':'));path.write_text(data);entries[part]['checksumSha256']=hashlib.sha256(data.encode()).hexdigest()
CAT.write_text(json.dumps(manifest,indent=2)+'\n')
out=Image.new('RGB',(8*144,math.ceil(len(samples)/8)*158),'#29453f');d=ImageDraw.Draw(out)
for i,(part,im) in enumerate(samples):
 x=i%8*144;y=i//8*158;tile=Image.new('RGBA',(32,32),'#29453f');tile.alpha_composite(im);out.paste(tile.resize((128,128),Image.Resampling.NEAREST).convert('RGB'),(x+8,y+4));d.text((x+6,y+138),part,fill='#dfdfc6')
out.save(ROOT/'docs/native-organic-anatomy-v175.png');print('Authored',len(samples),'organic modular assets; original candidate source backups retained.')
