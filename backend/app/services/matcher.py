import os
import requests
import re
from dotenv import load_dotenv

load_dotenv()

def analyze_resume_and_job_groq(resume_text: str, job_text: str) -> dict:
    prompt = f"""
You are an expert HR professional and ATS (Applicant Tracking System) specialist. Analyze the following resume and job description to provide a comprehensive matching assessment.

IMPORTANT: Be realistic and precise with scoring. Most resumes will not be perfect matches. Use the full scale from 0-100:
- 90-100%: Exceptional match, candidate exceeds requirements
- 80-89%: Strong match, candidate meets most requirements well
- 70-79%: Good match, candidate meets core requirements with some gaps
- 60-69%: Moderate match, candidate has relevant experience but notable gaps
- 50-59%: Weak match, candidate has some relevant skills but many gaps
- 40-49%: Poor match, candidate lacks most required skills
- 0-39%: Very poor match, candidate not suitable for role

Consider these factors in your scoring:
1. Technical skills alignment (30% weight)
2. Experience level match (25% weight)
3. Industry/domain experience (20% weight)
4. Education/certification alignment (15% weight)
5. Soft skills and role-specific competencies (10% weight)

Resume:
{resume_text}

Job Posting:
{job_text}

Provide a detailed analysis in this exact format:

Match Score: [Precise number 0-100]

Missing Keywords:
* [keyword1]
* [keyword2]
* [keyword3]

Strengths:
* [strength1]
* [strength2]
* [strength3]

Suggestions:
1. [Specific actionable suggestion 1]
2. [Specific actionable suggestion 2]
3. [Specific actionable suggestion 3]

Detailed Analysis:
[2-3 sentences explaining the scoring rationale and overall assessment]
"""

    groq_api_key = os.getenv("GROQ_API_KEY")

    # Development fallback: if no GROQ API key is present, return a basic heuristic-based response
    if not groq_api_key:
        return _fallback_analysis(resume_text, job_text)

    headers = {
        "Authorization": f"Bearer {groq_api_key}",
        "Content-Type": "application/json"
    }

    body = {
        "model": "llama-3.1-70b-versatile",  # Use a more capable model
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3,  # Lower temperature for more consistent scoring
        "max_tokens": 1500
    }

    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=body,
            timeout=30
        )

        if not response.ok:
            print(f"Groq API call failed: {response.status_code} - {response.text}")
            return _fallback_analysis(resume_text, job_text)

        content = response.json()["choices"][0]["message"]["content"]
        
        # Parse the AI response
        return _parse_ai_response(content)
        
    except Exception as e:
        print(f"Error calling Groq API: {str(e)}")
        return _fallback_analysis(resume_text, job_text)


def _fallback_analysis(resume_text: str, job_text: str) -> dict:
    """
    Provide a more sophisticated fallback analysis when AI API is unavailable
    """
    import random
    import hashlib
    
    # Create a deterministic but varied score based on content
    combined_text = (resume_text + job_text).lower()
    hash_obj = hashlib.md5(combined_text.encode())
    seed = int(hash_obj.hexdigest()[:8], 16)
    random.seed(seed)
    
    # Extract keywords from job posting
    job_keywords = set()
    # Look for technical terms, skills, and important keywords
    skill_patterns = [
        r'\b[A-Z][a-z]*(?:\.[A-Z][a-z]*)*\b',  # Technologies like React.js, Node.js
        r'\b[A-Z]{2,}\b',  # Acronyms like AWS, SQL, API
        r'\b\w+(?:\+{2}|#)\b',  # Languages like C++, C#
        r'\b(?:python|javascript|java|react|angular|vue|docker|kubernetes|aws|azure|sql|mongodb|postgresql)\b',
    ]
    
    for pattern in skill_patterns:
        matches = re.findall(pattern, job_text, re.IGNORECASE)
        job_keywords.update([match.lower() for match in matches])
    
    # Remove common words
    stop_words = {'and', 'or', 'the', 'with', 'for', 'to', 'of', 'in', 'a', 'an', 'is', 'are', 'will', 'be', 'have', 'has'}
    job_keywords = {kw for kw in job_keywords if kw not in stop_words and len(kw) > 2}
    
    # Check which keywords appear in resume
    resume_lower = resume_text.lower()
    found_keywords = {kw for kw in job_keywords if kw in resume_lower}
    missing_keywords = list(job_keywords - found_keywords)[:5]
    
    # Calculate a more realistic score based on keyword overlap and content analysis
    if job_keywords:
        keyword_match_ratio = len(found_keywords) / len(job_keywords)
    else:
        keyword_match_ratio = 0.5
    
    # Add some randomness based on content characteristics
    base_score = 30 + (keyword_match_ratio * 50)  # Base range 30-80
    
    # Adjust based on resume length and structure (more content usually means more complete)
    length_factor = min(len(resume_text) / 3000, 1.0) * 10  # Up to 10 points for comprehensive resume
    
    # Add some deterministic variation based on content hash
    variation = (seed % 21) - 10  # -10 to +10 variation
    
    final_score = max(25, min(95, int(base_score + length_factor + variation)))
    
    return {
        "score": final_score,
        "summary": f"Missing: {', '.join(missing_keywords[:3])}" if missing_keywords else "Good keyword coverage detected",
        "recommendations": [
            "Incorporate more job-specific keywords and technical skills into your resume",
            "Add quantifiable achievements and metrics to demonstrate impact",
            "Ensure your experience section clearly aligns with the job requirements",
            "Consider adding relevant projects or certifications mentioned in the job posting"
        ][:3]
    }


def _parse_ai_response(content: str) -> dict:
    """Parse the structured AI response"""
    content = content.replace("**", "").strip()
    
    # Extract match score
    score_match = re.search(r"Match Score:\s*(\d+)", content, re.IGNORECASE)
    if score_match:
        match_score = int(score_match.group(1))
    else:
        # Fallback: try to find any percentage in the content
        percent_match = re.search(r"(\d+)%", content)
        match_score = int(percent_match.group(1)) if percent_match else 65
    
    # Extract missing keywords
    missing_section = re.search(r"Missing Keywords?:\s*\n((?:\* .+\n?)*)", content, re.IGNORECASE)
    missing_keywords = []
    if missing_section:
        missing_text = missing_section.group(1)
        missing_keywords = [line.strip().lstrip('* ').strip() for line in missing_text.split('\n') if line.strip()]
    
    # Extract suggestions
    suggestions_section = re.search(r"Suggestions?:\s*\n((?:\d+\. .+\n?)*)", content, re.IGNORECASE)
    suggestions = []
    if suggestions_section:
        suggestions_text = suggestions_section.group(1)
        suggestions = [re.sub(r'^\d+\.\s*', '', line.strip()) for line in suggestions_text.split('\n') if line.strip()]
    
    # Extract detailed analysis if available
    analysis_section = re.search(r"Detailed Analysis:\s*\n(.+?)(?:\n\n|\Z)", content, re.IGNORECASE | re.DOTALL)
    detailed_analysis = analysis_section.group(1).strip() if analysis_section else ""
    
    # Create summary
    if missing_keywords:
        summary = f"Missing: {', '.join(missing_keywords[:3])}"
        if detailed_analysis:
            summary += f". {detailed_analysis}"
    else:
        summary = detailed_analysis or "Good overall match with room for optimization"
    
    return {
        "score": match_score,
        "summary": summary,
        "recommendations": suggestions[:5] if suggestions else [
            "Optimize keywords to better match job requirements",
            "Add specific examples and metrics to demonstrate impact",
            "Enhance technical skills section with job-relevant technologies"
        ]
    }