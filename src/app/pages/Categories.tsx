"use client";

import Link from 'next/link';
import { Card, CardContent } from '@/app/components/ui/card';
import { categories } from '@/app/data/mockData';
import { useCourses } from '@/app/components/CoursesContext';

export function Categories() {
  const { publicCourses } = useCourses();
  const courseCounts = publicCourses.reduce<Record<string, number>>((acc, course) => {
    acc[course.categoryId] = (acc[course.categoryId] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <section className="bg-[#1E3A8A] text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Explore Categories</h1>
          <p className="text-xl text-gray-200">
            Find your next learning path across {categories.length}+ categories.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Link key={category.id} href={`/courses?category=${category.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-white border-2 hover:border-[#F59E0B]">
                  <CardContent className="p-8 text-center">
                    <div className="text-5xl mb-4">{category.icon}</div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">{category.name}</h2>
                    <p className="text-sm text-gray-600">{courseCounts[category.id] ?? 0} courses</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
