"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Home, Library, User, LogIn, Users, LayoutDashboard } from 'lucide-react';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Button } from '@/app/components/ui/button';
import { useAuth } from '@/app/components/AuthContext';

interface NavbarProps {
  userRole?: 'student' | 'teacher' | 'admin' | null;
  onLogout?: () => void;
}

export function Navbar({ userRole }: NavbarProps) {
  const pathname = usePathname();
  const { userRole: contextRole, isLoading } = useAuth();
  const resolvedRole = userRole ?? contextRole;

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-[#1E3A8A] text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <BookOpen className="w-8 h-8 text-[#F59E0B]" />
            <span className="text-2xl font-semibold">AlinHub</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className={`flex items-center gap-2 hover:text-[#F59E0B] transition ${
                isActive('/') ? 'text-[#F59E0B]' : ''
              }`}
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </Link>

            <Link
              href="/courses"
              className={`flex items-center gap-2 hover:text-[#F59E0B] transition ${
                isActive('/courses') ? 'text-[#F59E0B]' : ''
              }`}
            >
              <Library className="w-5 h-5" />
              <span>Courses</span>
            </Link>

            {!isLoading && resolvedRole === 'student' && (
              <Link
                href="/dashboard/student"
                className={`flex items-center gap-2 hover:text-[#F59E0B] transition ${
                  isActive('/dashboard/student') ? 'text-[#F59E0B]' : ''
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>My Dashboard</span>
              </Link>
            )}

            {!isLoading && resolvedRole === 'teacher' && (
              <Link
                href="/dashboard/teacher"
                className={`flex items-center gap-2 hover:text-[#F59E0B] transition ${
                  isActive('/dashboard/teacher') ? 'text-[#F59E0B]' : ''
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>My Courses</span>
              </Link>
            )}

            {!isLoading && resolvedRole === 'admin' && (
              <Link
                href="/dashboard/admin"
                className={`flex items-center gap-2 hover:text-[#F59E0B] transition ${
                  isActive('/dashboard/admin') ? 'text-[#F59E0B]' : ''
                }`}
              >
                <Users className="w-5 h-5" />
                <span>Admin Panel</span>
              </Link>
            )}

            {/* Auth Buttons */}
            <SignedOut>
              <div className="flex items-center gap-3 ml-4">
                <Link href="/auth/sign-in">
                  <Button variant="ghost" className="text-white hover:text-[#F59E0B] hover:bg-white/10">
                    <LogIn className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button className="bg-[#F59E0B] text-white hover:bg-[#F59E0B]/90">
                    Get Started
                  </Button>
                </Link>
              </div>
            </SignedOut>

            <SignedIn>
              <div className="flex items-center gap-3 ml-4">
                {!isLoading && resolvedRole && (
                  <Link href={`/dashboard/${resolvedRole}`}>
                    <Button variant="ghost" className="text-white hover:text-[#F59E0B] hover:bg-white/10">
                      <User className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                )}
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: 'w-10 h-10',
                    },
                  }}
                />
              </div>
            </SignedIn>
          </div>
        </div>
      </div>
    </nav>
  );
}
