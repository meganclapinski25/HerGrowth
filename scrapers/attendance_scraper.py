import json 
import re
from pathlib import Path 
import pandas as pd
import requests

URL = "https://en.wikipedia.org/wiki/National_Women%27s_Soccer_League_attendance"

def extract_year(value):
    # if no value return none
    if pd.isna(value):
        return None
    match = re.search(r"\d{4}", str(value))
    return int(match.group()) if match else None

def extract_int(value):
    if pd.isna(value):
        return None
    
    value = str(value)
    value = re.sub(r"\[[^\]]*\]", "" , value)
    value = value.replace("," "").strip()
    
    return int(value) if value.isdigit() else None

def main ():
    output_dir = Path("data/parsed/wiki")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    response = requests.get(URL, timeout = 30)
    response.raise_for_status()
    
    df = pd.read_html(response.text)[0]
    df.columns = df.columns.str.lower().str.strip()
    
    df["season_year"] = df["season"].apply(extract_year)
    
    avg_col = "average" if "average" in df.columns else "avg"
    
    results = []
    
    for _, row in df.iterrows():
        year = row["season_year"]
        
        if year is None or not (2013 <=year <=2025):
            continue
        avg_attendance = extract_int(row[avg_col])
        if avg_attendance is None:
            continue
        
        results.append({
            "sport": "soccer",
            "level": "NWSL",
            "season_year": year,
            "metric_name": "attendance_league_avg",
            "metric_value": avg_attendance,
            "unit": "people",
            "source": "Wikipedia",
            "source_url": URL,
        })
        
    out_file = output_dir / "league_attendance_avg.json"
    out_file.write_text(json.dumps(results,indent=2),encoding = "utf-8")
    
    print(f"Saved {len(results)} seasibs to {out_file}")
    
if __name__ == "__main__":
    main()