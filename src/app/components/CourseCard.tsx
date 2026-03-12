"use client";

import { useAuth } from '@/app/components/AuthContext';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardFooter } from '@/app/components/ui/card';
import { CheckCircle, Clock, Star, Users } from 'lucide-react';
import Link from 'next/link';

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  instructor: {
    name: string;
    avatar: string;
  };
  rating: number;
  reviewCount: number;
  students: number;
  level: string;
  duration: string;
  image?: string;
  isEnrolled?: boolean;
  enrollmentDate?: string;
  userProgress?: number;
}

export function CourseCard({
  id,
  title,
  description,
  category,
  instructor,
  rating,
  reviewCount,
  students,
  level,
  duration,
  image,
  isEnrolled = false,
  enrollmentDate,
  userProgress = 0,
}: CourseCardProps) {
  const { isSignedIn } = useAuth();
  const enrolled = isEnrolled;
  const hasImage = Boolean(image && image.trim());

  // FIXED: Determine button text based on enrollment and progress
  const getButtonText = () => {
    if (!isSignedIn) {
      return 'View Course'; // Always "View Course" for non-signed in users
    }
    
    // Signed in but not enrolled
    if (!enrolled) {
      return 'View Course';
    }
    
    // Signed in AND enrolled
    if (userProgress === 100) {
      return 'Learned';
    } else if (userProgress > 0) {
      return 'Continue Learning';
    } else {
      return 'Start Learning';
    }
  };

  // FIXED: Determine button color - F59E0B for default view, 1E3A8A for enrolled students
  const getButtonColor = () => {
    // Non-signed in users OR signed-in but not enrolled
    if (!isSignedIn || !enrolled) {
      return 'bg-[#F59E0B] hover:bg-[#F59E0B]/90';
    }
    
    // Signed in AND enrolled (must be a student)
    return 'bg-[#1E3A8A] hover:bg-[#1E3A8A]/90';
  };

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300 bg-white relative">
      {/* Enrollment Badge */}
      {enrolled && (
        <div className="absolute top-3 left-3 z-10">
          <Badge className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Enrolled
          </Badge>
        </div>
      )}

      {/* Progress Bar for enrolled courses */}
      {enrolled && userProgress > 0 && (
        <div className="absolute top-12 left-3 right-3 z-10">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full" 
              style={{ width: `${userProgress}%` }}
            ></div>
          </div>
          <span className="text-xs text-white bg-black/70 px-2 py-1 rounded mt-1 inline-block">
            {userProgress}% Complete
          </span>
        </div>
      )}

      <div className="relative h-48 overflow-hidden">
        {hasImage ? (
          <img src={image} alt={title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-100 text-sm text-gray-500">
            No image
          </div>
        )}
        <Badge className="absolute top-3 right-3 bg-[#1E3A8A] text-white">{category}</Badge>
      </div>

      <CardContent className="p-5">
        <h3 className="text-xl font-semibold mb-2 line-clamp-2 text-gray-900">{title}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{description}</p>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">{instructor.avatar}</span>
          <span className="text-sm text-gray-700">{instructor.name}</span>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" />
            <span className="font-medium">{rating.toFixed(1)}</span>
            <span>({reviewCount})</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{students}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{duration}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">{level}</Badge>
          {enrolled && (
            <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 border-green-200">
              {userProgress === 100 ? 'Completed' : 'In Progress'}
            </Badge>
          )}
        </div>
        
        {enrollmentDate && (
          <div className="mt-2 text-xs text-gray-500">
            Enrolled on: {enrollmentDate}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-5 pt-0">
        <Link href={`/courses/${id}`} className="w-full">
          <Button className={`w-full ${getButtonColor()} text-white`}>
            {getButtonText()}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}