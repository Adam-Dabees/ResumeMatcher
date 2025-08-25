Developer setup — ResumeMatcher

This document shows how to run the development servers for both backend (FastAPI) and frontend (Next.js) on Windows PowerShell.

Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- Git (optional)

Quick checklist
- [ ] Start backend on http://127.0.0.1:8000
- [ ] Start frontend on http://localhost:3000
- [ ] Confirm backend `/docs` is reachable
- [ ] Upload a PDF in frontend and test analysis

Backend (FastAPI)
1. Open PowerShell and go to the backend folder:

```powershell
cd C:\path\to\ResumeMatcher\backend
```

2. Create and activate a virtual environment (PowerShell):

```powershell
python -m venv .venv
# If PowerShell blocks script execution, allow for this session:
# Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
. .\.venv\Scripts\Activate.ps1
```

(Alternative for CMD)
```cmd
.\.venv\Scripts\activate.bat
```

3. Install dependencies:

```powershell
pip install -r app/requirements.txt
```

4. (Optional) Create `.env` in `backend` with keys your app needs (example names used in code):

```
GROQ_API_KEY=your_groq_api_key_here
# any other env vars used by the backend
```

5. Start the backend server. Ensure `PYTHONPATH` includes the `backend` folder so `import app` works.

```powershell
# From backend folder
$env:PYTHONPATH = $PWD.Path
& .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Notes:
- If you don't want `--reload`, omit it for a single process run.
- If you see import errors like `ModuleNotFoundError: No module named 'app'`, make sure you started uvicorn with `PYTHONPATH` set to the `backend` directory (see command above).

Verify backend is up:
- Open http://127.0.0.1:8000/docs in your browser.

Frontend (Next.js)
1. Open a new PowerShell window and go to the frontend folder:

```powershell
cd C:\path\to\ResumeMatcher\frontend
```

2. Install npm deps (only once):

```powershell
npm install
```

3. Create `.env.local` (or edit it) to point to the backend. For local dev:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

4. Start the Next dev server:

```powershell
npm run dev
```

Open http://localhost:3000 in your browser and use the UI.

Testing analyze endpoint locally
- With both servers running, use the UI to upload a PDF and enter a job URL, then click Analyze.
- If you want to run an automated test (used during debugging), run the included script from the backend folder using the venv python:

```powershell
cd C:\path\to\ResumeMatcher\backend
& .\.venv\Scripts\python.exe test_post.py
```

## JS-rendered job postings and scraping fallback

If a job posting is rendered with JavaScript (common on many job boards), the backend scraper may extract too little text and return an error "Extracted text too short. Bad URL or JS-rendered page".

Some job sites like Indeed have strong bot protection and will return "403 Forbidden" errors for automated scraping.

**See [JOB_SITE_COMPATIBILITY.md](./JOB_SITE_COMPATIBILITY.md) for detailed compatibility info and troubleshooting.**

Workarounds:
- Use the frontend textarea to paste the full job description manually and submit. The frontend will send `job_description` to the backend and skip scraping.
- Try LinkedIn job URLs which typically work better: `https://linkedin.com/jobs/view/[job-id]`
- Use company career pages instead of job boards when possible
- Look for "Print" or "Share" versions of job postings (often cleaner HTML)

To test the fallback:
1. Start both servers as described above.
2. In the frontend UI, upload a resume PDF.
3. Paste a job description into the "OR paste job description directly" textarea.
4. Click "Analyze Match".

The backend accepts either `job_url` or `job_description` (or both). If both are provided, the pasted `job_description` will be used.

Troubleshooting
- ERR_CONNECTION_REFUSED when frontend calls `/analyze/`:
  - Ensure backend is running and reachable at the `NEXT_PUBLIC_API_URL` value.
  - Verify backend listening address is 127.0.0.1:8000 (or whichever host/port you set).
  - Check firewall or antivirus blocking local ports.

- `ModuleNotFoundError: No module named 'app'` when starting backend:
  - Start uvicorn with `PYTHONPATH` set to the backend folder (see backend start command above).

- Activation/PowerShell execution policy errors:
  - Run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` to allow script execution for the session.
  - Or run venv python directly without activating: `& .\.venv\Scripts\python.exe -m pip install -r app/requirements.txt` and start uvicorn with the full python path.

- If the matcher attempts to call external APIs and fails because environment variables are missing, set `GROQ_API_KEY` in `backend/.env` or export it in your session before running the server.

Notes for deployment
- For Vercel, set `NEXT_PUBLIC_API_URL` in the project environment settings to your backend URL.
- On production backend, remove or disable development fallbacks and ensure credentials are present.

If you want, I can add small PowerShell wrappers (scripts) to start both servers with a single command and to create the venv automatically.
