"""Prepare retained sediment painting to four native32 cells; no terrain/resources authored."""
from pathlib import Path
from PIL import Image
import json,hashlib
R=Path(__file__).resolve().parents[1];D=R/'assets/art/production-review/riparian-bank-v1';master=D/'sediment-master.png';im=Image.open(master).convert('RGB');frames=[]
palettes=[[[17,29,21],[30,42,29],[46,59,39],[66,77,50]],[[53,49,35],[76,67,45],[102,88,57],[129,111,70]],[[70,101,65],[93,123,79],[119,146,96],[145,169,112]]]
for y in range(2):
 for x in range(2):
  cell=im.crop((x*im.width//2,y*im.height//2,(x+1)*im.width//2,(y+1)*im.height//2)).resize((32,32),Image.Resampling.NEAREST);values=[r*.2126+g*.7152+b*.0722 for r,g,b in cell.get_flattened_data()];ordered=sorted(values);cuts=[ordered[int(len(values)*q)] for q in [.2,.45,.7]];frame=[sum(v>cut for cut in cuts) for v in values];frames.append(frame)
  native=Image.new('RGB',(32,32));native.putdata([tuple(palettes[1][v]) for v in frame]);native.save(D/f'sediment-native-{len(frames)-1}.png')
asset={'schema':'genvo.environment-riparian-bank/1','width':32,'height':32,'palettes':palettes,'alpha':[.31,.32,.22],'frames':frames,'sourceSha256':hashlib.sha256(master.read_bytes()).hexdigest(),'authorship':'Built-in imagegen flat sediment painting; nearest native32 cells and bounded original-bank color ramps. No plants/resources/navigation cues. Creator acceptance pending.'}
(R/'assets/art/environment/riparian-bank.js').write_bytes(('// Prepared by tools/prepare-riparian-bank-art.py from the retained master.\nexport const riparianBankArt='+json.dumps(asset,separators=(',',':'))+';\n').encode());print('Prepared four native32 sediment cells')
