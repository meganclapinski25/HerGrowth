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

@app.get("/")
def root():
    return {"message": "HerGrowth API is running"}