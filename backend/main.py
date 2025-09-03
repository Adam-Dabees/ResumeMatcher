from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
from tempfile import NamedTemporaryFile
import pdfplumber
import re

from app.services.job_scraper import scrape_job_description
from app.services.matcher import analyze_resume_and_job_groq  # Assuming you have this function
from app.services.latex_editor import LaTeXResumeEditor

app = FastAPI()

# Allow frontend dev to access from localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to ["http://localhost:3000"] if you want stricter CORS
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize LaTeX editor
latex_editor = LaTeXResumeEditor()

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

@app.post("/edit-latex-resume/")
async def edit_latex_resume(
    latex_file: UploadFile = File(...),
    job_url: Optional[str] = Form(None),
    job_description: Optional[str] = Form(None),
):
    """
    Edit LaTeX resume to better match job description
    Accepts .tex files and returns improved version
    """
    # Validate file type
    if not latex_file.filename.endswith('.tex'):
        raise HTTPException(status_code=400, detail="Only .tex files are accepted.")
    
    # Read LaTeX content
    try:
        latex_content = (await latex_file.read()).decode('utf-8')
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error reading LaTeX file")
    
    # Get job description
    if not job_description:
        if not job_url:
            raise HTTPException(status_code=400, detail="Either job_url or job_description must be provided.")
        try:
            job_description = scrape_job_description(job_url)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error scraping job URL: {str(e)}"
            )
    
    # Extract plain text from LaTeX for context (remove LaTeX commands)
    resume_text = _extract_plain_text_from_latex(latex_content)
    
    # First, analyze the original resume to get the current score
    try:
        original_analysis = analyze_resume_and_job_groq(resume_text, job_description)
        original_score = original_analysis.get("score", 0)
    except Exception as e:
        original_score = 0
    
    # Edit the LaTeX resume
    try:
        edit_result = latex_editor.edit_resume_for_job(latex_content, job_description, resume_text)
        
        if "error" in edit_result:
            raise HTTPException(status_code=500, detail=edit_result["error"])
        
        # Analyze the edited resume to get the new score
        edited_text = _extract_plain_text_from_latex(edit_result["edited_latex"])
        try:
            new_analysis = analyze_resume_and_job_groq(edited_text, job_description)
            new_score = new_analysis.get("score", 0)
        except Exception as e:
            new_score = original_score
        
        return {
            "original_latex": edit_result["original_latex"],
            "edited_latex": edit_result["edited_latex"],
            "suggestions": edit_result["suggestions"],
            "changes_made": edit_result["changes_made"],
            "job_description": job_description,
            "original_score": original_score,
            "new_score": new_score,
            "score_improvement": new_score - original_score
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error editing LaTeX resume: {str(e)}")

@app.post("/analyze-and-edit/")
async def analyze_and_edit_resume(
    resume: UploadFile = File(...),
    latex_file: Optional[UploadFile] = File(None),
    job_url: Optional[str] = Form(None),
    job_description: Optional[str] = Form(None),
):
    """
    Combined endpoint: analyze PDF resume and optionally edit LaTeX version
    Returns both analysis results and edited LaTeX if provided
    """
    # Validate PDF file
    if resume.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are accepted for resume analysis.")
    
    # Save and parse PDF
    with NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(await resume.read())
        tmp_path = tmp.name

    try:
        with pdfplumber.open(tmp_path) as pdf:
            resume_text = "\n".join([page.extract_text() or "" for page in pdf.pages])
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error reading PDF")

    # Get job description
    if not job_description:
        if not job_url:
            raise HTTPException(status_code=400, detail="Either job_url or job_description must be provided.")
        try:
            job_description = scrape_job_description(job_url)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error scraping job URL: {str(e)}"
            )

    # Analyze resume
    try:
        match_result = analyze_resume_and_job_groq(resume_text, job_description)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Matching error: {str(e)}")

    # Prepare response
    response = {
        "analysis": {
            "summary": match_result["summary"],
            "score": match_result.get("score"),
            "recommendations": match_result.get("recommendations", [])
        },
        "job_description": job_description
    }

    # If LaTeX file provided, also edit it
    if latex_file and latex_file.filename.endswith('.tex'):
        try:
            latex_content = (await latex_file.read()).decode('utf-8')
            latex_text = _extract_plain_text_from_latex(latex_content)
            
            edit_result = latex_editor.edit_resume_for_job(latex_content, job_description, latex_text)
            
            if "error" not in edit_result:
                response["latex_editing"] = {
                    "original_latex": edit_result["original_latex"],
                    "edited_latex": edit_result["edited_latex"],
                    "suggestions": edit_result["suggestions"],
                    "changes_made": edit_result["changes_made"]
                }
            else:
                response["latex_editing"] = {"error": edit_result["error"]}
                
        except Exception as e:
            response["latex_editing"] = {"error": f"Error editing LaTeX: {str(e)}"}

    return response

def _extract_plain_text_from_latex(latex_content: str) -> str:
    """Extract plain text from LaTeX content by removing LaTeX commands"""
    # Remove LaTeX commands (starting with \)
    text = re.sub(r'\\[a-zA-Z]+(\{[^}]*\})?', '', latex_content)
    
    # Remove LaTeX environments
    text = re.sub(r'\\begin\{[^}]*\}.*?\\end\{[^}]*\}', '', text, flags=re.DOTALL)
    
    # Remove remaining LaTeX syntax
    text = re.sub(r'[{}]', '', text)
    text = re.sub(r'\\[a-zA-Z]+', '', text)
    
    # Clean up whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text