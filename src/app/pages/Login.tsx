"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { BookOpen } from 'lucide-react';
import { useAuth } from '@/app/components/AuthContext';

export function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login logic - in real app, this would call an API
    if (email.includes('teacher')) {
      login('teacher', { email });
      router.push('/dashboard/teacher');
    } else if (email.includes('admin')) {
      login('admin', { email });
      router.push('/dashboard/admin');
    } else {
      login('student', { email });
      router.push('/dashboard/student');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[#F59E0B] rounded-full flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl text-gray-900">Welcome to AlinHub</CardTitle>
          <CardDescription>Sign in to continue your learning journey</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-gray-900">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-gray-900">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" className="rounded" />
                Remember me
              </label>
              <a href="#" className="text-sm text-[#1E3A8A] hover:underline">
                Forgot password?
              </a>
            </div>
            <Button type="submit" className="w-full bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white py-6 text-lg">
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link href="/register" className="text-[#1E3A8A] hover:underline font-semibold">
                Sign up for free
              </Link>
            </p>
          </div>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 mb-2 font-semibold">Demo Credentials:</p>
            <div className="space-y-1 text-xs text-gray-600">
              <p>• Student: student@example.com</p>
              <p>• Teacher: teacher@example.com</p>
              <p>• Admin: admin@example.com</p>
              <p className="mt-2 italic">Password: any password</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
