"""Package a verified exported web folder plus current source; never overwrite archives."""
from pathlib import Path
import argparse,hashlib,json,zipfile,datetime,subprocess
from source_package_inventory import source_files
parser=argparse.ArgumentParser();parser.add_argument('--web',required=True);parser.add_argument('--out',required=True);parser.add_argument('--label',required=True);args=parser.parse_args()
root=Path(__file__).resolve().parents[1];web=Path(args.web).resolve();out=Path(args.out).resolve()
if root==web or root in web.parents:raise SystemExit('Export staging must be outside canonical source')
if root/'builds' not in out.parents:raise SystemExit('Artifact output must be a named folder inside workspace builds')
if not (out/'build-browser-proof.json').exists():raise SystemExit('Verify exported browser build before packaging')
proof=json.loads((out/'build-browser-proof.json').read_text());assert proof['status']=='PASS'
out.mkdir(parents=True,exist_ok=True)
def digest(data):return hashlib.sha256(data).hexdigest()
def records(base,files):return [{'path':p.relative_to(base).as_posix(),'bytes':p.stat().st_size,'sha256':digest(p.read_bytes())} for p in sorted(files,key=lambda p:p.relative_to(base).as_posix())]
runtime=records(web,[p for p in web.rglob('*') if p.is_file()])
for r in runtime:assert (web/r['path']).read_bytes()==(root/r['path']).read_bytes(),r['path']
revision=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
manifest={'schema':'genvo.development-build/2','title':'GenVo','buildId':args.label,'status':'development','generatedAtUtc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sourceRevision':revision,'sourceHasPendingChanges':bool(subprocess.check_output(['git','status','--porcelain'],cwd=root)),'runtimeFileCount':len(runtime),'runtimeModules':sum(r['path'].startswith('src/') for r in runtime),'sourceParity':'Every exported runtime file byte-matches canonical source','runtimePayloadSha256':digest(''.join(r['path']+'\0'+r['sha256']+'\n' for r in runtime).encode()),'runtimeFiles':runtime,'limits':['Development checkpoint; automated checks do not imply creator acceptance.','See docs/CURRENT-IMPLEMENTATION.md for evidence and unfinished mechanisms.','Local snapshots and ignored raw outputs are excluded; see docs/LOCAL-CHECKPOINT-MANIFEST.json.']}
(web/'README.txt').write_text('GenVo development browser export\nServe this directory with python -m http.server 8000 and open http://localhost:8000/.\nBuild: '+args.label+'\nSource revision: '+revision+'\nDevelopment checkpoint; creator and integrated milestone acceptance are separate.\nSee the source package README.md and docs/CURRENT-IMPLEMENTATION.md.\n',encoding='utf-8')
# Match Git inclusion rules; never recursively sweep ignored snapshots/logs.
selected=source_files(root)
source=records(root,selected);manifest['sourceFileCount']=len(source);manifest['sourcePayloadSha256']=digest(''.join(r['path']+'\0'+r['sha256']+'\n' for r in source).encode());manifest['sourceFiles']=source
(web/'build-manifest.json').write_text(json.dumps({k:v for k,v in manifest.items() if k!='sourceFiles'},indent=2),encoding='utf-8');(out/'build-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
def archive(name,base,files):
 target=out/name
 with zipfile.ZipFile(target,'x',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
  for p in files:z.write(p,p.relative_to(base).as_posix())
 with zipfile.ZipFile(target) as z:
  assert z.testzip() is None
  assert 'index.html' in z.namelist()
  for p in files:assert digest(z.read(p.relative_to(base).as_posix()))==digest(p.read_bytes())
 checksum=digest(target.read_bytes());(out/(name+'.sha256')).write_text(checksum+'  '+name+'\n',encoding='utf-8');return{'file':name,'bytes':target.stat().st_size,'sha256':checksum}
packages=[archive(args.label+'-web.zip',web,[p for p in web.rglob('*') if p.is_file()]),archive(args.label+'-source.zip',root,selected)]
(out/'package-receipt.json').write_text(json.dumps({'status':'PASS','packages':packages,'runtimeFileCount':len(runtime),'sourceFileCount':len(source),'archiveIntegrity':'All ZIP entries and content hashes verified'},indent=2),encoding='utf-8');print(json.dumps(packages,indent=2))
