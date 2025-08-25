'use client';

import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState(null);
  const [jobUrl, setJobUrl] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file || (!jobUrl && !jobDescription)) {
      setError('Please provide a resume and either a job URL or paste the job description');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('resume', file);
  if (jobUrl) formData.append('job_url', jobUrl);
  if (jobDescription) formData.append('job_description', jobDescription);

      // Use environment variable or fallback to localhost for development
      // Normalize API URL to avoid malformed values like ':8000'
      const rawApi = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      let apiUrl = rawApi;
      try {
        // If someone set just ':8000', prepend current host/protocol
        if (apiUrl.startsWith(':')) {
          apiUrl = `${window.location.protocol}//${window.location.hostname}${apiUrl}`;
        }
        // If missing protocol, assume same protocol as frontend
        if (!/^https?:\/\//i.test(apiUrl)) {
          apiUrl = `${window.location.protocol}//${apiUrl}`;
        }
      } catch (_) {
        apiUrl = 'http://localhost:8000';
      }
      
      const response = await fetch(`${apiUrl}/analyze/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = errorData.detail || 'Analysis failed';
        
        // Show helpful message for scraping errors
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
    setJobUrl('');
    setResults(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Resume Matcher
          </h1>
          <p className="text-lg text-gray-600">
            Upload your resume and a job URL to see how well they match
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Resume (PDF)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label 
                  htmlFor="file-upload" 
                  className="cursor-pointer"
                >
                  {file ? (
                    <div className="text-green-600">
                      <div className="text-lg font-medium">✓ {file.name}</div>
                      <div className="text-sm">Click to change file</div>
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      <div className="text-lg font-medium">Click to upload PDF</div>
                      <div className="text-sm">or drag and drop</div>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Job URL Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Posting URL
              </label>
              <input
                type="url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="https://example.com/job-posting"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                Note: Some sites (like Indeed) block automated scraping. If scraping fails, use the text area below instead.
              </p>
            </div>

            {/* OR paste job description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OR paste job description directly
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Copy and paste the full job description here if the URL doesn't work or if the site blocks scraping..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                This is often more reliable than URL scraping, especially for Indeed, Google Jobs, etc.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-red-800">{error}</div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !file || !jobUrl}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Analyzing...' : 'Analyze Match'}
            </button>
          </form>
        </div>

        {/* Results */}
        {results && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Analysis Results</h2>
              <button
                onClick={reset}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                New Analysis
              </button>
            </div>

            {/* Match Score */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-800">Match Score</h3>
                <span className="text-2xl font-bold text-blue-600">
                  {results.score}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${results.score}%` }}
                ></div>
              </div>
            </div>

            {/* Missing Keywords */}
            {results.summary && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Missing Keywords</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <p className="text-yellow-800">{results.summary}</p>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {results.recommendations && results.recommendations.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Recommendations</h3>
                <div className="grid gap-4">
                  {results.recommendations.map((rec, index) => (
                    <div key={index} className="bg-green-50 border border-green-200 rounded-md p-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                          {index + 1}
                        </div>
                        <p className="text-green-800">{rec}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
