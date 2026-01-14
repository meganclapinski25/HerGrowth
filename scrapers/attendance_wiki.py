import json
import re
import time
from pathlib import Path

import pandas as pd
import requests


YEARS = list(range(2013, 2026))
URLS = {y: f"https://en.wikipedia.org/wiki/{y}_National_Women%27s_Soccer_League_season" for y in YEARS}

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Connection": "keep-alive",
}

def fetch_html(url: str) -> str:
    r = requests.get(url, headers=HEADERS, timeout=30)
    r.raise_for_status()
    return r.text

def clean_int(x):
    """Convert strings like '12,345[a]' to 12345."""
    if pd.isna(x):
        return None
    s = str(x)
    s = re.sub(r"\[[^\]]*\]", "", s)  # remove footnotes
    s = s.replace(",", "").strip()
    digits = re.sub(r"[^\d]", "", s)
    return int(digits) if digits else None

def pick_attendance_table_from_html(html: str) -> pd.DataFrame:
    # Parse tables from already-fetched HTML
    tables = pd.read_html(html)
    best = None
    best_score = -1

    for t in tables:
        cols = [str(c).strip().lower() for c in t.columns]
        if "team" not in cols:
            continue

        score = 0
        if any("avg" in c or "average" in c for c in cols):
            score += 2
        if any("total" in c for c in cols):
            score += 2
        if any("home" in c or "games" in c for c in cols):
            score += 1

        if score > best_score:
            best = t
            best_score = score

    if best is None or best_score < 3:
        raise RuntimeError("Could not confidently find attendance table.")

    best.columns = [str(c).strip().lower() for c in best.columns]
    return best

def to_metrics(df: pd.DataFrame, season_year: int, source_url: str) -> list[dict]:
    cols = df.columns.tolist()

    team_col = "team"
    avg_col = next((c for c in cols if "avg" in c or "average" in c), None)
    total_col = next((c for c in cols if "total" in c), None)

    if not avg_col or not total_col:
        raise RuntimeError(f"Missing avg/total columns. Found: {cols}")

    out = []
    for _, r in df.iterrows():
        team = str(r[team_col]).strip()
        if not team or team.lower() == "team":
            continue

        out.append({
            "sport": "soccer",
            "level": "NWSL",
            "season_year": season_year,
            "team_name": team,
            "metric_name": "attendance_home_total",
            "metric_value": clean_int(r[total_col]),
            "unit": "people",
            "source": "Wikipedia",
            "source_url": source_url,
        })
        out.append({
            "sport": "soccer",
            "level": "NWSL",
            "season_year": season_year,
            "team_name": team,
            "metric_name": "attendance_home_avg",
            "metric_value": clean_int(r[avg_col]),
            "unit": "people",
            "source": "Wikipedia",
            "source_url": source_url,
        })

    return out

def main():
    Path("data/parsed").mkdir(parents=True, exist_ok=True)
    Path("data/raw").mkdir(parents=True, exist_ok=True)

    all_metrics = []
    failures = []

    for year in YEARS:
        url = URLS[year]
        try:
            html = fetch_html(url)

            # Save raw HTML for debugging (optional but helpful)
            Path(f"data/raw/wiki_{year}.html").write_text(html, encoding="utf-8")

            df = pick_attendance_table_from_html(html)
            metrics = to_metrics(df, year, url)
            all_metrics.extend(metrics)

            print(f"[OK] {year} rows={len(metrics)}")
            time.sleep(0.8)  # be polite
        except Exception as e:
            print(f"[FAIL] {year} url={url} -> {e}")
            failures.append({"year": year, "url": url, "error": str(e)})

    out_path = Path("data/parsed/metrics_attendance_nwsl_all_years.json")
    out_path.write_text(json.dumps(all_metrics, indent=2), encoding="utf-8")
    print(f"\nSaved: {out_path} (rows={len(all_metrics)})")

    if failures:
        fail_path = Path("data/parsed/attendance_failures.json")
        fail_path.write_text(json.dumps(failures, indent=2), encoding="utf-8")
        print(f"Some years failed. See: {fail_path}")

if __name__ == "__main__":
    main()
