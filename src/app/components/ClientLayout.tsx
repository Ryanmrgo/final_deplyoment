"use client";

import { Navbar } from '@/app/components/Navbar';
import { Footer } from '@/app/components/Footer';
import { AuthProvider } from '@/app/components/AuthContext';
import { CoursesProvider } from '@/app/components/CoursesContext';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CoursesProvider>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </CoursesProvider>
    </AuthProvider>
  );
}
