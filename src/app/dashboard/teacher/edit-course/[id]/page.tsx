import { EditCourse } from '@/app/pages/EditCourse';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditCourse id={id} />;
}
