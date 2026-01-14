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

def fetch_tables():
    resp = requests.get(URL, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    tables = pd.read_html(StringIO(resp.text))
    return tables

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
    # Treat em dash / NA as missing
    if s in ["—", "--", "NA", "N/A", ""]:
        return None
    digits = re.sub(r"[^\d]", "", s)
    return int(digits) if digits else None

def main():
    Path("data/parsed/wiki").mkdir(parents=True, exist_ok=True)

    tables = fetch_tables()

    # From your debug output:
    # Table 1 is the team-by-season average attendance matrix
    avg_df = tables[1].copy()

    # Normalize column names
    avg_df.columns = [str(c).strip() for c in avg_df.columns]
    avg_df.rename(columns={avg_df.columns[0]: "Season"}, inplace=True)

    # Clean year
    avg_df["season_year"] = avg_df["Season"].apply(clean_year)

    # Drop the original Season label column
    avg_df = avg_df.drop(columns=["Season"])

    # Melt wide -> long
    long_df = avg_df.melt(
        id_vars=["season_year"],
        var_name="team_code",
        value_name="attendance_home_avg"
    )

    # Clean values + remove missing
    long_df["attendance_home_avg"] = long_df["attendance_home_avg"].apply(clean_int)
    long_df = long_df.dropna(subset=["season_year", "attendance_home_avg"])

    # Basic filter: only keep realistic years
    long_df = long_df[(long_df["season_year"] >= 2013) & (long_df["season_year"] <= 2025)]

    # Team codes like "POR", "WAS" etc are not full names.
    # For now, keep them as team_name = team_code.
    # (We can add a mapping later if you want prettier names.)
    long_df["team_name"] = long_df["team_code"].astype(str).str.strip()

    # Write one JSON file per year
    for year, group in long_df.groupby("season_year"):
        rows = []
        for _, r in group.iterrows():
            rows.append({
                "sport": "soccer",
                "level": "NWSL",
                "season_year": int(year),
                "team_name": r["team_name"],
                "metric_name": "attendance_home_avg",
                "metric_value": int(r["attendance_home_avg"]),
                "unit": "people",
                "source": "Wikipedia",
                "source_url": URL,
            })

        out_path = Path(f"data/parsed/wiki/attendance_avg_{int(year)}.json")
        out_path.write_text(json.dumps(rows, indent=2), encoding="utf-8")
        print(f"[OK] wrote {out_path} rows={len(rows)}")

    print("\nDone.")

if __name__ == "__main__":
    main()
