import json
from typing import Any
from pathlib import Path

from app.prompts.image_analysis_prompt import build_image_analysis_prompt

from google import genai
from google.genai import types

from app.core.config import settings


class GeminiGenerationError(Exception):
    pass


def clean_json_text(text: str) -> str:
    cleaned = text.strip()

    if cleaned.startswith("```json"):
        cleaned = cleaned.removeprefix("```json").strip()

    if cleaned.startswith("```"):
        cleaned = cleaned.removeprefix("```").strip()

    if cleaned.endswith("```"):
        cleaned = cleaned.removesuffix("```").strip()

    return cleaned


def parse_json_response(text: str) -> dict[str, Any]:
    cleaned = clean_json_text(text)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise GeminiGenerationError(f"Gemini returned invalid JSON: {cleaned}") from exc


def generate_json_with_gemini(prompt: str) -> dict[str, Any]:
    if not settings.gemini_api_key:
        raise GeminiGenerationError("Missing GEMINI_API_KEY")

    try:
        client = genai.Client(api_key=settings.gemini_api_key)

        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
        )

        if not response.text:
            raise GeminiGenerationError("Gemini returned an empty response")

        return parse_json_response(response.text)

    except Exception as exc:
        raise GeminiGenerationError(str(exc)) from exc
    

def analyze_image_with_gemini(file_path: str, file_name: str) -> dict:
    if not settings.gemini_api_key:
        raise GeminiGenerationError("GEMINI_API_KEY is not configured.")

    client = genai.Client(api_key=settings.gemini_api_key)

    image_path = Path(file_path)

    if not image_path.exists():
        raise GeminiGenerationError("Image file does not exist.")

    image_bytes = image_path.read_bytes()
    mime_type = "image/jpeg"

    suffix = image_path.suffix.lower()

    if suffix == ".png":
        mime_type = "image/png"
    elif suffix == ".webp":
        mime_type = "image/webp"
    elif suffix in {".jpg", ".jpeg"}:
        mime_type = "image/jpeg"

    prompt = build_image_analysis_prompt(file_name)

    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=[
            types.Part.from_bytes(
                data=image_bytes,
                mime_type=mime_type,
            ),
            prompt,
        ],
    )

    text = response.text or ""

    cleaned_text = (
        text.replace("```json", "")
        .replace("```", "")
        .strip()
    )

    try:
        return json.loads(cleaned_text)
    except json.JSONDecodeError as exc:
        raise GeminiGenerationError(
            f"Gemini image analysis returned invalid JSON: {cleaned_text}"
        ) from exc