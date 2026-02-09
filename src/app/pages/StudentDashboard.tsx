"use client";

import { useAuth } from '@/app/components/AuthContext';
import { useCourses } from '@/app/components/CoursesContext';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Progress } from '@/app/components/ui/progress';
import { achievements } from '@/app/data/mockData';
import { Award, BookOpen, Clock, MessageSquare, Trash2, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export function StudentDashboard() {
  const { userRole, profile } = useAuth();
  const { getUserEnrolledCourses, hasUserReviewed, removeEnrollment } = useCourses();
  const [removingCourseId, setRemovingCourseId] = useState<string | null>(null);
  
  if (userRole !== 'student') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Student access only</h2>
          <p className="text-gray-600 mb-6">Please sign in as a student to view this dashboard.</p>
          <Link href="/login">
            <Button className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white">Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  const enrolledCourses = getUserEnrolledCourses();
  
  // Sort courses: active first (by progress), then unstarted
  const sortedCourses = [...enrolledCourses].sort((a, b) => {
    const progressA = a.userProgress || 0;
    const progressB = b.userProgress || 0;
    
    // First sort by completion status (incomplete first)
    if (progressA === 100 && progressB < 100) return 1;
    if (progressA < 100 && progressB === 100) return -1;
    
    // Then by progress (higher progress first)
    return progressB - progressA;
  });

  // Calculate dashboard stats
  const dashboardStats = {
    coursesEnrolled: enrolledCourses.length,
    coursesCompleted: enrolledCourses.filter(c => (c.userProgress || 0) >= 100).length,
    certificatesEarned: enrolledCourses.filter(c => (c.userProgress || 0) >= 100).length,
    hoursLearned: Math.round(enrolledCourses.reduce((total, course) => {
      const weeksMatch = course.duration.match(/\d+/);
      const weeks = weeksMatch ? parseInt(weeksMatch[0]) : 0;
      return total + (weeks * 10); // Assume 10 hours per week
    }, 0)),
    overallProgress: enrolledCourses.length > 0 
      ? Math.round(enrolledCourses.reduce((sum, course) => sum + (course.userProgress || 0), 0) / enrolledCourses.length)
      : 0
  };

  // Get courses in different categories
  const activeCourses = sortedCourses.filter(c => (c.userProgress || 0) > 0 && (c.userProgress || 0) < 100);
  const completedCourses = sortedCourses.filter(c => (c.userProgress || 0) === 100);
  const unstartedCourses = sortedCourses.filter(c => (c.userProgress || 0) === 0);

  const handleRemoveCourse = (courseId: string) => {
    if (window.confirm('Are you sure you want to remove this course? Your progress will be lost.')) {
      setRemovingCourseId(courseId);
      removeEnrollment(courseId);
      setTimeout(() => {
        setRemovingCourseId(null);
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile?.name || 'Student'}!
          </h1>
          <p className="text-gray-600">
            You have {enrolledCourses.length} enrolled courses • Overall Progress: {dashboardStats.overallProgress}%
          </p>
        </div>

        {/* Stats Cards - Updated to 4 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Enrolled Courses</p>
                  <p className="text-3xl font-bold text-[#1E3A8A]">{dashboardStats.coursesEnrolled}</p>
                </div>
                <BookOpen className="w-12 h-12 text-[#F59E0B]" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Completed</p>
                  <p className="text-3xl font-bold text-[#1E3A8A]">{dashboardStats.coursesCompleted}</p>
                </div>
                <Award className="w-12 h-12 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Hours Learned</p>
                  <p className="text-3xl font-bold text-[#1E3A8A]">{dashboardStats.hoursLearned}</p>
                </div>
                <Clock className="w-12 h-12 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Certificates</p>
                  <p className="text-3xl font-bold text-[#1E3A8A]">{dashboardStats.certificatesEarned}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My Courses - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* All My Courses Section */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900">My Courses ({enrolledCourses.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {enrolledCourses.length > 0 ? (
                  <div className="space-y-6">
                    {/* Course List */}
                    {sortedCourses.map((course) => {
                      const totalLessons = course.syllabus.reduce((total, section) => total + section.lessons.length, 0);
                      const progress = course.userProgress || 0;
                      const completedLessons = course.userCompletedLessons || 0;
                      
                      return (
                        <div key={course.id} className="border rounded-lg p-4 hover:shadow-md transition bg-white">
                          <div className="flex items-start gap-4">
                            <div className="relative flex-shrink-0">
                              <img
                                src={course.image || '/default-course.jpg'}
                                alt={course.title}
                                className="w-24 h-24 object-cover rounded-lg"
                              />
                              <Badge className={`absolute -top-2 -right-2 ${progress === 100 ? 'bg-green-600' : 'bg-[#1E3A8A]'} text-white`}>
                                {progress === 100 ? '🏆' : '📚'}
                              </Badge>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h3 className="font-semibold text-lg text-gray-900 mb-1">{course.title}</h3>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge className="bg-gray-100 text-gray-800">{course.category}</Badge>
                                    <Badge variant="outline" className="text-xs">{course.level}</Badge>
                                    <span className="text-sm text-gray-500">
                                      <Clock className="w-3 h-3 inline mr-1" />
                                      {course.duration}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <Badge className={`${progress === 100 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                    {progress === 100 ? 'Completed' : `${progress}%`}
                                  </Badge>
                                  {course.enrollmentDate && (
                                    <span className="text-xs text-gray-500">
                                      Enrolled: {course.enrollmentDate}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <Progress value={progress} className="mb-3 h-2" />
                              
                              <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-600">
                                  {completedLessons} of {totalLessons} lessons completed
                                </div>
                                <div className="flex gap-2">
                                  <Link href={`/courses/${course.id}`}>
                                    <Button className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white">
                                      {progress === 100 ? 'Learned' : progress > 0 ? 'Continue Learning' : 'Start Learning'}
                                    </Button>
                                  </Link>
                                  {/* Only show review button for courses that have progress >= 50% AND user hasn't reviewed yet */}
                                  {!hasUserReviewed(course.id) && progress >= 50 && (
                                    <Link href={`/courses/${course.id}`}>
                                      <Button variant="outline" className="border-[#1E3A8A] text-[#1E3A8A]">
                                        <MessageSquare className="w-4 h-4 mr-2" />
                                        Leave Review
                                      </Button>
                                    </Link>
                                  )}
                                  {/* Remove Course Button */}
                                  <Button
                                    variant="outline"
                                    onClick={() => handleRemoveCourse(course.id)}
                                    disabled={removingCourseId === course.id}
                                    className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
                                  >
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    {removingCourseId === course.id ? 'Removing...' : 'Remove'}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3">No courses enrolled yet</h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                      Start your learning journey by exploring our free courses. There's something for everyone!
                    </p>
                    <div className="flex gap-4 justify-center">
                      <Link href="/courses">
                        <Button className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white px-8 py-3">
                          <BookOpen className="w-5 h-5 mr-2" />
                          Browse All Courses
                        </Button>
                      </Link>
                      <Link href="/">
                        <Button variant="outline" className="border-[#1E3A8A] text-[#1E3A8A]">
                          View Homepage
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
                
                {/* Browse More Courses Button */}
                {enrolledCourses.length > 0 && (
                  <div className="mt-8 pt-6 border-t text-center">
                    <Link href="/courses">
                      <Button variant="outline" className="border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white px-8">
                        <BookOpen className="w-5 h-5 mr-2" />
                        Browse More Courses
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Removed Learning Goals section */}
          <div className="space-y-6">
            {/* Achievements */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {achievements.map((achievement) => (
                    <div key={achievement.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-3xl">{achievement.icon}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-900">{achievement.title}</p>
                        <p className="text-xs text-gray-600">{achievement.date}</p>
                      </div>
                    </div>
                  ))}
                  
                  {/* Dynamic Achievements */}
                  {completedCourses.length >= 1 && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <span className="text-3xl">🎓</span>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-900">First Course Completed</p>
                        <p className="text-xs text-gray-600">Great start to your learning journey!</p>
                      </div>
                    </div>
                  )}
                  
                  {completedCourses.length >= 3 && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <span className="text-3xl">⭐</span>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-900">Rising Star</p>
                        <p className="text-xs text-gray-600">Completed 3+ courses</p>
                      </div>
                    </div>
                  )}
                  
                  {dashboardStats.hoursLearned >= 50 && (
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <span className="text-3xl">⏱️</span>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-900">Dedicated Learner</p>
                        <p className="text-xs text-gray-600">50+ hours of learning</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Learning Streak */}
            <Card className="bg-gradient-to-br from-[#F59E0B] to-[#F97316] text-white">
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm mb-2">Learning Streak</p>
                  <p className="text-5xl font-bold mb-2">7</p>
                  <p className="text-sm">Days in a row!</p>
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <p className="text-xs">Keep it up! Learning consistency is key to success.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions - Removed Complete Reviews button */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/courses">
                  <Button className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Explore New Courses
                  </Button>
                </Link>
                
                {completedCourses.length > 0 && (
                  <Button 
                    variant="outline" 
                    className="w-full border-green-600 text-green-700 hover:bg-green-50"
                    onClick={() => {
                      // In a real app, this would navigate to certificates page
                      alert(`You have ${completedCourses.length} certificates available for download!`);
                    }}
                  >
                    <Award className="w-5 h-5 mr-2" />
                    View Certificates ({completedCourses.length})
                  </Button>
                )}
                
                <Link href="/profile">
                  <Button variant="outline" className="w-full border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white">
                    Edit Profile
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