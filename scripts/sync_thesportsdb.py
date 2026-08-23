#!/usr/bin/env python3
"""
Dual-Source Süper Lig Match Results Syncer
Synchronizes live and completed Süper Lig match results with data/2026-27/fixtures.json
Uses:
  1. TheSportsDB API (Live & Completed matches)
  2. Turkish Wikipedia MediaWiki API (Fast completed match matrix fallback)
"""

import os
import sys
import re
import json
import tempfile
import urllib.request
import urllib.parse
import urllib.error

THESPORTSDB_V2_BASE = "https://www.thesportsdb.com/api/v2/json"
TURKISH_SUPER_LIG_ID = "4339"
SEASON = "2026-2027"
WIKI_TITLE = "2026-27_Süper_Lig"
FIXTURES_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "2026-27", "fixtures.json")

# Team name / ID mapping for TheSportsDB
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

# Wikipedia 3-letter team code mapping
WIKI_CODE_TO_ID = {
    "GAL": "galatasaray",
    "FNB": "fenerbahce",
    "BJK": "besiktas",
    "TRA": "trabzonspor",
    "İBF": "istanbul-basaksehir",
    "BAS": "istanbul-basaksehir",
    "EYÜ": "eyupspor",
    "EYU": "eyupspor",
    "GÖZ": "goztepe",
    "GOZ": "goztepe",
    "SAM": "samsunspor",
    "KAS": "kasimpasa",
    "ÇYR": "caykur-rizespor",
    "CYR": "caykur-rizespor",
    "RİZ": "caykur-rizespor",
    "KON": "konyaspor",
    "ALA": "alanyaspor",
    "GFK": "gaziantep-fk",
    "GAZ": "gaziantep-fk",
    "GEN": "genclerbirligi",
    "KOC": "kocaelispor",
    "AME": "amed-sportif-faaliyetler",
    "EFK": "erzurumspor-fk",
    "ERZ": "erzurumspor-fk",
    "ÇFK": "corum-fk",
    "CFK": "corum-fk",
    "ÇOR": "corum-fk",
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

def fetch_thesportsdb_events(api_key: str):
    """1. Kaynak: TheSportsDB API (Canlı ve Biten Maçlar)"""
    if api_key not in ("123", "3", "2", "1") and len(api_key) > 5:
        url = f"{THESPORTSDB_V2_BASE}/schedule/season/{TURKISH_SUPER_LIG_ID}/{SEASON}"
        req = urllib.request.Request(url, headers={
            "X-API-KEY": api_key,
            "User-Agent": "SuperLigFantasyOptimizer/1.0",
            "Accept": "application/json"
        })
        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                raw = resp.read().decode("utf-8")
                data = json.loads(raw)
                return data.get("schedule", []) or data.get("events", []) or data.get("results", [])
        except urllib.error.HTTPError:
            pass

    url = f"https://www.thesportsdb.com/api/v1/json/{api_key}/eventsseason.php?id={TURKISH_SUPER_LIG_ID}&s={SEASON}"
    req = urllib.request.Request(url, headers={"User-Agent": "SuperLigFantasyOptimizer/1.0"})
    with urllib.request.urlopen(req, timeout=12) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        return data.get("events", []) or []

def fetch_wikipedia_scores():
    """2. Kaynak: Türkçe Vikipedi MediaWiki API (Maç Sonuçları Matrisi)"""
    try:
        wiki_url = f"https://tr.wikipedia.org/w/api.php?action=query&prop=revisions&titles={urllib.parse.quote(WIKI_TITLE)}&rvslots=*&rvprop=content&format=json"
        req = urllib.request.Request(wiki_url, headers={"User-Agent": "SuperLigFantasyBot/1.0 (contact: admin@example.com)"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            pages = data.get("query", {}).get("pages", {})
            for _, v in pages.items():
                revisions = v.get("revisions", [])
                if revisions:
                    content = revisions[0].get("slots", {}).get("main", {}).get("*", "")
                    matches = re.findall(r'\|match_([A-ZÇĞİÖŞÜ]+)_([A-ZÇĞİÖŞÜ]+)\s*=\s*([^|\n]+)', content)
                    scores_found = []
                    for h_code, a_code, raw_val in matches:
                        val = raw_val.strip()
                        score_match = re.match(r'^(\d+)\s*[-–]\s*(\d+)$', val)
                        if score_match:
                            h_id = WIKI_CODE_TO_ID.get(h_code, h_code)
                            a_id = WIKI_CODE_TO_ID.get(a_code, a_code)
                            h_score = int(score_match.group(1))
                            a_score = int(score_match.group(2))
                            scores_found.append({
                                "home_team_id": h_id,
                                "away_team_id": a_id,
                                "status": "finished",
                                "score": {"home": h_score, "away": a_score},
                                "source": "Wikipedia"
                            })
                    return scores_found
    except Exception as e:
        print(f"[!] Vikipedi API sorgusu atlandı: {e}")
    return []

def main():
    print("=" * 65)
    print("🔄 Çift Kaynaklı (TheSportsDB + Vikipedi) Maç Senkronizasyonu")
    print("=" * 65)

    api_key = os.environ.get("THESPORTSDB_KEY", "").strip() or "123"
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

    # 1. Fetch TheSportsDB
    thesportsdb_events = []
    try:
        print(f"[*] 1. Kaynak: TheSportsDB üzerinden {SEASON} sezonu taranıyor...")
        thesportsdb_events = fetch_thesportsdb_events(api_key)
        print(f"[+] TheSportsDB'den {len(thesportsdb_events)} karşılaşma verisi alındı.")
    except Exception as e:
        print(f"[!] TheSportsDB API sorgusu başarısız: {e}")

    # 2. Fetch Wikipedia
    wiki_scores = []
    print(f"[*] 2. Kaynak: Vikipedi MediaWiki üzerinden maç matrisi taranıyor...")
    wiki_scores = fetch_wikipedia_scores()
    print(f"[+] Vikipedi'den {len(wiki_scores)} resmi tamamlanmış maç skoru alındı.")

    updated_count = 0

    # Apply TheSportsDB results
    for ev in thesportsdb_events:
        home_name = (ev.get("strHomeTeam") or ev.get("strEvent", "").split(" vs ")[0] or "").lower()
        away_name = (ev.get("strAwayTeam") or (ev.get("strEvent", "").split(" vs ")[1] if " vs " in ev.get("strEvent", "") else "") or "").lower()
        
        raw_status = (ev.get("strStatus") or "").upper().strip()
        home_score = ev.get("intHomeScore")
        away_score = ev.get("intAwayScore")

        if raw_status in ("FT", "AET", "PEN", "MATCH FINISHED", "FINISHED"):
            new_status = "finished"
        elif raw_status in ("1H", "HT", "2H", "ET", "BT", "P", "LIVE", "IN PROGRESS"):
            new_status = "live"
        elif raw_status in ("PST", "POSTPONED", "CANCELLED", "CANC", "ABD", "ABANDONED", "SUSP", "SUSPENDED"):
            new_status = "postponed"
        else:
            new_status = "scheduled"

        has_score = (
            home_score is not None 
            and away_score is not None 
            and str(home_score).strip() != "" 
            and str(away_score).strip() != ""
        )

        h_score = int(home_score) if has_score else None
        a_score = int(away_score) if has_score else None

        for local_f in fixtures:
            local_home = local_f.get("home_team_id", "")
            local_away = local_f.get("away_team_id", "")

            match_home = any(k in home_name for k, v in TEAM_NAME_TO_ID.items() if v == local_home)
            match_away = any(k in away_name for k, v in TEAM_NAME_TO_ID.items() if v == local_away)

            if match_home and match_away:
                target_score = {"home": h_score, "away": a_score} if (has_score and new_status in ("finished", "live")) else None
                
                status_changed = local_f.get("status") != new_status
                score_changed = local_f.get("score") != target_score

                if status_changed or score_changed:
                    local_f["status"] = new_status
                    if target_score:
                        local_f["score"] = target_score
                    elif "score" in local_f and new_status == "scheduled":
                        del local_f["score"]
                    
                    updated_count += 1
                    status_badge = f"[{new_status.upper()}]"
                    score_badge = f"{h_score} - {a_score}" if has_score else "Skor Yok"
                    print(f"  -> [TheSportsDB] {status_badge} {local_home} {score_badge} {local_away}")

    # Apply Wikipedia fallback results
    for w in wiki_scores:
        w_home = w["home_team_id"]
        w_away = w["away_team_id"]
        w_score = w["score"]

        for local_f in fixtures:
            if local_f.get("home_team_id") == w_home and local_f.get("away_team_id") == w_away:
                # If local fixture is not yet marked as finished
                if local_f.get("status") != "finished" or local_f.get("score") != w_score:
                    local_f["status"] = "finished"
                    local_f["score"] = w_score
                    updated_count += 1
                    print(f"  -> [Vikipedi] [FINISHED] {w_home} {w_score['home']} - {w_score['away']} {w_away}")

    if updated_count > 0:
        save_fixtures(data)
        print(f"[✅] Toplam {updated_count} maç durumu başarıyla güncellendi.")
    else:
        print("[i] Yerel fikstür tüm kaynaklarla tam uyumlu ve güncel.")

if __name__ == "__main__":
    main()
