'use client';

import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState(null);
  const [latexFile, setLatexFile] = useState(null);
  const [jobUrl, setJobUrl] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('analysis'); // 'analysis' or 'latex'
  const [mockMode, setMockMode] = useState(false); // Toggle for mock responses

  // Mock data for testing UI
  const mockAnalysisResults = {
    score: 78,
    recommendations: [
      "Add more specific technical skills mentioned in the job description like React, Node.js, and PostgreSQL",
      "Include quantifiable achievements in your experience section (e.g., 'Increased user engagement by 40%')",
      "Incorporate industry-specific keywords such as 'agile development', 'CI/CD', and 'microservices'",
      "Expand your education section to include relevant certifications or ongoing learning",
      "Optimize your summary section to better align with the job requirements"
    ],
    summary: "Missing keywords: Docker, Kubernetes, AWS, TypeScript, GraphQL, Jest, Redux, MongoDB, REST APIs, Scrum. Consider adding these technologies and methodologies to better match the job requirements."
  };

  const mockLatexResults = {
    edited_latex: "\\documentclass{article}\n\\begin{document}\n% Your enhanced resume content here\n\\end{document}",
    original_score: 65,
    new_score: 85,
    score_improvement: 20,
    changes_made: [
      "Added missing technical skills: React, Node.js, TypeScript",
      "Enhanced job descriptions with quantifiable metrics",
      "Incorporated industry keywords throughout experience section",
      "Optimized summary to match job requirements",
      "Added relevant project details"
    ],
    suggestions: {
      skills_additions: ["React", "Node.js", "TypeScript", "AWS", "Docker", "MongoDB"],
      keywords_to_include: ["full-stack", "agile", "microservices", "CI/CD", "REST API", "responsive design"]
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError('');
    } else {
      setError('Please select a valid PDF file');
      setFile(null);
    }
  };

  const handleLatexFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.name.endsWith('.tex')) {
      setLatexFile(selectedFile);
      setError('');
    } else {
      setError('Please select a valid .tex file');
      setLatexFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (activeTab === 'analysis') {
      if (!file || (!jobUrl && !jobDescription)) {
        setError('Please provide a resume and either a job URL or paste the job description');
        return;
      }
    } else if (activeTab === 'latex') {
      if (!latexFile || (!jobUrl && !jobDescription)) {
        setError('Please provide a LaTeX resume and either a job URL or paste the job description');
        return;
      }
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      // Mock mode - return fake data after delay
      if (mockMode) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
        
        if (activeTab === 'analysis') {
          setResults(mockAnalysisResults);
        } else {
          setResults(mockLatexResults);
        }
        return;
      }

      // Real API call
      const formData = new FormData();
      
      if (activeTab === 'analysis') {
        formData.append('resume', file);
      } else if (activeTab === 'latex') {
        formData.append('latex_file', latexFile);
      }
      
      if (jobUrl) formData.append('job_url', jobUrl);
      if (jobDescription) formData.append('job_description', jobDescription);

      const rawApi = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      let apiUrl = rawApi;
      try {
        if (apiUrl.startsWith(':')) {
          apiUrl = `${window.location.protocol}//${window.location.hostname}${apiUrl}`;
        }
        if (!/^https?:\/\//i.test(apiUrl)) {
          apiUrl = `${window.location.protocol}//${apiUrl}`;
        }
      } catch (_) {
        apiUrl = 'http://localhost:8000';
      }
      
      let endpoint = activeTab === 'analysis' ? '/analyze/' : '/edit-latex-resume/';
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = errorData.detail || 'Analysis failed';
        
        if (errorMessage.includes('403 Forbidden') || errorMessage.includes('Access denied')) {
          errorMessage = 'This job site blocks automated requests. Please copy the job description from the page and paste it in the text area below instead of using the URL.';
        } else if (errorMessage.includes('Extracted text too short')) {
          errorMessage = 'Could not extract job description from this URL (may be JavaScript-rendered). Please copy the job description and paste it in the text area below.';
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setLatexFile(null);
    setJobUrl('');
    setJobDescription('');
    setResults(null);
    setError('');
  };

  const downloadEditedLatex = () => {
    if (results && results.edited_latex) {
      const blob = new Blob([results.edited_latex], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'edited_resume.tex';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Calculate potential score after implementing recommendations
  const calculatePotentialScore = (currentScore) => {
    return Math.min(100, currentScore + (100 - currentScore) * 0.4); // 40% improvement potential
  };

  // Handle tab switching with reset
  const handleTabSwitch = (tab) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      setResults(null);
      setError('');
      setLoading(false);
      setFile(null);
      setJobUrl('');
    }
  };

  return (
    <div className="min-h-screen bg-[#1D2128] py-8 px-4 transition-all duration-500 ease-in-out">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1"></div>
            <div className="flex-1">
              <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent animate-pulse-slow">
                Resume Matcher Pro
              </h1>
            </div>
            <div className="flex-1 flex justify-end">
              {/* Mock Mode Toggle */}
              <div className="flex items-center space-x-3 bg-[#303743] bg-opacity-50 backdrop-blur-sm rounded-lg px-4 py-2 border border-gray-600 border-opacity-30">
                <span className={`text-sm font-medium transition-colors duration-200 ${mockMode ? 'text-gray-400' : 'text-blue-400'}`}>
                  Live
                </span>
                <button
                  onClick={() => setMockMode(!mockMode)}
                  className={`relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 ${
                    mockMode ? 'bg-blue-500' : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
                      mockMode ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
                <span className={`text-sm font-medium transition-colors duration-200 ${mockMode ? 'text-blue-400' : 'text-gray-400'}`}>
                  Mock
                </span>
              </div>
            </div>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto transition-opacity duration-700 hover:text-white">
            Advanced resume analysis powered by AI to maximize your job application success
          </p>
        </div>

        {/* Tab Interface */}
        <div className="bg-[#303743] backdrop-blur-lg bg-opacity-90 rounded-2xl shadow-2xl p-6 mb-8 border border-gray-600 border-opacity-30 transition-all duration-300 hover:shadow-3xl">
          <div className="relative flex space-x-1 bg-black bg-opacity-20 p-1 rounded-xl backdrop-blur-sm">
            {/* Sliding background indicator */}
            <div 
              className={`absolute top-1 bottom-1 w-1/2 bg-gradient-to-r from-blue-500 to-purple-500 bg-opacity-80 rounded-lg transition-transform duration-200 ease-in-out backdrop-blur-sm border border-blue-400 border-opacity-30 shadow-lg ${
                activeTab === 'latex' ? 'transform translate-x-full' : 'transform translate-x-0'
              }`}
              style={{
                transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' // Bell curve easing
              }}
            ></div>
            <button
              onClick={() => handleTabSwitch('analysis')}
              className={`relative z-10 flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
                activeTab === 'analysis'
                  ? 'text-white shadow-lg'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Resume Analysis
            </button>
            <button
              onClick={() => handleTabSwitch('latex')}
              className={`relative z-10 flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
                activeTab === 'latex'
                  ? 'text-white shadow-lg'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              LaTeX Editing
            </button>
          </div>
        </div>

        {!results ? (
          // Input Form
          <div className="bg-[#303743] backdrop-blur-lg bg-opacity-90 rounded-2xl shadow-2xl p-10 mb-8 border border-gray-600 border-opacity-30 transition-all duration-500 hover:shadow-3xl animate-slide-up">
            {/* Top Row - Upload and Job Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Upload Section */}
              <div className="space-y-6">
                <div>
                  <label className="block text-xl font-semibold text-white mb-4 transition-colors duration-300">
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {activeTab === 'analysis' ? 'Upload PDF Resume' : 'Upload LaTeX Resume'}
                    </span>
                  </label>
                  <div 
                    className="border-2 border-dashed border-gray-500 border-opacity-50 rounded-xl p-8 text-center transition-all duration-300 hover:border-blue-400 hover:bg-blue-400 hover:bg-opacity-5 backdrop-blur-sm h-48 flex items-center justify-center cursor-pointer"
                    onClick={() => document.getElementById(activeTab === 'analysis' ? 'file-upload' : 'latex-file-upload').click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const files = e.dataTransfer.files;
                      if (files.length > 0) {
                        if (activeTab === 'analysis') {
                          handleFileChange({ target: { files } });
                        } else {
                          handleLatexFileChange({ target: { files } });
                        }
                      }
                    }}>
                    {activeTab === 'analysis' ? (
                      <>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleFileChange}
                          className="hidden"
                          id="file-upload"
                        />
                        <div className="flex flex-col items-center group w-full">
                          {file ? (
                            <div className="text-green-400 animate-fade-in flex flex-col items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div className="text-base font-semibold text-white">{file.name}</div>
                              <div className="text-xs mt-2 text-gray-400 bg-black bg-opacity-20 py-1 px-3 rounded-full transition-colors duration-300 hover:bg-opacity-30">Click to change file</div>
                            </div>
                          ) : (
                            <div className="text-gray-400 transition-colors duration-300 group-hover:text-white flex flex-col items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <div className="text-base font-semibold">Upload PDF Resume</div>
                              <div className="text-sm mt-2">Drag & drop or click to browse</div>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <input
                          type="file"
                          accept=".tex"
                          onChange={handleLatexFileChange}
                          className="hidden"
                          id="latex-file-upload"
                        />
                        <div className="flex flex-col items-center group w-full">
                          {latexFile ? (
                            <div className="text-green-400 animate-fade-in flex flex-col items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div className="text-base font-semibold text-white">{latexFile.name}</div>
                              <div className="text-xs mt-2 text-gray-400 bg-black bg-opacity-20 py-1 px-3 rounded-full transition-colors duration-300 hover:bg-opacity-30">Click to change file</div>
                            </div>
                          ) : (
                            <div className="text-gray-400 transition-colors duration-300 group-hover:text-white flex flex-col items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <div className="text-base font-semibold">Upload LaTeX Resume</div>
                              <div className="text-sm mt-2">Drag & drop or click to browse .tex files</div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Job Description */}
              <div className="space-y-6">
                <div>
                  <label className="block text-xl font-semibold text-white mb-4 transition-colors duration-300">
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Job Description
                    </span>
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the full job description here..."
                    rows={8}
                    className="w-full h-48 px-5 py-4 border border-gray-500 border-opacity-30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-black bg-opacity-20 backdrop-blur-sm placeholder-gray-400 transition-all duration-300 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Row - Centered Job URL and Submit Button */}
            <div className="flex flex-col items-center space-y-6 max-w-lg mx-auto">
              {/* Error Message */}
              {error && (
                <div className="w-full bg-red-500 bg-opacity-10 border border-red-400 border-opacity-30 rounded-xl p-5 backdrop-blur-sm animate-shake">
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400 mt-0.5 mr-3 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div className="text-red-300 font-medium">{error}</div>
                  </div>
                </div>
              )}

              {/* Job URL */}
              <div className="w-full">
                <label className="block text-xl font-semibold text-white mb-4 text-center transition-colors duration-300">
                  <span className="flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Job Posting URL
                  </span>
                </label>
                <input
                  type="url"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  placeholder="https://linkedin.com/jobs/view/12345"
                  className="w-full px-5 py-4 border border-gray-500 border-opacity-30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white bg-black bg-opacity-20 backdrop-blur-sm placeholder-gray-400 transition-all duration-300"
                />
                <p className="text-sm text-gray-400 mt-3 text-center transition-colors duration-300 hover:text-gray-300">
                  Pro Tip: Copy directly from the job posting for most accurate results
                </p>
              </div>

              {/* Submit Button */}
              <div className="w-full">
                <button
                  type="submit"
                  onClick={handleSubmit}
                disabled={loading || (!file && !latexFile) || (!jobUrl && !jobDescription)}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 px-6 rounded-xl hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 backdrop-blur-sm bg-opacity-80"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {activeTab === 'analysis' ? 'Analyzing Your Resume...' : 'Editing Your LaTeX Resume...'}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {activeTab === 'analysis' ? 'Analyze Match Score' : 'Edit LaTeX Resume'}
                    </div>
                  )}
                  </button>
              </div>
            </div>
          </div>
        ) : (
          // Results Dashboard
          <div className="space-y-8 animate-fade-in">
            {/* Header Section */}
            <div className="bg-[#303743] backdrop-blur-lg bg-opacity-90 rounded-2xl shadow-2xl p-8 border border-gray-600 border-opacity-30 transition-all duration-500 hover:shadow-3xl">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-white">Analysis Results</h2>
                  <p className="text-gray-300 mt-2">Comprehensive resume assessment and improvement plan</p>
                </div>
                <button
                  onClick={reset}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300 font-semibold flex items-center justify-center backdrop-blur-sm border border-blue-400 border-opacity-30 transform hover:scale-105 shadow-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  New Analysis
                </button>
              </div>
            </div>

            {/* Score Cards - Only show for analysis mode */}
            {activeTab === 'analysis' && (
              <div className="grid md:grid-cols-2 gap-8">
              {/* Current Score */}
              <div className="bg-[#303743] backdrop-blur-lg bg-opacity-90 rounded-2xl shadow-2xl p-8 border border-gray-600 border-opacity-30 transition-all duration-500 hover:shadow-3xl animate-slide-up">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-white mb-4">Current Match Score</h3>
                  <div className="relative inline-block">
                    <div className="text-6xl font-bold text-blue-400">{results.score}%</div>
                  </div>
                  <div className="w-full bg-black bg-opacity-30 rounded-full h-4 mt-6">
                    <div
                      className="bg-gradient-to-r from-blue-400 to-purple-400 h-4 rounded-full transition-all duration-1000 animate-glow"
                      style={{ width: `${results.score}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Potential Score */}
              <div className="bg-[#303743] backdrop-blur-lg bg-opacity-90 rounded-2xl shadow-2xl p-8 border border-gray-600 border-opacity-30 transition-all duration-500 hover:shadow-3xl animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-white mb-4">Potential Score</h3>
                  <div className="relative inline-block">
                    <div className="text-6xl font-bold text-purple-400">{calculatePotentialScore(results.score)}%</div>
                  </div>
                  <div className="w-full bg-black bg-opacity-30 rounded-full h-4 mt-6">
                    <div
                      className="bg-gradient-to-r from-purple-400 to-pink-400 h-4 rounded-full transition-all duration-1000 animate-glow"
                      style={{ width: `${calculatePotentialScore(results.score)}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-400 mt-4">
                    After implementing our recommendations
                  </p>
                </div>
              </div>
            </div>
            )}

            {/* Improvement Overview - Only show for analysis mode */}
            {activeTab === 'analysis' && (
            <div className="bg-[#303743] backdrop-blur-lg bg-opacity-90 rounded-2xl shadow-2xl p-8 border border-gray-600 border-opacity-30 transition-all duration-500 hover:shadow-3xl">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 663l3 3m0 0l3-3m-3 3V5m13 5a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h5" />
                </svg>
                Improvement Overview
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-500 bg-opacity-30 border border-blue-400 border-opacity-50 rounded-xl p-6 backdrop-blur-sm hover:bg-opacity-40 transition-all duration-300">
                  <h4 className="font-semibold text-white mb-3">Expected Impact</h4>
                  <div className="text-3xl font-bold text-green-300">
                    +{Math.round(calculatePotentialScore(results.score) - results.score)}%
                  </div>
                  <p className="text-gray-200 text-sm mt-2">Potential score increase</p>
                </div>
                <div className="bg-purple-500 bg-opacity-30 border border-purple-400 border-opacity-50 rounded-xl p-6 backdrop-blur-sm hover:bg-opacity-40 transition-all duration-300">
                  <h4 className="font-semibold text-white mb-3">Key Areas</h4>
                  <div className="text-3xl font-bold text-white-300">
                    {results.recommendations ? results.recommendations.length : 3}
                  </div>
                  <p className="text-gray-200 text-sm mt-2">For improvement</p>
                </div>
              </div>
            </div>
            )}

            {/* Recommendations - Only show for analysis mode */}
            {activeTab === 'analysis' && results.recommendations && results.recommendations.length > 0 && (
              <div className="bg-[#303743] backdrop-blur-lg bg-opacity-90 rounded-2xl shadow-2xl p-8 border border-gray-600 border-opacity-30 transition-all duration-500 hover:shadow-3xl">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 663l3 3m0 0l3-3m-3 3V5m13 5a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h5" />
                  </svg>
                  Actionable Recommendations
                </h3>
                <div className="grid gap-6">
                  {results.recommendations.map((rec, index) => (
                    <div key={index} className="bg-black bg-opacity-20 border border-gray-600 border-opacity-30 rounded-xl p-6 hover:bg-opacity-30 transition-all duration-300 backdrop-blur-sm">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-500 bg-opacity-80 text-white rounded-full flex items-center justify-center text-lg font-bold mr-4 mt-1 backdrop-blur-sm">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold text-white mb-2">Recommendation {index + 1}</h4>
                          <p className="text-gray-300">{rec}</p>
                          <div className="flex items-center mt-4 text-sm text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Estimated impact: +{Math.round((calculatePotentialScore(results.score) - results.score) / results.recommendations.length)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LaTeX Editing Results */}
            {activeTab === 'latex' && results.edited_latex && (
              <div className="bg-[#303743] backdrop-blur-lg bg-opacity-90 rounded-2xl shadow-2xl p-8 border border-gray-600 border-opacity-30 transition-all duration-500 hover:shadow-3xl">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  LaTeX Resume Enhanced Successfully!
                </h3>
                
                <div className="space-y-6">
                  {/* Score Improvement */}
                  {results.original_score !== undefined && results.new_score !== undefined && (
                    <div className="bg-gradient-to-r from-blue-500 from-opacity-20 to-green-500 to-opacity-20 border border-blue-400 border-opacity-30 rounded-xl p-6 backdrop-blur-sm">
                      <h4 className="font-semibold text-white mb-3">Score Improvement</h4>
                      <div className="grid md:grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-white">{results.original_score}%</div>
                          <div className="text-sm text-gray-200">Original Score</div>
                        </div>
                        <div className="flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-white">{results.new_score}%</div>
                          <div className="text-sm text-gray-200">New Score</div>
                        </div>
                      </div>
                      {results.score_improvement > 0 && (
                        <div className="text-center mt-3">
                          <span className="bg-green-400 bg-opacity-30 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm border border-green-300 border-opacity-50">
                            +{results.score_improvement}% improvement!
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Changes Made */}
                  {results.changes_made && results.changes_made.length > 0 && (
                    <div className="bg-green-500 bg-opacity-20 border border-green-400 border-opacity-30 rounded-xl p-6 backdrop-blur-sm">
                      <h4 className="font-semibold text-white mb-3">What Was Enhanced:</h4>
                      <ul className="space-y-2">
                        {results.changes_made.map((change, index) => (
                          <li key={index} className="flex items-center text-gray-200">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {change}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Skills Added */}
                  {results.suggestions && results.suggestions.skills_additions && results.suggestions.skills_additions.length > 0 && (
                    <div className="bg-blue-500 bg-opacity-20 border border-blue-400 border-opacity-30 rounded-xl p-6 backdrop-blur-sm">
                      <h4 className="font-semibold text-white mb-3">Skills Added to Existing Section:</h4>
                      <div className="flex flex-wrap gap-2">
                        {results.suggestions.skills_additions.slice(0, 6).map((skill, index) => (
                          <span key={index} className="bg-blue-400 bg-opacity-30 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm border border-blue-300 border-opacity-50">
                            {skill}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-gray-200 mt-3">
                        These skills were added to your existing skills section to better match the job requirements.
                      </p>
                    </div>
                  )}

                  {/* Keywords Incorporated */}
                  {results.suggestions && results.suggestions.keywords_to_include && results.suggestions.keywords_to_include.length > 0 && (
                    <div className="bg-purple-500 bg-opacity-20 border border-purple-400 border-opacity-30 rounded-xl p-6 backdrop-blur-sm">
                      <h4 className="font-semibold text-white mb-3">Keywords Incorporated:</h4>
                      <div className="flex flex-wrap gap-2">
                        {results.suggestions.keywords_to_include.slice(0, 6).map((keyword, index) => (
                          <span key={index} className="bg-purple-400 bg-opacity-30 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm border border-purple-300 border-opacity-50">
                            {keyword}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-gray-200 mt-3">
                        These job-specific keywords were strategically incorporated into your experience descriptions.
                      </p>
                    </div>
                  )}

                  {/* Download Button */}
                  <div className="text-center">
                    <button
                      onClick={downloadEditedLatex}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 bg-opacity-80 backdrop-blur-lg text-white py-4 px-8 rounded-xl hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 font-semibold text-lg transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 border border-gray-600 border-opacity-30"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download Enhanced LaTeX Resume
                    </button>
                    <p className="text-sm text-gray-400 mt-3">
                      Your resume has been optimized for this job posting while maintaining its original structure
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Missing Keywords */}
            {results.summary && (
              <div className="bg-[#303743] backdrop-blur-lg bg-opacity-90 rounded-2xl shadow-2xl p-8 border border-gray-600 border-opacity-30 transition-all duration-500 hover:shadow-3xl">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Keywords to Add
                </h3>
                <div className="bg-orange-600 bg-opacity-20 border border-orange-500 border-opacity-30 rounded-xl p-6 backdrop-blur-sm">
                  <p className="text-white">{results.summary}</p>
                  <div className="flex items-center mt-4 text-sm text-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Adding these keywords could improve your score significantly
                  </div>
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className="bg-[#303743] backdrop-blur-lg bg-opacity-90 rounded-2xl shadow-2xl p-8 border border-gray-600 border-opacity-30 transition-all duration-500 hover:shadow-3xl">
              <h3 className="text-2xl font-bold text-white mb-6">Next Steps</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-blue-500 bg-opacity-20 rounded-xl border border-blue-400 border-opacity-30 backdrop-blur-sm transition-all duration-300 hover:bg-opacity-30">
                  <div className="w-12 h-12 bg-blue-500 bg-opacity-80 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-white mb-2">Implement Changes</h4>
                  <p className="text-gray-300 text-sm">Update your resume with the recommended keywords and improvements</p>
                </div>
                
                <div className="text-center p-6 bg-purple-500 bg-opacity-20 rounded-xl border border-purple-400 border-opacity-30 backdrop-blur-sm transition-all duration-300 hover:bg-opacity-30">
                  <div className="w-12 h-12 bg-purple-500 bg-opacity-80 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-white mb-2">Re-analyze</h4>
                  <p className="text-gray-300 text-sm">Upload your improved resume to see your new match score</p>
                </div>
                
                <div className="text-center p-6 bg-green-500 bg-opacity-20 rounded-xl border border-green-400 border-opacity-30 backdrop-blur-sm transition-all duration-300 hover:bg-opacity-30">
                  <div className="w-12 h-12 bg-green-500 bg-opacity-80 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-white mb-2">Apply Confidently</h4>
                  <p className="text-gray-300 text-sm">Submit your application with a resume optimized for this specific role</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}