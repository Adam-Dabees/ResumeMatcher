const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');

async function testAPI() {
  try {
    const form = new FormData();
    form.append('resume', fs.createReadStream('/Users/adamsfiles/Documents/Studies/SFWRENG/Projects/ResumeMatcher/test.tex'));
    form.append('job_description', 'Python developer with React experience');

    const response = await fetch('http://localhost:3002/api/analyze', {
      method: 'POST',
      body: form
    });

    const result = await response.json();
    console.log('API Response:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();
