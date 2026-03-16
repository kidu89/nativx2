
/**
 * NativX API Client
 * Replaces Supabase Client for local/intranet deployments
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    full_name?: string;
  };
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('nativx_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('nativx_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nativx_token');
    }
  }

  getToken() {
    return this.token;
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = new Headers(options.headers || {});

    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    if (!(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.clearToken();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.detail || data.error || 'Request failed');
    }

    return data;
  }

  // Auth methods
  async login(email: string, password: string) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.access_token);
    return data;
  }

  async signup(email: string, password: string, full_name?: string) {
    const data = await this.request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name }),
    });
    this.setToken(data.access_token);
    return data;
  }

  async getMe() {
    return this.request('/api/health'); // Using health check as a simple session check for now
  }
}

export const apiClient = new ApiClient();
