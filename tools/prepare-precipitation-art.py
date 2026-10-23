"""Mechanical indexed preparation of the retained transparent weather master."""
from pathlib import Path
from PIL import Image
import hashlib,json
r=Path(__file__).resolve().parents[1];d=r/'assets/art/production-review/precipitation-v1';master=d/'master.png';im=Image.open(master).convert('RGBA');palette=[[132,166,185],[178,205,219],[224,237,239]];groups={}
for row,kind in enumerate(['rain','snow']):
 frames=[];boxes=[];size=(6,16) if kind=='rain' else (7,7)
 for col in range(4):
  cell=im.crop((col*im.width//4,row*im.height//2,(col+1)*im.width//4,(row+1)*im.height//2));mask=cell.getchannel('A').point(lambda a:255 if a>=160 else 0);box=mask.getbbox();assert box;boxes.append(box);native=cell.crop(box).resize(size,Image.Resampling.NEAREST);data=[]
  for red,green,blue,alpha in native.get_flattened_data():
   tone=min(2,max(0,round((red*.2126+green*.7152+blue*.0722-140)/45)));a=0 if alpha<96 else min(3,max(1,round(alpha/255*3)));data.append(tone*4+a if a else 0)
  # Clear a one-pixel exterior gutter to keep filtering/rotation from bleeding.
  for y in range(size[1]):
   for x in range(size[0]):
    if x in (0,size[0]-1) or y in (0,size[1]-1):data[y*size[0]+x]=0
  frames.append(data);preview=Image.new('RGBA',size);preview.putdata([(*palette[v//4],round((v%4)/3*255)) for v in data]);preview.save(d/f'{kind}-native-{col}.png')
 groups[kind]={'width':size[0],'height':size[1],'frames':frames,'cropBoxes':boxes}
asset={'schema':'genvo.environment-precipitation-indexed/1','palette':palette,'alphaSteps':3,'groups':groups,'sourceSha256':hashlib.sha256(master.read_bytes()).hexdigest(),'preparation':'Per-cell alpha>=160 content bounds; nearest native sampling; alpha<96 removed to reject generated glow; one-pixel transparent native gutter; three neutral protected colors. No scenery or biological state.'}
(r/'assets/art/environment/precipitation.js').write_bytes(('// Prepared by tools/prepare-precipitation-art.py from retained transparent master.\nexport const precipitationArt='+json.dumps(asset,separators=(',',':'))+';\n').encode());print('Prepared eight indexed rain/snow particles')
