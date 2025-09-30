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

    // Call the actual backend API
    const backendFormData = new FormData();
    backendFormData.append('resume', resumeFile);
    
    if (jobUrl) {
      backendFormData.append('job_url', jobUrl);
    }
    if (jobDescription) {
      backendFormData.append('job_description', jobDescription);
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/analyze/`, {
      method: 'POST',
      body: backendFormData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Backend API error');
    }

    const results = await response.json();
    return NextResponse.json(results);

  } catch (error) {
    console.error('Error in analyze API:', error);
    
    // Return a more helpful error message
    if (error.message.includes('fetch')) {
      return NextResponse.json({ 
        error: 'Could not connect to backend API. Make sure the backend server is running on port 8000.' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}
