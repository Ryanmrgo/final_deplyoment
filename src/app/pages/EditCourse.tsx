"use client";

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { categories } from '@/app/data/mockData';
import { useAuth } from '@/app/components/AuthContext';
import { useCourses, type LessonAttachment, type SyllabusSection } from '@/app/components/CoursesContext';

interface EditCourseProps {
  id: string;
}

type LessonEntry = { title: string; files: LessonAttachment[] };
type SyllabusSectionLocal = Omit<SyllabusSection, 'lessons'> & { lessons: LessonEntry[] };

export function EditCourse({ id }: EditCourseProps) {
  const router = useRouter();
  const { userRole } = useAuth();
  const { allCourses, updateCourse } = useCourses();

  const course = allCourses.find((item) => item.id === id);
  const categoryOptions = useMemo(() => categories, []);

  const [title, setTitle] = useState(course?.title ?? '');
  const [description, setDescription] = useState(course?.description ?? '');
  const [categoryId, setCategoryId] = useState(course?.categoryId ?? categories[0]?.id ?? '');
  const [level, setLevel] = useState(course?.level ?? 'Beginner');
  const [duration, setDuration] = useState(course?.duration ?? '4 weeks');
  const [image, setImage] = useState(course?.image ?? '');
  const [imageName, setImageName] = useState('');
  const [isPublished, setIsPublished] = useState(course?.isPublished ?? false);
  const [syllabus, setSyllabus] = useState<SyllabusSectionLocal[]>(
    course?.syllabus.map((section) => ({
      ...section,
      lessons: section.lessons.map((lesson) =>
        typeof lesson === 'string'
          ? { title: lesson, files: [] }
          : { title: lesson.title, files: lesson.files ?? [] }
      ),
    })) ?? [
      {
        id: '1',
        title: 'Getting Started',
        lessons: [{ title: 'Introduction', files: [] }],
      },
    ]
  );
  const [learningOutcomes, setLearningOutcomes] = useState<string[]>(
    course?.learningOutcomes?.length ? course.learningOutcomes : ['']
  );

  const handleImageFile = (file: File | null) => {
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImage(reader.result);
        setImageName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLessonFiles = (files: FileList | null, sectionIndex: number, lessonIndex: number) => {
    if (!files || files.length === 0) {
      return;
    }
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== 'string') {
          return;
        }
        const attachment: LessonAttachment = {
          name: file.name,
          type: file.type || 'application/octet-stream',
          dataUrl: reader.result,
        };
        setSyllabus((prev) =>
          prev.map((section, sIndex) => {
            if (sIndex !== sectionIndex) {
              return section;
            }
            const updatedLessons = section.lessons.map((lesson, lIndex) => {
              if (lIndex !== lessonIndex) {
                return lesson;
              }
              const current = lesson;
              return {
                ...current,
                files: [...(current.files ?? []), attachment],
              };
            });
            return { ...section, lessons: updatedLessons };
          })
        );
      };
      reader.readAsDataURL(file);
    });
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

  if (!course) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Course Not Found</h2>
          <Link href="/dashboard/teacher">
            <Button className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCategory = categories.find((category) => category.id === categoryId);
    if (!selectedCategory) {
      return;
    }

    const normalizedSyllabus = syllabus.map((section, index) => {
      const title = section.title.trim() || `Section ${index + 1}`;
      const lessons = section.lessons
        .map((lesson, lessonIndex) => {
          const lessonTitle = lesson.title.trim() || `Lesson ${lessonIndex + 1}`;
          return { ...lesson, title: lessonTitle };
        })
        .filter((lesson) => lesson.title.trim().length > 0);
      return {
        ...section,
        title,
        lessons: lessons.length ? lessons : [{ title: 'Lesson 1', files: [] }],
      };
    });

    updateCourse(course.id, {
      title,
      description,
      category: selectedCategory.name,
      categoryId: selectedCategory.id,
      level,
      duration,
      image,
      isPublished,
      syllabus: normalizedSyllabus,
      learningOutcomes: learningOutcomes.map((item) => item.trim()).filter(Boolean),
    });

    router.push('/dashboard/teacher');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="container mx-auto px-4 py-10">
        <Card className="bg-white max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl text-gray-900">Edit Course</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-gray-900">Course Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Intro to Web Development"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-900">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Write a short description of the course"
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
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    required
                  >
                    {categoryOptions.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level" className="text-gray-900">Level</Label>
                  <Input
                    id="level"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    placeholder="Beginner, Intermediate..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-gray-900">Duration</Label>
                  <Input
                    id="duration"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 6 weeks"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image" className="text-gray-900">Image</Label>
                  <div className="flex flex-col gap-3">
                    <Input
                      id="image"
                      value={image}
                      onChange={(e) => {
                        setImage(e.target.value);
                        setImageName('');
                      }}
                      placeholder="Paste image URL or use Upload"
                    />
                    <div className="flex items-center gap-3">
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageFile(e.target.files?.[0] ?? null)}
                        className="hidden"
                      />
                      <label
                        htmlFor="image-upload"
                        className="inline-flex items-center justify-center rounded-md border border-[#1E3A8A] px-3 py-2 text-sm text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white"
                      >
                        Browse
                      </label>
                      <span className="text-xs text-gray-600 truncate">
                        {imageName || 'No file selected'}
                      </span>
                    </div>
                  </div>
                  {image ? (
                    <div className="mt-2 overflow-hidden rounded-lg border bg-gray-50">
                      <img src={image} alt="Course preview" className="h-40 w-full object-cover" />
                    </div>
                  ) : null}
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="rounded"
                />
                Published (visible to students)
              </label>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-900">Syllabus</Label>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-[#1E3A8A] text-[#1E3A8A]"
                    onClick={() =>
                      setSyllabus((prev) => [
                        ...prev,
                        {
                          id: `${Date.now()}-${prev.length + 1}`,
                          title: '',
                          lessons: [{ title: '', files: [] }],
                        },
                      ])
                    }
                  >
                    Add Section
                  </Button>
                </div>

                {syllabus.map((section, sectionIndex) => (
                  <div key={section.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Input
                        value={section.title}
                        onChange={(e) =>
                          setSyllabus((prev) =>
                            prev.map((item, index) =>
                              index === sectionIndex ? { ...item, title: e.target.value } : item
                            )
                          )
                        }
                        placeholder={`Section ${sectionIndex + 1} title`}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() =>
                          setSyllabus((prev) => prev.filter((_, index) => index !== sectionIndex))
                        }
                      >
                        Remove
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {section.lessons.map((lesson, lessonIndex) => (
                        <div key={`${section.id}-lesson-${lessonIndex}`} className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Input
                            value={lesson.title}
                            onChange={(e) =>
                              setSyllabus((prev) =>
                                prev.map((item, index) =>
                                  index === sectionIndex
                                    ? {
                                        ...item,
                                        lessons: item.lessons.map((value, innerIndex) =>
                                          innerIndex === lessonIndex
                                            ? { ...value, title: e.target.value }
                                            : value
                                        ),
                                      }
                                    : item
                                )
                              )
                            }
                            placeholder={`Lesson ${lessonIndex + 1}`}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                            onClick={() =>
                              setSyllabus((prev) =>
                                prev.map((item, index) =>
                                  index === sectionIndex
                                    ? { ...item, lessons: item.lessons.filter((_, innerIndex) => innerIndex !== lessonIndex) }
                                    : item
                                )
                              )
                            }
                          >
                            Remove
                          </Button>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            id={`lesson-file-${sectionIndex}-${lessonIndex}`}
                            type="file"
                            multiple
                            onChange={(e) => handleLessonFiles(e.target.files, sectionIndex, lessonIndex)}
                            className="hidden"
                          />
                          <label
                            htmlFor={`lesson-file-${sectionIndex}-${lessonIndex}`}
                            className="inline-flex items-center justify-center rounded-md border border-[#1E3A8A] px-3 py-2 text-sm text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white"
                          >
                            Upload Lesson Files
                          </label>
                          <span className="text-xs text-gray-600">
                            {lesson.files.length ? `${lesson.files.length} file(s) attached` : 'No files'}
                          </span>
                        </div>
                        {lesson.files.length ? (
                          <div className="space-y-1 text-xs text-gray-600">
                            {lesson.files.map((file: LessonAttachment, fileIndex: number) => (
                              <div key={`${file.name}-${fileIndex}`} className="flex items-center justify-between gap-2">
                                <span className="truncate">{file.name}</span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="border-red-300 text-red-600 hover:bg-red-50"
                                  onClick={() =>
                                    setSyllabus((prev) =>
                                      prev.map((item, index) => {
                                        if (index !== sectionIndex) {
                                          return item;
                                        }
                                        return {
                                          ...item,
                                          lessons: item.lessons.map((value, innerIndex) => {
                                            if (innerIndex !== lessonIndex) {
                                              return value;
                                            }
                                            return {
                                              ...value,
                                              files: value.files.filter((_: LessonAttachment, attachmentIndex: number) => attachmentIndex !== fileIndex),
                                            };
                                          }),
                                        };
                                      })
                                    )
                                  }
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : null}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        className="border-[#1E3A8A] text-[#1E3A8A]"
                        onClick={() =>
                          setSyllabus((prev) =>
                            prev.map((item, index) =>
                              index === sectionIndex
                                ? { ...item, lessons: [...item.lessons, { title: '', files: [] }] }
                                : item
                            )
                          )
                        }
                      >
                        Add Lesson
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-900">What You'll Learn</Label>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-[#1E3A8A] text-[#1E3A8A]"
                    onClick={() => setLearningOutcomes((prev) => [...prev, ''])}
                  >
                    Add Outcome
                  </Button>
                </div>
                <div className="space-y-2">
                  {learningOutcomes.map((item, index) => (
                    <div key={`outcome-${index}`} className="flex items-center gap-3">
                      <Input
                        value={item}
                        onChange={(e) =>
                          setLearningOutcomes((prev) =>
                            prev.map((value, valueIndex) => (valueIndex === index ? e.target.value : value))
                          )
                        }
                        placeholder={`Outcome ${index + 1}`}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() =>
                          setLearningOutcomes((prev) => prev.filter((_, valueIndex) => valueIndex !== index))
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit" className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white">
                  Save Changes
                </Button>
                <Link href="/dashboard/teacher">
                  <Button variant="outline" className="border-[#1E3A8A] text-[#1E3A8A]">
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
