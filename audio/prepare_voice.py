# Voice prep for a Skala short: any audio file -> tightened voice + word timings + captions.
#   1. convert to 48 kHz mono wav
#   2. tighten (default on): pauses longer than --mingap are cut to --maxgap, then tempo x --speed (pitch kept)
#   3. transcribe the FINAL voice with faster-whisper (word timestamps; --lang en | id | auto)
#   4. write captions (2-3 word chunks) to src/video/captions.ts and an identity time map to src/video/timemap.ts
# Outputs in <project>/voice/: voice_final.wav, words.json, words.txt (one "time word" per line, for timing the picture)
# usage: python prepare_voice.py <project_dir> <voice file> [--lang auto] [--speed 1.12] [--maxgap 0.2] [--no-tighten]
import argparse, json, os, re, subprocess, sys, tempfile
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dsp import SR, read_wav, write_wav

ap = argparse.ArgumentParser()
ap.add_argument("project"); ap.add_argument("voice")
ap.add_argument("--lang", default="auto"); ap.add_argument("--speed", type=float, default=1.12)
ap.add_argument("--maxgap", type=float, default=0.2); ap.add_argument("--mingap", type=float, default=0.22)
ap.add_argument("--no-tighten", action="store_true"); ap.add_argument("--model", default=None)
ap.add_argument("--chunk-words", type=int, default=3); ap.add_argument("--chunk-chars", type=int, default=18)
a = ap.parse_args()
P = os.path.abspath(a.project); V = os.path.join(P, "voice"); os.makedirs(V, exist_ok=True)

# 1. convert
src = os.path.join(V, "voice_src.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", a.voice, "-ar", str(SR), "-ac", "1", src], check=True)
x, _ = read_wav(src); m = x.mean(0)

# 2. tighten
final = os.path.join(V, "voice_final.wav")
if a.no_tighten:
    write_wav(final, x)
else:
    hop = int(0.01 * SR)
    rms = np.array([np.sqrt(np.mean(m[i:i + hop] ** 2) + 1e-12) for i in range(0, len(m), hop)])
    quiet = 20 * np.log10(rms / rms.max()) < -38
    gaps, i = [], 0
    while i < len(quiet):
        if quiet[i]:
            j = i
            while j < len(quiet) and quiet[j]: j += 1
            g0, g1 = i * hop / SR, j * hop / SR
            if g1 - g0 > a.mingap: gaps.append((g0, g1))
            i = j
        else: i += 1
    dur = len(m) / SR
    keep, t = [], 0.0
    for g0, g1 in gaps:
        if g0 <= 0.001: t = max(0.0, g1 - 0.05); continue
        if g1 >= dur - 0.01: keep.append((t, min(dur, g0 + 0.3))); t = None; break
        keep.append((t, g0 + a.maxgap / 2)); t = g1 - a.maxgap / 2
    if t is not None: keep.append((t, dur))
    fade = int(0.006 * SR); segs = []
    for k, (s0, s1) in enumerate(keep):
        seg = x[:, int(s0 * SR): int(s1 * SR)].copy(); r = np.linspace(0, 1, fade)
        if k: seg[:, :fade] *= r
        if k < len(keep) - 1: seg[:, -fade:] *= r[::-1]
        segs.append(seg)
    tmp = final + ".cut.wav"; write_wav(tmp, np.concatenate(segs, axis=1))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-af", f"atempo={a.speed}", "-ar", str(SR), final], check=True)
    os.remove(tmp)
    print(f"tightened: {len(gaps)} pauses, {dur:.2f} s -> {read_wav(final)[0].shape[1] / SR:.2f} s (speed x{a.speed})")

# 3. transcribe
from faster_whisper import WhisperModel
y, _ = read_wav(final); y16 = y.mean(0)
y16 = np.interp(np.arange(0, len(y16), SR / 16000), np.arange(len(y16)), y16).astype(np.float32)
model = a.model or ("small.en" if a.lang == "en" else "small")
wm = WhisperModel(model, device="cpu", compute_type="int8")
segs, info = wm.transcribe(y16, word_timestamps=True, beam_size=5, language=None if a.lang == "auto" else a.lang)
words = [{"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)} for s in segs for w in s.words]
json.dump({"language": info.language, "words": words}, open(os.path.join(V, "words.json"), "w"), indent=0)
with open(os.path.join(V, "words.txt"), "w") as f:
    for w in words: f.write(f"{w['s']:7.2f}s  f{round(w["s"] * 30):04d}  {w['w']}\n")
print(f"language {info.language}, {len(words)} words, last word ends {words[-1]['e']:.2f} s")

# 4. captions (identity time map: the picture is timed on this final voice)
toks = []
for w in words:
    glue = w["w"].startswith("-") or (w["w"][:1] in ".," and w["w"][1:2].isdigit() and toks and toks[-1]["w"][-1:].isdigit())
    if glue and toks: toks[-1]["w"] += w["w"]; toks[-1]["e"] = w["e"]
    else: toks.append(dict(w))
chunks, cur = [], []
for t_ in toks:
    cur.append(t_)
    if re.search(r"[.,!?;:]$", t_["w"]) or len(cur) >= a.chunk_words or len(" ".join(c["w"] for c in cur)) >= a.chunk_chars:
        chunks.append(cur); cur = []
if cur: chunks.append(cur)
C = []
for i, c in enumerate(chunks):
    s0 = max(0.0, c[0]["s"] - 0.05)
    s1 = chunks[i + 1][0]["s"] - 0.05 if i + 1 < len(chunks) else c[-1]["e"] + 0.6
    C.append({"text": " ".join(re.sub(r"[.,!?;:]", "", x["w"]) for x in c), "a": round(s0, 3), "b": round(min(s1, c[-1]["e"] + 0.5), 3)})
vid = os.path.join(P, "src", "video")
with open(os.path.join(vid, "captions.ts"), "w") as f:
    f.write("// generated by audio/prepare_voice.py from voice/words.json (seconds on the final timeline); edit text freely\n")
    f.write("export const CAPTIONS: { text: string; a: number; b: number }[] = " + json.dumps(C, indent=1, ensure_ascii=False) + ";\n")
with open(os.path.join(vid, "timemap.ts"), "w") as f:
    f.write("// identity time map: the picture is timed on voice/voice_final.wav (see references/authoring.md: re-timing)\n")
    f.write("export const ANCHORS: [number, number][] = [[0, 0], [10000, 10000]];\nexport const toNew = (t: number) => t;\nexport const toOld = (t: number) => t;\n")
tm = os.path.join(V, "timemap.json")
if os.path.exists(tm): os.remove(tm)  # no re-timing: the sound engine then uses identity too
print(f"{len(C)} captions -> src/video/captions.ts")
