/** API Client for Orbit Hub */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  DesignSystem,
  DesignSystemList,
  DesignAudit,
  DesignAuditList,
  ExtractRequest,
  ExtractResponse,
  AuditRequest,
  AuditResponse,
  CraftFloorCheckRequest,
  CraftFloorCheckResponse,
  CraftFloorViolation,
} from '../types/api';

const API_BASE = '/api/v1';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // For cookie-based auth
    });

    // Request interceptor for CSRF token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const csrfToken = sessionStorage.getItem('csrf_token');
        if (csrfToken && config.method !== 'get') {
          config.headers['X-CSRF-Token'] = csrfToken;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for auth errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Clear auth state
          sessionStorage.removeItem('csrf_token');
          // Redirect to login if not already there
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Design Systems
  async listDesignSystems(page = 1, pageSize = 20): Promise<DesignSystemList> {
    const response = await this.client.get('/design-systems', {
      params: { page, page_size: pageSize },
    });
    return response.data;
  }

  async getDesignSystem(id: number): Promise<DesignSystem> {
    const response = await this.client.get(`/design-systems/${id}`);
    return response.data;
  }

  async createDesignSystem(data: { name: string; root_path: string }): Promise<DesignSystem> {
    const response = await this.client.post('/design-systems', data);
    return response.data;
  }

  async updateDesignSystem(id: number, data: Partial<DesignSystem>): Promise<DesignSystem> {
    const response = await this.client.patch(`/design-systems/${id}`, data);
    return response.data;
  }

  async deleteDesignSystem(id: number): Promise<void> {
    await this.client.delete(`/design-systems/${id}`);
  }

  // Extraction
  async extractDesignSystem(request: ExtractRequest): Promise<ExtractResponse> {
    const response = await this.client.post('/design-systems/extract', request);
    return response.data;
  }

  // Audits
  async listAudits(designSystemId: number, page = 1, pageSize = 20): Promise<DesignAuditList> {
    const response = await this.client.get(`/design-systems/${designSystemId}/audits`, {
      params: { page, page_size: pageSize },
    });
    return response.data;
  }

  async getAudit(designSystemId: number, auditId: number): Promise<DesignAudit> {
    const response = await this.client.get(`/design-systems/${designSystemId}/audits/${auditId}`);
    return response.data;
  }

  async runAudit(request: AuditRequest): Promise<AuditResponse> {
    const response = await this.client.post(
      `/design-systems/${request.design_system_id}/audit`,
      request
    );
    return response.data;
  }

  // Craft Floor
  async checkCraftFloor(request: CraftFloorCheckRequest): Promise<CraftFloorCheckResponse> {
    const response = await this.client.post('/design-systems/craft-floor/check', request);
    return response.data;
  }

  async listCraftFloorRules(category?: string, severity?: string): Promise<CraftFloorViolation[]> {
    const response = await this.client.get('/design-systems/craft-floor/rules', {
      params: { category, severity },
    });
    return response.data;
  }

  // Health
  async healthCheck(): Promise<{ status: string; service: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }

  // Auth
  setCsrfToken(token: string) {
    sessionStorage.setItem('csrf_token', token);
  }

  clearCsrfToken() {
    sessionStorage.removeItem('csrf_token');
  }
}

export const api = new ApiClient();