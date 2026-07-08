import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.models.campaign_models import CampaignDB, UploadedFileDB


UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


def save_uploaded_file(
    db: Session,
    file: UploadFile,
    campaign_id: str | None = None,
) -> UploadedFileDB:
    original_file_name = file.filename or "uploaded_file"
    file_extension = Path(original_file_name).suffix
    safe_file_name = f"{uuid4().hex}{file_extension}"
    storage_path = UPLOAD_DIR / safe_file_name

    with storage_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    campaign_db = None

    if campaign_id:
        campaign_db = (
            db.query(CampaignDB)
            .filter(CampaignDB.campaign_id == campaign_id)
            .first()
        )

    uploaded_file = UploadedFileDB(
        campaign_id=campaign_db.id if campaign_db else None,
        file_name=original_file_name,
        file_type=file.content_type or "application/octet-stream",
        storage_path=str(storage_path),
        processed=False,
    )

    db.add(uploaded_file)
    db.commit()
    db.refresh(uploaded_file)

    return uploaded_file