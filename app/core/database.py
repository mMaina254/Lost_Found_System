from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# We include it so your routes can import get_db as a dependency.
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """
    FastAPI dependency that provides a DB session per request.
    The 'finally' block ensures the session is always closed,
    even if an error occurs mid-request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
