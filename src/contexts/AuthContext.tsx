import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { mockApi } from '../services/mockApi';
import type { Language, User, UserProfile } from '../types/vibebattle';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: {
    email: string;
    password: string;
    username: string;
    displayName: string;
    preferredLanguage?: Language;
  }) => Promise<User>;
  logout: () => Promise<void>;
  verifyEmail: () => Promise<User>;
  updateProfile: (updates: {
    displayName?: string;
    username?: string;
    profile?: Partial<UserProfile>;
  }) => Promise<User>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const current = await mockApi.getCurrentUser();
      setUser(current);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const logged = await mockApi.login(email, password);
    setUser(logged);
    return logged;
  };

  const register = async (input: {
    email: string;
    password: string;
    username: string;
    displayName: string;
    preferredLanguage?: Language;
  }) => {
    const created = await mockApi.register(input);
    setUser(created);
    return created;
  };

  const logout = async () => {
    await mockApi.logout();
    setUser(null);
  };

  const verifyEmail = async () => {
    const updated = await mockApi.verifyEmail();
    setUser(updated);
    return updated;
  };

  const updateProfile = async (updates: {
    displayName?: string;
    username?: string;
    profile?: Partial<UserProfile>;
  }) => {
    const updated = await mockApi.updateProfile(updates);
    setUser(updated);
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        verifyEmail,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
