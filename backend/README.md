Backend setup

1. Create a virtual environment (Windows PowerShell):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Install dependencies:

```powershell
pip install -r app/requirements.txt
```

3. Run the server:

```powershell
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Notes:
- Ensure you have Python 3.11+ installed.
- Set environment variables (e.g., GROQ_API_KEY) in `.env` if needed.
