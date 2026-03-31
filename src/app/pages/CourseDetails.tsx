"use client";

import { useAuth } from '@/app/components/AuthContext';
import { FileOrUrlInput } from '@/app/components/FileOrUrlInput';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/app/components/ui/accordion';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Progress } from '@/app/components/ui/progress';
import { Textarea } from '@/app/components/ui/textarea';
import { Award, BookOpen, CheckCircle, ChevronRight, Clock, FileText, MessageSquare, PlayCircle, Star, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { uploadFileToCloudinary } from '@/lib/cloudinaryClient';

interface CourseDetailsProps {
  id: string;
}

export function CourseDetails({ id }: CourseDetailsProps) {
  const { user, userRole, isLoading } = useAuth();
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState('');
  const [updatingProgress, setUpdatingProgress] = useState(false);
  const [lessons, setLessons] = useState<any[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [lessonsError, setLessonsError] = useState('');
  const [assignments, setAssignments] = useState<any[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [submissionDrafts, setSubmissionDrafts] = useState<Record<string, { content: string; files: File[]; url: string }>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [discussionLoading, setDiscussionLoading] = useState(false);
  const [discussionDraft, setDiscussionDraft] = useState('');
  const [discussionError, setDiscussionError] = useState('');
  const [postingDiscussion, setPostingDiscussion] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const [quizItems, setQuizItems] = useState<any[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [autoMarkingLessons, setAutoMarkingLessons] = useState<Set<string>>(new Set());
  const [autoMarkCountdown, setAutoMarkCountdown] = useState<Record<string, number>>({});

  const setSubmissionDraft = (assignmentId: string, field: 'content' | 'files' | 'url', value: any) => {
    setSubmissionDrafts(prev => ({
      ...prev,
      [assignmentId]: {
        content: prev[assignmentId]?.content || '',
        files: prev[assignmentId]?.files || [],
        url: prev[assignmentId]?.url || '',
        [field]: value,
      },
    }));
  };

  const normalizeVideoUrl = (url: string) => {
    try {
      const parsed = new URL(url);

      // YouTube regular videos: youtube.com/watch?v=videoId
      if (parsed.hostname.includes('youtube.com')) {
        const videoId = parsed.searchParams.get('v');
        if (videoId) return `https://www.youtube-nocookie.com/embed/${videoId}?modestbranding=1&rel=0`;
      }

      // YouTube shorts: youtube.com/shorts/videoId
      if (parsed.hostname.includes('youtube.com') && parsed.pathname.includes('/shorts/')) {
        const videoId = parsed.pathname.split('/shorts/')[1]?.split('?')[0]?.trim();
        if (videoId) return `https://www.youtube-nocookie.com/embed/${videoId}?modestbranding=1&rel=0`;
      }

      // Short YouTube links: youtu.be/videoId
      if (parsed.hostname.includes('youtu.be')) {
        const videoId = parsed.pathname.replace('/', '').trim();
        if (videoId) return `https://www.youtube-nocookie.com/embed/${videoId}?modestbranding=1&rel=0`;
      }

      // Vimeo videos
      if (parsed.hostname.includes('vimeo.com')) {
        const videoId = parsed.pathname.split('/').filter(Boolean).pop();
        if (videoId) return `https://player.vimeo.com/video/${videoId}`;
      }

      return url;
    } catch {
      return url;
    }
  };

  const getLessonStorageKey = () => {
    const userId = String((user as any)?.id || (user as any)?._id || (user as any)?.userId || 'anonymous');
    return `course:${id}:completedLessons:${userId}`;
  };

  const calculateProgressFromCompletedLessons = (completedIds: string[], currentLessons: any[]) => {
    const totalLessons = currentLessons.length;
    if (totalLessons === 0) return 0;
    const completedCount = currentLessons.filter((lesson) => completedIds.includes(String(lesson.id))).length;
    return Math.round((completedCount / totalLessons) * 100);
  };

  useEffect(() => {
    if (isEnrolled && userRole === 'student') {
      const fetchData = async () => {
        setAssignmentsLoading(true);
        try {
          const [assignRes, subRes] = await Promise.all([
            fetch(`/api/student/assignments?courseId=${id}`),
            fetch(`/api/student/submissions?courseId=${id}`)
          ]);
          const assignData = await assignRes.json();
          const subData = await subRes.json();
          setAssignments(assignData.items || []);
          setSubmissions(subData.items || []);
        } catch (error) {
          console.error(error);
        } finally {
          setAssignmentsLoading(false);
        }
      };
      fetchData();
    }
  }, [isEnrolled, userRole, id]);

  const submitAssignment = async (assignmentId: string, courseId: string) => {
    const draft = submissionDrafts[assignmentId];
    if (!draft) return;

    setSubmitting(prev => ({ ...prev, [assignmentId]: true }));
    try {
      const uploadedAttachments = draft.files.length
        ? await Promise.all(
            draft.files.map((file) =>
              uploadFileToCloudinary(file, { folder: 'submissions', resourceType: 'raw' })
            )
          )
        : [];

      const payload: Record<string, unknown> = {
        assignmentId,
        courseId,
        content: draft.content,
        url: draft.url,
      };

      if (uploadedAttachments.length > 0) {
        payload.attachments = uploadedAttachments.map((item) => item.url);
      }

      const res = await fetch('/api/student/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Refresh submissions
      const subRes = await fetch(`/api/student/submissions?courseId=${courseId}`);
      const subData = await subRes.json();
      setSubmissions(subData.items || []);
      setSubmissionDrafts(prev => ({ ...prev, [assignmentId]: { content: '', files: [], url: '' } }));
      toast.success('Assignment submitted!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit');
    } finally {
      setSubmitting(prev => ({ ...prev, [assignmentId]: false }));
    }
  };

  useEffect(() => {
    fetch(`/api/courses/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setCourse(data);
        setIsEnrolled(data.isEnrolled || false);
        setEnrollmentId(data.enrollmentId || null);
        setProgress(data.enrollmentProgress ?? 0);
        if (data?.myReview) {
          setReviewRating(Number(data.myReview.rating) || 5);
          setReviewComment(String(data.myReview.comment || ''));
        }
      })
      .catch(() => setCourse(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!user || lessons.length === 0) {
      setCompletedLessonIds([]);
      return;
    }

    try {
      const raw = localStorage.getItem(getLessonStorageKey());
      const parsed = raw ? JSON.parse(raw) : [];
      const valid = Array.isArray(parsed)
        ? parsed.map((value) => String(value)).filter((lessonId) => lessons.some((lesson) => String(lesson.id) === lessonId))
        : [];
      setCompletedLessonIds(valid);
    } catch {
      setCompletedLessonIds([]);
    }
  }, [id, user, lessons]);

  useEffect(() => {
    const isInstructor = Boolean(course?.isInstructor);
    const canViewLessons = Boolean(user) && (isEnrolled || isInstructor);

    if (!canViewLessons) {
      setLessons([]);
      setLessonsError('');
      setDiscussions([]);
      setQuizItems([]);
      return;
    }

    setLessonsLoading(true);
    setLessonsError('');
    fetch(`/api/courses/${id}/lessons`)
      .then(async (r) => {
        if (r.ok) return r.json();
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to load lessons');
      })
      .then((data) => setLessons(data.items || []))
      .catch((error: any) => {
        setLessons([]);
        setLessonsError(error?.message || 'Failed to load lessons');
      })
      .finally(() => setLessonsLoading(false));

    if (userRole === 'student') {
      setDiscussionLoading(true);
      fetch(`/api/courses/${id}/discussions`)
        .then((r) => (r.ok ? r.json() : { items: [] }))
        .then((data) => setDiscussions(data.items || []))
        .catch(() => setDiscussions([]))
        .finally(() => setDiscussionLoading(false));

      setQuizLoading(true);
      fetch(`/api/student/quizzes?courseId=${id}`)
        .then((r) => (r.ok ? r.json() : { items: [] }))
        .then((data) => setQuizItems(data.items || []))
        .catch(() => setQuizItems([]))
        .finally(() => setQuizLoading(false));
    }
  }, [id, isEnrolled, user, userRole, course?.isInstructor]);

  const handleEnroll = async () => {
    if (isLoading || !user || userRole !== 'student') return;
    const previousEnrolled = isEnrolled;
    const previousProgress = progress;
    setIsEnrolled(true);
    setProgress(0);
    setIsEnrolling(true);
    setEnrollError('');
    const toastId = toast.loading('Enrolling in course...');
    try {
      const res = await fetch('/api/enrollment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to enroll');
      setIsEnrolled(true);
      setProgress(0);
      toast.success('Enrolled successfully.', { id: toastId });
    } catch (e: any) {
      setIsEnrolled(previousEnrolled);
      setProgress(previousProgress);
      setEnrollError(e.message || 'Failed to enroll');
      toast.error(e?.message || 'Failed to enroll', { id: toastId });
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleUpdateProgress = async (newProgress: number) => {
    if (!enrollmentId || newProgress === progress) return;
    const previousProgress = progress;
    setProgress(newProgress);
    setUpdatingProgress(true);
    const toastId = toast.loading('Updating progress...');
    try {
      const res = await fetch(`/api/student/enrollments/${enrollmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: newProgress }),
      });
      if (!res.ok) throw new Error('Failed to update progress');
      toast.success('Progress updated.', { id: toastId });
    } catch (e: any) {
      setProgress(previousProgress);
      toast.error(e?.message || 'Failed to update progress', { id: toastId });
    } finally {
      setUpdatingProgress(false);
    }
  };

  const handleCompleteLesson = async (lessonId: string) => {
    if (!enrollmentId || userRole !== 'student' || !isEnrolled) return;

    const normalizedLessonId = String(lessonId);
    if (completedLessonIds.includes(normalizedLessonId)) return;

    const nextCompleted = [...completedLessonIds, normalizedLessonId];
    setCompletedLessonIds(nextCompleted);

    try {
      localStorage.setItem(getLessonStorageKey(), JSON.stringify(nextCompleted));
    } catch {
      // ignore localStorage failures
    }

    const computedProgress = calculateProgressFromCompletedLessons(nextCompleted, lessons);
    await handleUpdateProgress(computedProgress);
  };

  // Auto-mark video lesson after 30 seconds of viewing (user can still manually complete)
  useEffect(() => {
    const timers: Record<string, NodeJS.Timeout> = {};

    lessons.forEach((lesson) => {
      const lessonId = String(lesson.id);

      // Only auto-mark video and text lessons (not PDF/PPT that require download)
      if (['video', 'text'].includes(lesson.type) && lesson.content && isEnrolled && userRole === 'student' && !completedLessonIds.includes(lessonId)) {
        // Start countdown at 30 seconds
        if (!autoMarkCountdown[lessonId]) {
          setAutoMarkCountdown((prev) => ({ ...prev, [lessonId]: 30 }));
        }

        timers[lessonId] = setInterval(() => {
          setAutoMarkCountdown((prev) => {
            const current = prev[lessonId] ?? 0;
            if (current <= 1) {
              // Auto-mark when countdown reaches 0
              if (!completedLessonIds.includes(lessonId)) {
                handleCompleteLesson(lessonId);
              }
              return { ...prev, [lessonId]: 0 };
            }
            return { ...prev, [lessonId]: current - 1 };
          });
        }, 1000);
      }
    });

    return () => {
      Object.values(timers).forEach((timer) => clearInterval(timer));
    };
  }, [lessons, isEnrolled, userRole, completedLessonIds, enrollmentId]);

  const handlePostDiscussion = async () => {
    const question = discussionDraft.trim();
    if (!question) {
      setDiscussionError('Question is required.');
      return;
    }

    const tempDiscussion = {
      _id: `temp-${Date.now()}`,
      question,
      resolved: false,
      replies: [],
    };

    const previousDiscussions = discussions;
    setDiscussions((prev) => [tempDiscussion, ...prev]);
    setDiscussionDraft('');
    setPostingDiscussion(true);
    setDiscussionError('');
    const toastId = toast.loading('Posting question...');
    try {
      const res = await fetch(`/api/courses/${id}/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post question');

      setDiscussions((prev) => [data.discussion, ...prev.filter((item) => item._id !== tempDiscussion._id)]);
      toast.success('Question posted.', { id: toastId });
    } catch (error: any) {
      setDiscussions(previousDiscussions);
      setDiscussionError(error?.message || 'Failed to post question.');
      toast.error(error?.message || 'Failed to post question.', { id: toastId });
    } finally {
      setPostingDiscussion(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewComment.trim()) {
      setReviewMessage('Please add a review comment.');
      return;
    }

    const previousCourse = course;
    const previousReviewMessage = reviewMessage;
    const optimisticReview = {
      id: `temp-${Date.now()}`,
      student: user?.name || 'You',
      rating: reviewRating,
      comment: reviewComment.trim(),
      date: new Date().toLocaleDateString(),
    };

    setCourse((prev: any) => {
      if (!prev) return prev;
      const existingReviews = Array.isArray(prev.reviews) ? prev.reviews : [];
      const existingIndex = existingReviews.findIndex((r: any) => r.student === optimisticReview.student);
      let nextReviews = existingReviews;
      if (existingIndex >= 0) {
        nextReviews = existingReviews.map((r: any, idx: number) => (idx === existingIndex ? { ...r, ...optimisticReview } : r));
      } else {
        nextReviews = [optimisticReview, ...existingReviews];
      }

      const total = nextReviews.reduce((sum: number, r: any) => sum + Number(r.rating || 0), 0);
      const avg = nextReviews.length ? total / nextReviews.length : 0;

      return {
        ...prev,
        reviews: nextReviews,
        reviewCount: nextReviews.length,
        rating: avg,
      };
    });

    setReviewSubmitting(true);
    setReviewMessage('');
    const toastId = toast.loading('Submitting review...');
    try {
      const res = await fetch(`/api/courses/${id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit review');

      setCourse((prev: any) =>
        prev
          ? {
            ...prev,
            reviews: data.reviews || prev.reviews,
            rating: data.rating,
            reviewCount: data.reviewCount,
          }
          : prev
      );
      setReviewMessage('Review submitted successfully.');
      toast.success('Review submitted.', { id: toastId });
    } catch (error: any) {
      setCourse(previousCourse);
      setReviewMessage(error?.message || previousReviewMessage || 'Failed to submit review.');
      toast.error(error?.message || 'Failed to submit review.', { id: toastId });
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A]" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Course Not Found</h2>
          <Link href="/courses">
            <Button className="bg-[#F59E0B] hover:bg-[#F59E0B]/90">Browse Courses</Button>
          </Link>
        </div>
      </div>
    );
  }

  const averageRating = course.rating ?? 0;
  const fullStars = Math.floor(averageRating);
  const hasHalfStar = averageRating % 1 !== 0;
  const syllabus = course.syllabus || [];
  const syllabusMaterials = Array.isArray(course.syllabusMaterials) ? course.syllabusMaterials : [];
  const hasSyllabusFile = Boolean(course.syllabusUrl);
  const hasSyllabusMaterials = syllabusMaterials.length > 0;
  const learningOutcomes = String(course.outcomes || '')
    .split(/\r?\n|•|\u2022/)
    .map((item: string) => item.trim())
    .filter(Boolean);
  const courseRequirements = String(course.requirements || '')
    .split(/\r?\n|•|\u2022/)
    .map((item: string) => item.trim())
    .filter(Boolean);
  const reviews = course.reviews || [];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <section className="bg-[#1E3A8A] text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/courses" className="hover:text-[#F59E0B] transition">Courses</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-300">{course.category}</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
          <p className="text-xl text-gray-200 mb-6">{course.description}</p>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(fullStars)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-[#F59E0B] text-[#F59E0B]" />
                ))}
                {hasHalfStar && <Star className="w-5 h-5 fill-[#F59E0B]/50 text-[#F59E0B]" />}
                {[...Array(5 - Math.ceil(averageRating))].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-gray-400" />
                ))}
              </div>
              <span className="font-semibold">{averageRating.toFixed(1)}</span>
              <span className="text-gray-300">({course.reviewCount} reviews)</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>{course.students} students enrolled</span>
            </div>
            <Badge className="bg-[#F59E0B] text-white text-sm">{course.level}</Badge>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="bg-white">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">What You&apos;ll Learn</h2>
                <p className="text-gray-700 leading-relaxed mb-6">{course.description}</p>
                <div className="grid md:grid-cols-2 gap-4">
                  {(learningOutcomes.length > 0
                    ? learningOutcomes
                    : ['Master the fundamentals', 'Build real-world projects', 'Hands-on practice', 'Certificate of completion']).map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-1 flex-shrink-0">
                          <span className="text-green-600 text-sm">✓</span>
                        </div>
                        <span className="text-gray-700">{item}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {courseRequirements.length > 0 && (
              <Card className="bg-white">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4 text-gray-900">Requirements</h2>
                  <ul className="space-y-2">
                    {courseRequirements.map((item: string, index: number) => (
                      <li key={`${item}-${index}`} className="flex items-start gap-2 text-gray-700">
                        <span className="mt-1 text-[#1E3A8A]">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {syllabus.length > 0 && (
              <Card className="bg-white">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4 text-gray-900">Course Syllabus</h2>
                  <Accordion type="single" collapsible className="w-full">
                    {syllabus.map((section: any, index: number) => (
                      <AccordionItem key={index} value={`section-${index}`}>
                        <AccordionTrigger className="text-left hover:text-[#1E3A8A]">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center text-sm font-semibold">
                              {index + 1}
                            </div>
                            <span className="font-semibold">{section.title}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="ml-11 mt-2 space-y-2">
                            {(section.lessons || []).map((lesson: string, i: number) => (
                              <li key={i} className="flex items-center gap-2 text-gray-700">
                                <BookOpen className="w-4 h-4 text-[#F59E0B]" />
                                <span>{lesson}</span>
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            )}

            {(hasSyllabusFile || hasSyllabusMaterials) && (
              <Card className="bg-white">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-3 text-gray-900">
                    {hasSyllabusFile ? 'Syllabus File' : 'Course Materials'}
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    {hasSyllabusFile
                      ? 'Download or view the course syllabus provided by the teacher.'
                      : 'Download or view course materials provided by the teacher.'}
                  </p>
                  {hasSyllabusFile ? (
                    <a
                      href={course.syllabusUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-md bg-[#1E3A8A] px-4 py-2 text-sm font-medium text-white hover:bg-[#1E3A8A]/90"
                    >
                      Open {course.syllabusName || 'Syllabus'}
                    </a>
                  ) : null}
                  {hasSyllabusMaterials ? (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-gray-900">{hasSyllabusFile ? 'More Materials' : 'Materials'}</p>
                      <div className="space-y-2">
                        {syllabusMaterials.map((material: any, index: number) => (
                          <a
                            key={`${material.url || ''}-${index}`}
                            href={material.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded border px-3 py-2 text-sm text-[#1E3A8A] hover:bg-blue-50"
                          >
                            {material.label || material.name || `Material ${index + 1}`}
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )}

            {(isEnrolled || course?.isInstructor) && (
              <Card className="bg-white">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4 text-gray-900 flex items-center gap-2">
                    <PlayCircle className="w-6 h-6 text-[#1E3A8A]" />
                    Course Lessons
                  </h2>
                  {course?.isInstructor && !isEnrolled ? (
                    <p className="text-xs text-gray-500 mb-3">Instructor preview mode.</p>
                  ) : null}
                  {lessonsLoading ? (
                    <p className="text-sm text-gray-600">Loading lessons...</p>
                  ) : lessonsError ? (
                    <p className="text-sm text-red-600">{lessonsError}</p>
                  ) : lessons.length === 0 ? (
                    <p className="text-sm text-gray-600">No lessons published yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {lessons.map((lesson) => (
                        <div key={lesson.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{lesson.title}</h3>
                            <div className="flex items-center gap-2">
                              {completedLessonIds.includes(String(lesson.id)) ? (
                                <Badge className="bg-green-100 text-green-700">Completed</Badge>
                              ) : null}
                              <Badge variant="outline">{String(lesson.type || 'text').toUpperCase()}</Badge>
                            </div>
                          </div>
                          {lesson.description ? <p className="text-sm text-gray-700 mb-3">{lesson.description}</p> : null}

                          {lesson.type === 'video' && lesson.content ? (
                            <div className="space-y-3">
                              <div className="aspect-video w-full overflow-hidden rounded-md border bg-black">
                                <iframe
                                  src={normalizeVideoUrl(String(lesson.content))}
                                  title={`${lesson.title} video lesson`}
                                  className="h-full w-full"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                  allowFullScreen
                                />
                              </div>

                            </div>
                          ) : null}

                          {(lesson.type === 'pdf' || lesson.type === 'ppt') && lesson.fileUrl ? (
                            <a
                              href={lesson.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm text-[#1E3A8A] underline"
                            >
                              Open material
                            </a>
                          ) : null}

                          {lesson.type === 'text' && lesson.content ? (
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{lesson.content}</p>
                          ) : null}

                          {isEnrolled && userRole === 'student' ? (
                            <div className="mt-4 space-y-2">
                              {completedLessonIds.includes(String(lesson.id)) ? (
                                <Button disabled size="sm" className="bg-green-600 text-white hover:bg-green-600">
                                  Lesson Completed
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white"
                                    onClick={() => handleCompleteLesson(String(lesson.id))}
                                  >
                                    Mark as Complete
                                  </Button>
                                  {autoMarkCountdown[String(lesson.id)] && autoMarkCountdown[String(lesson.id)] > 0 && (
                                    <p className="text-xs text-gray-600">
                                      Auto-marking in {autoMarkCountdown[String(lesson.id)]}s...
                                    </p>
                                  )}
                                </>
                              )}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {isEnrolled && userRole === 'student' && (
              <Card className="bg-white">
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-2xl font-bold text-gray-900">Course Quizzes</h2>
                  {quizLoading ? (
                    <p className="text-sm text-gray-600">Loading quizzes...</p>
                  ) : quizItems.length === 0 ? (
                    <p className="text-sm text-gray-600">No published quizzes yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {quizItems.map((quiz) => (
                        <div key={quiz.id} className="border rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-gray-900">{quiz.title}</p>
                            <p className="text-xs text-gray-600">
                              {quiz.totalPoints} points • Passing {quiz.passingScore}% • {quiz.timeLimit ? `${quiz.timeLimit} min` : 'No time limit'}
                            </p>
                          </div>
                          <Link href={`/courses/${id}/quiz/${quiz.id}`}>
                            <Button className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white" size="sm">
                              Take Quiz
                            </Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {isEnrolled && userRole === 'student' && (
              <Card className="bg-white">
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-[#1E3A8A]" />
                    Course Discussions
                  </h2>

                  <div className="space-y-2">
                    <Label htmlFor="discussionQuestion">Ask a question</Label>
                    <div className="flex gap-2">
                      <Input
                        id="discussionQuestion"
                        value={discussionDraft}
                        onChange={(e) => setDiscussionDraft(e.target.value)}
                        placeholder="Write your question here..."
                      />
                      <Button
                        className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90"
                        disabled={postingDiscussion}
                        onClick={handlePostDiscussion}
                      >
                        {postingDiscussion ? 'Posting...' : 'Post'}
                      </Button>
                    </div>
                    {discussionError ? <p className="text-sm text-red-600">{discussionError}</p> : null}
                  </div>

                  {discussionLoading ? (
                    <p className="text-sm text-gray-600">Loading discussions...</p>
                  ) : discussions.length === 0 ? (
                    <p className="text-sm text-gray-600">No discussions yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {discussions.map((discussion) => (
                        <div key={discussion._id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <p className="font-medium text-gray-900">{discussion.question || discussion.content || 'Question'}</p>
                            <Badge className={discussion.resolved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                              {discussion.resolved ? 'Resolved' : 'Open'}
                            </Badge>
                          </div>
                          {(discussion.replies || []).map((reply: any, index: number) => (
                            <div key={`${discussion._id}-reply-${index}`} className="bg-gray-50 rounded p-2 text-sm text-gray-700 mt-2">
                              {reply.message || reply.content}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {isEnrolled && userRole === 'student' && (
              <Card className="bg-white">
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-[#1E3A8A]" />
                    Assignments
                  </h2>

                  {assignmentsLoading ? (
                    <p className="text-sm text-gray-600">Loading assignments...</p>
                  ) : assignments.length === 0 ? (
                    <p className="text-sm text-gray-600">No assignments yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {assignments.map((ass: any) => {
                        const submission = submissions.find((s: any) => s.assignmentId === ass._id);
                        const isSubmitted = !!submission;
                        const isGraded = submission?.status === 'Graded';
                        return (
                          <div key={ass._id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold text-gray-900">{ass.title}</h3>
                                <p className="text-sm text-gray-600 mt-1">{ass.description}</p>
                                <p className="text-xs text-gray-500 mt-2">
                                  Due: {new Date(ass.dueDate).toLocaleDateString()} • Max Points: {ass.maxPoints}
                                </p>
                              </div>
                              {isSubmitted && (
                                <Badge className={isGraded ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                                  {isGraded ? 'Graded' : 'Submitted'}
                                </Badge>
                              )}
                            </div>

                            {!isSubmitted ? (
                              <div className="mt-4 space-y-3">
                                <Textarea
                                  placeholder="Your submission content (optional)"
                                  value={submissionDrafts[ass._id]?.content || ''}
                                  onChange={(e) => setSubmissionDraft(ass._id, 'content', e.target.value)}
                                />
                                <FileOrUrlInput
                                  label="Attach your work"
                                  accept=".pdf,.doc,.docx,.txt"
                                  multiple={true}
                                  maxSizeMB={20}
                                  onFilesChange={(files: File[]) => setSubmissionDraft(ass._id, 'files', files)}
                                  onUrlChange={(url: string) => setSubmissionDraft(ass._id, 'url', url)}
                                  allowUrl={true}
                                  allowFiles={true}
                                />
                                <Button
                                  className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white"
                                  onClick={() => submitAssignment(ass._id, ass.courseId)}
                                  disabled={submitting[ass._id]}
                                >
                                  {submitting[ass._id] ? 'Submitting...' : 'Submit Assignment'}
                                </Button>
                              </div>
                            ) : (
                              <div className="mt-4 text-sm">
                                {isGraded ? (
                                  <div className="bg-gray-50 p-3 rounded">
                                    <p>Grade: {submission.grade?.points} / {submission.grade?.maxPoints}</p>
                                    <p>Feedback: {submission.grade?.feedback || 'No feedback'}</p>
                                  </div>
                                ) : (
                                  <p className="text-gray-600">Your submission has been recorded. Awaiting grading.</p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="bg-white">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Instructor</h2>
                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="text-2xl bg-[#1E3A8A] text-white">{course.instructor?.avatar || '👩‍🏫'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold mb-1 text-gray-900">{course.instructor?.name || 'Instructor'}</h3>
                    <p className="text-gray-600">{course.instructor?.bio || 'Expert instructor'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Student Reviews</h2>
                {isEnrolled && userRole === 'student' ? (
                  <div className="border rounded-lg p-4 mb-6 space-y-3">
                    <h3 className="font-semibold text-gray-900">Write a review</h3>
                    <div className="space-y-1.5">
                      <Label htmlFor="reviewRating">Rating</Label>
                      <select
                        id="reviewRating"
                        title="Review rating"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        value={reviewRating}
                        onChange={(e) => setReviewRating(Number(e.target.value))}
                      >
                        <option value={5}>5 - Excellent</option>
                        <option value={4}>4 - Good</option>
                        <option value={3}>3 - Average</option>
                        <option value={2}>2 - Poor</option>
                        <option value={1}>1 - Bad</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="reviewComment">Comment</Label>
                      <Textarea
                        id="reviewComment"
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Share your learning experience"
                        rows={3}
                      />
                    </div>
                    <Button
                      className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white"
                      disabled={reviewSubmitting}
                      onClick={handleSubmitReview}
                    >
                      {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                    </Button>
                    {reviewMessage ? <p className="text-sm text-gray-700">{reviewMessage}</p> : null}
                  </div>
                ) : null}

                {reviews.length > 0 ? (
                  <div className="space-y-6">
                    {reviews.map((review: any) => (
                      <div key={review.id} className="border-b pb-6 last:border-b-0">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar>
                            <AvatarFallback className="bg-[#1E3A8A] text-white">{review.student?.charAt(0) || 'S'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-gray-900">{review.student || 'Student'}</p>
                            <div className="flex items-center gap-2">
                              <div className="flex">
                                {[...Array(review.rating || 0)].map((_, i) => (
                                  <Star key={i} className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" />
                                ))}
                              </div>
                              <span className="text-sm text-gray-500">{review.date}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-700">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-8">No reviews yet. Be the first to review!</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-20 bg-white shadow-xl">
              <div className="relative h-48 overflow-hidden rounded-t-lg">
                <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
              </div>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <p className="text-4xl font-bold text-[#1E3A8A] mb-2">FREE</p>
                  <p className="text-gray-600">100% Free, No Hidden Costs</p>
                </div>

                {userRole === 'student' ? (
                  <>
                    {isEnrolled ? (
                      <div className="mb-4">
                        <Link href={`/courses/${id}/learn`} className="block mb-3">
                          <Button className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white">
                            Open Learning Player
                          </Button>
                        </Link>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Your Progress</span>
                          <span className="text-sm font-bold text-[#1E3A8A]">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-3 mb-4" />
                        <div className="flex flex-wrap gap-2">
                          {[25, 50, 75, 100].map((p) => (
                            <Button
                              key={p}
                              variant={progress >= p ? 'default' : 'outline'}
                              size="sm"
                              disabled={updatingProgress}
                              onClick={() => handleUpdateProgress(p)}
                              className={progress >= p ? 'bg-green-600' : ''}
                            >
                              {p}%
                            </Button>
                          ))}
                        </div>
                        {progress >= 100 && (
                          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                            <p className="text-green-800 font-semibold text-center">Course Completed!</p>
                            <p className="text-green-600 text-sm text-center">Certificate earned</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <Button
                          onClick={handleEnroll}
                          disabled={isEnrolling}
                          className="w-full bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white py-6 text-lg mb-4"
                        >
                          {isEnrolling ? 'Enrolling...' : "Enroll Now - It's Free!"}
                        </Button>
                        {enrollError && <p className="text-red-600 text-sm text-center mb-2">{enrollError}</p>}
                      </>
                    )}
                  </>
                ) : userRole === 'teacher' ? (
                  <div className="w-full space-y-3 mb-4">
                    <div className="border-2 border-blue-200 bg-blue-50 rounded-lg py-4 px-4">
                      <p className="text-blue-800 font-semibold mb-1">👨‍🏫 Teacher View</p>
                      <p className="text-sm text-blue-700">
                        {course.status === 'Draft'
                          ? 'This course is hidden from students. Publish it when ready.'
                          : 'This course is visible to students.'}
                      </p>
                    </div>
                    <Link href={`/dashboard/teacher/course/${id}`}>
                      <Button variant="outline" className="w-full border-blue-600 text-blue-700">
                        Edit course settings
                      </Button>
                    </Link>
                    <Link href={`/dashboard/teacher/course/${id}/lessons`}>
                      <Button variant="outline" className="w-full border-blue-600 text-blue-700">
                        Manage lesson uploads
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <Link href="/auth/sign-in">
                    <Button className="w-full bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white py-6 text-lg mb-4">
                      Sign In to Enroll
                    </Button>
                  </Link>
                )}

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center gap-2"><Clock className="w-5 h-5" />Duration</span>
                    <span className="font-semibold">{course.duration}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center gap-2"><Award className="w-5 h-5" />Level</span>
                    <Badge variant="outline">{course.level}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center gap-2"><Users className="w-5 h-5" />Students</span>
                    <span className="font-semibold">{course.students}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center gap-2"><BookOpen className="w-5 h-5" />Category</span>
                    <Badge className="bg-[#1E3A8A]">{course.category}</Badge>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold mb-3 text-gray-900">This course includes:</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {['Lifetime access', 'Certificate of completion', 'Downloadable resources', 'Community support'].map((item, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
