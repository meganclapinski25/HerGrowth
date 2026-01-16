from fastapi import FastAPI
import psycopg2
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title ="HerGrowth API")

app.add_middleware(
    CORSMiddleware,
    allow_origins =["http://localhost:5000", "http://127.0.0.1:5000"],
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

@app.get("/db-check")
def db_check():
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM metrics;")
            count = cur.fetchone()[0]
        return {"metrics_count": count}
    finally:
        conn.close()
        
@app.get("/attendance/nwsl")
def attendance_nwsl():
    conn = get_conn()
    try:
        with conn.cursor() as cur:
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
            {
                "season_year": r[0],
                "avg_attendance": r[1],
                "total_attendance": r[2],
            }
            for r in rows
        ]
    finally:
        conn.close()
        
@app.get("/attendance/nwsl/kpis")
def attendance_nwsl_kpis():
    con = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                        SELECT
                            season_year,
                            MAX(CASE WHEN metric_name = 'attendance_league_avg' THEN metric_value END) AS avg_attendance,
                            MAX(CASE WHEN metric_name = 'attendance_total' THEN metric_value END) AS total_attendance)
                        FROM metrics
                        WHERE sport = 'soccer'
                            AND level = 'NWSL'
                            AND metric_name IN ('attendance_league_avg', 'attendance_total')
                        GROUP BY season_year
                        ORDER BY season_year;
            """)
            rows = cur.fetchall()
        data = [
            {"season_year": r[0], "avg_attendance": r[1], "total_attendance": r[2]}
            for r in rows
        ]
        
        # KPI logic using total attendance
        totals = [d for d in data if d["total_attendance"] is not None]
        if len(totals) < 2:
            return{
                "error": "Not enough data to compute KPIs"
            }
        first = totals[0]
        last = totals[-1]
        
        total_growth = last["total_attendance"] - first["total_attendance"]
        
        yoy = []
        for i in range(1,len(totals)):
            prev = totals[i-1]
            curr = totals[i]
            yoy.append(
                {
                    "from_year":prev["season_year"],
                    "to_year": curr["season_year"],
                    "delta": curr["total_attendance"] - prev["total_attendance"],
                }
            )
            
        avg_yoy_growth = round(sum(x["delta"]for x in yoy) / len(yoy),2)
        
        peak = max(totals, key=lambda x: x["total_attendance"])
        biggest_jump = max(yoy, key=lambda x: x["delta"])
        
        return{
            "metric": "attendance_total",
            "range": {"start_year": first["season_year"], "end_year": last["season_year"]},
            "current_value": last["total_attendance"],
            "total_growth": total_growth,
            "avg_yoy_growth": avg_yoy_growth,
            "peak_year": peak["season_year"],
            "peak_value": peak["total_attendance"],
            "biggest_jump": biggest_jump,
        }
    finally:
        conn.close()
@app.get("/")
def root():
    return {"message": "HerGrowth API is running"}