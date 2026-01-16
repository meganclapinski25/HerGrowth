import json
from pathlib import Path
import chardet
import psycopg2
from psycopg2.extras import execute_values

DB_CONFIG = {
    "host": "localhost",
    "port": 2345,
    "dbname": "hergrowth",
    "user": "postgres",
    "password": "",
}

JSON_PATH = Path("data/parsed/wiki/league_attendance_avg.json")

INSERT_SQL = """
INSERT INTO metrics (
    sport, level, season_year,
    metric_name, metric_value,
    unit, source, source_url
)
VALUES %s
ON CONFLICT (sport, level, season_year, metric_name) DO NOTHING;
"""

def detect_encoding(file_path: Path) -> str:
    raw_bytes = file_path.read_bytes()
    guess = chardet.detect(raw_bytes)
    return guess.get("encoding") or "utf-8"

def main():
    if not JSON_PATH.exists():
        raise FileNotFoundError(f"JSON not found: {JSON_PATH.resolve()}")
    
    enc = detect_encoding(JSON_PATH)
    with open(JSON_PATH, "r", encoding=enc) as f:
        data = json.load(f)
        
    values = []
    
    for r in data:
        values.append(
            (
                r["sport"],
                r["level"],
                int(r["season_year"]),
                r["metric_name"],
                int(r["metric_value"]),
                r.get("unit"),
                r.get("source"),
                r.get("source_url"),
            )
        )

    conn = psycopg2.connect(**DB_CONFIG)
    
    try:
        with conn:
            with conn.cursor() as cur:
                execute_values(cur, INSERT_SQL, values, page_size=1000)
                
        print(f"[OK] Loaded {len(values)} rows from {JSON_PATH}")
    finally:
        conn.close()
        
if __name__ == "__main__":
    main()