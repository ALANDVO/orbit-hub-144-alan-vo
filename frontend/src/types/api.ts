/** API Types for Orbit Hub */

export interface DesignSystem {
  id: number;
  name: string;
  root_path: string;
  created_at: string;
  updated_at: string;
  type_scale?: TokenGroup;
  color_palette?: TokenGroup;
  spacing?: TokenGroup;
  component_patterns?: TokenGroup;
  design_md?: string;
}

export interface TokenGroup {
  tokens: Token[];
  total_occurrences: number;
  unique_values: number;
}

export interface Token {
  value: string;
  count: number;
}

export interface DesignSystemList {
  items: DesignSystem[];
  total: number;
  page: number;
  page_size: number;
}

export interface DesignAudit {
  id: number;
  design_system_id: number;
  target_path: string;
  target_url?: string;
  is_rtl: boolean;
  created_at: string;
  a11y_score: number;
  performance_score: number;
  theming_score: number;
  responsive_score: number;
  integrity_score: number;
  i18n_score: number;
  findings?: AuditFindings;
}

export interface AuditFindings {
  total: number;
  by_category: Record<string, string[]>;
  items: AuditFinding[];
}

export interface AuditFinding {
  rule_id: string;
  category: string;
  severity: 'violation' | 'warning' | 'advisory';
  title: string;
  description: string;
  selector: string;
  property: string;
  value: string;
  logical_equivalent: string;
  line?: number;
}

export interface DesignAuditList {
  items: DesignAudit[];
  total: number;
  page: number;
  page_size: number;
}

export interface CraftFloorCheckRequest {
  file_path: string;
  content_before: string;
  content_after: string;
  design_system_id?: number;
}

export interface CraftFloorViolation {
  rule_id: string;
  category: string;
  severity: 'ban' | 'warning' | 'advisory';
  title: string;
  description: string;
  location?: string;
  fix_guidance?: string;
}

export interface CraftFloorCheckResponse {
  passed: boolean;
  violations: CraftFloorViolation[];
  warnings: CraftFloorViolation[];
  advisories: CraftFloorViolation[];
}

export interface ExtractRequest {
  root_path: string;
  name?: string;
  include_patterns?: string[];
  exclude_patterns?: string[];
}

export interface ExtractResponse {
  design_system_id: number;
  name: string;
  type_scale: TokenGroup;
  color_palette: TokenGroup;
  spacing: TokenGroup;
  component_patterns: TokenGroup;
  design_md: string;
}

export interface AuditRequest {
  design_system_id: number;
  target_path: string;
  target_url?: string;
  is_rtl?: boolean;
  html_content?: string;
}

export interface AuditResponse {
  audit_id: number;
  scores: Record<string, number>;
  findings: AuditFindings;
  total_score: number;
  max_score: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}