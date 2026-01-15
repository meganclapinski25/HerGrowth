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

