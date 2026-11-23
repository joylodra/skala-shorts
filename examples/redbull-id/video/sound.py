# Red Bull Stratos sound: playful hook -> ascent (tension, rising) -> silence + whoosh for the jump -> freefall crisis ->
# sonic boom -> stadium cheer for the record -> the lesson groove + sting.
MEL = [[(0, 72, 0.6), (1.5, 76, 0.5), (2, 79, 0.8)], [(0, 81, 0.5), (1, 79, 0.5), (2, 76, 0.9)],
       [(0, 77, 0.6), (1.5, 76, 0.5), (2, 74, 0.8)], [(0, 74, 0.5), (1, 76, 0.5), (2, 79, 1.0)]]


def build(S):
    t, R = S.t, S.R
    # ---- score ----
    S.motif(0.1, [72, 76, 79, 84, 79, 76]); S.note(0.1, "pluck", 36, 0.7, 0.8, 0, 0.9)
    S.groove(t("tgl") - 0.05, t("redbull") - 0.05, ["C", "Am", "F", "G"], MEL)
    S.tension(t("redbull"), t("dibawah") - 0.1, ost=(45, 45, 52, 45, 48, 45, 52, 47))          # the ascent
    S.pad(t("dibawah"), (57, 64, 69), (S.events["lalu"] - S.events["dibawah"]) / 30 + 0.3, 0.45)  # awe: quiet pad only
    S.motif(t("bumi"), [84, 88, 91], step=0.25, inst="glock", g=0.35)
    S.tension(t("jatuh"), t("dan") - 0.1, crisis_from=t("jatuh"))                               # freefall
    S.groove(t("dan"), t("rb2") - 0.1, ["F", "G", "C", "C"], MEL, 1.2)                          # the crowd
    S.groove(t("rb2"), S.TOTAL - 1.3, ["Am", "F", "C", "G"])                                     # the lesson
    S.resolve(t("semua")); S.sting(S.TOTAL - 1.2)
    # ---- sfx ----
    S.add(S.noise_burst(0.15, 2000, 8000, dec=0.05), t("brand") + 0.1, 0.5)   # can opening hiss
    S.pop(t("angkasa"), 600)
    S.jump(t("lompat1") - 0.2); S.land(t("lompat1") + 0.6)
    S.whoosh(t("tgl"), 0.8)
    S.ticks(t("tgl") + 0.2, 0.6, n=6)
    S.whoosh(t("balon") + 0.6, 0.5, -0.3, dur=1.4)                               # balloon lift
    S.ding(t("km39"))
    S.whoosh(t("lompat2") + 0.25, 0.9, 0.0, dur=0.8); S.thud(t("lompat2"), 0.5)  # the step off
    for k in range(8): S.boop_down(t("kecepatan") + k * 0.15, -8 - 4 * k, 0.15)   # speed climbing (pitch up)
    S.thud(t("suara"), 1.2); S.power_down(t("suara") + 0.05, 0.3); S.whoosh(t("suara") + 0.1, 0.9)
    S.notify(t("juta") - 0.3)
    S.cash(t("rekor")); S.clap(t("rekor"), 14, 0.35)
    S.boing(t("ga"), 300, 0.4); S.squeak(t("iklan"))
    S.ding(t("momen"))
    S.whoosh(t("semua"), 0.6); S.clap(t("semua") + 0.1, 10, 0.3)
