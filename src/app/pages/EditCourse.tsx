"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { useAuth } from '@/app/components/AuthContext';

interface EditCourseProps {
  id: string;
}

const DEFAULT_CATEGORIES = [
  'General',
  'Web Development',
  'Data Science',
  'Design',
  'Business',
  'Marketing',
];

export function EditCourse({ id }: EditCourseProps) {
  const router = useRouter();
  const { userRole, user, isLoading } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryOptions, setCategoryOptions] = useState<string[]>(DEFAULT_CATEGORIES);
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [level, setLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [duration, setDuration] = useState('0');
  const [image, setImage] = useState('');
  const [syllabusUrl, setSyllabusUrl] = useState('');
  const [status, setStatus] = useState<'Draft' | 'Published'>('Draft');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/sign-in');
      return;
    }
    if (!isLoading && user && userRole && userRole !== 'teacher') {
      router.push(`/dashboard/${userRole}`);
    }
  }, [isLoading, user, userRole, router]);

  useEffect(() => {
    let mounted = true;
    fetch('/api/categories')
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data) => {
        const names = Array.isArray(data?.items)
          ? data.items.map((item: any) => String(item.name || '').trim()).filter(Boolean)
          : [];
        const options = names.length ? names : DEFAULT_CATEGORIES;
        if (mounted) {
          setCategoryOptions(options);
          setCategory((prev) => (options.includes(prev) ? prev : options[0]));
        }
      })
      .catch(() => {
        if (mounted) setCategoryOptions(DEFAULT_CATEGORIES);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!id || isLoading || !user || userRole !== 'teacher') return;

    setLoading(true);
    fetch(`/api/courses/${id}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load course');
        }
        return data;
      })
      .then((course) => {
        if (!course.isInstructor) {
          router.push('/dashboard/teacher');
          return;
        }

        setTitle(course.title || '');
        setDescription(course.description || '');
        setCategory(course.category || DEFAULT_CATEGORIES[0]);
        setLevel((course.level || 'Beginner') as 'Beginner' | 'Intermediate' | 'Advanced');
        setDuration(String(course.durationHours ?? 0));
        setImage(course.image || '');
        setSyllabusUrl(course.syllabusUrl || '');
        setStatus((course.status || 'Draft') === 'Published' ? 'Published' : 'Draft');
      })
      .catch((fetchError: unknown) => {
        const message = fetchError instanceof Error ? fetchError.message : 'Failed to load course';
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [id, isLoading, user, userRole, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!title.trim() || !description.trim()) {
      setError('Title and description are required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/teacher/courses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          level,
          duration: Number(duration) || 0,
          image: image.trim(),
          syllabusUrl: syllabusUrl.trim(),
          status,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update course.');
        return;
      }

      router.push(`/dashboard/teacher/course/${id}`);
    } catch {
      setError('Failed to update course.');
    } finally {
      setSaving(false);
    }
  };

  if (userRole !== 'teacher') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Teacher access only</h2>
          <p className="text-gray-600 mb-6">Please sign in as a teacher to edit courses.</p>
          <Link href="/login">
            <Button className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white">Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="container mx-auto px-4 py-10">
        <Card className="bg-white max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl text-gray-900">Edit Course</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <p className="text-sm text-gray-600">Loading course...</p> : null}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-gray-900">Course Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-900">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-gray-900">Category</Label>
                  <select
                    id="category"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {categoryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level" className="text-gray-900">Level</Label>
                  <select
                    id="level"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={level}
                    onChange={(e) => setLevel(e.target.value as 'Beginner' | 'Intermediate' | 'Advanced')}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-gray-900">Duration (hours)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="0"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-gray-900">Status</Label>
                  <select
                    id="status"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'Draft' | 'Published')}
                  >
                    <option value="Draft">Draft</option>
                    <option value="Published">Published</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image" className="text-gray-900">Thumbnail URL</Label>
                <Input
                  id="image"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="syllabusUrl" className="text-gray-900">Syllabus URL</Label>
                <Input
                  id="syllabusUrl"
                  value={syllabusUrl}
                  onChange={(e) => setSyllabusUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={saving || loading} className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white">
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Link href="/dashboard/teacher">
                  <Button type="button" variant="outline" className="border-[#1E3A8A] text-[#1E3A8A]">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
