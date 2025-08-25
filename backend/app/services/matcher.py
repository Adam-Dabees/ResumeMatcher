import os
import requests
import re
from dotenv import load_dotenv

load_dotenv()

def analyze_resume_and_job_groq(resume_text: str, job_text: str) -> dict:
    prompt = f"""
Compare the following resume and job description.
Give a match score out of 100.
List missing or weakly represented keywords/skills.
Also suggest 2–3 improvements to make the resume better fit the job.

Resume:
{resume_text}

Job Posting:
{job_text}

Format:
Match Score: XX
Missing Keywords: [keyword1, keyword2]
Suggestions: [suggestion1, suggestion2]
"""

    groq_api_key = os.getenv("GROQ_API_KEY")

    # Development fallback: if no GROQ API key is present, return a mocked response
    # so local frontend development and testing can proceed without external API access.
    if not groq_api_key:
        # Simple, conservative heuristic to extract some keywords from the job text
        # (first few unique words that look like skills).
        words = re.findall(r"[A-Za-z0-9+#\.\-]{2,}", job_text)
        common = []
        for w in words:
            lw = w.lower()
            if lw in ("and", "or", "the", "with", "for", "to", "of", "in"):
                continue
            if lw.isdigit():
                continue
            if lw not in common:
                common.append(lw)
            if len(common) >= 5:
                break

        missing_keywords = [k for k in common[:3]]
        suggestions = [
            "Highlight relevant projects and experience that match the job posting.",
            "Add concrete metrics (percent, numbers) to demonstrate impact.",
            "Include missing keywords from the job description in the skills section."
        ]

        return {
            "score": 70,
            "summary": f"Missing: {', '.join(missing_keywords)}" if missing_keywords else "No obvious missing keywords detected",
            "recommendations": suggestions
        }

    headers = {
        "Authorization": f"Bearer {groq_api_key}",
        "Content-Type": "application/json"
    }

    body = {
        "model": "meta-llama/llama-4-scout-17b-16e-instruct",
        "messages": [{"role": "user", "content": prompt}]
    }

    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers=headers,
        json=body
    )

    if not response.ok:
        raise RuntimeError(f"Groq API call failed: {response.status_code} - {response.text}")

    content = response.json()["choices"][0]["message"]["content"]

    content = content.replace("**", "")

    match_score_match = re.search(r"Match Score:\s*(\d+)", content)
    if not match_score_match:
        raise ValueError("Could not find match score.\n" + content)
    match_score = int(match_score_match.group(1))

    missing_keywords_match = re.search(r"Missing Keywords:\s*\n((?:\* .+\n?)+)", content)
    suggestions_match = re.search(r"Suggestions:\s*\n((?:[\*\d]\. .+\n?)+)", content)

    if not (missing_keywords_match and suggestions_match):
        raise ValueError("Could not find keywords or suggestions.\n" + content)

    missing_keywords_block = missing_keywords_match.group(1).strip()
    missing_keywords = [line.strip("* ").strip() for line in missing_keywords_block.splitlines()]

    suggestions_block = suggestions_match.group(1).strip()
    suggestions = [re.sub(r"^[\*\d]+\.\s*", "", line).strip() for line in suggestions_block.splitlines()]

    return {
        "score": match_score,
        "summary": f"Missing: {', '.join(missing_keywords)}",
        "recommendations": suggestions
    }