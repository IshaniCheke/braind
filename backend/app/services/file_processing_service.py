from pathlib import Path

from pypdf import PdfReader
from sqlalchemy.orm import Session

from app.models.campaign_models import UploadedFileDB
from app.services.ai_service import GeminiGenerationError, analyze_image_with_gemini


SUPPORTED_TEXT_TYPES = {
    "text/plain",
    "text/markdown",
}


def extract_text_from_pdf(file_path: Path) -> str:
    reader = PdfReader(str(file_path))
    pages_text: list[str] = []

    for page_number, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""

        if text.strip():
            pages_text.append(f"\n\n--- Page {page_number} ---\n{text.strip()}")

    return "\n".join(pages_text).strip()


def extract_text_from_text_file(file_path: Path) -> str:
    return file_path.read_text(encoding="utf-8", errors="ignore").strip()


def build_basic_summary(extracted_text: str) -> str:
    if not extracted_text:
        return "No readable text could be extracted from this file."

    shortened = extracted_text.replace("\n", " ").strip()

    if len(shortened) <= 500:
        return shortened

    return shortened[:500] + "..."


def process_uploaded_file(
    db: Session,
    file_id: str,
) -> UploadedFileDB | None:
    uploaded_file = (
        db.query(UploadedFileDB)
        .filter(UploadedFileDB.id == file_id)
        .first()
    )

    if not uploaded_file:
        return None

    if not uploaded_file.storage_path:
        uploaded_file.extracted_text = ""
        uploaded_file.extracted_summary = "No file path found for this upload."
        uploaded_file.processed = True
        db.commit()
        db.refresh(uploaded_file)
        return uploaded_file

    file_path = Path(uploaded_file.storage_path)

    if not file_path.exists():
        uploaded_file.extracted_text = ""
        uploaded_file.extracted_summary = "Uploaded file was not found in local storage."
        uploaded_file.processed = True
        db.commit()
        db.refresh(uploaded_file)
        return uploaded_file

    extracted_text = ""

    if uploaded_file.file_type == "application/pdf":
        extracted_text = extract_text_from_pdf(file_path)
    elif uploaded_file.file_type in SUPPORTED_TEXT_TYPES or file_path.suffix.lower() in {
        ".txt",
        ".md",
    }:
        extracted_text = extract_text_from_text_file(file_path)
    elif uploaded_file.file_type.startswith("image/"):
        extracted_text = ""

        try:
            uploaded_file.visual_analysis = analyze_image_with_gemini(
                file_path=str(file_path),
                file_name=uploaded_file.file_name,
            )
        except GeminiGenerationError as error:
            uploaded_file.visual_analysis = {
                "status": "analysis_failed",
                "message": str(error),
            }
    else:
        extracted_text = ""

    uploaded_file.extracted_text = extracted_text
    if uploaded_file.file_type.startswith("image/") and uploaded_file.visual_analysis:
        uploaded_file.extracted_summary = uploaded_file.visual_analysis.get(
            "visual_summary",
            "Image analyzed successfully.",
        )
    else:
        uploaded_file.extracted_summary = build_basic_summary(extracted_text)
    uploaded_file.processed = True

    db.commit()
    db.refresh(uploaded_file)

    return uploaded_file