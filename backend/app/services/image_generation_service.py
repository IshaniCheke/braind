from app.core.config import settings
from app.services.image_providers.runware_image_provider import RunwareImageProvider
from app.services.image_providers.pollinations_image_provider import PollinationsImageProvider
from app.prompts.image_prompt import build_image_prompt
from app.schemas.campaign import (
    CampaignBrief,
    CampaignStrategy,
    ImageGenerationRequest,
)
from app.services.image_providers.base import (
    GeneratedImageResult,
    ImageGenerationInput,
    ImageGenerationProvider,
)
from app.services.image_providers.gemini_image_provider import GeminiImageProvider


class ImageGenerationProviderError(Exception):
    pass


def get_image_generation_provider() -> ImageGenerationProvider:
    provider_name = settings.image_generation_provider.lower().strip()

    if provider_name == "gemini":
        return GeminiImageProvider()

    if provider_name == "pollinations":
        return PollinationsImageProvider()

    if provider_name == "runware":
        return RunwareImageProvider()

    raise ImageGenerationProviderError(
        f"Unsupported image generation provider: {settings.image_generation_provider}"
    )


def create_image_generation_inputs(
    brief: CampaignBrief,
    strategy: CampaignStrategy,
    image_requests: list[ImageGenerationRequest],
    reference_context: str,
) -> list[ImageGenerationInput]:
    return [
        ImageGenerationInput(
            prompt=build_image_prompt(
                brief=brief,
                strategy=strategy,
                image_request=image_request,
                reference_context=reference_context,
            ),
            purpose=image_request.purpose,
            aspect_ratio=image_request.aspect_ratio,
        )
        for image_request in image_requests[:3]
        if image_request.description.strip()
    ]


def generate_campaign_images(
    brief: CampaignBrief,
    strategy: CampaignStrategy,
    image_requests: list[ImageGenerationRequest],
    reference_context: str,
) -> list[GeneratedImageResult]:
    if not image_requests:
        return []

    provider = get_image_generation_provider()
    image_inputs = create_image_generation_inputs(
        brief=brief,
        strategy=strategy,
        image_requests=image_requests,
        reference_context=reference_context,
    )

    generated_images: list[GeneratedImageResult] = []

    for image_input in image_inputs:
        generated_images.append(provider.generate_image(image_input))

    return generated_images

def generate_single_image_from_prompt(
    prompt: str,
    purpose: str,
    aspect_ratio: str,
) -> GeneratedImageResult:
    provider = get_image_generation_provider()

    image_input = ImageGenerationInput(
        prompt=prompt,
        purpose=purpose,
        aspect_ratio=aspect_ratio,
    )

    return provider.generate_image(image_input)