/**
 * STEMotion Front-End - Base API Client
 * Supports dual-mode: Real REST API (BE) & In-Memory Mock Mode
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

export class ApiError extends Error {
  code: string;
  status: number;
  details?: any;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', status: number = 500, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

const TOKEN_KEY = 'stemotion_access_token';

export const apiClient = {
  getBaseUrl(): string {
    return (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
  },

  isMockMode(): boolean {
    const mockEnv = (import.meta as any).env?.VITE_USE_MOCK;
    return mockEnv === undefined || mockEnv === 'true' || mockEnv === true;
  },

  getAuthToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setAuthToken(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
      console.error('Failed to store auth token', e);
    }
  },

  removeAuthToken(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      console.error('Failed to remove auth token', e);
    }
  },

  async mockDelay(ms: number = 250): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.getBaseUrl()}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    const token = this.getAuthToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...((options.headers as Record<string, string>) || {}),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const json = await response.json();

      if (!response.ok || json.success === false) {
        throw new ApiError(
          json.error?.message || response.statusText || 'API Request Failed',
          json.error?.code || `HTTP_${response.status}`,
          response.status,
          json.error?.details
        );
      }

      return json.data !== undefined ? json.data : json;
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(error.message || 'Lỗi kết nối mạng đến máy chủ Backend', 'NETWORK_ERROR', 0);
    }
  },

  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  },

  async post<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  },

  async put<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  },

  async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  },
};
