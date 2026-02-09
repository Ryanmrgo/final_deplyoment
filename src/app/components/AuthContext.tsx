"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

type UserRole = 'student' | 'teacher' | 'admin' | null;

interface UserProfile {
  id: string; // Added id field
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
  enrolledCourses?: string[]; // ADDED: To match shared type
  reviews?: string[]; // ADDED: To match shared type
}

interface AuthContextValue {
  userRole: UserRole;
  profile: UserProfile | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  login: (role: Exclude<UserRole, null>, profile?: Partial<UserProfile>) => void;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  setRole: (role: Exclude<UserRole, null>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const PROFILE_KEY = 'alinhub.profile.v1';
const ROLE_KEY = 'alinhub.role.v1';

function readStoredProfile(): UserProfile | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as UserProfile;
    return parsed && parsed.role ? parsed : null;
  } catch {
    return null;
  }
}

function readStoredRole(): UserRole {
  if (typeof window === 'undefined') {
    return null;
  }
  const raw = window.localStorage.getItem(ROLE_KEY);
  if (!raw) {
    return null;
  }
  return raw as UserRole;
}

function writeStoredProfile(profile: UserProfile | null) {
  if (typeof window === 'undefined') {
    return;
  }
  if (!profile) {
    window.localStorage.removeItem(PROFILE_KEY);
    return;
  }
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function writeStoredRole(role: UserRole) {
  if (typeof window === 'undefined') {
    return;
  }
  if (!role) {
    window.localStorage.removeItem(ROLE_KEY);
    return;
  }
  window.localStorage.setItem(ROLE_KEY, role);
}

function formatNameFromEmail(email: string) {
  const base = email.split('@')[0] ?? '';
  if (!base) {
    return '';
  }
  return base
    .replace(/[._-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// Generate a unique ID for users
function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const hasLoaded = useRef(false);

  // COMMENTED OUT: Remove auto-login on mount
  // useEffect(() => {
  //   const storedProfile = readStoredProfile();
  //   const storedRole = readStoredRole();
  //   if (storedProfile) {
  //     setProfile(storedProfile);
  //     setUserRole(storedProfile.role);
  //   } else if (storedRole) {
  //     setUserRole(storedRole);
  //   }
  //   hasLoaded.current = true;
  // }, []);

  // Set hasLoaded to true on mount without auto-login
  useEffect(() => {
    hasLoaded.current = true;
  }, []);

  // Save data to localStorage when it changes
  useEffect(() => {
    if (!hasLoaded.current) {
      return;
    }
    writeStoredRole(userRole);
    writeStoredProfile(profile);
  }, [userRole, profile]);

  const login = useCallback((role: Exclude<UserRole, null>, nextProfile?: Partial<UserProfile>) => {
    const userId = nextProfile?.id || generateUserId();
    
    setUserRole(role);
    setProfile((prev) => {
      const fallbackEmail = nextProfile?.email ?? prev?.email ?? '';
      const fallbackName = nextProfile?.name ?? prev?.name ?? (formatNameFromEmail(fallbackEmail) || role);
      
      return {
        id: userId,
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
        enrolledCourses: nextProfile?.enrolledCourses ?? prev?.enrolledCourses ?? [], // ADDED
        reviews: nextProfile?.reviews ?? prev?.reviews ?? [], // ADDED
      };
    });
  }, []);

  const logout = useCallback(() => {
    setUserRole(null);
    setProfile(null);
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    setProfile((prev) => {
      if (!prev) {
        // If there's no profile but we're trying to update, create a new one
        const userId = updates.id || generateUserId();
        return {
          id: userId,
          name: updates.name || 'User',
          email: updates.email || '',
          role: updates.role || 'student',
          avatar: updates.avatar,
          bio: updates.bio,
          professionalism: updates.professionalism,
          rating: updates.rating,
          graduationYear: updates.graduationYear,
          expertise: updates.expertise,
          experienceYears: updates.experienceYears,
          enrolledCourses: updates.enrolledCourses ?? [], // ADDED
          reviews: updates.reviews ?? [], // ADDED
        };
      }
      // Preserve the existing id unless explicitly changed
      const updatedId = updates.id || prev.id;
      return { ...prev, ...updates, id: updatedId };
    });
  }, []);

  const setRole = useCallback(async (role: Exclude<UserRole, null>) => {
    setUserRole(role);
    setProfile((prev) => (prev ? { ...prev, role } : null));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      userRole,
      profile,
      isLoaded: true,
      isSignedIn: !!userRole,
      login,
      logout,
      updateProfile,
      setRole,
    }),
    [userRole, profile, login, logout, updateProfile, setRole]
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