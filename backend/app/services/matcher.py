import os
from groq import Groq  
from dotenv import load_dotenv
load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def analyze_resume_and_job_groq(resume_text: str, job_text: str) -> dict:
    prompt = f"""
Compare the following resume and job description. 
Give a match score out of 100.
List missing or weakly represented keywords/skills in the resume.

Resume:
{resume_text}

Job Description:
{job_text}

Return result as:
Match Score: XX
Missing Keywords: [keyword1, keyword2, ...]
Suggested Fixes: [suggestion1, suggestion2, ...]
"""

    response = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="llama3-8b-8192",  # Or whichever Groq model you're using
        temperature=0.2,
    )

    content = response.choices[0].message.content

    # You can optionally parse the output here
    return {
        "raw_output": content
    }