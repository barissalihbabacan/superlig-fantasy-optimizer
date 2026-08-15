#!/usr/bin/env python3
"""
Free API Live Football Data (RapidAPI) Sync Script
Automated, 100% legal live football data sync for Trendyol Süper Lig.
Provider: https://rapidapi.com/Creativesdev/api/free-api-live-football-data
"""

import os
import sys
import json
import urllib.request
import urllib.error

API_HOST = "free-api-live-football-data.p.rapidapi.com"
API_KEY = os.environ.get("RAPIDAPI_KEY", "")

def fetch_from_rapidapi(endpoint: str, params: dict = {}):
    if not API_KEY:
        print("[!] RAPIDAPI_KEY ortam değişkeni bulunamadı.")
        print("[i] Kullanım: RAPIDAPI_KEY=your_key_here python3 scripts/rapidapi_football_sync.py")
        return None

    query_str = "&".join([f"{k}={v}" for k, v in params.items()])
    url = f"https://{API_HOST}/{endpoint}?{query_str}" if query_str else f"https://{API_HOST}/{endpoint}"

    req = urllib.request.Request(url, headers={
        "x-rapidapi-key": API_KEY,
        "x-rapidapi-host": API_HOST,
        "Content-Type": "application/json"
    })

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print(f"[-] HTTP Error {e.code}: {e.reason}")
        return None
    except Exception as e:
        print(f"[-] Hata: {e}")
        return None

def main():
    print("=" * 65)
    print("⚽ Free API Live Football Data - Süper Lig Senkronizasyonu")
    print("=" * 65)

    if not API_KEY:
        print("[!] Lütfen RapidAPI anahtarınızı belirtin.")
        print("    Örnek: RAPIDAPI_KEY=xxx python3 scripts/rapidapi_football_sync.py")
        print("    Ücretsiz Kayıt: https://rapidapi.com/Creativesdev/api/free-api-live-football-data")
        return

    print("[*] Süper Lig canlı skorları ve maçları çekiliyor...")
    data = fetch_from_rapidapi("football-live-scores", {"league": "super-lig"})
    if data:
        print("[+] Başarıyla veri alındı:")
        print(json.dumps(data, indent=2, ensure_ascii=False))
    else:
        print("[-] Veri çekilemedi.")

if __name__ == "__main__":
    main()
