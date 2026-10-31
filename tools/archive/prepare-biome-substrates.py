"""Mechanical preparation of preserved imagegen soil/bedrock masters to native32.
No plants, resources or geometry are generated. The renderer owns physical selection.
"""
from pathlib import Path
from PIL import Image
import hashlib,json
R=Path(__file__).resolve().parents[1];D=R/'assets/art/production-review/biome-substrates-v1';materials={}
palettes={'dry-earth':[[120,106,72],[137,121,79],[153,135,92],[170,152,109]],'cold-earth':[[88,98,84],[101,112,94],[117,128,107],[133,144,120]],'highland-rock':[[97,103,91],[112,119,106],[128,134,118],[144,149,130]]}
for kind,palette in palettes.items():
 master=D/f'{kind}-master.png';im=Image.open(master).convert('RGB');frames=[]
 for y in range(2):
  for x in range(2):
   cell=im.crop((x*im.width//2,y*im.height//2,(x+1)*im.width//2,(y+1)*im.height//2)).resize((32,32),Image.Resampling.NEAREST);values=[r*.2126+g*.7152+b*.0722 for r,g,b in cell.get_flattened_data()];ordered=sorted(values);cuts=[ordered[int(len(values)*q)] for q in [.15,.45,.82]];frame=[sum(v>cut for cut in cuts) for v in values];frames.append(frame)
   native=Image.new('RGB',(32,32));native.putdata([tuple(palette[v]) for v in frame]);native.save(D/f'{kind}-native-{len(frames)-1}.png')
 materials[kind]={'palette':palette,'frames':frames,'sourceSha256':hashlib.sha256(master.read_bytes()).hexdigest()}
asset={'schema':'genvo.environment-indexed-substrates/1','width':32,'height':32,'materials':materials,'authorship':'Built-in imagegen paintings; crop, nearest native32 sampling and explicit four-tone palette preparation. Physical state selects transparent substrate paint; no scenery or resources. Creator approval pending.'}
(R/'assets/art/environment/biome-substrates.js').write_bytes(('// Compiled by tools/prepare-biome-substrates.py from retained imagegen masters.\nexport const biomeSubstrateArt='+json.dumps(asset,separators=(',',':'))+';\n').encode())
print('Prepared 3 native materials, 12 native32 indexed surface frames')
