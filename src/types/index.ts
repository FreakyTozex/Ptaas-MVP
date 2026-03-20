export type ScanStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
export type ScanType   = 'cookies' | 'privacy_policy' | 'data_transfers' | 'forms' | 'full'
export type Severity   = 'critical' | 'high' | 'medium' | 'low' | 'info'
export type ConsentStatus = 'compliant' | 'non_compliant' | 'partial' | 'unknown'

export interface Scan {
  id: string
  target_url: string
  scan_type: ScanType
  status: ScanStatus
  progress: number
  organization_id: string
  created_by: string
  notify_email?: string
  n8n_execution_id?: string
  started_at?: string
  finished_at?: string
  created_at: string
}

export interface Finding {
  id: string
  scan_id: string
  title: string
  description?: string
  severity: Severity
  category: string
  rgpd_article?: string
  evidence?: Record<string, unknown>
  recommendation?: string
  detected_at: string
}

export interface Report {
  id: string
  scan_id: string
  organization_id: string
  summary?: string
  compliance_score: number
  findings_count: Record<string, number>
  pdf_url?: string
  created_at: string
}

export interface ConsentDomain {
  id: string
  domain: string
  organization_id: string
  regulation: string
  language: string
  banner_script_url?: string
  status: ConsentStatus
  last_scan_at?: string
  created_at: string
}

export interface Organization {
  id: string
  name: string
  nif?: string
  contact_email: string
  owner_id: string
  created_at: string
}