from pathlib import Path
from uuid import uuid4

from google import genai
from google.genai import types

from app.core.config import settings
from app.services.image_providers.base import (
    GeneratedImageResult,
    ImageGenerationInput,
)


class GeminiImageGenerationError(Exception):
    pass


class GeminiImageProvider:
    provider_name = "gemini"

    def __init__(self) -> None:
        self.model_name = settings.gemini_image_model
        api_key = settings.gemini_image_api_key or settings.gemini_api_key
        self.client = genai.Client(api_key=api_key)

    def generate_image(
        self,
        image_input: ImageGenerationInput,
    ) -> GeneratedImageResult:
        if not (settings.gemini_image_api_key or settings.gemini_api_key):
            raise GeminiImageGenerationError("Missing GEMINI_IMAGE_API_KEY or GEMINI_API_KEY")

        output_dir = Path(settings.generated_images_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        response = self.client.models.generate_content(
            model=self.model_name,
            contents=image_input.prompt,
            config=types.GenerateContentConfig(
                response_modalities=["TEXT", "IMAGE"],
            ),
        )

        for candidate in response.candidates or []:
            if not candidate.content:
                continue

            for part in candidate.content.parts or []:
                if part.inline_data and part.inline_data.data:
                    file_name = f"img_{uuid4().hex}.png"
                    image_path = output_dir / file_name

                    image_path.write_bytes(part.inline_data.data)

                    return GeneratedImageResult(
                        provider=self.provider_name,
                        model_name=self.model_name,
                        purpose=image_input.purpose,
                        aspect_ratio=image_input.aspect_ratio,
                        prompt=image_input.prompt,
                        image_path=str(image_path),
                        image_url=f"/generated-images/{file_name}",
                    )

        raise GeminiImageGenerationError("Gemini did not return image data")