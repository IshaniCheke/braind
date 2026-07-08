from app.schemas.campaign import CampaignBrief, CampaignStrategy, ImageGenerationRequest


def build_image_prompt(
    brief: CampaignBrief,
    strategy: CampaignStrategy,
    image_request: ImageGenerationRequest,
    reference_context: str = "No uploaded reference files were provided.",
) -> str:
    return f"""
Create a polished campaign visual for a real marketing campaign.

CAMPAIGN BRIEF:
Brand name: {brief.brand_name}
Product or service: {brief.product_or_service}
Campaign objective: {brief.campaign_objective}
Target audience: {brief.target_audience}
Tone: {brief.tone}
Campaign theme: {brief.campaign_theme}
Geographic region: {brief.geographic_region}
Keywords: {brief.keywords}
Additional instructions: {brief.additional_instructions}

CAMPAIGN STRATEGY:
Core message: {strategy.core_message}
Emotional hook: {strategy.emotional_hook}
Memorability device: {strategy.memorability_device}
Audience insight: {strategy.audience_insight}
Tone attributes: {strategy.tone_attributes}
Visual direction: {strategy.visual_direction}
Campaign keywords: {strategy.campaign_keywords}

UPLOADED REFERENCE CONTEXT:
{reference_context}

IMAGE REQUEST:
Purpose: {image_request.purpose}
Aspect ratio: {image_request.aspect_ratio}
User visual description: {image_request.description}

IMAGE REQUIREMENTS:
- Create a professional campaign-ready visual.
- Match the brand, audience, campaign theme, and visual direction.
- Use uploaded references as inspiration for mood, palette, layout, composition, and brand cues, but do not directly copy them.
- Make the image feel like it belongs to the campaign strategy.
- Avoid tiny text, complex text, distorted logos, unreadable typography, or fake legal claims.
- If the brand is famous, avoid recreating exact logos unless explicitly safe and provided by the user.
- Prefer clean composition with a clear subject and usable marketing whitespace when appropriate.
- Do not include watermarks.
""".strip()