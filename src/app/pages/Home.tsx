"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { CourseCard } from '@/app/components/CourseCard';
import { Card, CardContent } from '@/app/components/ui/card';
import { BookOpen, Users, Award } from 'lucide-react';
import { COURSE_CATEGORIES } from '@/lib/courseCategories';

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
};

export function Home() {
  const [featuredCourses, setFeaturedCourses] = useState<CourseItem[]>([]);
  const [categories, setCategories] = useState(COURSE_CATEGORIES);
  const [stats, setStats] = useState({
    activeLearners: 0,
    freeCourses: 0,
    certificatesIssued: 0,
  });

  const formatStat = (value: number) => new Intl.NumberFormat('en-US').format(value);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const fetchCourses = async () => {
      try {
        const res = await fetch('/api/courses', { signal: controller.signal });
        if (!res.ok) {
          if (mounted) setFeaturedCourses([]);
          return;
        }
        const data = await res.json();
        const items = Array.isArray(data?.items) ? data.items : [];
        if (mounted) setFeaturedCourses(items.slice(0, 3));
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        if (mounted) setFeaturedCourses([]);
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

    fetch('/api/stats')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!mounted || !data) return;
        setStats({
          activeLearners: Number(data.activeLearners) || 0,
          freeCourses: Number(data.freeCourses) || 0,
          certificatesIssued: Number(data.certificatesIssued) || 0,
        });
      })
      .catch(() => {
        if (!mounted) return;
        setStats({ activeLearners: 0, freeCourses: 0, certificatesIssued: 0 });
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#1E3A8A] via-[#1D4ED8] to-[#2563EB] text-white py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-[#F59E0B]/30 blur-3xl" />
          <div className="absolute bottom-[-120px] left-[-40px] h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.2),_transparent_60%)]" />
        </div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl">
            <span className="inline-flex items-center rounded-full bg-white/15 px-4 py-1 text-sm uppercase tracking-[0.2em]">
              Learn anywhere
            </span>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 mt-6">
              Learn Without Limits,<br />
              Grow Without Barriers
            </h1>
            <p className="text-xl mb-8 text-white/90">
              Join AlinHub, a charity-based learning platform offering free, high-quality education for everyone.
              Learn new skills, advance your career, and achieve your goals.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/courses">
                <Button className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white text-lg px-8 py-6">
                  Explore Courses
                </Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button variant="outline" className="border-white/60 bg-white/10 text-white hover:bg-white/20 text-lg px-8 py-6">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <Users className="w-12 h-12 text-[#F59E0B]" />
              </div>
              <h3 className="text-3xl font-bold text-[#1E3A8A] mb-2">{formatStat(stats.activeLearners)}</h3>
              <p className="text-gray-600">Active Learners</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <BookOpen className="w-12 h-12 text-[#F59E0B]" />
              </div>
              <h3 className="text-3xl font-bold text-[#1E3A8A] mb-2">{formatStat(stats.freeCourses)}</h3>
              <p className="text-gray-600">Free Courses</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <Award className="w-12 h-12 text-[#F59E0B]" />
              </div>
              <h3 className="text-3xl font-bold text-[#1E3A8A] mb-2">{formatStat(stats.certificatesIssued)}</h3>
              <p className="text-gray-600">Certificates Issued</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-12">
            <h2 className="text-3xl font-bold text-center md:text-left text-gray-900">Explore by Category</h2>
            <Link href="/categories">
              <Button variant="outline" className="border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white">
                View All Categories
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link key={category.id} href={`/courses?category=${category.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-white border-2 hover:border-[#F59E0B]">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-3">{category.icon}</div>
                    <h3 className="font-semibold text-sm text-gray-900">{category.name}</h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Featured Courses</h2>
            <Link href="/courses">
              <Button variant="outline" className="border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white">
                View All Courses
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCourses.map((course) => (
              <CourseCard key={course.id} {...course} isEnrolled={false} />
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
          <p className="text-xl max-w-3xl mx-auto mb-8">
            AlinHub is a non-profit educational platform committed to providing free, high-quality learning
            resources to students worldwide. We believe education is a fundamental right, not a privilege.
          </p>
          <div className="flex justify-center gap-6">
            <div className="text-center">
              <p className="text-4xl font-bold mb-2">100%</p>
              <p className="text-gray-200">Free Courses</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold mb-2">0$</p>
              <p className="text-gray-200">Hidden Fees</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold mb-2">∞</p>
              <p className="text-gray-200">Learning Opportunities</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="relative overflow-hidden bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-white">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_left,_rgba(255,255,255,0.35),_transparent_60%)]" />
            <CardContent className="relative p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
              <p className="text-xl mb-8">Join thousands of learners on AlinHub today. It's completely free!</p>
              <Link href="/auth/sign-up">
                <Button className="bg-white text-[#F59E0B] hover:bg-gray-100 text-lg px-8 py-6">
                  Sign Up Now
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
