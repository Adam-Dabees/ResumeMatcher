#!/usr/bin/env python3
"""
Test script for the LaTeX editing API endpoint
"""

import requests
import json

def test_latex_editing_api():
    """Test the LaTeX editing API endpoint"""
    
    # Sample LaTeX content
    latex_content = r"""
\documentclass{article}
\usepackage[margin=1in]{geometry}

\title{Resume}
\author{John Doe}
\date{}

\begin{document}
\maketitle

\section{Education}
Bachelor of Science in Computer Science\\
University of Example, 2020-2024

\section{Experience}
\subsection{Software Engineer Intern}
Tech Company Inc. | Summer 2023
\begin{itemize}
    \item Developed web applications using React and Node.js
    \item Collaborated with team on agile development
\end{itemize}

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

    # Create a temporary .tex file
    with open('test_resume.tex', 'w') as f:
        f.write(latex_content)

    # Test the API
    url = 'http://localhost:8000/edit-latex-resume/'
    
    with open('test_resume.tex', 'rb') as f:
        files = {'latex_file': ('test_resume.tex', f, 'text/plain')}
        data = {'job_description': job_description}
        
        print("Testing LaTeX editing API...")
        print("=" * 50)
        
        try:
            response = requests.post(url, files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                print("✓ API call successful!")
                print(f"Changes made: {result.get('changes_made', [])}")
                print(f"Skills additions: {result.get('suggestions', {}).get('skills_additions', [])}")
                
                # Save the edited LaTeX
                if result.get('edited_latex'):
                    with open('edited_resume.tex', 'w') as f:
                        f.write(result['edited_latex'])
                    print("✓ Edited LaTeX saved to 'edited_resume.tex'")
                
            else:
                print(f"✗ API call failed with status {response.status_code}")
                print(f"Error: {response.text}")
                
        except Exception as e:
            print(f"✗ Error: {e}")
        
        finally:
            # Clean up
            import os
            if os.path.exists('test_resume.tex'):
                os.remove('test_resume.tex')

if __name__ == "__main__":
    test_latex_editing_api() 