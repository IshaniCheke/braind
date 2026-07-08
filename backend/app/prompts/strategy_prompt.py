from app.schemas.campaign import CampaignBrief


def build_strategy_prompt(
    brief: CampaignBrief,
    reference_context: str = "No uploaded reference files were provided.",
) -> str:
    return f"""
You are a senior brand strategist.

Create a campaign strategy using the campaign brief and uploaded reference context.

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

UPLOADED REFERENCE CONTEXT:
{reference_context}

The campaign strategy must focus on:
1. A clear core message
2. A meaningful emotional hook
3. A memorable creative device
4. A useful audience insight
5. A consistent visual direction

Return ONLY valid JSON with this structure:

{{
  "core_message": "One clear central campaign message.",
  "emotional_hook": "The emotional reason this campaign should matter to the target audience.",
  "memorability_device": "A memorable phrase, structure, visual motif, or repeatable campaign device.",
  "audience_insight": "A specific insight about the target audience.",
  "tone_attributes": ["attribute 1", "attribute 2", "attribute 3"],
  "visual_direction": "Visual direction informed by the brief and uploaded references.",
  "campaign_keywords": ["keyword 1", "keyword 2", "keyword 3"]
}}

Do not include markdown.
Do not include explanation.
Do not include text before or after the JSON.

Rules:
- Use the uploaded references as grounding/inspiration, but do not copy them directly.
- Keep the strategy specific to the brand, product, audience, and campaign objective.
- Do not mention that you are using JSON.
- Do not use markdown.
"""
