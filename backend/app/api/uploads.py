from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session
from pathlib import PurePosixPath 
from app.db.database import get_db
from app.services.file_upload_service import save_uploaded_file
from app.services.file_processing_service import process_uploaded_file

router = APIRouter(prefix="/uploads", tags=["Uploads"])


@router.post("")
def upload_reference_file(
    file: UploadFile = File(...),
    campaign_id: str | None = Form(default=None),
    db: Session = Depends(get_db),
):
    uploaded_file = save_uploaded_file(
        db=db,
        file=file,
        campaign_id=campaign_id,
    )

    processed_file = process_uploaded_file(
        db=db,
        file_id=str(uploaded_file.id),
    )

    final_file = processed_file or uploaded_file

    file_url = None

    if final_file.storage_path:
        normalized_path = final_file.storage_path.replace("\\", "/")
        file_url = f"http://127.0.0.1:8000/{normalized_path}"

    return {
        "id": str(final_file.id),
        "file_name": final_file.file_name,
        "file_type": final_file.file_type,
        "storage_path": final_file.storage_path,
        "file_url": file_url,
        "processed": final_file.processed,
        "extracted_summary": final_file.extracted_summary,
        "has_extracted_text": bool(final_file.extracted_text),
        "visual_analysis": final_file.visual_analysis,
    }

@router.post("/{file_id}/process")
def process_reference_file(
    file_id: str,
    db: Session = Depends(get_db),
):
    uploaded_file = process_uploaded_file(db=db, file_id=file_id)

    if not uploaded_file:
        return {
            "status": "not_found",
            "message": "Uploaded file not found.",
        }

    return {
        "status": "processed",
        "id": str(uploaded_file.id),
        "file_name": uploaded_file.file_name,
        "file_type": uploaded_file.file_type,
        "processed": uploaded_file.processed,
        "extracted_summary": uploaded_file.extracted_summary,
        "has_extracted_text": bool(uploaded_file.extracted_text),
        "visual_analysis": uploaded_file.visual_analysis,
    }