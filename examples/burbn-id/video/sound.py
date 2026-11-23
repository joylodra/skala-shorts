# Test short sound: hook motif -> groove -> sad beat -> cut -> launch-day celebration -> lesson + sting.
MEL = [[(0, 72, 0.6), (1.5, 76, 0.5), (2, 79, 0.8)], [(0, 81, 0.5), (1, 79, 0.5), (2, 76, 0.9)],
       [(0, 77, 0.6), (1.5, 76, 0.5), (2, 74, 0.8)], [(0, 74, 0.5), (1, 76, 0.5), (2, 79, 1.0)]]


def build(S):
    t, R = S.t, S.R
    # score
    S.motif(0.15, [72, 76, 79, 84, 79, 76]); S.note(0.15, "pluck", 36, 0.7, 0.8, 0, 0.9)
    S.groove(t("flash"), t("hasilnya") - 0.1, ["C", "Am", "F", "G"], MEL)
    S.wahwah(t("pakai") + 0.2)
    S.tension(t("tapi") - 0.05, t("hari") - 0.1, crisis_from=t("jadi"))
    S.groove(t("hari"), t("pelajaran") - 0.05, ["F", "G", "C", "C"], MEL, 1.2)
    S.groove(t("pelajaran"), S.TOTAL - 1.3, ["Am", "F", "C", "G"])
    S.sting(S.TOTAL - 1.2)
    # sfx
    S.whoosh(t("flash"), 0.8)
    S.pop(t("flash", 6), 520); S.ding(t("burbn"))
    for ev in ("macam", "checkin", "poin", "rencana", "foto2"): S.pop(t(ev), 600 + 40 * R.random(), 0.5, R.uniform(-0.4, 0.4))
    S.boop_down(t("hampir")); S.boop_down(t("pakai") - 0.1, 3)
    S.sparkle(t("foto3"))
    S.squeak(t("hapus")); S.whoosh(t("semuanya") + 0.2, 0.7); S.thud(t("semuanya"), 0.8)
    for ev in ("foto4", "filter", "like"): S.pop(t(ev), 700, 0.55)
    S.ticks(t("instagram"), (S.events["daftar"] - S.events["instagram"]) / 30, n=40); S.cash(t("daftar")); S.clap(t("daftar") + 0.1, 10)
    S.boing(t("jangan"), 300, 0.4)
    S.ding(t("cari")); S.crumple(t("buang") - 0.5); S.whoosh(t("buang") + 0.15, 0.6, 0.5, dur=0.45)
