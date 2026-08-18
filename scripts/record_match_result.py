#!/usr/bin/env python3
"""
Local Match Result Manager (No External API / 100% Offline)
Directly records official match scores into data/2026-27/fixtures.json
"""

import os
import sys
import json
import argparse

FIXTURES_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "2026-27", "fixtures.json")

def load_fixtures():
    if not os.path.exists(FIXTURES_PATH):
        print(f"[-] Hata: {FIXTURES_PATH} bulunamadı.")
        sys.exit(1)
    with open(FIXTURES_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def save_fixtures(data):
    with open(FIXTURES_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"[+] {FIXTURES_PATH} başarıyla güncellendi.")

def list_round(round_num):
    data = load_fixtures()
    round_fixtures = [f for f in data.get("fixtures", []) if f.get("round") == round_num]
    print(f"\n📅 Süper Lig {round_num}. Hafta Karşılaşmaları:")
    print("-" * 60)
    for f in round_fixtures:
        score = f.get("score")
        score_str = f"{score['home']} - {score['away']}" if score else "v"
        status = f.get("status", "scheduled")
        print(f"[{f.get('id')}] {f.get('home_team_id')} {score_str} {f.get('away_team_id')} ({status})")
    print("-" * 60)

def record_score(fixture_id, home_score, away_score):
    data = load_fixtures()
    found = False
    for f in data.get("fixtures", []):
        if f.get("id") == fixture_id:
            f["status"] = "finished"
            f["score"] = {"home": int(home_score), "away": int(away_score)}
            found = True
            print(f"[✅] Güncellendi: {f.get('home_team_id')} {home_score} - {away_score} {f.get('away_team_id')}")
            break
    if found:
        save_fixtures(data)
    else:
        print(f"[-] Hata: '{fixture_id}' id'li maç bulunamadı.")

def main():
    parser = argparse.ArgumentParser(description="Yerel Maç Sonucu Kaydedici")
    parser.add_argument("--list-round", type=int, help="Belirtilen haftanın maçlarını listele")
    parser.add_argument("--id", type=str, help="Maç ID'si (Örn: 2026-27-w01-01)")
    parser.add_argument("--home", type=int, help="Ev sahibi skoru")
    parser.add_argument("--away", type=int, help="Deplasman skoru")

    args = parser.parse_args()

    if args.list_round:
        list_round(args.list_round)
    elif args.id and args.home is not None and args.away is not None:
        record_score(args.id, args.home, args.away)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
