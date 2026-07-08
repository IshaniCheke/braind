from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


def generate_uuid():
    return uuid4()


def utc_now():
    return datetime.now(timezone.utc)


class CampaignDB(Base):
    __tablename__ = "campaigns"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=generate_uuid,
    )

    campaign_id: Mapped[str] = mapped_column(String(50), unique=True, index=True)

    brand_name: Mapped[str] = mapped_column(String(255))
    product_or_service: Mapped[str] = mapped_column(Text)
    campaign_objective: Mapped[str] = mapped_column(Text)
    target_audience: Mapped[str] = mapped_column(Text)
    tone: Mapped[str] = mapped_column(Text)
    campaign_theme: Mapped[str] = mapped_column(Text)
    geographic_region: Mapped[str | None] = mapped_column(String(255), nullable=True)
    keywords: Mapped[dict] = mapped_column(JSONB, default=list)
    additional_instructions: Mapped[str | None] = mapped_column(Text, nullable=True)

    campaign_strategy: Mapped[dict] = mapped_column(JSONB)
    evaluation_summary: Mapped[dict] = mapped_column(JSONB)
    generation_metadata: Mapped[dict] = mapped_column(JSONB)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
    )

    assets = relationship(
        "CampaignAssetDB",
        back_populates="campaign",
        cascade="all, delete-orphan",
    )

    revisions = relationship(
        "AssetRevisionDB",
        back_populates="campaign",
        cascade="all, delete-orphan",
    )

    uploaded_files = relationship(
        "UploadedFileDB",
        back_populates="campaign",
        cascade="all, delete-orphan",
    )


class CampaignAssetDB(Base):
    __tablename__ = "campaign_assets"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=generate_uuid,
    )

    campaign_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("campaigns.id", ondelete="CASCADE"),
        index=True,
    )

    asset_type: Mapped[str] = mapped_column(String(100))
    content: Mapped[dict] = mapped_column(JSONB)
    evaluation: Mapped[dict] = mapped_column(JSONB)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
    )

    campaign = relationship("CampaignDB", back_populates="assets")


class AssetRevisionDB(Base):
    __tablename__ = "asset_revisions"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=generate_uuid,
    )

    campaign_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("campaigns.id", ondelete="CASCADE"),
        index=True,
    )

    asset_type: Mapped[str] = mapped_column(String(100))
    edit_instruction: Mapped[str] = mapped_column(Text)

    before_content: Mapped[dict] = mapped_column(JSONB)
    after_content: Mapped[dict] = mapped_column(JSONB)

    generation_metadata: Mapped[dict] = mapped_column(JSONB)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    campaign = relationship("CampaignDB", back_populates="revisions")


class UploadedFileDB(Base):
    __tablename__ = "uploaded_files"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=generate_uuid,
    )

    campaign_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("campaigns.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    file_name: Mapped[str] = mapped_column(String(500))
    file_type: Mapped[str] = mapped_column(String(100))
    storage_path: Mapped[str | None] = mapped_column(Text, nullable=True)

    extracted_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    extracted_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    visual_analysis: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    processed: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    campaign = relationship("CampaignDB", back_populates="uploaded_files")