"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/app/components/ui/card';
import { COURSE_CATEGORIES } from '@/lib/courseCategories';

type CategoryItem = { id: string; name: string; icon: string };

export function Categories() {
  const [courseCounts, setCourseCounts] = useState<Record<string, number>>({});
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

    const fetchCounts = async () => {
      try {
        const res = await fetch('/api/courses', { signal: controller.signal });
        if (!res.ok) {
          if (mounted) setCourseCounts({});
          return;
        }
        const data = await res.json();
        const items = Array.isArray(data?.items) ? data.items : [];
        const categoryNameToId = Object.fromEntries(categories.map((c) => [c.name, c.id]));
        const counts = items.reduce((acc: Record<string, number>, course: { category?: string }) => {
          const categoryId = categoryNameToId[String(course.category || '')];
          if (categoryId) {
            acc[categoryId] = (acc[categoryId] ?? 0) + 1;
          }
          return acc;
        }, {});
        if (mounted) setCourseCounts(counts);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        if (mounted) setCourseCounts({});
      }
    };

    fetchCounts();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [categories]);

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
