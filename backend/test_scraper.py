#!/usr/bin/env python3
"""
Test script for job scraper with the Indeed URL
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.job_scraper import scrape_job_description

def test_indeed_scraper():
    url = "https://ca.indeed.com/q-retail-jobs-heartland-l-mississauga,-on-jobs.html?vjk=f6e03a3893ea6a8e&advn=1467272641812836"
    
    try:
        result = scrape_job_description(url)
        print(f"Success! Extracted {len(result)} characters")
        print("\nFirst 500 characters:")
        print(result[:500])
        print("\n...")
        print(f"\nTotal length: {len(result)} characters")
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    test_indeed_scraper()
