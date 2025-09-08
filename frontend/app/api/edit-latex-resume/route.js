import { NextRequest, NextResponse } from 'next/server';
import { LaTeXResumeEditor } from '../../../backend/app/services/latex_editor.js';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const latexFile = formData.get('latex_file');
    const jobUrl = formData.get('job_url');
    const jobDescription = formData.get('job_description');

    if (!latexFile) {
      return NextResponse.json({ error: 'LaTeX file is required' }, { status: 400 });
    }

    if (!jobUrl && !jobDescription) {
      return NextResponse.json({ error: 'Either job URL or job description is required' }, { status: 400 });
    }

    // Read LaTeX content
    const latexContent = await latexFile.text();

    // Get job description
    let finalJobDescription = jobDescription;
    if (!finalJobDescription && jobUrl) {
      // For now, we'll skip job scraping in the API route
      // You could implement this later or use a different approach
      return NextResponse.json({ error: 'Job URL scraping not implemented in API route' }, { status: 400 });
    }

    // Extract plain text from LaTeX for context
    const resumeText = extractPlainTextFromLatex(latexContent);

    // Initialize LaTeX editor
    const latexEditor = new LaTeXResumeEditor();

    // Edit the LaTeX resume
    const editResult = latexEditor.edit_resume_for_job(latexContent, finalJobDescription, resumeText);

    if (editResult.error) {
      return NextResponse.json({ error: editResult.error }, { status: 500 });
    }

    // For now, we'll skip the score analysis in the API route
    // You could implement this later
    const originalScore = 70; // Placeholder
    const newScore = 80; // Placeholder

    return NextResponse.json({
      original_latex: editResult.original_latex,
      edited_latex: editResult.edited_latex,
      suggestions: editResult.suggestions,
      changes_made: editResult.changes_made,
      job_description: finalJobDescription,
      original_score: originalScore,
      new_score: newScore,
      score_improvement: newScore - originalScore
    });

  } catch (error) {
    console.error('Error in edit-latex-resume API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function extractPlainTextFromLatex(latexContent) {
  // Remove LaTeX commands (starting with \)
  let text = latexContent.replace(/\\[a-zA-Z]+(\{[^}]*\})?/g, '');
  
  // Remove LaTeX environments
  text = text.replace(/\\begin\{[^}]*\}.*?\\end\{[^}]*\}/gs, '');
  
  // Remove remaining LaTeX syntax
  text = text.replace(/[{}]/g, '');
  text = text.replace(/\\[a-zA-Z]+/g, '');
  
  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}
