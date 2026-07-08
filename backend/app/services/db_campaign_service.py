from sqlalchemy.orm import Session

from app.models.campaign_models import AssetRevisionDB, CampaignAssetDB, CampaignDB
from app.schemas.campaign import AssetRevisionRequest, AssetRevisionResponse, CampaignCreateResponse

def save_campaign_to_db(
    db: Session,
    campaign_response: CampaignCreateResponse,
) -> CampaignDB:
    brief = campaign_response.brief

    campaign_db = CampaignDB(
        campaign_id=campaign_response.campaign_id,
        brand_name=brief.brand_name,
        product_or_service=brief.product_or_service,
        campaign_objective=brief.campaign_objective,
        target_audience=brief.target_audience,
        tone=brief.tone,
        campaign_theme=brief.campaign_theme,
        geographic_region=brief.geographic_region,
        keywords=brief.keywords,
        additional_instructions=brief.additional_instructions,
        campaign_strategy=campaign_response.campaign_strategy.model_dump(),
        evaluation_summary=campaign_response.evaluation_summary.model_dump(),
        generation_metadata=campaign_response.generation_metadata.model_dump(),
    )

    db.add(campaign_db)
    db.flush()

    for asset in campaign_response.assets:
        asset_db = CampaignAssetDB(
            campaign_id=campaign_db.id,
            asset_type=asset.asset_type.value,
            content=asset.content,
            evaluation=asset.evaluation.model_dump(),
        )

        db.add(asset_db)

    db.commit()
    db.refresh(campaign_db)

    return campaign_db

def save_asset_revision_to_db(
    db: Session,
    revision_request: AssetRevisionRequest,
    revision_response: AssetRevisionResponse,
) -> AssetRevisionDB | None:
    campaign_db = (
        db.query(CampaignDB)
        .filter(CampaignDB.campaign_id == revision_request.campaign_id)
        .first()
    )

    if not campaign_db:
        return None

    revision_db = AssetRevisionDB(
        campaign_id=campaign_db.id,
        asset_type=revision_request.asset_type.value,
        edit_instruction=revision_request.edit_instruction,
        before_content=revision_request.current_content,
        after_content=revision_response.content,
        generation_metadata=revision_response.generation_metadata.model_dump(),
    )

    db.add(revision_db)

    asset_db = (
        db.query(CampaignAssetDB)
        .filter(
            CampaignAssetDB.campaign_id == campaign_db.id,
            CampaignAssetDB.asset_type == revision_request.asset_type.value,
        )
        .first()
    )

    if asset_db:
        asset_db.content = revision_response.content

    db.commit()
    db.refresh(revision_db)

    return revision_db