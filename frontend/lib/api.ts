export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export async function checkBackendHealth() {
  const response = await fetch(`${API_BASE_URL}/api/health`);

  if (!response.ok) {
    throw new Error("Backend health check failed");
  }

  return response.json();
}

export type CampaignRequest = {
  brief: {
    brand_name: string;
    product_or_service: string;
    campaign_objective: string;
    target_audience: string;
    tone: string;
    campaign_theme: string;
    geographic_region?: string;
    keywords: string[];
    additional_instructions?: string;
  };
  output_formats: string[];
  reference_file_ids?: string[];
  generate_images?: boolean;
  image_requests?: {
    purpose: string;
    description: string;
    aspect_ratio: string;
  }[];
};

export async function createCampaign(payload: CampaignRequest) {
  const response = await fetch(`${API_BASE_URL}/api/campaigns`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Campaign generation failed");
  }

  return response.json();
}

export type AssetRevisionRequest = {
  campaign_id: string;
  campaign_strategy: {
    core_message: string;
    emotional_hook: string;
    memorability_device: string;
    audience_insight: string;
    tone_attributes: string[];
    visual_direction: string;
    campaign_keywords: string[];
  };
  asset_type: string;
  current_content: Record<string, unknown>;
  edit_instruction: string;
};

export async function reviseAsset(payload: AssetRevisionRequest) {
  const response = await fetch(`${API_BASE_URL}/api/campaigns/revise-asset`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Asset revision failed");
  }

  return response.json();
}

export type UploadedReferenceFile = {
  id: string;
  file_name: string;
  file_type: string;
  storage_path: string;
  file_url?: string | null;
  processed: boolean;
  extracted_summary?: string | null;
  has_extracted_text?: boolean;
  visual_analysis?: Record<string, unknown> | null;
};

export async function uploadReferenceFile(
  file: File,
  campaignId?: string
): Promise<UploadedReferenceFile> {
  const formData = new FormData();

  formData.append("file", file);

  if (campaignId) {
    formData.append("campaign_id", campaignId);
  }

  const response = await fetch(`${API_BASE_URL}/api/uploads`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("File upload failed");
  }

  return response.json();
}

export type GeneratedCampaignImage = {
  provider: string;
  model_name: string;
  purpose: string;
  aspect_ratio: string;
  prompt: string;
  image_path: string;
  image_url: string;
  storage_path?: string | null;
};

export type ImageRevisionRequest = {
  campaign_strategy: {
    core_message: string;
    emotional_hook: string;
    memorability_device: string;
    audience_insight: string;
    tone_attributes: string[];
    visual_direction: string;
    campaign_keywords: string[];
  };
  original_image: GeneratedCampaignImage;
  edit_instruction: string;
};

export async function reviseImage(payload: ImageRevisionRequest): Promise<{
  image: GeneratedCampaignImage;
}> {
  const response = await fetch(`${API_BASE_URL}/api/campaigns/revise-image`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Image revision failed");
  }

  return response.json();
}