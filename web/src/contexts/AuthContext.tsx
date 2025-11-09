'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';
import { isAxiosError } from 'axios';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'vendedor' | 'bodeguero' | 'cajero' | 'user';
  phone?: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

interface LoginErrorResponse {
  error?: string;
  detail?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    console.log('Checking auth...');
    try {
      const token = localStorage.getItem('access_token');
      console.log('Token:', token);
      if (token) {
        console.log('Fetching user...');
        const response = await api.get('/auth/me/');
        console.log('User fetched:', response.data);
        setUser(response.data);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    } finally {
      console.log('Finished checking auth.');
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await api.post<LoginResponse>('/auth/login/', {
        username,
        password,
      });

      const { access, refresh, user: userData } = response.data;

      // Store in localStorage
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      // Also store in cookies for middleware
      document.cookie = `access_token=${access}; path=/; max-age=${60 * 60}`; // 1 hour
      document.cookie = `refresh_token=${refresh}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
      
      setUser(userData);
    } catch (error: unknown) {
      const message = isAxiosError<LoginErrorResponse>(error)
        ? error.response?.data?.error ?? error.response?.data?.detail
        : undefined;
      throw new Error(message ?? 'Login failed');
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await api.post('/auth/logout/', { refresh: refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      
      // Clear cookies
      document.cookie = 'access_token=; path=/; max-age=0';
      document.cookie = 'refresh_token=; path=/; max-age=0';
      
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
