"""Design system API routes."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.design_system import DesignSystem, DesignAudit, CraftFloorRule
from app.api.schemas import (
    DesignSystemCreate,
    DesignSystemUpdate,
    DesignSystemRead,
    DesignSystemList,
    DesignAuditCreate,
    DesignAuditRead,
    DesignAuditList,
    ExtractRequest,
    ExtractResponse,
    AuditRequest,
    AuditResponse,
    CraftFloorCheckRequest,
    CraftFloorCheckResponse,
    CraftFloorViolation,
)
from app.services.design_extractor import extract_design_system
from app.services.design_auditor import audit_design
from app.services.craft_floor import check_craft_floor

router = APIRouter(prefix="/design-systems", tags=["design-systems"])


@router.post("", response_model=DesignSystemRead, status_code=status.HTTP_201_CREATED)
async def create_design_system(
    data: DesignSystemCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new design system entry."""
    ds = DesignSystem(**data.model_dump())
    db.add(ds)
    await db.commit()
    await db.refresh(ds)
    return ds


@router.get("", response_model=DesignSystemList)
async def list_design_systems(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List design systems with pagination."""
    offset = (page - 1) * page_size

    total_result = await db.execute(select(func.count(DesignSystem.id)))
    total = total_result.scalar() or 0

    result = await db.execute(
        select(DesignSystem)
        .order_by(DesignSystem.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    items = result.scalars().all()

    return DesignSystemList(
        items=[DesignSystemRead.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{ds_id}", response_model=DesignSystemRead)
async def get_design_system(ds_id: int, db: AsyncSession = Depends(get_db)):
    """Get a design system by ID."""
    result = await db.execute(select(DesignSystem).where(DesignSystem.id == ds_id))
    ds = result.scalar_one_or_none()
    if not ds:
        raise HTTPException(status_code=404, detail="Design system not found")
    return ds


@router.patch("/{ds_id}", response_model=DesignSystemRead)
async def update_design_system(
    ds_id: int,
    data: DesignSystemUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a design system."""
    result = await db.execute(select(DesignSystem).where(DesignSystem.id == ds_id))
    ds = result.scalar_one_or_none()
    if not ds:
        raise HTTPException(status_code=404, detail="Design system not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(ds, field, value)

    await db.commit()
    await db.refresh(ds)
    return ds


@router.delete("/{ds_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_design_system(ds_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a design system."""
    result = await db.execute(select(DesignSystem).where(DesignSystem.id == ds_id))
    ds = result.scalar_one_or_none()
    if not ds:
        raise HTTPException(status_code=404, detail="Design system not found")

    await db.delete(ds)
    await db.commit()

@router.post("/extract", response_model=ExtractResponse)
async def extract_design_system_endpoint(
    request: ExtractRequest,
    db: AsyncSession = Depends(get_db),
):
    """Extract design system from a codebase."""
    try:
        result = await extract_design_system(
            root_path=request.root_path,
            name=request.name,
            include_patterns=request.include_patterns,
            exclude_patterns=request.exclude_patterns,
            db=db,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{ds_id}/audit", response_model=AuditResponse)
async def audit_design_endpoint(
    ds_id: int,
    request: AuditRequest,
    db: AsyncSession = Depends(get_db),
):
    """Audit a page/component against design system."""
    # Verify design system exists
    result = await db.execute(select(DesignSystem).where(DesignSystem.id == ds_id))
    ds = result.scalar_one_or_none()
    if not ds:
        raise HTTPException(status_code=404, detail="Design system not found")

    audit_result = await audit_design(
        design_system=ds,
        target_path=request.target_path,
        target_url=str(request.target_url) if request.target_url else None,
        is_rtl=request.is_rtl,
        html_content=request.html_content,
        db=db,
    )
    return audit_result


@router.get("/{ds_id}/audits", response_model=DesignAuditList)
async def list_audits(
    ds_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List audits for a design system."""
    result = await db.execute(select(DesignSystem).where(DesignSystem.id == ds_id))
    ds = result.scalar_one_or_none()
    if not ds:
        raise HTTPException(status_code=404, detail="Design system not found")

    offset = (page - 1) * page_size

    total_result = await db.execute(
        select(func.count(DesignAudit.id)).where(DesignAudit.design_system_id == ds_id)
    )
    total = total_result.scalar() or 0

    result = await db.execute(
        select(DesignAudit)
        .where(DesignAudit.design_system_id == ds_id)
        .order_by(DesignAudit.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    items = result.scalars().all()

    return DesignAuditList(
        items=[DesignAuditRead.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{ds_id}/audits/{audit_id}", response_model=DesignAuditRead)
async def get_audit(ds_id: int, audit_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific audit."""
    result = await db.execute(
        select(DesignAudit).where(
            DesignAudit.id == audit_id,
            DesignAudit.design_system_id == ds_id,
        )
    )
    audit = result.scalar_one_or_none()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    return audit


@router.post("/craft-floor/check", response_model=CraftFloorCheckResponse)
async def check_craft_floor_endpoint(
    request: CraftFloorCheckRequest,
    db: AsyncSession = Depends(get_db),
):
    """Check craft floor rules before UI edit."""
    result = await check_craft_floor(
        file_path=request.file_path,
        content_before=request.content_before,
        content_after=request.content_after,
        design_system_id=request.design_system_id,
        db=db,
    )
    return result


@router.get("/craft-floor/rules", response_model=List[CraftFloorViolation])
async def list_craft_floor_rules(
    category: Optional[str] = None,
    severity: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """List craft floor rules with optional filtering."""
    query = select(CraftFloorRule)
    if category:
        query = query.where(CraftFloorRule.category == category)
    if severity:
        query = query.where(CraftFloorRule.severity == severity)

    result = await db.execute(query.order_by(CraftFloorRule.category, CraftFloorRule.rule_id))
    rules = result.scalars().all()

    return [
        CraftFloorViolation(
            rule_id=r.rule_id,
            category=r.category,
            severity=r.severity,
            title=r.title,
            description=r.description,
            fix_guidance=r.fix_guidance,
        )
        for r in rules
    ]