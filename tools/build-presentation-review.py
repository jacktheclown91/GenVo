"""Build an explicitly curated review companion beside an exact public export."""
from pathlib import Path
import argparse,hashlib,json,html,shutil,subprocess
root=Path(__file__).resolve().parents[1]
a=argparse.ArgumentParser();a.add_argument('--out',required=True);args=a.parse_args();out=Path(args.out).resolve()
if out==root or root in out.parents:raise SystemExit('Review destination must be outside source')
if out.exists() and any(out.iterdir()):raise SystemExit('Destination must be empty; no overwrite')
if subprocess.check_output(['git','status','--porcelain','--untracked-files=no'],cwd=root).strip():raise SystemExit('Use a clean committed checkout')
if subprocess.check_output(['git','ls-files','--others','--exclude-standard','--','src','assets','tools/creature-lab'],cwd=root).strip():raise SystemExit('Untracked runtime files are not a committed snapshot')
tracked=set(subprocess.check_output(['git','ls-files'],cwd=root).decode().splitlines());selection=json.loads((root/'docs/presentation-review-2026-10-24/selection.json').read_text(encoding='utf-8'))
for item in selection['items']:
 for key in ['before','after']:
  if key in item and item[key] not in tracked:raise SystemExit('Review image is not Git-backed: '+item[key])
if selection['audio']['source'] not in tracked:raise SystemExit('Audio candidate is not Git-backed')
out.mkdir(parents=True,exist_ok=True);(out/'media').mkdir();records=[]
def copy(source,name):
 data=(root/source).read_bytes();dest=out/'media'/name;dest.write_bytes(data);records.append({'source':source,'path':'media/'+name,'sha256':hashlib.sha256(data).hexdigest()});return 'media/'+name
cards=[]
for item in selection['items']:
 images=[]
 for key in ['before','after']:
  if key in item:
   url=copy(item[key],item['id']+'-'+key+'.png');images.append('<figure><a href="'+url+'"><img src="'+url+'" alt="'+html.escape(item['title']+' / '+key)+'"></a><figcaption>'+('Original' if key=='before' else 'Refined / observed')+'</figcaption></figure>')
 cards.append('<section><h2>'+html.escape(item['title'])+'</h2><p>'+html.escape(item['scope'])+'</p><small>Capture source: '+html.escape(item['revision'])+'</small><div class="pair">'+''.join(images)+'</div></section>')
audio=copy(selection['audio']['source'],'contact-candidates.wav');revision=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root).decode().strip()
(out/'index.html').write_text('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GenVo presentation review</title><style>body{margin:0;background:#102219;color:#e9e2c5;font:17px/1.55 Georgia,serif}main{max-width:1120px;margin:auto;padding:24px}h1,h2{color:#d8c584}a{color:#dcebb5}nav{display:flex;gap:20px;flex-wrap:wrap}section{padding:24px 0;border-top:1px solid #586447}.pair{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));gap:20px}figure{margin:16px 0}img{width:100%;height:auto;image-rendering:pixelated}small,figcaption{color:#b9c3a3}audio{max-width:100%}code{overflow-wrap:anywhere}@media(max-width:480px){main{padding:16px}}</style><main><h1>GenVo · presentation review</h1><p>A development checkpoint from committed source. This guide separates actual gameplay evidence, authored fixtures and unfinished integration. It records no creator approval.</p><nav><a href="game/">Play checkpoint</a><a href="game/?day=30">Play 30-second-day survival opt-in</a><a href="review-manifest.json">Evidence manifest</a></nav><p>The second play link enables the existing survival policy opt-in. This is not a stable release or the new canonical repository migration.</p><small>Committed source: <code>'+revision+'</code></small>'+''.join(cards)+'<section><h2>Contact sound candidates</h2><p>'+html.escape(selection['audio']['scope'])+'</p><audio controls preload="none" src="'+audio+'"></audio></section><section><h2>Still open</h2><p>Creator art and listening acceptance, real-GPU and sustained performance, broader natural seasonal journeys, gameplay integration and the full v1 completion audit. Earlier images carry their own source revisions; they do not assert current-frame or whole-game completion.</p></section></main></html>',encoding='utf-8')
subprocess.run(['node',str(root/'tools/export-public.mjs'),str(out/'game')],cwd=root,check=True)
(out/'review-manifest.json').write_text(json.dumps({'schema':'genvo.presentation-review/1','sourceRevision':revision,'builderSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'runtimePolicy':'Exact committed runtime; export graph controls game inclusion. Review-only media remains outside game/.','selection':selection,'media':records,'creatorAcceptance':False},indent=2),encoding='utf-8')
print(json.dumps({'output':str(out),'media':len(records),'revision':revision}))
