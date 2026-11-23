# Build the sound for a Skala short project: runs the project's src/video/sound.py (score + cues) on the engine
# Session and writes <project>/audio_out/{mix,music,sfx,voice}.wav.
# usage: python make_audio.py <project_dir>
import sys, os, importlib.util
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from engine import Session

project = os.path.abspath(sys.argv[1])
spec = importlib.util.spec_from_file_location("sound", os.path.join(project, "src", "video", "sound.py"))
sound = importlib.util.module_from_spec(spec); spec.loader.exec_module(sound)
S = Session(project)
sound.build(S)
lufs, tp, dur = S.mix(os.path.join(project, "audio_out"))
print(f"mix {lufs:.1f} LUFS, true peak {tp:.1f} dBTP, {dur:.2f} s")
