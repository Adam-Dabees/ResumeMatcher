#!/usr/bin/env python3
"""
Test script for LaTeX resume editor functionality
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.latex_editor import LaTeXResumeEditor

def test_latex_editing():
    """Test the LaTeX editing functionality"""
    
    # Sample LaTeX resume
    sample_latex = r"""
\documentclass{article}
\usepackage[margin=1in]{geometry}
\usepackage{enumitem}

\title{Resume}
\author{John Doe}
\date{}

\begin{document}
\maketitle

\section{Education}
Bachelor of Science in Computer Science\\
University of Example, 2020-2024

\section{Skills}
\begin{itemize}
    \item Programming: JavaScript, HTML, CSS
    \item Frameworks: React, Node.js
    \item Tools: Git, VS Code
\end{itemize}

\section{Experience}
\subsection{Software Engineer Intern}
Tech Company Inc. | Summer 2023
\begin{itemize}
    \item Developed web applications using React and Node.js
    \item Collaborated with team on agile development
\end{itemize}

\section{Projects}
\subsection{Personal Website}
Built a responsive website using HTML, CSS, and JavaScript

\end{document}
"""

    # Sample job description
    job_description = """
    We are looking for a Full Stack Developer with experience in:
    - Python and Django framework
    - Database design and SQL
    - API development and RESTful services
    - Git version control
    - Agile development methodologies
    - Cloud platforms (AWS/Azure)
    """

    # Initialize editor
    editor = LaTeXResumeEditor()
    
    print("Testing LaTeX Resume Editor...")
    print("=" * 50)
    
    # Test editing
    try:
        result = editor.edit_resume_for_job(sample_latex, job_description, "")
        
        if "error" in result:
            print(f"Error: {result['error']}")
        else:
            print("✓ LaTeX editing successful!")
            print(f"Changes made: {result['changes_made']}")
            print(f"Skills additions: {result['suggestions'].get('skills_additions', [])}")
            print(f"Keywords to include: {result['suggestions'].get('keywords_to_include', [])}")
            
            print("\nOriginal LaTeX (first 200 chars):")
            print(result['original_latex'][:200] + "...")
            
            print("\nEdited LaTeX (first 200 chars):")
            print(result['edited_latex'][:200] + "...")
            
            # Check if skills section was added
            if "\\section{Skills}" in result['edited_latex']:
                print("\n✓ Skills section was added!")
            
    except Exception as e:
        print(f"Test failed with error: {e}")

if __name__ == "__main__":
    test_latex_editing() 