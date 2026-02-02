"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { BookOpen } from 'lucide-react';
import { useAuth } from '@/app/components/AuthContext';

export function Register() {
  const router = useRouter();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    // Mock registration logic
    login(role);
    router.push(role === 'student' ? '/dashboard/student' : '/dashboard/teacher');
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
          <CardTitle className="text-3xl text-gray-900">Join AlinHub</CardTitle>
          <CardDescription>Create your free account and start learning today</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-gray-900">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1"
              />
            </div>
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
              <Label htmlFor="role" className="text-gray-900">I want to</Label>
              <Select value={role} onValueChange={(value) => setRole(value as 'student' | 'teacher')}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Learn (Student)</SelectItem>
                  <SelectItem value="teacher">Teach (Instructor)</SelectItem>
                </SelectContent>
              </Select>
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
            <div>
              <Label htmlFor="confirmPassword" className="text-gray-900">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <input type="checkbox" required className="mt-1" />
              <label>
                I agree to AlinHub's{' '}
                <a href="#" className="text-[#1E3A8A] hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-[#1E3A8A] hover:underline">
                  Privacy Policy
                </a>
              </label>
            </div>
            <Button type="submit" className="w-full bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white py-6 text-lg">
              Create Free Account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-[#1E3A8A] hover:underline font-semibold">
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 text-center">
              🎉 <strong>100% Free!</strong> No credit card required. Access all courses for free!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
