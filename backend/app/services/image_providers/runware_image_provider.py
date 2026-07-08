import json
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from uuid import uuid4

from app.core.config import settings
from app.services.image_providers.base import (
    GeneratedImageResult,
    ImageGenerationInput,
)


class RunwareImageGenerationError(Exception):
    pass


class RunwareImageProvider:
    provider_name = "runware"

    def __init__(self) -> None:
        self.model_name = settings.runware_image_model

    def _dimensions_for_ratio(self, aspect_ratio: str) -> tuple[int, int]:
        dimensions = {
            "1:1": (1024, 1024),
            "16:9": (1344, 768),
            "9:16": (768, 1344),
            "4:5": (1024, 1280),
        }

        return dimensions.get(aspect_ratio, (1024, 1024))

    def _download_image(self, image_url: str, output_path: Path) -> None:
        request = Request(
            image_url,
            headers={"User-Agent": "Braind/1.0"},
        )

        with urlopen(request, timeout=120) as response:
            image_bytes = response.read()

        if not image_bytes:
            raise RunwareImageGenerationError(
                "Runware image download returned empty data"
            )

        output_path.write_bytes(image_bytes)

    def generate_image(
        self,
        image_input: ImageGenerationInput,
    ) -> GeneratedImageResult:
        if not settings.runware_api_key:
            raise RunwareImageGenerationError("Missing RUNWARE_API_KEY")

        if not settings.runware_image_model:
            raise RunwareImageGenerationError("Missing RUNWARE_IMAGE_MODEL")

        output_dir = Path(settings.generated_images_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        width, height = self._dimensions_for_ratio(image_input.aspect_ratio)
        task_uuid = str(uuid4())

        prompt = image_input.prompt.strip()

        # Keep prompt smaller to avoid provider-side validation issues.
        if len(prompt) > 3000:
            prompt = prompt[:3000]

        payload = [
            {
                "taskType": "imageInference",
                "taskUUID": task_uuid,
                "model": self.model_name,
                "positivePrompt": prompt,
                "width": width,
                "height": height,
                "numberResults": 1,
                "outputFormat": "PNG",
            }
        ]

        request = Request(
            "https://api.runware.ai/v1",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {settings.runware_api_key}",
                "Content-Type": "application/json",
                "User-Agent": "Braind/1.0",
            },
            method="POST",
        )

        try:
            with urlopen(request, timeout=180) as response:
                response_body = response.read().decode("utf-8")

            data = json.loads(response_body)

            if data.get("errors"):
                raise RunwareImageGenerationError(str(data["errors"]))

            results = data.get("data", [])

            if not results:
                raise RunwareImageGenerationError(f"Runware returned no data: {data}")

            image_url = results[0].get("imageURL")

            if not image_url:
                raise RunwareImageGenerationError(
                    f"Runware returned no imageURL: {data}"
                )

            file_name = f"img_{uuid4().hex}.png"
            image_path = output_dir / file_name

            self._download_image(image_url=image_url, output_path=image_path)

            return GeneratedImageResult(
                provider=self.provider_name,
                model_name=self.model_name,
                purpose=image_input.purpose,
                aspect_ratio=image_input.aspect_ratio,
                prompt=prompt,
                image_path=str(image_path),
                image_url=f"/generated-images/{file_name}",
            )

        except HTTPError as exc:
            try:
                error_body = exc.read().decode("utf-8")
            except Exception:
                error_body = str(exc)

            raise RunwareImageGenerationError(
                f"Runware HTTP {exc.code}: {error_body}"
            ) from exc

        except Exception as exc:
            raise RunwareImageGenerationError(str(exc)) from exc