"""Prepare real generated limb painting for the existing native rig, never draw anatomy.
Masters stay intact. Alpha threshold, aligned cropping, nearest sampling and skin ramp.
No canonical asset is installed by this preparation tool.
"""
from pathlib import Path
from PIL import Image
import json,base64,hashlib
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/art/production-review/walking-leg-v2'
RAMP=[(23,42,44),(52,85,78),(105,154,129),(164,199,165),(221,229,195)]
def luminance(rgb):return sum(v*k for v,k in zip(rgb,[.2126,.7152,.0722]))
def prepare(master,fixed_bounds=None,canvas_size=None):
    master=Image.open(master).convert('RGBA');w,h=master.size
    if canvas_size and master.size!=canvas_size:
        master=master.resize(canvas_size,Image.Resampling.NEAREST);w,h=master.size
    atlas=Image.new('RGBA',(32,32));bounds=[]
    for row in range(2):
        im=master.crop((0,row*h//2,w,(row+1)*h//2))
        mask=im.getchannel('A').point(lambda v:255 if v>=128 else 0)
        box=fixed_bounds[row] if fixed_bounds else mask.getbbox();bounds.append(box);im.putalpha(mask)
        im=im.crop(box).resize((29,14),Image.Resampling.NEAREST)
        im.putdata([(*(min(RAMP,key=lambda c:abs(luminance(c)-luminance(p[:3]))) if p[3] else (0,0,0)),p[3]) for p in im.get_flattened_data()])
        atlas.paste(im,(2,1+row*16))
    return atlas,bounds
planted,bounds=prepare(OUT/'planted-master.png')
lifted,_=prepare(OUT/'lifted-master.png',bounds,Image.open(OUT/'planted-master.png').size)
# The edit model changed some shaft pixels. Retain the exact planted thigh/calf;
# adopt only its intended generated toe-flex region. No synthetic painted pixels.
lifted_stable=planted.copy();lifted_stable.paste(lifted.crop((26,16,32,32)),(26,16));lifted=lifted_stable
planted.save(OUT/'planted-native.png')
lifted.save(OUT/'lifted-native.png')
planted.resize((384,384),Image.Resampling.NEAREST).save(OUT/'planted-inspection.png')
lifted.resize((384,384),Image.Resampling.NEAREST).save(OUT/'lifted-inspection.png')
source=json.loads((ROOT/'reports/limb-production-before/assets/art/parts/walking-leg.json').read_text());source['version']+=1
source['rig']['hipSurface']={'rect':[0,1,10,14],'anchor':[4,8]}
source['frames']=[{**f,'rgbaBase64':base64.b64encode((planted if f['index']==0 else lifted).tobytes()).decode()} for f in source['frames']]
source['authorship']='Built-in imagegen soft muscle/calf/rounded toe paintings, mechanically cropped, nearest sampled, skin-ramp mapped; generated toe-flex region only used in lifted state. No full-creature template or biological changes.'
source['artReview']='walking-leg-v2 native candidate; runtime inspection and creator visual approval remain separate.'
(OUT/'candidate.json').write_text(json.dumps(source,separators=(',',':')))
print('Native upper/lower opaque pixels:',[sum(planted.getpixel((x,y))[3]>0 for x in range(32) for y in range(row*16,(row+1)*16)) for row in range(2)])
(OUT/'preparation-receipt.json').write_text(json.dumps({'schema':'genvo.imagegen-native-preparation/1','grid':[32,32],'alphaThreshold':128,'sample':'nearest','targetSections':[[2,1,29,14],[2,17,29,14]],'masterRowCropBounds':bounds,'masterSha256':hashlib.sha256((OUT/'planted-master.png').read_bytes()).hexdigest(),'nativeSha256':hashlib.sha256(planted.tobytes()).hexdigest(),'limits':'Larger generated painting mechanically reduced; not claimed to be exact native grid output.'},indent=2))
print('Review preparation only; canonical anatomy unchanged.')
