from fastapi import FastAPI
from app.api import auth

app = FastAPI(
    title="Lost & Found API",
    description="School Lost and Found platform API",
    version="1.0.0"
)

# Register our auth router. All routes inside it get the /auth prefix.
# e.g. POST /auth/register, POST /auth/login, GET /auth/me
app.include_router(auth.router)

# We will add more routers here as we build them:
# app.include_router(found_items.router)
# app.include_router(images.router)
# app.include_router(inquiries.router)
# app.include_router(messages.router)


@app.get("/")
def health_check():
    """Simple ping endpoint to confirm the server is running."""
    return {"status": "ok", "message": "Lost & Found API is running"}
