"""API request/response schemas."""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, HttpUrl


class DesignSystemBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    root_path: str = Field(..., min_length=1, max_length=500)


class DesignSystemCreate(DesignSystemBase):
    pass


class DesignSystemUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    root_path: Optional[str] = Field(None, min_length=1, max_length=500)


class DesignSystemRead(DesignSystemBase):
    id: int
    created_at: datetime
    updated_at: datetime
    type_scale: Optional[Dict[str, Any]] = None
    color_palette: Optional[Dict[str, Any]] = None
    spacing: Optional[Dict[str, Any]] = None
    component_patterns: Optional[Dict[str, Any]] = None
    design_md: Optional[str] = None

    class Config:
        from_attributes = True


class DesignSystemList(BaseModel):
    items: List[DesignSystemRead]
    total: int
    page: int
    page_size: int


class DesignAuditBase(BaseModel):
    target_path: str = Field(..., min_length=1, max_length=500)
    target_url: Optional[HttpUrl] = None
    is_rtl: bool = False


class DesignAuditCreate(DesignAuditBase):
    design_system_id: int


class DesignAuditRead(DesignAuditBase):
    id: int
    design_system_id: int
    created_at: datetime
    a11y_score: int
    performance_score: int
    theming_score: int
    responsive_score: int
    integrity_score: int
    i18n_score: int
    findings: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class DesignAuditList(BaseModel):
    items: List[DesignAuditRead]
    total: int
    page: int
    page_size: int


class ExtractRequest(BaseModel):
    """Request to extract design system from codebase."""
    root_path: str = Field(..., min_length=1, max_length=500)
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    include_patterns: List[str] = Field(default=["**/*.tsx", "**/*.ts", "**/*.jsx", "**/*.js"])
    exclude_patterns: List[str] = Field(default=["**/node_modules/**", "**/dist/**", "**/.git/**"])


class ExtractResponse(BaseModel):
    """Response from design system extraction."""
    design_system_id: int
    name: str
    type_scale: Dict[str, Any]
    color_palette: Dict[str, Any]
    spacing: Dict[str, Any]
    component_patterns: Dict[str, Any]
    design_md: str


class AuditRequest(BaseModel):
    """Request to audit a page/component."""
    design_system_id: int
    target_path: str = Field(..., min_length=1, max_length=500)
    target_url: Optional[HttpUrl] = None
    is_rtl: bool = False
    html_content: Optional[str] = None  # For direct HTML analysis


class AuditResponse(BaseModel):
    """Response from design audit."""
    audit_id: int
    scores: Dict[str, int]
    findings: Dict[str, Any]
    total_score: int
    max_score: int = 24


class CraftFloorCheckRequest(BaseModel):
    """Request to check craft floor rules before UI edit."""
    file_path: str = Field(..., min_length=1, max_length=500)
    content_before: str
    content_after: str
    design_system_id: Optional[int] = None


class CraftFloorViolation(BaseModel):
    rule_id: str
    category: str
    severity: str
    title: str
    description: str
    location: Optional[str] = None
    fix_guidance: Optional[str] = None


class CraftFloorCheckResponse(BaseModel):
    """Response from craft floor check."""
    passed: bool
    violations: List[CraftFloorViolation]
    warnings: List[CraftFloorViolation]
    advisories: List[CraftFloorViolation]