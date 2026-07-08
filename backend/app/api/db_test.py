from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.database import get_db

router = APIRouter(prefix="/db", tags=["Database"])


@router.get("/ping")
def ping_database(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT 1 AS connected")).mappings().first()

    return {
        "database": "connected",
        "result": dict(result) if result else None,
    }