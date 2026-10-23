"""API router aggregation."""

from fastapi import APIRouter

from app.api import design_system

api_router = APIRouter()

api_router.include_router(design_system.router)

router = api_router