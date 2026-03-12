export type CourseCategory = {
  id: string;
  name: string;
  icon: string;
};

export const COURSE_CATEGORIES: CourseCategory[] = [
  { id: '1', name: 'Web Development', icon: '💻' },
  { id: '2', name: 'Data Science', icon: '📊' },
  { id: '3', name: 'Mobile Development', icon: '📱' },
  { id: '4', name: 'UI/UX Design', icon: '🎨' },
  { id: '5', name: 'Business', icon: '💼' },
  { id: '6', name: 'Languages', icon: '🌍' },
];

export const CATEGORY_NAME_TO_ID = new Map(
  COURSE_CATEGORIES.map((category) => [category.name, category.id])
);