"""Mechanically prepare generated canopy/crown paintings; no primitive illustration."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import hashlib,json,re
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'assets/art/production-review/overhead-flora-v1'
LEAF=[(23,44,34),(49,76,48),(84,116,68),(129,164,94),(190,211,140)]
FRUIT=[(101,36,62),(166,53,89),(220,100,127)]
SHELL=[(117,99,61),(169,144,82),(200,175,98),(223,196,125)]
PALETTE=[(0,0,0),*LEAF,*FRUIT,*SHELL]
def lum(c):return sum(v*k for v,k in zip(c,[.2126,.7152,.0722]))
def native(cell,size,family):
    cell=cell.convert('RGBA');cell.putalpha(cell.getchannel('A').point(lambda a:255 if a>=128 else 0));bounds=cell.getchannel('A').getbbox();assert bounds
    cell=cell.crop(bounds).resize(size,Image.Resampling.NEAREST);result=Image.new('RGBA',(32,32));result.paste(cell,((32-size[0])//2,(32-size[1])//2));indices=[]
    for r,g,b,a in result.get_flattened_data():
        if not a:indices.append(0);continue
        if family=='shrub' and r>g*1.5 and b>g*1.2:choices,offset=FRUIT,6
        elif family in ['shrub','pod'] and r>g*1.08 and r>b*1.2:choices,offset=SHELL,9
        else:choices,offset=LEAF,1
        indices.append(offset+min(range(len(choices)),key=lambda i:abs(lum(choices[i])-lum((r,g,b)))))
    return indices,bounds
specs=[('shrub','berry-shrub',2,(26,26)),('reed','reed-crown',1,(26,26)),('pod','seed-pods',3,(26,26)),('fungus','mushroom-caps',1,(24,24)),('seedling','seedling',1,(14,10))]
data={};records=[];sheet=Image.new('RGBA',(1024,5*288),(12,25,22,255));draw=ImageDraw.Draw(sheet);font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',18)
for row,(family,name,count,size) in enumerate(specs):
    master=OUT/f'{name}-master.png';im=Image.open(master);w,h=im.size;frames=[];boxes=[]
    for i in range(count):
        frame,box=native(im.crop((i*w//count,0,(i+1)*w//count,h)),size,family);frames.append(frame);boxes.append(box)
    if family=='shrub':frames[1]=[new if 6<=new<=8 else old for old,new in zip(frames[0],frames[1])]
    if family=='pod':
        base=frames[1][:];frames=[[new if new>=9 or old>=9 else old for old,new in zip(base,f)] for f in frames]
    data[family]={'pivot':[16,16],'frames':frames}
    for i,frame in enumerate(frames):
        out=Image.new('RGBA',(32,32));out.putdata([(*(PALETTE[p] if family!='fungus' or p>5 else [(0,0,0),(69,62,53),(115,100,79),(160,141,107),(198,180,138),(226,212,175)][p]),255 if p else 0) for p in frame]);out.save(OUT/f'{family}-{i}.native.png');sheet.alpha_composite(out.resize((256,256),Image.Resampling.NEAREST),(i*256,row*288))
    draw.text((8,row*288+260),family,font=font,fill=(240,235,210));records.append({'family':family,'masterDimensions':im.size,'cropBounds':boxes,'nativeBounds':size,'visiblePixels':[sum(p>0 for p in f) for f in frames],'masterSha256':hashlib.sha256(master.read_bytes()).hexdigest()})
# Retain the existing moss painting and its original pixel placement. Only its palette
# indices are prepared for the shared renderer; the preserved source module is untouched.
raw=json.loads((ROOT/'assets/art/environment/moss.js').read_text(encoding='utf-8').split('export const mossFrames=')[1].strip().removesuffix(';'))[0]
data['tuft']={'pivot':[16,23],'frames':[[0 if not raw[i+3] else 1+min(range(5),key=lambda j:abs(lum(LEAF[j])-lum(raw[i:i+3]))) for i in range(0,len(raw),4)]]}
target=ROOT/'assets/art/environment/overhead-flora.js';target.write_text('// Generated-image tissue mechanically prepared by tools/prepare-overhead-flora.py.\nexport const overheadFlora='+json.dumps(data,separators=(',',':'))+';\n',encoding='utf-8')
sheet.save(OUT/'native-source-review.png');(OUT/'preparation-receipt.json').write_text(json.dumps({'schema':'genvo.overhead-flora-preparation/1','alphaThreshold':128,'sample':'nearest','palette':PALETTE,'materials':{'foliage':[1,5],'fruit':[6,8],'shellOrWood':[9,12]},'registeredShrubFoliage':True,'registeredPodFoliageOutsideCapsuleRegion':True,'preservedMossShape':True,'runtimeDataSha256':hashlib.sha256(target.read_bytes()).hexdigest(),'items':records},indent=2),encoding='utf-8')
print('Prepared overhead flora data and native inspections; no simulation or renderer changed.')
