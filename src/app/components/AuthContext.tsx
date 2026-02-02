"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type UserRole = 'student' | 'teacher' | 'admin' | null;

interface AuthContextValue {
  userRole: UserRole;
  login: (role: Exclude<UserRole, null>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userRole, setUserRole] = useState<UserRole>(null);

  const login = useCallback((role: Exclude<UserRole, null>) => {
    setUserRole(role);
  }, []);

  const logout = useCallback(() => {
    setUserRole(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({ userRole, login, logout }), [userRole, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
