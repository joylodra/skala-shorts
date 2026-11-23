# Skala short sound engine: original score builders + synthesized SFX + the standard mix (voice as recorded at -16 LUFS,
# music ducked under the voice, music +3 dB / SFX -6 dB relative, master -14 LUFS, true peak <= -1 dBTP).
# A video's src/video/sound.py gets a Session `S` and writes its score + cues with the helpers below.
import json, math, os
import numpy as np
from dsp import SR, ns, rng, lp, hp, bp, colored, fades, pan, st, place, norm_to, read_wav, write_wav, integrated, true_peak, dbg
from instruments import m2f, glock, vibes, pluck, pad, brush, brass, triangle
from sfx_gen import whoosh as _whoosh

FPS = 30
CH = {"C": [48, 52, 55, 60], "Am": [45, 52, 57, 60], "F": [41, 53, 57, 60], "G": [43, 55, 59, 62], "Dm": [38, 53, 57, 62],
      "E": [40, 52, 56, 59], "Em": [40, 55, 59, 64], "D": [38, 54, 57, 62], "Bb": [46, 53, 58, 62]}


class Session:
    """One video's sound: `t(event)` gives seconds on the final timeline; music + sfx buffers; helpers below."""

    def __init__(self, project):
        self.project = project
        vid = os.path.join(project, "src", "video")
        self.events = {k: v for k, v in json.load(open(os.path.join(vid, "events.json"))).items() if not k.startswith("_")}
        tm = os.path.join(project, "voice", "timemap.json")
        self.A = np.array(json.load(open(tm))["anchors"]) if os.path.exists(tm) else None
        total = json.load(open(os.path.join(vid, "events.json"))).get("_total")
        self.voice_path = os.path.join(project, "voice", "voice_final.wav")
        v, sr = read_wav(self.voice_path); assert sr == SR, sr
        self.voice = st(v.mean(0))
        vdur = self.voice.shape[1] / SR
        self.TOTAL = self.tmap(total / FPS) if total else vdur + 1.7
        self.N = ns(self.TOTAL)
        self.mus = np.zeros((2, self.N)); self.sfx = np.zeros((2, self.N))
        self.R = rng(7)
        self.bpm = 116.0

    # ---- time ----
    def tmap(self, t):
        """story seconds -> final seconds (identity unless the voice was re-timed after the picture, see timemap)"""
        if self.A is None: return t
        A = self.A
        return float(np.interp(t, A[:, 0], A[:, 1])) if t <= A[-1, 0] else float(A[-1, 1] + t - A[-1, 0])

    def t(self, ev, off_frames=0):
        """seconds of a named event (events.json, frames) + optional frame offset"""
        return self.tmap((self.events[ev] + off_frames) / FPS)

    @property
    def B(self): return 60.0 / self.bpm

    # ---- music ----
    def note(self, t, inst, m, vel=0.6, dur=0.4, p=0.0, g=1.0, **kw):
        R = self.R
        if inst == "pluck": x = pluck(m2f(m), vel, R, dur=dur, **kw)
        elif inst == "glock": x = glock(m2f(m), vel, R, dur=dur)
        elif inst == "vibes": x = vibes(m2f(m), vel, R, dur=dur)
        elif inst == "brass": x = brass(m2f(m), dur, vel, R, kind=kw.get("kind", "soft"))
        else: raise ValueError(inst)
        place(self.mus, pan(x, p), t, g)

    def hat(self, t, vel=0.35, p=0.2): place(self.mus, pan(brush(vel, self.R, dur=0.12), p), t, 0.5)
    def tick(self, t, g=0.4): place(self.mus, pan(triangle(0.18, self.R, dur=0.3, f=2400.0), 0.4), t, g)
    def pad(self, t, chord, dur, g=0.35): place(self.mus, pad([m2f(x) for x in chord], dur, 0.35, self.R, att=0.5, rel=0.6), t, g)

    def groove(self, t0, t1, prog, melody=None, bright=1.0):
        """bouncy office groove (the Skala default): bass on 1+3, off-beat plucked chords, brushes on 2+4, optional
        glock melody (list per bar of (beat offset, midi, dur))"""
        B, t, bar = self.B, t0, 0
        while t < t1 - 0.05:
            ch = CH[prog[bar % len(prog)]]
            for b in range(4):
                tb = t + b * B
                if tb >= t1: break
                if b in (0, 2): self.note(tb, "pluck", ch[0] - 12 + (7 if b == 2 else 0), 0.75, 0.5, -0.1, 0.9, bright=0.3)
                for k, m in enumerate(ch[1:]): self.note(tb + B / 2, "pluck", m + 12, 0.38, 0.22, 0.25 * (k - 1), 0.32, bright=0.6 * bright)
                if b in (1, 3): self.hat(tb, 0.4)
                self.hat(tb + B / 2, 0.22, -0.2)
            if melody:
                for (off, m, d) in melody[bar % len(melody)]:
                    if t + off * B < t1: self.note(t + off * B, "glock", m, 0.5, d, 0.15, 0.45)
            t += 4 * B; bar += 1

    def tension(self, t0, t1, crisis_from=None, ost=(45, 45, 52, 45, 48, 45, 52, 47), chords=((57, 60, 64), (53, 57, 60))):
        """minor pizzicato ostinato with clock ticks; from crisis_from on it doubles to 16ths with brushes"""
        B, t, k = self.B, t0, 0
        while t < t1 - 0.2:
            crisis = crisis_from is not None and t >= crisis_from
            step = B / 4 if crisis else B / 2
            m = ost[k % len(ost)] + (12 if crisis and k % 4 == 1 else 0)
            self.note(t, "pluck", m, 0.55 if k % 2 == 0 else 0.4, 0.2, -0.2, 0.55, bright=0.4)
            if k % (8 if crisis else 4) == 0: self.tick(t)
            if k % (16 if crisis else 8) == 0: self.pad(t, chords[(k // (16 if crisis else 8)) % 2], 4 * B)
            if crisis and k % 4 == 2: self.hat(t, 0.3)
            t += step; k += 1

    def motif(self, t, notes, step=None, inst="vibes", g=0.5, p=0.2):
        for i, m in enumerate(notes): self.note(t + i * (step or self.B / 2), inst, m, 0.5, 0.6, p, g)

    def sting(self, t):
        """end sting: bass + glock 'ta-da' in miniature"""
        self.note(t, "pluck", 43, 0.7, 0.4, 0, 0.9); self.note(t + 0.35, "pluck", 36, 0.8, 1.2, 0, 1.0)
        for i, m in enumerate([79, 84]): self.note(t + i * 0.35, "glock", m, 0.55, 1.2, 0.1, 0.5)

    def wahwah(self, t):
        """sad trombone in two notes"""
        self.note(t, "brass", 55, 0.55, 0.28, 0.0, 0.55, kind="soft"); self.note(t + 0.33, "brass", 53, 0.5, 0.7, 0.0, 0.55, kind="soft")

    def resolve(self, t, chord=(60, 64, 67, 72)):
        for m in chord: self.note(t, "vibes", m, 0.5, 2.0, 0.1, 0.5)
        self.note(t, "pluck", 36, 0.7, 1.5, 0, 0.9)

    # ---- sfx ----
    def add(self, x, t, g=1.0, p=0.0):
        place(self.sfx, pan(x, p) if np.asarray(x).ndim == 1 else x, t, g)

    def sine_glide(self, f0, f1, dur, decay=None, lin=False):
        n = ns(dur); tt = np.arange(n) / SR
        f = f0 + (f1 - f0) * tt / dur if lin else f0 * (f1 / f0) ** (tt / dur)
        return fades(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / (decay or dur / 3)), 0.002, 0.01)

    def noise_burst(self, dur, lo, hi, att=0.005, dec=None):
        n = ns(dur); x = bp(colored(n, self.R), lo, hi); tt = np.arange(n) / SR
        return fades(x * np.minimum(1, tt / att) * np.exp(-tt / (dec or dur / 3)), 0.002, 0.02)

    # named effects: each places itself at time t (seconds); g = gain, p = pan -1..1
    def pop(self, t, f=700.0, g=0.6, p=0.0):
        x = self.sine_glide(f * 1.6, f * 0.6, 0.09, 0.03); x[: ns(0.02)] += 0.15 * fades(hp(colored(ns(0.02), self.R), 2000), 0.001, 0.01)
        self.add(x, t, g, p)
    def thud(self, t, g=0.9):
        x = self.sine_glide(110, 45, 0.5, 0.12); x = x + 0.4 * lp(colored(len(x), self.R), 300) * np.exp(-np.arange(len(x)) / SR / 0.05)
        self.add(x, t, g)
    def whoosh(self, t_peak, g=0.7, p=0.0, dur=0.6):
        """whoosh peaking at t_peak (put it on cuts / fast moves / throws)"""
        self.add(_whoosh(dur, self.R, peak=dur * 0.7), t_peak - dur * 0.7, g, p)
    def sparkle(self, t, g=0.35, p=0.2):
        for i, m in enumerate([88, 91, 96, 100]): self.add(glock(m2f(m), 0.5, self.R, dur=0.5), t + i * 0.05, g, p)
    def ticks(self, t0, dur, n=30, g=0.18):
        """a cascade of little glock ticks (things appearing / lighting up)"""
        for _ in range(n): self.add(glock(m2f(84 + int(self.R.integers(0, 12))), 0.3, self.R, dur=0.3), t0 + self.R.random() * dur, g, self.R.uniform(-0.6, 0.6))
    def horn(self, t, n=2, g=0.25, p=0.3, f=(392, 494)):
        for k in range(n): self.add(self.sine_glide(f[0], f[0], 0.14, 0.2, True) + 0.6 * self.sine_glide(f[1], f[1], 0.14, 0.2, True), t + k * 0.22, g, p)
    def flip(self, t, g=0.5): self.add(self.noise_burst(0.18, 1500, 7000, dec=0.06), t, g, 0.2)
    def boop_down(self, t, i=0, g=0.22): self.add(self.sine_glide(640 - i * 18, 220, 0.12, 0.05), t, g, self.R.uniform(-0.5, 0.5))
    def ring(self, t, dur, g=0.2, p=0.0):
        n = ns(dur); tt = np.arange(n) / SR
        tone = 0.5 * (np.sin(2 * np.pi * 400 * tt) + np.sin(2 * np.pi * 450 * tt)) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 25 * tt)))
        gate = ((tt % 2.0) < 0.4) | (((tt % 2.0) > 0.6) & ((tt % 2.0) < 1.0))
        self.add(lp(tone * gate, 3500) * 0.5, t, g, p)
    def siren(self, t, dur=1.4, g=0.12):
        n = ns(dur); tt = np.arange(n) / SR
        self.add(lp(np.sin(2 * np.pi * np.cumsum(np.where((tt % 0.7) < 0.35, 950, 760)) / SR) * fades(np.ones(n), 0.1, 0.3), 3000), t, g, 0.3)
    def notify(self, t, g=0.35):
        self.add(self.sine_glide(880, 880, 0.08, 0.1, True), t, g, 0.3); self.add(self.sine_glide(1320, 1320, 0.14, 0.1, True), t + 0.08, g, 0.3)
    def squeak(self, t, g=0.25): self.add(self.noise_burst(0.35, 2500, 6000, att=0.05, dec=0.3), t, g, 0.2)
    def power_down(self, t, g=0.5):
        n = ns(0.9); tt = np.arange(n) / SR
        self.add(lp(np.sign(np.sin(2 * np.pi * np.cumsum(300 * (40 / 300) ** (tt / 0.9)) / SR)) * np.exp(-tt / 0.5), 1200) * 0.5, t - 0.05, g)
    def growl(self, t, g=0.8):
        n = ns(1.3); tt = np.arange(n) / SR
        self.add(bp(colored(n, self.R, 0.3), 60, 260) * (0.6 + 0.4 * np.sin(2 * np.pi * 7 * tt)) * np.sin(np.pi * tt / 1.3) ** 0.7 * 3.0, t, g)
    def rustle(self, t, g=0.35): self.add(self.noise_burst(0.5, 800, 6000, att=0.05, dec=0.25), t, g)
    def crumple(self, t, g=0.4):
        for i in range(16): self.add(self.noise_burst(0.05, 1000, 8000, dec=0.015), t + i * 0.045 + self.R.random() * 0.02, g, self.R.uniform(-0.3, 0.3))
    def slap(self, t, g=0.8): self.add(self.noise_burst(0.25, 200, 3000, att=0.002, dec=0.06), t, g); self.thud(t, 0.5)
    def boing(self, t, f0=392.0, g=0.5, p=0.0):
        n = ns(0.35); tt = np.arange(n) / SR
        f = f0 * (1 + 1.6 * (1 - np.exp(-tt / 0.05))) * (1 + 0.06 * np.sin(2 * np.pi * 18 * tt) * np.exp(-tt / 0.15))
        self.add(fades(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.11), 0.002, 0.02), t, g, p)
    def footsteps(self, t0, t1, rate=3.0, g=0.25):
        """soft cartoon steps (walks)"""
        t = t0
        while t < t1: self.add(self.sine_glide(180, 90, 0.07, 0.03) + 0.3 * self.noise_burst(0.05, 300, 2000, dec=0.02)[: ns(0.07)], t, g, self.R.uniform(-0.2, 0.2)); t += 1 / rate
    def jump(self, t, g=0.4): self.add(self.sine_glide(300, 900, 0.18, 0.12), t, g)
    def land(self, t, g=0.5): self.thud(t, g * 0.8); self.add(self.noise_burst(0.1, 200, 1500, dec=0.03), t, g * 0.4)
    def ding(self, t, g=0.4): self.add(vibes(m2f(84), 0.6, self.R, dur=1.2), t, g, 0.1)
    def clap(self, t0, n=6, g=0.3):
        for i in range(n): self.add(self.noise_burst(0.06, 800, 5000, att=0.001, dec=0.02), t0 + i * 0.13 + self.R.random() * 0.03, g, self.R.uniform(-0.4, 0.4))
    def cash(self, t, g=0.4): self.ding(t, g); self.add(self.noise_burst(0.2, 3000, 9000, dec=0.08), t + 0.05, g * 0.6)

    # ---- mix ----
    def mix(self, out_dir):
        N = self.N
        vbuf = np.zeros((2, N)); n = min(N, self.voice.shape[1]); vbuf[:, :n] = self.voice[:, :n]
        vbuf = norm_to(vbuf, -16.0, "integrated")
        e = np.abs(vbuf[0]); win = ns(0.03); e = np.convolve(e, np.ones(win) / win, "same")
        env = np.zeros_like(e); a, r_ = np.exp(-1 / (0.01 * SR)), np.exp(-1 / (0.35 * SR)); v = 0.0
        for i in range(0, len(e), 48):
            x = e[i]; v = a * v + (1 - a) * x if x > v else r_ * v + (1 - r_) * x
            env[i:i + 48] = v
        duck = dbg(-9.0 * np.clip(env / (np.percentile(e[e > 1e-4], 60) + 1e-9), 0, 1))
        mus = norm_to(self.mus, -25.0, "integrated") * duck * dbg(3.0) if np.abs(self.mus).max() > 0 else self.mus
        sfx = norm_to(self.sfx, -19.0, "momentary") * dbg(-6.0) if np.abs(self.sfx).max() > 0 else self.sfx
        mix = vbuf + mus + sfx
        for _ in range(3):  # -14 LUFS with a soft limiter on the few SFX peaks
            mix = norm_to(mix, -14.0, "integrated")
            c = dbg(-1.5)
            mix = np.where(np.abs(mix) > 0.6 * c, np.sign(mix) * (0.6 * c + 0.4 * c * np.tanh((np.abs(mix) - 0.6 * c) / (0.4 * c))), mix)
        peak = true_peak(mix)
        if peak > -1.0: mix *= dbg(-1.0 - peak)
        os.makedirs(out_dir, exist_ok=True)
        for name, x in (("mix", mix), ("music", mus), ("sfx", sfx), ("voice", vbuf)): write_wav(os.path.join(out_dir, f"{name}.wav"), x)
        return integrated(mix), true_peak(mix), mix.shape[1] / SR
