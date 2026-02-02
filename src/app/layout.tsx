import '@/styles/index.css';
import { ClientLayout } from '@/app/components/ClientLayout';

export const metadata = {
  title: 'AlinHub Learning Platform',
  description: 'Free, high-quality education for everyone.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
