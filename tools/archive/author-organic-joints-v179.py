from pathlib import Path
import json,base64,hashlib,shutil,math
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[1];art=root/'assets/art';backup=root/'reports/native-joints-before-v179';backup.mkdir(parents=True,exist_ok=True)
parts=['walking-leg','runner-leg','spring-leg','sturdy-leg','padded-leg','webbed-leg','grasper','digging-forelimb'];colors=[(23,42,44,255),(52,85,78,255),(105,154,129,255),(164,199,165,255),(221,229,195,255)]
cat=json.loads((art/'catalog.json').read_text(encoding='utf-8'));samples=[]
for part in parts:
 path=art/'parts'/f'{part}.json';spec=json.loads((backup/path.name if (backup/path.name).exists() else path).read_text(encoding='utf-8'))
 for suffix in ['.json','.png','.indexed.json']:
  src=art/'parts'/f'{part}{suffix}';dst=backup/src.name
  if src.exists() and not dst.exists():shutil.copy2(src,dst)
 for frame in spec['frames']:
  im=Image.frombytes('RGBA',(32,32),base64.b64decode(frame['rgbaBase64']));d=ImageDraw.Draw(im)
  # Rounded muscle insertion at the hip and matching fleshy surfaces on both
  # ends of the knee. Keep the distal foot and its anatomical material intact.
  thick=part in ['sturdy-leg','padded-leg','digging-forelimb'];r=4 if thick else 3
  for cx,cy,hip in [(3,8,True),(28,8,False),(3,24,False)]:
   ry=r+(1 if hip else 0)
   d.polygon([(cx-r,cy-1),(cx-r+1,cy-ry+1),(cx,cy-ry),(cx+r,cy-1),(cx+r,cy+1),(cx+1,cy+ry),(cx-r+1,cy+ry-1)],fill=colors[0])
   d.polygon([(cx-r+1,cy-1),(cx-r+2,cy-ry+2),(cx,cy-ry+1),(cx+r-1,cy),(cx,cy+ry-1),(cx-r+2,cy+ry-2)],fill=colors[2])
   d.line([(cx-r+1,cy+1),(cx-1,cy+ry-1),(cx+1,cy+ry-1)],fill=colors[1],width=1)
   d.line([(cx-r+2,cy-1),(cx-1,cy-ry+2),(cx+1,cy-ry+2)],fill=colors[3],width=1)
   # Soft insertion folds differ between flexed and support frames.
   if frame['index']%2:d.line([(cx,cy),(cx+1,cy+1),(cx,cy+2)],fill=colors[1])
  frame['rgbaBase64']=base64.b64encode(im.tobytes()).decode()
  if frame['facing']==2 and frame['index']==0:im.save(path.with_suffix('.png'));samples.append((part,im.copy()))
 spec['artReview']='v1.79 organic joint tissue candidate; creator approval pending';data=json.dumps(spec,separators=(',',':'));path.write_text(data,encoding='utf-8')
 entry=next(e for e in cat['parts'] if e['partId']==part);entry['checksumSha256']=hashlib.sha256(data.encode()).hexdigest();entry['status']='development-review-v179-joints'
(art/'catalog.json').write_text(json.dumps(cat,indent=2)+'\n',encoding='utf-8')
out=Image.new('RGB',(4*160,2*165),'#29453f');d=ImageDraw.Draw(out)
for i,(part,im) in enumerate(samples):
 tile=Image.new('RGBA',(32,32),'#29453f');tile.alpha_composite(im);x=i%4*160;y=i//4*165;out.paste(tile.resize((128,128),Image.Resampling.NEAREST).convert('RGB'),(x+16,y));d.text((x+6,y+135),part,fill='#dfdfc6')
out.save(root/'docs/native-organic-joints-v179.png');print('Authored 8 native joint assets, original sources retained')
