from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Braind"
    environment: str = "development"

    gemini_api_key: str | None = None
    gemini_image_api_key: str | None = None
    gemini_model: str = "gemini-2.5-flash"

    runware_api_key: str | None = None
    runware_image_model: str = "paste_exact_riverflow_model_id_here"
    image_generation_provider: str = "runware"
    
    
    gemini_image_model: str = "gemini-2.5-flash-image"
    generated_images_dir: str = "generated_images"

    pollinations_api_key: str | None = None
    pollinations_image_model: str = "flux"

    supabase_generated_assets_bucket: str = "generated-assets"

    database_url: str | None = None
    supabase_url: str | None = None
    supabase_key: str | None = None

    use_gemini_generation: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()