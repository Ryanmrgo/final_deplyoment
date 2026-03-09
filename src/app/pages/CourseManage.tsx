"use client";

import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { ArrowLeft, Save, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/app/components/AuthContext';

interface CourseManageProps {
  courseId: string;
}

type QuizQuestionType = 'multiple-choice' | 'fill-in-the-blank' | 'short-answer';

type QuizQuestion = {
  id: string;
  questionText: string;
  type: QuizQuestionType;
  options: string[];
  correctAnswer: string;
  points: number;
};

export function CourseManage({ courseId }: CourseManageProps) {
  const { user, userRole, isLoading } = useAuth();
  const router = useRouter();
  const questionInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const createQuestion = (): QuizQuestion => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    questionText: '',
    type: 'multiple-choice',
    options: ['', '', '', ''],
    correctAnswer: '',
    points: 1,
  });
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'Draft' | 'Published'>('Draft');
  const [category, setCategory] = useState('General');
  const [level, setLevel] = useState('Beginner');
  const [duration, setDuration] = useState('');
  const [price, setPrice] = useState('');
  const [language, setLanguage] = useState('English');
  const [requirements, setRequirements] = useState('');
  const [outcomes, setOutcomes] = useState('');
  const [syllabusUrl, setSyllabusUrl] = useState('');
  const [syllabusName, setSyllabusName] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [syllabusError, setSyllabusError] = useState<string | null>(null);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null);

  const [quizItems, setQuizItems] = useState<any[]>([]);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [quizTimeLimit, setQuizTimeLimit] = useState('30');
  const [quizTotalMarks, setQuizTotalMarks] = useState('100');
  const [quizAttempts, setQuizAttempts] = useState('1');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([createQuestion()]);
  const [quizSaving, setQuizSaving] = useState(false);
  const [quizMessage, setQuizMessage] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

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
        setDuration(String(data.durationHours ?? 0));
        setPrice(String(data.price ?? 0));
        setLanguage(data.language || 'English');
        setRequirements(data.requirements || '');
        setOutcomes(data.outcomes || '');
        setSyllabusUrl(data.syllabusUrl || '');
        setSyllabusName(data.syllabusName || '');
        setThumbnailUrl(data.image || '');
      })
      .catch(() => {
        setCourse(null);
      })
      .finally(() => setLoading(false));
  }, [courseId, user, userRole, isLoading, router]);

  useEffect(() => {
    if (!thumbnailFile) {
      setThumbnailPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(thumbnailFile);
    setThumbnailPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [thumbnailFile]);

  useEffect(() => {
    if (!courseId || !user || userRole !== 'teacher') return;
    fetch(`/api/teacher/quizzes?courseId=${courseId}`)
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data) => setQuizItems(data.items || []))
      .catch(() => setQuizItems([]));
  }, [courseId, user, userRole]);

  const getComputedQuizMarks = () =>
    quizQuestions.reduce((sum, question) => sum + (Number(question.points) || 0), 0);

  const handleAddQuestion = () => {
    setQuizQuestions((prev) => [...prev, createQuestion()]);
  };

  const handleRemoveQuestion = (id: string) => {
    setQuizQuestions((prev) => (prev.length > 1 ? prev.filter((question) => question.id !== id) : prev));
  };

  const handleQuestionChange = (id: string, field: keyof QuizQuestion, value: string | number) => {
    setQuizQuestions((prev) =>
      prev.map((question) =>
        question.id === id
          ? {
              ...question,
              [field]: field === 'points' ? Number(value) || 1 : value,
            }
          : question
      )
    );
  };

  const handleInsertBlank = (questionId: string) => {
    const inputElement = questionInputRefs.current[questionId];
    if (!inputElement) return;

    const cursorPosition = inputElement.selectionStart || 0;
    const currentText = inputElement.value;
    const blank = '___';
    const newText = currentText.slice(0, cursorPosition) + blank + currentText.slice(cursorPosition);
    
    handleQuestionChange(questionId, 'questionText', newText);
    
    // Set cursor position after the inserted blank
    setTimeout(() => {
      inputElement.focus();
      inputElement.setSelectionRange(cursorPosition + blank.length, cursorPosition + blank.length);
    }, 0);
  };

  const handleQuestionTypeChange = (id: string, value: QuizQuestionType) => {
    setQuizQuestions((prev) =>
      prev.map((question) => {
        if (question.id !== id) return question;
        if (value === 'multiple-choice') {
          return {
            ...question,
            type: value,
            options: question.options?.length ? question.options : ['', '', '', ''],
            correctAnswer: '',
          };
        }
        return {
          ...question,
          type: value,
          options: [],
          correctAnswer: '',
        };
      })
    );
  };

  const handleOptionChange = (questionId: string, index: number, value: string) => {
    setQuizQuestions((prev) =>
      prev.map((question) => {
        if (question.id !== questionId) return question;
        const options = [...question.options];
        options[index] = value;
        return { ...question, options };
      })
    );
  };

  const validateQuiz = () => {
    if (!quizTitle.trim()) return 'Quiz title is required.';
    if (quizQuestions.length === 0) return 'Add at least one question.';
    for (const [index, question] of quizQuestions.entries()) {
      if (!question.questionText.trim()) return `Question ${index + 1} text is required.`;
      if (!question.points || question.points < 1) return `Question ${index + 1} points must be at least 1.`;
      if (question.type === 'multiple-choice') {
        if (question.options.some((option) => !option.trim())) return `All options are required for Question ${index + 1}.`;
        if (!question.correctAnswer.trim()) return `Select a correct answer for Question ${index + 1}.`;
      } else if (!question.correctAnswer.trim()) {
        return `Correct answer is required for Question ${index + 1}.`;
      }
    }
    return null;
  };

  const resetQuizBuilder = () => {
    setQuizTitle('');
    setQuizDescription('');
    setQuizTimeLimit('30');
    setQuizTotalMarks('100');
    setQuizAttempts('1');
    setQuizQuestions([createQuestion()]);
  };

  const saveQuiz = async (publishNow: boolean) => {
    const validationError = validateQuiz();
    if (validationError) {
      setQuizMessage(validationError);
      return;
    }

    setQuizSaving(true);
    setQuizMessage(null);

    try {
      const payload = {
        title: quizTitle.trim(),
        description: quizDescription.trim(),
        courseId,
        questions: quizQuestions.map((question) => ({
          questionText: question.questionText.trim(),
          type: question.type,
          options: question.type === 'multiple-choice' ? question.options.map((option) => option.trim()) : [],
          correctAnswer: question.correctAnswer.trim(),
          points: Number(question.points) || 1,
        })),
        totalPoints: Number(quizTotalMarks) || getComputedQuizMarks(),
        passingScore: 70,
        timeLimit: Number(quizTimeLimit) || 0,
        attempts: Math.max(1, Number(quizAttempts) || 1),
        isPublished: publishNow,
      };

      const res = await fetch('/api/teacher/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setQuizMessage(data.error || 'Failed to create quiz.');
        return;
      }

      setQuizItems((prev) => [data.quiz, ...prev]);
      setQuizMessage(publishNow ? 'Quiz published successfully.' : 'Quiz saved as draft.');
      setPreviewOpen(false);
      resetQuizBuilder();
    } catch {
      setQuizMessage('Failed to create quiz.');
    } finally {
      setQuizSaving(false);
    }
  };

  const handlePublishExistingQuiz = async (quizId: string) => {
    try {
      const res = await fetch(`/api/teacher/quizzes/${quizId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setQuizMessage(data.error || 'Failed to publish quiz.');
        return;
      }
      setQuizItems((prev) => prev.map((quiz) => (String(quiz._id) === quizId ? { ...quiz, isPublished: true } : quiz)));
      setQuizMessage('Quiz published successfully.');
    } catch {
      setQuizMessage('Failed to publish quiz.');
    }
  };

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

  const handleSyllabusChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setSyllabusFile(null);
      setSyllabusError(null);
      return;
    }
    const error = validateSyllabusFile(file);
    setSyllabusError(error);
    setSyllabusFile(error ? null : file);
  };

  const handleThumbnailChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setThumbnailFile(null);
      setThumbnailError(null);
      return;
    }
    const error = validateThumbnailFile(file);
    setThumbnailError(error);
    setThumbnailFile(error ? null : file);
  };

  const handleSave = async () => {
    if (!courseId) return;
    if (!title.trim() || !description.trim()) {
      setSaveMessage('Title and description are required.');
      return;
    }
    if (syllabusError || thumbnailError) {
      return;
    }
    setSaving(true);
    setSaveMessage(null);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('status', visibility);
      formData.append('category', category.trim() || 'General');
      formData.append('level', level);
      formData.append('duration', duration ? String(Number(duration)) : '0');
      formData.append('price', price ? String(Number(price)) : '0');
      formData.append('language', language.trim() || 'English');
      formData.append('requirements', requirements.trim());
      formData.append('outcomes', outcomes.trim());
      if (syllabusFile) formData.append('syllabus', syllabusFile);
      if (thumbnailFile) formData.append('thumbnail', thumbnailFile);

      const res = await fetch(`/api/teacher/courses/${courseId}`, {
        method: 'PATCH',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setSaveMessage('Course settings saved successfully.');
        const updatedCourse = data.course || {};
        setCourse((prev: any) =>
          prev
            ? {
                ...prev,
                title,
                description,
                status: visibility,
                category,
                level,
                durationHours: duration,
                price,
                language,
                requirements,
                outcomes,
                image: updatedCourse.image || prev.image,
                syllabusUrl: updatedCourse.syllabusUrl || prev.syllabusUrl,
                syllabusName: updatedCourse.syllabusName || prev.syllabusName,
              }
            : prev
        );
        if (updatedCourse.syllabusUrl) {
          setSyllabusUrl(updatedCourse.syllabusUrl);
          setSyllabusName(updatedCourse.syllabusName || syllabusName);
        }
        if (updatedCourse.image) {
          setThumbnailUrl(updatedCourse.image);
        }
        if (syllabusFile) {
          setSyllabusFile(null);
          setSyllabusError(null);
        }
        if (thumbnailFile) {
          setThumbnailFile(null);
          setThumbnailError(null);
        }
      } else {
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
            <Card className="bg-white" id="quizzes">
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
                  <Textarea
                    id="desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description"
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="duration">Duration (hours)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="0"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="e.g. 12"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price (USD)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="e.g. 49"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Input
                      id="language"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      placeholder="e.g. English"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="requirements">Requirements</Label>
                  <Textarea
                    id="requirements"
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    placeholder="List any prerequisites or tools students should have"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="outcomes">Learning Outcomes</Label>
                  <Textarea
                    id="outcomes"
                    value={outcomes}
                    onChange={(e) => setOutcomes(e.target.value)}
                    placeholder="Describe the skills or outcomes students will gain"
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

            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">Media & syllabus</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="syllabus">Syllabus (PDF or PPTX)</Label>
                  <Input
                    id="syllabus"
                    type="file"
                    accept=".pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                    onChange={handleSyllabusChange}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Max file size: {MAX_SYLLABUS_MB}MB</p>
                  {syllabusName && syllabusUrl && (
                    <p className="text-xs text-gray-600 mt-1">
                      Current: <a className="underline" href={syllabusUrl} target="_blank" rel="noreferrer">{syllabusName}</a>
                    </p>
                  )}
                  {syllabusError && <p className="text-sm text-red-600">{syllabusError}</p>}
                </div>
                <div>
                  <Label htmlFor="thumbnail">Course Thumbnail</Label>
                  <Input
                    id="thumbnail"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleThumbnailChange}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Recommended: 1200x675, max {MAX_THUMBNAIL_MB}MB</p>
                  {(thumbnailPreviewUrl || thumbnailUrl) && (
                    <div className="mt-3">
                      <img
                        src={thumbnailPreviewUrl || thumbnailUrl}
                        alt="Course thumbnail preview"
                        className="h-36 w-full max-w-sm rounded-md object-cover border"
                      />
                    </div>
                  )}
                  {thumbnailError && <p className="text-sm text-red-600">{thumbnailError}</p>}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">Quizzes</CardTitle>
                <p className="text-sm text-gray-600">
                  Build student quizzes with MCQ, fill-in-the-blank, and short-answer questions.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border p-4 space-y-4">
                  <h3 className="font-semibold text-gray-900">Create Quiz</h3>
                  <div className="space-y-1.5">
                    <Label htmlFor="quiz-title">Quiz Title</Label>
                    <Input
                      id="quiz-title"
                      value={quizTitle}
                      onChange={(e) => setQuizTitle(e.target.value)}
                      placeholder="e.g. Week 1 Assessment"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="quiz-desc">Description</Label>
                    <Textarea
                      id="quiz-desc"
                      value={quizDescription}
                      onChange={(e) => setQuizDescription(e.target.value)}
                      placeholder="Brief quiz instructions"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="quiz-time">Time Limit (minutes)</Label>
                      <Input
                        id="quiz-time"
                        type="number"
                        min="0"
                        value={quizTimeLimit}
                        onChange={(e) => setQuizTimeLimit(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="quiz-marks">Total Marks</Label>
                      <Input
                        id="quiz-marks"
                        type="number"
                        min="1"
                        value={quizTotalMarks}
                        onChange={(e) => setQuizTotalMarks(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="quiz-attempts">Attempts</Label>
                      <Input
                        id="quiz-attempts"
                        type="number"
                        min="1"
                        value={quizAttempts}
                        onChange={(e) => setQuizAttempts(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Questions</h4>
                    <Button type="button" variant="outline" onClick={handleAddQuestion}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Question
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {quizQuestions.map((question, index) => (
                      <div key={question.id} className="rounded-md border p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">Question {index + 1}</p>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveQuestion(question.id)}
                            disabled={quizQuestions.length === 1}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="md:col-span-2 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <Label>Question Text</Label>
                              {question.type === 'fill-in-the-blank' && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleInsertBlank(question.id)}
                                  className="h-7 text-xs"
                                >
                                  Insert Blank
                                </Button>
                              )}
                            </div>
                            {question.type === 'fill-in-the-blank' && (
                              <p className="text-xs text-gray-600">Click "Insert Blank" to add ___ at cursor position</p>
                            )}
                            <Input
                              ref={(el) => {
                                questionInputRefs.current[question.id] = el;
                              }}
                              value={question.questionText}
                              onChange={(e) => handleQuestionChange(question.id, 'questionText', e.target.value)}
                              placeholder={
                                question.type === 'fill-in-the-blank'
                                  ? 'e.g. The capital of France is'
                                  : 'Enter question'
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Type</Label>
                            <Select
                              value={question.type}
                              onValueChange={(value: QuizQuestionType) => handleQuestionTypeChange(question.id, value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="multiple-choice">MCQ</SelectItem>
                                <SelectItem value="fill-in-the-blank">Fill in the Blank</SelectItem>
                                <SelectItem value="short-answer">Short Question</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {question.type === 'multiple-choice' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {question.options.map((option, optIndex) => (
                              <div key={`${question.id}-opt-${optIndex}`} className="space-y-1.5">
                                <Label>Option {optIndex + 1}</Label>
                                <Input
                                  value={option}
                                  onChange={(e) => handleOptionChange(question.id, optIndex, e.target.value)}
                                  placeholder={`Option ${optIndex + 1}`}
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label>{question.type === 'multiple-choice' ? 'Correct Option' : 'Correct Answer'}</Label>
                            {question.type === 'multiple-choice' ? (
                              <Select
                                value={
                                  question.correctAnswer
                                    ? String(Math.max(0, question.options.findIndex((opt) => opt === question.correctAnswer)))
                                    : undefined
                                }
                                onValueChange={(value) => {
                                  const selectedIndex = Number(value);
                                  const selectedOption = question.options[selectedIndex] ?? '';
                                  handleQuestionChange(question.id, 'correctAnswer', selectedOption);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select correct option" />
                                </SelectTrigger>
                                <SelectContent>
                                  {question.options.map((option, optIndex) => (
                                    <SelectItem key={`${question.id}-correct-${optIndex}`} value={String(optIndex)}>
                                      {option || `Option ${optIndex + 1}`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                value={question.correctAnswer}
                                onChange={(e) => handleQuestionChange(question.id, 'correctAnswer', e.target.value)}
                                placeholder="Enter expected answer"
                              />
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <Label>Marks</Label>
                            <Input
                              type="number"
                              min="1"
                              value={question.points}
                              onChange={(e) => handleQuestionChange(question.id, 'points', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button type="button" variant="outline" onClick={() => saveQuiz(false)} disabled={quizSaving}>
                      Save Draft
                    </Button>
                    <Button type="button" onClick={() => setPreviewOpen(true)} className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90">
                      Preview
                    </Button>
                    <p className="text-sm text-gray-600">Computed marks from questions: {getComputedQuizMarks()}</p>
                  </div>
                  {quizMessage && <p className="text-sm text-gray-700">{quizMessage}</p>}
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Created Quizzes</h3>
                  {quizItems.length === 0 ? (
                    <p className="text-sm text-gray-600">No quizzes yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {quizItems.map((quiz) => (
                        <div key={quiz._id} className="rounded-md border p-3 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-gray-900">{quiz.title}</p>
                            <p className="text-xs text-gray-600">
                              {quiz.questions?.length || 0} questions • {quiz.totalPoints || 0} marks • {quiz.timeLimit || 0} min • {quiz.attempts || 1} attempts
                            </p>
                          </div>
                          {quiz.isPublished ? (
                            <span className="text-xs font-medium px-2 py-1 rounded bg-green-100 text-green-700">Published</span>
                          ) : (
                            <Button
                              size="sm"
                              className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white"
                              onClick={() => handlePublishExistingQuiz(String(quiz._id))}
                            >
                              Publish
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
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

        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Quiz Preview</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="rounded-md border p-3 bg-gray-50">
                <p className="font-semibold text-gray-900">{quizTitle || 'Untitled Quiz'}</p>
                <p className="text-sm text-gray-600 mt-1">{quizDescription || 'No description provided.'}</p>
                <p className="text-xs text-gray-600 mt-2">
                  Time: {quizTimeLimit || 0} min • Total Marks: {quizTotalMarks || getComputedQuizMarks()} • Attempts: {quizAttempts || 1}
                </p>
              </div>

              <div className="space-y-3">
                {quizQuestions.map((question, index) => (
                  <div key={question.id} className="rounded-md border p-3">
                    <p className="font-medium text-gray-900">Q{index + 1}. {question.questionText || '(No question text)'}</p>
                    <p className="text-xs text-gray-600 mt-1">Type: {question.type} • Marks: {question.points}</p>
                    {question.type === 'fill-in-the-blank' && (
                      <p className="text-xs text-gray-500 mt-1">Correct Answer: {question.correctAnswer || '(not set)'}</p>
                    )}
                    {question.type === 'multiple-choice' && (
                      <ul className="list-disc ml-5 mt-2 text-sm text-gray-700 space-y-1">
                        {question.options.map((option, optIndex) => (
                          <li key={`${question.id}-preview-${optIndex}`}>{option || `(Option ${optIndex + 1})`}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => saveQuiz(false)} disabled={quizSaving}>
                Save Draft
              </Button>
              <Button
                onClick={() => saveQuiz(true)}
                disabled={quizSaving}
                className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white"
              >
                {quizSaving ? 'Publishing...' : 'Publish Quiz'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
