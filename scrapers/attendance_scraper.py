import json
import re
from io import StringIO
from pathlib import Path

import pandas as pd
import requests

URL = "https://en.wikipedia.org/wiki/National_Women%27s_Soccer_League_attendance"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}

def clean_year(x):
    # "2013[14]" -> 2013
    s = str(x)
    s = re.sub(r"\[[^\]]*\]", "", s)
    digits = re.sub(r"[^\d]", "", s)
    return int(digits) if digits else None

def clean_int(x):
    if pd.isna(x):
        return None
    s = str(x).strip()
    s = re.sub(r"\[[^\]]*\]", "", s)
    s = s.replace(",", "")
    if s in ["—", "--", "NA", "N/A", ""]:
        return None
    digits = re.sub(r"[^\d]", "", s)
    return int(digits) if digits else None

def main():
    Path("data/parsed/wiki").mkdir(parents=True, exist_ok=True)

    resp = requests.get(URL, headers=HEADERS, timeout=30)
    resp.raise_for_status()

    tables = pd.read_html(StringIO(resp.text))

    # Table 0 = league attendance summary by season
    df = tables[0].copy()
    df.columns = [str(c).strip().lower() for c in df.columns]

    df["season_year"] = df["season"].apply(clean_year)

    avg_col = next(c for c in df.columns if c in ["average", "avg"])

    rows = []

    for _, r in df.iterrows():
        year = r["season_year"]
        if not year or year < 2013 or year > 2025:
            continue

        avg_attendance = clean_int(r[avg_col])
        if avg_attendance is None:
            continue

        rows.append({
            "sport": "soccer",
            "level": "NWSL",
            "season_year": int(year),
            "metric_name": "attendance_league_avg",
            "metric_value": int(avg_attendance),
            "unit": "people",
            "source": "Wikipedia",
            "source_url": URL,
        })

    out_path = Path("data/parsed/wiki/attendance_league_avg_2013_2025.json")
    out_path.write_text(json.dumps(rows, indent=2), encoding="utf-8")

    print(f"[OK] Saved {out_path} rows={len(rows)}")

if __name__ == "__main__":
    main()
