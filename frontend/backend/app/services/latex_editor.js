export class LaTeXResumeEditor {
  constructor() {
    this.groq_api_key = process.env.GROQ_API_KEY;
  }

  edit_resume_for_job(latexContent, jobDescription, resumeText) {
    if (!this.groq_api_key) {
      return this._fallback_edit(latexContent, jobDescription, resumeText);
    }

    try {
      // For now, we'll use the fallback method since we don't have the Groq API setup
      // You can implement the AI-powered editing later
      return this._fallback_edit(latexContent, jobDescription, resumeText);
    } catch (error) {
      return {
        error: `Failed to edit resume: ${error.message}`,
        original_latex: latexContent
      };
    }
  }

  _fallback_edit(latexContent, jobDescription, resumeText) {
    // Simple keyword extraction and basic improvements
    const words = jobDescription.match(/[A-Za-z0-9+#\.\-]{2,}/g) || [];
    const commonSkills = [];
    
    for (const w of words) {
      const lw = w.toLowerCase();
      if (['and', 'or', 'the', 'with', 'for', 'to', 'of', 'in', 'experience', 'skills', 'required', 'preferred', 'development', 'design', 'using', 'framework', 'platform'].includes(lw)) {
        continue;
      }
      if (/^\d+$/.test(lw)) {
        continue;
      }
      if (!commonSkills.includes(w)) {
        commonSkills.push(w);
      }
      if (commonSkills.length >= 3) {
        break;
      }
    }

    let editedLatex = latexContent;

    // Add skills to existing skills section
    if (latexContent.includes('\\section{Skills}') || latexContent.includes('\\subsection{Skills}')) {
      const skillsPattern = /(\\section\{Skills\}.*?)(\\section|\\end\{document\}|$)/s;
      const skillsMatch = editedLatex.match(skillsPattern);
      if (skillsMatch) {
        let skillsSection = skillsMatch[1];
        if (skillsSection.includes('\\item')) {
          const newSkillsText = `\\item ${commonSkills.slice(0, 2).join(', ')}`;
          skillsSection = skillsSection.replace('\\end{itemize}', `${newSkillsText}\n\\end{itemize}`);
          editedLatex = editedLatex.substring(0, skillsMatch.index) + skillsSection + editedLatex.substring(skillsMatch.index + skillsMatch[1].length);
        }
      }
    }

    // Enhance existing experience descriptions
    if (editedLatex.includes('\\section{Experience}')) {
      const experiencePattern = /(\\section\{Experience\}.*?)(\\section|\\end\{document\}|$)/s;
      const expMatch = editedLatex.match(experiencePattern);
      if (expMatch) {
        let expSection = expMatch[1];
        if (expSection.includes('\\end{itemize}')) {
          const enhancement = `\\item Enhanced projects with ${commonSkills.slice(0, 1).join(', ')}`;
          expSection = expSection.replace('\\end{itemize}', `${enhancement}\n\\end{itemize}`);
          editedLatex = editedLatex.substring(0, expMatch.index) + expSection + editedLatex.substring(expMatch.index + expMatch[1].length);
        }
      }
    }

    return {
      original_latex: latexContent,
      edited_latex: editedLatex,
      suggestions: {
        skills_additions: commonSkills.slice(0, 3),
        experience_enhancements: [`Enhanced experience descriptions with ${commonSkills.slice(0, 1).join(', ')}`],
        keywords_to_include: commonSkills.slice(0, 3),
        latex_modifications: ['Enhanced existing sections', 'Added missing skills to existing skills section']
      },
      changes_made: ['Enhanced existing skills section', 'Improved experience descriptions', 'Incorporated job keywords']
    };
  }
}
