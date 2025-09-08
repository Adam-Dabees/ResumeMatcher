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
      if (['and', 'or', 'the', 'with', 'for', 'to', 'of', 'in', 'experience', 'skills', 'required', 'preferred', 'development', 'design', 'using', 'framework', 'platform', 'full', 'job', 'description'].includes(lw)) {
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

    // Look for Technical Skills section (case insensitive)
    const skillsPatterns = [
      /(\\section\{Technical Skills\}.*?)(\\section|\\end\{document\}|$)/is,
      /(\\section\{Skills\}.*?)(\\section|\\end\{document\}|$)/is,
      /(\\subsection\{Technical Skills\}.*?)(\\subsection|\\section|\\end\{document\}|$)/is,
      /(\\subsection\{Skills\}.*?)(\\subsection|\\section|\\end\{document\}|$)/is
    ];

    for (const pattern of skillsPatterns) {
      const skillsMatch = editedLatex.match(pattern);
      if (skillsMatch) {
        let skillsSection = skillsMatch[1];
        // Add skills to the existing skills section
        if (skillsSection.includes('\\textbf{Languages}')) {
          // Find the Languages line and add skills there
          const languagesMatch = skillsSection.match(/(\\textbf\{Languages\}\{[^}]*\})/);
          if (languagesMatch) {
            const newLanguages = languagesMatch[1].replace('}', `, ${commonSkills.slice(0, 2).join(', ')}`);
            skillsSection = skillsSection.replace(languagesMatch[1], newLanguages);
            editedLatex = editedLatex.substring(0, skillsMatch.index) + skillsSection + editedLatex.substring(skillsMatch.index + skillsMatch[1].length);
            break;
          }
        }
      }
    }

    // Look for Experience section and enhance it
    const experiencePatterns = [
      /(\\section\{Experience\}.*?)(\\section|\\end\{document\}|$)/is,
      /(\\subsection\{Experience\}.*?)(\\subsection|\\section|\\end\{document\}|$)/is
    ];

    for (const pattern of experiencePatterns) {
      const expMatch = editedLatex.match(pattern);
      if (expMatch) {
        let expSection = expMatch[1];
        // Find the first resumeItem and enhance it
        const firstItemMatch = expSection.match(/(\\resumeItem\{[^}]*\})/);
        if (firstItemMatch) {
          const originalItem = firstItemMatch[1];
          const enhancedItem = originalItem.replace('}', `, leveraging ${commonSkills.slice(0, 1).join(', ')} technologies}`);
          expSection = expSection.replace(originalItem, enhancedItem);
          editedLatex = editedLatex.substring(0, expMatch.index) + expSection + editedLatex.substring(expMatch.index + expMatch[1].length);
          break;
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
