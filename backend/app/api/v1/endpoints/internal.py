"""
Endpoints internos — usados exclusivamente pelo n8n para reportar
progresso e resultados. Protegidos por X-Internal-Token.
Não aparecem na documentação Swagger (include_in_schema=False).
"""
from fastapi import APIRouter, Depends
import uuid

from app.core.supabase import get_supabase, verify_internal_token
from app.schemas.schemas import ScanProgressCallback, ScanReportCallback
from app.services.scan import ScanService

router = APIRouter(prefix="/internal", tags=["Internal"])


def get_svc(db=Depends(get_supabase)) -> ScanService:
    return ScanService(db)


@router.post(
    "/scans/{scan_id}/progress",
    include_in_schema=False,
    dependencies=[Depends(verify_internal_token)],
)
def scan_progress(
    scan_id: uuid.UUID,
    update: ScanProgressCallback,
    svc: ScanService = Depends(get_svc),
):
    """n8n reporta progresso e findings parciais do scan."""
    update.scan_id = scan_id
    return svc.apply_progress_update(update)


@router.post(
    "/scans/{scan_id}/report",
    include_in_schema=False,
    dependencies=[Depends(verify_internal_token)],
)
def scan_report(
    scan_id: uuid.UUID,
    report: ScanReportCallback,
    svc: ScanService = Depends(get_svc),
):
    """n8n notifica que o relatório PDF está pronto."""
    report.scan_id = scan_id
    return svc.apply_report(report)