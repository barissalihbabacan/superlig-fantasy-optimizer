#!/usr/bin/env python3
"""
Automated Süper Lig Match Results & Fixtures Syncer
Synchronizes live and completed match results with data/2026-27/fixtures.json
"""

import os
import sys
import json
import urllib.request
import urllib.error

API_HOST = "free-api-live-football-data.p.rapidapi.com"
SUPER_LIG_ID = "71"
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
    "amed": "amed-sf",
    "erzurumspor": "erzurumspor-fk",
    "başakşehir": "basaksehir",
    "basaksehir": "basaksehir",
    "kocaelispor": "kocaelispor",
    "samsunspor": "samsunspor",
    "göztepe": "goztepe",
    "goztepe": "goztepe",
}

def load_local_fixtures_data():
    if not os.path.exists(FIXTURES_PATH):
        print(f"[-] Fixtures file not found at: {FIXTURES_PATH}")
        return None
    with open(FIXTURES_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def save_local_fixtures_data(full_data):
    with open(FIXTURES_PATH, "w", encoding="utf-8") as f:
        json.dump(full_data, f, indent=2, ensure_ascii=False)
    print(f"[+] Successfully saved updated fixtures to {FIXTURES_PATH}")

def fetch_rapidapi_matches(api_key: str):
    url = f"https://{API_HOST}/football-get-all-matches-by-league?leagueid={SUPER_LIG_ID}"
    req = urllib.request.Request(url, headers={
        "x-rapidapi-key": api_key,
        "x-rapidapi-host": API_HOST,
        "Content-Type": "application/json"
    })
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data.get("response", {}).get("matches", [])
    except Exception as e:
        print(f"[-] Error fetching from RapidAPI: {e}")
        return []

def main():
    print("=" * 65)
    print("🔄 Süper Lig Maç Sonuçları Senkronizasyon Servisi")
    print("=" * 65)

    api_key = os.environ.get("RAPIDAPI_KEY", "").strip()
    if not api_key:
        print("[!] RAPIDAPI_KEY tanımlı değil. Ortam değişkenlerinden veya .env dosyasından okuma deneniyor...")
        env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    if line.startswith("RAPIDAPI_KEY="):
                        api_key = line.split("=", 1)[1].strip().strip('"').strip("'")
                        break

    full_data = load_local_fixtures_data()
    if not full_data or "fixtures" not in full_data:
        print("[-] Fikstür verisi bulunamadı veya geçersiz.")
        sys.exit(1)

    fixtures = full_data["fixtures"]
    print(f"[i] Yerel sistemde {len(fixtures)} karşılaşma kayıtlı.")

    if api_key:
        print(f"[*] RapidAPI üzerinden güncel maç sonuçları sorgulanıyor...")
        api_matches = fetch_rapidapi_matches(api_key)
        print(f"[+] API'den {len(api_matches)} maç verisi alındı.")
        
        updated_count = 0
        for m in api_matches:
            status_info = m.get("status", {})
            # Check if match is finished / has score
            if status_info.get("finished") or status_info.get("started"):
                home_name = (m.get("home", {}).get("name") or "").lower()
                away_name = (m.get("away", {}).get("name") or "").lower()
                home_score = m.get("home", {}).get("score")
                away_score = m.get("away", {}).get("score")

                if home_score is not None and away_score is not None:
                    # Match with local fixtures
                    for local_f in fixtures:
                        local_home = local_f.get("home_team_id", "")
                        local_away = local_f.get("away_team_id", "")
                        
                        match_home = any(k in home_name for k, v in TEAM_NAME_TO_ID.items() if v == local_home)
                        match_away = any(k in away_name for k, v in TEAM_NAME_TO_ID.items() if v == local_away)

                        if match_home and match_away and local_f.get("round") == 1:
                            if local_f.get("status") != "finished" or local_f.get("score") != {"home": int(home_score), "away": int(away_score)}:
                                local_f["status"] = "finished"
                                local_f["score"] = {"home": int(home_score), "away": int(away_score)}
                                updated_count += 1
                                print(f"  -> [GÜNCELLENDİ] {local_home} {home_score} - {away_score} {local_away}")

        if updated_count > 0:
            save_local_fixtures_data(full_data)
            print(f"[✅] Toplam {updated_count} maç sonucu başarıyla senkronize edildi.")
        else:
            print("[i] Yeni sonuç bulunmadı veya mevcut veriler zaten güncel.")
    else:
        print("[!] RAPIDAPI_KEY bulunamadı. Yerel veriler korundu.")

if __name__ == "__main__":
    main()
