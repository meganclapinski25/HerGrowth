import json 
from pathlib import Path
from fastapi import APIRouter
from typing import Optional

router = APIRouter()

# Get the api folder path (parent of routes folder)
API_ROOT = Path(__file__).parent.parent
DATA_PATH = API_ROOT / "viewership.json"

@router.get("/viewership/nwsl")
def get_viewership_nwsl(year: Optional[int] = None):
    """Get NWSL viewership data, optionally filtered by year"""
    with open(DATA_PATH, "r") as f:
        data = json.load(f)
    
    data_points = data.get("data_points", [])
    
    # Process data points - new format has direct avg_viewership and total_viewership
    result = []
    for point in data_points:
        y = point.get("year")
        if not y:
            continue
        
        # Skip if no viewership data
        if point.get("avg_viewership") is None and point.get("total_viewership") is None:
            continue
        
        result.append({
            "season_year": y,
            "avg_viewership": point.get("avg_viewership"),
            "total_viewership": point.get("total_viewership"),
        })
    
    # Sort by year
    result = sorted(result, key=lambda x: x["season_year"])
    
    # Filter by year if specified
    if year:
        result = [r for r in result if r["season_year"] == year]
    
    return result