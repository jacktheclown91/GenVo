"""Aquatic surface detailing for existing indexed native parts; no geometry/rig changes.
Reuses every frame's exact alpha silhouette and palette. Paint is editable RGBA.
"""
from pathlib import Path
from PIL import Image
import base64, hashlib, json
R=Path(__file__).resolve().parents[1]; A=R/'assets/art'; cat=json.loads((A/'catalog.json').read_text())
IDS=['gill-slits','silt-fin','filter-mouth','reed-sieve-mouth']
for entry in cat['parts']:
 if entry['partId'] not in IDS: continue
 path=A/entry['path']; original=path.read_bytes(); assert hashlib.sha256(original).hexdigest()==entry['checksumSha256']
 source=json.loads(original); assert not source.get('surfaceRefinement'),'Already refined; refusing overwrite'
 # Retain all original art, mounts, timings, regions and inherited pigment authority.
 # Fine skin folds/fin rays are painted only on existing skin, never protected organs.
 skin=[tuple(c) for c in source['regions'][0]['colors']]; assert len(skin)==5
 changes=0
 for frame in source['frames']:
  raw=bytearray(base64.b64decode(frame['rgbaBase64'])); face=frame['facing']; phase=frame['index']
  # Work in the part's local horizontal plane, with light on the upper-left rim.
  import math
  angle=(face-2)*math.pi/4; co=math.cos(angle); si=math.sin(angle)
  for y in range(2,30):
   for x in range(2,30):
    at=(y*32+x)*4; rgb=tuple(raw[at:at+3]); alpha=raw[at+3]
    if not alpha or rgb not in skin or rgb==skin[0]: continue
    u=round((x-16)*co+(y-16)*si)+16; v=round(-(x-16)*si+(y-16)*co)+16
    tone=skin.index(rgb); new=tone
    k=entry['partId']
    if k=='gill-slits':
     # Three continuous lamellar folds, a soft attached root and broken dorsal glints.
     if u in (13,17,21) and 11<=v<=21: new=1
     elif u in (12,16,20) and 12<=v<=19: new=3
     elif v==12 and 12<=u<=21: new=4
    elif k=='silt-fin':
     # Membrane remains skin-tinted; branched rays distinguish it from a solid paddle.
     if abs((u-12)-(v-12)//2)<=0 and 11<=v<=23: new=3
     elif abs((u-16)+(v-14)//3)<=0 and 12<=v<=23: new=1
     elif v==13 and 14<=u<=19: new=4
    elif k=='filter-mouth':
     # Upper fleshy rim and alternating lower lip folds around the untouched sieve.
     if v==11 and 12<=u<=21: new=4
     elif v>=20 and u in (12,15,18,21): new=1
     elif u==11 and 13<=v<=18: new=3
    else:
     # Broad attached bill has a paired ridge; protected comb teeth remain unaltered.
     if v==13 and 11<=u<=20: new=4
     elif v==14 and 12<=u<=19: new=3
     elif v>=18 and u in (12,16,20): new=1
    if new!=tone: raw[at:at+3]=bytes(skin[new]); changes+=1
  frame['rgbaBase64']=base64.b64encode(raw).decode()
  if face==2 and phase==0: Image.frombytes('RGBA',(32,32),bytes(raw)).save(A/entry['png'])
 assert changes>0
 source['version']+=1; source['surfaceRefinement']={'revision':'aquatic-folds-2026-10-22','previousSourceSha256':entry['checksumSha256'],'changedSkinPixels':changes,'scope':'Skin-only lamellae, fin rays and feeding rim clusters. Exact alpha, protected pixels, mounts, frame keys and timing preserved. AI-assisted candidate; creator approval pending.'}
 data=json.dumps(source,separators=(',',':')).encode();path.write_bytes(data);entry['checksumSha256']=hashlib.sha256(data).hexdigest();entry['status']='aquatic-surface-review';print(entry['partId'],changes)
(A/'catalog.json').write_text(json.dumps(cat,indent=2)+'\n')
