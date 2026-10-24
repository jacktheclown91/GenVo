"""Check standalone contact sound production; never claims gameplay integration."""
from pathlib import Path
import hashlib,json,subprocess,sys,wave
import numpy as np
root=Path(__file__).resolve().parents[1];base=root/"docs/art-refinement-contact-audio-v1-2026-10-24";rebuilt=root/"reports/contact-audio-v1/rebuilt"
subprocess.run([sys.executable,str(root/"tools/generate_contact_audio_review.py"),str(rebuilt)],check=True)
m=json.loads((base/"manifest.json").read_text());assert len(m["entries"])==12
assert m["sourceSha256"]==hashlib.sha256((root/"tools/generate_contact_audio_review.py").read_bytes()).hexdigest()
assert m["dspSha256"]==hashlib.sha256((root/"tools/generate_audio_assets.py").read_bytes()).hexdigest()
arrays={};stats=[]
for e in m["entries"]:
 p=base/e["file"];raw=p.read_bytes();assert hashlib.sha256(raw).hexdigest()==e["sha256"];assert raw==(rebuilt/e["file"]).read_bytes()
 with wave.open(str(p)) as f:
  assert (f.getnchannels(),f.getsampwidth(),f.getframerate())==(1,2,22050);assert f.getnframes()==7056;x=np.frombuffer(f.readframes(f.getnframes()),dtype="<i2").astype(float)/32768
 peak=float(np.max(abs(x)));rms=float(np.sqrt(np.mean(x*x)));assert .2<peak<.9 and .02<rms<.30;assert abs(float(np.mean(x)))<.01;assert max(abs(x[0]),abs(x[-1]))<.002
 arrays[e["file"]]=x;stats.append(dict(file=e["file"],peak=peak,rms=rms,sha256=e["sha256"]))
assert len({e["sha256"] for e in m["entries"]})==12
for surface in ["soil","litter","snow","shallow-water"]:
 a=[arrays[f"{surface}-{i}.wav"] for i in [1,2,3]]
 for i in range(3):
  for j in range(i):assert abs(float(np.dot(a[i],a[j])/np.sqrt(np.dot(a[i],a[i])*np.dot(a[j],a[j]))))<.99
assert sum(e["bytes"] for e in m["entries"])==169872
record=dict(scope="Source-owned isolated contact audio: repeat-generation bytes, native PCM, distinct variants, DC/edge/headroom. Not runtime routing or listening acceptance.",files=stats,masterBytes=m["masterBytes"],creatorAcceptance=False)
(root/"reports/contact-audio-v1/asset-verification.json").write_text(json.dumps(record,indent=2));print("Contact sound-design verification PASS: 12 reproducible, bounded, distinct original candidates.")
