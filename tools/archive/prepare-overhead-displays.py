"""Prepare generated dorsal tissue; the native panel rig owns folding, not new pixels."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import base64,hashlib,json
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'assets/art/production-review/overhead-displays-v1'
BASE=ROOT/'reports/overhead-displays-before/assets/art/parts'
SKIN=[(23,42,44),(52,85,78),(105,154,129),(164,199,165),(221,229,195)]
ACCENT=[(191,136,101),(227,199,125),(247,232,186)]
def lum(c):return sum(v*k for v,k in zip(c,[.2126,.7152,.0722]))
sheet=Image.new('RGBA',(640,512),(12,25,22,255));draw=ImageDraw.Draw(sheet);font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',18);items=[]
for row,(part,size) in enumerate([('signal-crest',(20,20)),('display-frill',(24,24))]):
    master=OUT/f'{part}-master.png';im=Image.open(master).convert('RGBA');dimensions=im.size
    im.putalpha(im.getchannel('A').point(lambda a:255 if a>=128 else 0));bounds=im.getchannel('A').getbbox();assert bounds
    im=im.crop(bounds).resize(size,Image.Resampling.NEAREST);pixels=[]
    for r,g,b,a in im.get_flattened_data():
        if not a:c=(0,0,0)
        else:c=min(ACCENT if r>g*1.10 and r>b*1.2 else SKIN,key=lambda c:abs(lum(c)-lum((r,g,b))))
        pixels.append((*c,a))
    im.putdata(pixels);native=Image.new('RGBA',(32,32));native.paste(im,((32-size[0])//2,(32-size[1])//2))
    source=json.loads((BASE/f'{part}.json').read_text(encoding='utf-8'));source['version']+=1
    source['regions']=[{'id':'skin','protected':False,'colors':SKIN},{'id':'protected-detail','protected':True,'colors':[(0,0,0),*ACCENT]}]
    source['rig']={'kind':'dorsal-display','rootRect':[0,14,32,4],'panels':[[0,0,32,14],[0,18,32,14]],'foldedExtent':.28 if part=='signal-crest' else .30}
    source['frames']=[{**f,'rgbaBase64':base64.b64encode(native.rotate((2-f['facing'])*45,resample=Image.Resampling.NEAREST,center=(16,16)).tobytes()).decode()} for f in source['frames']]
    source['authorship']='Built-in imagegen overhead dorsal tissue, mechanically cropped/nearest sampled/palette mapped. Native panels fold from one deployed painting; original art preserved.'
    source['artReview']='Creator-approved camera direction; individual candidate visual approval remains separate. Two identical idle cells leave motion to funded display/physical-expression signals.'
    candidate=OUT/f'{part}.candidate.json';candidate.write_text(json.dumps(source,separators=(',',':')),encoding='utf-8');native.save(OUT/f'{part}.native.png')
    sheet.alpha_composite(native.resize((256,256),Image.Resampling.NEAREST),(0,row*256));draw.text((270,row*256+100),part,font=font,fill=(240,235,210))
    items.append({'part':part,'masterDimensions':dimensions,'cropBounds':bounds,'nativeBounds':size,'rig':source['rig'],'masterSha256':hashlib.sha256(master.read_bytes()).hexdigest(),'candidateSha256':hashlib.sha256(candidate.read_bytes()).hexdigest()})
sheet.save(OUT/'native-source-review.png');(OUT/'preparation-receipt.json').write_text(json.dumps({'schema':'genvo.imagegen-native-preparation/1','alphaThreshold':128,'sample':'nearest','oneDeployedPaintingPerPart':True,'biologicalChanges':False,'items':items},indent=2),encoding='utf-8')
print('Prepared two native dorsal-display sources; 32 exact source frames, not installed.')
