import os, sys
# allow importing from /backend
sys.path.append(os.path.join(os.path.dirname(__file__), "..", ".."))
from backend.main import app as app  # FastAPI app object