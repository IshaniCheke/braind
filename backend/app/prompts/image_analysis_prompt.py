def build_image_analysis_prompt(file_name: str) -> str:
    return f"""
You are Braind's visual reference analysis agent.

Analyze the uploaded image reference: {file_name}

Return ONLY valid JSON with this structure:

{{
  "visual_summary": "Short description of what the image shows.",
  "dominant_colors": ["color 1", "color 2", "color 3"],
  "visual_style": "Describe the design style, mood, and aesthetic.",
  "composition": "Describe layout, framing, focal points, and spacing.",
  "visible_text": ["any visible text in the image"],
  "brand_cues": ["brand cue 1", "brand cue 2"],
  "campaign_usefulness": "How this image can help guide campaign generation.",
  "recommended_usage": ["usage 1", "usage 2", "usage 3"]
}}

Rules:
- Do not use markdown.
- Do not wrap JSON in ```json.
- Be specific but concise.
- If no text is visible, return an empty visible_text array.
"""