"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Plus, Users, BookOpen, Star, TrendingUp, Edit, Eye, EyeOff, Settings } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useAuth } from '@/app/components/AuthContext';

type SyllabusItem = {
  id: string;
  label: string;
  file: File | null;
  error: string | null;
};

export function TeacherDashboard() {
  const { user, userRole, isLoading } = useAuth();
  const router = useRouter();
  const createSyllabusItem = (index: number): SyllabusItem => ({
    id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
    label: `Label ${index}`,
    file: null,
    error: null,
  });
  const [teacherCourses, setTeacherCourses] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createCategory, setCreateCategory] = useState('General');
  const [createLevel, setCreateLevel] = useState('Beginner');
  const [createDuration, setCreateDuration] = useState('');
  const [createLanguage, setCreateLanguage] = useState('English');
  const [createRequirements, setCreateRequirements] = useState('');
  const [createOutcomes, setCreateOutcomes] = useState('');
  const [createSyllabusItems, setCreateSyllabusItems] = useState<SyllabusItem[]>(() => [createSyllabusItem(1)]);
  const [createThumbnailFile, setCreateThumbnailFile] = useState<File | null>(null);
  const [createSyllabusError, setCreateSyllabusError] = useState<string | null>(null);
  const [createThumbnailError, setCreateThumbnailError] = useState<string | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const MAX_SYLLABUS_MB = 20;
  const MAX_THUMBNAIL_MB = 5;
  const SYLLABUS_TYPES = [
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ];
  const SYLLABUS_EXTS = ['.pdf', '.ppt', '.pptx'];
  const THUMBNAIL_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const THUMBNAIL_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handlePublishToggle = async (course: any) => {
    const courseId = course._id || course.id;
    if (!courseId) return;
    setPublishingId(courseId);
    try {
      const newStatus = course.status === 'Published' ? 'Draft' : 'Published';
      const res = await fetch(`/api/teacher/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setTeacherCourses((prev) =>
          prev.map((c) =>
            (c._id || c.id) === courseId ? { ...c, status: newStatus } : c
          )
        );
      }
    } catch {
      // ignore
    } finally {
      setPublishingId(null);
    }
  };

  const handleCreateQuizClick = () => {
    if (!teacherCourses.length) {
      setCreateOpen(true);
      setCreateError('Create at least one course first, then you can create quizzes.');
      return;
    }

    const firstCourse = teacherCourses[0];
    const courseId = firstCourse?._id || firstCourse?.id;
    if (!courseId) {
      setCreateOpen(true);
      setCreateError('Create at least one course first, then you can create quizzes.');
      return;
    }

    router.push(`/dashboard/teacher/course/${courseId}#quizzes`);
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/sign-in');
    } else if (!isLoading && user && !userRole) {
      router.push('/dashboard/onboarding');
    } else if (!isLoading && user && userRole !== 'teacher') {
      router.push(`/dashboard/${userRole}`);
    }
  }, [user, userRole, isLoading, router]);

  useEffect(() => {
    if (userRole === 'teacher' && user) {
      setLoading(true);
      Promise.all([
        fetch('/api/teacher/courses').then((r) => r.json()),
        fetch('/api/teacher/stats').then((r) => r.json()),
        fetch('/api/teacher/activity').then((r) => r.json()),
      ])
        .then(([coursesRes, statsRes, activityRes]) => {
          setTeacherCourses(coursesRes.items || []);
          setStats(statsRes.error ? null : statsRes);
          setActivity(activityRes.items || []);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [userRole, user]);

  const validateSyllabusFile = (file: File) => {
    const ext = `.${file.name.split('.').pop() || ''}`.toLowerCase();
    if (!SYLLABUS_EXTS.includes(ext)) return 'Only PDF or PPTX/PPT files are allowed.';
    if (file.type && !SYLLABUS_TYPES.includes(file.type)) return 'Unsupported syllabus file type.';
    if (file.size > MAX_SYLLABUS_MB * 1024 * 1024) return `Max file size is ${MAX_SYLLABUS_MB}MB.`;
    return null;
  };

  const validateThumbnailFile = (file: File) => {
    const ext = `.${file.name.split('.').pop() || ''}`.toLowerCase();
    if (!THUMBNAIL_EXTS.includes(ext)) return 'Use JPG, PNG, or WEBP.';
    if (file.type && !THUMBNAIL_TYPES.includes(file.type)) return 'Unsupported image type.';
    if (file.size > MAX_THUMBNAIL_MB * 1024 * 1024) return `Max image size is ${MAX_THUMBNAIL_MB}MB.`;
    return null;
  };

  const handleSyllabusLabelChange = (id: string, value: string) => {
    setCreateSyllabusItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, label: value } : item))
    );
    setCreateSyllabusError(null);
  };

  const handleSyllabusFileChange = (id: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setCreateSyllabusItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, file: null, error: null } : item))
      );
      setCreateSyllabusError(null);
      return;
    }
    const error = validateSyllabusFile(file);
    setCreateSyllabusItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, file: error ? null : file, error } : item))
    );
    setCreateSyllabusError(null);
  };

  const handleAddSyllabusItem = () => {
    setCreateSyllabusItems((prev) => [...prev, createSyllabusItem(prev.length + 1)]);
    setCreateSyllabusError(null);
  };

  const handleRemoveSyllabusItem = (id: string) => {
    setCreateSyllabusItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
    setCreateSyllabusError(null);
  };

  const handleThumbnailChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setCreateThumbnailFile(null);
      setCreateThumbnailError(null);
      return;
    }
    const error = validateThumbnailFile(file);
    setCreateThumbnailError(error);
    setCreateThumbnailFile(error ? null : file);
  };

  const resetCreateForm = () => {
    setCreateTitle('');
    setCreateDesc('');
    setCreateCategory('General');
    setCreateLevel('Beginner');
    setCreateDuration('');
    setCreateLanguage('English');
    setCreateRequirements('');
    setCreateOutcomes('');
    setCreateSyllabusItems([createSyllabusItem(1)]);
    setCreateThumbnailFile(null);
    setCreateSyllabusError(null);
    setCreateThumbnailError(null);
    setCreateError(null);
  };

  useEffect(() => {
    if (!createThumbnailFile) {
      setThumbnailPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(createThumbnailFile);
    setThumbnailPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [createThumbnailFile]);

  const handleCreateCourse = async () => {
    if (!createTitle.trim()) {
      setCreateError('Course title is required.');
      return;
    }
    if (!createDesc.trim()) {
      setCreateError('Course description is required.');
      return;
    }
    const syllabusFiles = createSyllabusItems.filter((item) => item.file);
    if (createSyllabusError || createThumbnailError || createSyllabusItems.some((item) => item.error)) {
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const formData = new FormData();
      formData.append('title', createTitle.trim());
      formData.append('description', createDesc.trim());
      formData.append('category', createCategory.trim() || 'General');
      formData.append('level', createLevel);
      formData.append('duration', createDuration ? String(Number(createDuration)) : '0');
      formData.append('price', '0');
      formData.append('language', createLanguage.trim() || 'English');
      formData.append('requirements', createRequirements.trim());
      formData.append('outcomes', createOutcomes.trim());
      syllabusFiles.forEach((item, index) => {
        if (!item.file) return;
        formData.append('syllabusFiles', item.file);
        const safeLabel = (item.label ?? '').trim() || `Label ${index + 1}`;
        formData.append('syllabusLabels', safeLabel);
      });
      if (createThumbnailFile) {
        formData.append('thumbnail', createThumbnailFile);
      }

      const res = await fetch('/api/teacher/courses', {
        method: 'POST',
        body: formData,
      });
      let data: any = null;
      let rawText = '';
      try {
        data = await res.json();
      } catch {
        try {
          rawText = await res.text();
        } catch {
          rawText = '';
        }
        data = null;
      }
      if (res.ok && data?.course) {
        setTeacherCourses((prev) => [data.course, ...prev]);
        if (stats) setStats({ ...stats, activeCourses: (stats.activeCourses || 0) + 1 });
        setCreateOpen(false);
        resetCreateForm();
      } else {
        const fallback = `Failed to create course (HTTP ${res.status})`;
        setCreateError(data?.error || rawText || fallback);
      }
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Network error');
    } finally {
      setCreating(false);
    }
  };

  if (isLoading || !user || userRole !== 'teacher') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetCreateForm();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Basic Information</h3>
              <div className="space-y-1.5">
                <Label htmlFor="title">Course Title</Label>
                <Input
                  id="title"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder="e.g. Introduction to Web Development"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="desc">Description</Label>
                <Textarea
                  id="desc"
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  placeholder="What students will learn and why this course matters"
                  className="min-h-28"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={createCategory}
                    onChange={(e) => setCreateCategory(e.target.value)}
                    placeholder="e.g. Web Development"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="level">Level</Label>
                  <select
                    id="level"
                    value={createLevel}
                    onChange={(e) => setCreateLevel(e.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-input-background px-3 text-sm"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="duration">Duration (weeks)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="0"
                    value={createDuration}
                    onChange={(e) => setCreateDuration(e.target.value)}
                    placeholder="e.g. 6"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="language">Language</Label>
                  <Input
                    id="language"
                    value={createLanguage}
                    onChange={(e) => setCreateLanguage(e.target.value)}
                    placeholder="e.g. English"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Learning Plan</h3>
              <div className="space-y-1.5">
                <Label htmlFor="requirements">Requirements</Label>
                <Textarea
                  id="requirements"
                  value={createRequirements}
                  onChange={(e) => setCreateRequirements(e.target.value)}
                  placeholder="List any prerequisites or tools students should have"
                  className="min-h-24"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="outcomes">Learning Outcomes</Label>
                <Textarea
                  id="outcomes"
                  value={createOutcomes}
                  onChange={(e) => setCreateOutcomes(e.target.value)}
                  placeholder="Describe the skills or outcomes students will gain"
                  className="min-h-24"
                />
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label>Syllabus / Learning Materials</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddSyllabusItem}
                  className="border-[#1E3A8A] text-[#1E3A8A]">
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
              <p className="text-xs text-gray-500">Upload materials per label (Label 1, Label 2, ...).</p>
              <div className="space-y-3">
                {createSyllabusItems.map((item, index) => (
                  <div key={item.id} className="rounded-md border border-gray-200 p-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start">
                      <div className="md:w-40 space-y-1.5">
                        <Label htmlFor={`syllabus-day-${item.id}`}>Label</Label>
                        <Input
                          id={`syllabus-day-${item.id}`}
                          value={item.label ?? ''}
                          onChange={(e) => handleSyllabusLabelChange(item.id, e.target.value)}
                          placeholder={`Label ${index + 1}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <Label htmlFor={`syllabus-file-${item.id}`}>File (PDF or PPTX)</Label>
                        <Input
                          id={`syllabus-file-${item.id}`}
                          type="file"
                          accept=".pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                          onChange={(event) => handleSyllabusFileChange(item.id, event)}
                          className="w-full file:mr-3 file:rounded-md file:bg-[#1E3A8A] file:px-3 file:py-1.5 file:text-white file:hover:bg-[#1E3A8A]/90"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveSyllabusItem(item.id)}
                        disabled={createSyllabusItems.length === 1}
                        className="md:self-end"
                      >
                        Remove
                      </Button>
                    </div>
                    {item.error && <p className="text-sm text-red-600 mt-2">{item.error}</p>}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500">Max file size per file: {MAX_SYLLABUS_MB}MB</p>
              {createSyllabusError && <p className="text-sm text-red-600">{createSyllabusError}</p>}
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-4 space-y-1.5">
              <Label htmlFor="thumbnail">Course Thumbnail (Optional)</Label>
              <Input
                id="thumbnail"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleThumbnailChange}
                className="w-full file:mr-3 file:rounded-md file:bg-[#1E3A8A] file:px-3 file:py-1.5 file:text-white file:hover:bg-[#1E3A8A]/90"
              />
              <p className="text-xs text-gray-500 mt-1">
                Recommended size: 1200×675 • Allowed: JPG, PNG, WEBP • Max: {MAX_THUMBNAIL_MB}MB
              </p>
              {createThumbnailFile && (
                <div className="mt-2 rounded-md border border-gray-200 bg-white p-3 text-xs text-gray-700">
                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-3 sm:gap-3">
                    <p><span className="font-medium text-gray-900">Name:</span> {createThumbnailFile.name}</p>
                    <p><span className="font-medium text-gray-900">Type:</span> {createThumbnailFile.type || 'Unknown'}</p>
                    <p><span className="font-medium text-gray-900">Size:</span> {formatFileSize(createThumbnailFile.size)}</p>
                  </div>
                </div>
              )}
              {thumbnailPreviewUrl && (
                <div className="mt-3">
                  <img
                    src={thumbnailPreviewUrl}
                    alt="Course thumbnail preview"
                    className="h-32 w-full max-w-sm rounded-md object-cover border"
                  />
                </div>
              )}
              {createThumbnailError && <p className="text-sm text-red-600">{createThumbnailError}</p>}
            </div>

            <p className="text-xs text-gray-500">
              New courses start as Draft (hidden from students). Publish when ready.
            </p>
            {createError && <p className="text-sm text-red-600">{createError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreateCourse}
              disabled={
                creating ||
                !createTitle.trim() ||
                !createDesc.trim()
              }
              className="bg-[#F59E0B] hover:bg-[#F59E0B]/90"
            >
              {creating ? 'Creating...' : 'Create Course'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Teacher Dashboard</h1>
            <p className="text-gray-600">Manage your courses and monitor student progress</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Button onClick={() => setCreateOpen(true)} className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white">
              <Plus className="w-5 h-5 mr-2" />
              Create New Course
            </Button>
            <Button
              variant="outline"
              className="border-[#1E3A8A] text-[#1E3A8A]"
              onClick={handleCreateQuizClick}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Quiz
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Students</p>
                  <p className="text-3xl font-bold text-[#1E3A8A]">{stats?.totalStudents ?? 0}</p>
                </div>
                <Users className="w-12 h-12 text-[#F59E0B]" />
              </div>
              <p className="text-xs text-green-600 mt-2">+{stats?.newEnrollmentsThisMonth ?? 0} this month</p>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Courses</p>
                  <p className="text-3xl font-bold text-[#1E3A8A]">{stats?.activeCourses ?? teacherCourses.length}</p>
                </div>
                <BookOpen className="w-12 h-12 text-blue-500" />
              </div>
              <p className="text-xs text-gray-500 mt-2">Published</p>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Average Rating</p>
                  <p className="text-3xl font-bold text-[#1E3A8A]">{stats?.averageRating ?? '0'}</p>
                </div>
                <Star className="w-12 h-12 text-yellow-500 fill-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
                  <p className="text-3xl font-bold text-[#1E3A8A]">{stats?.completionRate ?? 0}%</p>
                </div>
                <TrendingUp className="w-12 h-12 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="bg-white" id="my-courses">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900">My Courses</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1E3A8A]" /></div>
                ) : teacherCourses.length === 0 ? (
                  <p className="text-center text-gray-600 py-8">No courses yet. Create your first course!</p>
                ) : (
                  <div className="space-y-4">
                    {[...teacherCourses]
                      .sort((a, b) => {
                        const sa = a.status === 'Published' ? 0 : 1;
                        const sb = b.status === 'Published' ? 0 : 1;
                        return sa - sb;
                      })
                      .map((course: any) => {
                        const isPublished = (course.status || 'Draft') === 'Published';
                        const courseId = course._id || course.id;
                        const isPublishing = publishingId === courseId;
                        return (
                          <div
                            key={courseId}
                            className={`border rounded-lg p-5 hover:shadow-md transition ${
                              !isPublished ? 'bg-gray-50 border-gray-200' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-lg text-gray-900 mb-1">{course.title}</h3>
                                <p className="text-sm text-gray-600">{course.category || 'General'}</p>
                                {!isPublished && (
                                  <p className="text-xs text-amber-700 mt-1 font-medium">Hidden from students</p>
                                )}
                              </div>
                              <Badge
                                className={
                                  isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
                                }
                              >
                                {isPublished ? 'Published' : 'Draft'}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mb-4">
                              <div>
                                <p className="text-sm text-gray-600">Students</p>
                                <p className="text-xl font-semibold text-[#1E3A8A]">{course.totalStudents ?? 0}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Rating</p>
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                  <span className="font-semibold">{(course.rating ?? 0).toFixed(1)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePublishToggle(course)}
                                disabled={isPublishing}
                                className={
                                  isPublished
                                    ? 'border-gray-400 text-gray-600'
                                    : 'border-green-600 text-green-700 hover:bg-green-50'
                                }
                              >
                                {isPublishing ? (
                                  '...'
                                ) : isPublished ? (
                                  <>
                                    <EyeOff className="w-4 h-4 mr-2" />
                                    Unpublish
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Publish
                                  </>
                                )}
                              </Button>
                              <Link href={`/dashboard/teacher/course/${courseId}`}>
                                <Button variant="outline" size="sm" className="border-[#1E3A8A] text-[#1E3A8A]">
                                  <Settings className="w-4 h-4 mr-2" />
                                  Settings
                                </Button>
                              </Link>
                              <Link href={`/dashboard/teacher/course/${courseId}#quizzes`}>
                                <Button variant="outline" size="sm" className="border-[#1E3A8A] text-[#1E3A8A]">
                                  <BookOpen className="w-4 h-4 mr-2" />
                                  Quizzes
                                </Button>
                              </Link>
                              <Link href={`/courses/${courseId}`}>
                                <Button variant="outline" size="sm" className="border-[#1E3A8A] text-[#1E3A8A]">
                                  <Eye className="w-4 h-4 mr-2" />
                                  View
                                </Button>
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white mt-6">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">Recent Student Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {activity.length === 0 ? (
                  <p className="text-gray-500 text-center py-6">No recent activity</p>
                ) : (
                  <div className="space-y-3">
                    {activity.slice(0, 5).map((item: any) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                        <div className="w-10 h-10 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center font-semibold text-sm">
                          {item.initials}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">{item.message}</p>
                          <p className="text-xs text-gray-600">
                            {new Date(item.time).toLocaleDateString()} • {new Date(item.time).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] text-white">
              <CardHeader>
                <CardTitle className="text-xl">This Month</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div><p className="text-sm mb-1">New Enrollments</p><p className="text-3xl font-bold">+{stats?.newEnrollmentsThisMonth ?? 0}</p></div>
                <div><p className="text-sm mb-1">Completions</p><p className="text-3xl font-bold">{stats?.courseCompletionsThisMonth ?? 0}</p></div>
                <div><p className="text-sm mb-1">New Reviews</p><p className="text-3xl font-bold">{stats?.newReviewsThisMonth ?? 0}</p></div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">💡 Teaching Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex gap-2"><span className="text-green-600">✓</span>Respond to students within 24 hours</li>
                  <li className="flex gap-2"><span className="text-green-600">✓</span>Update course content regularly</li>
                  <li className="flex gap-2"><span className="text-green-600">✓</span>Engage with student reviews</li>
                  <li className="flex gap-2"><span className="text-green-600">✓</span>Add practical exercises</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
