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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-slate-800 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Resume Matcher Pro
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Advanced resume analysis powered by AI to maximize your job application success
          </p>
        </div>

        {/* Tab Interface */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-slate-200">
          <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('analysis')}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                activeTab === 'analysis'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              📊 Resume Analysis
            </button>
            <button
              onClick={() => setActiveTab('latex')}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                activeTab === 'latex'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              ✏️ LaTeX Editing
            </button>
          </div>
        </div>

        {!results ? (
          // Input Form
          <div className="bg-white rounded-2xl shadow-xl p-10 mb-8 border border-slate-200">
            <div className="grid md:grid-cols-2 gap-10">
              {/* Left Column - Upload */}
              <div className="space-y-8">
                <div>
                  <label className="block text-xl font-semibold text-slate-800 mb-4">
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {activeTab === 'analysis' ? 'Upload PDF Resume' : 'Upload LaTeX Resume'}
                    </span>
                  </label>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center transition-all hover:border-blue-400 hover:bg-blue-50/50">
                    {activeTab === 'analysis' ? (
                      <>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleFileChange}
                          className="hidden"
                          id="file-upload"
                        />
                        <label 
                          htmlFor="file-upload" 
                          className="cursor-pointer flex flex-col items-center"
                        >
                          {file ? (
                            <div className="text-green-700">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div className="text-lg font-semibold">{file.name}</div>
                              <div className="text-sm mt-2 text-slate-600 bg-slate-100 py-1 px-3 rounded-full">Click to change file</div>
                            </div>
                          ) : (
                            <div className="text-slate-600">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <div className="text-lg font-semibold">Upload PDF Resume</div>
                              <div className="text-sm mt-2">Drag & drop or click to browse</div>
                            </div>
                          )}
                        </label>
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
                        <label 
                          htmlFor="latex-file-upload" 
                          className="cursor-pointer flex flex-col items-center"
                        >
                          {latexFile ? (
                            <div className="text-green-700">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div className="text-lg font-semibold">{latexFile.name}</div>
                              <div className="text-sm mt-2 text-slate-600 bg-slate-100 py-1 px-3 rounded-full">Click to change file</div>
                            </div>
                          ) : (
                            <div className="text-slate-600">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <div className="text-lg font-semibold">Upload LaTeX Resume</div>
                              <div className="text-sm mt-2">Drag & drop or click to browse .tex files</div>
                            </div>
                          )}
                        </label>
                      </>
                    )}
                  </div>
                </div>

                {/* Job URL Input */}
                <div>
                  <label className="block text-xl font-semibold text-slate-800 mb-4">
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                    className="w-full px-5 py-4 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 bg-slate-50"
                  />
                </div>
              </div>

              {/* Right Column - Description & Submit */}
              <div className="space-y-8">
                <div>
                  <label className="block text-xl font-semibold text-slate-800 mb-4">
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                    className="w-full px-5 py-4 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 bg-slate-50"
                  />
                  <p className="text-sm text-slate-500 mt-3">
                    Pro Tip: Copy directly from the job posting for most accurate results
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                    <div className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 mt-0.5 mr-3 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <div className="text-red-800 font-medium">{error}</div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={loading || (!file && !latexFile) || (!jobUrl && !jobDescription)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
          <div className="space-y-8">
            {/* Header Section */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold text-slate-800">Analysis Results</h2>
                  <p className="text-slate-600 mt-2">Comprehensive resume assessment and improvement plan</p>
                </div>
                <button
                  onClick={reset}
                  className="bg-slate-100 text-slate-700 px-6 py-3 rounded-xl hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors font-semibold flex items-center"
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
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-slate-700 mb-4">Current Match Score</h3>
                  <div className="relative inline-block">
                    <div className="text-6xl font-bold text-blue-600">{results.score}%</div>
                    <div className="absolute -top-2 -right-4 bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">
                      NOW
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-4 mt-6">
                    <div
                      className="bg-blue-600 h-4 rounded-full transition-all duration-1000"
                      style={{ width: `${results.score}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Potential Score */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-slate-700 mb-4">Potential Score</h3>
                  <div className="relative inline-block">
                    <div className="text-6xl font-bold text-purple-600">{calculatePotentialScore(results.score)}%</div>
                    <div className="absolute -top-2 -right-6 bg-purple-100 text-purple-800 text-xs font-bold px-2 py-1 rounded-full">
                      POTENTIAL
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-4 mt-6">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-purple-600 h-4 rounded-full transition-all duration-1000"
                      style={{ width: `${calculatePotentialScore(results.score)}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-slate-500 mt-4">
                    After implementing our recommendations
                  </p>
                </div>
              </div>
            </div>
            )}

            {/* Improvement Overview - Only show for analysis mode */}
            {activeTab === 'analysis' && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-xl p-8 border border-blue-100">
              <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 663l3 3m0 0l3-3m-3 3V5m13 5a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h5" />
                </svg>
                Improvement Overview
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h4 className="font-semibold text-slate-800 mb-3">Expected Impact</h4>
                  <div className="text-3xl font-bold text-green-600">
                    +{Math.round(calculatePotentialScore(results.score) - results.score)}%
                  </div>
                  <p className="text-slate-600 text-sm mt-2">Potential score increase</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h4 className="font-semibold text-slate-800 mb-3">Key Areas</h4>
                  <div className="text-3xl font-bold text-blue-600">
                    {results.recommendations ? results.recommendations.length : 3}
                  </div>
                  <p className="text-slate-600 text-sm mt-2">For improvement</p>
                </div>
              </div>
            </div>
            )}

            {/* Recommendations - Only show for analysis mode */}
            {activeTab === 'analysis' && results.recommendations && results.recommendations.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
                <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 663l3 3m0 0l3-3m-3 3V5m13 5a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h5" />
                  </svg>
                  Actionable Recommendations
                </h3>
                <div className="grid gap-6">
                  {results.recommendations.map((rec, index) => (
                    <div key={index} className="bg-slate-50 border border-slate-200 rounded-xl p-6 hover:bg-blue-50 transition-colors">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold mr-4 mt-1">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800 mb-2">Recommendation {index + 1}</h4>
                          <p className="text-slate-700">{rec}</p>
                          <div className="flex items-center mt-4 text-sm text-slate-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
                <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  LaTeX Resume Enhanced Successfully!
                </h3>
                
                <div className="space-y-6">
                  {/* Score Improvement */}
                  {results.original_score !== undefined && results.new_score !== undefined && (
                    <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl p-6">
                      <h4 className="font-semibold text-blue-800 mb-3">Score Improvement</h4>
                      <div className="grid md:grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">{results.original_score}%</div>
                          <div className="text-sm text-blue-700">Original Score</div>
                        </div>
                        <div className="flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">{results.new_score}%</div>
                          <div className="text-sm text-green-700">New Score</div>
                        </div>
                      </div>
                      {results.score_improvement > 0 && (
                        <div className="text-center mt-3">
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                            +{results.score_improvement}% improvement!
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Changes Made */}
                  {results.changes_made && results.changes_made.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                      <h4 className="font-semibold text-green-800 mb-3">What Was Enhanced:</h4>
                      <ul className="space-y-2">
                        {results.changes_made.map((change, index) => (
                          <li key={index} className="flex items-center text-green-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                      <h4 className="font-semibold text-blue-800 mb-3">Skills Added to Existing Section:</h4>
                      <div className="flex flex-wrap gap-2">
                        {results.suggestions.skills_additions.slice(0, 6).map((skill, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-blue-600 mt-3">
                        These skills were added to your existing skills section to better match the job requirements.
                      </p>
                    </div>
                  )}

                  {/* Keywords Incorporated */}
                  {results.suggestions && results.suggestions.keywords_to_include && results.suggestions.keywords_to_include.length > 0 && (
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                      <h4 className="font-semibold text-purple-800 mb-3">Keywords Incorporated:</h4>
                      <div className="flex flex-wrap gap-2">
                        {results.suggestions.keywords_to_include.slice(0, 6).map((keyword, index) => (
                          <span key={index} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                            {keyword}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-purple-600 mt-3">
                        These job-specific keywords were strategically incorporated into your experience descriptions.
                      </p>
                    </div>
                  )}

                  {/* Download Button */}
                  <div className="text-center">
                    <button
                      onClick={downloadEditedLatex}
                      className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-4 px-8 rounded-xl hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download Enhanced LaTeX Resume
                    </button>
                    <p className="text-sm text-slate-500 mt-3">
                      Your resume has been optimized for this job posting while maintaining its original structure
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Missing Keywords */}
            {results.summary && (
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
                <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Keywords to Add
                </h3>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                  <p className="text-amber-900">{results.summary}</p>
                  <div className="flex items-center mt-4 text-sm text-amber-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Adding these keywords could improve your score significantly
                  </div>
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
              <h3 className="text-2xl font-bold text-slate-800 mb-6">Next Steps</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-slate-800 mb-2">Implement Changes</h4>
                  <p className="text-slate-600 text-sm">Update your resume with the recommended keywords and improvements</p>
                </div>
                
                <div className="text-center p-6 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-slate-800 mb-2">Re-analyze</h4>
                  <p className="text-slate-600 text-sm">Upload your improved resume to see your new match score</p>
                </div>
                
                <div className="text-center p-6 bg-green-50 rounded-xl border border-green-100">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-slate-800 mb-2">Apply Confidently</h4>
                  <p className="text-slate-600 text-sm">Submit your application with a resume optimized for this specific role</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}