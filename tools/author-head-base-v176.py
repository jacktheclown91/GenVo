from pathlib import Path
from PIL import Image,ImageDraw
import json,base64,hashlib,math
root=Path('.');path=root/'assets/art/parts/head-base.json';colors=[(23,42,44),(52,85,78),(105,154,129),(164,199,165),(221,229,195)]
frames=[]
for facing in range(8):
 for index in range(2):
  im=Image.new('RGBA',(32,32));d=ImageDraw.Draw(im)
  d.polygon([(6,14),(8,9),(13,6),(20,7),(25,11),(27,16),(25,22),(20,25),(12,24),(7,20)],fill=colors[0]+(255,))
  d.polygon([(8,14),(10,10),(14,8),(20,9),(24,12),(25,17),(23,21),(19,23),(12,22),(9,19)],fill=colors[2]+(255,))
  d.polygon([(8,17),(13,20),(20,20),(25,17),(23,22),(19,23),(12,22),(9,19)],fill=colors[1]+(255,))
  d.polygon([(9,13),(13,9),(19,9),(22,12),(19,14),(13,15)],fill=colors[3]+(255,))
  d.line([(12,11+index),(15,10+index),(18,11)],fill=colors[4]+(255,),width=1)
  d.line([(15,19),(19,19),(22,17)],fill=colors[1]+(255,),width=1)
  im=im.rotate((2-facing)*45,resample=Image.Resampling.NEAREST,center=(16,16))
  frames.append({'facing':facing,'state':'idle','index':index,'durationMs':650 if index==0 else 350,'rgbaBase64':base64.b64encode(im.tobytes()).decode()})
  if facing==2 and index==0:im.save(path.with_suffix('.png'))
spec={'schema':'genvo.part-art-source/1','partId':'head-base','version':1,'width':32,'height':32,'displayScale':1,'rootAnchorPx':[16,16],'rig':{'kind':'head','bodyBoundsPx':[24,22]},'regions':[{'id':'skin','protected':False,'colors':[list(c) for c in colors]},{'id':'protected-detail','protected':True,'colors':[[0,0,0]]}],'frames':frames,'artReview':'v1.76 modular head-base candidate; creator approval pending','authorship':'AI-assisted native anatomy following creator organic-body direction; original references preserved'}
text=json.dumps(spec,separators=(',',':'));path.write_text(text)
catpath=root/'assets/art/catalog.json';cat=json.loads(catpath.read_text());entry={'partId':'head-base','path':'./parts/head-base.json','png':'./parts/head-base.png','checksumSha256':hashlib.sha256(text.encode()).hexdigest(),'status':'development-review-v176-head'}
cat['parts']=[e for e in cat['parts'] if e['partId']!='head-base']+[entry];catpath.write_text(json.dumps(cat,indent=2)+'\n')
