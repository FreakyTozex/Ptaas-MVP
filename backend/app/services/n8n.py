"""
N8nService — comunica com o n8n para disparar workflows de scan.
O FastAPI é o gateway; o n8n executa as automações pesadas.
"""
import httpx
from typing import Optional

from app.core.config import settings
from app.schemas.schemas import ScanCreate


class N8nService:

    def __init__(self):
        self.base_url = settings.N8N_BASE_URL
        self.headers = {"Content-Type": "application/json"}
        if settings.N8N_API_KEY:
            self.headers["X-N8N-API-KEY"] = settings.N8N_API_KEY

    async def trigger_scan(self, scan_id: str, payload: ScanCreate) -> Optional[str]:
        """Envia webhook ao n8n para iniciar workflow de scan RGPD."""
        callback_url = f"http://192.168.56.1:8000/api/v1/internal/scans/{scan_id}/progress"
        report_callback_url = f"http://192.168.56.1:8000/api/v1/internal/scans/{scan_id}/report"

        body = {
            "scan_id":             scan_id,
            "target_url":          str(payload.target_url),
            "scan_type":           payload.scan_type.value,
            "organization_id":     str(payload.organization_id),
            "options":             payload.options or {},
            "notify_email":        payload.notify_email,
            "callback_url":        callback_url,
            "report_callback_url": report_callback_url,
            "internal_token":      settings.INTERNAL_WEBHOOK_SECRET,
        }

        url = f"{self.base_url}{settings.N8N_WEBHOOK_SCAN_START}"

        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.post(url, json=body, headers=self.headers)
                resp.raise_for_status()
                data = resp.json()
                return data.get("executionId") or data.get("execution_id")
        except httpx.HTTPStatusError as e:
            raise RuntimeError(f"n8n devolveu erro {e.response.status_code}: {e.response.text}")
        except httpx.RequestError as e:
            raise RuntimeError(f"Não foi possível contactar o n8n: {e}")

    async def cancel_scan(self, scan_id: str, n8n_execution_id: Optional[str] = None) -> bool:
        body = {
            "scan_id":        scan_id,
            "execution_id":   n8n_execution_id,
            "internal_token": settings.INTERNAL_WEBHOOK_SECRET,
        }
        url = f"{self.base_url}{settings.N8N_WEBHOOK_SCAN_CANCEL}"
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(url, json=body, headers=self.headers)
                return resp.status_code == 200
        except httpx.RequestError:
            return False

    async def trigger_rescan(self, original_scan_id: str, new_scan_id: str, target_url: str) -> None:
        body = {
            "original_scan_id": original_scan_id,
            "new_scan_id":      new_scan_id,
            "target_url":       target_url,
            "internal_token":   settings.INTERNAL_WEBHOOK_SECRET,
        }
        url = f"{self.base_url}{settings.N8N_WEBHOOK_RESCAN}"
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(url, json=body, headers=self.headers)


n8n_service = N8nService()