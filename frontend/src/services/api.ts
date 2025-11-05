import { config } from '../config/config';

export interface ShareCreateRequest {
  resourceId: string;
  resourceType: 'file' | 'folder';
  permissions: 'read' | 'write';
  expiresAt?: string;
  password?: string;
}

export interface Share {
  id: string;
  resourceId: string;
  resourceType: 'file' | 'folder';
  resourceName: string;
  shareToken: string;
  permissions: string;
  expiresAt?: string;
  isPasswordProtected: boolean;
  createdAt: string;
  shareUrl: string;
}

export interface ProfileUpdateRequest {
  firstName: string;
  lastName: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  storageUsed: number;
  storageLimit: number;
  createdAt: string;
  updatedAt: string;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.apiUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('token');
    
    // Check if body is FormData - if so, don't set Content-Type
    const isFormData = options.body instanceof FormData;
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...(!isFormData && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  private async requestFile(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Request failed');
    }

    return response;
  }

  // User/Profile endpoints
  async getProfile(): Promise<User> {
    const response = await this.request<{ data: { user: User } }>('/api/users/profile');
    return response.data.user;
  }

  async updateProfile(data: ProfileUpdateRequest): Promise<User> {
    const response = await this.request<{ data: { user: User } }>('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data.user;
  }

  async uploadProfileImage(file: File): Promise<User> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.request<{ data: { user: User } }>('/api/users/profile/image', {
      method: 'POST',
      body: formData,
    });
    return response.data.user;
  }

  async downloadUserData(): Promise<void> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await fetch(`${this.baseUrl}/api/users/download-data`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download data');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-gdrive-data.zip';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  async deleteAccount(password: string): Promise<void> {
    await this.request('/api/users/account', {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    });
  }

  // Share endpoints
  async createShare(data: ShareCreateRequest): Promise<Share> {
    const response = await this.request<{ data: { share: Share } }>('/api/shares', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data.share;
  }

  async getShares(type?: 'file' | 'folder'): Promise<Share[]> {
    const params = type ? `?type=${type}` : '';
    const response = await this.request<{ data: { shares: Share[] } }>(`/api/shares${params}`);
    return response.data.shares;
  }

  async deleteShare(shareId: string): Promise<void> {
    await this.request(`/api/shares/${shareId}`, {
      method: 'DELETE',
    });
  }

  async getSharedResource(token: string, password?: string): Promise<any> {
    const response = await this.request<{ data: any }>(`/api/shares/shared/${token}`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    return response.data;
  }

  // File download
  async downloadFile(fileId: string): Promise<void> {
    const response = await this.request<{ data: { downloadUrl: string; fileName: string } }>(`/api/files/${fileId}/download`);
    
    // Download the file using the presigned URL
    const link = document.createElement('a');
    link.href = response.data.downloadUrl;
    link.download = response.data.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Folder download
  async downloadFolder(folderId: string): Promise<void> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await fetch(`${this.baseUrl}/api/folders/${folderId}/download`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download folder');
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get('content-disposition');
    const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || 'folder.zip';
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

export const apiService = new ApiService();
