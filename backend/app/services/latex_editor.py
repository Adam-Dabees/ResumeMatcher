import re
import os
from typing import Dict, List, Tuple
from dotenv import load_dotenv
import requests

load_dotenv()

class LaTeXResumeEditor:
    def __init__(self):
        self.groq_api_key = os.getenv("GROQ_API_KEY")
    
    def edit_resume_for_job(self, latex_content: str, job_description: str, resume_text: str) -> Dict:
        """
        Edit LaTeX resume to better match job description using AI analysis
        """
        if not self.groq_api_key:
            return self._fallback_edit(latex_content, job_description, resume_text)
        
        try:
            # Get AI suggestions for resume improvements
            suggestions = self._get_ai_suggestions(latex_content, job_description, resume_text)
            
            # Apply the suggestions to create an improved LaTeX version
            edited_latex = self._apply_suggestions(latex_content, suggestions)
            
            return {
                "original_latex": latex_content,
                "edited_latex": edited_latex,
                "suggestions": suggestions,
                "changes_made": self._summarize_changes(latex_content, edited_latex)
            }
        except Exception as e:
            return {
                "error": f"Failed to edit resume: {str(e)}",
                "original_latex": latex_content
            }
    
    def _get_ai_suggestions(self, latex_content: str, job_description: str, resume_text: str) -> Dict:
        """Get AI-powered suggestions for resume improvements"""
        prompt = f"""
You are an expert resume writer and LaTeX specialist. Analyze this LaTeX resume and job description to suggest specific improvements.

IMPORTANT REQUIREMENTS:
1. Do NOT create new sections - only enhance existing content
2. Keep the SAME LENGTH - do not make the resume longer than 1 page
3. Be CONCISE - replace generic words with specific, relevant ones
4. Add only 1-2 most relevant skills/keywords per section
5. Maintain the exact same structure and sections

LaTeX Resume Content:
{latex_content}

Plain Text Resume (for context):
{resume_text}

Job Description:
{job_description}

Provide specific LaTeX editing suggestions in this exact format:

SKILLS_ADDITIONS: [list only 1-2 most relevant skills to add to existing skills section]
EXPERIENCE_ENHANCEMENTS: [list specific experience bullet points to enhance with 1-2 keywords]
KEYWORDS_TO_INCLUDE: [list only 3-4 most relevant keywords from job description]
LATEX_MODIFICATIONS: [list specific LaTeX commands/sections to modify - do NOT create new sections]

Then provide the complete improved LaTeX resume:

COMPLETE_LATEX:
[entire improved LaTeX document here]

Focus on:
1. Adding missing skills to existing skills sections only (max 1-2 per section)
2. Enhancing existing experience descriptions with 1-2 relevant keywords
3. Replacing generic words with more specific, job-relevant ones
4. Maintaining the exact same structure, sections, and overall length
5. Do NOT create new sections or major structural changes
6. Keep everything concise and to the point

The goal is to make the resume more relevant while keeping it the same length and structure.
"""

        headers = {
            "Authorization": f"Bearer {self.groq_api_key}",
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
        
        # Parse the structured response
        return self._parse_ai_suggestions(content)
    
    def _parse_ai_suggestions(self, content: str) -> Dict:
        """Parse AI suggestions into structured format"""
        suggestions = {}
        
        # Extract skills additions
        skills_match = re.search(r"SKILLS_ADDITIONS:\s*(.+)", content, re.DOTALL)
        if skills_match:
            skills_text = skills_match.group(1).strip()
            # Clean up the skills list
            skills_list = [s.strip().strip('- ').strip() for s in skills_text.split(',')]
            suggestions["skills_additions"] = [s for s in skills_list if s and len(s) < 100]  # Filter out very long items
        
        # Extract experience enhancements
        exp_match = re.search(r"EXPERIENCE_ENHANCEMENTS:\s*(.+)", content, re.DOTALL)
        if exp_match:
            exp_text = exp_match.group(1).strip()
            exp_list = [s.strip().strip('- ').strip() for s in exp_text.split(',')]
            suggestions["experience_enhancements"] = [s for s in exp_list if s and len(s) < 200]
        
        # Extract keywords to include
        keywords_match = re.search(r"KEYWORDS_TO_INCLUDE:\s*(.+)", content, re.DOTALL)
        if keywords_match:
            keywords_text = keywords_match.group(1).strip()
            keywords_list = [s.strip().strip('- ').strip() for s in keywords_text.split(',')]
            suggestions["keywords_to_include"] = [s for s in keywords_list if s and len(s) < 100]
        
        # Extract LaTeX modifications
        latex_match = re.search(r"LATEX_MODIFICATIONS:\s*(.+)", content, re.DOTALL)
        if latex_match:
            latex_text = latex_match.group(1).strip()
            latex_list = [s.strip().strip('- ').strip() for s in latex_text.split(',')]
            suggestions["latex_modifications"] = [s for s in latex_list if s and len(s) < 200]
        
        # Try to extract the complete LaTeX content
        complete_latex_match = re.search(r"COMPLETE_LATEX:\s*(\\documentclass.*?\\end\{document\})", content, re.DOTALL)
        if complete_latex_match:
            suggestions["complete_latex"] = complete_latex_match.group(1).strip()
        else:
            # Fallback: try to extract any LaTeX content
            latex_content_match = re.search(r"(\\documentclass.*?\\end\{document\})", content, re.DOTALL)
            if latex_content_match:
                suggestions["complete_latex"] = latex_content_match.group(1).strip()
        
        return suggestions
    
    def _apply_suggestions(self, latex_content: str, suggestions: Dict) -> str:
        """Apply AI suggestions to create improved LaTeX"""
        # If AI provided complete LaTeX, validate it doesn't create new sections
        if "complete_latex" in suggestions and suggestions["complete_latex"]:
            ai_latex = suggestions["complete_latex"]
            # Check if AI added new sections (we only want to enhance existing ones)
            if self._has_new_sections(latex_content, ai_latex):
                # If AI added new sections, fall back to conservative editing
                return self._apply_conservative_edits(latex_content, suggestions)
            return ai_latex
        
        # Apply conservative editing
        return self._apply_conservative_edits(latex_content, suggestions)
    
    def _has_new_sections(self, original: str, edited: str) -> bool:
        """Check if the edited LaTeX has new sections compared to original"""
        original_sections = set(re.findall(r'\\section\{([^}]+)\}', original, re.IGNORECASE))
        edited_sections = set(re.findall(r'\\section\{([^}]+)\}', edited, re.IGNORECASE))
        
        # Check if any new sections were added
        new_sections = edited_sections - original_sections
        return len(new_sections) > 0
    
    def _apply_conservative_edits(self, latex_content: str, suggestions: Dict) -> str:
        """Apply conservative edits without creating new sections"""
        edited_latex = latex_content
        
        # Add missing skills to existing skills section (don't create new ones)
        if "skills_additions" in suggestions and suggestions["skills_additions"]:
            edited_latex = self._add_skills_to_existing_section(edited_latex, suggestions["skills_additions"])
        
        # Enhance existing experience descriptions with keywords
        if "keywords_to_include" in suggestions and suggestions["keywords_to_include"]:
            edited_latex = self._enhance_experience_descriptions(edited_latex, suggestions["keywords_to_include"])
        
        # Apply LaTeX-specific modifications
        if "latex_modifications" in suggestions and suggestions["latex_modifications"]:
            edited_latex = self._apply_latex_modifications(edited_latex, suggestions["latex_modifications"])
        
        return edited_latex
    
    def _enhance_single_bullet_point(self, bullet_point: str, keywords: List[str]) -> str:
        """Enhance a single bullet point with relevant keywords while maintaining length"""
        # Extract the content after \item
        content = bullet_point.replace('\\item', '').strip()
        original_length = len(content)
        
        # Find relevant keywords that could enhance this bullet point
        relevant_keywords = []
        for keyword in keywords[:2]:  # Limit to 2 keywords to keep it concise
            if keyword.lower() in content.lower() or any(word in content.lower() for word in keyword.split()):
                continue  # Skip if already mentioned
            if len(keyword) > 3 and keyword not in relevant_keywords:
                relevant_keywords.append(keyword)
        
        if relevant_keywords:
            # Enhance the bullet point but keep it concise
            # Replace generic words with more specific, relevant ones
            enhanced_content = self._rewrite_concisely(content, relevant_keywords, original_length)
            return f"\\item {enhanced_content}"
        
        return bullet_point
    
    def _rewrite_concisely(self, content: str, keywords: List[str], target_length: int) -> str:
        """Rewrite content to be more relevant while maintaining similar length"""
        # Common generic words to replace with more specific ones
        generic_replacements = {
            'developed': 'built',
            'created': 'implemented',
            'worked on': 'developed',
            'helped with': 'contributed to',
            'did': 'executed',
            'made': 'designed',
            'used': 'leveraged',
            'basic': 'robust',
            'simple': 'efficient',
            'good': 'high-quality',
            'nice': 'professional'
        }
        
        # Start with the original content
        enhanced = content
        
        # Replace generic words with more specific ones
        for generic, specific in generic_replacements.items():
            if generic in enhanced.lower():
                enhanced = enhanced.replace(generic, specific)
                enhanced = enhanced.replace(generic.title(), specific.title())
        
        # Add 1-2 relevant keywords strategically without making it too long
        if keywords and len(enhanced) < target_length + 20:  # Allow slight increase
            # Find a good place to insert keywords
            if 'using' in enhanced.lower():
                # Add keywords after "using"
                using_pos = enhanced.lower().find('using')
                if using_pos != -1:
                    enhanced = enhanced[:using_pos + 5] + f" {', '.join(keywords[:2])}, " + enhanced[using_pos + 5:]
            elif 'with' in enhanced.lower():
                # Add keywords after "with"
                with_pos = enhanced.lower().find('with')
                if with_pos != -1:
                    enhanced = enhanced[:with_pos + 4] + f" {', '.join(keywords[:2])}, " + enhanced[with_pos + 4:]
            else:
                # Add keywords at the end if it won't make it too long
                if len(enhanced) + len(f" using {', '.join(keywords[:1])}") < target_length + 15:
                    enhanced += f" using {', '.join(keywords[:1])}"
        
        # Ensure the enhanced content isn't too much longer than original
        if len(enhanced) > target_length + 30:
            # Truncate to keep it reasonable
            enhanced = enhanced[:target_length + 25] + "..."
        
        return enhanced
    
    def _add_skills_to_existing_section(self, latex: str, new_skills: List[str]) -> str:
        """Add new skills to existing skills section without creating new sections"""
        # Look for existing skills section patterns
        skills_patterns = [
            r"(\\section\{Skills?\}.*?)(\\section|\\end\{document\}|$)",
            r"(\\subsection\{Skills?\}.*?)(\\subsection|\\section|\\end\{document\}|$)",
            r"(\\textbf\{Skills?\}.*?)(\\textbf|\\section|\\end\{document\}|$)"
        ]
        
        for pattern in skills_patterns:
            match = re.search(pattern, latex, re.DOTALL | re.IGNORECASE)
            if match:
                skills_section = match.group(1)
                # Add only 1-2 most relevant skills to keep it concise
                if "\\item" in skills_section:
                    # If using itemize environment, add as new items
                    new_skills_text = f"\\item {', '.join(new_skills[:2])}"
                    skills_section = skills_section.replace("\\end{itemize}", f"{new_skills_text}\n\\end{{itemize}}")
                else:
                    # Add to existing skills text but keep it concise
                    skills_section = skills_section.rstrip() + f", {', '.join(new_skills[:2])}"
                
                return latex[:match.start(1)] + skills_section + latex[match.end(1):]
        
        # If no skills section found, don't create one - just return original
        return latex
    
    def _enhance_experience_descriptions(self, latex: str, keywords: List[str]) -> str:
        """Enhance existing experience descriptions with relevant keywords"""
        # Look for experience sections and enhance bullet points
        experience_patterns = [
            r"(\\section\{Experience\}.*?)(\\section|\\end\{document\}|$)",
            r"(\\subsection\{Experience\}.*?)(\\subsection|\\section|\\end\{document\}|$)"
        ]
        
        for pattern in experience_patterns:
            match = re.search(pattern, latex, re.DOTALL | re.IGNORECASE)
            if match:
                exp_section = match.group(1)
                # Enhance existing bullet points with keywords
                enhanced_section = self._enhance_bullet_points(exp_section, keywords)
                return latex[:match.start(1)] + enhanced_section + latex[match.end(1):]
        
        return latex
    
    def _enhance_bullet_points(self, section: str, keywords: List[str]) -> str:
        """Enhance existing bullet points with relevant keywords"""
        # Find existing bullet points and enhance them
        if "\\item" in section:
            # Split into lines and enhance each bullet point
            lines = section.split('\n')
            enhanced_lines = []
            
            for line in lines:
                if line.strip().startswith('\\item'):
                    # Enhance this bullet point with relevant keywords
                    enhanced_line = self._enhance_single_bullet_point(line, keywords)
                    enhanced_lines.append(enhanced_line)
                else:
                    enhanced_lines.append(line)
            
            return '\n'.join(enhanced_lines)
        
        return section
    
    def _summarize_changes(self, original: str, edited: str) -> List[str]:
        """Summarize what changes were made"""
        changes = []
        
        if len(edited) > len(original):
            changes.append(f"Added {len(edited) - len(original)} characters of content")
        
        # Count added skills, sections, etc.
        if "\\section{Skills}" in edited and "\\section{Skills}" not in original:
            changes.append("Added new Skills section")
        
        return changes
    
    def _fallback_edit(self, latex_content: str, job_description: str, resume_text: str) -> Dict:
        """Fallback editing when AI is not available"""
        # Simple keyword extraction and basic improvements
        words = re.findall(r"[A-Za-z0-9+#\.\-]{2,}", job_description)
        common_skills = []
        for w in words:
            lw = w.lower()
            if lw in ("and", "or", "the", "with", "for", "to", "of", "in", "experience", "skills", "required", "preferred", "development", "design", "using", "framework", "platform"):
                continue
            if lw.isdigit():
                continue
            if lw not in common_skills:
                common_skills.append(w)
            if len(common_skills) >= 3:  # Reduced from 5 to 3
                break
        
        edited_latex = latex_content
        
        # Only add skills to existing skills section, don't create new ones
        if "\\section{Skills}" in latex_content or "\\subsection{Skills}" in latex_content:
            # Find existing skills section and add missing skills
            skills_pattern = r"(\\section\{Skills\}.*?)(\\section|\\end\{document\}|$)"
            skills_match = re.search(skills_pattern, edited_latex, re.DOTALL | re.IGNORECASE)
            if skills_match:
                skills_section = skills_match.group(1)
                if "\\item" in skills_section:
                    # Add only 1-2 most relevant skills
                    new_skills_text = f"\\item {', '.join(common_skills[:2])}"
                    skills_section = skills_section.replace("\\end{itemize}", f"{new_skills_text}\n\\end{{itemize}}")
                    edited_latex = edited_latex[:skills_match.start(1)] + skills_section + edited_latex[skills_match.end(1):]
        
        # Enhance existing experience descriptions more conservatively
        if "\\section{Experience}" in edited_latex:
            experience_pattern = r"(\\section\{Experience\}.*?)(\\section|\\end\{document\}|$)"
            exp_match = re.search(experience_pattern, edited_latex, re.DOTALL | re.IGNORECASE)
            if exp_match:
                exp_section = exp_match.group(1)
                if "\\end{itemize}" in exp_section:
                    # Add a concise enhancement to existing experience
                    enhancement = f"\\item Enhanced projects with {', '.join(common_skills[:1])}"
                    exp_section = exp_section.replace("\\end{itemize}", f"{enhancement}\n\\end{{itemize}}")
                    edited_latex = edited_latex[:exp_match.start(1)] + exp_section + edited_latex[exp_match.end(1):]
        
        return {
            "original_latex": latex_content,
            "edited_latex": edited_latex,
            "suggestions": {
                "skills_additions": common_skills[:3],
                "experience_enhancements": [f"Enhanced experience descriptions with {', '.join(common_skills[:1])}"],
                "keywords_to_include": common_skills[:3],
                "latex_modifications": ["Enhanced existing sections", "Added missing skills to existing skills section"]
            },
            "changes_made": ["Enhanced existing skills section", "Improved experience descriptions", "Incorporated job keywords"]
        } 