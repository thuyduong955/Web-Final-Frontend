"use client";

import React, { useEffect, useState, useCallback, useContext } from 'react';
import api from '@/services/api';
import type { AuthContextType, User, UserProfile, UserRole, AuthError } from './auth-types';
import { useRouter } from 'next/navigation';

import { AuthContext } from './AuthContextBase';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get('/auth/profile');
      const userData = res.data;

      const user: User = {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        user_metadata: {
          full_name: userData.name,
          avatar_url: userData.avatar
        }
      };

      const userProfile: UserProfile = {
        id: userData.id,
        email: userData.email,
        full_name: userData.name || '',
        role: userData.role,
        avatar_url: userData.avatar,
        profile_data: {},
        created_at: userData.createdAt,
        updated_at: userData.updatedAt || new Date().toISOString()
      };

      setUser(user);
      setProfile(userProfile);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setUser(null);
      setProfile(null);
      localStorage.removeItem('access_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [fetchProfile]);

  const signUp = async (email: string, password: string, userData: { full_name: string; role: UserRole }) => {
    try {
      await api.post('/auth/register', {
        email,
        password,
        name: userData.full_name,
        role: userData.role === 'job_seeker' ? 'USER' : 'INTERVIEWER' // Map roles
      });
      // Auto login after register? Or require login?
      // For now, let's require login
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.response?.data?.message || 'Registration failed' } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('access_token', res.data.access_token);
      await fetchProfile();
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.response?.data?.message || 'Login failed' } };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('access_token');
    setUser(null);
    setProfile(null);
    router.push('/auth/login');
    return { error: null };
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    // Implement update profile API call if backend supports it
    return { error: null };
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};