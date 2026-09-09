# -*- coding: utf-8 -*-
"""Aylik nobet listesi olusturucu. Kullanim: python -X utf8 nobet.py <ay>.json"""

import calendar
import csv
import json
import sys
from collections import defaultdict

GUNADI = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]
GUNTAM = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"]
AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
         "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]

VARSAYILAN_AGIRLIK = {
    "saat_dengesi": 1.0,
    "hafta_sonu": 3.0,
    "sunum_yuku": 3.0,
    "gun_asiri": 8.0,
    "uzman_tekrari": 2.0,
    "gun_dagilimi": 1.5,
    "istemedigi_gun": 20.0,
    "istedigi_gun": 6.0,
    "ozel_kural": 10.0,
    "kidem_avantaji": 0.10,
    "isteksizlik_avantaji": 0.04,
}

VARSAYILAN_GUN_TILT = [0.0, 0.0, 0.0, -1.0, 0.0, 1.0, 1.0]

OZEL_KURALLAR = ["ay_basi_yogun", "ay_sonu_yogun", "ay_ortasi_bos", "gun_asiri_serbest"]


class Zar(object):
    """32 bit xorshift. Arayuzdeki JS ayniyla ayni diziyi uretir."""

    def __init__(self, tohum):
        self.s = (tohum or 1) & 0xFFFFFFFF

    def next(self):
        s = self.s
        s = (s ^ (s << 13)) & 0xFFFFFFFF
        s = s ^ (s >> 17)
        s = (s ^ (s << 5)) & 0xFFFFFFFF
        self.s = s
        return s / 4294967296.0

    def sec(self, dizi):
        return dizi[int(self.next() * len(dizi))]


def gunler_ac(x):
    out = []
    if x is None:
        return out
    if isinstance(x, bool):
        return out
    if isinstance(x, (int, float)):
        return [int(x)]
    if isinstance(x, list):
        for y in x:
            out.extend(gunler_ac(y))
        return out
    p = str(x).split("-")
    try:
        a = int(p[0])
        b = int(p[1]) if len(p) > 1 else a
    except ValueError:
        return out
    return list(range(a, b + 1))


def yukle(yol):
    with open(yol, encoding="utf-8") as f:
        return normalize(json.load(f))


def normalize(v):
    v.setdefault("sutunlar", [
        {"ad": "Ybü-1", "tur": "yb"}, {"ad": "Ybü-2", "tur": "yb"},
        {"ad": "Amel-1", "tur": "amel"}, {"ad": "Amel-2", "tur": "amel"}])
    v.setdefault("uzman", {})
    v.setdefault("tatil", [])
    v.setdefault("sunum_gunleri", [1, 2])
    v.setdefault("sunum_yok", [])
    v.setdefault("kilit", {})
    gt = list(v.get("gun_tilt") or VARSAYILAN_GUN_TILT)
    gt = (gt + VARSAYILAN_GUN_TILT[len(gt):])[:7]
    v["gun_tilt"] = [float(x) for x in gt]
    a = dict(VARSAYILAN_AGIRLIK)
    a.update(v.get("agirlik", {}))
    v["agirlik"] = a
    sut = [s["ad"] for s in v["sutunlar"]]
    for i, k in enumerate(v["asistanlar"]):
        k.setdefault("kisa", k["ad"])
        k.setdefault("torba", list(sut))
        k.setdefault("kota", 0)
        k.setdefault("ozel", [])
        k["izin"] = gunler_ac(k.get("izin"))
        k["istiyor"] = gunler_ac(k.get("istiyor"))
        k["istemiyor"] = gunler_ac(k.get("istemiyor"))
        k["_kidem"] = i + 1
    v["_gun"] = calendar.monthrange(v["yil"], v["ay"])[1]
    v["_kisi"] = {k["ad"]: k for k in v["asistanlar"]}
    v["_sut"] = sut
    v["_tatil"] = set(gunler_ac(v["tatil"]))
    v["_sunum_yok"] = set(gunler_ac(v["sunum_yok"]))
    hazirla(v)
    return v


def hafta_gunu(v, g):
    return calendar.weekday(v["yil"], v["ay"], g)


def bos_gun(v, g):
    if g < 1 or g > v["_gun"]:
        return True
    return hafta_gunu(v, g) >= 5 or g in v["_tatil"]


def saat(v, g):
    bugun = bos_gun(v, g)
    yarin = bos_gun(v, g + 1)
    if not bugun and yarin:
        return 16
    if bugun and yarin:
        return 24
    if bugun and not yarin:
        return 16
    return 8


def yorucu(v, g):
    e = g + 1
    if e > v["_gun"] or e in v["_sunum_yok"]:
        return False
    return hafta_gunu(v, e) in v["sunum_gunleri"]


def hazirla(v):
    n = v["_gun"]
    v["_saat"] = {g: saat(v, g) for g in range(1, n + 1)}
    v["_hs"] = {g: bos_gun(v, g) for g in range(1, n + 1)}
    v["_yor"] = {g: yorucu(v, g) for g in range(1, n + 1)}
    kisiler = [k for k in v["asistanlar"] if k["kota"] > 0]
    v["_aktif"] = kisiler
    N = len(kisiler)
    top_kota = sum(k["kota"] for k in kisiler) or 1
    ns = len(v["sutunlar"])
    kat = float(top_kota) / n
    top_saat = sum(v["_saat"][g] for g in range(1, n + 1)) * kat
    top_hs = sum(1 for g in range(1, n + 1) if v["_hs"][g]) * kat
    top_yor = sum(1 for g in range(1, n + 1) if v["_yor"][g]) * kat

    kd = sorted(kisiler, key=lambda k: k["_kidem"])
    istek = sorted(kisiler, key=lambda k: len(k["istiyor"]) + len(k["istemiyor"]))
    adv = {}
    for k in kisiler:
        rk = kd.index(k)
        ri = istek.index(k)
        ak = 1 - 2.0 * rk / (N - 1) if N > 1 else 0.0
        ai = 1 - 2.0 * ri / (N - 1) if N > 1 else 0.0
        adv[k["ad"]] = (v["agirlik"]["kidem_avantaji"] * ak
                        + v["agirlik"]["isteksizlik_avantaji"] * ai)

    def hedefle(toplam, tilt):
        ham = {k["ad"]: toplam * k["kota"] / top_kota * (1 - tilt * adv[k["ad"]]) for k in kisiler}
        s = sum(ham.values()) or 1.0
        return {ad: x * toplam / s for ad, x in ham.items()}

    v["_hedef_saat"] = hedefle(top_saat, 0)
    v["_hedef_hs"] = hedefle(top_hs, 1)
    v["_hedef_yor"] = hedefle(top_yor, 1)
    v["_hg"] = {g: hafta_gunu(v, g) for g in range(1, n + 1)}
    nd = [0] * 7
    for g in range(1, n + 1):
        nd[v["_hg"][g]] += 1
    v["_hedef_gun"] = {}
    for k in kisiler:
        v["_hedef_gun"][k["ad"]] = [
            nd[d] * k["kota"] / float(n) * (1 - v["gun_tilt"][d] * adv[k["ad"]]) for d in range(7)]
    v["_uygun"] = {k["ad"]: set(range(1, n + 1)) - set(k["izin"]) for k in kisiler}
    v["_torba"] = {}
    v["_ops"] = set()
    for si, s in enumerate(v["sutunlar"]):
        v["_torba"][si] = [k["ad"] for k in kisiler if s["ad"] in k["torba"]]
        if s.get("opsiyonel"):
            v["_ops"].add(si)


def uzman_o_gun(v, g, tur):
    return (v["uzman"].get(str(g)) or {}).get(tur)


def kisi_maliyet(v, ad, slotlar):
    w = v["agirlik"]
    k = v["_kisi"][ad]
    n = v["_gun"]
    gunler = set(g for g, _ in slotlar)
    c = w["saat_dengesi"] * abs(sum(v["_saat"][g] for g in gunler) - v["_hedef_saat"][ad])
    c += w["hafta_sonu"] * abs(sum(1 for g in gunler if v["_hs"][g]) - v["_hedef_hs"][ad])
    c += w["sunum_yuku"] * abs(sum(1 for g in gunler if v["_yor"][g]) - v["_hedef_yor"][ad])
    if "gun_asiri_serbest" not in k["ozel"]:
        c += w["gun_asiri"] * sum(1 for g in gunler if g + 2 in gunler)
    c += w["istemedigi_gun"] * len(gunler & set(k["istemiyor"]))
    c -= w["istedigi_gun"] * len(gunler & set(k["istiyor"]))
    sg = [0] * 7
    for g in gunler:
        sg[v["_hg"][g]] += 1
    hg = v["_hedef_gun"][ad]
    c += w["gun_dagilimi"] * sum(abs(sg[d] - hg[d]) for d in range(7))
    say = defaultdict(int)
    for g, si in slotlar:
        u = uzman_o_gun(v, g, v["sutunlar"][si]["tur"])
        if u:
            say[u] += 1
    c += w["uzman_tekrari"] * sum(x - 1 for x in say.values() if x > 1)
    if gunler and n > 1 and k["ozel"]:
        konum = [(g - 1.0) / (n - 1) for g in gunler]
        ort = sum(konum) / len(konum)
        if "ay_basi_yogun" in k["ozel"]:
            c += w["ozel_kural"] * ort * len(gunler)
        if "ay_sonu_yogun" in k["ozel"]:
            c += w["ozel_kural"] * (1 - ort) * len(gunler)
        if "ay_ortasi_bos" in k["ozel"]:
            c += w["ozel_kural"] * sum(1 for x in konum if 1.0 / 3 <= x <= 2.0 / 3)
    return c


class Plan(object):
    def __init__(self, v):
        self.v = v
        self.atama = {}
        self.slot = defaultdict(list)
        self.gun = defaultdict(set)
        self.bos = []
        self.bos_ops = []
        self.eksik = {}

    def kur(self, g, si, ad):
        self.atama[(g, si)] = ad
        self.slot[ad].append((g, si))
        self.gun[ad].add(g)

    def sil(self, g, si):
        ad = self.atama.pop((g, si))
        self.slot[ad].remove((g, si))
        if not any(x == g for x, _ in self.slot[ad]):
            self.gun[ad].discard(g)
        return ad

    def uygun(self, ad, g, si):
        v = self.v
        if v["sutunlar"][si]["ad"] not in v["_kisi"][ad]["torba"]:
            return False
        if g not in v["_uygun"][ad]:
            return False
        gunler = self.gun[ad]
        return not (g - 1 in gunler or g in gunler or g + 1 in gunler)

    def maliyet(self):
        return sum(kisi_maliyet(self.v, ad, s) for ad, s in self.slot.items() if s)


def kur_ilk(v, tohum=7):
    rnd = Zar(tohum)
    p = Plan(v)
    n = v["_gun"]
    ns = len(v["sutunlar"])
    kalan = {k["ad"]: k["kota"] for k in v["_aktif"]}
    for gs, sec in v.get("kilit", {}).items():
        g = int(gs)
        for sad, ad in sec.items():
            if sad in v["_sut"] and ad in kalan:
                p.kur(g, v["_sut"].index(sad), ad)
                kalan[ad] -= 1
    tum = [(g, si) for g in range(1, n + 1) for si in range(ns) if (g, si) not in p.atama]

    def kitlik(x):
        g, si = x
        return sum(1 for ad in v["_torba"][si] if kalan[ad] > 0 and p.uygun(ad, g, si))

    for opsiyonel in (False, True):
      slotlar = [x for x in tum if (x[1] in v["_ops"]) == opsiyonel]
      while slotlar:
        slotlar.sort(key=kitlik)
        g, si = slotlar.pop(0)
        aday = [ad for ad in v["_torba"][si] if kalan[ad] > 0 and p.uygun(ad, g, si)]
        if not aday:
            (p.bos_ops if opsiyonel else p.bos).append((g, si))
            continue

        def puan(ad):
            torba = [j for j in range(ns) if v["sutunlar"][j]["ad"] in v["_kisi"][ad]["torba"]]
            uygun_kalan = sum(1 for d in v["_uygun"][ad]
                              if d not in p.gun[ad] and d - 1 not in p.gun[ad] and d + 1 not in p.gun[ad]
                              for j in torba if (d, j) not in p.atama)
            aciliyet = kalan[ad] / max(1.0, float(uygun_kalan))
            eski = kisi_maliyet(v, ad, p.slot[ad])
            yeni = kisi_maliyet(v, ad, p.slot[ad] + [(g, si)])
            return (yeni - eski) - 1000.0 * aciliyet + rnd.next() * 0.01

        ad = min(aday, key=puan)
        p.kur(g, si, ad)
        kalan[ad] -= 1
    onar(p, kalan)
    p.eksik = {ad: x for ad, x in kalan.items() if x}
    return p


def onar(p, kalan, tur=3):
    """Bos kalan slotlari yer degistirerek doldurmayi dener."""
    v = p.v
    for _ in range(tur):
        if not p.bos:
            return
        kaldi = []
        for g, si in p.bos:
            aday = [ad for ad in v["_torba"][si] if kalan[ad] > 0 and p.uygun(ad, g, si)]
            if aday:
                ad = min(aday, key=lambda x: kisi_maliyet(v, x, p.slot[x] + [(g, si)]))
                p.kur(g, si, ad)
                kalan[ad] -= 1
                continue
            if not tasi(p, kalan, g, si):
                kaldi.append((g, si))
        if len(kaldi) == len(p.bos):
            p.bos = kaldi
            return
        p.bos = kaldi


def tasi(p, kalan, g, si):
    """(g,si) bos: bir atamayi kotasi dolmamis birine devredip yerini bosaltir."""
    v = p.v
    for (g2, si2), r in list(p.atama.items()):
        if (g2, si2) == (g, si) or r == p.atama.get((g, si)):
            continue
        if v["sutunlar"][si]["ad"] not in v["_kisi"][r]["torba"]:
            continue
        if g not in v["_uygun"][r]:
            continue
        p.sil(g2, si2)
        if p.uygun(r, g, si):
            for q in v["_torba"][si2]:
                if kalan[q] > 0 and p.uygun(q, g2, si2):
                    p.kur(g2, si2, q)
                    p.kur(g, si, r)
                    kalan[q] -= 1
                    return True
        p.kur(g2, si2, r)
    return False


def iyilestir(p, tur=60000, tohum=7):
    v = p.v
    rnd = Zar(tohum + 1)
    kilitli = set()
    for gs, sec in v.get("kilit", {}).items():
        for sad in sec:
            if sad in v["_sut"]:
                kilitli.add((int(gs), v["_sut"].index(sad)))
    serbest = [x for x in p.atama if x not in kilitli]
    if len(serbest) < 2:
        return p
    for _ in range(tur):
        a = rnd.sec(serbest)
        b = rnd.sec(serbest)
        if a == b:
            continue
        ad1, ad2 = p.atama[a], p.atama[b]
        if ad1 == ad2:
            continue
        eski = kisi_maliyet(v, ad1, p.slot[ad1]) + kisi_maliyet(v, ad2, p.slot[ad2])
        p.sil(a[0], a[1])
        p.sil(b[0], b[1])
        if p.uygun(ad1, b[0], b[1]) and p.uygun(ad2, a[0], a[1]):
            p.kur(b[0], b[1], ad1)
            p.kur(a[0], a[1], ad2)
            yeni = kisi_maliyet(v, ad1, p.slot[ad1]) + kisi_maliyet(v, ad2, p.slot[ad2])
            if yeni < eski - 1e-9:
                continue
            p.sil(b[0], b[1])
            p.sil(a[0], a[1])
        p.kur(a[0], a[1], ad1)
        p.kur(b[0], b[1], ad2)
    return p


def coz(v, tur=60000, tohum=7):
    return iyilestir(kur_ilk(v, tohum), tur, tohum)


def ozet(v, p):
    sat = []
    for k in v["_aktif"]:
        ad = k["ad"]
        s = p.slot.get(ad, [])
        gunler = set(g for g, _ in s)
        sat.append({
            "ad": ad, "kidem": k["_kidem"], "kota": k["kota"], "atanan": len(s),
            "saat": sum(v["_saat"][g] for g in gunler),
            "hedef_saat": v["_hedef_saat"][ad],
            "hs": sum(1 for g in gunler if v["_hs"][g]),
            "yor": sum(1 for g in gunler if v["_yor"][g]),
            "asiri": sum(1 for g in gunler if g + 2 in gunler),
            "istemedigi": len(gunler & set(k["istemiyor"])),
            "istedigi": len(gunler & set(k["istiyor"])),
            "gun": [sum(1 for g in gunler if v["_hg"][g] == d) for d in range(7)],
            "uzman": uzman_tekrar(v, s),
        })
    return sat


def uzman_tekrar(v, slotlar):
    say = defaultdict(int)
    for g, si in slotlar:
        u = uzman_o_gun(v, g, v["sutunlar"][si]["tur"])
        if u:
            say[u] += 1
    return sum(x - 1 for x in say.values() if x > 1)


DENGE = {"saat": 1.0, "hs": 3.0, "yor": 3.0, "gun": 2.0, "asiri": 10.0,
         "istemedigi": 25.0, "istedigi": -8.0, "uzman": 4.0}

OTO_ALAN = ["saat_dengesi", "hafta_sonu", "sunum_yuku", "gun_asiri", "uzman_tekrari",
            "istemedigi_gun", "istedigi_gun", "ozel_kural", "gun_dagilimi"]


def denge(v, p):
    """Agirliklardan bagimsiz denge skoru. Kucuk olan iyi."""
    t = 0.0
    for x in ozet(v, p):
        ad = x["ad"]
        hg = v["_hedef_gun"][ad]
        t += DENGE["saat"] * abs(x["saat"] - v["_hedef_saat"][ad])
        t += DENGE["hs"] * abs(x["hs"] - v["_hedef_hs"][ad])
        t += DENGE["yor"] * abs(x["yor"] - v["_hedef_yor"][ad])
        t += DENGE["gun"] * sum(abs(x["gun"][d] - hg[d]) for d in range(7))
        t += DENGE["asiri"] * x["asiri"]
        t += DENGE["istemedigi"] * x["istemedigi"]
        t += DENGE["istedigi"] * x["istedigi"]
        t += DENGE["uzman"] * x["uzman"]
    t += 1000.0 * (len(p.bos) + sum(p.eksik.values()))
    return t


def oto(v, deneme=20, tur=8000, tohum=7):
    """Agirlik izgarasini tarar, denge skoru en kucuk olani birakir."""
    rnd = Zar(tohum + 99)
    esas = dict(v["agirlik"])
    en_a, en_s = dict(esas), None
    for i in range(deneme):
        a = dict(esas)
        if i:
            for k in OTO_ALAN:
                a[k] = esas[k] * (0.35 + 3.0 * rnd.next())
        v["agirlik"] = a
        hazirla(v)
        s = denge(v, coz(v, tur, tohum))
        if en_s is None or s < en_s:
            en_s, en_a = s, dict(a)
    v["agirlik"] = en_a
    hazirla(v)
    return en_a, en_s


def tarih(v, g):
    return "%02d.%02d.%02d" % (g, v["ay"], v["yil"] % 100)


def yaz_tablo(v, p):
    n = v["_gun"]
    turler = []
    for s in v["sutunlar"]:
        if s["tur"] not in turler:
            turler.append(s["tur"])
    print("%s %d Nöbet Listesi" % (AYLAR[v["ay"] - 1], v["yil"]))
    bas = "%-9s %-4s " % ("Tarih", "Gün")
    bas += " ".join("%-13s" % ("Uzman " + t) for t in turler) + " "
    bas += " ".join("%-11s" % s["ad"][:11] for s in v["sutunlar"])
    print(bas)
    print("-" * len(bas))
    for g in range(1, n + 1):
        huc = ["%-13s" % ((uzman_o_gun(v, g, t) or "—")[:13]) for t in turler]
        for si in range(len(v["sutunlar"])):
            ad = p.atama.get((g, si))
            huc.append("%-11s" % (v["_kisi"][ad]["kisa"] if ad else "—"))
        ek = ""
        if v["_yor"][g]:
            ek += "  sunum"
        if g in v["_tatil"]:
            ek += "  tatil"
        print("%-9s %-4s %s%s" % (tarih(v, g), GUNADI[v["_hg"][g]], " ".join(huc), ek))
    print()
    print("%-12s %3s %5s %5s %6s %5s %4s %5s %4s %4s   %s" %
          ("Asistan", "Kd", "Kota", "Atan", "Saat", "Hedef", "HS", "Sunum", "G±2", "İst",
           " ".join("%3s" % d for d in GUNADI)))
    for x in sorted(ozet(v, p), key=lambda y: y["kidem"]):
        print("%-12s %3d %5d %5d %6d %5d %4d %5d %4d %4d   %s" %
              (v["_kisi"][x["ad"]]["kisa"], x["kidem"], x["kota"], x["atanan"], x["saat"],
               round(x["hedef_saat"]), x["hs"], x["yor"], x["asiri"],
               x["istedigi"] - x["istemedigi"],
               " ".join("%3d" % y for y in x["gun"])))
    print()
    if p.bos:
        print("DOLDURULAMADI: " + ", ".join("%d/%s" % (g, v["_sut"][si]) for g, si in p.bos))
    if p.bos_ops:
        print("Opsiyonel boş: %d slot" % len(p.bos_ops))
    if p.eksik:
        print("KOTASI DOLMADI: " + ", ".join("%s %d" % (a, x) for a, x in p.eksik.items()))
    print("Maliyet: %.1f   Denge: %.1f" % (p.maliyet(), denge(v, p)))


def tur_adi(t):
    return "YBÜ Uzmanı" if t == "yb" else "Ameliyathane Uzmanı"


def yaz_csv(v, p, yol):
    with open(yol, "w", newline="", encoding="utf-8-sig") as f:
        turler = []
        for s in v["sutunlar"]:
            if s["tur"] not in turler:
                turler.append(s["tur"])
        w = csv.writer(f, delimiter=";")
        w.writerow(["Tarih", "Gün"] + [tur_adi(t) for t in turler] + v["_sut"])
        for g in range(1, v["_gun"] + 1):
            sat = [tarih(v, g), GUNTAM[v["_hg"][g]]]
            sat += [uzman_o_gun(v, g, t) or "" for t in turler]
            for si in range(len(v["sutunlar"])):
                ad = p.atama.get((g, si))
                sat.append(v["_kisi"][ad]["ad"] if ad else "")
            w.writerow(sat)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    yol = args[0] if args else "ekim_2026.json"
    tur = 60000
    for a in sys.argv[1:]:
        if a.startswith("--tur="):
            tur = int(a.split("=")[1])
    v = yukle(yol)
    if "--oto" in sys.argv:
        a, sk = oto(v)
        print("Oto ağırlık (denge %.1f):" % sk)
        for k in OTO_ALAN:
            print("  %-16s %.2f" % (k, a[k]))
        print()
    p = coz(v, tur)
    yaz_tablo(v, p)
    cikti = yol.rsplit(".", 1)[0] + ".csv"
    yaz_csv(v, p, cikti)
    print("CSV: " + cikti)


if __name__ == "__main__":
    main()
