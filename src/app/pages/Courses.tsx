"use client";

import { CourseCard } from '@/app/components/CourseCard';
import { useCourses } from '@/app/components/CoursesContext';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { categories } from '@/app/data/mockData';
import { Filter, Search } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export function Courses() {
  const { publicCourses, isEnrolled, getEnrollmentDate } = useCourses();
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get('category');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryFromUrl);
  const [filteredCourses, setFilteredCourses] = useState(publicCourses);

  useEffect(() => {
    setSelectedCategory(categoryFromUrl);
  }, [categoryFromUrl]);

  useEffect(() => {
    let result = publicCourses;

    // Filter by category
    if (selectedCategory) {
      result = result.filter((course) => course.categoryId === selectedCategory);
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
  }, [searchQuery, selectedCategory, publicCourses]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <section className="bg-[#1E3A8A] text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Explore Our Free Courses</h1>
          <p className="text-xl text-gray-200">
            Discover {publicCourses.length}+ courses across multiple categories. All completely free!
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
            <Button className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white px-6">
              <Filter className="w-5 h-5 mr-2" />
              Filter
            </Button>
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
                {filteredCourses.filter(c => isEnrolled(c.id)).length}
              </span> courses enrolled
            </Badge>
          </div>
        </div>

        {/* Course Grid */}
        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                {...course}
                isEnrolled={isEnrolled(course.id)}
                enrollmentDate={getEnrollmentDate(course.id) || undefined}
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