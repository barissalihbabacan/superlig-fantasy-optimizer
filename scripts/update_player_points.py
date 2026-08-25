#!/usr/bin/env python3
"""
Automated Player Point & Performance Calculator
Recomputes player match points and projections from finished fixtures in data/2026-27/fixtures.json
"""

import os
import sys
import json

BASE_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "2026-27")
FIXTURES_PATH = os.path.join(BASE_DIR, "fixtures.json")
PLAYERS_PATH = os.path.join(BASE_DIR, "players.json")
PROJECTIONS_PATH = os.path.join(BASE_DIR, "projections.json")

def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"[+] {path} başarıyla güncellendi.")

def calculate_match_points(position, is_home, home_score, away_score):
    team_goals = home_score if is_home else away_score
    opp_goals = away_score if is_home else home_score

    pts = 2  # oynama tabanı
    clean_sheet = opp_goals == 0
    won = team_goals > opp_goals

    if clean_sheet:
        if position in ["Goalkeeper", "Defender"]:
            pts += 4
        elif position == "Midfielder":
            pts += 1

    if position in ["Goalkeeper", "Defender"]:
        pts -= (opp_goals // 2)

    if won:
        pts += 1

    if team_goals > 0:
        if position == "Forward":
            pts += min(team_goals * 2, 6)
        elif position == "Midfielder":
            pts += min(team_goals * 1, 4)
        elif position == "Defender":
            pts += min(team_goals // 2, 2)

    return max(pts, 0)

def main():
    fixtures_data = load_json(FIXTURES_PATH)
    players_data = load_json(PLAYERS_PATH)
    projections_data = load_json(PROJECTIONS_PATH)

    finished = [f for f in fixtures_data.get("fixtures", []) if f.get("status") == "finished" and f.get("score")]
    print(f"[*] Tamamlanan maç sayısı: {len(finished)}")

    team_matches = {}
    for f in finished:
        h, a = f["home_team_id"], f["away_team_id"]
        team_matches.setdefault(h, []).append(f)
        team_matches.setdefault(a, []).append(f)

    proj_map = {p["player_id"]: p for p in projections_data.get("projections", [])}

    updated_count = 0
    for player in players_data.get("players", []):
        p_id = player["id"]
        p_team = player["team_id"]
        p_pos = player["position"]

        matches = team_matches.get(p_team, [])
        total_pts = 0
        for m in matches:
            score = m["score"]
            is_home = m["home_team_id"] == p_team
            total_pts += calculate_match_points(p_pos, is_home, score["home"], score["away"])

        if p_id in proj_map:
            # Expected points for upcoming round based on base + form
            base_xp = proj_map[p_id].get("expected_points", 2.0)
            if len(matches) > 0:
                avg = total_pts / len(matches)
                # Weighted blend
                proj_map[p_id]["expected_points"] = round(0.4 * base_xp + 0.6 * avg, 1)
            updated_count += 1

    projections_data["projections"] = list(proj_map.values())
    save_json(PROJECTIONS_PATH, projections_data)
    print(f"[✅] {updated_count} oyuncunun puan projeksiyonları güncellendi.")

if __name__ == "__main__":
    main()
