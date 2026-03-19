"""
ScanService — lógica de negócio para scans.
Persiste no Supabase, delega automações ao n8n e executa ZAP localmente.
"""
import uuid
import asyncio
from datetime import datetime, timezone
from typing import Optional

from supabase import Client

from app.schemas.schemas import ScanCreate, ScanStatus, ScanProgressCallback, ScanReportCallback
from app.services.n8n import n8n_service
from app.services.zap import zap_service


class ScanService:

    def __init__(self, db: Client):
        self.db = db

    async def create(self, payload: ScanCreate, user_id: str) -> dict:
        scan_id = str(uuid.uuid4())
        record = {
            "id":              scan_id,
            "target_url":      str(payload.target_url),
            "scan_type":       payload.scan_type.value,
            "status":          ScanStatus.pending.value,
            "progress":        0,
            "organization_id": str(payload.organization_id),
            "created_by":      user_id,
            "notify_email":    payload.notify_email,
            "options":         payload.options or {},
        }

        result = self.db.table("scans").insert(record).execute()
        if not result.data:
            raise RuntimeError("Erro ao criar scan na base de dados")

        scan = result.data[0]

        # Disparar scan em background sem bloquear a resposta
        asyncio.create_task(self._run_scan(scan_id, payload))

        return scan

    async def _run_scan(self, scan_id: str, payload: ScanCreate) -> None:
        """Executa o scan completo: ZAP + callbacks ao Supabase."""
        target_url = str(payload.target_url)

        try:
            # 1. Marcar como running
            self._update_status(scan_id, ScanStatus.running, 5, "Scan iniciado")

            # 2. Spider — descoberta de páginas
            self._update_status(scan_id, ScanStatus.running, 15, "A descobrir páginas...")
            spider_id = await zap_service.spider(target_url)
            await zap_service.wait_spider(spider_id)

            # 3. Active scan
            self._update_status(scan_id, ScanStatus.running, 35, "A analisar vulnerabilidades...")
            active_id = await zap_service.active_scan(target_url)
            await zap_service.wait_active_scan(active_id)

            # 4. Obter alertas
            self._update_status(scan_id, ScanStatus.running, 70, "A processar resultados...")
            alerts = await zap_service.get_alerts(target_url)

            # 5. Converter para findings RGPD
            findings = zap_service.alerts_to_findings(alerts, scan_id)

            # 6. Inserir findings no Supabase
            if findings:
                self.db.table("findings").insert(findings).execute()

            self._update_status(scan_id, ScanStatus.running, 85, "A gerar relatório...")

            # 7. Calcular score e inserir relatório
            # Calcular score com média ponderada em vez de soma
            weights = {"critical": 30, "high": 15, "medium": 8, "low": 3, "info": 0}

            if findings:
                max_possible = len(findings) * 30  # se todos fossem critical
                total_ded = sum(weights.get(f["severity"], 0) for f in findings)
                # Normalizar: dedução proporcional ao número de findings
                deduction = min(80, (total_ded / max_possible) * 80) if max_possible > 0 else 0
                compliance_score = max(0.0, round(100.0 - deduction, 1))
            else:
                compliance_score = 100.0

            findings_count = {}
            for f in findings:
                findings_count[f["severity"]] = findings_count.get(f["severity"], 0) + 1

            summary = (
                f"Análise RGPD concluída via OWASP ZAP. Score: {compliance_score:.0f}/100. "
                f"{len(findings)} problema(s) encontrado(s)."
            )

            scan = self.db.table("scans").select("organization_id").eq("id", scan_id).single().execute()
            org_id = scan.data.get("organization_id") if scan.data else None

            self.db.table("reports").insert({
                "id":               str(uuid.uuid4()),
                "scan_id":          scan_id,
                "organization_id":  org_id,
                "compliance_score": compliance_score,
                "findings_count":   findings_count,
                "summary":          summary,
            }).execute()

            # 8. Marcar como completed
            self._update_status(scan_id, ScanStatus.completed, 100, "Concluído")

            # 9. Limpar sessão ZAP
            await zap_service.cleanup()

        except Exception as e:
            print(f"[ERROR] Scan {scan_id} falhou: {e}")
            self._update_status(scan_id, ScanStatus.failed, 0, str(e))

    def _update_status(self, scan_id: str, status: ScanStatus, progress: int, message: str = "") -> None:
        patch = {"status": status.value, "progress": progress}
        if status == ScanStatus.running:
            existing = self.db.table("scans").select("started_at").eq("id", scan_id).single().execute()
            if existing.data and not existing.data.get("started_at"):
                patch["started_at"] = datetime.now(timezone.utc).isoformat()
        if status in (ScanStatus.completed, ScanStatus.failed, ScanStatus.cancelled):
            patch["finished_at"] = datetime.now(timezone.utc).isoformat()
        print(f"[SCAN {scan_id[:8]}] {status.value} {progress}% — {message}")
        self.db.table("scans").update(patch).eq("id", scan_id).execute()

    def get(self, scan_id: str, organization_id: str) -> Optional[dict]:
        result = (
            self.db.table("scans")
            .select("*")
            .eq("id", scan_id)
            .eq("organization_id", organization_id)
            .single()
            .execute()
        )
        return result.data

    def list(self, organization_id: str, limit: int = 20, offset: int = 0) -> tuple[list, int]:
        result = (
            self.db.table("scans")
            .select("*", count="exact")
            .eq("organization_id", organization_id)
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return result.data or [], result.count or 0

    async def cancel(self, scan_id: str, organization_id: str) -> dict:
        scan = self.get(scan_id, organization_id)
        if not scan:
            raise ValueError("Scan não encontrado")
        if scan["status"] not in (ScanStatus.pending.value, ScanStatus.running.value):
            raise ValueError("Só é possível cancelar scans pending ou running")

        await n8n_service.cancel_scan(scan_id, scan.get("n8n_execution_id"))
        result = (
            self.db.table("scans")
            .update({"status": ScanStatus.cancelled.value})
            .eq("id", scan_id)
            .execute()
        )
        return result.data[0]

    def get_findings(self, scan_id: str) -> list:
        result = (
            self.db.table("findings")
            .select("*")
            .eq("scan_id", scan_id)
            .order("severity")
            .execute()
        )
        return result.data or []

    def get_report(self, scan_id: str) -> Optional[dict]:
        result = (
            self.db.table("reports")
            .select("*")
            .eq("scan_id", scan_id)
            .single()
            .execute()
        )
        return result.data

    def apply_progress_update(self, update: ScanProgressCallback) -> dict:
        patch = {"status": update.status.value, "progress": update.progress}
        if update.status == ScanStatus.running:
            existing = self.db.table("scans").select("started_at").eq("id", str(update.scan_id)).single().execute()
            if not existing.data.get("started_at"):
                patch["started_at"] = datetime.now(timezone.utc).isoformat()
        if update.status in (ScanStatus.completed, ScanStatus.failed, ScanStatus.cancelled):
            patch["finished_at"] = datetime.now(timezone.utc).isoformat()
        if update.n8n_execution_id:
            patch["n8n_execution_id"] = update.n8n_execution_id
        result = self.db.table("scans").update(patch).eq("id", str(update.scan_id)).execute()
        if update.findings:
            findings_records = [{"id": str(uuid.uuid4()), "scan_id": str(update.scan_id), **f} for f in update.findings]
            self.db.table("findings").insert(findings_records).execute()
        return result.data[0] if result.data else {}

    def apply_report(self, report: ScanReportCallback) -> dict:
        scan = self.db.table("scans").select("organization_id").eq("id", str(report.scan_id)).single().execute()
        org_id = scan.data.get("organization_id") if scan.data else None
        record = {
            "id":               str(uuid.uuid4()),
            "scan_id":          str(report.scan_id),
            "organization_id":  org_id,
            "compliance_score": report.compliance_score,
            "findings_count":   report.findings_count,
            "summary":          report.summary,
            "pdf_url":          report.pdf_url,
        }
        result = self.db.table("reports").insert(record).execute()
        self.db.table("scans").update({"status": ScanStatus.completed.value, "progress": 100}).eq("id", str(report.scan_id)).execute()
        return result.data[0] if result.data else {}