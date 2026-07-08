import json

from app.schemas.campaign import AssetRevisionRequest


def build_revision_prompt(request: AssetRevisionRequest) -> str:
    strategy_json = request.campaign_strategy.model_dump()
    current_content_json = request.current_content

    return f"""
You are a senior brand campaign editor.

Revise the selected campaign asset based on the user's edit instruction.

Selected asset type:
{request.asset_type.value}

Shared campaign strategy:
{json.dumps(strategy_json, indent=2)}

Current asset content:
{json.dumps(current_content_json, indent=2)}

User edit instruction:
{request.edit_instruction}

Your task:
- Revise only this asset.
- Preserve the shared campaign strategy.
- Keep the revised asset appropriate for the selected format.
- Keep the copy original.
- Do not copy recognizable slogans.
- Do not invent unsupported product claims.
- Follow the user's edit instruction as closely as possible.

Return ONLY valid JSON.
Return the same JSON structure as the current asset content.
Do not include markdown.
Do not include explanation.
Do not include text before or after the JSON.
"""