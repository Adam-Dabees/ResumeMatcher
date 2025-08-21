# 🤖 AI Job Description Analyzer & Resume Matcher

Upload your **resume** and a **job description** — our app uses AI to:

- ✅ Give a **match score**
- 🔍 Identify **missing keywords**
- ✍️ Suggest **resume edits** to improve ATS compatibility

Future features will include LinkedIn scraping and company insights from Glassdoor!

---

## ⚙️ Tech Stack

| Layer     | Tech                     |
|-----------|--------------------------|
| Frontend  | React, Axios             |
| Backend   | FastAPI, Uvicorn         |
| AI Layer  | OpenAI GPT (via API)     |
| Optional  | LangChain (structured prompts) |

---

## 🚀 Local Setup Guide

Follow these steps to run both the frontend and backend locally.

### 1️⃣ Clone the Repo

```bash
git clone https://github.com/your-username/resume-job-matcher-ai.git
cd resume-job-matcher-ai
```

### 2️⃣ Backend Setup (FastAPI)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r app/requirements.txt

# Run server
uvicorn app.main:app --reload
```

Server runs at:  
👉 http://127.0.0.1:8000

### 3️⃣ Frontend Setup (React)

```bash
cd frontend
npm install
npm run dev  # Or npm start depending on setup
```

App runs at:  
👉 http://localhost:3000

---

## 📂 Project Structure

```
resume-job-matcher-ai/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── services/
│   │   ├── models/
│   │   ├── api/
│   │   └── requirements.txt
│   └── venv/
├── frontend/
│   ├── public/
│   └── src/
│       ├── pages/
│       ├── components/
│       └── App.jsx
├── .gitignore
└── README.md
```

---

## ✨ Features

- Upload and analyze resumes + job descriptions
- GPT-based skills matching and suggestion engine
- CORS-enabled backend for easy frontend integration
- Easy to extend with:
  - PDF-to-text parsing
  - LinkedIn skill scraping (future)
  - Glassdoor company culture summary (future)

---

## 📌 TODOs

- [ ] Upload & parse PDF or .docx resumes
- [ ] Integrate OpenAI GPT for real-time matching
- [ ] Add LangChain for structured prompt pipelines
- [ ] Style UI with Tailwind / Material UI
- [ ] Add login + user dashboard (optional)

---

## 🧠 Built By

Adam Dabees 
&
Ibrahim Al Omran

---

## 📄 License

MIT License