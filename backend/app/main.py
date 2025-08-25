from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
from tempfile import NamedTemporaryFile
import pdfplumber

from app.services.job_scraper import scrape_job_description
from app.services.matcher import analyze_resume_and_job_groq  # Assuming you have this function

app = FastAPI()

# Allow frontend dev to access from localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to ["http://localhost:3000"] if you want stricter CORS
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze/")
async def analyze_resume_and_job(
    resume: UploadFile = File(...),
    job_url: Optional[str] = Form(None),
    job_description: Optional[str] = Form(None),
):
    # Validate file type
    if resume.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    # Save and parse PDF
    with NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(await resume.read())
        tmp_path = tmp.name

    try:
        with pdfplumber.open(tmp_path) as pdf:
            resume_text = "\n".join([page.extract_text() or "" for page in pdf.pages])
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error reading PDF")

    # If job_description provided by the client, use it. Otherwise try scraping job_url.
    if not job_description:
        if not job_url:
            raise HTTPException(status_code=400, detail="Either job_url or job_description must be provided.")
        try:
            job_description = scrape_job_description(job_url)
        except Exception as e:
            # Provide a clear error so frontend can suggest fallback to paste job description
            raise HTTPException(
                status_code=500,
                detail=f"Error scraping job URL: {str(e)}"
            )

    # Match using your logic (Groq, embedding comparison, etc.)
    try:
        match_result = analyze_resume_and_job_groq(resume_text, job_description)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Matching error: {str(e)}")

    return {
        "summary": match_result["summary"],
        "score": match_result.get("score"),
        "recommendations": match_result.get("recommendations", [])
    }