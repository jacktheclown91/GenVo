"""Prepare generated near-vertical paintings; no primitive illustration or whole bodies.
Native32, exact pigment roles and current anatomy/frame/mount metadata are retained.
"""
from pathlib import Path
from PIL import Image
import json,base64
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'assets/art/production-review/overhead-v1'
SKIN=[(23,42,44),(52,85,78),(105,154,129),(164,199,165),(221,229,195)]
def lum(c):return sum(v*k for v,k in zip(c,[.2126,.7152,.0722]))
def crop(im):
    im=im.convert('RGBA');mask=im.getchannel('A').point(lambda a:255 if a>=128 else 0);im.putalpha(mask);return im.crop(mask.getbbox())
def center(im,size):
    im=crop(im).resize(size,Image.Resampling.NEAREST);out=Image.new('RGBA',(32,32));out.paste(im,((32-size[0])//2,(32-size[1])//2));return out
def mapped(im,kind):
    pixels=[]
    for r,g,b,a in im.get_flattened_data():
        if not a:c=(0,0,0)
        elif kind=='mouth' and lum((r,g,b))<43:c=(16,29,32)
        elif kind=='mouth' and r>=g*.94 and r>b*1.12 and lum((r,g,b))>160:c=(225,219,183)
        elif kind=='fin' and r>g*1.16 and r>b*1.23:
            c=min([(118,67,57),(193,136,101),(247,232,186)],key=lambda c:abs(lum(c)-lum((r,g,b))))
        else:c=min(SKIN,key=lambda c:abs(lum(c)-lum((r,g,b))))
        pixels.append((*c,a))
    im.putdata(pixels);return im
def finish(part,frames,detail,authorship):
    source=json.loads((ROOT/'reports/overhead-before/assets/art/parts'/f'{part}.json').read_text());source['version']+=1
    if detail is not None:source['regions']=[{'id':'skin','protected':False,'colors':SKIN},{'id':'protected-detail','protected':True,'colors':detail}]
    source['frames']=[{**f,'rgbaBase64':base64.b64encode(frames[f['index']].rotate((2-f['facing'])*45,resample=Image.Resampling.NEAREST,center=(16,16)).tobytes()).decode()} for f in source['frames']]
    source['authorship']=authorship;source['artReview']='Near-vertical overhead correction, eight horizontal-plane rotations. Creator visual approval remains separate.'
    (OUT/f'{part}.candidate.json').write_text(json.dumps(source,separators=(',',':')))
    frames[0].save(OUT/f'{part}.native.png');sheet=Image.new('RGBA',(64,32));sheet.paste(frames[0],(0,0));sheet.paste(frames[1],(32,0));sheet.resize((768,384),Image.Resampling.NEAREST).save(OUT/f'{part}.inspection.png')
master=Image.open(OUT/'grazing-mouth-master.png');w,h=master.size
mouth=[mapped(center(master.crop((i*w//2,0,(i+1)*w//2,h)),(18,12)),'mouth') for i in range(2)]
finish('grazing-mouth',mouth,[(0,0,0),(16,29,32),(225,219,183)],'Built-in imagegen dorsal soft grazing margins and blunt leading pads; mechanically prepared native32 and rotated in world plane. Creator lip/dark-center idea retained; former frontal drawing preserved in baseline.')
fin=mapped(center(Image.open(OUT/'sail-fin-master.png'),(20,6)),'fin')
finish('sail-fin',[fin,fin.copy()],[(0,0,0),(118,67,57),(193,136,101),(247,232,186)],'Built-in imagegen near-vertical narrow dorsal fin ridge, crop/nearest/pigment preparation; shared idle paint, actual controller still owns funded crest articulation. Prior standing side silhouette preserved.')
eye_source=json.loads((ROOT/'reports/overhead-before/assets/art/parts/simple-eye.json').read_text())
eye=[Image.frombytes('RGBA',(32,32),base64.b64decode(next(f for f in eye_source['frames'] if f['facing']==2 and f['index']==i)['rgbaBase64'])) for i in range(2)]
finish('simple-eye',eye,None,'Creator AmphibianEye1-guided imagegen painting retained; world-plane rotation corrects formerly screen-fixed oval orientation. Exact east-facing and blink pixels preserved.')
print('Prepared dorsal mouth/fin sources and directional eye correction; no anatomy installed.')
