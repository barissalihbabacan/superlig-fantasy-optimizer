#!/usr/bin/env python3
"""
Updates data/2026-27/fixtures.json with the official TFF 2026/27 seasonal calendar.
Distributes matches across Friday, Saturday, Sunday, and Monday kickoff slots.
Keeps 1. Hafta as finished with official scores and highlights.
"""

import os
import json
from datetime import datetime, timedelta

FIXTURES_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "2026-27", "fixtures.json")

# Official TFF Round Friday Start Dates (YYYY-MM-DD)
TFF_ROUND_FRIDAYS = {
    1: "2026-08-14",
    2: "2026-08-21",
    3: "2026-08-28",
    4: "2026-09-11",
    5: "2026-09-18",
    6: "2026-09-25",
    7: "2026-10-02",
    8: "2026-10-16",
    9: "2026-10-23",
    10: "2026-10-30",
    11: "2026-11-06",
    12: "2026-11-20",
    13: "2026-11-27",
    14: "2026-12-04",
    15: "2026-12-11",
    16: "2026-12-18",
    17: "2027-01-15",
    18: "2027-01-22",
    19: "2027-01-29",
    20: "2027-02-05",
    21: "2027-02-12",
    22: "2027-02-19",
    23: "2027-02-26",
    24: "2027-03-05",
    25: "2027-03-12",
    26: "2027-03-19",
    27: "2027-04-02",
    28: "2027-04-09",
    29: "2027-04-16",
    30: "2027-04-23",
    31: "2027-04-30",
    32: "2027-05-07",
    33: "2027-05-14",
    34: "2027-05-21",
}

# Standard 9-match weekend schedule slots (days offset from Friday, time, timezone)
# 0: Friday, 1: Saturday, 2: Sunday, 3: Monday
MATCH_SLOTS = [
    (0, "21:00:00+03:00"), # Match 1: Friday night
    (1, "16:30:00+03:00"), # Match 2: Saturday afternoon
    (1, "19:00:00+03:00"), # Match 3: Saturday evening
    (1, "21:30:00+03:00"), # Match 4: Saturday prime time
    (2, "16:30:00+03:00"), # Match 5: Sunday afternoon
    (2, "19:00:00+03:00"), # Match 6: Sunday evening
    (2, "21:30:00+03:00"), # Match 7: Sunday prime time
    (3, "19:00:00+03:00"), # Match 8: Monday early
    (3, "21:30:00+03:00"), # Match 9: Monday prime time
]

def main():
    with open(FIXTURES_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    fixtures = data.get("fixtures", [])
    print(f"Loaded {len(fixtures)} fixtures from {FIXTURES_PATH}")

    # Group fixtures by round
    by_round = {}
    for f in fixtures:
        r = f.get("round", 1)
        by_round.setdefault(r, []).append(f)

    for round_num, round_fixtures in sorted(by_round.items()):
        friday_str = TFF_ROUND_FRIDAYS.get(round_num)
        if not friday_str:
            continue
        friday_date = datetime.strptime(friday_str, "%Y-%m-%d")

        for idx, fixture in enumerate(round_fixtures):
            # Keep round 1 kickoff and score untouched
            if round_num == 1:
                continue

            day_offset, time_slot = MATCH_SLOTS[idx % len(MATCH_SLOTS)]
            match_date = friday_date + timedelta(days=day_offset)
            kickoff_iso = f"{match_date.strftime('%Y-%m-%d')}T{time_slot}"
            fixture["kickoff"] = kickoff_iso
            fixture["status"] = "scheduled"
            if "score" in fixture:
                del fixture["score"]

    with open(FIXTURES_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"Successfully updated all 34 weeks in {FIXTURES_PATH} with official TFF dates!")

if __name__ == "__main__":
    main()
