"""Prepare preserved overhead electrical contact master as indexed native32 phases."""
from pathlib import Path
from PIL import Image
import json,hashlib
r=Path(__file__).resolve().parents[1];d=r/'assets/art/production-review/storm-v1';master=d/'master.png';im=Image.open(master).convert('RGBA');palette=[[115,155,182],[158,194,217],[207,229,239],[242,248,244]];frames=[]
for k in range(4):
 cell=im.crop((k*im.width//4,0,(k+1)*im.width//4,im.height));side=max(cell.size);square=Image.new('RGBA',(side,side));square.alpha_composite(cell,((side-cell.width)//2,(side-cell.height)//2));native=square.resize((32,32),Image.Resampling.NEAREST);values=[]
 for red,green,blue,a in native.get_flattened_data():
  lum=red*.2126+green*.7152+blue*.0722
  # Fade the generated broad blue glow into alpha, retaining bright filaments.
  alpha=round(a/255*max(0,min(1,(lum-75)/140))*7);tone=min(3,max(0,round((lum-100)/45)));values.append(tone*8+alpha if alpha else 0)
 if k>=2:
  assert all(v%8==0 for v in values[-32:]), 'Root registration must not discard paint'
  values=[0]*32+values[:-32]
 # Every phase shares an exact native centre; preserve an empty edge gutter.
 for y in range(32):
  for x in range(32):
   if x in (0,31) or y in (0,31):values[y*32+x]=0
 frames.append(values);preview=Image.new('RGBA',(32,32));preview.putdata([(*palette[v//8],round((v%8)/7*255)) for v in values]);preview.save(d/f'native-phase-{k}.png')
a={'schema':'genvo.environment-lightning-contact-indexed/1','width':32,'height':32,'root':[16,16],'palette':palette,'alphaSteps':7,'frames':frames,'sourceSha256':hashlib.sha256(master.read_bytes()).hexdigest(),'preparation':'Four equal source cells padded to square; nearest native32 sampling; explicit neutral protected palette; luminance to alpha removes blue glow; transparent edge gutter; one-pixel vertical root registration for residual phases. Momentary light only, no terrain cracks or fire.'}
(r/'assets/art/environment/lightning-contact.js').write_bytes(('// Prepared by tools/prepare-storm-art.py from retained overhead master.\nexport const lightningContactArt='+json.dumps(a,separators=(',',':'))+';\n').encode());print('Prepared four native32 overhead lightning-contact phases')
