// Authentication utilities for frontend

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

interface ApiError {
  message: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

const TOKEN_KEY = 'finance_manager_token';
const USER_KEY = 'finance_manager_user';

// Token management
export const tokenStorage = {
  get(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  set(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
  },

  remove(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
  }
};

// User data management
export const userStorage = {
  get(): User | null {
    if (typeof window === 'undefined') return null;
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  },

  set(user: User): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  remove(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(USER_KEY);
  }
};

// Authentication state helpers
export const auth = {
  getState(): AuthState {
    const token = tokenStorage.get();
    const user = userStorage.get();
    return {
      user,
      token,
      isAuthenticated: !!(token && user)
    };
  },

  login(token: string, user: User): void {
    tokenStorage.set(token);
    userStorage.set(user);
  },

  logout(): void {
    tokenStorage.remove();
    userStorage.remove();
  },

  isAuthenticated(): boolean {
    return this.getState().isAuthenticated;
  }
};

// API client with authentication
export const apiClient = {
  async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const token = tokenStorage.get();
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    };

    const response = await fetch(endpoint, {
      ...options,
      headers
    });

    // Handle 401 responses by clearing auth state
    if (response.status === 401) {
      auth.logout();
      // Redirect to login if we're in the browser
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    return response;
  },

  async get(endpoint: string): Promise<Response> {
    return this.request(endpoint, { method: 'GET' });
  },

  async post(endpoint: string, data?: any): Promise<Response> {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  },

  async put(endpoint: string, data?: any): Promise<Response> {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  },

  async delete(endpoint: string): Promise<Response> {
    return this.request(endpoint, { method: 'DELETE' });
  }
};

// Authentication API calls
export const authApi = {
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Login failed' })) as ApiError;
      throw new Error(error.message || 'Login failed');
    }

    return response.json();
  },

  async register(email: string, password: string): Promise<{ user: User; token: string }> {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Registration failed' })) as ApiError;
      throw new Error(error.message || 'Registration failed');
    }

    return response.json();
  },

  async logout(): Promise<void> {
    const token = tokenStorage.get();
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });
      } catch (error) {
        // Ignore logout errors, we'll clear local state anyway
        console.warn('Logout request failed:', error);
      }
    }
    auth.logout();
  },

  async getProfile(): Promise<User> {
    const response = await apiClient.get('/api/auth/profile');
    
    if (!response.ok) {
      throw new Error('Failed to get profile');
    }

    return response.json();
  }
};