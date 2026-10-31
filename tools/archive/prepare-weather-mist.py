"""Prepare retained transparent mist artwork to four native indexed alpha sprites."""
from pathlib import Path
from PIL import Image
import hashlib,json
root=Path(__file__).resolve().parents[1]
source=root/'assets/art/production-review/weather-v1/mist-master.png'
im=Image.open(source).convert('RGBA')
frames=[]
for row in range(2):
 for col in range(2):
  cell=im.crop((col*im.width//2,row*im.height//2,(col+1)*im.width//2,(row+1)*im.height//2)).resize((64,32),Image.Resampling.NEAREST)
  # Preserve generated alpha. Explicit neutral palette removes stray chroma;
  # quantization is asset preparation, not a generated replacement silhouette.
  pixels=[]
  for r,g,b,a in cell.get_flattened_data():
   tone=min(3,max(0,round((r*.2126+g*.7152+b*.0722-95)/40)))
   alpha=round(a/255*7)
   pixels.append(tone*8+alpha if alpha else 0)
  frames.append(pixels)
  preview=Image.new('RGBA',(64,32));palette=[(135,155,151),(160,177,170),(185,198,187),(209,218,206)]
  preview.putdata([(*palette[v//8],round((v%8)/7*255)) for v in pixels]);preview.save(source.parent/f'mist-native-{len(frames)-1}.png')
asset={'schema':'genvo.environment-weather-indexed/1','width':64,'height':32,'palette':palette,'alphaSteps':7,'frames':frames,'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'authorship':'Built-in imagegen transparent overhead mist; nearest sampling, neutral four-color palette and retained seven-level alpha. Creator acceptance pending.'}
(root/'assets/art/environment/weather-mist.js').write_bytes(('// Prepared by tools/prepare-weather-mist.py from retained editable production master.\nexport const weatherMistArt='+json.dumps(asset,separators=(',',':'))+';\n').encode())
print('Prepared four native 64x32 indexed mist sprites with generated alpha')
