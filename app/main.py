from fastapi import FastAPI
from app.api import auth

app = FastAPI(
    title="Lost & Found API",
    description="School Lost and Found platform API",
    version="1.0.0"
)

app.include_router(auth.router)


@app.get("/")
def health_check():
    return {"status": "ok", "message": "Lost & Found API is running"}