"""Archive only a browser-proven generated review/export bundle; no source sweep."""
from pathlib import Path
import argparse,json,hashlib,zipfile
p=argparse.ArgumentParser();p.add_argument('--bundle',required=True);p.add_argument('--proof',required=True);p.add_argument('--zip',required=True);a=p.parse_args();root=Path(a.bundle).resolve();proof=json.loads(Path(a.proof).read_text(encoding='utf-8'));target=Path(a.zip).resolve()
assert proof['status']=='PASS' and proof['bundleName']==root.name
assert not target.exists(),'No archive overwrite'
assert not (target==root or root in target.parents),'ZIP must be outside bundle'
manifest=json.loads((root/'review-manifest.json').read_text(encoding='utf-8'));assert manifest['sourceRevision']==proof['sourceRevision']
sha=lambda b:hashlib.sha256(b).hexdigest()
assert sha((root/'index.html').read_bytes())==proof['reviewIndexSha256']
files={'index.html':proof['reviewIndexSha256'],'review-manifest.json':sha((root/'review-manifest.json').read_bytes())}
for row in [*manifest['media'],*proof['runtimeFiles']]:
 name=row['path'];f=(root/name).resolve();assert root in f.parents and f.is_file();assert sha(f.read_bytes())==row['sha256'];files[name]=row['sha256']
assert len(files)==len(manifest['media'])+len(proof['runtimeFiles'])+2
# Generated output only: reject additional files rather than silently package them.
assert {f.relative_to(root).as_posix() for f in root.rglob('*') if f.is_file()}==set(files)
target.parent.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(target,'x',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for name in sorted(files):
  info=zipfile.ZipInfo(name,(2026,10,24,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o644<<16;z.writestr(info,(root/name).read_bytes(),compress_type=zipfile.ZIP_DEFLATED,compresslevel=6)
with zipfile.ZipFile(target) as z:
 assert z.testzip() is None and set(z.namelist())==set(files)
 for name,digest in files.items():assert sha(z.read(name))==digest
receipt={'schema':'genvo.presentation-review-package/1','status':'PASS','sourceRevision':manifest['sourceRevision'],'files':len(files),'zip':target.name,'bytes':target.stat().st_size,'sha256':sha(target.read_bytes()),'scope':'Read-only curated presentation review plus exact browser-proven development export. Not stable release, source migration or creator acceptance.'}
target.with_suffix(target.suffix+'.sha256').write_text(receipt['sha256']+'  '+target.name+'\n',encoding='utf-8');target.with_suffix(target.suffix+'.receipt.json').write_text(json.dumps(receipt,indent=2),encoding='utf-8');print(json.dumps(receipt))
