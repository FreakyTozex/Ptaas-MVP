"""
SecuritiService — integração com a API do Securiti.ai.
Responsabilidade: Gestão de Consentimentos (Cookie Banner, RGPD Art. 7).
"""
import httpx
from datetime import datetime, timezone

from app.core.config import settings
from app.schemas.schemas import (
    ConsentDomainCreate, ConsentDomainOut, ConsentScanOut,
    BannerConfigUpdate, ConsentStatus,
)


class SecuritiService:

    def __init__(self):
        self.base_url = settings.SECURITI_API_URL
        self.headers = {
            "Authorization": f"Bearer {settings.SECURITI_API_KEY}",
            "Content-Type":  "application/json",
            "X-Org-Id":      settings.SECURITI_ORG_ID,
        }

    async def register_domain(self, payload: ConsentDomainCreate) -> ConsentDomainOut:
        body = {
            "domain":          payload.domain,
            "language":        payload.language,
            "regulation":      payload.regulation,
            "notify_email":    payload.notify_email,
            "auto_categorize": True,
        }
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{self.base_url}/consent/domains", json=body, headers=self.headers
            )
            resp.raise_for_status()
            data = resp.json()

        return ConsentDomainOut(
            id=data["id"],
            domain=data["domain"],
            organization_id=payload.organization_id,
            regulation=data.get("regulation", payload.regulation),
            language=data.get("language", payload.language),
            banner_script_url=data.get("banner_script_url"),
            status=ConsentStatus.unknown,
            last_scan_at=None,
            created_at=datetime.now(timezone.utc),
        )

    async def list_domains(self, organization_id: str) -> list:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{self.base_url}/consent/domains",
                headers=self.headers,
                params={"org_id": organization_id},
            )
            resp.raise_for_status()
            return resp.json().get("domains", [])

    async def scan_domain(self, domain_id: str) -> ConsentScanOut:
        """Dispara scan de consentimento e aguarda resultado (polling)."""
        async with httpx.AsyncClient(timeout=15) as client:
            start_resp = await client.post(
                f"{self.base_url}/consent/domains/{domain_id}/scan",
                headers=self.headers,
            )
            start_resp.raise_for_status()
            scan_data = start_resp.json()

        scan_id = scan_data["scan_id"]

        import asyncio
        status_data = {}
        for _ in range(30):
            await asyncio.sleep(10)
            async with httpx.AsyncClient(timeout=10) as client:
                status_resp = await client.get(
                    f"{self.base_url}/consent/scans/{scan_id}", headers=self.headers
                )
                status_data = status_resp.json()
                if status_data.get("status") in ("completed", "failed"):
                    break

        results = status_data.get("results", {})
        rgpd_articles = self._map_issues_to_articles(results.get("issues", []))

        return ConsentScanOut(
            domain_id=domain_id,
            domain=status_data.get("domain", ""),
            status=ConsentStatus.non_compliant if results.get("issues") else ConsentStatus.compliant,
            total_cookies=results.get("total_cookies", 0),
            categorized_cookies=results.get("categories", {}),
            unconsented_trackers=results.get("unconsented_trackers", 0),
            issues=results.get("issues", []),
            rgpd_articles_violated=rgpd_articles,
            scanned_at=datetime.now(timezone.utc),
        )

    async def get_domain_status(self, domain_id: str) -> dict:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{self.base_url}/consent/domains/{domain_id}/status",
                headers=self.headers,
            )
            resp.raise_for_status()
            return resp.json()

    async def update_banner_config(self, config: BannerConfigUpdate) -> dict:
        body = {
            "appearance": {
                "primary_color": config.primary_color,
                "position":      config.position,
            },
            "behavior": {
                "show_reject_all":    config.show_reject_all,
                "categories_enabled": config.categories_enabled,
            },
            "custom_text": config.custom_text or {},
        }
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.put(
                f"{self.base_url}/consent/domains/{config.domain_id}/banner",
                json=body, headers=self.headers,
            )
            resp.raise_for_status()
            return resp.json()

    async def get_banner_snippet(self, domain_id: str) -> dict:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{self.base_url}/consent/domains/{domain_id}/snippet",
                headers=self.headers,
            )
            resp.raise_for_status()
            return resp.json()

    async def get_consent_report(self, domain_id: str) -> dict:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{self.base_url}/consent/domains/{domain_id}/report",
                headers=self.headers,
            )
            resp.raise_for_status()
            return resp.json()

    def _map_issues_to_articles(self, issues: list) -> list[str]:
        articles = set()
        for issue in issues:
            category = issue.get("category", "").lower()
            if "consent" in category or "banner" in category:
                articles.add("Art. 7")
            if "information" in category or "transparency" in category:
                articles.add("Art. 13")
            if "third_party" in category or "transfer" in category:
                articles.add("Art. 28")
            if "cookie" in category and "necessary" not in category:
                articles.add("Art. 5(1)(a)")
        return sorted(articles)


securiti_service = SecuritiService()