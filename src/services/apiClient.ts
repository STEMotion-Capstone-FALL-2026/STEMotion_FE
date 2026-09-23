/**
 * STEMotion Front-End - Base API Client
 * Talks to the Spring Boot API. Failures surface as ApiError so the UI can
 * tell the user what went wrong instead of showing invented data.
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
    return (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
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

      const raw = await response.text();
      const json = raw ? JSON.parse(raw) : {};

      // An expired or revoked token invalidates the whole session, so drop it
      // and let the app fall back to the login screen instead of leaving the
      // studio half-loaded and every later request failing the same way.
      if (response.status === 401) {
        this.removeAuthToken();
        window.dispatchEvent(new CustomEvent('stemotion:unauthorized'));
      }

      if (!response.ok || json.success === false) {
        throw new ApiError(
          json.error?.message || json.message || response.statusText || 'API Request Failed',
          json.error?.code || json.code || `HTTP_${response.status}`,
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

  async patch<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  },

  async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  },
};
