#!/usr/bin/env python3
"""
Automated Süper Lig Match Results & Fixtures Syncer
Synchronizes live and completed match results with data/2026-27/fixtures.json
Supports API-Football (v3.football.api-sports.io) and RapidAPI
"""

import os
import sys
import json
import tempfile
import urllib.request
import urllib.error

APISPORTS_HOST = "v3.football.api-sports.io"
SUPER_LIG_LEAGUE_ID = "203"
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

class FetchError(Exception):
    """API isteği (ağ, HTTP veya beklenmeyen yanıt şekli) başarısız olduğunda fırlatılır."""

REQUIRED_FIXTURE_FIELDS = ("id", "home_team_id", "away_team_id", "kickoff", "status")

def load_local_fixtures_data():
    if not os.path.exists(FIXTURES_PATH):
        print(f"[-] Fixtures file not found at: {FIXTURES_PATH}")
        return None
    with open(FIXTURES_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def sanity_check_fixtures(data):
    fixtures = data.get("fixtures")
    if not isinstance(fixtures, list) or not fixtures:
        raise ValueError("fixtures alanı boş veya liste değil.")
    for fixture in fixtures:
        missing = [field for field in REQUIRED_FIXTURE_FIELDS if field not in fixture]
        if missing:
            raise ValueError(
                f"Fikstür kaydında eksik alan(lar): {missing} -> {fixture.get('id', '?')}"
            )

def save_local_fixtures_data(full_data):
    sanity_check_fixtures(full_data)
    directory = os.path.dirname(FIXTURES_PATH) or "."
    fd, tmp_path = tempfile.mkstemp(prefix=".fixtures-", suffix=".json.tmp", dir=directory)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(full_data, f, indent=2, ensure_ascii=False)
        os.replace(tmp_path, FIXTURES_PATH)
    except BaseException:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        raise
    print(f"[+] Successfully saved updated fixtures to {FIXTURES_PATH}")

def fetch_apisports_fixtures(api_key: str, season: int = 2026):
    url = f"https://{APISPORTS_HOST}/fixtures?league={SUPER_LIG_LEAGUE_ID}&season={season}"
    req = urllib.request.Request(url, headers={
        "x-apisports-key": api_key,
        "Content-Type": "application/json"
    })
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            raw = resp.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        if e.code == 429:
            raise FetchError(f"API-Sports rate limit aşıldı (HTTP 429): {e}") from e
        raise FetchError(f"API-Sports HTTP hatası ({e.code}): {e}") from e
    except urllib.error.URLError as e:
        raise FetchError(f"API-Sports bağlantı hatası: {e}") from e

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        raise FetchError(f"API-Sports geçersiz JSON döndürdü: {e}") from e

    response_items = data.get("response", [])
    return response_items

def main():
    print("=" * 65)
    print("🔄 Süper Lig Maç Sonuçları Senkronizasyon Servisi (API-Sports v3)")
    print("=" * 65)

    api_key = os.environ.get("APISPORTS_KEY", "").strip() or os.environ.get("RAPIDAPI_KEY", "").strip()
    if not api_key:
        env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    if line.startswith("APISPORTS_KEY=") or line.startswith("RAPIDAPI_KEY="):
                        api_key = line.split("=", 1)[1].strip().strip('"').strip("'")
                        if api_key:
                            break

    full_data = load_local_fixtures_data()
    if not full_data or "fixtures" not in full_data:
        print("[-] Fikstür verisi bulunamadı veya geçersiz.")
        sys.exit(1)

    fixtures = full_data["fixtures"]
    print(f"[i] Yerel sistemde {len(fixtures)} karşılaşma kayıtlı.")

    if api_key:
        print(f"[*] API-Sports üzerinden 2026-27 sezonu maç sonuçları sorgulanıyor...")
        try:
            api_fixtures = fetch_apisports_fixtures(api_key, season=2026)
            print(f"[+] API-Sports'tan {len(api_fixtures)} karşılaşma verisi alındı.")
        except FetchError as e:
            print(f"[-] API-Sports sorgusu başarısız: {e}")
            sys.exit(1)

        updated_count = 0
        for item in api_fixtures:
            fixture_info = item.get("fixture", {})
            status_info = fixture_info.get("status", {})
            teams_info = item.get("teams", {})
            goals_info = item.get("goals", {})

            # Only process if fixture is completed
            if status_info.get("short") in ("FT", "AET", "PEN"):
                home_name = (teams_info.get("home", {}).get("name") or "").lower()
                away_name = (teams_info.get("away", {}).get("name") or "").lower()
                home_score = goals_info.get("home")
                away_score = goals_info.get("away")

                if home_score is not None and away_score is not None:
                    home_score_int = int(home_score)
                    away_score_int = int(away_score)

                    for local_f in fixtures:
                        local_home = local_f.get("home_team_id", "")
                        local_away = local_f.get("away_team_id", "")

                        match_home = any(k in home_name for k, v in TEAM_NAME_TO_ID.items() if v == local_home)
                        match_away = any(k in away_name for k, v in TEAM_NAME_TO_ID.items() if v == local_away)

                        if match_home and match_away:
                            # Only update if match is not already marked as finished
                            if local_f.get("status") != "finished":
                                local_f["status"] = "finished"
                                local_f["score"] = {"home": home_score_int, "away": away_score_int}
                                updated_count += 1
                                print(f"  -> [GÜNCELLENDİ] {local_home} {home_score} - {away_score} {local_away}")

        if updated_count > 0:
            save_local_fixtures_data(full_data)
            print(f"[✅] Toplam {updated_count} maç sonucu başarıyla senkronize edildi.")
        else:
            print("[i] Yerel fikstür ve maç sonuçları güncel.")
    else:
        print("[!] APISPORTS_KEY bulunamadı. Yerel veriler korundu.")

if __name__ == "__main__":
    main()
