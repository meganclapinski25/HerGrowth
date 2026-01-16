from fastapi import FastAPI, HTTPException
import json
import os
from pathlib import Path
import psycopg2
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="HerGrowth API")

DATA_MODE = os.getenv("HG_DATA_MODE", "auto").strip().lower()
if DATA_MODE not in {"auto", "db", "json"}:
    DATA_MODE = "auto"

BACKEND_ROOT = Path(__file__).resolve().parents[1]
JSON_PATH = Path(
    os.getenv(
        "HG_JSON_PATH",
        str(BACKEND_ROOT / "data" / "parsed" / "wiki" / "league_attendance_avg.json"),
    )
)
_JSON_CACHE = None

app.add_middleware(
    CORSMiddleware,
    allow_origins =[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:5000",
        "http://localhost:5000",],
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],
)

DB_CONFIG = {
    "host": "localhost",
    "port": 2345,
    "dbname": "hergrowth",
    "user": "postgres",
    "password": "",  # put your password here if you use one
}

def get_conn():
    return psycopg2.connect(**DB_CONFIG)

def get_json_data():
    global _JSON_CACHE
    if _JSON_CACHE is None:
        if not JSON_PATH.exists():
            raise HTTPException(
                status_code=500,
                detail=f"JSON data not found at {JSON_PATH}",
            )
        with JSON_PATH.open("r", encoding="utf-8") as file:
            _JSON_CACHE = json.load(file)
    return _JSON_CACHE

def build_attendance_series_from_json(year=None):
    data = get_json_data()
    by_year = {}
    for row in data:
        if row.get("sport") != "soccer" or row.get("level") != "NWSL":
            continue
        season_year = int(row.get("season_year"))
        if year is not None and season_year != year:
            continue
        metric_name = row.get("metric_name")
        if metric_name not in ("attendance_league_avg", "attendance_total"):
            continue
        entry = by_year.setdefault(
            season_year,
            {
                "season_year": season_year,
                "avg_attendance": None,
                "total_attendance": None,
            },
        )
        if metric_name == "attendance_league_avg":
            entry["avg_attendance"] = row.get("metric_value")
        elif metric_name == "attendance_total":
            entry["total_attendance"] = row.get("metric_value")

    return [by_year[yr] for yr in sorted(by_year)]

def fetch_attendance_series_from_db(year=None):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            if year is not None:
                cur.execute("""
                    SELECT
                        season_year,
                        MAX(CASE WHEN metric_name = 'attendance_league_avg' THEN metric_value END) AS avg_attendance,
                        MAX(CASE WHEN metric_name = 'attendance_total' THEN metric_value END) AS total_attendance
                    FROM metrics
                    WHERE sport = 'soccer'
                      AND level = 'NWSL'
                      AND season_year = %s
                      AND metric_name IN ('attendance_league_avg', 'attendance_total')
                    GROUP BY season_year
                    ORDER BY season_year;
                """, (year,))
            else:
                cur.execute("""
                    SELECT
                        season_year,
                        MAX(CASE WHEN metric_name = 'attendance_league_avg' THEN metric_value END) AS avg_attendance,
                        MAX(CASE WHEN metric_name = 'attendance_total' THEN metric_value END) AS total_attendance
                    FROM metrics
                    WHERE sport = 'soccer'
                      AND level = 'NWSL'
                      AND metric_name IN ('attendance_league_avg', 'attendance_total')
                    GROUP BY season_year
                    ORDER BY season_year;
                """)
            rows = cur.fetchall()

        return [
            {"season_year": r[0], "avg_attendance": r[1], "total_attendance": r[2]}
            for r in rows
        ]
    finally:
        conn.close()

def fetch_attendance_series(year=None):
    if DATA_MODE == "json":
        return build_attendance_series_from_json(year)

    try:
        return fetch_attendance_series_from_db(year)
    except psycopg2.Error:
        if DATA_MODE == "db":
            raise HTTPException(status_code=500, detail="Database connection failed.")
        return build_attendance_series_from_json(year)

def try_db_metrics_count():
    try:
        conn = get_conn()
    except psycopg2.Error as error:
        return None, error
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM metrics;")
            count = cur.fetchone()[0]
        return count, None
    finally:
        conn.close()

@app.get("/")
def root():
    return {"message": "HerGrowth API is running"}

@app.get("/db-check")
def db_check():
    if DATA_MODE == "json":
        data = get_json_data()
        return {"data_source": "json", "metrics_count": len(data)}

    count, error = try_db_metrics_count()
    if error:
        if DATA_MODE == "db":
            raise HTTPException(status_code=500, detail="Database connection failed.")
        data = get_json_data()
        return {
            "data_source": "json",
            "metrics_count": len(data),
            "db_status": "unavailable",
        }
    return {"data_source": "db", "metrics_count": count}

@app.get("/attendance/nwsl")
def attendance_nwsl(year: int = None):
    return fetch_attendance_series(year)

@app.get("/attendance/nwsl/kpis")
def attendance_nwsl_kpis(year: int = None):
    data = fetch_attendance_series(year)

    totals = [d for d in data if d["total_attendance"] is not None]
    if len(totals) < 2:
        return {"error": "Not enough data to compute KPIs"}

    first = totals[0]
    last = totals[-1]

    total_growth = last["total_attendance"] - first["total_attendance"]

    yoy = []
    for i in range(1, len(totals)):
        prev = totals[i - 1]
        curr = totals[i]
        yoy.append({
            "from_year": prev["season_year"],
            "to_year": curr["season_year"],
            "delta": curr["total_attendance"] - prev["total_attendance"],
        })

    avg_yoy_growth = round(sum(x["delta"] for x in yoy) / len(yoy), 2)

    peak = max(totals, key=lambda x: x["total_attendance"])
    biggest_jump = max(yoy, key=lambda x: x["delta"])

    return {
        "metric": "attendance_total",
        "range": {"start_year": first["season_year"], "end_year": last["season_year"]},
        "current_value": last["total_attendance"],
        "total_growth": total_growth,
        "avg_yoy_growth": avg_yoy_growth,
        "peak_year": peak["season_year"],
        "peak_value": peak["total_attendance"],
        "biggest_jump": biggest_jump,
        "data": data,  # Include full data for filtering
    }