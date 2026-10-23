"""Design system models."""

from datetime import datetime, UTC
from typing import Optional, List
from sqlalchemy import String, Text, DateTime, Integer, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class DesignSystem(Base):
    """Design system extracted from a codebase."""

    __tablename__ = "design_systems"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    root_path: Mapped[str] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

    # Extracted tokens (JSON)
    type_scale: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    color_palette: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    spacing: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    component_patterns: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Generated DESIGN.md content
    design_md: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    audits: Mapped[List["DesignAudit"]] = relationship(back_populates="design_system", cascade="all, delete-orphan")


class DesignAudit(Base):
    """Design audit results for a page/component."""

    __tablename__ = "design_audits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    design_system_id: Mapped[int] = mapped_column(Integer, ForeignKey("design_systems.id"), index=True)
    target_path: Mapped[str] = mapped_column(String(500))
    target_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_rtl: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))

    # Scores (0-4 per section, total /24 with i18n)
    a11y_score: Mapped[int] = mapped_column(default=0)
    performance_score: Mapped[int] = mapped_column(default=0)
    theming_score: Mapped[int] = mapped_column(default=0)
    responsive_score: Mapped[int] = mapped_column(default=0)
    integrity_score: Mapped[int] = mapped_column(default=0)
    i18n_score: Mapped[int] = mapped_column(default=0)

    # Findings (JSON)
    findings: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    design_system: Mapped["DesignSystem"] = relationship(back_populates="audits")


class CraftFloorRule(Base):
    """Craft floor quality rules."""

    __tablename__ = "craft_floor_rules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    rule_id: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    category: Mapped[str] = mapped_column(String(50))  # "layout", "css", "performance", "accessibility"
    severity: Mapped[str] = mapped_column(String(20))  # "ban", "warning", "advisory"
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    detection_pattern: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # regex or AST pattern
    fix_guidance: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))