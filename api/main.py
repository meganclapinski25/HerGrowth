from fastapi import FastAPI
import psycopg2


app = FastAPI(title ="HerGrowth API")

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
@app.get("/")
def root():
    return {"message": "HerGrowth API is running"}