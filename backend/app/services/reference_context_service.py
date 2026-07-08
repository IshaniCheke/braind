from sqlalchemy.orm import Session

from app.models.campaign_models import UploadedFileDB


def build_reference_context(
    db: Session,
    reference_file_ids: list[str],
) -> str:
    if not reference_file_ids:
        return "No uploaded reference files were provided."

    uploaded_files = (
        db.query(UploadedFileDB)
        .filter(UploadedFileDB.id.in_(reference_file_ids))
        .all()
    )

    if not uploaded_files:
        return "No matching uploaded reference files were found."

    context_sections: list[str] = []

    for index, uploaded_file in enumerate(uploaded_files, start=1):
        section_lines = [
            f"Reference {index}",
            f"File name: {uploaded_file.file_name}",
            f"File type: {uploaded_file.file_type}",
            f"Processed: {uploaded_file.processed}",
        ]

        if uploaded_file.extracted_summary:
            section_lines.append(
                f"Extracted summary: {uploaded_file.extracted_summary}"
            )

        if uploaded_file.extracted_text:
            shortened_text = uploaded_file.extracted_text[:2500]
            section_lines.append(f"Extracted text excerpt: {shortened_text}")

        if uploaded_file.visual_analysis:
            section_lines.append(
                f"Visual analysis: {uploaded_file.visual_analysis}"
            )

        context_sections.append("\n".join(section_lines))

    return "\n\n---\n\n".join(context_sections)