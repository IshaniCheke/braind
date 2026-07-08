from pathlib import Path
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen
from uuid import uuid4

from app.core.config import settings
from app.services.image_providers.base import (
    GeneratedImageResult,
    ImageGenerationInput,
)


class PollinationsImageGenerationError(Exception):
    pass


class PollinationsImageProvider:
    provider_name = "pollinations"

    def __init__(self) -> None:
        self.model_name = settings.pollinations_image_model

    def _dimensions_for_ratio(self, aspect_ratio: str) -> tuple[int, int]:
        dimensions = {
            "1:1": (1024, 1024),
            "16:9": (1344, 768),
            "9:16": (768, 1344),
            "4:5": (1024, 1280),
        }

        return dimensions.get(aspect_ratio, (1024, 1024))

    def generate_image(
        self,
        image_input: ImageGenerationInput,
    ) -> GeneratedImageResult:
        output_dir = Path(settings.generated_images_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        width, height = self._dimensions_for_ratio(image_input.aspect_ratio)

        params = {
            "model": self.model_name,
            "width": width,
            "height": height,
            "nologo": "true",
            "private": "true",
            "seed": uuid4().int % 10_000_000,
        }

        if settings.pollinations_api_key:
            params["key"] = settings.pollinations_api_key

        encoded_prompt = quote(image_input.prompt[:3500])
        query_string = urlencode(params)
        request_url = f"https://gen.pollinations.ai/image/{encoded_prompt}?{query_string}"

        try:
            request = Request(
                request_url,
                headers={
                    "User-Agent": "Braind/1.0",
                },
            )

            with urlopen(request, timeout=120) as response:
                image_bytes = response.read()

            if not image_bytes:
                raise PollinationsImageGenerationError("Pollinations returned empty image data")

            file_name = f"img_{uuid4().hex}.png"
            image_path = output_dir / file_name
            image_path.write_bytes(image_bytes)

            return GeneratedImageResult(
                provider=self.provider_name,
                model_name=self.model_name,
                purpose=image_input.purpose,
                aspect_ratio=image_input.aspect_ratio,
                prompt=image_input.prompt,
                image_path=str(image_path),
                image_url=f"/generated-images/{file_name}",
            )

        except Exception as exc:
            raise PollinationsImageGenerationError(str(exc)) from exc