from fastapi import APIRouter
from app.api.v1.endpoints import auth, organizations, scans, consent, internal

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(organizations.router)
api_router.include_router(scans.router)
api_router.include_router(consent.router)
api_router.include_router(internal.router)