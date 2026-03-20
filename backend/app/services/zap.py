"""
ZapService — integração com OWASP ZAP local.
Chamado pelo endpoint interno quando o n8n dispara um scan.
"""
import httpx
import asyncio
from typing import List, Dict, Any
from app.core.config import settings

#ZAP_URL    = "http://localhost:8080"
#ZAP_APIKEY = "ptaas-zap-key"

ZAP_URL    = settings.ZAP_URL
ZAP_APIKEY = settings.ZAP_API_KEY

class ZapService:

    async def _get(self, path: str, params: dict = {}) -> dict:
        params["apikey"] = ZAP_APIKEY
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(f"{ZAP_URL}{path}", params=params)
            resp.raise_for_status()
            return resp.json()

    async def spider(self, target_url: str) -> str:
        """Inicia spider e devolve scan_id do ZAP."""
        data = await self._get("/JSON/spider/action/scan/", {
            "url": target_url, "maxChildren": "5", "recurse": "true"
        })
        return data.get("scan", "0")

    async def wait_spider(self, spider_id: str, timeout: int = 60) -> None:
        """Aguarda spider terminar."""
        for _ in range(timeout // 2):
            await asyncio.sleep(2)
            data = await self._get("/JSON/spider/view/status/", {"scanId": spider_id})
            if int(data.get("status", 0)) >= 100:
                return

    async def active_scan(self, target_url: str) -> str:
        """Inicia active scan e devolve scan_id do ZAP."""
        data = await self._get("/JSON/ascan/action/scan/", {
            "url": target_url, "recurse": "true"
        })
        return data.get("scan", "0")

    async def wait_active_scan(self, scan_id: str, timeout: int = 120) -> None:
        """Aguarda active scan terminar."""
        for _ in range(timeout // 3):
            await asyncio.sleep(3)
            data = await self._get("/JSON/ascan/view/status/", {"scanId": scan_id})
            if int(data.get("status", 0)) >= 100:
                return

    async def get_alerts(self, target_url: str) -> List[Dict[str, Any]]:
        """Obtém todos os alertas do ZAP para o URL."""
        data = await self._get("/JSON/core/view/alerts/", {
            "baseurl": target_url, "start": "0", "count": "200"
        })
        return data.get("alerts", [])

    async def cleanup(self) -> None:
        """Limpa sessão do ZAP."""
        try:
            await self._get("/JSON/core/action/deleteAllAlerts/")
        except Exception:
            pass

    def alerts_to_findings(self, alerts: List[Dict], scan_id: str) -> List[Dict]:
        """Converte alertas ZAP em findings RGPD."""
        risk_map = {"3": "critical", "2": "high", "1": "medium", "0": "low"}

        def to_rgpd(name: str):
            n = name.lower()
            if "cookie"     in n: return "Art. 7"
            if "csrf"       in n: return "Art. 5"
            if "xss"        in n: return "Art. 5"
            if "injection"  in n: return "Art. 25"
            if "ssl" or "tls" in n: return "Art. 32"
            if "header"     in n: return "Art. 32"
            if "information" in n: return "Art. 13"
            return None

        findings = []
        for alert in alerts:
            findings.append({
                "scan_id":       scan_id,
                "title":         alert.get("name", alert.get("alert", "Unknown")),
                "description":   alert.get("description", ""),
                "severity":      risk_map.get(str(alert.get("riskcode", "0")), "info"),
                "category":      f"CWE-{alert.get('cweid', 'N/A')}",
                "rgpd_article":  to_rgpd(alert.get("name", "")),
                "evidence":      {
                    "url":      alert.get("url", ""),
                    "param":    alert.get("param", ""),
                    "evidence": alert.get("evidence", ""),
                },
                "recommendation": alert.get("solution", ""),
            })

        if not findings:
            findings.append({
                "scan_id":        scan_id,
                "title":          "Scan concluído sem alertas críticos",
                "description":    "O OWASP ZAP não detetou vulnerabilidades críticas.",
                "severity":       "info",
                "category":       "security",
                "rgpd_article":   None,
                "evidence":       {},
                "recommendation": "Continue a monitorizar regularmente.",
            })

        return findings


zap_service = ZapService()