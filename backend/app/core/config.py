from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # ── App ───────────────────────────────────────────────────
    APP_NAME: str = "PTaaS RGPD Scanner"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"  # development | staging | production

    # ── Supabase ──────────────────────────────────────────────
    SUPABASE_URL: str
    SUPABASE_KEY: str            # service_role key (backend-only)
    SUPABASE_JWT_SECRET: str     # validar JWTs dos utilizadores

    # ── n8n ───────────────────────────────────────────────────
    N8N_BASE_URL: str = "http://localhost:5678"
    N8N_API_KEY: str = ""

    N8N_WEBHOOK_SCAN_START:  str = "/webhook/scan-start"
    N8N_WEBHOOK_SCAN_CANCEL: str = "/webhook/scan-cancel"
    N8N_WEBHOOK_RESCAN:      str = "/webhook/rescan"

    # ── Securiti.ai ───────────────────────────────────────────
    SECURITI_API_URL: str = "https://app.securiti.ai/api/v1"
    SECURITI_API_KEY: str
    SECURITI_ORG_ID: str

    # ── CORS ──────────────────────────────────────────────────
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "https://app.ptaas.io",
    ]

    # ── Segurança interna ─────────────────────────────────────
    # Token partilhado entre FastAPI e n8n para callbacks internos
    # Gerar: python -c "import secrets; print(secrets.token_hex(32))"
    INTERNAL_WEBHOOK_SECRET: str

    class Config:
        env_file = ".env"


settings = Settings()