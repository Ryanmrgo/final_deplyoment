"use client";

import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { CourseCard } from '@/app/components/CourseCard';
import { Card, CardContent } from '@/app/components/ui/card';
import { BookOpen, Users, Award, Globe } from 'lucide-react';
import { categories } from '@/app/data/mockData';
import { useCourses } from '@/app/components/CoursesContext';

export function Home() {
  const { publicCourses } = useCourses();
  const featuredCourses = publicCourses.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold mb-6">
              Learn Without Limits, <br />
              Grow Without Barriers
            </h1>
            <p className="text-xl mb-8 text-gray-100">
              Join AlinHub, a charity-based learning platform offering free, high-quality education for everyone.
              Learn new skills, advance your career, and achieve your goals.
            </p>
            <div className="flex gap-4">
              <Link href="/courses">
                <Button className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white text-lg px-8 py-6">
                  Explore Courses
                </Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button variant="outline" className="bg-white text-[#1E3A8A] hover:bg-gray-100 text-lg px-8 py-6">
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <Users className="w-12 h-12 text-[#F59E0B]" />
              </div>
              <h3 className="text-3xl font-bold text-[#1E3A8A] mb-2">5,420+</h3>
              <p className="text-gray-600">Active Learners</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <BookOpen className="w-12 h-12 text-[#F59E0B]" />
              </div>
              <h3 className="text-3xl font-bold text-[#1E3A8A] mb-2">127</h3>
              <p className="text-gray-600">Free Courses</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <Award className="w-12 h-12 text-[#F59E0B]" />
              </div>
              <h3 className="text-3xl font-bold text-[#1E3A8A] mb-2">2,340</h3>
              <p className="text-gray-600">Certificates Issued</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <Globe className="w-12 h-12 text-[#F59E0B]" />
              </div>
              <h3 className="text-3xl font-bold text-[#1E3A8A] mb-2">45+</h3>
              <p className="text-gray-600">Countries Reached</p>
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
              <CourseCard key={course.id} {...course} />
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
          <Card className="bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-white">
            <CardContent className="p-12 text-center">
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
