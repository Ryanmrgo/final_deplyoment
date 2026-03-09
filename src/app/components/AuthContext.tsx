"use client";

import React, { createContext, useContext, useMemo, useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

type UserRole = 'student' | 'teacher' | 'admin' | null;

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextValue {
  user: User | null;
  userRole: UserRole;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded } = useUser();
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);

  useEffect(() => {
    if (isLoaded && clerkUser) {
      let role = (clerkUser.publicMetadata?.role || clerkUser.unsafeMetadata?.role) as UserRole | undefined;
      setUser({
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
        role: role ?? null,
      });
      setUserRole(role ?? null);

      fetch('/api/user/profile')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.role && ['teacher', 'student', 'admin'].includes(data.role)) {
            setUserRole(data.role as UserRole);
            setUser((prev) => (prev ? { ...prev, role: data.role } : null));
          }
        })
        .catch(() => {});
    } else if (isLoaded && !clerkUser) {
      setUser(null);
      setUserRole(null);
    }
  }, [clerkUser, isLoaded]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, userRole, isLoading: !isLoaded }),
    [user, userRole, isLoaded]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
