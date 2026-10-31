"""Prepare the preserved imagegen master as native32 indexed ice surface planes.
Mechanical crop, nearest sampling and palette assignment only; physical masks live in renderer.
"""
from pathlib import Path
from PIL import Image
import hashlib,json
R=Path(__file__).resolve().parents[1]; master=R/'assets/art/production-review/ice-surfaces-v1/ice-master.png';im=Image.open(master).convert('RGB');frames=[]
palette=[(180,207,217),(191,218,228),(201,226,231),(215,235,238)]
for y in range(2):
 for x in range(2):
  cell=im.crop((x*im.width//2,y*im.height//2,(x+1)*im.width//2,(y+1)*im.height//2)).resize((32,32),Image.Resampling.NEAREST)
  values=[r*.2126+g*.7152+b*.0722 for r,g,b in cell.get_flattened_data()];ordered=sorted(values);cuts=[ordered[int(len(values)*q)] for q in [.14,.43,.82]]
  frame=[sum(v>cut for cut in cuts) for v in values];frames.append(frame)
  native=Image.new('RGB',(32,32));native.putdata([palette[v] for v in frame]);native.save(master.parent/f'ice-native-{len(frames)-1}.png')
asset={'schema':'genvo.environment-indexed-surface/1','width':32,'height':32,'frames':frames,'sourceSha256':hashlib.sha256(master.read_bytes()).hexdigest(),'authorship':'Built-in imagegen ice surface painting; mechanically prepared native32. Actual ice mass, coverage, holes and strength remain canonical. Creator approval pending.'}
(R/'assets/art/environment/surface-ice.js').write_bytes(('// Compiled by tools/prepare-ice-surfaces.py; physical coverage is not authored here.\nexport const surfaceIceArt='+json.dumps(asset,separators=(',',':'))+';\n').encode())
print('Prepared four native32 indexed ice surface frames')
