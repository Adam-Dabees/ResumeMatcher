# Job Site Compatibility and Troubleshooting

## Supported Job Sites

The scraper works best with:
- ✅ **LinkedIn Jobs** - Usually works well
- ✅ **Glassdoor** - Often accessible  
- ✅ **Monster.com** - Generally scrapable
- ✅ **CareerBuilder** - Usually works
- ✅ **ZipRecruiter** - Often accessible
- ✅ **Company career pages** - Usually work well

## Limited Support / Manual Copy Required

- ⚠️ **Indeed** - Has strong bot protection, often requires manual copy/paste
- ⚠️ **Google Jobs** - JavaScript-heavy, may require manual copy
- ⚠️ **Facebook Jobs** - Requires login, manual copy needed

## When Scraping Fails

If you see errors like:
- "403 Forbidden" or "Access denied"
- "Extracted text too short" 
- "JS-rendered page"

**Solution**: Copy the job description manually:
1. Open the job posting in your browser
2. Select and copy the full job description text
3. Paste it into the "Or paste job description" textarea in the app
4. Submit without filling the URL field

## Tips for Better Scraping

1. **Use direct job posting URLs** rather than search result URLs
2. **Try the company's career page** instead of job boards when possible
3. **Look for "Print" or "Share" versions** of job postings (often cleaner HTML)
4. **LinkedIn job URLs** typically work: `https://linkedin.com/jobs/view/[job-id]`

## Manual Copy Instructions

For Indeed or other blocked sites:
1. Go to the job posting page
2. Scroll to the job description section
3. Select all the text (Ctrl+A in the description area)
4. Copy (Ctrl+C)
5. Paste into the Resume Matcher textarea
6. Click "Analyze Match"

The analysis will work exactly the same whether scraped or pasted manually.
