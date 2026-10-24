"""Original contact audio design masters; deliberately outside the runtime pack."""
from pathlib import Path
import argparse,hashlib,importlib.util,json,wave
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location("genvo_audio_dsp",ROOT/"tools/generate_audio_assets.py")
dsp=importlib.util.module_from_spec(spec);spec.loader.exec_module(dsp)
SR=dsp.SR
def signal(surface,variant):
 rng=np.random.default_rng(2026102400+variant+100*["soil","litter","snow","shallow-water"].index(surface));t=dsp.tvec(.32);n=len(t)
 noise=rng.standard_normal(n);low=dsp.one_pole_lp(noise,340);grain=dsp.biquad(noise,"bp",1450+variant*85,.8)
 impact=(low*.7+np.sin(2*np.pi*(110+variant*9)*t)*.045)*dsp.env_ad(n,.002,.028)
 if surface=="soil":x=impact+grain*.11*dsp.env_ad(n,.004,.042)
 elif surface=="litter":
  crack=dsp.one_pole_hp(noise,1500)*.12
  envelope=sum(np.exp(-((t-c)/w)**2)*a for c,w,a in zip(rng.uniform(.006,.095,7),rng.uniform(.001,.006,7),rng.uniform(.3,1,7)))
  x=impact*.55+crack*envelope+grain*.13*dsp.env_ad(n,.008,.06)
 elif surface=="snow":
  squeeze=dsp.biquad(noise,"bp",720+variant*70,.65);x=impact*.55+squeeze*.3*dsp.env_ad(n,.017,.065)+grain*.03*dsp.env_ad(n,.03,.08)
 else:
  splash=dsp.biquad(noise,"bp",1800+variant*110,.6);drop=np.sin(2*np.pi*(420*t-650*t*t))*np.exp(-t*52)
  x=impact*.25+splash*.22*dsp.env_ad(n,.006,.045)+drop*.035*dsp.env_ad(n,.003,.035)
 x=dsp.fade(x,a=.002,r=.06);x=x-np.mean(x);x=dsp.fade(x,a=.002,r=.03)
 if not np.isfinite(x).all():raise ValueError("Non-finite source")
 return dsp.normalize(x,.48)
def write(path,x):
 path.parent.mkdir(parents=True,exist_ok=True);data=(x*32767).astype("<i2")
 with wave.open(str(path),"wb") as f:f.setnchannels(1);f.setsampwidth(2);f.setframerate(SR);f.writeframes(data.tobytes())
 return data.astype(float)/32768
def main(out):
 out.mkdir(parents=True,exist_ok=True);entries=[];reel=[]
 for surface in ["soil","litter","snow","shallow-water"]:
  for variant in range(3):
   name=f"{surface}-{variant+1}.wav";x=write(out/name,signal(surface,variant));f=out/name
   entries.append(dict(file=name,surface=surface,variant=variant+1,seconds=len(x)/SR,sampleRate=SR,channels=1,bits=16,bytes=f.stat().st_size,sha256=hashlib.sha256(f.read_bytes()).hexdigest(),peak=float(np.max(np.abs(x))),rms=float(np.sqrt(np.mean(x*x))),dc=float(np.mean(x)),edgeMax=float(max(abs(x[0]),abs(x[-1])))))
   reel.extend([x,np.zeros(round(SR*.32))])
  reel.append(np.zeros(round(SR*.6)))
 write(out/"contact-review-reel.wav",np.concatenate(reel))
 manifest=dict(schema="genvo.contact-audio-review/1",scope="Original deterministic sound-design candidates, not registered or integrated gameplay. Reel order: soil, litter, snow, shallow water; three variants each.",sourceSha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),dspSha256=hashlib.sha256((ROOT/"tools/generate_audio_assets.py").read_bytes()).hexdigest(),entries=entries,masterBytes=sum(e["bytes"] for e in entries),creatorAcceptance=False)
 (out/"manifest.json").write_text(json.dumps(manifest,indent=2));print(json.dumps(dict(files=len(entries),masterBytes=manifest["masterBytes"],out=str(out))))
if __name__=="__main__":
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument("output",type=Path);main(parser.parse_args().output)
