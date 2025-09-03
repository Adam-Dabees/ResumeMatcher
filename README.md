# 🤖 AI Job Description Analyzer & Resume Matcher

Upload your **resume** and a **job description** — our app uses AI to:

- ✅ Give a **match score**
- 🔍 Identify **missing keywords**
- ✍️ Suggest **resume edits** to improve ATS compatibility
- 📊 Show **potential improvement** after implementing changes
- 🎯 Provide **actionable recommendations** with impact estimates

Future features will include LinkedIn scraping and company insights from Glassdoor!

---

## ⚙️ Tech Stack

| Layer     | Tech                     |
|-----------|--------------------------|
| Frontend  | Next.js 15, React 19, Tailwind CSS |
| Backend   | FastAPI, Uvicorn, Python |
| AI Layer  | Groq + LLaMA 3 (via API) |
| Styling   | Professional Dashboard UI |
| Deployment| Ready for production     |

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
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run server
python -m uvicorn main:app --reload --port 8000
```

Server runs at:  
👉 http://127.0.0.1:8000

### 3️⃣ Frontend Setup (Next.js)

```bash
cd frontend
npm install
npm run dev
```

App runs at:  
👉 http://localhost:3000

### 4️⃣ Run Both Simultaneously

From the root directory:
```bash
npm install concurrently --save-dev
npm run dev
```

This will start both frontend (port 3000) and backend (port 8000)!

---

## 📂 Project Structure

```
resume-job-matcher-ai/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── __init__.py
│   └── (other backend files)
├── frontend/
│   ├── app/
│   │   ├── layout.js
│   │   ├── page.js
│   │   └── globals.css
│   ├── public/
│   ├── package.json
│   └── next.config.js
├── package.json (root - for concurrent execution)
├── .gitignore
└── README.md
```

---

## ✨ Enhanced Features

- Upload and analyze resumes + job descriptions
- LLaMA 3-based skills matching and suggestion engine
- Professional dashboard with dual-score visualization
- Advanced analytics with impact metrics
- CORS-enabled backend for easy frontend integration
- Responsive design with professional UI/UX
- Easy to extend with:
  - PDF-to-text parsing
  - LinkedIn skill scraping (future)
  - Glassdoor company culture summary (future)

---

## 📌 TODOs

- [ ] Upload & parse PDF or .docx resumes
- [ ] Integrate Groq + LLaMA 3 for real-time matching
- [ ] Add LangChain for structured prompt pipelines
- [x] Style UI with Tailwind / Professional dashboard
- [ ] Add login + user dashboard (optional)
- [ ] LinkedIn profile integration
- [ ] Exportable reports and analytics

---

## 🧠 Built By

Adam Dabees & Ibrahim Al Omran

---

## 📄 License

MIT License

---

## 🆕 Recent Updates

### Version 1.1.0 - Professional Dashboard Release
- Complete UI overhaul with professional design system
- Advanced analytics with dual-score visualization
- Concurrent execution for seamless development
- Enhanced UX with animations and responsive design
- Production-ready architecture and error handling

### Version 1.0.0 - Initial Release
- Basic resume and job description upload
- AI-powered matching algorithm
- Simple score display and recommendations
- Foundation for future enhancements

---

## 🆘 Troubleshooting

**Backend not starting?** Check if port 8000 is available  
**Frontend issues?** Ensure Node.js version 18+ is installed  
**Module errors?** Run `npm install` in frontend directory  
**Python issues?** Verify virtual environment is activated

For additional support, create an issue in our GitHub repository!