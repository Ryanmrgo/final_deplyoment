"use client";

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { CourseCard } from '@/app/components/CourseCard';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Search, Filter } from 'lucide-react';
import { categories } from '@/app/data/mockData';

interface Course {
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
  image: string;
}

export function Courses() {
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get('category');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryFromUrl);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory) {
        const catName = categories.find((c) => c.id === selectedCategory)?.name;
        if (catName) params.set('category', catName);
      }
      if (searchQuery) params.set('search', searchQuery);
      const res = await fetch(`/api/courses?${params}`);
      const data = await res.json();
      setFilteredCourses(data.items || []);
    } catch {
      setFilteredCourses([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    setSelectedCategory(categoryFromUrl);
  }, [categoryFromUrl]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleSearch = () => fetchCourses();

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <section className="bg-[#1E3A8A] text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Explore Our Free Courses</h1>
          <p className="text-xl text-gray-200">
            Discover free courses across multiple categories. All completely free!
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
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 py-6 text-lg bg-white"
              />
            </div>
            <Button
                onClick={handleSearch}
                disabled={loading}
                className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white px-6"
              >
                <Search className="w-5 h-5 mr-2" />
                Search
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
        </div>

        {/* Course Grid */}
        {loading ? (
          <div className="col-span-full flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A]"></div>
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} {...course} />
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
