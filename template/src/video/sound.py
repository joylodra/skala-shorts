# STARTER sound (replace for each video): score + SFX cues on events.json. S = audio/engine.py Session.
# See examples/kfc/video/sound.py and references/sound.md.

def build(S):
    t = S.t
    S.groove(0.0, S.TOTAL - 1.2, ["C", "Am", "F", "G"])
    S.sparkle(t("hello"))
    S.whoosh(S.tmap(75 / 30), 0.6)
    S.sting(S.TOTAL - 1.1)
