"""Mechanical preparation of generated dorsal jaw paintings; no new drawn anatomy."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import base64, hashlib, json

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/art/production-review/overhead-jaws-v1'
BASE = ROOT / 'reports/overhead-jaws-before/assets/art/parts'
SKIN = [(23,42,44),(52,85,78),(105,154,129),(164,199,165),(221,229,195)]
IVORY = [(165,157,120),(225,219,183),(244,239,207)]
DARK, LINING = (16,29,32), (128,89,101)
SIZES = {'tearing-jaw':(20,14),'crushing-jaw':(18,16),'gape-mouth':(20,14),'tusk-jaw':(22,16)}

def lum(c): return sum(v*k for v,k in zip(c,[.2126,.7152,.0722]))
def sample(cell, size, part):
    cell=cell.convert('RGBA');cell.putalpha(cell.getchannel('A').point(lambda a:255 if a>=128 else 0))
    bounds=cell.getchannel('A').getbbox();assert bounds
    cell=cell.crop(bounds).resize(size,Image.Resampling.NEAREST)
    colors=[]
    for r,g,b,a in cell.get_flattened_data():
        if not a:c=(0,0,0)
        elif (part=='gape-mouth' or part=='tusk-jaw') and r>g*1.15 and b>g*.91:c=LINING
        elif part!='gape-mouth' and r>g*1.025 and g>b*1.045 and lum((r,g,b))>115:c=min(IVORY,key=lambda c:abs(lum(c)-lum((r,g,b))))
        elif lum((r,g,b))<39:c=DARK
        else:c=min(SKIN,key=lambda c:abs(lum(c)-lum((r,g,b))))
        colors.append((*c,a))
    cell.putdata(colors);result=Image.new('RGBA',(32,32));result.paste(cell,((32-size[0])//2,(32-size[1])//2))
    return result,bounds

sheet=Image.new('RGBA',(768,4*256),(12,25,22,255));draw=ImageDraw.Draw(sheet)
font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',18);items=[]
for row,(part,size) in enumerate(SIZES.items()):
    master=OUT/(part+'-master.png');im=Image.open(master);w,h=im.size
    frames=[];bounds=[]
    for index in [0,1]:
        native,box=sample(im.crop((index*w//2,0,(index+1)*w//2,h)),size,part);frames.append(native);bounds.append(box)
    # Register both generated states to a stable painted attachment. Only adopt the
    # generated working end; do not make the rear cheek or rigid tusks oscillate.
    active=frames[0].copy();region=(14,0,32,32) if part!='tusk-jaw' else (16,14,24,19)
    active.paste(frames[1].crop(region),region[:2]);frames[1]=active
    if part=='tusk-jaw':
        for y in range(32):
            for x in range(32):
                if frames[0].getpixel((x,y))[:3] in IVORY:frames[1].putpixel((x,y),frames[0].getpixel((x,y)))
    source=json.loads((BASE/(part+'.json')).read_text(encoding='utf-8'));source['version']+=1
    source['expressionScale']='fixed'
    source['regions']=[{'id':'skin','protected':False,'colors':SKIN},{'id':'protected-detail','protected':True,'colors':[(0,0,0),DARK,LINING,*IVORY]}]
    source['frames']=[{**f,'rgbaBase64':base64.b64encode(frames[f['index']].rotate((2-f['facing'])*45,resample=Image.Resampling.NEAREST,center=(16,16)).tobytes()).decode()} for f in source['frames']]
    source['authorship']='Built-in imagegen dorsal jaw paintings; alpha threshold, crop, nearest native sampling, palette mapping, registered working-end animation and planar rotations. Existing originals preserved.'
    source['artReview']='Near-vertical overhead jaw pass; native registration and runtime review separate from creator visual approval.'
    candidate=OUT/(part+'.candidate.json');candidate.write_text(json.dumps(source,separators=(',',':')),encoding='utf-8')
    for index,frame in enumerate(frames):
        frame.save(OUT/f'{part}-{index}.native.png');sheet.alpha_composite(frame.resize((256,256),Image.Resampling.NEAREST),(index*256,row*256))
    draw.text((520,row*256+80),part,font=font,fill=(240,235,210))
    items.append({'part':part,'masterDimensions':im.size,'sourceCropBounds':bounds,'nativeBounds':size,'activeRegion':region,'masterSha256':hashlib.sha256(master.read_bytes()).hexdigest(),'candidateSha256':hashlib.sha256(candidate.read_bytes()).hexdigest()})
sheet.save(OUT/'native-source-review.png')
(OUT/'preparation-receipt.json').write_text(json.dumps({'schema':'genvo.imagegen-native-preparation/1','grid':[32,32],'alphaThreshold':128,'sample':'nearest','registeredAttachment':True,'rigidTuskPixelsPreserved':True,'biologicalChanges':False,'items':items},indent=2),encoding='utf-8')
print('Prepared four registered native jaw candidates, 64 frames; not installed.')
