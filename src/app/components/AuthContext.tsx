"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSession, useUser } from '@clerk/nextjs';

type UserRole = 'student' | 'teacher' | null;

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Exclude<UserRole, null>;
  avatar?: string;
  bio?: string;
  professionalism?: string;
  rating?: number;
  graduationYear?: string;
  expertise?: string;
  experienceYears?: string;
  enrolledCourses?: string[];
  reviews?: string[];
}

interface AuthContextValue {
  user: User | null;
  userRole: UserRole;
  profile: UserProfile | null;
  isLoading: boolean;
  isLoaded: boolean;
  isSignedIn: boolean;
  login: (role: Exclude<UserRole, null>, profile?: Partial<UserProfile>) => void;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  setRole: (role: Exclude<UserRole, null>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const { session } = useSession();

  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (!clerkUser) {
      setUser(null);
      setUserRole(null);
      setProfile(null);
      return;
    }

    const role = (clerkUser.publicMetadata?.role || clerkUser.unsafeMetadata?.role) as UserRole | undefined;
    const email = clerkUser.emailAddresses[0]?.emailAddress || '';
    const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || email;

    setUser({
      id: clerkUser.id,
      email,
      name,
      role: role ?? null,
    });

    setUserRole(role ?? null);

    setProfile((prev) => ({
      id: clerkUser.id,
      name,
      email,
      role: (role ?? 'student') as Exclude<UserRole, null>,
      avatar: clerkUser.imageUrl,
      bio: prev?.bio,
      professionalism: prev?.professionalism,
      rating: prev?.rating,
      graduationYear: prev?.graduationYear,
      expertise: prev?.expertise,
      experienceYears: prev?.experienceYears,
      enrolledCourses: prev?.enrolledCourses ?? [],
      reviews: prev?.reviews ?? [],
    }));
  }, [clerkUser, isLoaded]);

  const login = useCallback((role: Exclude<UserRole, null>, nextProfile?: Partial<UserProfile>) => {
    setUserRole(role);
    setProfile((prev) => {
      const fallbackId = nextProfile?.id ?? prev?.id ?? user?.id ?? '';
      const fallbackName = nextProfile?.name ?? prev?.name ?? user?.name ?? 'User';
      const fallbackEmail = nextProfile?.email ?? prev?.email ?? user?.email ?? '';

      return {
        id: fallbackId,
        name: fallbackName,
        email: fallbackEmail,
        role,
        avatar: nextProfile?.avatar ?? prev?.avatar,
        bio: nextProfile?.bio ?? prev?.bio,
        professionalism: nextProfile?.professionalism ?? prev?.professionalism,
        rating: nextProfile?.rating ?? prev?.rating,
        graduationYear: nextProfile?.graduationYear ?? prev?.graduationYear,
        expertise: nextProfile?.expertise ?? prev?.expertise,
        experienceYears: nextProfile?.experienceYears ?? prev?.experienceYears,
        enrolledCourses: nextProfile?.enrolledCourses ?? prev?.enrolledCourses ?? [],
        reviews: nextProfile?.reviews ?? prev?.reviews ?? [],
      };
    });
  }, [user]);

  const logout = useCallback(() => {
    setUser(null);
    setUserRole(null);
    setProfile(null);
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    setProfile((prev) => {
      if (!prev) {
        return {
          id: updates.id ?? user?.id ?? '',
          name: updates.name ?? user?.name ?? 'User',
          email: updates.email ?? user?.email ?? '',
          role: (updates.role ?? userRole ?? 'student') as Exclude<UserRole, null>,
          avatar: updates.avatar,
          bio: updates.bio,
          professionalism: updates.professionalism,
          rating: updates.rating,
          graduationYear: updates.graduationYear,
          expertise: updates.expertise,
          experienceYears: updates.experienceYears,
          enrolledCourses: updates.enrolledCourses ?? [],
          reviews: updates.reviews ?? [],
        };
      }

      return { ...prev, ...updates, id: updates.id ?? prev.id };
    });
  }, [user, userRole]);

  const setRole = useCallback(async (role: Exclude<UserRole, null>) => {
    setUserRole(role);
    setUser((prev) => (prev ? { ...prev, role } : prev));
    setProfile((prev) => (prev ? { ...prev, role } : prev));

    try {
      await fetch('/api/user/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      await clerkUser?.reload();
      await session?.reload();
      await session?.getToken({ skipCache: true });
    } catch (error) {
      console.error('Error updating role:', error);
    }
  }, [clerkUser, session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      userRole,
      profile,
      isLoading: !isLoaded,
      isLoaded,
      isSignedIn: !!isSignedIn,
      login,
      logout,
      updateProfile,
      setRole,
    }),
    [user, userRole, profile, isLoaded, isSignedIn, login, logout, updateProfile, setRole]
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
