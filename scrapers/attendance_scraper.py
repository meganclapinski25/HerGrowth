import json 
import re
from io import StringIO
from pathlib import Path 
import pandas as pd
import requests

URL = "https://en.wikipedia.org/wiki/National_Women%27s_Soccer_League_attendance" 


HEADERS = {  
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://en.wikipedia.org/",
}


def extract_year(value):
    # if no value return none
    if pd.isna(value):
        return None
    match = re.search(r"\d{4}", str(value))
    return int(match.group()) if match else None

def extract_int(value):
    if pd.isna(value):
        return None
    
    value = str(value).strip()
    value = re.sub(r"\[[^\]]*\]", "" , value)
    value = value.replace("," , "").strip()
    
    return int(value) if value.isdigit() else None

def main ():
    output_dir = Path("data/parsed/wiki")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    response = requests.get(URL, headers=HEADERS, timeout = 30)
    response.raise_for_status()
    
    tables = pd.read_html(StringIO(response.text))
    df = tables[0]
    
    
    df.columns = [str(c).strip().lower() for c in df.columns] 
    
    season_col = "season"
    avg_col = "average" if "average" in df.columns else "avg"
    total_col = "total gate"
    
    df["season_year"] = df[season_col].apply(extract_year)
    
    rows = []
    
    for _, r in df.iterrows():
        year = r["season_year"]
        
        if year is None or year < 2013 or year > 2025:
            continue
        
        
        avg_att = extract_int(r[avg_col])
        total_att = extract_int(r[total_col])       
        
        
        if avg_att is not None: 
            
            rows.append({
                "sport": "soccer",
                "level": "NWSL",
                "season_year": year,
                "metric_name": "attendance_league_avg",
                "metric_value": avg_att,
                "unit": "people",
                "source": "Wikipedia",
                "source_url": URL,
            })
        if total_att is not None:  # only write row if it exists
            rows.append(
                {
                    "sport": "soccer",
                    "level": "NWSL",
                    "season_year": year,
                    "metric_name": "attendance_total",
                    "metric_value": total_att,
                    "unit": "people",
                    "source": "Wikipedia",
                    "source_url": URL,
                }
            )
        
    out_file = output_dir / "league_attendance_avg.json"
    out_file.write_text(json.dumps(rows ,indent=2),encoding = "utf-8")
    
    print(f"Saved {len(rows)} seasibs to {out_file}")
    
if __name__ == "__main__":
    main()