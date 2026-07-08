from statistics import mean
from uuid import uuid4

from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.prompts.asset_prompts import build_asset_prompt
from app.prompts.revision_prompt import build_revision_prompt
from app.prompts.strategy_prompt import build_strategy_prompt
from app.schemas.campaign import (
    AssetEvaluation,
    AssetRevisionRequest,
    AssetRevisionResponse,
    CampaignAsset,
    CampaignCreateRequest,
    CampaignCreateResponse,
    CampaignEvaluationSummary,
    CampaignStrategy,
    GeneratedCampaignImage,
    GenerationMetadata,
    OutputFormat,
    ImageRevisionRequest,
    ImageRevisionResponse,
    ImageGenerationRequest,
)
from app.services.ai_service import GeminiGenerationError, generate_json_with_gemini
from app.services.image_generation_service import (
    generate_campaign_images,
    generate_single_image_from_prompt,
)
from app.services.reference_context_service import build_reference_context
from app.services.supabase_storage_service import upload_generated_image_to_supabase


def create_mock_strategy(request: CampaignCreateRequest) -> CampaignStrategy:
    brief = request.brief

    return CampaignStrategy(
        core_message=f"{brief.product_or_service} helps {brief.target_audience} connect with {brief.campaign_theme}.",
        emotional_hook="A sense of connection, excitement, and memorable shared experience.",
        memorability_device="Short rhythmic phrasing with a clear repeated idea.",
        audience_insight=f"{brief.target_audience} respond well to campaigns that feel personal, useful, and easy to remember.",
        tone_attributes=[tone.strip() for tone in brief.tone.split(",")],
        visual_direction="Clean, modern, emotionally engaging, and campaign-focused.",
        campaign_keywords=brief.keywords or [brief.campaign_theme, brief.product_or_service],
    )


def create_gemini_strategy(
    request: CampaignCreateRequest,
    reference_context: str,
) -> CampaignStrategy:
    prompt = build_strategy_prompt(
        brief=request.brief,
        reference_context=reference_context,
    )

    data = generate_json_with_gemini(prompt)
    return CampaignStrategy(**data)


def create_strategy(
    request: CampaignCreateRequest,
    reference_context: str,
) -> CampaignStrategy:
    if not settings.use_gemini_generation:
        return create_mock_strategy(request)

    try:
        return create_gemini_strategy(
            request=request,
            reference_context=reference_context,
        )
    except (GeminiGenerationError, ValidationError) as exc:
        print(f"[Braind] Gemini strategy generation failed. Using fallback. Reason: {exc}")
        return create_mock_strategy(request)


def create_mock_evaluation(output_format: OutputFormat) -> AssetEvaluation:
    base_scores = {
        OutputFormat.instagram_post: {
            "brand_alignment": 0.91,
            "grounding": 0.86,
            "compliance_safety": 0.94,
            "message_clarity": 0.9,
            "emotional_strength": 0.88,
            "memorability": 0.87,
            "format_suitability": 0.92,
        },
        OutputFormat.linkedin_post: {
            "brand_alignment": 0.88,
            "grounding": 0.87,
            "compliance_safety": 0.95,
            "message_clarity": 0.89,
            "emotional_strength": 0.82,
            "memorability": 0.8,
            "format_suitability": 0.9,
        },
        OutputFormat.billboard: {
            "brand_alignment": 0.9,
            "grounding": 0.84,
            "compliance_safety": 0.96,
            "message_clarity": 0.94,
            "emotional_strength": 0.86,
            "memorability": 0.92,
            "format_suitability": 0.95,
        },
        OutputFormat.poster: {
            "brand_alignment": 0.89,
            "grounding": 0.85,
            "compliance_safety": 0.93,
            "message_clarity": 0.88,
            "emotional_strength": 0.87,
            "memorability": 0.86,
            "format_suitability": 0.91,
        },
        OutputFormat.website_hero: {
            "brand_alignment": 0.92,
            "grounding": 0.88,
            "compliance_safety": 0.95,
            "message_clarity": 0.91,
            "emotional_strength": 0.85,
            "memorability": 0.84,
            "format_suitability": 0.93,
        },
        OutputFormat.email: {
            "brand_alignment": 0.87,
            "grounding": 0.89,
            "compliance_safety": 0.94,
            "message_clarity": 0.9,
            "emotional_strength": 0.83,
            "memorability": 0.79,
            "format_suitability": 0.9,
        },
    }

    return AssetEvaluation(**base_scores[output_format])


def create_mock_content(
    output_format: OutputFormat,
    strategy: CampaignStrategy,
) -> dict:
    if output_format == OutputFormat.instagram_post:
        return {
            "caption": f"{strategy.core_message} Make every moment worth sharing.",
            "cta": "Share your moment.",
            "hashtags": ["#BraindCampaign", "#BrandStory"],
        }

    if output_format == OutputFormat.linkedin_post:
        return {
            "post": f"{strategy.core_message} This campaign is built around clarity, emotion, and consistency across every channel.",
            "cta": "Explore the campaign.",
            "hashtags": ["#BraindCampaign", "#BrandStory"],
        }

    if output_format == OutputFormat.billboard:
        return {
            "headline": "Make It Memorable.",
            "support_copy": strategy.core_message,
            "visual_direction": strategy.visual_direction,
        }

    if output_format == OutputFormat.poster:
        return {
            "headline": "A Campaign Built to Stay With You.",
            "body_copy": strategy.core_message,
            "cta": "Discover more.",
            "visual_direction": strategy.visual_direction,
        }

    if output_format == OutputFormat.website_hero:
        return {
            "headline": "Create Campaigns That Feel On-Brand.",
            "subheadline": strategy.core_message,
            "cta": "Start Creating",
            "visual_direction": strategy.visual_direction,
        }

    if output_format == OutputFormat.email:
        return {
            "subject_line": "Your next campaign idea is ready",
            "preview_text": "A clearer way to turn brand strategy into campaign assets.",
            "body": f"Hi there,\n\n{strategy.core_message}\n\nThis campaign direction keeps the message clear, emotional, and memorable.\n\nBest,\nBraind",
            "cta": "Start Creating",
        }

    return {"text": strategy.core_message}


def create_gemini_content(
    request: CampaignCreateRequest,
    output_format: OutputFormat,
    strategy: CampaignStrategy,
    reference_context: str,
) -> dict:
    prompt = build_asset_prompt(
        brief=request.brief,
        strategy=strategy,
        output_format=output_format,
        reference_context=reference_context,
    )

    return generate_json_with_gemini(prompt)


def create_asset(
    request: CampaignCreateRequest,
    output_format: OutputFormat,
    strategy: CampaignStrategy,
    reference_context: str,
) -> CampaignAsset:
    content = None

    if settings.use_gemini_generation:
        try:
            content = create_gemini_content(
                request=request,
                output_format=output_format,
                strategy=strategy,
                reference_context=reference_context,
            )
        except GeminiGenerationError as exc:
            print(
                f"[Braind] Gemini asset generation failed for {output_format.value}. "
                f"Using fallback. Reason: {exc}"
            )

    if content is None:
        content = create_mock_content(output_format, strategy)

    return CampaignAsset(
        asset_type=output_format,
        content=content,
        evaluation=create_mock_evaluation(output_format),
    )


def create_evaluation_summary(assets: list[CampaignAsset]) -> CampaignEvaluationSummary:
    evaluations = [asset.evaluation for asset in assets]

    average_brand_alignment = mean(
        evaluation.brand_alignment for evaluation in evaluations
    )
    average_grounding = mean(evaluation.grounding for evaluation in evaluations)
    average_compliance_safety = mean(
        evaluation.compliance_safety for evaluation in evaluations
    )
    average_message_clarity = mean(
        evaluation.message_clarity for evaluation in evaluations
    )
    average_emotional_strength = mean(
        evaluation.emotional_strength for evaluation in evaluations
    )
    average_memorability = mean(evaluation.memorability for evaluation in evaluations)
    average_format_suitability = mean(
        evaluation.format_suitability for evaluation in evaluations
    )

    overall_score = mean(
        [
            average_brand_alignment,
            average_grounding,
            average_compliance_safety,
            average_message_clarity,
            average_emotional_strength,
            average_memorability,
            average_format_suitability,
        ]
    )

    manual_review_required = (
        overall_score < 0.8
        or average_grounding < 0.8
        or average_compliance_safety < 0.85
    )

    return CampaignEvaluationSummary(
        average_brand_alignment=round(average_brand_alignment, 2),
        average_grounding=round(average_grounding, 2),
        average_compliance_safety=round(average_compliance_safety, 2),
        average_message_clarity=round(average_message_clarity, 2),
        average_emotional_strength=round(average_emotional_strength, 2),
        average_memorability=round(average_memorability, 2),
        average_format_suitability=round(average_format_suitability, 2),
        overall_score=round(overall_score, 2),
        manual_review_required=manual_review_required,
    )


def create_campaign(
    request: CampaignCreateRequest,
    db: Session | None = None,
) -> CampaignCreateResponse:
    reference_context = "No uploaded reference files were provided."

    if db and request.reference_file_ids:
        reference_context = build_reference_context(
            db=db,
            reference_file_ids=request.reference_file_ids,
        )

    strategy = create_strategy(
        request=request,
        reference_context=reference_context,
    )

    assets = [
        create_asset(
            request=request,
            output_format=output_format,
            strategy=strategy,
            reference_context=reference_context,
        )
        for output_format in request.output_formats
    ]

    evaluation_summary = create_evaluation_summary(assets)

    generated_images: list[GeneratedCampaignImage] = []

    if request.generate_images and request.image_requests:
        try:
            image_results = generate_campaign_images(
                brief=request.brief,
                strategy=strategy,
                image_requests=request.image_requests,
                reference_context=reference_context,
            )

            generated_images = []

            for image in image_results:
                image_url = image.image_url
                storage_path = None

                try:
                    storage_path, image_url = upload_generated_image_to_supabase(
                        local_image_path=image.image_path,
                        campaign_id=None,
                    )
                except Exception as exc:
                    print(
                        f"[Braind] Supabase image upload failed. Using local image URL. Reason: {exc}"
                    )

                generated_images.append(
                    GeneratedCampaignImage(
                        provider=image.provider,
                        model_name=image.model_name,
                        purpose=image.purpose,
                        aspect_ratio=image.aspect_ratio,
                        prompt=image.prompt,
                        image_path=image.image_path,
                        image_url=image_url,
                        storage_path=storage_path,
                    )
                )
        except Exception as exc:
            print(
                f"[Braind] Image generation failed. Continuing without images. Reason: {exc}"
            )

    return CampaignCreateResponse(
        campaign_id=f"cmp_{uuid4().hex[:8]}",
        brief=request.brief,
        campaign_strategy=strategy,
        assets=assets,
        evaluation_summary=evaluation_summary,
        generation_metadata=GenerationMetadata(
            generation_source="Gemini" if settings.use_gemini_generation else "Mock",
            model_name=settings.gemini_model
            if settings.use_gemini_generation
            else "mock-generator",
        ),
        generated_images=generated_images,
    )


def revise_asset(request: AssetRevisionRequest) -> AssetRevisionResponse:
    revised_content = None

    if settings.use_gemini_generation:
        try:
            prompt = build_revision_prompt(request)
            revised_content = generate_json_with_gemini(prompt)
        except GeminiGenerationError as exc:
            print(
                f"[Braind] Gemini asset revision failed for {request.asset_type.value}. "
                f"Using original content. Reason: {exc}"
            )

    if revised_content is None:
        revised_content = request.current_content

    return AssetRevisionResponse(
        asset_type=request.asset_type,
        content=revised_content,
        generation_metadata=GenerationMetadata(
            generation_source="Gemini" if settings.use_gemini_generation else "Mock",
            model_name=settings.gemini_model
            if settings.use_gemini_generation
            else "mock-generator",
        ),
    )

def revise_image(request: ImageRevisionRequest) -> ImageRevisionResponse:
    revised_image_prompt = (
        f"{request.original_image.prompt}\n\n"
        f"REVISION INSTRUCTION:\n"
        f"{request.edit_instruction}\n\n"
        f"Regenerate the campaign visual by applying the revision instruction. "
        f"Keep the same campaign context, purpose, and aspect ratio unless the user explicitly asks to change them."
    )

    image_result = generate_single_image_from_prompt(
        prompt=revised_image_prompt,
        purpose=request.original_image.purpose,
        aspect_ratio=request.original_image.aspect_ratio,
    )

    image_url = image_result.image_url
    storage_path = None

    try:
        storage_path, image_url = upload_generated_image_to_supabase(
            local_image_path=image_result.image_path,
            campaign_id=None,
        )
    except Exception as exc:
        print(
            f"[Braind] Supabase revised image upload failed. Using local image URL. Reason: {exc}"
        )

    return ImageRevisionResponse(
        image=GeneratedCampaignImage(
            provider=image_result.provider,
            model_name=image_result.model_name,
            purpose=image_result.purpose,
            aspect_ratio=image_result.aspect_ratio,
            prompt=image_result.prompt,
            image_path=image_result.image_path,
            image_url=image_url,
            storage_path=storage_path,
        )
    )