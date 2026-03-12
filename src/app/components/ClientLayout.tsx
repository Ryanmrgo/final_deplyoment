"use client";

import { ClerkProvider } from '@clerk/nextjs';
import { Navbar } from '@/app/components/Navbar';
import { Footer } from '@/app/components/Footer';
import { AuthProvider } from '@/app/components/AuthContext';
import { Toaster } from '@/app/components/ui/sonner';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </ClerkProvider>
  );
}
