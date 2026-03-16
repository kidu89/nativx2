/**
 * AppWeaver INFINITY - API Client
 * Axios configuration with relative paths for Nginx proxying
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

// CRITICAL: Use relative path for Nginx proxying
const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 60000, // 60 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
    }
    return Promise.reject(error);
  }
);

// API Types
export interface BuildRequest {
  app_name: string;
  package_name: string;
  app_url: string;
  platform: 'android' | 'ios' | 'both';
  primary_color?: string;
  secondary_color?: string;
  version_name?: string;
  version_code?: number;
}

export interface BuildResponse {
  project_id: string;
  task_id: string;
  status: string;
  message: string;
}

export interface ProjectStatus {
  project_id: string;
  app_name: string;
  status: 'pending' | 'queued' | 'building' | 'processing' | 'success' | 'failed' | 'cancelled';
  platform: string;
  android_apk_url: string | null;
  android_aab_url: string | null;
  ios_ipa_url: string | null;
  error: string | null;
  build_duration: number | null;
  created_at: string;
  updated_at: string;
}

// API Functions
export const buildApi = {
  // Health check
  health: () => api.get('/health'),
  
  // Create a new build
  createBuild: (data: BuildRequest) => 
    api.post<BuildResponse>('/build', data),
  
  // Create build with icon upload
  createBuildWithIcon: (formData: FormData) =>
    api.post<BuildResponse>('/build/with-icon', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000, // 2 min for file upload
    }),
  
  // Get build status
  getStatus: (projectId: string) =>
    api.get<ProjectStatus>(`/build/${projectId}`),
  
  // Get build logs
  getLogs: (projectId: string) =>
    api.get<{ project_id: string; logs: string; status: string }>(`/build/${projectId}/logs`),
  
  // Cancel build
  cancelBuild: (projectId: string) =>
    api.delete(`/build/${projectId}`),
  
  // Download file
  getDownloadUrl: (projectId: string, filename: string) =>
    `/downloads/${projectId}/${filename}`,
};

export default api;
