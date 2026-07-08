from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class OutputFormat(str, Enum):
    instagram_post = "instagram_post"
    linkedin_post = "linkedin_post"
    billboard = "billboard"
    poster = "poster"
    website_hero = "website_hero"
    email = "email"


class CampaignBrief(BaseModel):
    brand_name: str = Field(..., example="Coca-Cola")
    product_or_service: str = Field(..., example="Summer limited-edition beverage")
    campaign_objective: str = Field(..., example="Increase awareness and engagement")
    target_audience: str = Field(..., example="College students")
    tone: str = Field(..., example="Energetic, youthful, optimistic")
    campaign_theme: str = Field(..., example="Shared summer moments")
    geographic_region: Optional[str] = Field(default=None, example="United States")
    keywords: List[str] = Field(default_factory=list, example=["summer", "refresh", "friends"])
    additional_instructions: Optional[str] = Field(
        default=None,
        example="Keep the campaign short, playful, and memorable.",
    )


class ImageGenerationRequest(BaseModel):
    purpose: str
    description: str
    aspect_ratio: str = "1:1"

class CampaignCreateRequest(BaseModel):
    brief: CampaignBrief
    output_formats: List[OutputFormat]
    reference_file_ids: list[str] = []
    generate_images: bool = False
    image_requests: List[ImageGenerationRequest] = Field(default_factory=list, max_length=3)


class CampaignStrategy(BaseModel):
    core_message: str
    emotional_hook: str
    memorability_device: str
    audience_insight: str
    tone_attributes: List[str]
    visual_direction: str
    campaign_keywords: List[str]


class AssetEvaluation(BaseModel):
    brand_alignment: float
    grounding: float
    compliance_safety: float
    message_clarity: float
    emotional_strength: float
    memorability: float
    format_suitability: float


class CampaignAsset(BaseModel):
    asset_type: OutputFormat
    content: dict
    evaluation: AssetEvaluation


class CampaignEvaluationSummary(BaseModel):
    average_brand_alignment: float
    average_grounding: float
    average_compliance_safety: float
    average_message_clarity: float
    average_emotional_strength: float
    average_memorability: float
    average_format_suitability: float
    overall_score: float
    manual_review_required: bool

class GenerationMetadata(BaseModel):
    generation_source: str
    model_name: str

class GeneratedCampaignImage(BaseModel):
    provider: str
    model_name: str
    purpose: str
    aspect_ratio: str
    prompt: str
    image_path: str
    image_url: str
    storage_path: str | None = None

class CampaignCreateResponse(BaseModel):
    campaign_id: str
    brief: CampaignBrief
    campaign_strategy: CampaignStrategy
    assets: List[CampaignAsset]
    evaluation_summary: CampaignEvaluationSummary
    generation_metadata: GenerationMetadata
    generated_images: List[GeneratedCampaignImage] = Field(default_factory=list)

class AssetRevisionRequest(BaseModel):
    campaign_id: str
    campaign_strategy: CampaignStrategy
    asset_type: OutputFormat
    current_content: dict
    edit_instruction: str


class AssetRevisionResponse(BaseModel):
    asset_type: OutputFormat
    content: dict
    generation_metadata: GenerationMetadata

class ImageRevisionRequest(BaseModel):
    campaign_strategy: CampaignStrategy
    original_image: GeneratedCampaignImage
    edit_instruction: str


class ImageRevisionResponse(BaseModel):
    image: GeneratedCampaignImage