"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/app/components/AuthContext';

interface CourseManageProps {
  courseId: string;
}

export function CourseManage({ courseId }: CourseManageProps) {
  const { user, userRole, isLoading } = useAuth();
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'Draft' | 'Published'>('Draft');
  const [category, setCategory] = useState('General');
  const [level, setLevel] = useState('Beginner');

  useEffect(() => {
    if (!isLoading && (!user || userRole !== 'teacher')) {
      router.push('/auth/sign-in');
      return;
    }
    if (!courseId) return;

    fetch(`/api/courses/${courseId}`)
      .then((r) => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then((data) => {
        if (!data.isInstructor) {
          router.push('/dashboard/teacher');
          return;
        }
        setCourse(data);
        setTitle(data.title || '');
        setDescription(data.description || '');
        setVisibility(data.status === 'Published' ? 'Published' : 'Draft');
        setCategory(data.category || 'General');
        setLevel(data.level || 'Beginner');
      })
      .catch(() => {
        setCourse(null);
      })
      .finally(() => setLoading(false));
  }, [courseId, user, userRole, isLoading, router]);

  const handleSave = async () => {
    if (!courseId) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch(`/api/teacher/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          status: visibility,
          category,
          level,
        }),
      });
      if (res.ok) {
        setSaveMessage('Course settings saved successfully.');
        setCourse((prev: any) => (prev ? { ...prev, title, description, status: visibility } : prev));
      } else {
        const data = await res.json();
        setSaveMessage(data.error || 'Failed to save');
      }
    } catch {
      setSaveMessage('Network error');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !course) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/dashboard/teacher"
          className="inline-flex items-center text-[#1E3A8A] hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Teacher Dashboard
        </Link>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Course settings</h1>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save and display'}
          </Button>
        </div>

        {saveMessage && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              saveMessage.includes('error') || saveMessage.includes('Failed')
                ? 'bg-red-50 text-red-800'
                : 'bg-green-50 text-green-800'
            }`}
          >
            {saveMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Course full name</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Introduction to Web Development"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="desc">Course summary</Label>
                  <Input
                    id="desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Web Development"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="level">Level</Label>
                  <Select value={level} onValueChange={setLevel}>
                    <SelectTrigger id="level" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="bg-white sticky top-4">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">Course visibility</CardTitle>
                <p className="text-sm text-gray-600 font-normal">
                  Hidden courses are not visible to students. Publish when ready for enrollments.
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  {visibility === 'Draft' ? (
                    <EyeOff className="w-8 h-8 text-gray-500" />
                  ) : (
                    <Eye className="w-8 h-8 text-green-600" />
                  )}
                  <Select
                    value={visibility}
                    onValueChange={(v: 'Draft' | 'Published') => setVisibility(v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">
                        Hide — Hidden from students
                      </SelectItem>
                      <SelectItem value="Published">
                        Show — Visible to students
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white mt-6">
              <CardContent className="pt-6">
                <Link href={`/courses/${courseId}`}>
                  <Button variant="outline" className="w-full border-[#1E3A8A] text-[#1E3A8A]">
                    View course
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
