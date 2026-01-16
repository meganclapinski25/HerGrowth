# HerGrowth

## Overview
**HerGrowth** is a full-stack data analysis project that explores the growth of women's professional soccer through key metrics such as attendance, viewership, and league level trends. The goal of this project is to make growth in women's sports more visible, measurable, and accessible through clean data pipelines, API's, and an interactive front-end experience.

This project currently focuses on **Women's Soccer** with the **NWSL** as the primary league, and is designed to scale to additional sports in the future. 

---

## Project Structure

```
HerGrowth/
├── backend/          # Backend API, scrapers, scripts, and data
│   ├── api/         # FastAPI application
│   ├── scrapers/    # Data scraping scripts
│   ├── scripts/     # Utility scripts for database operations
│   ├── data/        # Parsed data files
│   └── requirements.txt
├── frontend/        # Frontend HTML, CSS, and JavaScript
│   ├── index.html
│   ├── search.html
│   ├── soccer-pro.html
│   ├── scripts.js
│   └── style.css
└── README.md
```

---

## Project Goals 
- Collect and store historical women's soccer data (attendance, viewership, etc)
- Clean and aggregate data into meaningful league-level metrics
- Serve data through a custom API
- Visualize growth trends using an interactive dashboard

---

## Tech Stack
**Backend / Data**

- Python
- PostgreSQL
- FastAPI
- Pandas

**Frontend** 
- HTML 
- CSS (Tailwind)
- JavaScript

---

## Getting Started

### Backend Setup

See [backend/README.md](backend/README.md) for detailed backend setup instructions.

1. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Configure database connection in `backend/api/main.py`

3. Run the API server:
```bash
cd backend/api
uvicorn main:app --reload
```

The API will be available at `http://127.0.0.1:8000`

### Frontend Setup

1. Serve the frontend files using a local server (e.g., VS Code Live Server, Python's http.server, etc.)

2. Open `frontend/index.html` in your browser

The frontend will connect to the API at `http://127.0.0.1:8000`

