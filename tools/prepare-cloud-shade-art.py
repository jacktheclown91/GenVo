"""Nearest indexed preparation of retained transparent overhead shadow masks."""
from pathlib import Path
from PIL import Image
import hashlib,json
r=Path(__file__).resolve().parents[1];d=r/'assets/art/production-review/cloud-shade-v1';master=d/'master.png';im=Image.open(master).convert('RGBA');palette=[[8,16,21],[12,22,28],[18,29,34],[25,37,40]];frames=[]
for row in range(2):
 for col in range(2):
  cell=im.crop((col*im.width//2,row*im.height//2,(col+1)*im.width//2,(row+1)*im.height//2)).resize((64,32),Image.Resampling.NEAREST);values=[]
  for red,green,blue,a in cell.get_flattened_data():
   tone=max(0,min(3,round((red*.2126+green*.7152+blue*.0722-65)/25)));alpha=round(a/255*7);values.append(tone*8+alpha if alpha else 0)
  for y in range(32):
   for x in range(64):
    if x in (0,63) or y in (0,31):values[y*64+x]=0
  frames.append(values);native=Image.new('RGBA',(64,32));native.putdata([(*palette[v//8],round((v%8)/7*255)) for v in values]);native.save(d/f'native-{len(frames)-1}.png')
a={'schema':'genvo.environment-cloud-shade-indexed/1','width':64,'height':32,'palette':palette,'alphaSteps':7,'frames':frames,'sourceSha256':hashlib.sha256(master.read_bytes()).hexdigest(),'preparation':'Four equal 2:1 master cells retain aspect ratio; nearest native64x32 sampling; explicit protected slate palette, seven alpha steps and transparent outer gutter. Derived rainfall-front light paint, not an additional atmospheric stock.'}
(r/'assets/art/environment/cloud-shade.js').write_bytes(('// Prepared by tools/prepare-cloud-shade-art.py from retained master.\nexport const cloudShadeArt='+json.dumps(a,separators=(',',':'))+';\n').encode());print('Prepared four indexed native overhead cloud-shadow masks')
