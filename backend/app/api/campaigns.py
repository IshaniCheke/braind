from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.campaign import (
    AssetRevisionRequest,
    AssetRevisionResponse,
    CampaignCreateRequest,
    CampaignCreateResponse,
    ImageRevisionRequest,
    ImageRevisionResponse,
)
from app.services.campaign_service import create_campaign, revise_asset, revise_image
from app.services.db_campaign_service import (
    save_asset_revision_to_db,
    save_campaign_to_db,
)

router = APIRouter(prefix="/campaigns", tags=["Campaigns"])


@router.post("", response_model=CampaignCreateResponse)
def create_new_campaign(
    request: CampaignCreateRequest,
    db: Session = Depends(get_db),
):
    campaign_response = create_campaign(request, db=db)
    save_campaign_to_db(db, campaign_response)

    return campaign_response


@router.post("/revise-asset", response_model=AssetRevisionResponse)
def revise_campaign_asset(
    request: AssetRevisionRequest,
    db: Session = Depends(get_db),
):
    revision_response = revise_asset(request)
    save_asset_revision_to_db(db, request, revision_response)

    return revision_response

@router.post("/revise-image", response_model=ImageRevisionResponse)
def revise_campaign_image(request: ImageRevisionRequest):
    return revise_image(request)