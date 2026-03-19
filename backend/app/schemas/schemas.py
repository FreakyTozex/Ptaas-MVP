from pydantic import BaseModel, HttpUrl, EmailStr, Field
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime
import uuid


# ══════════════════════════════════════════════════════════════
# Enums
# ══════════════════════════════════════════════════════════════

class ScanStatus(str, Enum):
    pending   = "pending"
    running   = "running"
    completed = "completed"
    failed    = "failed"
    cancelled = "cancelled"

class ScanType(str, Enum):
    cookies        = "cookies"
    privacy_policy = "privacy_policy"
    data_transfers = "data_transfers"
    forms          = "forms"
    full           = "full"

class Severity(str, Enum):
    critical = "critical"
    high     = "high"
    medium   = "medium"
    low      = "low"
    info     = "info"

class ConsentStatus(str, Enum):
    compliant     = "compliant"
    non_compliant = "non_compliant"
    partial       = "partial"
    unknown       = "unknown"


# ══════════════════════════════════════════════════════════════
# Auth
# ══════════════════════════════════════════════════════════════

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    organization_name: str
    nif: Optional[str] = None


# ══════════════════════════════════════════════════════════════
# Organizations
# ══════════════════════════════════════════════════════════════

class OrganizationCreate(BaseModel):
    name: str
    nif: Optional[str] = None
    contact_email: EmailStr

class OrganizationOut(BaseModel):
    id: uuid.UUID
    name: str
    nif: Optional[str]
    contact_email: str
    owner_id: uuid.UUID
    created_at: datetime


# ══════════════════════════════════════════════════════════════
# Scans
# ══════════════════════════════════════════════════════════════

class ScanCreate(BaseModel):
    target_url: HttpUrl
    scan_type: ScanType = ScanType.full
    organization_id: uuid.UUID
    notify_email: Optional[EmailStr] = None
    options: Optional[Dict[str, Any]] = Field(default_factory=dict)

class ScanOut(BaseModel):
    id: uuid.UUID
    target_url: str
    scan_type: ScanType
    status: ScanStatus
    progress: int
    organization_id: uuid.UUID
    created_by: uuid.UUID
    notify_email: Optional[str]
    n8n_execution_id: Optional[str]
    started_at: Optional[datetime]
    finished_at: Optional[datetime]
    created_at: datetime


# ══════════════════════════════════════════════════════════════
# Findings
# ══════════════════════════════════════════════════════════════

class FindingOut(BaseModel):
    id: uuid.UUID
    scan_id: uuid.UUID
    title: str
    description: Optional[str]
    severity: Severity
    category: str
    rgpd_article: Optional[str]
    evidence: Optional[Dict[str, Any]]
    recommendation: Optional[str]
    detected_at: datetime


# ══════════════════════════════════════════════════════════════
# Reports
# ══════════════════════════════════════════════════════════════

class ReportOut(BaseModel):
    id: uuid.UUID
    scan_id: uuid.UUID
    organization_id: uuid.UUID
    summary: Optional[str]
    compliance_score: float
    findings_count: Dict[str, int]
    pdf_url: Optional[str]
    created_at: datetime


# ══════════════════════════════════════════════════════════════
# Consent Management (Securiti.ai)
# ══════════════════════════════════════════════════════════════

class ConsentDomainCreate(BaseModel):
    domain: str
    organization_id: uuid.UUID
    language: str = "pt"
    regulation: str = "gdpr"
    notify_email: Optional[EmailStr] = None

class ConsentDomainOut(BaseModel):
    id: str
    domain: str
    organization_id: uuid.UUID
    regulation: str
    language: str
    banner_script_url: Optional[str]
    status: ConsentStatus
    last_scan_at: Optional[datetime]
    created_at: datetime

class ConsentScanOut(BaseModel):
    domain_id: str
    domain: str
    status: ConsentStatus
    total_cookies: int
    categorized_cookies: Dict[str, int]
    unconsented_trackers: int
    issues: List[Dict[str, Any]]
    rgpd_articles_violated: List[str]
    scanned_at: datetime

class BannerConfigUpdate(BaseModel):
    domain_id: str
    primary_color: Optional[str] = "#1a1a2e"
    position: Optional[str] = "bottom"
    show_reject_all: bool = True
    categories_enabled: List[str] = Field(
        default_factory=lambda: ["necessary", "analytics", "marketing", "preferences"]
    )
    custom_text: Optional[Dict[str, str]] = None


# ══════════════════════════════════════════════════════════════
# Callbacks internos (n8n → FastAPI)
# ══════════════════════════════════════════════════════════════

class ScanProgressCallback(BaseModel):
    scan_id: uuid.UUID
    status: ScanStatus
    progress: int = Field(ge=0, le=100)
    message: Optional[str] = None
    findings: Optional[List[Dict[str, Any]]] = []
    n8n_execution_id: Optional[str] = None

class ScanReportCallback(BaseModel):
    scan_id: uuid.UUID
    compliance_score: float = Field(ge=0.0, le=100.0)
    findings_count: Dict[str, int]
    summary: str
    pdf_url: Optional[str] = None