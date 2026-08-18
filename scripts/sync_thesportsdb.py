#!/usr/bin/env python3
"""
TheSportsDB v2 Match Results Syncer
Synchronizes live and completed Süper Lig match results with data/2026-27/fixtures.json
Uses TheSportsDB v2 RESTful API with X-API-KEY header authentication
"""

import os
import sys
import json
import tempfile
import urllib.request
import urllib.error

THESPORTSDB_V2_BASE = "https://www.thesportsdb.com/api/v2/json"
TURKISH_SUPER_LIG_ID = "4339"
SEASON = "2026-2027"
FIXTURES_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "2026-27", "fixtures.json")

# Team name / ID mapping
TEAM_NAME_TO_ID = {
    "galatasaray": "galatasaray",
    "çorum": "corum-fk",
    "corum": "corum-fk",
    "konyaspor": "konyaspor",
    "rizespor": "caykur-rizespor",
    "çaykur rizespor": "caykur-rizespor",
    "gaziantep": "gaziantep-fk",
    "alanyaspor": "alanyaspor",
    "corendon alanyaspor": "alanyaspor",
    "gençlerbirliği": "genclerbirligi",
    "genclerbirligi": "genclerbirligi",
    "fenerbahçe": "fenerbahce",
    "fenerbahce": "fenerbahce",
    "kasımpaşa": "kasimpasa",
    "kasimpasa": "kasimpasa",
    "trabzonspor": "trabzonspor",
    "beşiktaş": "besiktas",
    "besiktas": "besiktas",
    "eyüpspor": "eyupspor",
    "eyupspor": "eyupspor",
    "amed": "amed-sportif-faaliyetler",
    "amed sportif faaliyetler": "amed-sportif-faaliyetler",
    "erzurumspor": "erzurumspor-fk",
    "başakşehir": "istanbul-basaksehir",
    "basaksehir": "istanbul-basaksehir",
    "istanbul basaksehir": "istanbul-basaksehir",
    "kocaelispor": "kocaelispor",
    "samsunspor": "samsunspor",
    "göztepe": "goztepe",
    "goztepe": "goztepe",
}

def load_fixtures():
    if not os.path.exists(FIXTURES_PATH):
        print(f"[-] Hata: {FIXTURES_PATH} bulunamadı.")
        sys.exit(1)
    with open(FIXTURES_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def save_fixtures(data):
    directory = os.path.dirname(FIXTURES_PATH) or "."
    fd, tmp_path = tempfile.mkstemp(prefix=".fixtures-", suffix=".json.tmp", dir=directory)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        os.replace(tmp_path, FIXTURES_PATH)
        print(f"[+] Başarıyla kaydedildi: {FIXTURES_PATH}")
    except BaseException:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        raise

def fetch_thesportsdb_v2_events(api_key: str):
    """TheSportsDB v2 API çağrısı: X-API-KEY header ile season schedule sorgular"""
    url = f"{THESPORTSDB_V2_BASE}/schedule/season/{TURKISH_SUPER_LIG_ID}/{SEASON}"
    req = urllib.request.Request(url, headers={
        "X-API-KEY": api_key,
        "User-Agent": "SuperLigFantasyOptimizer/1.0",
        "Accept": "application/json"
    })
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            raw = resp.read().decode("utf-8")
            data = json.loads(raw)
            return data.get("schedule", []) or data.get("events", []) or data.get("results", [])
    except urllib.error.HTTPError as e:
        # Fallback to events season v1 endpoint if v2 requires paid key
        if e.code in (400, 401, 403):
            print(f"[!] TheSportsDB v2 yetkilendirme ({e.code}). Açık endpoint ile sorgulanıyor...")
            fallback_url = f"https://www.thesportsdb.com/api/v1/json/{api_key}/eventsseason.php?id={TURKISH_SUPER_LIG_ID}&s={SEASON}"
            req_fb = urllib.request.Request(fallback_url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req_fb, timeout=15) as resp_fb:
                data_fb = json.loads(resp_fb.read().decode("utf-8"))
                return data_fb.get("events", []) or []
        raise

def main():
    print("=" * 65)
    print("🔄 TheSportsDB v2 Süper Lig Maç Sonuçları Senkronizasyonu")
    print("=" * 65)

    api_key = os.environ.get("THESPORTSDB_KEY", "").strip() or "3"
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("THESPORTSDB_KEY="):
                    api_key = line.split("=", 1)[1].strip().strip('"').strip("'")
                    break

    data = load_fixtures()
    fixtures = data.get("fixtures", [])
    print(f"[i] Yerel sistemde {len(fixtures)} karşılaşma kayıtlı.")
    print(f"[*] TheSportsDB v2 üzerinden {SEASON} sezonu sorgulanıyor...")

    try:
        events = fetch_thesportsdb_v2_events(api_key)
        print(f"[+] TheSportsDB'den {len(events)} karşılaşma verisi alındı.")
    except Exception as e:
        print(f"[-] TheSportsDB API sorgusu başarısız: {e}")
        sys.exit(1)

    updated_count = 0
    for ev in events:
        home_name = (ev.get("strHomeTeam") or ev.get("strEvent", "").split(" vs ")[0] or "").lower()
        away_name = (ev.get("strAwayTeam") or (ev.get("strEvent", "").split(" vs ")[1] if " vs " in ev.get("strEvent", "") else "") or "").lower()
        
        home_score = ev.get("intHomeScore")
        away_score = ev.get("intAwayScore")

        if home_score is not None and away_score is not None and str(home_score).strip() != "" and str(away_score).strip() != "":
            h_score = int(home_score)
            a_score = int(away_score)

            for local_f in fixtures:
                local_home = local_f.get("home_team_id", "")
                local_away = local_f.get("away_team_id", "")

                match_home = any(k in home_name for k, v in TEAM_NAME_TO_ID.items() if v == local_home)
                match_away = any(k in away_name for k, v in TEAM_NAME_TO_ID.items() if v == local_away)

                if match_home and match_away:
                    if local_f.get("status") != "finished" or local_f.get("score") != {"home": h_score, "away": a_score}:
                        local_f["status"] = "finished"
                        local_f["score"] = {"home": h_score, "away": a_score}
                        updated_count += 1
                        print(f"  -> [GÜNCELLENDİ] {local_home} {h_score} - {a_score} {local_away}")

    if updated_count > 0:
        save_fixtures(data)
        print(f"[✅] Toplam {updated_count} maç sonucu başarıyla güncellendi.")
    else:
        print("[i] Yerel fikstür zaten güncel.")

if __name__ == "__main__":
    main()
