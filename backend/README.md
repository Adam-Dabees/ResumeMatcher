# Resume Matcher Backend

A FastAPI backend service that analyzes resumes against job descriptions and provides matching scores and recommendations.

## Features

- **Resume Analysis**: Upload PDF resumes and get matching scores against job descriptions
- **Job Scraping**: Automatically extract job descriptions from URLs
- **AI-Powered Matching**: Uses Groq API for intelligent resume-job matching
- **LaTeX Resume Editing**: Edit LaTeX resumes to better match job descriptions

## API Endpoints

### 1. Resume Analysis (`POST /analyze/`)
Analyzes a PDF resume against a job description.

**Parameters:**
- `resume`: PDF file upload
- `job_url`: URL to scrape job description from (optional)
- `job_description`: Direct job description text (optional)

**Response:**
```json
{
  "summary": "Missing: Python, Django, SQL",
  "score": 75,
  "recommendations": ["Add Python skills", "Include database experience"]
}
```

### 2. LaTeX Resume Editing (`POST /edit-latex-resume/`)
Edits a LaTeX resume to better match a job description.

**Parameters:**
- `latex_file`: .tex file upload
- `job_url`: URL to scrape job description from (optional)
- `job_description`: Direct job description text (optional)

**Response:**
```json
{
  "original_latex": "\\documentclass{article}...",
  "edited_latex": "\\documentclass{article}\\section{Skills}...",
  "suggestions": {
    "skills_additions": ["Python", "Django", "SQL"],
    "experience_enhancements": ["Add metrics to achievements"],
    "keywords_to_include": ["Python", "Django", "SQL"],
    "latex_modifications": ["Added skills section"]
  },
  "changes_made": ["Added new Skills section", "Incorporated job keywords"],
  "job_description": "We are looking for..."
}
```

### 3. Combined Analysis and Editing (`POST /analyze-and-edit/`)
Combines resume analysis with optional LaTeX editing.

**Parameters:**
- `resume`: PDF file upload (required)
- `latex_file`: .tex file upload (optional)
- `job_url`: URL to scrape job description from (optional)
- `job_description`: Direct job description text (optional)

**Response:**
```json
{
  "analysis": {
    "summary": "Missing: Python, Django, SQL",
    "score": 75,
    "recommendations": ["Add Python skills", "Include database experience"]
  },
  "job_description": "We are looking for...",
  "latex_editing": {
    "original_latex": "\\documentclass{article}...",
    "edited_latex": "\\documentclass{article}\\section{Skills}...",
    "suggestions": {...},
    "changes_made": [...]
  }
}
```

## LaTeX Editing Features

The LaTeX editor automatically:

1. **Adds Missing Skills**: Creates or enhances skills sections with relevant keywords
2. **Incorporates Job Keywords**: Strategically places important terms throughout the resume
3. **Maintains Formatting**: Preserves LaTeX structure and professional appearance
4. **AI-Powered Suggestions**: Uses Groq API for intelligent content recommendations

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables:
```bash
GROQ_API_KEY=your_groq_api_key_here
```

3. Run the server:
```bash
uvicorn main:app --reload
```

## Testing

Test the LaTeX editor functionality:
```bash
python test_latex_editor.py
```

## Example Usage

### Frontend Integration
```javascript
// Upload LaTeX file and get edited version
const formData = new FormData();
formData.append('latex_file', latexFile);
formData.append('job_description', 'We need a Python developer...');

const response = await fetch('/edit-latex-resume/', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log('Edited LaTeX:', result.edited_latex);
```

### Download Edited Resume
```javascript
// Create and download the edited .tex file
const blob = new Blob([result.edited_latex], { type: 'text/plain' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'edited_resume.tex';
a.click();
URL.revokeObjectURL(url);
```
