import Link from 'next/link';
import { Star, Users, Clock } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';

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
  image: string;
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
}: CourseCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300 bg-white">
      <div className="relative h-48 overflow-hidden">
        <img src={image} alt={title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
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

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">{level}</Badge>
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0">
        <Link href={`/courses/${id}`} className="w-full">
          <Button className="w-full bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white">
            View Course
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
