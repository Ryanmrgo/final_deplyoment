// app/pages/CourseDetails.tsx - UPDATED VERSION with edit/remove review
"use client";

import { useAuth } from '@/app/components/AuthContext';
import { useCourses } from '@/app/components/CoursesContext';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/app/components/ui/accordion';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Textarea } from '@/app/components/ui/textarea';
import { Award, BookOpen, CheckCircle, ChevronRight, Clock, Download, Heart, MessageSquare, Send, Star, Trash2, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface CourseDetailsProps {
  id: string;
}

export function CourseDetails({ id }: CourseDetailsProps) {
  const router = useRouter();
  const { userRole, profile } = useAuth();
  const { 
    allCourses, 
    publicCourses, 
    enrollInCourse, 
    submitReview, 
    updateReview,
    removeReview,
    hasUserReviewed, 
    getUserReview, 
    isEnrolled,
    getEnrollmentDate,
    updateCourseProgress
  } = useCourses();
  
  const courseSource = userRole === 'teacher' ? allCourses : publicCourses;
  const course = courseSource.find((c) => c.id === id);
  
  const [isSaved, setIsSaved] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [isDeletingReview, setIsDeletingReview] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    // Load completed lessons from localStorage
    if (course) {
      const savedProgress = localStorage.getItem(`course_${id}_progress`);
      if (savedProgress) {
        try {
          setCompletedLessons(JSON.parse(savedProgress));
        } catch (error) {
          console.error('Error loading progress:', error);
          setCompletedLessons([]);
        }
      }
    }
  }, [id, course]);

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

  const averageRating = course.rating;
  const fullStars = Math.floor(averageRating);
  const hasHalfStar = averageRating % 1 !== 0;
  const userHasReviewed = hasUserReviewed(id);
  const userReview = getUserReview(id);
  const userIsEnrolled = isEnrolled(id);
  const enrollmentDate = getEnrollmentDate(id);

  // Calculate progress based on completed lessons
  const totalLessons = course.syllabus.reduce((total, section) => total + section.lessons.length, 0);
  const userProgress = userIsEnrolled ? Math.round((completedLessons.length / totalLessons) * 100) : 0;

  const handleEnroll = () => {
    if (!userRole) {
      router.push(`/login?redirect=/courses/${id}`);
      return;
    }
    
    if (userRole === 'student') {
      if (!userIsEnrolled) {
        setIsEnrolling(true);
        enrollInCourse(id);
        setTimeout(() => {
          setIsEnrolling(false);
          router.push('/dashboard/student');
        }, 500);
      } else {
        router.push('/dashboard/student');
      }
    } else {
      alert('Switch to student account to enroll in courses');
    }
  };

  const handleMarkLessonComplete = (lessonId: string) => {
    let newCompletedLessons;
    if (completedLessons.includes(lessonId)) {
      newCompletedLessons = completedLessons.filter(id => id !== lessonId);
    } else {
      newCompletedLessons = [...completedLessons, lessonId];
    }
    
    setCompletedLessons(newCompletedLessons);
    
    // Save to localStorage
    localStorage.setItem(`course_${id}_progress`, JSON.stringify(newCompletedLessons));
    
    // Calculate and update progress
    const newProgress = Math.round((newCompletedLessons.length / totalLessons) * 100);
    updateCourseProgress(id, newProgress, newCompletedLessons.length);
  };

  const handleSubmitReview = () => {
    if (reviewComment.trim()) {
      setIsSubmittingReview(true);
      submitReview(id, reviewRating, reviewComment);
      setTimeout(() => {
        setIsSubmittingReview(false);
        setReviewComment('');
        setReviewRating(5);
        setShowReviewForm(false);
        setIsEditingReview(false);
        router.refresh();
      }, 500);
    }
  };

  const handleUpdateReview = () => {
    if (reviewComment.trim()) {
      setIsSubmittingReview(true);
      updateReview(id, reviewRating, reviewComment);
      setTimeout(() => {
        setIsSubmittingReview(false);
        setReviewComment('');
        setReviewRating(5);
        setShowReviewForm(false);
        setIsEditingReview(false);
        router.refresh();
      }, 500);
    }
  };

  const handleDeleteReview = () => {
    setIsDeletingReview(true);
    removeReview(id);
    setTimeout(() => {
      setIsDeletingReview(false);
      setShowDeleteConfirm(false);
      router.refresh();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero Section */}
      <section className="bg-[#1E3A8A] text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/courses" className="hover:text-[#F59E0B] transition">
              Courses
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-300">{course.category}</span>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-xl text-gray-200 mb-6">{course.description}</p>
            </div>
            
            {userIsEnrolled && (
              <div className="flex flex-col items-end gap-2">
                <Badge className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 px-4 py-2">
                  <CheckCircle className="w-4 h-4" />
                  Enrolled
                </Badge>
                {enrollmentDate && (
                  <span className="text-sm text-gray-300">
                    Since {enrollmentDate}
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-6 mt-4">
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
          
          {/* Progress bar for enrolled students */}
          {userIsEnrolled && (
            <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Your Progress</span>
                <span className="text-sm font-semibold">{userProgress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-[#F59E0B] h-3 rounded-full transition-all duration-500"
                  style={{ width: `${userProgress}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-300 mt-1">
                {completedLessons.length} of {totalLessons} lessons completed
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Course Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course Overview */}
            {course.learningOutcomes?.length ? (
              <Card className="bg-white">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4 text-gray-900">What You'll Learn</h2>
                  <p className="text-gray-700 leading-relaxed mb-6">{course.description}</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    {course.learningOutcomes.map((outcome, index) => (
                      <div key={`${outcome}-${index}`} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-1 flex-shrink-0">
                          <span className="text-green-600 text-sm">✓</span>
                        </div>
                        <span className="text-gray-700">{outcome}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* Course Syllabus */}
            <Card className="bg-white">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
                  <h2 className="text-2xl font-bold text-gray-900">Course Syllabus</h2>
                  {userIsEnrolled && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        {completedLessons.length} / {totalLessons} lessons completed
                      </span>
                      {userProgress === 100 && (
                        <Badge className="bg-green-100 text-green-800">Course Completed!</Badge>
                      )}
                    </div>
                  )}
                </div>
                <Accordion type="single" collapsible className="w-full">
                  {course.syllabus.map((section, sectionIndex) => {
                    const sectionLessons = section.lessons;
                    const completedInSection = completedLessons.filter(lessonId => 
                      lessonId.startsWith(`${section.id}-`)
                    ).length;
                    
                    return (
                      <AccordionItem key={section.id} value={`section-${sectionIndex}`}>
                        <AccordionTrigger className="text-left hover:text-[#1E3A8A]">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-8 h-8 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center text-sm font-semibold">
                              {sectionIndex + 1}
                            </div>
                            <div className="flex-1 text-left">
                              <span className="font-semibold">{section.title}</span>
                              {userIsEnrolled && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {completedInSection} of {sectionLessons.length} lessons completed
                                </div>
                              )}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="ml-11 mt-2 space-y-4">
                            {section.lessons.map((lesson, lessonIndex) => {
                              const lessonId = `${section.id}-${lessonIndex}`;
                              const lessonTitle = typeof lesson === 'string' ? lesson : lesson.title;
                              const isCompleted = completedLessons.includes(lessonId);
                              
                              return (
                                <li key={lessonIndex} className="text-gray-700 border-b pb-3 last:border-b-0">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3 flex-1">
                                      <div className={`mt-1 w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 ${
                                        isCompleted 
                                          ? 'bg-green-100 border-green-300' 
                                          : 'bg-gray-100 border-gray-300'
                                      }`}>
                                        {isCompleted ? (
                                          <CheckCircle className="w-4 h-4 text-green-600" />
                                        ) : (
                                          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                        )}
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <BookOpen className={`w-4 h-4 ${isCompleted ? 'text-green-600' : 'text-[#F59E0B]'}`} />
                                          <span className={isCompleted ? 'text-green-700 line-through' : ''}>
                                            {lessonTitle}
                                          </span>
                                        </div>
                                        
                                        {/* Lesson files */}
                                        {typeof lesson !== 'string' && lesson.files?.length ? (
                                          <div className="mt-2 space-y-2 pl-6">
                                            {lesson.files.map((file, fileIndex) => (
                                              <div key={`${file.name}-${fileIndex}`} className="flex items-center gap-2">
                                                <a
                                                  href={file.dataUrl}
                                                  download={file.name}
                                                  className="text-sm text-[#1E3A8A] hover:underline flex items-center gap-1"
                                                  onClick={(e) => {
                                                    if (!userIsEnrolled) {
                                                      e.preventDefault();
                                                      alert('Please enroll in the course to access resources');
                                                    }
                                                  }}
                                                >
                                                  <Download className="w-3 h-3" />
                                                  {file.name}
                                                  <span className="text-xs text-gray-500">({file.type})</span>
                                                </a>
                                              </div>
                                            ))}
                                          </div>
                                        ) : null}
                                      </div>
                                    </div>
                                    
                                    {userIsEnrolled && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleMarkLessonComplete(lessonId)}
                                        className={`ml-2 ${isCompleted ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : ''}`}
                                      >
                                        {isCompleted ? '✓ Completed' : 'Mark Complete'}
                                      </Button>
                                    )}
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </CardContent>
            </Card>

            {/* Instructor */}
            <Card className="bg-white">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Instructor</h2>
                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="text-2xl bg-[#1E3A8A] text-white">
                      {course.instructor.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold mb-1 text-gray-900">{course.instructor.name}</h3>
                    <p className="text-gray-600">{course.instructor.bio}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card className="bg-white">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Student Reviews</h2>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 fill-[#F59E0B] text-[#F59E0B]" />
                    <span className="font-bold text-gray-900">{averageRating.toFixed(1)}</span>
                    <span className="text-gray-500">({course.reviewCount} reviews)</span>
                  </div>
                </div>
                
                {course.reviews.length > 0 ? (
                  <div className="space-y-6">
                    {course.reviews.map((review) => {
                      const isUserReview = review.id.includes('user_') && review.student === (profile?.name || 'You');
                      return (
                        <div key={review.id} className="border-b pb-6 last:border-b-0 relative">
                          {isUserReview && (
                            <Badge className="absolute top-0 right-0 bg-green-100 text-green-800">Your Review</Badge>
                          )}
                          <div className="flex items-start gap-4">
                            <Avatar>
                              <AvatarFallback className={`${isUserReview ? 'bg-green-600' : 'bg-[#1E3A8A]'} text-white`}>
                                {review.student.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <p className="font-semibold text-gray-900">{review.student}</p>
                                <div className="flex items-center gap-2">
                                  <div className="flex">
                                    {[...Array(review.rating)].map((_, i) => (
                                      <Star key={i} className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" />
                                    ))}
                                  </div>
                                  <span className="text-sm text-gray-500">{review.date}</span>
                                </div>
                              </div>
                              <p className="text-gray-700">{review.comment}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg mb-2">No reviews yet</p>
                    <p className="text-gray-500">Be the first to review this course!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Review Submission/Edit Form - Only for enrolled students */}
            {userRole === 'student' && userIsEnrolled && (
              <Card className={`bg-white ${!userHasReviewed ? 'border-2 border-dashed border-[#F59E0B]' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {userHasReviewed ? 'Your Review' : 'Share Your Experience'}
                      </h2>
                      <p className="text-gray-600">
                        {userHasReviewed 
                          ? 'You can edit or delete your review below' 
                          : 'Help other students by reviewing this course'}
                      </p>
                    </div>
                    {!userHasReviewed || isEditingReview ? (
                      <Button 
                        variant={showReviewForm ? "outline" : "default"}
                        className={`${showReviewForm ? 'border-[#1E3A8A] text-[#1E3A8A]' : 'bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white'}`}
                        onClick={() => {
                          if (showReviewForm && isEditingReview) {
                            setIsEditingReview(false);
                            setReviewComment('');
                            setReviewRating(5);
                          }
                          setShowReviewForm(!showReviewForm);
                        }}
                      >
                        {showReviewForm ? 'Cancel' : isEditingReview ? 'Cancel Edit' : 'Write Review'}
                      </Button>
                    ) : null}
                  </div>
                  
                  {showReviewForm ? (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-900">
                          {isEditingReview ? 'Edit Your Review' : 'Share Your Experience'}
                        </h3>
                        {isEditingReview && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setIsEditingReview(false);
                              setReviewComment('');
                              setReviewRating(5);
                              setShowReviewForm(false);
                            }}
                          >
                            Cancel Edit
                          </Button>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Your Rating
                        </label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              className="p-1 hover:scale-110 transition-transform"
                              aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                            >
                              <Star
                                className={`w-10 h-10 ${
                                  star <= reviewRating
                                    ? 'fill-[#F59E0B] text-[#F59E0B]'
                                    : 'text-gray-300'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                          Selected: {reviewRating} star{reviewRating !== 1 ? 's' : ''}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Your Review
                        </label>
                        <Textarea
                          placeholder="What did you like about this course? What could be improved? Share your experience..."
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          rows={5}
                          className="resize-none"
                        />
                        <div className="mt-1 text-sm text-gray-500">
                          {reviewComment.length}/500 characters
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <Button
                          className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white px-6"
                          onClick={isEditingReview ? handleUpdateReview : handleSubmitReview}
                          disabled={isSubmittingReview || !reviewComment.trim()}
                        >
                          {isSubmittingReview ? (
                            <>{isEditingReview ? 'Updating Review...' : 'Submitting Review...'}</>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              {isEditingReview ? 'Update Review' : 'Submit Review'}
                            </>
                          )}
                        </Button>
                        {!isEditingReview && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowReviewForm(false);
                              setReviewComment('');
                              setReviewRating(5);
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : userHasReviewed && userReview && !isEditingReview ? (
                    <div className="space-y-6">
                      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">Your Rating</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex">
                                {[...Array(userReview.rating)].map((_, i) => (
                                  <Star key={i} className="w-5 h-5 fill-[#F59E0B] text-[#F59E0B]" />
                                ))}
                              </div>
                              <span className="font-medium text-gray-700">{userReview.rating}/5</span>
                              <span className="text-sm text-gray-500 ml-2">{userReview.date}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setReviewRating(userReview.rating);
                                setReviewComment(userReview.comment);
                                setIsEditingReview(true);
                                setShowReviewForm(true);
                              }}
                              className="border-blue-200 text-blue-700 hover:bg-blue-50"
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowDeleteConfirm(true)}
                              className="border-red-200 text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900 mb-2">Your Comment</h3>
                          <p className="text-gray-700 bg-white p-4 rounded border">{userReview.comment}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">No review submitted yet</p>
                      <p className="text-gray-500 text-sm">
                        Click "Write Review" above to share your thoughts about this course
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Course Info Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20 bg-white shadow-xl border-2 border-gray-100">
              <div className="relative h-48 overflow-hidden rounded-t-lg">
                {course.image ? (
                  <img 
                    src={course.image} 
                    alt={course.title} 
                    className="w-full h-full object-cover transition-transform hover:scale-105 duration-500" 
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500">
                    <div className="text-center">
                      <BookOpen className="w-12 h-12 mx-auto mb-2" />
                      <span className="text-sm">Course Image</span>
                    </div>
                  </div>
                )}
                {userIsEnrolled && (
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-green-600 text-white shadow-lg">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Enrolled
                    </Badge>
                  </div>
                )}
                {userProgress === 100 && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-[#F59E0B] text-white shadow-lg">
                      🏆 Completed
                    </Badge>
                  </div>
                )}
              </div>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <p className="text-4xl font-bold text-[#1E3A8A] mb-2">FREE</p>
                  <p className="text-gray-600">100% Free, No Hidden Costs</p>
                </div>

                <Button
                  className="w-full bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white py-6 text-lg mb-4 transition-all duration-300 hover:scale-[1.02]"
                  onClick={handleEnroll}
                  disabled={isEnrolling}
                >
                  {isEnrolling ? (
                    <>Enrolling...</>
                  ) : userIsEnrolled ? (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Go to Dashboard
                    </>
                  ) : (
                    'Enroll Now - It\'s Free!'
                  )}
                </Button>

                {/* Wishlist Button */}
                <Button
                  variant="outline"
                  className="w-full border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white mb-4 transition-all duration-300"
                  onClick={() => setIsSaved(!isSaved)}
                >
                  <Heart className={`w-4 h-4 mr-2 transition-all ${isSaved ? 'fill-red-500 text-red-500 scale-110' : ''}`} />
                  {isSaved ? 'Saved to Wishlist' : 'Save for Later'}
                </Button>

                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Duration
                    </span>
                    <span className="font-semibold text-gray-900">{course.duration}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Level
                    </span>
                    <Badge variant="outline" className="font-medium">{course.level}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Students
                    </span>
                    <span className="font-semibold text-gray-900">{course.students.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Category
                    </span>
                    <Badge className="bg-[#1E3A8A] text-white">{course.category}</Badge>
                  </div>
                  {userIsEnrolled && userProgress > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        Your Progress
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-green-600">{userProgress}%</span>
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 transition-all duration-500"
                            style={{ width: `${userProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold mb-3 text-gray-900">This course includes:</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      Lifetime access to all content
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      Certificate of completion
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      Downloadable resources
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      Community support
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      Progress tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      Mobile-friendly access
                    </li>
                  </ul>
                </div>

                {/* Quick Actions for Enrolled Students */}
                {userIsEnrolled && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="font-semibold mb-3 text-gray-900">Quick Actions</h4>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start text-left border-gray-200 hover:bg-gray-50"
                        onClick={() => router.push('/dashboard/student')}
                      >
                        📊 View Progress Dashboard
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start text-left border-gray-200 hover:bg-gray-50"
                        onClick={() => {
                          if (!userHasReviewed) {
                            setShowReviewForm(true);
                          } else {
                            setReviewRating(userReview?.rating || 5);
                            setReviewComment(userReview?.comment || '');
                            setIsEditingReview(true);
                            setShowReviewForm(true);
                          }
                        }}
                      >
                        {userHasReviewed ? '✏️ Edit Your Review' : '⭐ Leave a Review'}
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start text-left border-gray-200 hover:bg-gray-50"
                        onClick={() => {
                          // Mark all as complete
                          const allLessonIds = course.syllabus.flatMap((section, sectionIndex) => 
                            section.lessons.map((_, lessonIndex) => `${section.id}-${lessonIndex}`)
                          );
                          setCompletedLessons(allLessonIds);
                          localStorage.setItem(`course_${id}_progress`, JSON.stringify(allLessonIds));
                          updateCourseProgress(id, 100, allLessonIds.length);
                        }}
                      >
                        🏁 Mark All Complete
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Review Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-white w-full max-w-md">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Review</h3>
                <p className="text-gray-600">
                  Are you sure you want to delete your review? This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleDeleteReview}
                  disabled={isDeletingReview}
                >
                  {isDeletingReview ? 'Deleting...' : 'Delete Review'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}