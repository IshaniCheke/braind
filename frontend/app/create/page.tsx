"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  API_BASE_URL,
  checkBackendHealth,
  createCampaign,
  reviseAsset,
  reviseImage,
  uploadReferenceFile,
  type GeneratedCampaignImage,
  type UploadedReferenceFile,
} from "@/lib/api";

const outputFormats = [
  {
    id: "instagram_post",
    label: "Instagram Post",
    description: "Caption, CTA, and hashtags.",
  },
  {
    id: "linkedin_post",
    label: "LinkedIn Post",
    description: "Professional campaign post.",
  },
  {
    id: "billboard",
    label: "Billboard",
    description: "Short headline and support copy.",
  },
  {
    id: "poster",
    label: "Poster",
    description: "Headline, body copy, and CTA.",
  },
  {
    id: "website_hero",
    label: "Website Hero",
    description: "Headline, subheadline, and CTA.",
  },
  {
    id: "email",
    label: "Email",
    description: "Subject, preview, and body.",
  },
];

const sampleReferenceTypes = [
  "Brand guideline PDF",
  "Product brochure",
  "Previous campaign",
  "Mood board",
  "Website screenshot",
  "Compliance notes",
];

type AssetEvaluation = {
  brand_alignment: number;
  grounding: number;
  compliance_safety: number;
  message_clarity: number;
  emotional_strength: number;
  memorability: number;
  format_suitability: number;
};

type GeneratedCampaign = {
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
  assets: {
    asset_type: string;
    content: Record<string, unknown>;
    evaluation: AssetEvaluation;
  }[];
  evaluation_summary: {
    average_brand_alignment: number;
    average_grounding: number;
    average_compliance_safety: number;
    average_message_clarity: number;
    average_emotional_strength: number;
    average_memorability: number;
    average_format_suitability: number;
    overall_score: number;
    manual_review_required: boolean;
  };
  generation_metadata: {
    generation_source: string;
    model_name: string;
  };
  generated_images?: GeneratedCampaignImage[];
};

type ImageRequest = {
  purpose: string;
  description: string;
  aspect_ratio: string;
};

function formatScore(score: number) {
  return `${Math.round(score * 100)}%`;
}

function formatLabel(label: string) {
  return label.replaceAll("_", " ");
}

const getGeneratedImageUrl = (imageUrl: string) => {
  if (imageUrl.startsWith("http")) {
    return imageUrl;
  }

  return `${API_BASE_URL}${imageUrl}`;
};

export default function CreateCampaignPage() {
  const [backendStatus, setBackendStatus] = useState<
    "checking" | "connected" | "offline"
  >("checking");

  const [selectedFormats, setSelectedFormats] = useState<string[]>([
    "instagram_post",
    "billboard",
    "website_hero",
  ]);

  const [generateImages, setGenerateImages] = useState(false);
  const [imageCount, setImageCount] = useState(1);
  const [imageRequests, setImageRequests] = useState<ImageRequest[]>([
    {
      purpose: "Instagram campaign visual",
      description:
        "Summer beach vibes with a chilled dripping Coca-Cola bottle in the foreground.",
      aspect_ratio: "1:1",
    },
  ]);


  const [formData, setFormData] = useState({
    brand_name: "Coca-Cola",
    product_or_service: "Summer limited-edition beverage",
    campaign_objective: "Increase awareness and engagement",
    target_audience: "College students",
    tone: "Energetic, youthful, optimistic",
    campaign_theme: "Shared summer moments",
    geographic_region: "United States",
    keywords: "summer, refresh, friends",
    additional_instructions: "Keep the campaign short, playful, and memorable.",
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [generatedCampaign, setGeneratedCampaign] =
    useState<GeneratedCampaign | null>(null);

  const [revisionInstructions, setRevisionInstructions] = useState<
    Record<string, string>
  >({});

  const [imageRevisionInstructions, setImageRevisionInstructions] = useState<
    Record<string, string>
  >({});

  const [revisingImageUrl, setRevisingImageUrl] = useState<string | null>(null);
  const [imageRevisionError, setImageRevisionError] = useState("");
  const [previewGeneratedImage, setPreviewGeneratedImage] =
    useState<GeneratedCampaignImage | null>(null);

  const [revisingAssetType, setRevisingAssetType] = useState<string | null>(null);
  const [revisionError, setRevisionError] = useState("");

  const [uploadedFiles, setUploadedFiles] = useState<UploadedReferenceFile[]>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [previewFile, setPreviewFile] = useState<UploadedReferenceFile | null>(
    null
  );

  useEffect(() => {
    async function verifyBackend() {
      try {
        await checkBackendHealth();
        setBackendStatus("connected");
      } catch (error) {
        console.error(error);
        setBackendStatus("offline");
      }
    }

    verifyBackend();
  }, []);

  const toggleFormat = (formatId: string) => {
    setSelectedFormats((current) =>
      current.includes(formatId)
        ? current.filter((item) => item !== formatId)
        : [...current, formatId]
    );
  };

  const updateImageCount = (count: number) => {
    setImageCount(count);

    setImageRequests((current) => {
      const existing = [...current];

      while (existing.length < count) {
        existing.push({
          purpose: `Campaign visual ${existing.length + 1}`,
          description: "",
          aspect_ratio: "1:1",
        });
      }

      return existing.slice(0, count);
    });
  };

  const updateImageRequest = (
    index: number,
    field: keyof ImageRequest,
    value: string
  ) => {
    setImageRequests((current) =>
      current.map((request, requestIndex) =>
        requestIndex === index
          ? {
              ...request,
              [field]: value,
            }
          : request
      )
    );
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleGenerateCampaign = async (event?: FormEvent) => {
    event?.preventDefault();

    if (selectedFormats.length === 0) {
      setGenerationError("Please select at least one output format.");
      return;
    }

    setIsGenerating(true);
    setGenerationError("");
    setGeneratedCampaign(null);

    try {
      const payload = {
        brief: {
          brand_name: formData.brand_name,
          product_or_service: formData.product_or_service,
          campaign_objective: formData.campaign_objective,
          target_audience: formData.target_audience,
          tone: formData.tone,
          campaign_theme: formData.campaign_theme,
          geographic_region: formData.geographic_region,
          keywords: formData.keywords
            .split(",")
            .map((keyword) => keyword.trim())
            .filter(Boolean),
          additional_instructions: formData.additional_instructions,
        },
        output_formats: selectedFormats,
        reference_file_ids: uploadedFiles.map((file) => file.id),
        generate_images: generateImages,
        image_requests: generateImages
          ? imageRequests.filter((request) => request.description.trim())
          : [],
      };

      const response = await createCampaign(payload);
      setGeneratedCampaign(response);
    } catch (error) {
      console.error(error);
      setGenerationError(
        "Something went wrong while generating the campaign. Make sure the backend is running on port 8001."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReviseAsset = async (assetType: string) => {
    if (!generatedCampaign) return;

    const assetToRevise = generatedCampaign.assets.find(
      (asset) => asset.asset_type === assetType
    );

    if (!assetToRevise) return;

    const editInstruction = revisionInstructions[assetType]?.trim();

    if (!editInstruction) {
      setRevisionError("Please enter a revision instruction first.");
      return;
    }

    setRevisionError("");
    setRevisingAssetType(assetType);

    try {
      const response = await reviseAsset({
        campaign_id: generatedCampaign.campaign_id,
        campaign_strategy: generatedCampaign.campaign_strategy,
        asset_type: assetType,
        current_content: assetToRevise.content,
        edit_instruction: editInstruction,
      });

      setGeneratedCampaign((current) => {
        if (!current) return current;

        return {
          ...current,
          assets: current.assets.map((asset) =>
            asset.asset_type === assetType
              ? {
                  ...asset,
                  content: response.content,
                }
              : asset
          ),
          generation_metadata: response.generation_metadata,
        };
      });

      setRevisionInstructions((current) => ({
        ...current,
        [assetType]: "",
      }));
    } catch (error) {
      console.error(error);
      setRevisionError(
        "Something went wrong while revising this asset. Please try again."
      );
    } finally {
      setRevisingAssetType(null);
    }
  };

  const handleReviseImage = async (image: GeneratedCampaignImage) => {
    if (!generatedCampaign) return;

    const editInstruction = imageRevisionInstructions[image.image_url]?.trim();

    if (!editInstruction) {
      setImageRevisionError("Please enter an image revision instruction first.");
      return;
    }

    setImageRevisionError("");
    setRevisingImageUrl(image.image_url);

    try {
      const response = await reviseImage({
        campaign_strategy: generatedCampaign.campaign_strategy,
        original_image: image,
        edit_instruction: editInstruction,
      });

      setGeneratedCampaign((current) => {
        if (!current) return current;

        return {
          ...current,
          generated_images: current.generated_images?.map((currentImage) =>
            currentImage.image_url === image.image_url
              ? response.image
              : currentImage
          ),
        };
      });

      setImageRevisionInstructions((current) => ({
        ...current,
        [response.image.image_url]: "",
      }));
    } catch (error) {
      console.error(error);
      setImageRevisionError(
        "Something went wrong while revising this image. Please try again."
      );
    } finally {
      setRevisingImageUrl(null);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) return;

    setIsUploadingFile(true);
    setUploadError("");

    try {
      const uploadedResults: UploadedReferenceFile[] = [];

      for (const file of files) {
        const uploadedFile = await uploadReferenceFile(
          file,
          generatedCampaign?.campaign_id
        );

        uploadedResults.push(uploadedFile);
      }

      setUploadedFiles((current) => [...current, ...uploadedResults]);
    } catch (error) {
      console.error(error);
      setUploadError("Something went wrong while uploading the file.");
    } finally {
      setIsUploadingFile(false);
      event.target.value = "";
    }
  };

  const handleDownloadGeneratedImage = async (image: GeneratedCampaignImage) => {
    try {
      const imageUrl = getGeneratedImageUrl(image.image_url);
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      const safePurpose = image.purpose
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      link.href = objectUrl;
      link.download = `${safePurpose || "braind-generated-image"}.png`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error(error);
      setImageRevisionError("Could not download this image. Please try again.");
    }
  };

  const handleRemoveUploadedFile = (fileId: string) => {
    setUploadedFiles((currentFiles) =>
      currentFiles.filter((file) => file.id !== fileId)
    );

    setPreviewFile((currentPreview) =>
      currentPreview?.id === fileId ? null : currentPreview
    );
  };

  return (
    <main className="min-h-screen bg-[#f8f8f4] text-[#111111]">
      <header className="sticky top-0 z-50 bg-[#f8f8f4]/80 px-8 py-5 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <a href="/" className="text-4xl font-bold tracking-tight">
            Braind
          </a>

          <nav className="hidden rounded-full bg-[#d7d7d2]/90 px-10 py-5 shadow-sm backdrop-blur-md md:flex md:items-center md:gap-10">
            <a href="/" className="text-lg font-bold tracking-tight">
              Home
            </a>
            <a href="#brief" className="text-lg font-bold tracking-tight">
              Brief
            </a>
            <a href="#formats" className="text-lg font-bold tracking-tight">
              Formats
            </a>
            <a href="#visuals" className="text-lg font-bold tracking-tight">
              Visuals
            </a>
            <a href="#references" className="text-lg font-bold tracking-tight">
              References
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <div
              className={`rounded-full px-5 py-3 text-sm font-bold tracking-tight ${
                backendStatus === "connected"
                  ? "bg-[#e5f2c8] text-[#40540a]"
                  : backendStatus === "offline"
                  ? "bg-red-100 text-red-700"
                  : "bg-[#d7d7d2] text-[#555555]"
              }`}
            >
              {backendStatus === "connected"
                ? "Backend connected"
                : backendStatus === "offline"
                ? "Backend offline"
                : "Checking backend"}
            </div>

            <button
              onClick={() => handleGenerateCampaign()}
              disabled={isGenerating}
              className="rounded-full bg-[#40540a] px-8 py-4 text-lg font-bold tracking-tight text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGenerating ? "Generating..." : "Generate →"}
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-8 pb-16 pt-12">
        <p className="mb-6 text-sm font-medium uppercase tracking-[0.2em] text-[#40540a]">
          Create Campaign
        </p>

        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h1 className="max-w-5xl text-5xl font-normal italic leading-[1.02] tracking-tight md:text-7xl">
              Build a campaign from one clear creative direction.
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-[#666666]">
              Enter a campaign brief, choose the formats you need, and add any
              supporting references. Braind will turn them into a unified
              campaign kit with strategy, assets, and evaluation scores.
            </p>
          </div>

          <div className="rounded-[2rem] bg-[#9aaa82] p-4 shadow-xl">
            <div className="rounded-[1.5rem] border border-white/30 bg-white/80 p-6 backdrop-blur">
              <p className="text-sm text-[#666666]">Current workflow</p>

              <div className="mt-8 space-y-4">
                {[
                  ["01", "Campaign brief"],
                  ["02", "Reference upload"],
                  ["03", "Format selection"],
                  ["04", "Strategy generation"],
                  ["05", "Campaign kit"],
                  ["06", "Evaluation"],
                ].map(([number, label]) => (
                  <div
                    key={number}
                    className="flex items-center justify-between border-t border-black/10 pt-4"
                  >
                    <span className="text-[#666666]">{number}</span>
                    <span className="font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="brief"
        className="mx-auto grid max-w-7xl gap-8 px-8 py-12 lg:grid-cols-[0.75fr_1.25fr]"
      >
        <div className="border-t border-black/10 pt-8">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#40540a]">
            Campaign Brief
          </p>
          <h2 className="mt-6 text-4xl font-normal leading-tight">
            Tell Braind what you want to create.
          </h2>
          <p className="mt-6 leading-7 text-[#666666]">
            This information becomes the foundation for the shared campaign
            strategy and every generated asset.
          </p>
        </div>

        <form
          onSubmit={handleGenerateCampaign}
          className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm md:p-8"
        >
          <div className="grid gap-5 md:grid-cols-2">
            {[
              ["brand_name", "Brand name", "Coca-Cola"],
              [
                "product_or_service",
                "Product or service",
                "Summer limited-edition beverage",
              ],
              [
                "campaign_objective",
                "Campaign objective",
                "Increase awareness and engagement",
              ],
              ["target_audience", "Target audience", "College students"],
              ["tone", "Tone", "Energetic, youthful, optimistic"],
              ["campaign_theme", "Campaign theme", "Shared summer moments"],
              ["geographic_region", "Geographic region", "United States"],
              ["keywords", "Keywords", "summer, refresh, friends"],
            ].map(([field, label, placeholder]) => (
              <label key={field} className="space-y-2">
                <span className="text-sm font-medium">{label}</span>
                <input
                  value={formData[field as keyof typeof formData]}
                  onChange={(event) =>
                    updateField(
                      field as keyof typeof formData,
                      event.target.value
                    )
                  }
                  className="w-full rounded-2xl border border-black/10 bg-[#f8f8f4] px-4 py-4 outline-none transition focus:border-[#40540a]"
                  placeholder={placeholder}
                />
              </label>
            ))}
          </div>

          <label className="mt-5 block space-y-2">
            <span className="text-sm font-medium">Additional instructions</span>
            <textarea
              value={formData.additional_instructions}
              onChange={(event) =>
                updateField("additional_instructions", event.target.value)
              }
              className="min-h-36 w-full resize-none rounded-2xl border border-black/10 bg-[#f8f8f4] px-4 py-4 outline-none transition focus:border-[#40540a]"
              placeholder="Keep the campaign short, playful, and memorable."
            />
          </label>

          {generationError && (
            <div className="mt-5 rounded-2xl bg-red-100 px-5 py-4 text-sm font-medium text-red-700">
              {generationError}
            </div>
          )}

          <button
            type="submit"
            disabled={isGenerating}
            className="mt-6 rounded-full bg-[#40540a] px-8 py-4 text-lg font-bold tracking-tight text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGenerating ? "Generating Campaign..." : "Generate Campaign →"}
          </button>
        </form>
      </section>

      <section
        id="formats"
        className="mx-auto grid max-w-7xl gap-8 px-8 py-12 lg:grid-cols-[0.75fr_1.25fr]"
      >
        <div className="border-t border-black/10 pt-8">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#40540a]">
            Output Formats
          </p>
          <h2 className="mt-6 text-4xl font-normal leading-tight">
            Choose what Braind should generate.
          </h2>
          <p className="mt-6 leading-7 text-[#666666]">
            Select one or multiple campaign assets. Every selected format will
            use the same shared strategy.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {outputFormats.map((format) => {
            const isSelected = selectedFormats.includes(format.id);

            return (
              <button
                key={format.id}
                type="button"
                onClick={() => toggleFormat(format.id)}
                className={`rounded-[1.5rem] border p-6 text-left transition ${
                  isSelected
                    ? "border-[#40540a] bg-[#e5f2c8]"
                    : "border-black/10 bg-white hover:border-[#40540a]"
                }`}
              >
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <h3 className="text-xl font-medium">{format.label}</h3>
                    <p className="mt-3 leading-7 text-[#666666]">
                      {format.description}
                    </p>
                  </div>

                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm ${
                      isSelected
                        ? "border-[#40540a] bg-[#40540a] text-white"
                        : "border-black/20 text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>



      <section
        id="visuals"
        className="mx-auto grid max-w-7xl gap-8 px-8 py-12 lg:grid-cols-[0.75fr_1.25fr]"
      >
        <div className="border-t border-black/10 pt-8">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#40540a]">
            Campaign Visuals
          </p>
          <h2 className="mt-6 text-4xl font-normal leading-tight">
            Generate visual assets too.
          </h2>
          <p className="mt-6 leading-7 text-[#666666]">
            Turn on image generation when you want Braind to create campaign visuals,
            product-style scenes, social graphics, or email/header imagery.
          </p>
        </div>

        <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm md:p-8">
          <button
            type="button"
            onClick={() => setGenerateImages((current) => !current)}
            className={`flex w-full items-center justify-between rounded-[1.5rem] border p-6 text-left transition ${
              generateImages
                ? "border-[#40540a] bg-[#e5f2c8]"
                : "border-black/10 bg-[#f8f8f4] hover:border-[#40540a]"
            }`}
          >
            <div>
              <h3 className="text-2xl font-medium">Generate Campaign Visuals</h3>
              <p className="mt-3 leading-7 text-[#666666]">
                Optional. Use this only when you want Braind to create new AI-generated
                images for the campaign.
              </p>
            </div>

            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${
                generateImages
                  ? "border-[#40540a] bg-[#40540a] text-white"
                  : "border-black/20 text-transparent"
              }`}
            >
              ✓
            </span>
          </button>

          {generateImages && (
            <div className="mt-8 space-y-8">
              <div>
                <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-[#40540a]">
                  Number of Images
                </p>

                <div className="flex flex-wrap gap-3">
                  {[1, 2, 3].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => updateImageCount(count)}
                      className={`rounded-full border px-6 py-3 text-sm font-bold transition ${
                        imageCount === count
                          ? "border-[#40540a] bg-[#40540a] text-white"
                          : "border-black/10 bg-[#f8f8f4] text-black hover:border-[#40540a]"
                      }`}
                    >
                      {count} {count === 1 ? "Image" : "Images"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                {imageRequests.map((request, index) => (
                  <div
                    key={index}
                    className="rounded-[1.5rem] border border-black/10 bg-[#f8f8f4] p-5"
                  >
                    <p className="mb-5 text-sm font-bold uppercase tracking-[0.2em] text-[#40540a]">
                      Image {index + 1}
                    </p>

                    <div className="grid gap-5 md:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-sm font-medium">Purpose</span>
                        <input
                          value={request.purpose}
                          onChange={(event) =>
                            updateImageRequest(index, "purpose", event.target.value)
                          }
                          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-4 outline-none transition focus:border-[#40540a]"
                          placeholder="Example: Instagram campaign visual"
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-medium">Aspect ratio</span>
                        <select
                          value={request.aspect_ratio}
                          onChange={(event) =>
                            updateImageRequest(
                              index,
                              "aspect_ratio",
                              event.target.value
                            )
                          }
                          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-4 outline-none transition focus:border-[#40540a]"
                        >
                          <option value="1:1">1:1 — Square</option>
                          <option value="16:9">16:9 — Wide/Header</option>
                          <option value="9:16">9:16 — Story/Vertical</option>
                          <option value="4:5">4:5 — Social Portrait</option>
                        </select>
                      </label>
                    </div>

                    <label className="mt-5 block space-y-2">
                      <span className="text-sm font-medium">Image description</span>
                      <textarea
                        value={request.description}
                        onChange={(event) =>
                          updateImageRequest(index, "description", event.target.value)
                        }
                        className="min-h-32 w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-4 outline-none transition focus:border-[#40540a]"
                        placeholder="Example: Summer beach vibes with a chilled dripping Coca-Cola bottle in the foreground."
                      />
                    </label>
                  </div>
                ))}
              </div>

            
            </div>
          )}
        </div>
      </section>

      <section
        id="references"
        className="mx-auto grid max-w-7xl gap-8 px-8 py-12 lg:grid-cols-[0.75fr_1.25fr]"
      >
        <div className="border-t border-black/10 pt-8">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#40540a]">
            References
          </p>
          <h2 className="mt-6 text-4xl font-normal leading-tight">
            Add brand context and inspiration.
          </h2>
          <p className="mt-6 leading-7 text-[#666666]">
            Add any images that you wish to draw inspiration from!
          </p>
        </div>

        <div className="rounded-[2rem] border border-dashed border-black/20 bg-white p-8">
          <div className="rounded-[1.5rem] bg-[#f8f8f4] px-8 py-16 text-center">
            <p className="text-3xl font-normal italic">
              Drop PDFs, text files, screenshots, or mood boards here.
            </p>
            

            <label className="mt-8 inline-block cursor-pointer rounded-full bg-[#40540a] px-8 py-4 text-lg font-bold tracking-tight text-white transition hover:opacity-90">
              {isUploadingFile ? "Uploading..." : "Choose Files"}
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploadingFile}
                accept=".pdf,.txt,.md,.png,.jpg,.jpeg,.webp"
              />
            </label>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="mt-8">
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-[#40540a]">
                Uploaded References
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                {uploadedFiles.map((file) => {
                  const isImage = file.file_type.startsWith("image/");

                  return (
                    <div
                      key={file.id}
                      className="relative flex gap-4 rounded-2xl border border-black/10 bg-[#f8f8f4] p-4"
                    >
                      <button
                        type="button"
                        onClick={() => handleRemoveUploadedFile(file.id)}
                        className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border border-black/10 bg-white text-sm font-bold text-black transition hover:bg-black hover:text-white"
                        aria-label={`Remove ${file.file_name}`}
                      >
                        ×
                      </button>

                      <button
                        type="button"
                        onClick={() => setPreviewFile(file)}
                        className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-black/10 bg-white"
                      >
                        {isImage && file.file_url ? (
                          <img
                            src={file.file_url}
                            alt={file.file_name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs font-bold uppercase tracking-wide text-[#40540a]">
                            {file.file_name.split(".").pop() || "file"}
                          </div>
                        )}
                      </button>

                      <div className="min-w-0 pr-8">
                        <p className="truncate font-medium">{file.file_name}</p>
                        <p className="mt-1 text-sm text-[#666666]">{file.file_type}</p>
                        <p className="mt-2 text-xs font-medium text-[#40540a]">
                          {file.processed ? "Processed" : "Uploaded, processing pending"}
                        </p>

                        {file.extracted_summary && (
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#666666]">
                            {file.extracted_summary}
                          </p>
                        )}

                        <button
                          type="button"
                          onClick={() => setPreviewFile(file)}
                          className="mt-3 text-sm font-bold text-[#40540a] underline-offset-4 hover:underline"
                        >
                          Preview
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {sampleReferenceTypes.map((type) => (
              <div
                key={type}
                className="rounded-2xl border border-black/10 bg-[#f8f8f4] px-4 py-3 text-sm font-medium"
              >
                {type}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-8 py-16">
        <div className="rounded-[2rem] bg-[#111111] p-10 text-white md:p-14">
          <div className="flex flex-col justify-between gap-10 md:flex-row md:items-end">
            <div>
              <p className="mb-6 text-sm font-medium uppercase tracking-[0.2em] text-[#dff2b8]">
                Ready for Generation
              </p>
              <h2 className="max-w-3xl text-4xl font-normal italic leading-tight md:text-6xl">
                Generate a structured campaign kit from the FastAPI backend.
              </h2>
            </div>

            <button
              onClick={() => handleGenerateCampaign()}
              disabled={isGenerating}
              className="rounded-full bg-[#dff2b8] px-8 py-4 text-lg font-bold tracking-tight text-[#40540a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGenerating ? "Generating..." : "Generate Campaign →"}
            </button>
          </div>
        </div>
      </section>

      {generatedCampaign && (
        <section className="mx-auto max-w-7xl px-8 pb-24">
          <div className="border-t border-black/10 pt-12">
            <p className="mb-6 text-sm font-medium uppercase tracking-[0.2em] text-[#40540a]">
              Generated Campaign Kit
            </p>

            <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <h2 className="text-5xl font-normal italic leading-tight">
                  Campaign kit created.
                </h2>
                <div className="mt-4 space-y-2 text-[#666666]">
                <p>Campaign ID: {generatedCampaign.campaign_id}</p>
                <div className="flex flex-wrap gap-3 pt-2">
                    <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#40540a]">
                    Source: {generatedCampaign.generation_metadata.generation_source}
                    </span>
                    <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#40540a]">
                    Model: {generatedCampaign.generation_metadata.model_name}
                    </span>
                </div>
                </div>
              </div>

              <div className="rounded-[2rem] bg-[#111111] px-8 py-6 text-white">
                <p className="text-sm text-white/60">Overall Score</p>
                <p className="mt-2 text-5xl font-normal">
                  {formatScore(generatedCampaign.evaluation_summary.overall_score)}
                </p>
                <p className="mt-2 text-sm text-white/60">
                  {generatedCampaign.evaluation_summary.manual_review_required
                    ? "Manual review required"
                    : "Ready for review"}
                </p>
              </div>
            </div>

            <div className="mb-10 grid gap-4 md:grid-cols-4">
              {[
                [
                  "Brand Alignment",
                  generatedCampaign.evaluation_summary
                    .average_brand_alignment,
                ],
                ["Grounding", generatedCampaign.evaluation_summary.average_grounding],
                [
                  "Compliance",
                  generatedCampaign.evaluation_summary
                    .average_compliance_safety,
                ],
                [
                  "Memorability",
                  generatedCampaign.evaluation_summary.average_memorability,
                ],
              ].map(([label, score]) => (
                <div
                  key={label}
                  className="rounded-[1.5rem] border border-black/10 bg-white p-6"
                >
                  <p className="text-sm text-[#666666]">{label}</p>
                  <p className="mt-4 text-4xl font-normal">
                    {formatScore(score as number)}
                  </p>
                </div>
              ))}
            </div>

            {generatedCampaign.generated_images &&
              generatedCampaign.generated_images.length > 0 && (
                <div className="mb-10">
                  <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                    <div>
                      <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#40540a]">
                        Generated Visuals
                      </p>
                      <h3 className="mt-3 text-4xl font-normal italic leading-tight">
                        Campaign images created.
                      </h3>
                    </div>

                    <p className="max-w-xl leading-7 text-[#666666]">
                      These visuals were generated from the campaign brief, strategy, uploaded
                      references, and your image instructions.
                    </p>
                  </div>

                  
                  {imageRevisionError && (
                    <div className="mb-6 rounded-2xl bg-red-100 px-5 py-4 text-sm font-medium text-red-700">
                      {imageRevisionError}
                    </div>
                  )}
                  
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {generatedCampaign.generated_images.map((image, index) => (
                      <div
                        key={`${image.image_url}-${index}`}
                        className="overflow-hidden rounded-[2rem] border border-black/10 bg-white"
                      >
                        <button
                          type="button"
                          onClick={() => setPreviewGeneratedImage(image)}
                          className="block w-full bg-[#f8f8f4]"
                        >
                          <img
                            src={getGeneratedImageUrl(image.image_url)}
                            alt={image.purpose}
                            className="aspect-square w-full object-cover transition hover:scale-[1.01]"
                          />
                        </button>

                        <div className="p-6">
                          <div className="mb-4 flex flex-wrap gap-2">
                            <span className="rounded-full bg-[#f8f8f4] px-4 py-2 text-sm text-[#666666]">
                              {image.model_name}
                            </span>
                            <span className="rounded-full bg-[#f8f8f4] px-4 py-2 text-sm text-[#666666]">
                              {image.aspect_ratio}
                            </span>
                          </div>

                          <h4 className="text-2xl font-medium">{image.purpose}</h4>

                          <div className="mt-4 flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() => setPreviewGeneratedImage(image)}
                              className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-black hover:text-white"
                            >
                              Preview
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDownloadGeneratedImage(image)}
                              className="rounded-full bg-[#40540a] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
                            >
                              Download
                            </button>
                          </div>

                          <div className="mt-6 rounded-[1.5rem] bg-[#f8f8f4] p-5">
                            <label className="block">
                              <span className="text-sm font-medium text-[#666666]">
                                Revise this image
                              </span>

                              <textarea
                                value={imageRevisionInstructions[image.image_url] || ""}
                                onChange={(event) =>
                                  setImageRevisionInstructions((current) => ({
                                    ...current,
                                    [image.image_url]: event.target.value,
                                  }))
                                }
                                className="mt-3 min-h-24 w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-4 outline-none transition focus:border-[#40540a]"
                                placeholder="Example: Make the bottle closer, remove text, make the beach brighter, and make it feel more premium."
                              />
                            </label>

                            <button
                              type="button"
                              onClick={() => handleReviseImage(image)}
                              disabled={revisingImageUrl === image.image_url}
                              className="mt-4 rounded-full bg-[#40540a] px-6 py-3 text-sm font-bold tracking-tight text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {revisingImageUrl === image.image_url
                                ? "Revising Image..."
                                : "Revise Image →"}
                            </button>
                          </div>

                        
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {revisionError && (
              <div className="mb-6 rounded-2xl bg-red-100 px-5 py-4 text-sm font-medium text-red-700">
                {revisionError}
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="rounded-[2rem] bg-[#dff2b8] p-8">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#40540a]">
                  Campaign Strategy
                </p>

                <div className="mt-8 space-y-5">
                  {[
                    [
                      "Core Message",
                      generatedCampaign.campaign_strategy.core_message,
                    ],
                    [
                      "Emotional Hook",
                      generatedCampaign.campaign_strategy.emotional_hook,
                    ],
                    [
                      "Memorability Device",
                      generatedCampaign.campaign_strategy.memorability_device,
                    ],
                    [
                      "Audience Insight",
                      generatedCampaign.campaign_strategy.audience_insight,
                    ],
                    [
                      "Visual Direction",
                      generatedCampaign.campaign_strategy.visual_direction,
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="border-t border-[#40540a]/20 pt-4"
                    >
                      <p className="text-sm text-[#40540a]">{label}</p>
                      <p className="mt-2 font-medium leading-7">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-5">
                {generatedCampaign.assets.map((asset) => (
                  <div
                    key={asset.asset_type}
                    className="rounded-[2rem] border border-black/10 bg-white p-8"
                  >
                    <div className="mb-6 flex items-center justify-between gap-4">
                      <h3 className="text-2xl font-medium">
                        {asset.asset_type.replaceAll("_", " ")}
                      </h3>
                      <span className="rounded-full bg-[#f8f8f4] px-4 py-2 text-sm text-[#666666]">
                        {revisionInstructions[asset.asset_type] ? "Editing" : "Generated"}
                      </span>
                    </div>

                    <div className="mb-6 grid gap-3 md:grid-cols-2">
                      {Object.entries(asset.evaluation).map(([key, value]) => (
                        <div
                          key={key}
                          className="rounded-2xl bg-[#f8f8f4] px-4 py-3"
                        >
                          <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#666666]">
                            {formatLabel(key)}
                          </p>
                          <p className="mt-2 text-2xl font-normal">
                            {formatScore(value)}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4">
                      {Object.entries(asset.content).map(([key, value]) => (
                        <div key={key} className="border-t border-black/10 pt-4">
                          <p className="mb-2 text-sm font-medium capitalize text-[#666666]">
                            {key.replaceAll("_", " ")}
                          </p>
                          <p className="whitespace-pre-line leading-7">
                            {Array.isArray(value)
                              ? value.join(", ")
                              : String(value)}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 rounded-[1.5rem] bg-[#f8f8f4] p-5">
                      <label className="block">
                        <span className="text-sm font-medium text-[#666666]">
                          Edit this asset
                        </span>

                        <textarea
                          value={revisionInstructions[asset.asset_type] || ""}
                          onChange={(event) =>
                            setRevisionInstructions((current) => ({
                              ...current,
                              [asset.asset_type]: event.target.value,
                            }))
                          }
                          className="mt-3 min-h-28 w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-4 outline-none transition focus:border-[#40540a]"
                          placeholder="Example: Make this more playful, shorter, and better for Gen Z."
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => handleReviseAsset(asset.asset_type)}
                        disabled={revisingAssetType === asset.asset_type}
                        className="mt-4 rounded-full bg-[#40540a] px-6 py-3 text-sm font-bold tracking-tight text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {revisingAssetType === asset.asset_type
                          ? "Revising..."
                          : "Revise Asset →"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {previewGeneratedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="relative max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[2rem] bg-[#f8f8f4] p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setPreviewGeneratedImage(null)}
              className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black text-xl font-bold text-white"
              aria-label="Close generated image preview"
            >
              ×
            </button>

            <div className="pr-14">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#40540a]">
                Generated Image Preview
              </p>
              <h3 className="mt-2 text-3xl font-semibold tracking-tight">
                {previewGeneratedImage.purpose}
              </h3>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-4 py-2 text-sm text-[#666666]">
                  {previewGeneratedImage.model_name}
                </span>
                <span className="rounded-full bg-white px-4 py-2 text-sm text-[#666666]">
                  {previewGeneratedImage.aspect_ratio}
                </span>
              </div>
            </div>

            <div className="mt-6 max-h-[68vh] overflow-auto rounded-[1.5rem] border border-black/10 bg-white">
              <img
                src={getGeneratedImageUrl(previewGeneratedImage.image_url)}
                alt={previewGeneratedImage.purpose}
                className="mx-auto max-h-[68vh] w-full object-contain"
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleDownloadGeneratedImage(previewGeneratedImage)}
                className="rounded-full bg-[#40540a] px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
              >
                Download Image
              </button>

              <button
                type="button"
                onClick={() => setPreviewGeneratedImage(null)}
                className="rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-black hover:text-white"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="relative max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-[2rem] bg-[#f8f8f4] p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setPreviewFile(null)}
              className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-black text-lg font-bold text-white"
              aria-label="Close preview"
            >
              ×
            </button>

            <div className="pr-12">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#40540a]">
                Reference Preview
              </p>
              <h3 className="mt-2 truncate text-2xl font-semibold tracking-tight">
                {previewFile.file_name}
              </h3>
              <p className="mt-1 text-sm text-[#666666]">{previewFile.file_type}</p>
            </div>

            <div className="mt-6 max-h-[70vh] overflow-y-auto rounded-[1.5rem] border border-black/10 bg-white">
              {previewFile.file_type.startsWith("image/") && previewFile.file_url ? (
                <div>
                  <div className="border-b border-black/10 bg-[#f8f8f4] p-4">
                    <img
                      src={previewFile.file_url}
                      alt={previewFile.file_name}
                      className="mx-auto max-h-[45vh] w-full object-contain"
                    />
                  </div>

                  <div className="space-y-5 p-6 text-left">
                    {previewFile.extracted_summary && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#40540a]">
                          Visual Summary
                        </p>
                        <p className="mt-2 leading-7 text-[#666666]">
                          {previewFile.extracted_summary}
                        </p>
                      </div>
                    )}

                    {previewFile.visual_analysis &&
                      Object.entries(previewFile.visual_analysis).map(([key, value]) => {
                        if (key === "visual_summary") return null;

                        return (
                          <div key={key} className="border-t border-black/10 pt-4">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#40540a]">
                              {key.replaceAll("_", " ")}
                            </p>

                            <p className="mt-2 whitespace-pre-line leading-7 text-[#666666]">
                              {Array.isArray(value)
                                ? value.join(", ")
                                : typeof value === "object" && value !== null
                                ? JSON.stringify(value, null, 2)
                                : String(value)}
                            </p>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ) : previewFile.extracted_summary ? (
                <div className="p-6 text-left">
                  <p className="whitespace-pre-line text-base leading-8 text-[#666666]">
                    {previewFile.extracted_summary}
                  </p>
                </div>
              ) : (
                <div className="flex min-h-64 items-center justify-center p-8 text-center text-[#666666]">
                  No preview content is available for this file yet.
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleRemoveUploadedFile(previewFile.id)}
              className="mt-5 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-black hover:text-white"
            >
              Remove Reference
            </button>
          </div>
        </div>
      )}
    </main>
  );
}