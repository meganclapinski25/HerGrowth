# HerGrowth Backend

## Structure

- `api/` - FastAPI application serving the REST API
- `scrapers/` - Data scraping scripts
- `scripts/` - Utility scripts for loading data into the database
- `data/` - Parsed data files (JSON)

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Ensure PostgreSQL is running and configured in `api/main.py` (DB_CONFIG)

   - If you want to run without Postgres, set `HG_DATA_MODE=json` to read the bundled JSON file.
   - Optionally set `HG_JSON_PATH` to point at a different JSON file.

3. Run the API server:
```bash
cd api
uvicorn main:app --reload
```

   JSON-only mode (no Postgres):
```bash
cd api
HG_DATA_MODE=json uvicorn main:app --reload
```

The API will be available at `http://127.0.0.1:8000`

## Running Scripts

### Scrape attendance data:
```bash
cd scrapers
python attendance_scraper.py
```

### Load data into database:
```bash
cd scripts
python load_metrics.py
```

## API Endpoints

- `GET /` - Health check
- `GET /db-check` - Check database connection
- `GET /attendance/nwsl` - Get NWSL attendance data
- `GET /attendance/nwsl/kpis` - Get NWSL attendance KPIs
