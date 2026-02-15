import { CourseDetails } from '@/app/pages/CourseDetails';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CourseDetails id={id} />;
}
