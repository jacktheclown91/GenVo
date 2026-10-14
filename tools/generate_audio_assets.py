#!/usr/bin/env python3
"""Generate GenVo8's authored audio pack (v1.56.0 audio pass).

Deterministic and source-owned: every sound is synthesised here from numpy, with no external
samples, models or music. The browser audio director treats these WAVs as optional layers and falls
back to its live synthesis if a file cannot load.

v1.56.0 (creator direction 2026-10-10, "lets improve audio before we compress it"): the pack was
rebuilt from bare sine waves into small synthesised instruments (mallet, kalimba, plucked string,
warm pad, breathy flute, hand drums), filtered noise for wind, rain, water and leaves, and
formant-shaped creature voices. Every loop is made seamless: events wrap around the loop length and
reverb tails are folded back to the start. Keys: the beds sit in A minor (shelter in A major), the
key family the live lineage theme now moves through (A, D, E).
"""
from __future__ import annotations
import math
import wave
from pathlib import Path
import numpy as np

SR = 22050
# v1.58.0: the 16-bit WAV masters live in assets/audio-source (toolkit only); the game ships
# compressed copies in assets/audio: Ogg Opus first, AAC (.m4a) for browsers without Opus.
ROOT = Path(__file__).resolve().parents[1] / "assets" / "audio-source"
OUT = Path(__file__).resolve().parents[1] / "assets" / "audio"
RNG = np.random.default_rng(156)


# ---------------------------------------------------------------- basics
def tvec(seconds: float) -> np.ndarray:
    return np.arange(int(round(SR * seconds)), dtype=np.float64) / SR

def note(semi: float, root: float = 220.0) -> float:
    return root * 2 ** (semi / 12)

def noise(n: int) -> np.ndarray:
    return RNG.standard_normal(n)

def one_pole_lp(x: np.ndarray, fc: float) -> np.ndarray:
    a = math.exp(-2 * math.pi * fc / SR); y = np.empty_like(x); s = 0.0
    for i, v in enumerate(x):
        s = (1 - a) * v + a * s; y[i] = s
    return y

def one_pole_hp(x: np.ndarray, fc: float) -> np.ndarray:
    return x - one_pole_lp(x, fc)

def biquad(x: np.ndarray, kind: str, f: float, q: float = 0.7) -> np.ndarray:
    """RBJ cookbook biquad (bandpass constant 0 dB peak, lowpass, highpass)."""
    w = 2 * math.pi * min(f, SR * 0.45) / SR; cw, sw = math.cos(w), math.sin(w); al = sw / (2 * q)
    if kind == 'bp':  b0, b1, b2 = al, 0.0, -al
    elif kind == 'lp': b0 = b2 = (1 - cw) / 2; b1 = 1 - cw
    else:              b0 = b2 = (1 + cw) / 2; b1 = -(1 + cw)
    a0, a1, a2 = 1 + al, -2 * cw, 1 - al
    b0, b1, b2, a1, a2 = b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0
    y = np.empty_like(x); x1 = x2 = y1 = y2 = 0.0
    for i, v in enumerate(x):
        o = b0 * v + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
        x2, x1, y2, y1 = x1, v, y1, o; y[i] = o
    return y

def looped(fn, x: np.ndarray) -> np.ndarray:
    """Apply a filter to a loop without an edge transient: run it over three copies, keep the middle."""
    n = len(x); return fn(np.concatenate([x, x, x]))[n:2 * n]

def env_ad(n: int, attack: float, decay: float) -> np.ndarray:
    t = np.arange(n) / SR
    return np.minimum(1.0, t / max(attack, 1e-4)) * np.exp(-t / max(decay, 1e-4))

def fade(x: np.ndarray, a: float = .004, r: float = .03) -> np.ndarray:
    n = len(x); t = np.arange(n) / SR; d = n / SR
    e = np.clip(t / a, 0, 1) * np.clip((d - t) / r, 0, 1)
    return x * (e * e * (3 - 2 * e))

def place(out: np.ndarray, sig: np.ndarray, start: float, wrap: bool = False) -> None:
    i = int(round(start * SR)); n = len(out)
    if wrap:
        idx = (np.arange(len(sig)) + i) % n; np.add.at(out, idx, sig)
    else:
        j = min(n, i + len(sig))
        if i < n: out[i:j] += sig[:j - i]

def impulse_response(seconds: float, damp: float) -> np.ndarray:
    n = int(SR * seconds); t = np.arange(n) / SR
    ir = noise(n) * np.exp(-t * 6.9 / seconds)
    ir = one_pole_lp(ir, damp); ir[0] = 0
    return ir / np.sqrt(np.sum(ir ** 2))

def reverb(x: np.ndarray, seconds: float = 1.8, damp: float = 3200, mix: float = .3, loop: bool = False) -> np.ndarray:
    ir = impulse_response(seconds, damp)
    if loop:  # circular convolution: the tail folds back to the start, so the loop stays seamless
        n = len(x); wet = np.real(np.fft.ifft(np.fft.fft(x) * np.fft.fft(ir, n)))
    else:
        m = len(x) + len(ir); size = 1 << (m - 1).bit_length()
        wet = np.real(np.fft.ifft(np.fft.fft(x, size) * np.fft.fft(ir, size)))[:len(x)]
    return x * (1 - mix) + wet * mix * 1.6

def normalize(x: np.ndarray, peak: float = 0.72) -> np.ndarray:
    x = np.nan_to_num(x); p = np.max(np.abs(x)) or 1.0
    return np.clip(x / p * peak, -0.999, 0.999)

def write_wav(rel: str, x: np.ndarray, peak: float = 0.72) -> None:
    path = ROOT / rel; path.parent.mkdir(parents=True, exist_ok=True)
    data = (normalize(x, peak) * 32767).astype('<i2')
    with wave.open(str(path), 'wb') as wf:
        wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(SR); wf.writeframes(data.tobytes())
    rms = math.sqrt(float(np.mean((data.astype(np.float64) / 32767.0) ** 2)))
    print(f"{rel:34s} {len(data)/SR:5.2f}s  peak={np.max(np.abs(data))/32767:.3f} rms={rms:.3f}")


# ---------------------------------------------------------------- instruments
def mallet(freq: float, dur: float = 1.2, bright: float = 1.0, wood: bool = False) -> np.ndarray:
    """Struck bar: inharmonic modes with faster decay higher up, and a soft felt click."""
    n = int(dur * SR); t = np.arange(n) / SR
    modes = ((1, 1, 1.0), (3.93, .32 * bright, .32), (9.2, .1 * bright, .12)) if not wood else ((1, 1, .18), (2.71, .5, .07), (5.15, .25, .035))
    x = sum(a * np.sin(2 * np.pi * freq * r * t) * np.exp(-t / (d * (1.0 if wood else 1.4))) for r, a, d in modes)
    click = biquad(noise(n) * np.exp(-t * 900), 'bp', min(freq * 4, 6000), 1.2) * .25
    return (x + click) * np.minimum(1, t / .0015)

def kalimba(freq: float, dur: float = 1.6) -> np.ndarray:
    n = int(dur * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * t) * np.exp(-t / .9) + .28 * np.sin(2 * np.pi * freq * 5.95 * t) * np.exp(-t / .08) + .12 * np.sin(2 * np.pi * freq * 2.0 * t) * np.exp(-t / .4)
    return x * np.minimum(1, t / .002)

def pluck(freq: float, dur: float = 1.4, damp: float = .996, bright: float = .5) -> np.ndarray:
    """Karplus-Strong string."""
    n = int(dur * SR); period = max(2, int(SR / freq)); buf = list(one_pole_lp(noise(period), 1200 + 4000 * bright))
    out = np.empty(n); idx = 0
    for i in range(n):
        v = buf[idx]; nxt = buf[(idx + 1) % period]; buf[idx] = damp * .5 * (v + nxt); out[i] = v; idx = (idx + 1) % period
    return out * np.minimum(1, np.arange(n) / (SR * .002))

def saw(freq: np.ndarray | float, t: np.ndarray, harmonics: int = 24) -> np.ndarray:
    ph = 2 * np.pi * (np.cumsum(np.broadcast_to(freq, t.shape)) / SR)
    top = int(min(harmonics, (SR * .45) // max(1.0, float(np.max(freq)))))
    return sum(np.sin(k * ph) / k for k in range(1, max(2, top + 1)))

def pad(freqs, dur: float, attack: float = 1.2, release: float = 1.6, cutoff: float = 1400, detune: float = .004) -> np.ndarray:
    n = int(dur * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for f in freqs:
        for d in (-detune, 0, detune):
            x += saw(f * (1 + d), t, 18) * (1 / 3)
    x = biquad(x, 'lp', cutoff, .6)
    e = np.minimum(1, t / attack) * np.minimum(1, (dur - t) / release)
    return x * np.clip(e, 0, 1) / max(1, len(freqs))

def flute(freq: float, dur: float) -> np.ndarray:
    n = int(dur * SR); t = np.arange(n) / SR
    vib = 1 + .006 * np.sin(2 * np.pi * 5.2 * t) * np.clip((t - .25) / .4, 0, 1)
    ph = 2 * np.pi * np.cumsum(freq * vib) / SR
    tone = np.sin(ph) + .18 * np.sin(2 * ph) + .06 * np.sin(3 * ph)
    breath = biquad(noise(n), 'bp', freq * 2, 2.5) * .25
    e = np.minimum(1, t / .12) * np.minimum(1, (dur - t) / .25)
    return (tone + breath) * np.clip(e, 0, 1)

def drum(f0: float, f1: float, dur: float = .5, skin: float = .35) -> np.ndarray:
    n = int(dur * SR); t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t * 28)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (dur * .35))
    hit = one_pole_lp(noise(n) * np.exp(-t * 60), 2400) * skin
    return body + hit

def grain(f: float, q: float, dur: float, decay: float, amp: float = 1.0) -> np.ndarray:
    n = int(dur * SR); t = np.arange(n) / SR
    return biquad(noise(n) * np.exp(-t / decay) * np.minimum(1, t / .0008), 'bp', f, q) * amp

def voice(f0, dur: float, formants, breath: float = .08, jitter: float = 0.0, harmonics: int = 30) -> np.ndarray:
    """Glottal-pulse voice through formant resonances. f0 is a callable of time (seconds)."""
    n = int(dur * SR); t = np.arange(n) / SR; f = np.array([f0(x) for x in t])
    if jitter: f = f * (1 + jitter * one_pole_lp(noise(n), 30) * 3)
    src = saw(f, t, harmonics) + breath * noise(n)
    out = sum(biquad(src, 'bp', fr, q) * g for fr, q, g in formants)
    return out

def contour(*points):
    """Piecewise-smooth pitch contour from (time, Hz) points."""
    ts = [p[0] for p in points]; fs = [p[1] for p in points]
    def f(x):
        if x <= ts[0]: return fs[0]
        for i in range(1, len(ts)):
            if x <= ts[i]:
                u = (x - ts[i - 1]) / max(1e-6, ts[i] - ts[i - 1]); u = u * u * (3 - 2 * u)
                return fs[i - 1] + (fs[i] - fs[i - 1]) * u
        return fs[-1]
    return f


# ---------------------------------------------------------------- music (A minor family)
A3 = 220.0
CHORDS_MINOR = ((0, 3, 7, 14), (-4, 0, 3, 7), (3, 7, 10, 14), (-5, -2, 2, 7))   # Am(add9), Fmaj7, C(add9), Em7sus-ish over A3

def build_theme_loop() -> np.ndarray:
    d = 12.0; out = np.zeros(int(d * SR)); beat = .75
    for ci, chord in enumerate(CHORDS_MINOR):
        place(out, pad([note(s - 12) for s in chord[:3]], 3.4, .9, 1.1, 1100) * .55, ci * 3.0 - .2, wrap=True)
        for k in range(4):  # gentle kalimba arpeggio, one note per beat
            semi = chord[(k * 2 + ci) % 4]
            place(out, kalimba(note(semi + 12)) * (.32 if k else .4), ci * 3.0 + k * beat, wrap=True)
    motif = (0, 3, 7, 5, 10, 7, 3, 0)  # the lineage signature, stated once on a soft mallet
    for i, s in enumerate(motif):
        place(out, mallet(note(s + 12), 1.4, .7) * .42, .1 + i * beat, wrap=True)
    return reverb(out, 2.2, 3800, .36, loop=True)

def build_lineage_loop() -> np.ndarray:
    d = 12.0; out = np.zeros(int(d * SR))
    for ci, (root, chord) in enumerate(((0, (0, 7, 15)), (-4, (0, 7, 16)), (3, (0, 7, 16)), (-2, (0, 7, 16)))):  # Am, F, C, G
        place(out, pad([note(root + c - 24) for c in chord], 3.6, 1.4, 1.4, 900, .003) * .8, ci * 3.0 - .3, wrap=True)
    for s, start, ln in ((12, 3.2, 1.0), (15, 4.25, .9), (19, 5.2, 1.5), (17, 6.8, 2.2)):   # a distant flute phrase
        place(out, flute(note(s), ln) * .22, start, wrap=True)
    return reverb(out, 2.8, 2600, .45, loop=True)

def build_shelter_loop() -> np.ndarray:
    d = 12.0; out = np.zeros(int(d * SR)); beat = .5
    chords = ((0, 4, 7, 11), (5, 9, 12, 16), (0, 4, 7, 14), (7, 12, 14, 19))   # A(maj7), D(add9)-ish, A(add9), E(sus4)
    for ci, chord in enumerate(chords):
        place(out, pad([note(c - 12) for c in chord[:3]], 3.3, .8, 1.0, 1300) * .38, ci * 3.0 - .15, wrap=True)
        for k in range(6):  # warm fingerpicked arpeggio
            semi = chord[(0, 2, 1, 3, 2, 1)[k]]
            place(out, pluck(note(semi), 1.5, .995, .35) * (.5 if k == 0 else .34), ci * 3.0 + k * beat, wrap=True)
    return reverb(out, 1.6, 3000, .28, loop=True)

def build_danger_loop() -> np.ndarray:
    d = 6.0; out = np.zeros(int(d * SR)); t = np.arange(len(out)) / SR
    # Low tremolo strings on a tense cluster, with a heartbeat drum.
    strings = pad([note(-24), note(-23), note(-17)], d + 1, .05, .05, 700, .006)[:len(out)]
    trem = .55 + .45 * np.sin(2 * np.pi * 7.0 * t)  # 42 cycles per loop: seamless
    out += strings * trem * .9
    for b in range(8):
        place(out, drum(110, 48, .6) * (.9 if b % 2 == 0 else .55), b * .75, wrap=True)
        if b % 2 == 0: place(out, drum(95, 52, .45) * .45, b * .75 + .22, wrap=True)
    scrape = looped(lambda x: biquad(x, 'bp', 2600, 1.4), noise(len(out))) * (.5 + .5 * np.sin(2 * np.pi * t / 3.0) ** 2) * .12
    out += scrape
    return reverb(out, 1.2, 2200, .22, loop=True)

def build_branch_motif(branch: str) -> np.ndarray:
    d = 1.06; out = np.zeros(int(d * SR)); motif = (0, 3, 7, 5); starts = (.02, .27, .52, .77)
    for i, (s, st) in enumerate(zip(motif, starts)):
        if branch == 'stealth':
            place(out, mallet(note(s + 12), .5, .35) * .5, st)
            place(out, grain(5200, 2, .2, .05, .12), st)
        elif branch == 'offense':
            place(out, drum(140, 60, .3) * .55, st)
            place(out, pluck(note(s - 12), .5, .99, .8) * .6, st + .01)
        elif branch == 'social':
            place(out, kalimba(note(s + 12), .6) * .5, st)
            place(out, kalimba(note(s + 15), .55) * .3, st + .03)
        else:
            place(out, mallet(note(s + 12) / 2, .35, .5, wood=True) * .6, st)
            place(out, pluck(note(s), .5, .992, .6) * .45, st + .02)
    return fade(reverb(out, .9, 3500, .22), .003, .06)


# ---------------------------------------------------------------- ambience (seamless 12 s beds)
def gusts(n: int, period_s: float, depth: float, seed_off: float = 0.0) -> np.ndarray:
    t = np.arange(n) / SR; d = n / SR; k = max(1, round(d / period_s))
    g = .5 + .5 * np.sin(2 * np.pi * k * t / d + seed_off) * np.sin(2 * np.pi * (k + 1) * t / d + 1.3 + seed_off)
    return (1 - depth) + depth * g

def bird(dur: float, f_lo: float, f_hi: float, notes: int, trill: float = 0.0) -> np.ndarray:
    out = np.zeros(int(dur * SR)); step = dur / notes
    for k in range(notes):
        ln = step * .8; n = int(ln * SR); t = np.arange(n) / SR
        lo, hi = (f_lo, f_hi) if k % 2 == 0 else (f_hi * .92, f_lo * 1.1)
        f = lo + (hi - lo) * (t / ln) ** .7 + (trill * f_lo * np.sin(2 * np.pi * 38 * t) if trill else 0)
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / ln) ** 1.5
        place(out, s, k * step)
    return out

def build_field_loop() -> np.ndarray:
    d = 12.0; n = int(d * SR); t = np.arange(n) / SR
    wind = looped(lambda x: one_pole_lp(one_pole_lp(x, 420), 600), noise(n)) * gusts(n, 4.0, .6) * 2.6
    grass = looped(lambda x: biquad(x, 'hp', 2400, .7), noise(n)) * gusts(n, 3.0, .85, 2.0) ** 2 * .05
    crickets = np.sin(2 * np.pi * 4300 * t) * np.clip((np.sin(2 * np.pi * 30 * t) - .2) * 3, 0, 1) * gusts(n, 6, .9, 4.1) * .05
    out = wind + grass + crickets
    for start, lo, hi, notes, tr in ((1.4, 2600, 3600, 3, 0), (5.2, 2100, 3200, 5, .04), (8.6, 3000, 4200, 2, 0), (10.9, 2400, 3000, 4, .06)):
        place(out, bird(.55 + notes * .05, lo, hi, notes, tr) * .16, start, wrap=True)
    return reverb(out, 1.4, 4500, .18, loop=True)

def plop(f: float, dur: float = .18) -> np.ndarray:
    n = int(dur * SR); t = np.arange(n) / SR
    fr = f * (1 + .9 * np.exp(-t * 40))
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 26) * np.minimum(1, t / .001)

def croak(f0: float, dur: float = .32) -> np.ndarray:
    return fade(voice(contour((0, f0), (dur, f0 * .82)), dur, ((480, 4, 1.0), (1150, 5, .5)), .05) * (np.sin(np.pi * np.arange(int(dur * SR)) / int(dur * SR)) ** .8), .01, .05)

def build_wet_loop() -> np.ndarray:
    d = 12.0; n = int(d * SR)
    rain = looped(lambda x: biquad(biquad(one_pole_hp(x, 700), 'lp', 4200, .7), 'lp', 4200, .7), noise(n)) * .12 * gusts(n, 6, .3, 1.0)
    out = rain
    for k in range(26):
        place(out, plop(RNG.uniform(700, 1500)) * RNG.uniform(.08, .2), RNG.uniform(0, d), wrap=True)
    for start in (2.0, 2.45, 7.1, 7.5, 7.9):
        place(out, croak(RNG.uniform(95, 125)) * .5, start, wrap=True)
    return reverb(out, 1.3, 3000, .22, loop=True)

def build_water_edge_loop() -> np.ndarray:
    d = 12.0; n = int(d * SR); t = np.arange(n) / SR
    swell = .25 + .75 * (.5 + .5 * np.sin(2 * np.pi * 4 * t / d - 1.2)) ** 3          # four waves per loop
    lap = looped(lambda x: biquad(x, 'bp', 650, .8), noise(n)) * swell * .5
    murmur = looped(lambda x: one_pole_lp(x, 180), noise(n)) * 1.2
    out = lap + murmur
    for k in range(18):
        place(out, plop(RNG.uniform(500, 1100), .12) * RNG.uniform(.05, .14), RNG.uniform(0, d), wrap=True)
    return reverb(out, 1.0, 3500, .2, loop=True)


# ---------------------------------------------------------------- creature voices
def soft(x: np.ndarray) -> np.ndarray:
    return fade(x, .004, .05)

def build_genvo_call() -> np.ndarray:   # a round, curious "coo-wee"
    a = voice(contour((0, 380), (.16, 560), (.3, 520)), .3, ((700, 4, 1), (1250, 6, .45), (2600, 8, .12)), .05)
    b = voice(contour((0, 600), (.2, 470)), .24, ((750, 4, 1), (1300, 6, .4)), .05)
    out = np.zeros(int(.72 * SR)); place(out, soft(a), .02); place(out, soft(b) * .8, .38)
    return reverb(out, .5, 4000, .12)

def build_genvo_hurt() -> np.ndarray:  # a sharp yelp that cracks down
    x = voice(contour((0, 680), (.08, 760), (.4, 230)), .42, ((850, 3, 1), (1600, 5, .6), (2900, 7, .2)), .3, .02)
    return soft(x * env_ad(len(x), .004, .2))

def build_genvo_alarm() -> np.ndarray:  # three urgent rising pips
    out = np.zeros(int(.56 * SR))
    for k, st in enumerate((.01, .19, .37)):
        p = voice(contour((0, 620 + k * 60), (.13, 980 + k * 70)), .14, ((950, 3, 1), (2100, 5, .5)), .04)
        place(out, soft(p), st)
    return out

def build_genvo_rally() -> np.ndarray:  # a bold call rising through a triad
    out = np.zeros(int(.7 * SR))
    for k, (f0, f1) in enumerate(((330, 440), (415, 554), (494, 660))):
        p = voice(contour((0, f0), (.12, f1), (.2, f1 * .97)), .2, ((800, 3, 1), (1500, 5, .55), (2700, 7, .2)), .05)
        place(out, soft(p) * (.8 + k * .1), .02 + k * .22)
    return out

def build_genvo_court() -> np.ndarray:  # a sweet warbling trill
    f = lambda x: 470 + 70 * math.sin(2 * math.pi * 9 * x) + 120 * x
    x = voice(f, .78, ((800, 4, 1), (1450, 6, .45), (2500, 8, .15)), .03)
    return reverb(soft(x * np.sin(np.pi * np.arange(len(x)) / len(x)) ** .6), .6, 4000, .15)

def build_genvo_birth() -> np.ndarray:  # tiny high squeaks
    out = np.zeros(int(.5 * SR))
    for st, f0 in ((.02, 820), (.2, 900), (.34, 780)):
        place(out, soft(voice(contour((0, f0), (.1, f0 * 1.3)), .11, ((1100, 3, 1), (2600, 5, .4)), .03)), st)
    return out

def build_hopper() -> np.ndarray:  # quick bird-like chirps
    out = bird(.42, 1900, 2800, 3)
    return soft(out + .3 * bird(.42, 3800, 5000, 3))

def build_digger() -> np.ndarray:  # a snuffling grunt
    out = np.zeros(int(.58 * SR))
    for st, f0 in ((.02, 115), (.26, 98)):
        g = voice(contour((0, f0), (.2, f0 * .8)), .22, ((380, 3, 1), (950, 4, .5)), .35, .03)
        place(out, soft(g * env_ad(len(g), .01, .12)), st)
    place(out, grain(1800, 1.5, .1, .03, .4), .2); place(out, grain(1600, 1.5, .1, .03, .3), .46)
    return out

def growl(dur: float, f0a: float, f0b: float, rough: float = .4) -> np.ndarray:
    n = int(dur * SR); t = np.arange(n) / SR
    x = voice(contour((0, f0a), (dur, f0b)), dur, ((420, 2.5, 1), (900, 3.5, .6), (2300, 4, .25)), rough, .05)
    return x * (.65 + .35 * np.sin(2 * np.pi * 23 * t))

def build_stalker_rattle() -> np.ndarray:  # a dry accelerating rattle over a low growl
    out = growl(.78, 72, 66, .5) * .45
    st = .03
    for k in range(9):
        place(out, grain(2800 + 500 * (k % 3), 4, .05, .006, .9), st); st += .11 * (.88 ** k)
    return soft(out)

def build_stalker_stalk() -> np.ndarray:  # low, breathy, rising
    x = growl(.84, 62, 82, .7) * np.sin(np.pi * np.arange(int(.84 * SR)) / int(.84 * SR))
    return soft(x)

def build_stalker_charge() -> np.ndarray:  # growl swelling into a roar
    n = int(.61 * SR); x = growl(.61, 80, 170, .9) * np.minimum(1, np.arange(n) / (SR * .45)) ** 1.5
    return soft(x + grain(1200, .8, .61, .25, .3) * np.linspace(0, 1, n))

def build_stalker_lunge() -> np.ndarray:  # a snapping bark and jaw click
    out = np.zeros(int(.52 * SR)); b = growl(.3, 190, 90, 1.0) * env_ad(int(.3 * SR), .004, .12)
    place(out, b, .01); place(out, mallet(900, .2, 1, wood=True) * .6, .14); place(out, grain(3000, 3, .06, .008, .8), .14)
    return soft(out)


# ---------------------------------------------------------------- eating and building
def munch(st: float, out: np.ndarray, f: float = 900, amp: float = .6) -> None:
    for k in range(3): place(out, grain(f * RNG.uniform(.8, 1.3), 1.2, .05, .012, amp * RNG.uniform(.6, 1)), st + k * .018)

def build_food_moss() -> np.ndarray:  # soft leafy pulls and chewing
    out = np.zeros(int(.42 * SR)); place(out, grain(3200, .8, .18, .06, .35), .01)
    for st in (.12, .25): munch(st, out, 700, .5)
    return soft(out)

def build_food_berries() -> np.ndarray:  # a juicy pop and a squish
    out = np.zeros(int(.46 * SR)); place(out, plop(520, .2) * .9, .01); place(out, grain(450, 1.2, .2, .06, .6), .05)
    munch(.26, out, 600, .4); return soft(out)

def build_food_reeds() -> np.ndarray:  # fibrous snaps
    out = np.zeros(int(.48 * SR))
    for st in (.02, .1, .19, .3): place(out, grain(RNG.uniform(1800, 2600), 3, .05, .007, .9), st)
    place(out, grain(3600, .7, .4, .12, .2), .0); return soft(out)

def build_food_mushroom() -> np.ndarray:  # a soft squelch
    out = np.zeros(int(.44 * SR)); place(out, grain(320, 2, .3, .08, .9), .01); place(out, plop(300, .2) * .5, .12)
    munch(.28, out, 500, .35); return soft(out)

def build_food_seed() -> np.ndarray:  # crisp cracks
    out = np.zeros(int(.4 * SR))
    for st in (.015, .09, .17, .26): place(out, grain(RNG.uniform(3000, 4200), 4, .04, .004, 1.0), st)
    munch(.2, out, 1400, .35); return soft(out)

def build_food_carrion() -> np.ndarray:  # a wet tear and heavy chew
    out = np.zeros(int(.52 * SR)); n = int(.28 * SR); t = np.arange(n) / SR
    tear = biquad(noise(n) * np.exp(-t * 6), 'bp', 700, 1.0) * np.sin(np.pi * t / t[-1])
    place(out, tear * .9, .01); munch(.32, out, 420, .6); return soft(out)

def wood_knock(f: float) -> np.ndarray:
    return mallet(f, .3, 1, wood=True)

def build_shelter_build() -> np.ndarray:  # rustling twigs and woody knocks
    out = np.zeros(int(.66 * SR)); place(out, grain(2800, .7, .6, .25, .3), .0)
    for st, f in ((.05, 420), (.23, 360), (.43, 470)): place(out, wood_knock(f) * .8, st)
    return soft(out)

def build_shelter_repair() -> np.ndarray:  # weaving twigs
    out = np.zeros(int(.48 * SR))
    for st in (.03, .1, .16, .25, .33): place(out, grain(RNG.uniform(2200, 3400), 3, .04, .008, .7), st)
    place(out, wood_knock(520) * .5, .2); return soft(out)

def build_shelter_store() -> np.ndarray:  # a soft thud and settling
    out = np.zeros(int(.43 * SR)); place(out, drum(120, 70, .3, .2) * .8, .01); place(out, grain(2400, .8, .3, .1, .25), .1)
    return soft(out)


def main() -> None:
    ROOT.mkdir(parents=True, exist_ok=True)
    write_wav('ambience/field-loop.wav', build_field_loop(), .52)
    write_wav('ambience/wet-loop.wav', build_wet_loop(), .46)
    write_wav('ambience/water-edge-loop.wav', build_water_edge_loop(), .44)
    write_wav('music/theme-loop.wav', build_theme_loop(), .48)
    write_wav('music/lineage-loop.wav', build_lineage_loop(), .42)
    write_wav('music/shelter-loop.wav', build_shelter_loop(), .44)
    write_wav('music/danger-loop.wav', build_danger_loop(), .5)
    for b in ('stealth', 'offense', 'social', 'utility'):
        write_wav(f'music/branch-{b}.wav', build_branch_motif(b), .5)
    write_wav('fauna/genvo-call.wav', build_genvo_call(), .68)
    write_wav('fauna/genvo-hurt.wav', build_genvo_hurt(), .74)
    write_wav('fauna/genvo-alarm.wav', build_genvo_alarm(), .68)
    write_wav('fauna/genvo-rally.wav', build_genvo_rally(), .70)
    write_wav('fauna/genvo-court.wav', build_genvo_court(), .62)
    write_wav('fauna/genvo-birth.wav', build_genvo_birth(), .58)
    write_wav('fauna/hopper-peep.wav', build_hopper(), .62)
    write_wav('fauna/digger-chuff.wav', build_digger(), .64)
    write_wav('fauna/stalker-rattle.wav', build_stalker_rattle(), .72)
    write_wav('fauna/stalker-stalk.wav', build_stalker_stalk(), .66)
    write_wav('fauna/stalker-charge.wav', build_stalker_charge(), .74)
    write_wav('fauna/stalker-lunge.wav', build_stalker_lunge(), .76)
    write_wav('actions/food-moss.wav', build_food_moss(), .62)
    write_wav('actions/food-berries.wav', build_food_berries(), .66)
    write_wav('actions/food-reeds.wav', build_food_reeds(), .64)
    write_wav('actions/food-mushroom.wav', build_food_mushroom(), .60)
    write_wav('actions/food-seed.wav', build_food_seed(), .68)
    write_wav('actions/food-carrion.wav', build_food_carrion(), .67)
    write_wav('actions/shelter-build.wav', build_shelter_build(), .64)
    write_wav('actions/shelter-repair.wav', build_shelter_repair(), .60)
    write_wav('actions/shelter-store.wav', build_shelter_store(), .58)


def encode_all() -> None:
    """Compress every master with ffmpeg: Opus 48 kbit/s in Ogg, and AAC 64 kbit/s in M4A."""
    import shutil, subprocess
    ff = shutil.which('ffmpeg')
    if not ff:
        print('ffmpeg not found: masters written, compressed copies not updated'); return
    for wav in sorted(ROOT.rglob('*.wav')):
        rel = wav.relative_to(ROOT).with_suffix('')
        for ext, args in (('.ogg', ['-c:a', 'libopus', '-b:a', '48k', '-application', 'audio']),
                          ('.m4a', ['-c:a', 'aac', '-b:a', '64k', '-movflags', '+faststart'])):
            dst = OUT / rel.with_suffix(ext); dst.parent.mkdir(parents=True, exist_ok=True)
            subprocess.run([ff, '-y', '-loglevel', 'error', '-i', str(wav), '-ac', '1', *args, '-map_metadata', '-1', str(dst)], check=True)
    total = sum(f.stat().st_size for f in OUT.rglob('*') if f.suffix in ('.ogg', '.m4a'))
    print(f'compressed pack: {total} bytes')


if __name__ == '__main__':
    main()
    encode_all()
