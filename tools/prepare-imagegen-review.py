"""Mechanical preparation of actual imagegen masters, never illustration primitives.
Preserves masters; alpha cutoff, crop, nearest sampling and explicit palette mapping.
Outputs REVIEW candidates only. Installation is a separate validated operation.
"""
from pathlib import Path
from PIL import Image
import json, base64, hashlib
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/art/production-review'
SKIN=[(23,42,44),(52,85,78),(105,154,129),(164,199,165),(221,229,195)]
DETAIL=[(0,0,0),(16,29,32),(157,159,106),(225,219,183)]
def source_before(part):
    baseline=ROOT/'reports/visual-production/before-art/parts'/f'{part}.json'
    return json.loads((baseline if baseline.exists() else ROOT/'assets/art/parts'/f'{part}.json').read_text())
def bounded(im):
    im=im.convert('RGBA'); a=im.getchannel('A').point(lambda v:255 if v>=128 else 0)
    im.putalpha(a)
    return im.crop(a.getbbox())
def lum(c):return c[0]*.2126+c[1]*.7152+c[2]*.0722
def eye_native(cell,index):
    im=bounded(cell).resize((19,17),Image.Resampling.NEAREST)
    px=[]
    for r,g,b,a in im.get_flattened_data():
        if not a: c=(0,0,0)
        elif index==0 and lum((r,g,b))<43:c=DETAIL[1]
        elif index==0 and r>=g*.93 and r>b*1.15 and lum((r,g,b))>125:
            c=DETAIL[3] if lum((r,g,b))>185 else DETAIL[2]
        else:c=min(SKIN,key=lambda c:abs(lum(c)-lum((r,g,b))))
        px.append((*c,a))
    im.putdata(px); native=Image.new('RGBA',(32,32)); native.paste(im,(7,8));return native
master=Image.open(OUT/'eye-blink-generated-master.png'); w,h=master.size
frames=[eye_native(master.crop((i*w//2,0,(i+1)*w//2,h)),i) for i in range(2)]
source=source_before('simple-eye')
source['version']+=1
source['regions']=[{'id':'skin','protected':False,'colors':SKIN},{'id':'protected-detail','protected':True,'colors':DETAIL}]
source['frames']=[{**f,'rgbaBase64':base64.b64encode(frames[f['index']].tobytes()).decode()} for f in source['frames']]
source['authorship']='AI imagegen derived from creator AmphibianEye1.gif design; mechanical crop, nearest sampling and explicit pigment palette mapping. No human-drawn claim.'
source['artReview']='Production pipeline pilot: creator visual approval pending; two generated expressions reused across eight facings, not eight independently illustrated views.'
(OUT/'simple-eye.candidate.json').write_text(json.dumps(source,separators=(',',':')))
sheet=Image.new('RGBA',(64,32))
for i,im in enumerate(frames):
    im.save(OUT/f'eye-native-{i}.png');sheet.paste(im,(i*32,0))
sheet.resize((768,384),Image.Resampling.NEAREST).save(OUT/'eye-native-inspection.png')
# The plant candidate remains separate from canonical ecology and native anatomy.
shrub=bounded(Image.open(OUT/'shrub-generated-master.png'));shrub.thumbnail((28,24),Image.Resampling.NEAREST)
native=Image.new('RGBA',(32,32));native.paste(shrub,((32-shrub.width)//2,30-shrub.height));native.save(OUT/'shrub-native-candidate.png')
native.resize((384,384),Image.Resampling.NEAREST).save(OUT/'shrub-native-inspection.png')
# Same framing for both generated plant states. No drawn replacement polygons.
full=Image.open(OUT/'shrub-generated-master.png').convert('RGBA')
alpha=full.getchannel('A').point(lambda v:255 if v>=128 else 0);box=alpha.getbbox()
size=shrub.size
data=[]
for name in ['shrub-bare-generated-master.png','shrub-generated-master.png']:
    im=Image.open(OUT/name).convert('RGBA')
    if im.size!=full.size:raise ValueError('Plant edit changed canvas size; align before proceeding')
    im.putalpha(im.getchannel('A').point(lambda v:255 if v>=128 else 0))
    im=im.crop(box).resize(size,Image.Resampling.NEAREST)
    frame=Image.new('RGBA',(32,32));frame.paste(im,((32-im.width)//2,30-im.height))
    data.append(list(frame.tobytes()))
env=ROOT/'assets/art/environment';env.mkdir(exist_ok=True)
(env/'berry-shrub.js').write_text('// AI imagegen masters mechanically prepared by tools/prepare-imagegen-review.py.\nexport const shrubFrames='+json.dumps(data,separators=(',',':'))+';\n')
moss=bounded(Image.open(OUT/'moss-generated-master.png')).resize((28,14),Image.Resampling.NEAREST)
native=Image.new('RGBA',(32,32));native.paste(moss,(2,16));native.save(OUT/'moss-native-candidate.png')
native.resize((384,384),Image.Resampling.NEAREST).save(OUT/'moss-native-inspection.png')
(env/'moss.js').write_text('// AI imagegen master mechanically prepared by tools/prepare-imagegen-review.py.\nexport const mossFrames='+json.dumps([list(native.tobytes())],separators=(',',':'))+';\n')
master=Image.open(OUT/'walking-leg-generated-master.png');w,h=master.size
leg=Image.new('RGBA',(32,32))
for row,height in [(0,14),(1,13)]:
    im=bounded(master.crop((0,row*h//2,w,(row+1)*h//2))).resize((29,height),Image.Resampling.NEAREST)
    im.putdata([(*(min(SKIN,key=lambda c:abs(lum(c)-lum(p[:3]))) if p[3] else (0,0,0)),p[3]) for p in im.get_flattened_data()])
    leg.paste(im,(2,8+16*row-height//2))
leg.save(OUT/'walking-leg-native-candidate.png')
leg.resize((384,384),Image.Resampling.NEAREST).save(OUT/'walking-leg-native-inspection.png')
lifted=leg.copy();toe=lifted.crop((26,20,32,29));lifted.paste(Image.new('RGBA',(6,9)),(26,20));lifted.paste(toe,(26,19))
source=source_before('walking-leg');source['version']+=1
source['frames']=[{**f,'rgbaBase64':base64.b64encode((leg if f['index']==0 else lifted).tobytes()).decode()} for f in source['frames']]
source['authorship']='AI imagegen muscle/tendon strips; crop, nearest sampling, five-tone palette mapping and one-pixel lifted-toe preparation. Runtime joint/foot authority unchanged.'
source['artReview']='Production pipeline pilot, creator approval pending; two prepared contact states reused across eight rigged facings, not eight independently painted illustrations.'
(OUT/'walking-leg.candidate.json').write_text(json.dumps(source,separators=(',',':')))
master=Image.open(OUT/'grazing-mouth-generated-master.png');w,h=master.size;mouths=[]
oral=[(0,0,0),(16,29,32),(225,219,183),(157,83,76)]
for index in range(2):
    im=bounded(master.crop((index*w//2,0,(index+1)*w//2,h))).resize((15,10),Image.Resampling.NEAREST);pixels=[]
    for r,g,b,a in im.get_flattened_data():
        if not a:c=oral[0]
        elif lum((r,g,b))<43:c=oral[1]
        elif r>g*1.2 and r>b*1.15:c=oral[3]
        elif r>=g*.94 and r>b*1.12 and lum((r,g,b))>160:c=oral[2]
        else:c=min(SKIN,key=lambda c:abs(lum(c)-lum((r,g,b))))
        pixels.append((*c,a))
    im.putdata(pixels);native=Image.new('RGBA',(32,32));native.paste(im,(8,11));mouths.append(native)
source=source_before('grazing-mouth');source['version']+=1
source['regions']=[{'id':'skin','protected':False,'colors':SKIN},{'id':'protected-detail','protected':True,'colors':oral}]
source['frames']=[{**f,'rgbaBase64':base64.b64encode(mouths[f['index']].rotate((2-f['facing'])*45,resample=Image.Resampling.NEAREST,center=(16,16)).tobytes()).decode()} for f in source['frames']]
source['authorship']='AI imagegen refined from creator GrazerMouth1.gif, fang-like candidate rejected/refined to blunt keratin pad; mechanical crop, nearest sampling, palette mapping and directional rotation.'
source['artReview']='Two generated mouth states, mechanically rotated facings; creator approval pending. Not eight separately painted views.'
(OUT/'grazing-mouth.candidate.json').write_text(json.dumps(source,separators=(',',':')))
sheet=Image.new('RGBA',(64,32))
for index,im in enumerate(mouths):sheet.paste(im,(index*32,0))
mouths[0].save(OUT/'grazing-mouth-native-candidate.png');sheet.resize((768,384),Image.Resampling.NEAREST).save(OUT/'grazing-mouth-native-inspection.png')
print('Prepared review candidates; no canonical artwork overwritten.')
