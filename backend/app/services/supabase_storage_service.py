from pathlib import Path
from uuid import uuid4

from supabase import create_client

from app.core.config import settings


class SupabaseStorageError(Exception):
    pass


def get_supabase_client():
    if not settings.supabase_url:
        raise SupabaseStorageError("SUPABASE_URL is missing")

    if not settings.supabase_key:
        raise SupabaseStorageError("SUPABASE_KEY is missing")

    return create_client(settings.supabase_url, settings.supabase_key)


def upload_generated_image_to_supabase(
    local_image_path: str,
    campaign_id: str | None = None,
) -> tuple[str, str]:
    image_path = Path(local_image_path)

    if not image_path.exists():
        raise SupabaseStorageError(f"Image does not exist: {local_image_path}")

    bucket_name = settings.supabase_generated_assets_bucket
    file_extension = image_path.suffix or ".png"

    folder = campaign_id or "uncategorized"
    storage_path = f"{folder}/{uuid4().hex}{file_extension}"

    supabase = get_supabase_client()

    with image_path.open("rb") as file:
        supabase.storage.from_(bucket_name).upload(
            path=storage_path,
            file=file,
            file_options={
                "content-type": "image/png",
                "upsert": "true",
            },
        )

    public_url = supabase.storage.from_(bucket_name).get_public_url(storage_path)

    return storage_path, public_url