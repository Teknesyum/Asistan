import calendar
import csv
import itertools
import json
import sys
from collections import defaultdict
from pathlib import Path

GUN_ADI = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]


def gun_araligi(metin):
    a, b = (metin.split("-") + [metin])[:2]
    return range(int(a), int(b) + 1)


def yukle(yol):
    v = json.loads(Path(yol).read_text(encoding="utf-8"))
    v["kidem"] = {a["ad"]: i + 1 for i, a in enumerate(v["asistanlar"])}
    v["yer"] = {a["ad"]: a["yer"] for a in v["asistanlar"]}
    v["yer0"] = dict(v["yer"])
    v["havuzda"] = {a["ad"]: a.get("havuz", True) for a in v["asistanlar"]}
    v["kademe"] = {a["ad"]: a.get("kademe", 1) for a in v["asistanlar"]}
    v.setdefault("force", {})
    v.setdefault("sabit", {})
    v.setdefault("devir", {"toplam": {}, "yer": {}})
    v["devir"].setdefault("refakat", {})
    v.setdefault("refakat", [])
    for r in v["refakat"]:
        if "gun" not in r:
            r["gun"] = (int(r.get("adet", 1)) or 1) * 2
        r["gun"] = int(r["gun"]) or 1
        r.pop("adet", None)
    v.setdefault("yer_adet", {})
    v["agirlik"].setdefault("kidem_yuku", 0.0)
    v.setdefault("ders", {})
    v.setdefault("gruplar", {})
    v.setdefault("yer_min_kademe", {})
    v.setdefault("yer_kadro", {})
    v["degisim"] = [
        {"gun": int(d["gun"]), "cikan": d["cikan"], "giren": d["giren"], "karsi": int(d.get("karsi") or 0)}
        for d in v.get("degisim", []) if d.get("gun") and d.get("cikan") and d.get("giren")
    ]
    v.setdefault("egitim", [])
    for a in v["asistanlar"]:
        a.setdefault("kisa", a["ad"])
        a.setdefault("havuz", True)
    v["izin_gun"] = defaultdict(set)
    for kayit in v["izin"]:
        for g in gun_araligi(kayit["gunler"]):
            v["izin_gun"][g].update(kayit["kisiler"])
    v["egitim_gun"] = defaultdict(set)
    for kayit in v["egitim"]:
        for g in gun_araligi(kayit["gunler"]):
            v["egitim_gun"][g].update(kayit["kisiler"])
    return v


def dogrula(v):
    adlar = set(v["kidem"])
    hatalar = []
    for g, n in v["nobet"].items():
        for ad in n["yb"] + n["amel"]:
            if ad not in adlar:
                hatalar.append(f"{g}. gün nöbet listesinde tanınmayan ad: {ad}")
            elif ad in v["izin_gun"][int(g)]:
                hatalar.append(f"UYARI {g}. gün {ad} hem izinli hem nöbetçi")
    for g, kisiler in v["izin_gun"].items():
        for ad in kisiler:
            if ad not in adlar:
                hatalar.append(f"{g}. gün izin listesinde tanınmayan ad: {ad}")
    for g, atama in v["gecmis"].items():
        for ad, yer in atama.items():
            if ad not in adlar:
                hatalar.append(f"geçmiş {g}. gün tanınmayan ad: {ad}")
    return hatalar


def grup(v, yer):
    return v["gruplar"].get(yer, yer)


def gruplar(v):
    out = []
    for yer in v["zorunlu_yerler"]:
        g = grup(v, yer)
        if g not in out:
            out.append(g)
    return out


def nobet_o_gun(v, gun):
    if gun >= 1:
        k = v["nobet"].get(str(gun), {})
    else:
        k = v["onceki_ay_son_gun_nobet"]
    n = {
        "yb": list(k.get("yb", [])),
        "amel": list(k.get("amel", [])),
        "uzman_yb": k.get("uzman_yb", []),
        "uzman_amel": k.get("uzman_amel", []),
    }
    for d in v.get("degisim", []):
        ters = int(d.get("karsi") or 0) == gun
        if int(d["gun"]) != gun and not ters:
            continue
        cik, gir = (d["giren"], d["cikan"]) if ters else (d["cikan"], d["giren"])
        for t in ("yb", "amel"):
            if cik in n[t]:
                n[t][n[t].index(cik)] = gir
    return n


def yok_olanlar(v, gun):
    k = v["kural"]
    sebep = {}
    for ad in v["izin_gun"][gun]:
        sebep[ad] = "İzinli"
    for ad in v["egitim_gun"][gun]:
        sebep.setdefault(ad, "Derste")
    if k["nobet_ertesi_yok"]:
        dun = nobet_o_gun(v, gun - 1)
        for ad in dun["yb"] + dun["amel"]:
            sebep.setdefault(ad, "Nöbet Ertesi")
    return sebep


def kalanlar(v, gun, yok):
    k = v["kural"]
    sebep = {}
    bugun = nobet_o_gun(v, gun)
    if k["yb_nobetci_o_gun_yok"]:
        for ad in bugun["yb"]:
            sebep.setdefault(ad, "YBÜ Nöbeti")
    if k["amel_nobetci_o_gun_yok"]:
        for ad in bugun["amel"]:
            sebep.setdefault(ad, "Ameliyathane Nöbeti")
    for ad in v["sabit"].get(str(gun), []):
        sebep.setdefault(ad, "Sabit")
    for ad in yok:
        sebep.pop(ad, None)
    return sebep


KADRO_SIRA = ("tek", "kidemli_tek", "cift")


def kadro_kurali(v, yer):
    m = v.get("yer_kadro", {}).get(yer, "tek")
    return m if m in KADRO_SIRA else "tek"


def bosluklar(v, yok, gun):
    sonuc = []
    adet = v["yer_adet"].get(str(gun), {})
    for yer in v["zorunlu_yerler"]:
        kadro = [ad for ad, y in v["yer"].items() if y == yer]
        if not kadro:
            continue
        gerek = adet.get(yer, 2 if kadro_kurali(v, yer) == "cift" else 1)
        mevcut = [ad for ad in kadro if ad not in yok]
        hedef_kidem = sum(v["kidem"][ad] for ad in kadro) / len(kadro)
        yoklar = [(ad, yok[ad]) for ad in kadro if ad in yok]
        kac = gerek - len(mevcut)
        for i in range(kac):
            if i >= len(yoklar):
                eksik = [("—", "Ek kadro isteniyor")]
            elif i < kac - 1:
                eksik = [yoklar[i]]
            else:
                eksik = yoklar[i:]
            sonuc.append({"yer": yer, "eksik": eksik, "hedef_kidem": hedef_kidem,
                          "yalniz": gerek <= 1})
    return sonuc


def yerdekiler(v, atama, yok, yer):
    return [ad for ad in v["kidem"]
            if atama.get(ad) == yer or (v["yer"][ad] == yer and ad not in yok and ad not in atama)]


def ek_bosluk(v, atama, yok, gun):
    adet = v["yer_adet"].get(str(gun), {})
    sonuc = []
    for yer in v["zorunlu_yerler"]:
        if kadro_kurali(v, yer) != "kidemli_tek" or yer in adet:
            continue
        kisiler = yerdekiler(v, atama, yok, yer)
        if len(kisiler) != 1 or not yasak(v, kisiler[0], yer):
            continue
        kadro = [ad for ad, y in v["yer"].items() if y == yer]
        sonuc.append({
            "yer": yer, "yalniz": False,
            "eksik": [("—", "Kıdem eşiğinin altı, yanına ikinci kişi")],
            "hedef_kidem": sum(v["kidem"][ad] for ad in kadro) / len(kadro) if kadro else 9,
        })
    return sonuc


def refakat_suruyor(v, ad, sayilan):
    r = next((x for x in v.get("refakat", []) if x["ad"] == ad), None)
    return bool(r and sayilan.get(ad, 0) < r["gun"])


def refakat_bekliyor(v, ad, sayilan, yer):
    r = next((x for x in v.get("refakat", []) if x["ad"] == ad), None)
    return bool(r and grup(v, r["yer"]) == grup(v, yer) and refakat_suruyor(v, ad, sayilan))


def istisna(v, ad):
    return v["yer"].get(ad) in v["havuz_disi_yerler"]


def havuz(v, yok, kalsin=()):
    return [
        ad for ad in v["kidem"]
        if v["havuzda"][ad]
        and v["yer"][ad] not in v["havuz_disi_yerler"]
        and v["yer"][ad] not in v["zorunlu_yerler"]
        and ad not in yok
        and ad not in kalsin
    ]


def yasak(v, ad, yer):
    return v["kademe"][ad] < v["yer_min_kademe"].get(yer, 0)


def maliyet(v, ad, bos, sayac, dun_gidenler, yb_nobet=()):
    w = v["agirlik"]
    tercih = (
        v["kural"].get("yb_nobetci_ybu_tercih")
        and ad in yb_nobet
        and grup(v, bos["yer"]) == "Ybü"
    )
    return (
        1e6 * (bos.get("yalniz", True) and yasak(v, ad, bos["yer"]))
        + 1e6 * refakat_bekliyor(v, ad, sayac["refakat"], bos["yer"])
        - 1e3 * bool(tercih)
        +
        w["kidem_farki"] * abs(v["kidem"][ad] - bos["hedef_kidem"])
        + w["toplam_gorev"] * sayac["toplam"][ad]
        + w["ayni_yer_tekrari"] * sayac["yer"][(ad, grup(v, bos["yer"]))]
        + w["dun_de_gonderildi"] * (ad in dun_gidenler)
        + w.get("kidem_yuku", 0.0) * (len(v["kidem"]) - v["kidem"][ad])
    )


def gun_ata(v, boslar, adaylar, sayac, dun_gidenler, yb_nobet=()):
    if not boslar:
        return {}, []
    if len(adaylar) < len(boslar):
        boslar = boslar[: len(adaylar)]
    en_iyi, en_iyi_m = None, None
    for secim in itertools.permutations(adaylar, len(boslar)):
        m = sum(maliyet(v, ad, b, sayac, dun_gidenler, yb_nobet) for ad, b in zip(secim, boslar))
        if en_iyi_m is None or m < en_iyi_m:
            en_iyi, en_iyi_m = secim, m
    return {ad: b["yer"] for ad, b in zip(en_iyi, boslar)}, boslar


def yer_gun(v, gun):
    m = dict(v["yer0"])
    for d in v.get("degisim", []):
        if int(d["gun"]) + 1 != gun and not (d.get("karsi") and int(d["karsi"]) + 1 == gun):
            continue
        if d["cikan"] not in m or d["giren"] not in m:
            continue
        m[d["cikan"]], m[d["giren"]] = m[d["giren"]], m[d["cikan"]]
    return m


def calistir(v):
    gun_sayisi = calendar.monthrange(v["yil"], v["ay"])[1]
    sayac = {"toplam": defaultdict(int), "yer": defaultdict(int), "refakat": defaultdict(int)}
    for ad, n in v["devir"].get("refakat", {}).items():
        sayac["refakat"][ad] = n
    for ad, n in v["devir"].get("toplam", {}).items():
        sayac["toplam"][ad] = n
    for k, n in v["devir"].get("yer", {}).items():
        ad, _, yer = k.partition("|")
        sayac["yer"][(ad, yer)] = n
    satirlar = []
    dun_gidenler = set()
    for gun in range(1, gun_sayisi + 1):
        hafta_gunu = calendar.weekday(v["yil"], v["ay"], gun)
        v["yer"] = yer_gun(v, gun)
        yok = yok_olanlar(v, gun)
        kalsin = kalanlar(v, gun, yok)
        boslar = bosluklar(v, yok, gun)
        kaynak = "hesap"
        zorla = v["force"].get(str(gun), [])
        atama = {z["ad"]: z["yer"] for z in zorla}
        for z in zorla:
            for i, b in enumerate(boslar):
                if b["yer"] == z["yer"]:
                    boslar.pop(i)
                    break
        if str(gun) in v["gecmis"]:
            atama = {**v["gecmis"][str(gun)], **atama}
            kaynak = "geçmiş"
            if not atama:
                boslar = []
        elif hafta_gunu >= 5:
            kaynak = "hafta sonu"
            boslar = []
        refakat = []
        if kaynak == "hesap":
            adaylar = [a for a in havuz(v, yok, kalsin) if a not in atama]
            sira = sorted(v["refakat"], key=lambda r: sayac["refakat"].get(r["ad"], 0))
            for r in sira:
                if refakat:
                    break
                if r["ad"] in atama or r["ad"] not in adaylar:
                    continue
                if not refakat_suruyor(v, r["ad"], sayac["refakat"]):
                    continue
                if len(adaylar) - 1 < len(boslar):
                    continue
                planlanan = (
                    sum(1 for a, y in v["yer"].items()
                        if y == r["yer"] and a not in yok and a not in atama)
                    + sum(1 for y in atama.values() if y == r["yer"])
                    + sum(1 for b in boslar if b["yer"] == r["yer"])
                )
                if planlanan > 1:
                    continue
                atama[r["ad"]] = r["yer"]
                refakat.append({"ad": r["ad"], "yer": r["yer"]})
                adaylar = [a for a in adaylar if a != r["ad"]]
            ek, _ = gun_ata(v, boslar, adaylar, sayac, dun_gidenler, set(nobet_o_gun(v, gun)["yb"]))
            atama.update(ek)
            ikinci = ek_bosluk(v, atama, yok, gun)
            if ikinci:
                kalan = [a for a in havuz(v, yok, kalsin) if a not in atama]
                ek2, _ = gun_ata(v, ikinci, kalan, sayac, dun_gidenler, set(nobet_o_gun(v, gun)["yb"]))
                atama.update(ek2)
                boslar = boslar + ikinci
        elenen = []
        for r in refakat:
            baska = any(a != r["ad"] and y == r["yer"] for a, y in atama.items()) or \
                any(a for a in v["yer"] if v["yer"][a] == r["yer"] and a not in yok and a not in atama)
            if not baska:
                del atama[r["ad"]]
                elenen.append(r)
        refakat = [r for r in refakat if r not in elenen]
        for r in refakat:
            sayac["refakat"][r["ad"]] += 1
        for ad, yer in atama.items():
            if istisna(v, ad):
                continue
            sayac["toplam"][ad] += 1
            sayac["yer"][(ad, grup(v, yer))] += 1
        kalan = defaultdict(int)
        for yer in atama.values():
            kalan[yer] += 1
        for z in zorla:
            kalan[z["yer"]] -= 1
        for r in refakat:
            kalan[r["yer"]] -= 1
        dolmayan = []
        for b in boslar:
            if kalan[b["yer"]] > 0:
                kalan[b["yer"]] -= 1
            else:
                dolmayan.append(b["yer"])
        zorlanan = [ad for ad, yer in atama.items() if yasak(v, ad, yer)]
        satirlar.append({
            "gun": gun,
            "gun_adi": GUN_ADI[hafta_gunu],
            "kaynak": kaynak,
            "boslar": boslar,
            "atama": atama,
            "refakat": refakat,
            "dolmayan": dolmayan,
            "zorlanan": zorlanan,
        })
        dun_gidenler = set(atama)
    v["yer"] = dict(v["yer0"])
    return satirlar, sayac


OTO_IZGARA = {
    "kidem_farki": [2, 3, 4, 6],
    "toplam_gorev": [1, 2, 4, 8],
    "ayni_yer_tekrari": [0, 1, 3, 6],
    "dun_de_gonderildi": [0, 1, 3, 6],
    "kidem_yuku": [0, 0.5, 1, 2],
}


def _sapma(liste, sayac):
    if len(liste) < 2:
        return 0.0
    y = [sayac["toplam"][ad] for ad in liste]
    t = 0.0
    for i in range(len(y)):
        komsu = [y[j] for j in range(max(0, i - 2), min(len(y), i + 3)) if j != i]
        t += abs(y[i] - sum(komsu) / len(komsu))
    return t / len(y)


def adalet_skoru(v, satirlar, sayac):
    havuzlu = [
        a["ad"] for a in v["asistanlar"]
        if v["havuzda"][a["ad"]]
        and a["yer"] not in v["havuz_disi_yerler"]
        and a["yer"] not in v["zorunlu_yerler"]
    ]
    kidemli = _sapma([ad for ad in havuzlu if v["kademe"][ad] > 0], sayac)
    comez = _sapma([ad for ad in havuzlu if v["kademe"][ad] == 0], sayac)
    y = [sayac["toplam"][ad] for ad in havuzlu]
    ters = sum(max(0, y[i] - y[i + 1]) for i in range(len(y) - 1)) / max(1, len(y) - 1)
    yr = len(y) // 2
    ort = lambda z: sum(z) / len(z) if z else 0.0
    egim = min(1.0, ort(y[yr:]) - ort(y[:yr])) if len(y) > 1 else 0.0
    fark = (max(y) - min(y)) if y else 0
    ceza = 100 * max(0, fark - 5)
    ku, na = 0.0, 0
    for s in satirlar:
        if s["kaynak"] != "hesap":
            continue
        for ad, yer in s["atama"].items():
            b = next((x for x in s["boslar"] if x["yer"] == yer), None)
            if b:
                ku += abs(v["kidem"][ad] - b["hedef_kidem"])
                na += 1
    ku = ku / na if na else 0.0
    uy = 0
    gr = gruplar(v)
    for ad in havuzlu:
        dagilim = [sayac["yer"][(ad, y)] for y in gr]
        tot = sum(dagilim)
        acik = {grup(v, y) for y in v["zorunlu_yerler"] if not yasak(v, ad, y)}
        if len(acik) > 1 and tot >= 3 and max(dagilim) == tot:
            uy += 1
        if not sayac["toplam"][ad]:
            uy += 1
    return {
        "skor": 2 * (kidemli + comez) + 4 * ters + 3 * ku + uy - 4 * egim + ceza,
        "kidemli": kidemli, "comez": comez, "ters": ters, "egim": egim, "fark": fark,
        "kidem_uyum": ku, "uyari": uy,
    }


def oto_agirlik(v):
    iyi = None
    for a in OTO_IZGARA["kidem_farki"]:
        for b in OTO_IZGARA["toplam_gorev"]:
            for c in OTO_IZGARA["ayni_yer_tekrari"]:
                for d in OTO_IZGARA["dun_de_gonderildi"]:
                    for e in OTO_IZGARA["kidem_yuku"]:
                        v["agirlik"] = {
                            "kidem_farki": a, "toplam_gorev": b,
                            "ayni_yer_tekrari": c, "dun_de_gonderildi": d,
                            "kidem_yuku": e,
                        }
                        satirlar, sayac = calistir(v)
                        s = adalet_skoru(v, satirlar, sayac)
                        if iyi is None or s["skor"] < iyi["skor"] - 1e-9:
                            iyi = dict(s, agirlik=dict(v["agirlik"]))
    v["agirlik"] = iyi["agirlik"]
    return iyi


def yaz_konsol(v, satirlar, sayac):
    print(f"{v['ay']:02d}/{v['yil']} Görevlendirme")
    print("-" * 78)
    for s in satirlar:
        bos = "; ".join(
            f"{b['yer']} ({', '.join(f'{ad}:{neden}' for ad, neden in b['eksik'])})"
            for b in s["boslar"]
        ) or "-"
        atama = ", ".join(f"{ad} → {yer}" for ad, yer in s["atama"].items()) or "-"
        ek = f"  !! DOLMADI: {', '.join(s['dolmayan'])}" if s["dolmayan"] else ""
        print(f"{s['gun']:>2} {s['gun_adi']} [{s['kaynak']:^9}] boş: {bos}")
        print(f"          atama: {atama}{ek}")
    print("-" * 78)
    print("Kişi başı dağılım (kıdem sırasıyla):")
    for ad in v["kidem"]:
        t = sayac["toplam"][ad]
        if not t:
            continue
        yerler = ", ".join(
            f"{yer}×{n}" for (a, yer), n in sorted(sayac["yer"].items()) if a == ad and n
        )
        print(f"  {v['kidem'][ad]:>2}. {ad:<11} {t}  ({yerler})")


def yaz_csv(v, satirlar, yol):
    with open(yol, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f, delimiter=";")
        w.writerow(["Gün", "Hafta", "Kaynak", "Boş yer", "Eksik (neden)", "Görevlendirme", "Dolmayan"])
        for s in satirlar:
            w.writerow([
                s["gun"], s["gun_adi"], s["kaynak"],
                ", ".join(b["yer"] for b in s["boslar"]),
                "; ".join(f"{ad}:{n}" for b in s["boslar"] for ad, n in b["eksik"]),
                ", ".join(f"{ad}->{yer}" for ad, yer in s["atama"].items()),
                ", ".join(s["dolmayan"]),
            ])


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    yol = args[0] if args else "eylul_2026.json"
    v = yukle(yol)
    for h in dogrula(v):
        print(h)
    if "--oto" in sys.argv:
        iyi = oto_agirlik(v)
        print("Oto ağırlık:", v["agirlik"])
        print("  sapma %.2f/%.2f · ters %.2f · eğim %.2f · fark %d · kıdem uyumu %.2f · uyarı %d · skor %.2f"
              % (iyi["kidemli"], iyi["comez"], iyi["ters"], iyi["egim"], iyi["fark"], iyi["kidem_uyum"], iyi["uyari"], iyi["skor"]))
    satirlar, sayac = calistir(v)
    yaz_konsol(v, satirlar, sayac)
    cikti = Path(yol).with_suffix(".csv")
    yaz_csv(v, satirlar, cikti)
    print(f"\nCSV: {cikti}")


if __name__ == "__main__":
    main()
