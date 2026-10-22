"""Compile the preserved generated limestone painting to native32 indexed surfaces.
Only crop, nearest sampling and explicit luminance-to-palette mapping; no illustration.
"""
from PIL import Image
from pathlib import Path
import json, hashlib
R=Path(__file__).resolve().parents[1]; source=R/'assets/art/production-review/cave-surfaces-v1/limestone-master.png'; im=Image.open(source).convert('RGB'); frames=[]
for y in range(2):
 for x in range(2):
  crop=im.crop((x*im.width//2,y*im.height//2,(x+1)*im.width//2,(y+1)*im.height//2)).resize((32,32),Image.Resampling.NEAREST)
  light=[.2126*r+.7152*g+.0722*b for r,g,b in crop.get_flattened_data()]; ordered=sorted(light); cuts=[ordered[round(len(ordered)*q)] for q in [.18,.48,.82]]
  frame=[sum(v>cut for cut in cuts) for v in light];frames.append(frame)
  preview=Image.new('RGB',(32,32));preview.putdata([[(32,38,36),(43,50,45),(49,56,49),(57,63,54)][v] for v in frame]);preview.save(source.parent/f'limestone-native-{len(frames)-1}.png')
asset={'schema':'genvo.environment-indexed-surface/1','width':32,'height':32,'frames':frames,'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'authorship':'Built-in imagegen limestone surface; crop, nearest native32 sampling and four indexed tonal planes. No geometry or biological state. Creator acceptance pending.'}
(R/'assets/art/environment/cave-rock.js').write_text('// Compiled by tools/prepare-cave-rock.py from preserved imagegen master.\nexport const caveRockArt='+json.dumps(asset,separators=(',',':'))+';\n')
print('Compiled four native32 limestone surface frames')
