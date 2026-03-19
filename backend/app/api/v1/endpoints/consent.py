from fastapi import APIRouter, Depends, HTTPException, status

from app.core.supabase import get_current_user
from app.schemas.schemas import ConsentDomainCreate, BannerConfigUpdate
from app.services.securiti import securiti_service

router = APIRouter(prefix="/consent", tags=["Gestão de Consentimento (Securiti.ai)"])


@router.post("/domains", status_code=status.HTTP_201_CREATED)
async def register_domain(
    payload: ConsentDomainCreate,
    user: dict = Depends(get_current_user),
):
    """Regista um domínio no Securiti.ai e gera o script do banner de cookies."""
    try:
        return await securiti_service.register_domain(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro Securiti.ai: {e}")


@router.get("/domains")
async def list_domains(
    organization_id: str,
    user: dict = Depends(get_current_user),
):
    try:
        return await securiti_service.list_domains(organization_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/domains/{domain_id}/scan", status_code=status.HTTP_202_ACCEPTED)
async def scan_consent(
    domain_id: str,
    user: dict = Depends(get_current_user),
):
    """Dispara scan de cookies e conformidade RGPD Art. 7 no Securiti.ai."""
    try:
        return await securiti_service.scan_domain(domain_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/domains/{domain_id}/status")
async def domain_status(
    domain_id: str,
    user: dict = Depends(get_current_user),
):
    try:
        return await securiti_service.get_domain_status(domain_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/domains/{domain_id}/snippet")
async def get_banner_snippet(
    domain_id: str,
    user: dict = Depends(get_current_user),
):
    """Devolve o snippet JS a incluir no site para o banner de cookies."""
    try:
        return await securiti_service.get_banner_snippet(domain_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/domains/banner")
async def update_banner(
    config: BannerConfigUpdate,
    user: dict = Depends(get_current_user),
):
    """Atualiza cores, posição e categorias do banner de cookies."""
    try:
        return await securiti_service.update_banner_config(config)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/domains/{domain_id}/report")
async def consent_report(
    domain_id: str,
    user: dict = Depends(get_current_user),
):
    """Relatório detalhado de conformidade de consentimento."""
    try:
        return await securiti_service.get_consent_report(domain_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))