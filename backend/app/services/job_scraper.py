import requests
from bs4 import BeautifulSoup

def scrape_job_description(url: str) -> str:
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")
        elements = soup.find_all(["p", "li"])
        job_text = "\n".join([el.get_text(strip=True) for el in elements])

        if len(job_text) < 100:
            raise ValueError("Extracted text too short. Bad URL or JS-rendered page.")

        return job_text

    except Exception as e:
        raise RuntimeError(f"Failed to scrape job URL: {str(e)}")