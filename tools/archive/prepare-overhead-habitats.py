"""Mechanical crop/nearest sampling/palette reduction of the generated substrate atlas."""
from pathlib import Path
from PIL import Image
import hashlib,json
root=Path(__file__).resolve().parents[1]
out=root/'assets/art/production-review/overhead-habitats-v1'
master=out/'substrate-master.png';im=Image.open(master).convert('RGBA')
palette=[(0,0,0),(34,43,28),(47,51,31),(61,60,36),(76,71,43),(91,81,48),(106,94,57),(121,108,69),(139,126,84),(158,145,103),(177,166,130),(100,103,89),(133,135,119)]
frames=[];items=[]
for i,name in enumerate(['wet-roots','thicket-litter','decay-floor','worn-earth']):
    cell=im.crop((i*im.width//4,0,(i+1)*im.width//4,im.height))
    cell.putalpha(cell.getchannel('A').point(lambda a:255 if a>=128 else 0));bounds=cell.getchannel('A').getbbox();assert bounds
    sampled=cell.crop(bounds).resize((28,28),Image.Resampling.NEAREST)
    native=Image.new('RGBA',(32,32));native.paste(sampled,(2,2))
    frame=[0 if a==0 else min(range(1,len(palette)),key=lambda j:sum((c-p)**2 for c,p in zip((r,g,b),palette[j]))) for r,g,b,a in native.get_flattened_data()]
    frames.append(frame);preview=Image.new('RGBA',(32,32));preview.putdata([(*palette[p],255 if p else 0) for p in frame]);preview.save(out/(name+'.native.png'))
    items.append(dict(name=name,cropBounds=bounds,visiblePixels=sum(p>0 for p in frame)))
target=root/'assets/art/environment/overhead-habitats.js'
target.write_text('// Mechanically prepared generated ground substrate, never food.\nexport const habitatGroundArt='+json.dumps(dict(palette=palette,frames=frames),separators=(',',':'))+';\n',encoding='utf-8')
(out/'preparation-receipt.json').write_text(json.dumps(dict(masterSha256=hashlib.sha256(master.read_bytes()).hexdigest(),runtimeSha256=hashlib.sha256(target.read_bytes()).hexdigest(),alphaThreshold=128,sampling='nearest',nativeSize=[32,32],items=items),indent=2))
print('Prepared four native substrate frames; no biological state written')
