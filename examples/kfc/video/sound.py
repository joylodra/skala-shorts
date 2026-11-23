# KFC short sound: score sections + SFX cues on the story events (events.json). S = audio/engine.py Session.
# S.t("event") -> seconds on the final timeline; music helpers: groove, tension, motif, wahwah, resolve, sting, pad, note;
# SFX: pop, thud, whoosh, sparkle, ticks, horn, flip, boop_down, ring, siren, notify, squeak, power_down, growl, rustle,
# crumple, slap, boing, footsteps, jump, land, ding, clap, cash.

MEL = [[(0, 72, 0.6), (1.5, 76, 0.5), (2, 79, 0.8)], [(0, 81, 0.5), (1, 79, 0.5), (2, 76, 0.9)],
       [(0, 77, 0.6), (1.5, 76, 0.5), (2, 74, 0.8)], [(0, 74, 0.5), (1, 76, 0.5), (2, 79, 1.0)]]
MEL2 = [[(0, 79, 0.5), (1, 76, 0.5), (2, 72, 0.6), (3, 74, 0.6)], [(0, 76, 0.5), (1.5, 77, 0.5), (2, 79, 1.0)],
        [(0, 81, 0.5), (1, 79, 0.5), (2, 77, 0.6), (3, 76, 0.6)], [(0, 74, 0.6), (2, 79, 1.0)]]


def build(S):
    t, R = S.t, S.R
    # ---- score ----
    S.motif(0.15, [72, 76, 79, 84, 79, 76]); S.note(0.15, "pluck", 36, 0.7, 0.8, 0, 0.9)     # hook motif
    S.wahwah(t("chicken1") + 0.45)                                                             # "ran out of chicken"
    S.groove(t("flash"), t("within") - 0.1, ["C", "Am", "F", "G"], MEL)                       # setting groove
    S.tension(t("within") - 0.1, t("shop") - 0.2, crisis_from=t("fans") - 0.2)               # tension -> crisis
    S.motif(t("laughing") - 0.9, [84, 81, 77, 74, 72], step=0.16, inst="glock", g=0.4, p=0.3) # music stops on "no"
    for ev, m2 in (("luckily", 64), ("unluckily", 56)):                                      # deadpan boops
        S.note(t(ev), "pluck", 60, 0.6, 0.6, 0, 0.6); S.note(t(ev) + 0.3, "pluck", m2, 0.5, 1.0, 0, 0.5)
    S.pad(t("luckily") - 0.2, (45, 52, 57), 5.0, 0.3)
    S.groove(t("most") - 0.05, t("sorry") - 0.05, ["F", "G", "C", "Am"], MEL2, 1.1)            # cheeky reveal
    S.resolve(t("sorry"))
    S.sting(S.tmap(59.1) + 0.15)                                                               # after the last word
    # ---- sfx ----
    S.add(S.noise_burst(0.12, 300, 2500), t("out") - 0.05, 0.5)   # bucket lid
    S.whoosh(t("flash"), 0.8)
    S.sparkle(t("valentine"))
    S.whoosh(t("partner") + 0.05, 0.6, 0.4, dur=0.5); S.horn(t("partner") + 0.35)
    S.pop(t("warehouse"), 520)
    S.ticks(t("nine") + 0.05, 1.2)
    S.horn(t("late"), f=(330, 415), g=0.3, p=-0.3)
    S.flip(t("day3") + 0.05)
    for i in range(12): S.boop_down(t("closing") + i * (t("half") + 0.3 - t("closing")) / 12, i)
    S.thud(t("shut"))
    for t0, p in ((t("fans") - 0.5, -0.5), (t("fans") - 0.2, 0.5), (t("fans") + 0.3, 0.0)): S.ring(t0, t("police") + 1.2 - t0, 0.2, p)
    S.siren(t("police") - 0.1)
    S.notify(t("tweet") - 1.0)
    S.squeak(t("matter"))
    S.power_down(t("no")); S.thud(t("no"), 1.0)
    for n in range(26): S.pop(S.tmap((S.events["laughing"] - 6 + n * 2.6) / 30), 500 + 400 * R.random(), 0.3, R.uniform(-0.7, 0.7))
    S.growl(t("hungry") - 0.05)
    S.rustle(t("hide") - 0.1)
    S.crumple(t("bought"))
    S.whoosh(t("newspaper", -14) + 0.14, 0.6, 0.5, dur=0.45)
    S.slap(t("newspaper"))
    S.pop(t("bucket") - 0.1, 400)
    for k, f0, p in (("F", 330, -0.3), ("C", 392, 0.0), ("K", 440, 0.3)): S.boing(t(k) - 0.05, f0, 0.5, p)
