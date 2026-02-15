"use client";

import React, { createContext, useContext, useMemo, useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

type UserRole = 'student' | 'teacher' | null;

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
      // Check publicMetadata first, then unsafeMetadata; allow null to trigger onboarding
      const role = (clerkUser.publicMetadata?.role || clerkUser.unsafeMetadata?.role) as UserRole | undefined;
      setUser({
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
        role: role ?? null,
      });
      setUserRole(role ?? null);
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
