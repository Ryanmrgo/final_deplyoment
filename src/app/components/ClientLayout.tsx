"use client";

import { ClerkProvider } from '@clerk/nextjs';
import { Navbar } from '@/app/components/Navbar';
import { Footer } from '@/app/components/Footer';
import { AuthProvider } from '@/app/components/AuthContext';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </AuthProvider>
    </ClerkProvider>
  );
}
