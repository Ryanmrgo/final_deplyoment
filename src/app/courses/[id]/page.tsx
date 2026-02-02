import { CourseDetails } from '@/app/pages/CourseDetails';

export default function Page({ params }: { params: { id: string } }) {
  return <CourseDetails id={params.id} />;
}
