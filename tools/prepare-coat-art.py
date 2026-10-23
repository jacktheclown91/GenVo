"""Mechanical native coat preparation; exact original inner-body clearance retained."""
from pathlib import Path
from PIL import Image
import json,base64,hashlib
R=Path(__file__).resolve().parents[1];A=R/'assets/art';D=A/'production-review/coats-v1';catalog=json.loads((A/'catalog.json').read_text())
for id,name,size,offset in [('fur-mantle','fur',(26,22),(3,5)),('feather-mantle','feather',(22,24),(5,4))]:
 baseline=(D/(id+'-baseline.json')).read_bytes();source=json.loads(baseline);entry=next(p for p in catalog['parts'] if p['partId']==id);current=(A/entry['path']).read_bytes();assert hashlib.sha256(current).hexdigest()==entry['checksumSha256'];assert json.loads(current)['version'] in [source['version'],source['version']+1],'Refusing to overwrite a newer coat revision';master=D/(name+'-master.png');im=Image.open(master).convert('RGBA');alpha=im.getchannel('A').point(lambda a:255 if a>=128 else 0);im.putalpha(alpha);box=alpha.getbbox();assert box
 skin=source['regions'][0]['colors'];fixed=source['regions'][1]['colors'];is_fixed=lambda r,g,b:r-b>25 and r-g>5
 accent=im.copy();accent.putdata([(r,g,b,a) if a and is_fixed(r,g,b) else (0,0,0,0) for r,g,b,a in im.get_flattened_data()]);coverage=accent.crop(box).resize(size,Image.Resampling.BOX);im=im.crop(box).resize(size,Image.Resampling.NEAREST);pixels=[]
 for (r,g,b,a),(kr,kg,kb,cov) in zip(im.get_flattened_data(),coverage.get_flattened_data()):
  protected=is_fixed(r,g,b) or cov>=64;palette=fixed if protected else skin;rgb=(kr,kg,kb) if protected and cov>=64 else (r,g,b);color=min(palette,key=lambda c:sum((v-q)**2 for v,q in zip(c,rgb))) if a else skin[0];pixels.append((*color,a))
 im.putdata(pixels);fill=tuple(skin[0])+(0,);base=Image.new('RGBA',(32,32),fill);base.paste(im,offset);quiet=base.transform((32,32),Image.Transform.AFFINE,(1,0,0,0,1,-1),resample=Image.Resampling.NEAREST,fillcolor=fill)
 for f in source['frames']:
  prior=base64.b64decode(f['rgbaBase64']);art=(base if f['index']==0 else quiet).rotate((2-f['facing'])*45,resample=Image.Resampling.NEAREST,center=(16,16),fillcolor=fill)
  for y in range(32):
   for x in range(32):
    if (x-16)**2+(y-16)**2<=36 and prior[(y*32+x)*4+3]==0:art.putpixel((x,y),fill)
  assert art.getpixel((16,16))[3]==0;assert all(art.getpixel((x,y))[3]==0 for y in range(32) for x in range(32) if x in (0,31) or y in (0,31)),id+' clipping';f['rgbaBase64']=base64.b64encode(art.tobytes()).decode()
 source['version']+=1;source['authorship']='Built-in imagegen overhead coat components, mechanical native32 sampling and original indexed palette roles. Original root/socket/display/frame timing retained, with all original inner-body transparent samples inside six native pixels preserved. Creator acceptance pending.';source['nativeCoatArt']={'revision':'native-coat-surface/1','masterSha256':hashlib.sha256(master.read_bytes()).hexdigest(),'previousSourceSha256':hashlib.sha256(baseline).hexdigest(),'scope':'Inherited coat paint, original inner-body clearance; no biological thermal/coat-density authority change.'};raw=json.dumps(source,separators=(',',':')).encode();(A/entry['path']).write_bytes(raw);entry['checksumSha256']=hashlib.sha256(raw).hexdigest();entry['status']='native-coat-surface-review';native0=Image.frombytes('RGBA',(32,32),base64.b64decode(next(f for f in source['frames'] if f['facing']==2 and f['index']==0)['rgbaBase64']));native1=Image.frombytes('RGBA',(32,32),base64.b64decode(next(f for f in source['frames'] if f['facing']==2 and f['index']==1)['rgbaBase64']));native0.save(A/entry['png']);native0.save(D/(name+'-native.png'));native1.save(D/(name+'-rest-native.png'));print(id,'native overhead coat prepared')
(A/'catalog.json').write_bytes((json.dumps(catalog,indent=2)+'\n').encode())
