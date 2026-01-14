from pathlib import Path
import requests

def fetch_html(url: str) -> str:
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.google.com/",
    }
    resp = requests.get(url, headers = headers, timeout =25)
    resp.raise_for_status()
    return resp.text

def save_raw(html:str, filename: str) -> None: 
    Path("data/raw").mkdir(parents=True, exist_ok=True)
    Path(f"data/raw{filename}").write_text(html, encoding="utf-8")
    
    
if __name__ == "__main__":
    url = "https://fbref.com/en/comps/182/NWSL-Stats"
    html = fetch_html(url)
    save_raw(html, "sample_game.html")
    print("Saved: data/raw/sample.html")