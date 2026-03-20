from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.api.v1.router import api_router
from app.middlewares.logging import LoggingMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🛡️  PTaaS API — A iniciar...")
    yield
    print("PTaaS API — A encerrar.")


app = FastAPI(
    title="PTaaS — API Gateway",
    description="""
    API Gateway do PTaaS RGPD Scanner.

    ## Stack
    - **FastAPI** — API Gateway e validação
    - **n8n** — Orquestração de workflows e relatórios
    - **Supabase** — PostgreSQL + Auth + Realtime + Storage
    - **Securiti.ai** — Gestão de Consentimentos (Cookies / RGPD Art. 7)
    - **OWASP ZAP** — Scanner de vulnerabilidades (RGPD Art. 5, 25, 32)
    """,
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(LoggingMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health", tags=["Health"])
async def health():
    return {
        "status": "ok",
        "service": "PTaaS API Gateway",
        "version": "2.0.0",
    }