from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze/")
async def analyze_resume_and_job(resume: UploadFile = File(...), job: UploadFile = File(...)):
    resume_text = (await resume.read()).decode("utf-8")
    job_text = (await job.read()).decode("utf-8")
    # Placeholder for GPT call
    return {"match_score": 85, "suggestions": ["Add 'project management'", "Mention 'data visualization'"]}