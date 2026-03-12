"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CourseCard } from '@/app/components/CourseCard';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Search } from 'lucide-react';
import { useAuth } from '@/app/components/AuthContext';
import { COURSE_CATEGORIES } from '@/lib/courseCategories';

type CategoryItem = { id: string; name: string; icon: string };

type CourseItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  instructor: { name: string; avatar: string };
  rating: number;
  reviewCount: number;
  students: number;
  level: string;
  duration: string;
  image?: string;
  userProgress?: number;
};

export function Courses() {
  const { user, userRole } = useAuth();
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get('category');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryFromUrl);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<CourseItem[]>([]);
  const [enrollments, setEnrollments] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<CategoryItem[]>(COURSE_CATEGORIES);

  useEffect(() => {
    let mounted = true;
    fetch('/api/categories')
      .then((r) => (r.ok ? r.json() : { items: COURSE_CATEGORIES }))
      .then((data) => {
        const items = Array.isArray(data?.items) && data.items.length ? data.items : COURSE_CATEGORIES;
        if (mounted) setCategories(items);
      })
      .catch(() => {
        if (mounted) setCategories(COURSE_CATEGORIES);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const fetchCourses = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/courses', { signal: controller.signal });
        if (!res.ok) {
          if (mounted) setCourses([]);
          return;
        }
        const data = await res.json();
        if (mounted) {
          setCourses(Array.isArray(data?.items) ? data.items : []);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        if (mounted) setCourses([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchCourses();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    if (!user || userRole !== 'student') {
      setEnrollments({});
      return () => {
        mounted = false;
        controller.abort();
      };
    }

    const fetchEnrollments = async () => {
      try {
        const res = await fetch('/api/student/enrollments', { signal: controller.signal });
        if (!res.ok) {
          if (mounted) setEnrollments({});
          return;
        }

        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          if (mounted) setEnrollments({});
          return;
        }

        const data = await res.json();
        const items = Array.isArray(data?.items) ? data.items : [];
        const mapped = items.reduce((acc: Record<string, string>, enrollment: any) => {
          const courseRef = enrollment?.courseId;
          const courseId =
            typeof courseRef === 'string'
              ? courseRef
              : courseRef?._id
                ? String(courseRef._id)
                : '';

          if (courseId) {
            acc[courseId] = enrollment?.enrolledAt
              ? new Date(enrollment.enrolledAt).toISOString().split('T')[0]
              : '';
          }
          return acc;
        }, {});

        if (mounted) setEnrollments(mapped);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        if (mounted) setEnrollments({});
      }
    };

    fetchEnrollments();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [user, userRole]);

  useEffect(() => {
    setSelectedCategory(categoryFromUrl);
  }, [categoryFromUrl]);

  useEffect(() => {
    let result = courses;

    // Filter by category
    if (selectedCategory) {
      const selectedCategoryName = categories.find((category) => category.id === selectedCategory)?.name;
      result = selectedCategoryName
        ? result.filter((course) => course.category === selectedCategoryName)
        : result;
    }

    // Filter by search query
    if (searchQuery) {
      result = result.filter(
        (course) =>
          course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredCourses(result);
  }, [searchQuery, selectedCategory, courses, categories]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <section className="bg-[#1E3A8A] text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Explore Our Free Courses</h1>
          <p className="text-xl text-gray-200">
            Discover {courses.length}+ courses across multiple categories. All completely free!
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search courses by title, description, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 py-6 text-lg bg-white"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-3">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(null)}
              className={
                selectedCategory === null
                  ? 'bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white'
                  : 'border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white'
              }
            >
              All Categories
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category.id)}
                className={
                  selectedCategory === category.id
                    ? 'bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white'
                    : 'border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white'
                }
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing <span className="font-semibold text-[#1E3A8A]">{filteredCourses.length}</span> course
            {filteredCourses.length !== 1 ? 's' : ''}
            {selectedCategory && (
              <span>
                {' '}
                in{' '}
                <Badge className="bg-[#1E3A8A]">
                  {categories.find((c) => c.id === selectedCategory)?.name}
                </Badge>
              </span>
            )}
          </p>
          {/* Show enrolled courses count */}
          <div className="mt-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <span className="font-semibold">
                {filteredCourses.filter((course) => Boolean(enrollments[course.id])).length}
              </span> courses enrolled
            </Badge>
          </div>
        </div>

        {/* Course Grid */}
        {loading ? (
          <div className="col-span-full flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A]"></div>
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                {...course}
                isEnrolled={Boolean(enrollments[course.id])}
                enrollmentDate={enrollments[course.id] || undefined}
                userProgress={course.userProgress || 0}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-xl text-gray-600 mb-4">No courses found matching your criteria</p>
            <Button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
              }}
              className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}