from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from services.matcher import analyze_resume_and_job_groq
import requests
from bs4 import BeautifulSoup

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze/")
async def analyze_resume_and_job(
    resume: UploadFile = File(...),
    job_url: str = Form(...)
):
    resume_text = (await resume.read()).decode("utf-8")

    # Scrape job description HTML
    try:
        response = requests.get(job_url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        # Attempt to find main job content — tweak this if needed
        job_text_elements = soup.find_all(["p", "li"])
        job_text = "\n".join([elem.get_text(strip=True) for elem in job_text_elements if elem.get_text(strip=True)])

        if len(job_text) < 100:
            raise ValueError("Job description content too short. Site may be JS-rendered or structured differently.")

    except Exception as e:
        return {"error": f"Failed to scrape job posting: {str(e)}"}

    # TODO: GPT logic will go here
    return {
        "match_score": 82,
        "suggestions": ["Include leadership experience", "Add SQL/Excel skills"],
        "job_snippet": job_text[:500]  # Debug preview
    }

@app.post("/analyze/")
async def analyze_resume_and_job(
    resume: UploadFile = File(...),
    job_url: str = Form(...)
):
    resume_text = (await resume.read()).decode("utf-8")
    job_text = scrape_job_description(job_url)

    result = analyze_resume_and_job_groq(resume_text, job_text)

    return result