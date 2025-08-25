import requests, io
pdf_bytes = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT /F1 24 Tf 72 72 Td (Hello) Tj ET\nendstream\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"
files = {'resume': ('test.pdf', io.BytesIO(pdf_bytes), 'application/pdf')}
data = {'job_url': 'https://example.com'}
resp = requests.post('http://127.0.0.1:8000/analyze/', files=files, data=data, timeout=30)
print('status', resp.status_code)
print(resp.text)
