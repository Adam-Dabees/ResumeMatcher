import { NextRequest, NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const resumeFile = formData.get('resume');
    const jobUrl = formData.get('job_url');
    const jobDescription = formData.get('job_description');

    if (!resumeFile) {
      return NextResponse.json({ error: 'Resume file is required' }, { status: 400 });
    }

    if (!jobUrl && !jobDescription) {
      return NextResponse.json({ error: 'Either job URL or job description is required' }, { status: 400 });
    }

    // For now, return mock analysis results
    // You can implement real PDF parsing and analysis later
    const mockResults = {
      summary: "Missing keywords: Docker, Kubernetes, AWS, TypeScript, GraphQL, Jest, Redux, MongoDB, REST APIs, Scrum. Consider adding these technologies and methodologies to better match the job requirements.",
      score: 78,
      recommendations: [
        "Add more specific technical skills mentioned in the job description like React, Node.js, and PostgreSQL",
        "Include quantifiable achievements in your experience section (e.g., 'Increased user engagement by 40%')",
        "Incorporate industry-specific keywords such as 'agile development', 'CI/CD', and 'microservices'",
        "Expand your education section to include relevant certifications or ongoing learning",
        "Optimize your summary section to better align with the job requirements"
      ]
    };

    return NextResponse.json(mockResults);

  } catch (error) {
    console.error('Error in analyze API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
