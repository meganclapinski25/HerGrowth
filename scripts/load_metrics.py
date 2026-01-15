import json
import os
from pathlib import Path

import psycopg2
from dotenv import load_dotenv
from psycopg2.extras import execute_values

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "2345"))
DB_NAME = os.getenv("DB_NAME", "hergrowth")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

JSON_PATH = Path("data/parsed/wiki/attendance_league_avg_2013_2025.json")

INSERT_SQL = """
INSERT INTO metrics (
  sport, level, season_year,
  metric_name, metric_value,
  unit, source, source_url
)
VALUES %s
ON CONFLICT (sport, level, season_year, metric_name, source)
DO NOTHING;
"""

def main() -> None:
    if not JSON_PATH.exists():
        raise FileNotFoundError(f"Could not find JSON file at: {JSON_PATH.resolve()}")

    data = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    if not isinstance(data, list) or not data:
        raise ValueError("JSON file is empty or not a list of records.")

    # Build rows for execute_values
    rows = []
    for item in data:
        rows.append(
            (
                item.get("sport"),
                item.get("level"),
                int(item.get("season_year")),
                item.get("metric_name"),
                item.get("metric_value"),
                item.get("unit"),
                item.get("source"),
                item.get("source_url"),
            )
        )

    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
    )

    try:
        with conn:
            with conn.cursor() as cur:
                execute_values(cur, INSERT_SQL, rows, page_size=200)
        print(f"[OK] Insert attempted for {len(rows)} rows from {JSON_PATH}")
        print("[OK] Done (duplicates skipped automatically).")
    finally:
        conn.close()

if __name__ == "__main__":
    main()
