"""Mechanically prepare the preserved overhead imagegen fire master as native32.
Nearest sampling, explicit pigment mapping, original sampled alpha; no fuel or fire state.
"""
from pathlib import Path
from PIL import Image
import hashlib,json
R=Path(__file__).resolve().parents[1];D=R/'assets/art/production-review/wildfire-v1';master=D/'fire-master-v2.png';im=Image.open(master).convert('RGBA');frames=[]
palette=[(132,59,41),(189,84,41),(228,123,50),(246,173,72),(255,220,133)]
for y in range(2):
 for x in range(2):
  cell=im.crop((x*im.width//2,y*im.height//2,(x+1)*im.width//2,(y+1)*im.height//2)).resize((32,32),Image.Resampling.NEAREST);indices=[];alpha=[]
  for r,g,b,a in cell.get_flattened_data():
   indices.append(min(range(len(palette)),key=lambda k:sum((a-b)**2 for a,b in zip((r,g,b),palette[k]))));alpha.append(a)
  frames.append({'indices':indices,'alpha':alpha,'durationTicks':3})
  native=Image.new('RGBA',(32,32));native.putdata([(*palette[k],a) for k,a in zip(indices,alpha)]);native.save(D/f'fire-native-{len(frames)-1}.png')
asset={'schema':'genvo.environment-indexed-effect/1','width':32,'height':32,'palette':palette,'frames':frames,'sourceSha256':hashlib.sha256(master.read_bytes()).hexdigest(),'authorship':'Built-in imagegen overhead fire painting; mechanical native32 nearest sampling and explicit palette. Original sampled alpha retained. Canonical burning cells, intensity, visibility and clock remain the only event authority. Creator approval pending.'}
(R/'assets/art/environment/wildfire.js').write_bytes(('// Compiled by tools/prepare-wildfire-art.py from the preserved transparent master.\nexport const wildfireArt='+json.dumps(asset,separators=(',',':'))+';\n').encode())
print('Prepared four transparent native32 overhead fire phases')
