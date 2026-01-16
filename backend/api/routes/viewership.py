
import json 
from pathlib import Path
from fastapi import APIRouter

router = APIRouter()

DATA_PATH = Path ("data/viewership.json")

@router.get("/viewership")
def get_viewership():
    with open(DATA_PATH, "r") as f:
        data = json.load(f)
    return data