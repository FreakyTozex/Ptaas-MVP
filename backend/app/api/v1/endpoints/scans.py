from fastapi import APIRouter, Depends, HTTPException, status, Query
import uuid

from app.core.supabase import get_supabase, get_current_user
from app.schemas.schemas import ScanCreate
from app.services.scan import ScanService

router = APIRouter(prefix="/scans", tags=["Scans"])


def get_svc(db=Depends(get_supabase)) -> ScanService:
    return ScanService(db)


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_scan(
    payload: ScanCreate,
    user: dict = Depends(get_current_user),
    svc: ScanService = Depends(get_svc),
):
    """Cria e dispara um novo scan RGPD via n8n."""
    try:
        return await svc.create(payload, user["id"])
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
def list_scans(
    organization_id: uuid.UUID = Query(...),
    limit:  int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user: dict = Depends(get_current_user),
    svc: ScanService = Depends(get_svc),
):
    items, total = svc.list(str(organization_id), limit, offset)
    return {"items": items, "total": total, "limit": limit, "offset": offset}


@router.get("/{scan_id}")
def get_scan(
    scan_id: uuid.UUID,
    organization_id: uuid.UUID = Query(...),
    user: dict = Depends(get_current_user),
    svc: ScanService = Depends(get_svc),
):
    scan = svc.get(str(scan_id), str(organization_id))
    if not scan:
        raise HTTPException(status_code=404, detail="Scan não encontrado")
    return scan


@router.delete("/{scan_id}")
async def cancel_scan(
    scan_id: uuid.UUID,
    organization_id: uuid.UUID = Query(...),
    user: dict = Depends(get_current_user),
    svc: ScanService = Depends(get_svc),
):
    try:
        return await svc.cancel(str(scan_id), str(organization_id))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{scan_id}/findings")
def get_findings(
    scan_id: uuid.UUID,
    user: dict = Depends(get_current_user),
    svc: ScanService = Depends(get_svc),
):
    return svc.get_findings(str(scan_id))


@router.get("/{scan_id}/report")
def get_report(
    scan_id: uuid.UUID,
    user: dict = Depends(get_current_user),
    svc: ScanService = Depends(get_svc),
):
    report = svc.get_report(str(scan_id))
    if not report:
        raise HTTPException(status_code=404, detail="Relatório ainda não disponível")
    return report