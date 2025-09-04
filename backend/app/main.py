from fastapi import FastAPI, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from .services.latex_editor import LaTeXResumeEditor

app = FastAPI()

# Allow CORS for frontend
app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

class EditLatexResumeRequest(BaseModel):
	latex_content: str
	job_description: str
	resume_text: str = ""

latex_editor = LaTeXResumeEditor()

@app.post("/edit-latex-resume/")
async def edit_latex_resume(
    latex_file: UploadFile = File(...),
    job_description: str = Form(...),
    resume_text: str = Form("")
):
    latex_content = (await latex_file.read()).decode("utf-8")
    result = latex_editor.edit_resume_for_job(
        latex_content=latex_content,
        job_description=job_description,
        resume_text=resume_text
    )
    return JSONResponse(content=result)
