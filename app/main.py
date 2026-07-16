from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, found_items

app = FastAPI(
    title="Lost & Found API",
    description="School Lost and Found platform API",
    version="1.0.0"
)

# CORS middleware — must be added before any routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # During development allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow GET, POST, PATCH, DELETE etc.
    allow_headers=["*"],  # Allow Authorization header etc.
)

app.include_router(auth.router)
app.include_router(found_items.router)

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Lost & Found API is running"}