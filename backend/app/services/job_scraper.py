import requests
from bs4 import BeautifulSoup
import time
import random

def scrape_job_description(url: str) -> str:
    try:
        # Create a session to maintain cookies
        session = requests.Session()
        
        # More comprehensive headers to avoid detection
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
            'DNT': '1',
            'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"'
        }
        
        session.headers.update(headers)
        
        # Add a small random delay to appear more human-like
        time.sleep(random.uniform(1, 3))
        
        # For Indeed URLs, try alternative access methods
        original_url = url
        if 'indeed.com' in url:
            try:
                # Extract job key from the URL
                import re
                jk_match = re.search(r'vjk=([a-f0-9]+)', url)
                if jk_match:
                    job_key = jk_match.group(1)
                    # Try the direct viewjob format
                    base_domain = 'ca.indeed.com' if 'ca.indeed.com' in original_url else 'indeed.com'
                    viewjob_url = f"https://{base_domain}/viewjob?jk={job_key}"
                    url = viewjob_url
                
                base_url = f'https://{"ca.indeed.com" if "ca.indeed.com" in original_url else "indeed.com"}'
                session.get(base_url, timeout=10)
                time.sleep(random.uniform(0.5, 1.5))
            except:
                url = original_url  # Fall back to original URL
        else:
            # First, try to access the main site to establish session for other sites
            try:
                from urllib.parse import urlparse
                parsed = urlparse(url)
                base_url = f"{parsed.scheme}://{parsed.netloc}"
                session.get(base_url, timeout=10)
                time.sleep(random.uniform(0.5, 1.5))
            except:
                pass  # Continue even if base page fails
        
        response = session.get(url, timeout=20)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")
        
        # Try multiple extraction strategies for different job sites
        job_text = ""
        
        # Strategy 1: Indeed-specific selectors
        if 'indeed.com' in url:
            # Look for Indeed's job description container
            job_desc = soup.find('div', class_=lambda x: x and 'jobsearch-jobDescriptionText' in x)
            if not job_desc:
                job_desc = soup.find('div', {'id': 'jobDescriptionText'})
            if not job_desc:
                job_desc = soup.find('div', class_=lambda x: x and any(keyword in x for keyword in ['jobDescription', 'job-description', 'description']))
            
            if job_desc:
                job_text = job_desc.get_text(strip=True, separator='\n')
        
        # Strategy 2: Look for common job description containers
        if len(job_text) < 200:
            job_containers = soup.find_all(['div', 'section'], class_=lambda x: x and any(
                keyword in x.lower() for keyword in ['job', 'description', 'detail', 'content', 'requirement', 'responsibilities']
            ))
            
            if job_containers:
                for container in job_containers:
                    text = container.get_text(strip=True, separator='\n')
                    if len(text) > len(job_text):
                        job_text = text
        
        # Strategy 3: If still short, try broader extraction
        if len(job_text) < 200:
            # Look for all paragraphs, list items, and divs with substantial text
            elements = soup.find_all(["p", "li", "div", "span"])
            texts = []
            for el in elements:
                text = el.get_text(strip=True)
                if len(text) > 20 and text not in texts:  # Avoid duplicates and very short text
                    texts.append(text)
            job_text = "\n".join(texts)
        
        # Strategy 4: If still short, get all visible text
        if len(job_text) < 200:
            # Remove script and style elements
            for script in soup(["script", "style", "nav", "header", "footer"]):
                script.decompose()
            job_text = soup.get_text(strip=True, separator='\n')
        
        # Clean up the text
        lines = [line.strip() for line in job_text.split('\n') if line.strip()]
        job_text = '\n'.join(lines)

        if len(job_text) < 100:
            raise ValueError("Extracted text too short. Bad URL or JS-rendered page.")

        return job_text

    except requests.exceptions.RequestException as e:
        if "403" in str(e) or "Forbidden" in str(e):
            raise RuntimeError(f"Access denied by website (403 Forbidden). This job site blocks automated requests. Please copy and paste the job description manually.")
        else:
            raise RuntimeError(f"Failed to scrape job URL: {str(e)}")
    except Exception as e:
        raise RuntimeError(f"Failed to scrape job URL: {str(e)}")