const API_BASE_URL = 'http://localhost:8000/api/auth';

export interface PatientRegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  age: number;
  gender: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UserResponse {
  userId: string;
  name: string;
  email: string;
  role: 'patient' | 'staff' | 'admin';
  phone?: string;
  age?: number;
  gender?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
  role: 'patient' | 'staff' | 'admin';
}

export const authService = {
  // Public registration - always creates patient
  register: async (data: PatientRegisterData): Promise<TokenResponse> => {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    const result = await response.json();
    
    // Store auth data
    localStorage.setItem('token', result.access_token);
    localStorage.setItem('user', JSON.stringify(result.user));
    localStorage.setItem('role', result.role);
    
    return result;
  },

  // Universal login
  login: async (data: LoginData): Promise<TokenResponse> => {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const result = await response.json();
    
    // Store auth data
    localStorage.setItem('token', result.access_token);
    localStorage.setItem('user', JSON.stringify(result.user));
    localStorage.setItem('role', result.role);
    
    return result;
  },

  // Admin: Create staff user
  adminCreateUsers: async (userData: any): Promise<any> => {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/admin/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create user');
    }

    return response.json();
  },

  // Get current user
  getCurrentUser: (): UserResponse | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Get auth token
  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },

  // Get user role
  getUserRole: (): 'patient' | 'staff' | 'admin' | null => {
    return localStorage.getItem('role') as any;
  },

  adminCreateUser: async (data: any): Promise<any> => {
    const token = authService.getToken();
    const response = await fetch(`http://localhost:8000/api/auth/admin/create-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Failed to create user' }));
      throw new Error(err.detail || 'Failed to create user');
    }
    return response.json();
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
  },
};