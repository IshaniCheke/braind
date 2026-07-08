from dataclasses import dataclass
from typing import Protocol


@dataclass
class ImageGenerationInput:
    prompt: str
    purpose: str
    aspect_ratio: str


@dataclass
class GeneratedImageResult:
    provider: str
    model_name: str
    purpose: str
    aspect_ratio: str
    prompt: str
    image_path: str
    image_url: str


class ImageGenerationProvider(Protocol):
    provider_name: str
    model_name: str

    def generate_image(
        self,
        image_input: ImageGenerationInput,
    ) -> GeneratedImageResult:
        ...